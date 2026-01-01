import React, { useState } from 'react';
import { CoinIcon } from './CoinIcon';
import { Button } from './Button';
import { useLanguage } from '../contexts/LanguageContext';

type Currency = 'DZD' | 'USD';
type BillingCycle = 'monthly' | 'yearly';

export const PricingSection: React.FC = () => {
    const [currency, setCurrency] = useState<Currency>('DZD');
    const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
    const { t, language } = useLanguage();
    const isRtl = language === 'ar';

    const isYearly = billingCycle === 'yearly';

    const plans = [
        {
            name: "BASIC",
            basePoints: 300,
            basePrice: { DZD: 1500, USD: 7.99 },
            description: t('plan_basic_desc'),
            features: [
                { count: "10", label: t('feat_social') },
                { count: "10", label: t('feat_landing') },
                { count: "15", label: t('feat_ads') },
            ],
            isPopular: false,
            gradient: "from-slate-200 to-slate-200",
            buttonVariant: "outline" as const
        },
        {
            name: "PRO",
            basePoints: 1290,
            basePrice: { DZD: 5990, USD: 30.99 },
            description: t('plan_pro_desc'),
            features: [
                { count: "43", label: t('feat_social') },
                { count: "43", label: t('feat_landing') },
                { count: "64", label: t('feat_ads') },
            ],
            isPopular: true,
            gradient: "from-indigo-500 to-purple-600",
            buttonVariant: "primary" as const
        },
        {
            name: "ELITE",
            basePoints: "Custom",
            basePrice: { DZD: null, USD: null },
            description: t('plan_elite_desc'),
            features: [
                { count: "∞", label: t('feat_custom') },
                { count: "✓", label: t('feat_support') },
            ],
            isPopular: false,
            gradient: "from-slate-800 to-black",
            buttonVariant: "secondary" as const
        }
    ];

    const formatPrice = (amount: number | null, curr: Currency) => {
        if (amount === null) return t('contact_sales');
        const finalAmount = isYearly ? amount * 10 : amount;

        const formatted = finalAmount.toLocaleString(undefined, { minimumFractionDigits: curr === 'USD' ? 2 : 0, maximumFractionDigits: curr === 'USD' ? 2 : 0 });

        return curr === 'DZD' ? `${formatted} DA` : `$${formatted}`;
    };

    const calculatePoints = (points: number | string) => {
        if (typeof points === 'string') return points;
        return isYearly ? points * 12 : points;
    };

    return (
        <section id="pricing-section" className="py-24 bg-white relative">
            <div className="max-w-7xl mx-auto px-6">

                {/* Header */}
                <div className="text-center mb-16">
                    <h2 className="text-3xl lg:text-4xl font-extrabold text-slate-900 mb-4">{t('pricing_title')}</h2>
                    <p className="text-lg text-slate-500 mb-8">{t('pricing_subtitle')}</p>

                    <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8">
                        {/* Currency Toggle */}
                        <div className="inline-flex items-center bg-slate-50 p-1 rounded-full border border-slate-200 shadow-sm relative h-10" dir="ltr">
                            <div
                                className={`absolute top-1 bottom-1 w-[50%] bg-indigo-600 rounded-full transition-all duration-300 ${currency === 'USD' ? 'left-[48%]' : 'left-1'}`}
                            ></div>
                            <button
                                onClick={() => setCurrency('DZD')}
                                className={`relative z-10 px-4 rounded-full text-xs font-bold transition-colors w-20 h-full flex items-center justify-center ${currency === 'DZD' ? 'text-white' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                DZD 🇩🇿
                            </button>
                            <button
                                onClick={() => setCurrency('USD')}
                                className={`relative z-10 px-4 rounded-full text-xs font-bold transition-colors w-20 h-full flex items-center justify-center ${currency === 'USD' ? 'text-white' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                USD 🇺🇸
                            </button>
                        </div>

                        {/* Billing Cycle Toggle */}
                        <div className="flex items-center bg-slate-200 p-1 rounded-full relative cursor-pointer select-none" onClick={() => setBillingCycle(isYearly ? 'monthly' : 'yearly')}>
                            <div className={`w-28 py-1.5 rounded-full text-center text-xs font-bold transition-all duration-300 z-10 ${!isYearly ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500'}`}>
                                {isRtl ? 'شهري' : 'Monthly'}
                            </div>
                            <div className={`w-28 py-1.5 rounded-full text-center text-xs font-bold transition-all duration-300 z-10 flex items-center justify-center gap-1 ${isYearly ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500'}`}>
                                {isRtl ? 'سنوي' : 'Yearly'}
                                <span className="bg-green-100 text-green-700 text-[10px] px-1.5 py-0.5 rounded-full whitespace-nowrap hidden md:inline-block">
                                    -17%
                                </span>
                            </div>
                        </div>
                        {isYearly && <span className="text-xs text-green-600 font-bold animate-pulse hidden md:block">{isRtl ? 'شهرين مجاناً! 🎉' : '2 Months FREE! 🎉'}</span>}
                    </div>
                </div>

                {/* Plans Grid */}
                <div className="grid md:grid-cols-3 gap-8">
                    {plans.map((plan, idx) => (
                        <div
                            key={idx}
                            className={`relative rounded-3xl p-8 border transition-all duration-300 flex flex-col hover:shadow-2xl
                                ${plan.isPopular ? 'border-indigo-500 shadow-xl scale-105 z-10 bg-white ring-4 ring-indigo-50' : 'border-slate-200 hover:border-slate-300 bg-slate-50'}
                                ${plan.name === 'ELITE' ? 'bg-slate-900 text-white border-slate-800' : ''}
                            `}
                        >
                            {plan.isPopular && (
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wide shadow-lg whitespace-nowrap">
                                    {t('most_popular')}
                                </div>
                            )}

                            <div className="mb-8 text-center">
                                <h3 className={`text-lg font-bold mb-2 ${plan.name === 'ELITE' ? 'text-slate-300' : 'text-slate-500'}`}>{plan.name}</h3>
                                <div className="flex items-center justify-center gap-2 mb-2">
                                    {typeof plan.basePoints === 'number' && <CoinIcon className="w-8 h-8" />}
                                    <span className={`text-5xl font-extrabold ${plan.name === 'ELITE' ? 'text-white' : 'text-slate-900'}`}>
                                        {typeof plan.basePoints === 'number' ? calculatePoints(plan.basePoints).toLocaleString() : plan.basePoints}
                                    </span>
                                </div>
                                <p className={`text-sm mt-2 ${plan.name === 'ELITE' ? 'text-slate-400' : 'text-slate-500'}`}>
                                    {plan.description}
                                    {isYearly && typeof plan.basePoints === 'number' && (
                                        <span className="block text-green-500 font-bold text-xs mt-1">
                                            {isRtl ? '+شهرين مجاناً (12 شهر)' : '+2 Months Bonus Points'}
                                        </span>
                                    )}
                                </p>
                            </div>

                            <div className={`p-6 rounded-2xl mb-8 ${plan.name === 'ELITE' ? 'bg-white/10' : 'bg-white border border-slate-100'}`}>
                                <div className="space-y-4">
                                    {plan.features.map((feature, i) => (
                                        <div key={i} className="flex justify-between items-center text-sm">
                                            <span className={plan.name === 'ELITE' ? 'text-slate-300' : 'text-slate-600'}>{feature.label}</span>
                                            <span className={`font-bold ${plan.name === 'ELITE' ? 'text-white' : 'text-slate-900'}`}>{feature.count}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="mt-auto">
                                <div className="text-center mb-6">
                                    <span className={`text-3xl font-bold ${plan.name === 'ELITE' ? 'text-white' : 'text-slate-900'}`}>
                                        {formatPrice(plan.basePrice[currency], currency)}
                                    </span>
                                    {plan.basePrice[currency] !== null && (
                                        <span className={`text-sm block mt-1 ${plan.name === 'ELITE' ? 'text-slate-400' : 'text-slate-500'}`}>
                                            {isYearly ? (isRtl ? '/ سنة' : '/ year') : (isRtl ? '/ شهر' : '/ month')}
                                        </span>
                                    )}
                                </div>
                                <Button
                                    variant={plan.buttonVariant}
                                    className={`w-full py-4 rounded-xl text-lg ${plan.name === 'ELITE' ? 'bg-white text-slate-900 hover:bg-slate-200' : ''}`}
                                    onClick={() => {
                                        if (plan.name === 'ELITE') {
                                            window.open('mailto:sales@creakits.com', '_blank');
                                        } else {
                                            // Handle purchase flow (to be implemented)
                                            window.location.href = '/app';
                                        }
                                    }}
                                >
                                    {plan.name === 'ELITE' ? t('contact_sales') : t('buy_credits')}
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-12 text-center flex items-center justify-center gap-2 text-slate-400 text-sm">
                    🔒 {t('secure_payment')}
                </div>
            </div>
        </section>
    );
};
