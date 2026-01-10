import { Timestamp } from 'firebase/firestore';

export type TransactionType = 'credit' | 'debit' | 'refund';
export type OrderStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

// Account Types
export type AccountType = 'trial' | 'paid';
export type PlanType = 'basic' | 'pro' | 'elite' | null;

export interface UserData {
    uid: string;
    email: string;
    displayName?: string;
    photoURL?: string;
    balance: number; // الرصيد الحالي
    isDisabled: boolean; // لحظر المستخدم من قبل الادمن
    isAdmin?: boolean;

    // Account & Plan Info
    accountType: AccountType; // نوع الحساب: تجريبي أو مدفوع
    planType?: PlanType; // الخطة: basic, pro, elite (للمدفوع فقط)
    planStartDate?: Timestamp; // تاريخ بدء الخطة
    planEndDate?: Timestamp; // تاريخ انتهاء الخطة

    // Usage Tracking (Rate Limiting)
    lastUsageTime?: Timestamp; // وقت آخر عملية توليد (لحساب فترة الانتظار)
    dailyUsageCount?: number; // عدد العمليات/الصور المولدة اليوم
    lastResetDate?: string; // تاريخ آخر تصفير للعداد (YYYY-MM-DD)

    createdAt: Timestamp;
    lastLogin?: Timestamp;

    // Brand Kit / Defaults
    brandKit?: {
        logo?: string;
        styleImage?: string;
    };
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
