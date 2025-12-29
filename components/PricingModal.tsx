import React, { useState } from 'react';
import { CoinIcon } from './CoinIcon';
import { Button } from './Button';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Currency = 'DZD' | 'USD';

export const PricingModal: React.FC<PricingModalProps> = ({ isOpen, onClose }) => {
  const [currency, setCurrency] = useState<Currency>('DZD');

  if (!isOpen) return null;

  const plans = [
    {
      name: "BASIC",
      points: 300,
      price: { DZD: "1,500 DA", USD: "$7.99" },
      description: "Perfect for testing the waters and small campaigns.",
      features: [
        { count: "10", label: "Social Media Posts" },
        { count: "10", label: "Landing Page Designs" },
        { count: "15", label: "Ad Creatives" },
      ],
      isPopular: false,
      gradient: "from-slate-200 to-slate-300",
      buttonVariant: "outline" as const
    },
    {
      name: "PRO",
      points: 1290,
      price: { DZD: "5,990 DA", USD: "$30.99" },
      description: "Best value for active marketers and dropshippers.",
      features: [
        { count: "43", label: "Social Media Posts" },
        { count: "43", label: "Landing Page Designs" },
        { count: "64", label: "Ad Creatives" },
      ],
      isPopular: true,
      gradient: "from-indigo-500 to-purple-600",
      buttonVariant: "primary" as const
    },
    {
      name: "ELITE",
      points: "Custom",
      price: { DZD: "Contact Us", USD: "Contact Us" },
      description: "For agencies requiring bulk generation and API access.",
      features: [
        { count: "∞", label: "Custom Points" },
        { count: "✓", label: "Dedicated Support" },
        { count: "✓", label: "API Access" },
      ],
      isPopular: false,
      gradient: "from-slate-800 to-black",
      buttonVariant: "secondary" as const
    }
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-5xl overflow-hidden animate-fade-in flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-8 text-center bg-slate-50 border-b border-slate-100 relative">
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-200 text-slate-500 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>

          <h2 className="text-3xl font-extrabold text-slate-900 mb-2">Recharge Your Creativity</h2>
          <p className="text-slate-500 mb-8">Choose a package to top up your credits and keep designing.</p>

          {/* Currency Toggle */}
          <div className="inline-flex items-center bg-white p-1 rounded-full border border-slate-200 shadow-sm relative">
             <div 
                className={`absolute top-1 bottom-1 w-[50%] bg-indigo-600 rounded-full transition-all duration-300 ${currency === 'USD' ? 'left-[48%]' : 'left-1'}`}
             ></div>
             <button 
              onClick={() => setCurrency('DZD')}
              className={`relative z-10 px-6 py-2 rounded-full text-sm font-bold transition-colors w-24 ${currency === 'DZD' ? 'text-white' : 'text-slate-500 hover:text-slate-700'}`}
             >
               DZD 🇩🇿
             </button>
             <button 
              onClick={() => setCurrency('USD')}
              className={`relative z-10 px-6 py-2 rounded-full text-sm font-bold transition-colors w-24 ${currency === 'USD' ? 'text-white' : 'text-slate-500 hover:text-slate-700'}`}
             >
               USD 🇺🇸
             </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="p-6 md:p-8 overflow-y-auto bg-white">
          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((plan, idx) => (
              <div 
                key={idx} 
                className={`relative rounded-3xl p-6 border transition-all duration-300 flex flex-col
                  ${plan.isPopular ? 'border-indigo-500 shadow-xl scale-105 z-10 bg-white ring-4 ring-indigo-50' : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'}
                  ${plan.name === 'ELITE' ? 'bg-slate-900 text-white border-slate-800' : ''}
                `}
              >
                {plan.isPopular && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wide shadow-lg">
                    Most Popular
                  </div>
                )}

                <div className="mb-6 text-center">
                  <h3 className={`text-lg font-bold mb-2 ${plan.name === 'ELITE' ? 'text-slate-300' : 'text-slate-500'}`}>{plan.name}</h3>
                  <div className="flex items-center justify-center gap-2 mb-2">
                     {typeof plan.points === 'number' && <CoinIcon className="w-8 h-8" />}
                     <span className={`text-4xl font-extrabold ${plan.name === 'ELITE' ? 'text-white' : 'text-slate-900'}`}>
                        {plan.points}
                     </span>
                     {typeof plan.points === 'number' && <span className="text-sm font-medium opacity-60 self-end mb-1">pts</span>}
                  </div>
                  <p className={`text-sm ${plan.name === 'ELITE' ? 'text-slate-400' : 'text-slate-500'}`}>{plan.description}</p>
                </div>

                <div className={`p-4 rounded-2xl mb-6 ${plan.name === 'ELITE' ? 'bg-white/10' : 'bg-white border border-slate-100'}`}>
                   <div className="text-center mb-4">
                     <span className="text-xs font-bold uppercase tracking-wider opacity-50">You Get Approx.</span>
                   </div>
                   <div className="space-y-3">
                      {plan.features.map((feature, i) => (
                        <div key={i} className="flex justify-between items-center text-sm">
                           <span className={plan.name === 'ELITE' ? 'text-slate-300' : 'text-slate-600'}>{feature.label}</span>
                           <span className={`font-bold ${plan.name === 'ELITE' ? 'text-white' : 'text-slate-900'}`}>{feature.count}</span>
                        </div>
                      ))}
                   </div>
                </div>

                <div className="mt-auto">
                   <div className="text-center mb-4">
                      <span className={`text-2xl font-bold ${plan.name === 'ELITE' ? 'text-white' : 'text-slate-900'}`}>
                        {plan.price[currency]}
                      </span>
                   </div>
                   <Button 
                    variant={plan.buttonVariant} 
                    className={`w-full py-3 rounded-xl ${plan.name === 'ELITE' ? 'bg-white text-slate-900 hover:bg-slate-200' : ''}`}
                    onClick={() => {
                        if (plan.name === 'ELITE') {
                            window.open('mailto:sales@creakits.com', '_blank');
                        } else {
                            // Integration with payment gateway would go here
                            alert(`Selected ${plan.name} Plan in ${currency}`);
                        }
                    }}
                   >
                     {plan.name === 'ELITE' ? 'Contact Sales' : 'Buy Credits'}
                   </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="p-4 bg-slate-50 border-t border-slate-100 text-center text-xs text-slate-400">
           Secure payment via CIB, Eddahabia, or PayPal. Points are added instantly to your account.
        </div>
      </div>
    </div>
  );
};
