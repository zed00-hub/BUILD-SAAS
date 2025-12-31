import {
    collection,
    addDoc,
    doc,
    updateDoc,
    serverTimestamp,
    getDocs,
    query,
    where,
    orderBy,
    getDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import { Order, OrderStatus } from '../types/dbTypes';

const ORDERS_COLLECTION = 'orders';

export const OrderService = {
    /**
     * إنشاء طلب جديد
     */
    async createOrder(userId: string, toolType: Order['toolType'], inputData: any, cost: number): Promise<string> {
        const orderData = {
            userId,
            toolType,
            status: 'pending' as OrderStatus,
            inputData,
            cost,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };

        const docRef = await addDoc(collection(db, ORDERS_COLLECTION), orderData);
        return docRef.id;
    },

    /**
     * تحديث حالة الطلب
     */
    async updateOrderStatus(orderId: string, status: OrderStatus, outputData?: any, errorMessage?: string) {
        const orderRef = doc(db, ORDERS_COLLECTION, orderId);

        const updateData: any = {
            status,
            updatedAt: serverTimestamp()
        };

        if (outputData) updateData.outputData = outputData;
        if (errorMessage) updateData.errorMessage = errorMessage;

        await updateDoc(orderRef, updateData);
    },

    /**
     * جلب طلبات مستخدم معين
     */
    async getUserOrders(userId: string) {
        const q = query(
            collection(db, ORDERS_COLLECTION),
            where("userId", "==", userId),
            orderBy("createdAt", "desc")
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
    },

    /**
     * جلب تفاصيل طلب واحد
     */
    async getOrderById(orderId: string): Promise<Order | null> {
        const docRef = doc(db, ORDERS_COLLECTION, orderId);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
            return { id: snap.id, ...snap.data() } as Order;
        }
        return null;
    }
};
