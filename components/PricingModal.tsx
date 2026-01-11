import React, { useState, useEffect } from 'react';
import { CoinIcon } from './CoinIcon';
import { Button } from './Button';
import { useLanguage } from '../contexts/LanguageContext';
import { PricingService, DEFAULT_PRICING_CONFIG, PricingConfig } from '../src/services/pricingService';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Currency = 'DZD' | 'USD';
type BillingCycle = 'monthly' | 'yearly';

export const PricingModal: React.FC<PricingModalProps> = ({ isOpen, onClose }) => {
  const [currency, setCurrency] = useState<Currency>('DZD');
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [config, setConfig] = useState<PricingConfig>(DEFAULT_PRICING_CONFIG);
  const { t, language } = useLanguage();
  const isRtl = language === 'ar';

  useEffect(() => {
    const unsubscribe = PricingService.subscribeToPricingConfig(setConfig);
    return () => unsubscribe();
  }, []);

  if (!isOpen) return null;

  const isYearly = billingCycle === 'yearly';
  const plans = config.plans;

  const formatPrice = (amount: number | null, curr: Currency) => {
    if (amount === null) return t('contact_sales');
    const finalAmount = isYearly ? amount * 10 : amount;

    // Formatting: 1500 -> 1,500
    const formatted = finalAmount.toLocaleString(undefined, { minimumFractionDigits: curr === 'USD' ? 2 : 0, maximumFractionDigits: curr === 'USD' ? 2 : 0 });

    return curr === 'DZD' ? `${formatted} DA` : `$${formatted}`;
  };

  const calculatePoints = (points: number | string) => {
    if (typeof points === 'string') return points;
    // Yearly gets 12 months worth of points for price of 10
    return isYearly ? points * 12 : points;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>

      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-5xl overflow-hidden animate-fade-in flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 md:p-8 text-center bg-slate-50 border-b border-slate-100 relative">
          <button
            onClick={onClose}
            className="absolute top-6 right-6 rtl:right-auto rtl:left-6 p-2 rounded-full hover:bg-slate-200 text-slate-500 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>

          <h2 className="text-3xl font-extrabold text-slate-900 mb-2">{t('pricing_title')}</h2>
          <p className="text-slate-500 mb-6">{t('pricing_subtitle')}</p>

          <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8">
            {/* Currency Toggle */}
            <div className="inline-flex items-center bg-white p-1 rounded-full border border-slate-200 shadow-sm relative h-10" dir="ltr">
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
            <div className="flex items-center bg-slate-200 p-1 rounded-full relative cursor-pointer" onClick={() => setBillingCycle(isYearly ? 'monthly' : 'yearly')}>
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

        {/* Pricing Cards */}
        <div className="p-6 md:p-8 overflow-y-auto bg-white">
          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((plan, idx) => (
              <div
                key={plan.id || idx}
                className={`relative rounded-3xl p-6 border transition-all duration-300 flex flex-col
                  ${plan.isPopular ? 'border-indigo-500 shadow-xl scale-105 z-10 bg-white ring-4 ring-indigo-50' : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'}
                  ${plan.isCustomPricing ? 'bg-slate-900 text-white border-slate-800' : ''}
                  ${!plan.isActive ? 'hidden' : ''}
                `}
              >
                {plan.isPopular && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wide shadow-lg whitespace-nowrap">
                    {t('most_popular')}
                  </div>
                )}

                <div className="mb-6 text-center">
                  <h3 className={`text-lg font-bold mb-2 ${plan.isCustomPricing ? 'text-slate-300' : 'text-slate-500'}`}>{plan.name}</h3>
                  <div className="flex items-center justify-center gap-2 mb-2">
                    {typeof plan.basePoints === 'number' && <CoinIcon className="w-8 h-8" />}
                    <span className={`text-4xl font-extrabold ${plan.isCustomPricing ? 'text-white' : 'text-slate-900'}`}>
                      {typeof plan.basePoints === 'number' ? calculatePoints(plan.basePoints).toLocaleString() : plan.basePoints}
                    </span>
                    {typeof plan.basePoints === 'number' && <span className="text-sm font-medium opacity-60 self-end mb-1">pts</span>}
                  </div>
                  <p className={`text-sm ${plan.isCustomPricing ? 'text-slate-400' : 'text-slate-500'}`}>
                    {plan.description}
                    {/* Show yearly bonus text */}
                    {isYearly && typeof plan.basePoints === 'number' && (
                      <span className="block text-green-500 font-bold text-xs mt-1">
                        {isRtl ? '+شهرين مجاناً (12 شهر)' : '+2 Months Bonus Points'}
                      </span>
                    )}
                  </p>
                </div>

                <div className={`p-4 rounded-2xl mb-6 ${plan.isCustomPricing ? 'bg-white/10' : 'bg-white border border-slate-100'}`}>
                  <div className="text-center mb-4">
                    <span className="text-xs font-bold uppercase tracking-wider opacity-50">{t('you_get')}</span>
                  </div>
                  <div className="space-y-3">
                    {plan.features.map((feature, i) => (
                      <div key={i} className="flex justify-between items-center text-sm">
                        <span className={plan.isCustomPricing ? 'text-slate-300' : 'text-slate-600'}>{feature.label}</span>
                        <span className={`font-bold ${plan.isCustomPricing ? 'text-white' : 'text-slate-900'}`}>
                          {feature.count}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-auto">
                  <div className="text-center mb-4">
                    <span className={`text-2xl font-bold ${plan.isCustomPricing ? 'text-white' : 'text-slate-900'}`}>
                      {formatPrice(plan.prices[currency], currency)}
                    </span>
                    {plan.prices[currency] !== null && (
                      <span className={`text-xs block mt-1 ${plan.isCustomPricing ? 'text-slate-400' : 'text-slate-500'}`}>
                        {isYearly ? (isRtl ? '/ سنة' : '/ year') : (isRtl ? '/ شهر' : '/ month')}
                      </span>
                    )}
                  </div>
                  <Button
                    variant={plan.buttonVariant}
                    className={`w-full py-3 rounded-xl ${plan.isCustomPricing ? 'bg-white text-slate-900 hover:bg-slate-200' : ''}`}
                    onClick={() => {
                      if (plan.isCustomPricing) {
                        window.open(`mailto:${plan.contactEmail || 'sales@creakits.com'}`, '_blank');
                      } else {
                        if (currency === 'DZD') {
                          const message = `مرحباً، أريد الاشتراك في باقة ${plan.name} (${isYearly ? 'سنوي' : 'شهري'}). السعر: ${formatPrice(plan.prices[currency], currency)}.`;
                          window.open(`https://wa.me/2136578491823?text=${encodeURIComponent(message)}`, '_blank');
                        } else {
                          // Integration with payment gateway
                          alert(`Selected ${plan.name} Plan (${billingCycle}) - ${formatPrice(plan.prices[currency], currency)}`);
                        }
                      }
                    }}
                  >
                    {plan.isCustomPricing ? t('contact_sales') : t('buy_credits')}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100 text-center text-xs text-slate-400">
          {t('secure_payment')}
        </div>
      </div>
    </div>
  );
};
