import { db } from '../firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';

export interface PlanFeature {
    count: string;
    label: string;
}

export interface PricingPlan {
    id: string;
    name: string;
    basePoints: number | string;
    prices: {
        DZD: number | null;
        USD: number | null;
    };
    description: string;
    features: PlanFeature[];
    isPopular: boolean;
    gradient: string;
    buttonVariant: 'primary' | 'secondary' | 'outline';
    order: number;
    isActive: boolean;
    isCustomPricing: boolean; // For Elite-like plans
    contactEmail?: string;
}

export interface PricingConfig {
    plans: PricingPlan[];
    yearlyDiscount: number; // Percentage discount for yearly billing
    showYearlyToggle: boolean;
    showCurrencyToggle: boolean;
    defaultCurrency: 'DZD' | 'USD';
    footerText: string;
    updatedAt?: Date;
}

// Default configuration matching existing PricingModal
export const DEFAULT_PRICING_CONFIG: PricingConfig = {
    plans: [
        {
            id: 'basic',
            name: 'BASIC',
            basePoints: 300,
            prices: { DZD: 1500, USD: 7.99 },
            description: 'Perfect for testing the waters and small campaigns.',
            features: [
                { count: '10', label: 'Social Media Posts' },
                { count: '10', label: 'Landing Page Designs' },
                { count: '15', label: 'Ad Creatives' },
            ],
            isPopular: false,
            gradient: 'from-slate-200 to-slate-300',
            buttonVariant: 'outline',
            order: 1,
            isActive: true,
            isCustomPricing: false,
        },
        {
            id: 'pro',
            name: 'PRO',
            basePoints: 1290,
            prices: { DZD: 5990, USD: 30.99 },
            description: 'Best value for active marketers and dropshippers.',
            features: [
                { count: '43', label: 'Social Media Posts' },
                { count: '43', label: 'Landing Page Designs' },
                { count: '64', label: 'Ad Creatives' },
            ],
            isPopular: true,
            gradient: 'from-indigo-500 to-purple-600',
            buttonVariant: 'primary',
            order: 2,
            isActive: true,
            isCustomPricing: false,
        },
        {
            id: 'elite',
            name: 'ELITE',
            basePoints: 'Custom',
            prices: { DZD: null, USD: null },
            description: 'For agencies requiring bulk generation and API access.',
            features: [
                { count: '∞', label: 'Custom Points' },
                { count: '✓', label: 'Dedicated Support' },
                { count: '✓', label: 'API Access' },
            ],
            isPopular: false,
            gradient: 'from-slate-800 to-black',
            buttonVariant: 'secondary',
            order: 3,
            isActive: true,
            isCustomPricing: true,
            contactEmail: 'sales@creakits.com',
        },
    ],
    yearlyDiscount: 17,
    showYearlyToggle: true,
    showCurrencyToggle: true,
    defaultCurrency: 'DZD',
    footerText: 'Secure payment via CIB, Eddahabia, or PayPal.',
};

const PRICING_DOC_ID = 'pricingConfig';

export class PricingService {
    /**
     * Get pricing configuration from Firestore
     * Falls back to default config if not found
     */
    static async getPricingConfig(): Promise<PricingConfig> {
        try {
            const docRef = doc(db, 'settings', PRICING_DOC_ID);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                return docSnap.data() as PricingConfig;
            }

            // If no config exists, save and return default
            await this.savePricingConfig(DEFAULT_PRICING_CONFIG);
            return DEFAULT_PRICING_CONFIG;
        } catch (error) {
            console.error('Error fetching pricing config:', error);
            return DEFAULT_PRICING_CONFIG;
        }
    }

    /**
     * Save pricing configuration to Firestore
     */
    static async savePricingConfig(config: PricingConfig): Promise<boolean> {
        try {
            const docRef = doc(db, 'settings', PRICING_DOC_ID);
            await setDoc(docRef, {
                ...config,
                updatedAt: new Date(),
            });
            return true;
        } catch (error) {
            console.error('Error saving pricing config:', error);
            return false;
        }
    }

    /**
     * Subscribe to pricing config changes (for real-time updates)
     */
    static subscribeToPricingConfig(callback: (config: PricingConfig) => void): () => void {
        const docRef = doc(db, 'settings', PRICING_DOC_ID);

        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                callback(docSnap.data() as PricingConfig);
            } else {
                callback(DEFAULT_PRICING_CONFIG);
            }
        }, (error) => {
            console.error('Error subscribing to pricing config:', error);
            callback(DEFAULT_PRICING_CONFIG);
        });

        return unsubscribe;
    }

    /**
     * Add a new plan
     */
    static async addPlan(config: PricingConfig, newPlan: PricingPlan): Promise<PricingConfig> {
        const updatedConfig = {
            ...config,
            plans: [...config.plans, newPlan].sort((a, b) => a.order - b.order),
        };
        await this.savePricingConfig(updatedConfig);
        return updatedConfig;
    }

    /**
     * Update an existing plan
     */
    static async updatePlan(config: PricingConfig, planId: string, updates: Partial<PricingPlan>): Promise<PricingConfig> {
        const updatedConfig = {
            ...config,
            plans: config.plans.map(plan =>
                plan.id === planId ? { ...plan, ...updates } : plan
            ).sort((a, b) => a.order - b.order),
        };
        await this.savePricingConfig(updatedConfig);
        return updatedConfig;
    }

    /**
     * Delete a plan
     */
    static async deletePlan(config: PricingConfig, planId: string): Promise<PricingConfig> {
        const updatedConfig = {
            ...config,
            plans: config.plans.filter(plan => plan.id !== planId),
        };
        await this.savePricingConfig(updatedConfig);
        return updatedConfig;
    }

    /**
     * Reorder plans
     */
    static async reorderPlans(config: PricingConfig, planIds: string[]): Promise<PricingConfig> {
        const updatedPlans = planIds.map((id, idx) => {
            const plan = config.plans.find(p => p.id === id);
            return plan ? { ...plan, order: idx + 1 } : null;
        }).filter(Boolean) as PricingPlan[];

        const updatedConfig = {
            ...config,
            plans: updatedPlans,
        };
        await this.savePricingConfig(updatedConfig);
        return updatedConfig;
    }
}
