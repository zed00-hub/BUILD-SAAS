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
    setDoc,
    onSnapshot
} from 'firebase/firestore';
import { db } from '../firebase'; // تأكد أن ملف firebase exports db
import { UserData, WalletTransaction, TransactionType } from '../types/dbTypes';

const USERS_COLLECTION = 'users';
const TRANSACTIONS_COLLECTION = 'transactions';

// Limits Configuration
export const LIMITS = {
    trial: { maxDaily: 2, cooldownMin: 0 },
    basic: { maxDaily: 20, cooldownMin: 30 },
    pro: { maxDaily: 30, cooldownMin: 15 }, // Distributed usage
    elite: { maxDaily: 9999, cooldownMin: 0 }
};

export const WalletService = {
    /**
     * تهيئة محفظة المستخدم الجديد (تعطى رصيد افتراضي)
     */
    async initializeUserWallet(uid: string, email: string, displayName?: string, photoURL?: string) {
        const userRef = doc(db, USERS_COLLECTION, uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            const isAdmin = email.toLowerCase() === 'ziadgaid001@gmail.com';
            // Trial gets 0 points by default logic, Admin manual add required
            const initialBalance = isAdmin ? 5000 : 0;

            const userData: UserData = {
                uid,
                email,
                displayName,
                photoURL,
                balance: initialBalance,
                isDisabled: false,
                isAdmin,
                accountType: isAdmin ? 'paid' : 'trial',
                planType: isAdmin ? 'elite' : null, // Admin gets Elite
                createdAt: Timestamp.now(),

                // Initialize usage tracking
                dailyUsageCount: 0,
                lastResetDate: new Date().toISOString().split('T')[0]
            };
            await setDoc(userRef, userData);

            if (initialBalance > 0) {
                await addDoc(collection(db, TRANSACTIONS_COLLECTION), {
                    userId: uid,
                    amount: initialBalance,
                    type: 'credit',
                    description: 'Welcome Bonus',
                    createdAt: serverTimestamp()
                });
            }
        } else {
            // Retroactive Check
            if (email.toLowerCase() === 'ziadgaid001@gmail.com') {
                const data = userSnap.data();
                if (!data.isAdmin) {
                    await setDoc(userRef, { isAdmin: true, planType: 'elite' }, { merge: true });
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
     * includesUsageCount: عدد الصور/المحاولات في هذا الطلب (لحساب الحد اليومي)
     */
    async deductPoints(uid: string, amount: number, description: string, orderId?: string, usageDelta: number = 1): Promise<boolean> {
        try {
            await runTransaction(db, async (transaction) => {
                const userRef = doc(db, USERS_COLLECTION, uid);
                const userDoc = await transaction.get(userRef);

                if (!userDoc.exists()) {
                    throw new Error("User does not exist!");
                }

                const userData = userDoc.data() as UserData;
                const currentBalance = userData.balance;

                // 1. Check Balance
                if (currentBalance < amount) {
                    throw new Error("INSUFFICIENT_FUNDS");
                }

                // 2. Check Plan Limits
                const plan = userData.planType || 'trial'; // if paid but no planType set, assuming basic? no, let's treat 'paid' without plan as 'basic' or fallback. 
                // Actually trial users have accountType='trial'. Paid have 'paid'.
                // Let's determine the key for LIMITS
                let limitKey: 'trial' | 'basic' | 'pro' | 'elite' = 'trial';

                if (userData.accountType === 'paid') {
                    if (userData.planType === 'pro') limitKey = 'pro';
                    else if (userData.planType === 'elite') limitKey = 'elite';
                    else limitKey = 'basic'; // Default paid is basic
                } else {
                    limitKey = 'trial';
                }

                const limits = LIMITS[limitKey];

                // Date Check for Reset
                const today = new Date().toISOString().split('T')[0];
                let currentDailyCount = userData.dailyUsageCount || 0;

                if (userData.lastResetDate !== today) {
                    currentDailyCount = 0; // New day, reset count
                }

                // A. Check Max Daily
                if (currentDailyCount + usageDelta > limits.maxDaily) {
                    throw new Error(`DAILY_LIMIT_EXCEEDED: You have reached your daily limit of ${limits.maxDaily} generations.`);
                }

                // B. Check Cooldown (Only if usageDelta > 0 meaning it's a generation request)
                if (usageDelta > 0 && limits.cooldownMin > 0 && userData.lastUsageTime) {
                    const lastTime = userData.lastUsageTime.toDate().getTime();
                    const now = Date.now();
                    const diffMinutes = (now - lastTime) / (1000 * 60);

                    if (diffMinutes < limits.cooldownMin) {
                        const waitTime = Math.ceil(limits.cooldownMin - diffMinutes);
                        throw new Error(`COOLDOWN_ACTIVE: Please wait ${waitTime} minutes before next generation.`);
                    }
                }

                const newBalance = currentBalance - amount;

                // 3. Update User (Balance + Usage Stats)
                transaction.update(userRef, {
                    balance: newBalance,
                    dailyUsageCount: currentDailyCount + usageDelta,
                    lastResetDate: today,
                    lastUsageTime: serverTimestamp()
                });

                // 4. Add Transaction Record
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

            return true;

        } catch (e: any) {
            if (e.message === "INSUFFICIENT_FUNDS") {
                console.warn("Insufficient funds for user:", uid);
                throw e; // Let UI handle it
            }
            if (e.message.startsWith("DAILY_LIMIT") || e.message.startsWith("COOLDOWN")) {
                console.warn(e.message);
                throw e; // Let UI handle it to show message
            }
            console.error("Transaction failed: ", e);
            throw e;
        }
    },

    /**
     * استرجاع النقاط (Refund)
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

                // Note: Refunds do not revert the 'dailyUsageCount' to avoid exploiting limits, 
                // but if fairness is strictly required, we could decrement it. 
                // For now, we keep the usage count as is (attempt consumed).

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
    },

    /**
     * الاشتراك في تحديثات المحفظة لحظياً
     */
    subscribeToWallet(uid: string, callback: (balance: number) => void) {
        const userRef = doc(db, USERS_COLLECTION, uid);
        return onSnapshot(userRef, (doc) => {
            if (doc.exists()) {
                const data = doc.data();
                callback(data.balance || 0);
            }
        });
    }
};
