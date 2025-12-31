import {
    doc,
    getDoc,
    collection,
    addDoc,
    query,
    where,
    orderBy,
    getDocs,
    runTransaction,
    serverTimestamp,
    Timestamp,
    setDoc
} from 'firebase/firestore';
import { db } from '../firebase'; // تأكد أن ملف firebase exports db
import { UserData, WalletTransaction, TransactionType } from '../types/dbTypes';

const USERS_COLLECTION = 'users';
const TRANSACTIONS_COLLECTION = 'transactions';

export const WalletService = {
    /**
     * تهيئة محفظة المستخدم الجديد (تعطى رصيد افتراضي)
     */
    async initializeUserWallet(uid: string, email: string, displayName?: string, photoURL?: string) {
        const userRef = doc(db, USERS_COLLECTION, uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            const isAdmin = email.toLowerCase() === 'ziadgaid001@gmail.com';
            const initialBalance = isAdmin ? 5000 : 0;

            const userData: UserData = {
                uid,
                email,
                displayName,
                photoURL,
                balance: initialBalance,
                isDisabled: false,
                isAdmin,
                createdAt: Timestamp.now()
            };
            await setDoc(userRef, userData);

            if (initialBalance > 0) {
                await addDoc(collection(db, TRANSACTIONS_COLLECTION), {
                    userId: uid,
                    amount: initialBalance,
                    type: 'credit',
                    description: 'Welcome Bonus (Admin)',
                    createdAt: serverTimestamp()
                });
            }
        } else {
            // Retroactive Check
            if (email.toLowerCase() === 'ziadgaid001@gmail.com') {
                const data = userSnap.data();
                if (!data.isAdmin) {
                    await setDoc(userRef, { isAdmin: true }, { merge: true });
                }
            }
        }
    },

    /**
     * الحصول على رصيد المستخدم الحالي
     */
    async getUserBalance(uid: string): Promise<number> {
        const userRef = doc(db, USERS_COLLECTION, uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
            return userSnap.data().balance as number;
        }
        return 0;
    },

    /**
     * جلب بيانات الملف الشخصي (بما في ذلك حالة الآدمن)
     */
    async getUserProfile(uid: string): Promise<UserData | null> {
        const userRef = doc(db, USERS_COLLECTION, uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
            return userSnap.data() as UserData;
        }
        return null;
    },

    /**
     * خصم رصيد مقابل خدمة (عملية آمنة باستخدام Transaction)
     */
    async deductPoints(uid: string, amount: number, description: string, orderId?: string): Promise<boolean> {
        try {
            await runTransaction(db, async (transaction) => {
                const userRef = doc(db, USERS_COLLECTION, uid);
                const userDoc = await transaction.get(userRef);

                if (!userDoc.exists()) {
                    throw new Error("User does not exist!");
                }

                const currentBalance = userDoc.data().balance;
                if (currentBalance < amount) {
                    // سنرمي خطأ مخصص للتعامل معه في الواجهة
                    throw new Error("INSUFFICIENT_FUNDS");
                }

                const newBalance = currentBalance - amount;

                // 1. تحديث رصيد المستخدم
                transaction.update(userRef, { balance: newBalance });

                // 2. إضافة سجل المعاملة
                const newTransactionRef = doc(collection(db, TRANSACTIONS_COLLECTION));
                transaction.set(newTransactionRef, {
                    userId: uid,
                    amount: amount,
                    type: 'debit',
                    description: description,
                    relatedOrderId: orderId || null,
                    createdAt: serverTimestamp()
                });
            });

            return true; // تمت العملية بنجاح

        } catch (e: any) {
            if (e.message === "INSUFFICIENT_FUNDS") {
                console.warn("Insufficient funds for user:", uid);
                return false;
            }
            console.error("Transaction failed: ", e);
            throw e;
        }
    },

    /**
     * استرجاع النقاط (Refund) في حالة فشل الطلب
     */
    async refundPoints(uid: string, amount: number, description: string, orderId?: string) {
        try {
            await runTransaction(db, async (transaction) => {
                const userRef = doc(db, USERS_COLLECTION, uid);
                const userDoc = await transaction.get(userRef);

                if (!userDoc.exists()) {
                    throw new Error("User does not exist!");
                }

                const newBalance = (userDoc.data().balance || 0) + amount;

                transaction.update(userRef, { balance: newBalance });

                const newTransactionRef = doc(collection(db, TRANSACTIONS_COLLECTION));
                transaction.set(newTransactionRef, {
                    userId: uid,
                    amount: amount,
                    type: 'refund',
                    description: description,
                    relatedOrderId: orderId || null,
                    createdAt: serverTimestamp()
                });
            });
            return true;
        } catch (e) {
            console.error("Refund failed:", e);
            return false;
        }
    },

    /**
     * جلب سجل المعاملات للمستخدم
     */
    async getTransactionHistory(uid: string) {
        const q = query(
            collection(db, TRANSACTIONS_COLLECTION),
            where("userId", "==", uid),
            orderBy("createdAt", "desc")
        );

        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WalletTransaction));
    }
};
