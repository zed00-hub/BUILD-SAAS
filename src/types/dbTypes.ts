import { Timestamp } from 'firebase/firestore';

export type TransactionType = 'credit' | 'debit' | 'refund';
export type OrderStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

export interface UserData {
    uid: string;
    email: string;
    displayName?: string;
    photoURL?: string;
    balance: number; // الرصيد الحالي
    isDisabled: boolean; // لحظر المستخدم من قبل الادمن
    createdAt: Timestamp;
    lastLogin?: Timestamp;
}

export interface WalletTransaction {
    id: string;
    userId: string;
    amount: number;
    type: TransactionType;
    description: string; // سبب العملية (مثلا: "شراء رصيد"، "توليد صورة")
    relatedOrderId?: string; // لربط العملية بطلب معين
    createdAt: Timestamp;
}

export interface Order {
    id: string;
    userId: string;
    toolType: 'social-media' | 'ad-creative' | 'landing-page';
    status: OrderStatus;
    inputData: any; // المدخلات التي أدخلها المستخدم
    outputData?: any; // النتيجة (صور، نصوص، كود)
    cost: number; // تكلفة هذا الطلب
    errorMessage?: string; // في حال الفشل
    createdAt: Timestamp;
    updatedAt: Timestamp;
}
