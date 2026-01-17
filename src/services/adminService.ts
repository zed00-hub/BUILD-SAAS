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
    where,
    setDoc,
    deleteDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import { UserData, Order, WalletTransaction, AccountType, PlanType } from '../types/dbTypes';
import { ToolLock } from '../../types';

const USERS_COLLECTION = 'users';
const ORDERS_COLLECTION = 'orders';
const TRANSACTIONS_COLLECTION = 'transactions';

// Plan configurations with points (matching website pricing)
export const PLAN_CONFIGS = {
    basic: { name: 'Basic', points: 300, price: 7.99, durationDays: 30 },
    'e-commerce': { name: 'E-COM STARTER', points: 500, price: 14.99, durationDays: 30 },
    pro: { name: 'Pro', points: 1290, price: 30.99, durationDays: 30 },
    elite: { name: 'Elite', points: 5000, price: 0, durationDays: 30 } // Custom pricing - contact sales
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
    async upgradeToPaidPlan(userId: string, planType: 'basic' | 'pro' | 'elite' | 'e-commerce', description: string): Promise<boolean> {
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
    },

    // --- Tool Management (Locks) ---

    async getToolLocks(): Promise<ToolLock[]> {
        const snapshot = await getDocs(collection(db, 'tool_locks'));
        // toolId is stored as document ID, but also inside data for easier usage
        return snapshot.docs.map(doc => ({ ...doc.data() as ToolLock, toolId: doc.id }));
    },

    async setToolLock(lock: ToolLock): Promise<void> {
        // Use setDoc to create/overwrite document with ID = toolId
        await setDoc(doc(db, 'tool_locks', lock.toolId), lock);
    },

    async removeToolLock(toolId: string): Promise<void> {
        await deleteDoc(doc(db, 'tool_locks', toolId));
    }
};
