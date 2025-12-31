import {
    collection,
    getDocs,
    doc,
    updateDoc,
    query,
    orderBy,
    runTransaction,
    serverTimestamp,
    where
} from 'firebase/firestore';
import { db } from '../firebase';
import { UserData, Order, WalletTransaction } from '../types/dbTypes';

const USERS_COLLECTION = 'users';
const ORDERS_COLLECTION = 'orders';
const TRANSACTIONS_COLLECTION = 'transactions';

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
     * تعديل رصيد مستخدم (هدية أو تصحيح)
     */
    async adjustUserBalance(userId: string, amountToAdd: number, description: string): Promise<boolean> {
        try {
            await runTransaction(db, async (transaction) => {
                const userRef = doc(db, USERS_COLLECTION, userId);
                const userDoc = await transaction.get(userRef);

                if (!userDoc.exists()) throw new Error("User not found");

                const currentBalance = userDoc.data().balance || 0;
                const newBalance = currentBalance + amountToAdd;

                // 1. Update Balance
                transaction.update(userRef, { balance: newBalance });

                // 2. Add Transaction Record
                const newTxRef = doc(collection(db, TRANSACTIONS_COLLECTION));
                transaction.set(newTxRef, {
                    userId,
                    amount: Math.abs(amountToAdd),
                    type: amountToAdd >= 0 ? 'credit' : 'debit',
                    description: description + ' (Admin Adjustment)',
                    createdAt: serverTimestamp()
                });
            });
            return true;
        } catch (error) {
            console.error("Error adjusting balance:", error);
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
