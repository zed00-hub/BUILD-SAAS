
import React, { useState, useEffect } from 'react';
import { Country, Language, HistoryItem } from '../../types';
import { Button } from '../Button';
import { fileToBase64, generateImage, editGeneratedImage } from '../../services/geminiService';
import { CoinIcon } from '../CoinIcon';
import { useLanguage } from '../../contexts/LanguageContext';
import { getHistory, saveHistoryItem, deleteHistoryItem } from '../../services/storageService';

interface LandingPageToolProps {
  points: number;
  deductPoints: (amount: number) => boolean;
}

export const LandingPageTool: React.FC<LandingPageToolProps> = ({ points, deductPoints }) => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    description: '',
    
    // Pricing & Offer
    price: '',
    currency: 'DZD',
    discount: '',
    showPrice: true,
    
    // Logistics
    paymentMethod: 'cod' as 'cod' | 'online' | 'both',
    
    // Targeting
    language: Language.Arabic, // Default to Arabic as per screenshot preference
    country: Country.Algeria,
    
    // Customization
    customization: '', // "Custom Features"
  });
  
  const [productImage, setProductImage] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  
  const [history, setHistory] = useState<HistoryItem[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editInstruction, setEditInstruction] = useState('');
  const [error, setError] = useState<string | null>(null);

  const generationCost = 30;
  const editCost = 15;

  const currencies = [
    { code: 'DZD', label: 'Algerian Dinar (د.ج)' },
    { code: 'USD', label: 'US Dollar ($)' },
    { code: 'EUR', label: 'Euro (€)' },
    { code: 'SAR', label: 'Saudi Riyal (ر.س)' },
    { code: 'AED', label: 'UAE Dirham (د.إ)' },
  ];

  const paymentMethods = [
    { value: 'cod', label: t('pay_cod') },
    { value: 'online', label: t('pay_online') },
    { value: 'both', label: t('pay_both') },
  ];

  useEffect(() => {
    setHistory(getHistory('landing'));
  }, []);

  const refreshHistory = () => {
    setHistory(getHistory('landing'));
  };

  const handleLoadHistory = (item: HistoryItem) => {
    if (!item.inputs || !item.results) return;
    setFormData(item.inputs.formData);
    setResultImage(item.results as string);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteHistory = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deleteHistoryItem(id);
    refreshHistory();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
        const base64 = await fileToBase64(e.target.files[0]);
        setProductImage(base64);
        setError(null);
      } catch (err) {
        console.error("Error converting image", err);
        setError("Failed to read file.");
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setFormData(prev => ({ ...prev, [e.target.name]: value }));
  };

  const toggleShowPrice = () => {
    setFormData(prev => ({ ...prev, showPrice: !prev.showPrice }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productImage) {
      setError("Product image is required.");
      return;
    }

    // Check Points
    if (!deductPoints(generationCost)) {
      return;
    }

    setIsLoading(true);
    setError(null);
    setResultImage(null);

    try {
      // Logic for Payment Icons based on selection
      let paymentInstruction = "";
      if (formData.paymentMethod === 'cod') {
        paymentInstruction = "Include prominent icons/badges for 'Cash on Delivery' (الدفع عند الاستلام) and 'Fast Shipping'.";
      } else if (formData.paymentMethod === 'online') {
         paymentInstruction = "Include secure payment icons (Visa/Mastercard).";
      } else {
         paymentInstruction = "Include trust badges for both Secure Payment and Cash on Delivery.";
      }

      // Logic for Price Display
      let priceInstruction = "";
      if (formData.showPrice && formData.price) {
        if (formData.discount && parseInt(formData.discount) > 0) {
           priceInstruction = `DISPLAY PRICE: Show the main price "${formData.price} ${formData.currency}" clearly. Also show a "SALE" badge with "-${formData.discount}% OFF".`;
        } else {
           priceInstruction = `DISPLAY PRICE: Show the price "${formData.price} ${formData.currency}" prominently.`;
        }
      } else {
        priceInstruction = "DO NOT display specific price numbers. Focus on the 'Order Now' Call to Action.";
      }

      // Enhanced Prompt
      const prompt = `Design a HIGH-FIDELITY 4K VERTICAL Mobile Landing Page (E-commerce Style).
      
      CONTEXT:
      - Product: See attached image.
      - Target Market: ${formData.country}
      - Language: ${formData.language} (CRITICAL: Ensure all text is grammatically correct. If Arabic, use proper connecting letters).
      - Payment Method: ${formData.paymentMethod}
      
      CONTENT & OFFERS:
      - Product Description: ${formData.description}
      - ${priceInstruction}
      - ${paymentInstruction}
      ${formData.customization ? `- Special Features to Highlight: ${formData.customization}` : ''}

      VISUAL STRUCTURE (Modern Sales Funnel Layout):
      1. **Hero Section**: High-impact headline, large product visual, and immediate "Order Now" button.
      2. **Offer/Price Box**: A distinct visual container showing the Price/Offer details (if enabled) with a shadow effect.
      3. **Transformation**: A "Before vs After" comparison section to show value.
      4. **Trust & Logistics**: A bar or grid showing the Payment Method icons and Shipping guarantees.
      5. **Footer**: Floating action button style "Order Now".

      DESIGN STYLE:
      - Clean, trustworthy, high-conversion aesthetic.
      - Use colors that match the product but keep the background clean (white/soft gray/pastel) to ensure readability.
      - No gibberish text. Use icons where text is too complex.`;

      const result = await generateImage({
        prompt,
        referenceImage: productImage,
        aspectRatio: "9:16", 
        imageSize: "4K" // Upgraded to 4K
      });
      setResultImage(result);

      // Save History
      saveHistoryItem({
        tool: 'landing',
        results: result,
        inputs: {
            formData
        }
      });
      refreshHistory();

    } catch (err: any) {
      setError(err.message || "Failed to generate design.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!resultImage || !editInstruction) return;
    
    // Check points for edit
    if (!deductPoints(editCost)) {
      return;
    }

    setIsEditing(true);
    try {
      const newImage = await editGeneratedImage(resultImage, editInstruction);
      setResultImage(newImage);
      setEditInstruction('');
    } catch (err: any) {
      setError("Failed to update: " + err.message);
    } finally {
      setIsEditing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 lg:p-8 animate-fade-in">
       <div className="mb-8 border-b border-slate-200 pb-6">
        <h2 className="text-3xl font-bold text-slate-900 mb-2">{t('landing_title')}</h2>
        <p className="text-slate-600">{t('landing_desc')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Configuration Panel */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl shadow-lg border border-slate-100 h-fit overflow-hidden">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <span className="font-bold text-slate-700">{t('config_step1')}</span>
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">{t('step_indicator')}</span>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-8">
              
              {/* 1. Visual Asset */}
              <div className="space-y-3">
                <label className="block text-sm font-bold text-slate-800">{t('product_req')}</label>
                <div className="flex gap-4">
                  <label className={`flex-1 cursor-pointer flex flex-col items-center justify-center h-32 border-2 border-dashed rounded-xl transition-all relative overflow-hidden ${productImage ? 'border-emerald-500 bg-emerald-50' : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'}`}>
                      {productImage ? (
                        <>
                          <img src={`data:image/png;base64,${productImage}`} className="absolute inset-0 w-full h-full object-cover opacity-50" />
                          <div className="relative z-10 bg-white/90 px-3 py-1 rounded-full shadow-sm text-xs font-bold text-emerald-600">{t('loaded')}</div>
                        </>
                      ) : (
                        <>
                          <span className="text-3xl mb-2">📤</span>
                          <span className="text-xs font-medium text-slate-500">{t('upload')}</span>
                        </>
                      )}
                      <input type="file" accept="image/png, image/webp, image/jpeg, image/jpg" onChange={handleImageUpload} className="hidden" />
                  </label>
                </div>
              </div>

              {/* 2. Market Settings */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">{t('market')}</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">{t('language')}</label>
                      <select name="language" value={formData.language} onChange={handleChange} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium">
                        {Object.values(Language).map(l => <option key={l} value={l}>{l}</option>)}
                      </select>
                  </div>
                  <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">{t('region')}</label>
                      <select name="country" value={formData.country} onChange={handleChange} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium">
                        {Object.values(Country).map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                  </div>
                </div>
              </div>

              {/* 3. Pricing Engine */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">Pricing & Offer</h3>
                
                <div className="grid grid-cols-12 gap-3">
                    <div className="col-span-4">
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">{t('currency')}</label>
                      <select name="currency" value={formData.currency} onChange={handleChange} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-900 focus:bg-white outline-none text-sm">
                          {currencies.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
                      </select>
                    </div>
                    <div className="col-span-8">
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">{t('payment_method')}</label>
                      <select name="paymentMethod" value={formData.paymentMethod} onChange={handleChange} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-900 focus:bg-white outline-none text-sm">
                          {paymentMethods.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                      </select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">{t('price_amount')}</label>
                      <input 
                        type="number" 
                        name="price" 
                        value={formData.price} 
                        onChange={handleChange} 
                        placeholder="e.g. 3500"
                        className="w-full px-3 py-2.5 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">{t('discount_percent')}</label>
                      <input 
                        type="number" 
                        name="discount" 
                        min="0" 
                        max="100" 
                        value={formData.discount} 
                        onChange={handleChange} 
                        placeholder="0-100"
                        className="w-full px-3 py-2.5 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                      />
                    </div>
                </div>
                
                {/* Show Price Toggle */}
                <div 
                  onClick={toggleShowPrice}
                  className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 hover:border-indigo-200 bg-slate-50 cursor-pointer transition-colors"
                >
                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${formData.showPrice ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-300'}`}>
                      {formData.showPrice && <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                    </div>
                    <span className="text-sm font-medium text-slate-700">{t('show_price_toggle')}</span>
                </div>
              </div>

              {/* 4. Content Details */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">{t('content_details')}</h3>
                
                <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">{t('prod_desc_label')}</label>
                    <textarea 
                      name="description"
                      value={formData.description} 
                      onChange={handleChange} 
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg h-20 outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 focus:bg-white text-slate-900 placeholder:text-slate-400 text-sm resize-none" 
                      placeholder={t('prod_desc_ph')} 
                    />
                </div>

                <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">{t('custom_features_label')}</label>
                    <textarea 
                      name="customization"
                      value={formData.customization} 
                      onChange={handleChange} 
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg h-16 outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 focus:bg-white text-slate-900 placeholder:text-slate-400 text-sm resize-none" 
                      placeholder={t('custom_features_ph')} 
                    />
                </div>
              </div>
              
              <Button type="submit" isLoading={isLoading} className="w-full py-4 text-lg font-bold shadow-xl shadow-indigo-100 hover:shadow-indigo-200">
                <span className="flex items-center gap-1">
                  {t('generate_design')} ({generationCost} <CoinIcon className="w-5 h-5 inline-block" />)
                </span>
              </Button>
              {error && <p className="text-red-500 text-sm text-center bg-red-50 p-2 rounded-lg">{error}</p>}
            </form>
          </div>
          
           {/* History Section */}
           <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
             <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2 flex justify-between items-center">
                {t('history_title')}
                <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-full">{history.length}</span>
             </h3>
             {history.length === 0 ? (
                <div className="text-center text-slate-400 py-6 text-sm">
                   {t('history_empty')}
                </div>
             ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                   {history.map(item => (
                      <div key={item.id} className="flex gap-3 items-start p-3 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all group">
                         <div className="w-12 h-20 bg-slate-100 rounded-md overflow-hidden flex-shrink-0">
                            {typeof item.results === 'string' && (
                                <img src={item.results} className="w-full h-full object-cover" alt="History" />
                            )}
                         </div>
                         <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-slate-800 truncate leading-tight mb-1">
                                {item.inputs.formData.description || "Untitled Landing Page"}
                            </p>
                            <p className="text-[10px] text-slate-400 mb-2">
                               {new Date(item.timestamp).toLocaleDateString()} • {item.inputs.formData.country}
                            </p>
                            <div className="flex gap-2">
                               <button 
                                onClick={() => handleLoadHistory(item)}
                                className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-1 rounded hover:bg-indigo-100 font-medium transition-colors"
                               >
                                  {t('history_load')}
                               </button>
                               <button 
                                onClick={(e) => handleDeleteHistory(e, item.id)}
                                className="text-[10px] text-red-400 hover:text-red-600 px-1 py-1 transition-colors opacity-0 group-hover:opacity-100"
                               >
                                  {t('history_delete')}
                               </button>
                            </div>
                         </div>
                      </div>
                   ))}
                </div>
             )}
          </div>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-7">
           {resultImage ? (
             <div className="space-y-6 animate-fade-in">
                <div className="rounded-2xl overflow-hidden shadow-2xl bg-slate-900 flex justify-center py-8 relative group">
                  <div className="absolute inset-0 bg-grid-white/5 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] pointer-events-none"></div>
                  <img src={resultImage} alt="Mockup" className="max-w-[85%] sm:max-w-[70%] h-auto rounded-lg shadow-black/50 shadow-2xl ring-1 ring-white/10" />
                </div>
                
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                   <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                     <span>✨ {t('refine_result')}</span>
                     <span className="text-xs font-normal text-slate-400 px-2 py-0.5 bg-slate-100 rounded-full">{t('ai_editor')}</span>
                   </h3>
                   
                   <div className="flex flex-col sm:flex-row gap-3">
                     <div className="flex flex-[2] gap-2">
                       <input 
                          type="text" 
                          value={editInstruction} 
                          onChange={(e) => setEditInstruction(e.target.value)} 
                          placeholder={t('edit_placeholder')} 
                          className="flex-1 px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 focus:bg-white transition-all" 
                       />
                       <Button onClick={handleEdit} isLoading={isEditing} variant="secondary">
                           {t('update')}
                       </Button>
                     </div>
                     <a 
                       href={resultImage} 
                       download="creakits-landing-page-4k.png" 
                       className="flex-1 text-center py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"
                     >
                       <span>{t('download_4k')}</span>
                       <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                     </a>
                   </div>
                </div>
            </div>
           ) : (
            <div className="h-full min-h-[600px] flex flex-col items-center justify-center bg-white rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
               {/* Placeholder Graphics */}
               <div className="absolute inset-0 opacity-40 pointer-events-none">
                  <div className="absolute top-10 right-10 w-32 h-32 bg-indigo-100 rounded-full blur-3xl"></div>
                  <div className="absolute bottom-10 left-10 w-40 h-40 bg-pink-100 rounded-full blur-3xl"></div>
               </div>

               <div className="relative z-10 text-center p-8">
                  <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                     <span className="text-5xl">📄</span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">{t('ready_to_design')}</h3>
                  <p className="text-slate-500 max-w-sm mx-auto leading-relaxed">
                    {t('ready_to_design_desc')}
                  </p>
                  
                  <div className="mt-8 grid grid-cols-3 gap-4 text-xs text-slate-400">
                     <div className="flex flex-col items-center gap-1">
                        <span className="bg-slate-100 p-2 rounded-lg">4K</span>
                        <span>Resolution</span>
                     </div>
                     <div className="flex flex-col items-center gap-1">
                        <span className="bg-slate-100 p-2 rounded-lg">Aa</span>
                        <span>Typography</span>
                     </div>
                     <div className="flex flex-col items-center gap-1">
                        <span className="bg-slate-100 p-2 rounded-lg">🛒</span>
                        <span>Conversion</span>
                     </div>
                  </div>
               </div>
            </div>
           )}
        </div>
      </div>
    </div>
  );
};
