import {
    collection,
    getDocs,
    doc,
    updateDoc,
    query,
    orderBy,
    runTransaction,
    serverTimestamp,
    Timestamp,
    where
} from 'firebase/firestore';
import { db } from '../firebase';
import { UserData, Order, WalletTransaction, AccountType, PlanType } from '../types/dbTypes';

const USERS_COLLECTION = 'users';
const ORDERS_COLLECTION = 'orders';
const TRANSACTIONS_COLLECTION = 'transactions';

// Plan configurations with points
export const PLAN_CONFIGS = {
    starter: { name: 'Starter', points: 100, durationDays: 30 },
    pro: { name: 'Pro', points: 500, durationDays: 30 },
    enterprise: { name: 'Enterprise', points: 2000, durationDays: 30 }
};

export const AdminService = {
    /**
     * جلب جميع المستخدمين
     */
    async getAllUsers(): Promise<UserData[]> {
        const q = query(collection(db, USERS_COLLECTION), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ ...doc.data(), uid: doc.id } as UserData));
    },

    /**
     * جلب جميع الطلبات
     */
    async getAllOrders(): Promise<Order[]> {
        const q = query(collection(db, ORDERS_COLLECTION), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Order));
    },

    /**
     * تعديل رصيد مستخدم (تجريبي فقط - بدون تغيير نوع الحساب)
     */
    async adjustTrialBalance(userId: string, amountToAdd: number, description: string): Promise<boolean> {
        try {
            await runTransaction(db, async (transaction) => {
                const userRef = doc(db, USERS_COLLECTION, userId);
                const userDoc = await transaction.get(userRef);

                if (!userDoc.exists()) throw new Error("User not found");

                const currentBalance = userDoc.data().balance || 0;
                const newBalance = currentBalance + amountToAdd;

                // 1. Update Balance only (keep account as trial)
                transaction.update(userRef, { balance: newBalance });

                // 2. Add Transaction Record
                const newTxRef = doc(collection(db, TRANSACTIONS_COLLECTION));
                transaction.set(newTxRef, {
                    userId,
                    amount: Math.abs(amountToAdd),
                    type: amountToAdd >= 0 ? 'credit' : 'debit',
                    description: description + ' (Trial - Admin)',
                    createdAt: serverTimestamp()
                });
            });
            return true;
        } catch (error) {
            console.error("Error adjusting trial balance:", error);
            return false;
        }
    },

    /**
     * ترقية مستخدم إلى حساب مدفوع مع خطة محددة
     */
    async upgradeToPaidPlan(userId: string, planType: 'starter' | 'pro' | 'enterprise', description: string): Promise<boolean> {
        try {
            const planConfig = PLAN_CONFIGS[planType];
            const now = Timestamp.now();
            const endDate = Timestamp.fromDate(new Date(Date.now() + planConfig.durationDays * 24 * 60 * 60 * 1000));

            await runTransaction(db, async (transaction) => {
                const userRef = doc(db, USERS_COLLECTION, userId);
                const userDoc = await transaction.get(userRef);

                if (!userDoc.exists()) throw new Error("User not found");

                const currentBalance = userDoc.data().balance || 0;
                const newBalance = currentBalance + planConfig.points;

                // 1. Update user to paid plan
                transaction.update(userRef, {
                    balance: newBalance,
                    accountType: 'paid',
                    planType: planType,
                    planStartDate: now,
                    planEndDate: endDate
                });

                // 2. Add Transaction Record
                const newTxRef = doc(collection(db, TRANSACTIONS_COLLECTION));
                transaction.set(newTxRef, {
                    userId,
                    amount: planConfig.points,
                    type: 'credit',
                    description: `${planConfig.name} Plan Purchase - ${description} (Admin)`,
                    createdAt: serverTimestamp()
                });
            });
            return true;
        } catch (error) {
            console.error("Error upgrading to paid plan:", error);
            return false;
        }
    },

    /**
     * تحويل حساب مدفوع إلى تجريبي
     */
    async downgradeToTrial(userId: string): Promise<boolean> {
        try {
            const userRef = doc(db, USERS_COLLECTION, userId);
            await updateDoc(userRef, {
                accountType: 'trial',
                planType: null,
                planStartDate: null,
                planEndDate: null
            });
            return true;
        } catch (error) {
            console.error("Error downgrading to trial:", error);
            return false;
        }
    },

    /**
     * حظر/فك حظر مستخدم
     */
    async toggleUserStatus(userId: string, currentStatus: boolean): Promise<void> {
        const userRef = doc(db, USERS_COLLECTION, userId);
        await updateDoc(userRef, { isDisabled: !currentStatus });
    }
};
