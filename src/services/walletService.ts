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
    onSnapshot,
    updateDoc,
    deleteField
} from 'firebase/firestore';
import { db } from '../firebase'; // تأكد أن ملف firebase exports db
import { UserData, WalletTransaction, TransactionType } from '../types/dbTypes';

const USERS_COLLECTION = 'users';
const TRANSACTIONS_COLLECTION = 'transactions';

// Limits Configuration
// Limits Configuration Interface
export interface PlanLimits {
    maxDaily: number;
    cooldownMin: number;
}

export interface LimitsConfig {
    trial: PlanLimits;
    basic: PlanLimits;
    pro: PlanLimits;
    elite: PlanLimits;
    'e-commerce': PlanLimits;
}

// Default limits (fallback)
export const DEFAULT_LIMITS: LimitsConfig = {
    trial: { maxDaily: 2, cooldownMin: 0 },
    basic: { maxDaily: 20, cooldownMin: 30 },
    pro: { maxDaily: 30, cooldownMin: 15 },
    elite: { maxDaily: 9999, cooldownMin: 0 },
    'e-commerce': { maxDaily: 25, cooldownMin: 20 }
};

export const WalletService = {
    /**
     * Get global limits configuration
     */
    async getLimitsConfig(): Promise<LimitsConfig> {
        try {
            const docRef = doc(db, 'settings', 'limitsConfig');
            const snap = await getDoc(docRef);
            if (snap.exists()) {
                // Merge with defaults to ensure all keys exist
                return { ...DEFAULT_LIMITS, ...snap.data() } as LimitsConfig;
            }
            return DEFAULT_LIMITS;
        } catch (error) {
            console.error("Error fetching limits:", error);
            return DEFAULT_LIMITS;
        }
    },

    /**
     * Save global limits configuration
     */
    async saveLimitsConfig(config: LimitsConfig): Promise<boolean> {
        try {
            await setDoc(doc(db, 'settings', 'limitsConfig'), config);
            return true;
        } catch (error) {
            console.error("Error saving limits:", error);
            return false;
        }
    },

    /**
     * Set a custom limit for a specific user
     */
    async updateUserCustomLimit(uid: string, limit: number | null): Promise<boolean> {
        try {
            const userRef = doc(db, USERS_COLLECTION, uid);
            // If null, delete the field (revert to plan limit)
            if (limit === null) {
                await updateDoc(userRef, {
                    customDailyLimit: deleteField()
                } as any);
            } else {
                await updateDoc(userRef, { customDailyLimit: limit });
            }
            return true;
        } catch (error) {
            console.error("Error updating user limit:", error);
            return false;
        }
    },

    /**
     * Initialize User Wallet
     */
    async initializeUserWallet(uid: string, email: string, displayName?: string, photoURL?: string) {
        // ... (existing implementation) ...
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
                accountType: isAdmin ? 'paid' : 'trial',
                planType: isAdmin ? 'elite' : null,
                createdAt: Timestamp.now(),
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
        }
    },

    async getUserBalance(uid: string): Promise<number> {
        const userRef = doc(db, USERS_COLLECTION, uid);
        const userSnap = await getDoc(userRef);
        return userSnap.exists() ? (userSnap.data().balance as number) : 0;
    },

    async getUserProfile(uid: string): Promise<UserData | null> {
        const userRef = doc(db, USERS_COLLECTION, uid);
        const userSnap = await getDoc(userRef);
        return userSnap.exists() ? (userSnap.data() as UserData) : null;
    },

    async updateUserProfile(uid: string, data: Partial<UserData>): Promise<boolean> {
        try {
            const userRef = doc(db, USERS_COLLECTION, uid);
            await setDoc(userRef, data, { merge: true });
            return true;
        } catch (error) {
            console.error("Error updating profile:", error);
            return false;
        }
    },

    /**
     * Deduct points with Dynamic Limits Check
     */
    async deductPoints(uid: string, amount: number, description: string, orderId?: string, usageDelta: number = 1): Promise<boolean> {
        try {
            // Fetch Global Limits Config OUTSIDE transaction to avoid read overhead inside tx (optimistic)
            // Or ideally inside, but let's fetch first.
            let globalLimits = DEFAULT_LIMITS;
            try {
                const limitSnap = await getDoc(doc(db, 'settings', 'limitsConfig'));
                if (limitSnap.exists()) globalLimits = { ...DEFAULT_LIMITS, ...limitSnap.data() } as LimitsConfig;
            } catch (e) {
                console.warn("Using default limits due to fetch error");
            }

            await runTransaction(db, async (transaction) => {
                const userRef = doc(db, USERS_COLLECTION, uid);
                const userDoc = await transaction.get(userRef);

                if (!userDoc.exists()) throw new Error("User does not exist!");

                const userData = userDoc.data() as UserData;
                const currentBalance = userData.balance;

                // 1. Check Balance
                if (currentBalance < amount) throw new Error("INSUFFICIENT_FUNDS");

                // 2. Check Limits
                let maxDaily = 0;
                let cooldownMin = 0;

                // Priority 1: Custom User Limit
                if (userData.customDailyLimit !== undefined && userData.customDailyLimit !== null) {
                    maxDaily = userData.customDailyLimit;
                    cooldownMin = 0; // Usually custom limits don't have cooldown, or we could add customCooldown field later
                }
                // Priority 2: Global Plan Limit
                else {
                    let planKey: keyof LimitsConfig = 'trial';
                    if (userData.accountType === 'paid') {
                        if (userData.planType && globalLimits[userData.planType]) {
                            // Correctly map planType to limits key
                            planKey = userData.planType as keyof LimitsConfig;
                        } else {
                            planKey = 'basic'; // Default for paid
                        }
                    }
                    maxDaily = globalLimits[planKey]?.maxDaily ?? DEFAULT_LIMITS[planKey].maxDaily;
                    cooldownMin = globalLimits[planKey]?.cooldownMin ?? DEFAULT_LIMITS[planKey].cooldownMin;
                }

                // Date Check
                const today = new Date().toISOString().split('T')[0];
                let currentDailyCount = userData.dailyUsageCount || 0;
                if (userData.lastResetDate !== today) {
                    currentDailyCount = 0;
                }

                // A. Verify Max Daily
                if (currentDailyCount + usageDelta > maxDaily) {
                    throw new Error(`DAILY_LIMIT_EXCEEDED: You have reached your daily limit of ${maxDaily} generations.`);
                }

                // B. Verify Cooldown
                if (usageDelta > 0 && cooldownMin > 0 && userData.lastUsageTime) {
                    const lastTime = userData.lastUsageTime.toDate().getTime();
                    const now = Date.now();
                    const diffMinutes = (now - lastTime) / (1000 * 60);

                    if (diffMinutes < cooldownMin) {
                        const waitTime = Math.ceil(cooldownMin - diffMinutes);
                        throw new Error(`COOLDOWN_ACTIVE: Please wait ${waitTime} minutes before next generation.`);
                    }
                }

                const newBalance = currentBalance - amount;

                // 3. Update User
                transaction.update(userRef, {
                    balance: newBalance,
                    dailyUsageCount: currentDailyCount + usageDelta,
                    lastResetDate: today,
                    lastUsageTime: serverTimestamp()
                });

                // 4. Add Transaction
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
                throw e;
            }
            if (e.message.startsWith("DAILY_LIMIT") || e.message.startsWith("COOLDOWN")) {
                console.warn(e.message);
                throw e;
            }
            console.error("Transaction failed: ", e);
            throw e;
        }
    },

    async refundPoints(uid: string, amount: number, description: string, orderId?: string, usageRestoreCount: number = 1) {
        // ... (existing implementation) ...
        try {
            await runTransaction(db, async (transaction) => {
                const userRef = doc(db, USERS_COLLECTION, uid);
                const userDoc = await transaction.get(userRef);

                if (!userDoc.exists()) {
                    throw new Error("User does not exist!");
                }

                const newBalance = (userDoc.data().balance || 0) + amount;
                const currentDailyCount = userDoc.data().dailyUsageCount || 0;

                transaction.update(userRef, {
                    balance: newBalance,
                    dailyUsageCount: Math.max(0, currentDailyCount - usageRestoreCount)
                });

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

    async getTransactionHistory(uid: string) {
        const q = query(collection(db, TRANSACTIONS_COLLECTION), where("userId", "==", uid), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WalletTransaction));
    },

    subscribeToWallet(uid: string, callback: (balance: number) => void) {
        return onSnapshot(doc(db, USERS_COLLECTION, uid), (doc) => {
            if (doc.exists()) callback(doc.data().balance || 0);
        });
    }
};
