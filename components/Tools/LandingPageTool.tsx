
import React, { useState, useEffect } from 'react';
import { Country, Language, HistoryItem } from '../../types';
import { UserData } from '../../src/types/dbTypes';
import { Button } from '../Button';
import { fileToBase64, generateImage, editGeneratedImage } from '../../services/geminiService';
import { CoinIcon } from '../CoinIcon';
import { useLanguage } from '../../contexts/LanguageContext';
import { getHistory, saveHistoryItem, deleteHistoryItem } from '../../services/storageService';
import { SaveToCloudButton } from '../SaveToCloudButton';
import { UsageLimitsCard } from '../UsageLimitsCard';
import { WalletService } from '../../src/services/walletService';
import { auth } from '../../src/firebase';

interface LandingPageToolProps {
  points: number;
  deductPoints: (amount: number, description: string, count?: number) => Promise<boolean>;
  isPaidUser: boolean;
  userProfile?: UserData | null;
}

export const LandingPageTool: React.FC<LandingPageToolProps> = ({ points, deductPoints, isPaidUser, userProfile }) => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    description: '',
    price: '',
    currency: 'DZD',
    discount: '',
    showPrice: true,
    paymentMethod: 'cod' as 'cod' | 'online' | 'both',
    language: Language.Arabic,
    country: Country.Algeria,
    customization: '',
  });

  const [pageType, setPageType] = useState<'standard' | 'long'>('standard');
  const [productImage, setProductImage] = useState<string | null>(null);
  const [logoImage, setLogoImage] = useState<string | null>(null);
  const [useBrandKit, setUseBrandKit] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);

  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editInstruction, setEditInstruction] = useState('');
  const [error, setError] = useState<string | null>(null);

  const generationCost = pageType === 'long' ? 45 : 30;
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

  useEffect(() => {
    if (useBrandKit && userProfile?.brandKit?.logo) {
      setLogoImage(userProfile.brandKit.logo);
    }
  }, [useBrandKit, userProfile]);

  const toggleBrandKit = () => {
    setUseBrandKit(!useBrandKit);
  };

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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    if (e.target.files && e.target.files[0]) {
      try {
        const base64 = await fileToBase64(e.target.files[0]);
        setter(base64);
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

  const handleDownload = (format: 'png' | 'webp') => {
    if (!resultImage) return;

    if (format === 'png') {
      const link = document.createElement('a');
      link.href = resultImage;
      link.download = `creakits-landing-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (format === 'webp') {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          try {
            const webpData = canvas.toDataURL('image/webp', 0.9);
            const link = document.createElement('a');
            link.href = webpData;
            link.download = `creakits-landing-${Date.now()}.webp`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          } catch (e) {
            console.error("Download failed (CORS likely):", e);
            alert("Could not convert to WEBP due to browser security restrictions. Downloading as PNG instead.");
            const link = document.createElement('a');
            link.href = resultImage;
            link.download = `creakits-landing-${Date.now()}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }
        }
      };
      img.src = resultImage;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productImage) {
      setError("Product image is required.");
      return;
    }

    const hasPoints = await deductPoints(generationCost, `Generate Landing Page (${pageType})`);
    if (!hasPoints) return;

    setIsLoading(true);
    setError(null);
    setResultImage(null);

    try {
      let paymentInstruction = "";
      if (formData.paymentMethod === 'cod') {
        paymentInstruction = "Include prominent icons/badges for 'Cash on Delivery' (الدفع عند الاستلام).";
      } else if (formData.paymentMethod === 'online') {
        paymentInstruction = "Include secure payment icons (Visa/Mastercard).";
      } else {
        paymentInstruction = "Include trust badges for both Secure Payment and Cash on Delivery.";
      }

      let priceInstruction = "";
      if (formData.showPrice && formData.price) {
        if (formData.discount && parseInt(formData.discount) > 0) {
          priceInstruction = `DISPLAY PRICE: Show "${formData.price} ${formData.currency}" crossed out if applicable or just prominently. Highlight "SALE -${formData.discount}%".`;
        } else {
          priceInstruction = `DISPLAY PRICE: Show "${formData.price} ${formData.currency}" prominently.`;
        }
      } else {
        priceInstruction = "DO NOT display specific price numbers. Focus on value.";
      }

      const structureInstruction = pageType === 'long'
        ? `
        DETAILED LONG-FORM STRUCTURE (Scrollable View):
        1. **Hero Header**: Immersive product shot, bold value proposition headline, "Order Now" button.
        2. **Social Proof Bar**: "Trusted by 10,000+ customers" or media logos.
        3. **Problem/Agitation**: Visuals showing the problem the product solves.
        4. **Solution Showcase**: Large product details, zoomed-in features, bullet points with icons.
        5. **Benefits Grid**: 2x2 or 3x3 grid of key benefits with modern glassmorphism cards.
        6. **Testimonials Carousel**: 3 realistic user reviews with stars and avatars.
        7. **Offer Section**: "Limited Time Offer", count-down timer visual, Price Box (${priceInstruction}).
        8. **FAQ Accordion**: 3 common questions visualized.
        9. **Sticky Bottom Bar / Final CTA**: "Order Now" button with Payment Icons (${paymentInstruction}).
        `
        : `
        STANDARD CONCISE STRUCTURE:
        1. **Hero**: Headline, Product Image, Primary CTA.
        2. **Key Benefits**: 3 main selling points with icons.
        3. **Social Proof**: Simple star rating or "Best Seller" badge.
        4. **Offer/Price**: Clear price display (${priceInstruction}) and Payment Badges (${paymentInstruction}).
        5. **Footer**: Final CTA button.
        `;

      const prompt = `Design a ${pageType === 'long' ? 'PREMIUM LONG-FORM' : 'STANDARD'} 4K VERTICAL Mobile Landing Page UI for E-commerce.
      
      PRODUCT CONTEXT:
      - Product: See image.
      - Target Market: ${formData.country}
      - Language: ${formData.language} (Ensure correct grammar and RTL layout if Arabic).
      - Description: ${formData.description}
      ${formData.customization ? `- Custom Requirements: ${formData.customization}` : ''}

      VISUAL STYLE:
      - Professional, High-End, Trustworthy. 
      - Use "Inter" or modern Sans-Serif typography.
      - Clean whitespace, subtle drop-shadows, rounded corners (Apple/Modern UI style).
      - Color palette derived from product image but optimized for conversion (contrasting CTAs).
      
      ${structureInstruction}
      `;

      const result = await generateImage({
        prompt,
        referenceImage: productImage,
        logoImage: logoImage || undefined,
        aspectRatio: "9:16", // 9:21 is not supported by the API yet
        imageSize: "4K"
      });
      setResultImage(result);

      if (isPaidUser) {
        saveHistoryItem({
          tool: 'landing',
          results: result,
          inputs: { formData: { ...formData, pageType } } // Save pageType too
        });
        refreshHistory();
      }

    } catch (err: any) {
      console.error("Generation failed", err);
      if (auth.currentUser) {
        await WalletService.refundPoints(auth.currentUser.uid, generationCost, "Refund: Landing Page Failed", undefined, 1);
      }
      setError(err.message || "Failed to generate design.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!resultImage || !editInstruction) return;
    const hasPoints = await deductPoints(editCost, "Edit Landing Page");
    if (!hasPoints) return;

    setIsEditing(true);
    try {
      const newImage = await editGeneratedImage(resultImage, editInstruction);
      setResultImage(newImage);
      setEditInstruction('');
    } catch (err: any) {
      if (auth.currentUser) {
        await WalletService.refundPoints(auth.currentUser.uid, editCost, "Refund: Edit Failed", undefined, 1);
      }
      setError("Edit failed: " + err.message);
    } finally {
      setIsEditing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 lg:p-8 animate-fade-in">
      <div className="mb-8 border-b border-slate-200 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 mb-2">{t('landing_title')}</h2>
          <p className="text-slate-600">{t('landing_desc')}</p>
        </div>
        <UsageLimitsCard userProfile={userProfile} compact />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Configuration Panel */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl shadow-lg border border-slate-100 h-fit overflow-hidden">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <span className="font-bold text-slate-700">{t('config_step1')}</span>
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">{t('step_indicator')}</span>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">

              {/* Page Type Selection */}
              <div className="space-y-3">
                <label className="block text-sm font-bold text-slate-800">{t('page_type')}</label>
                <div className="grid grid-cols-2 gap-4">
                  <div
                    onClick={() => setPageType('standard')}
                    className={`cursor-pointer p-4 rounded-xl border-2 transition-all ${pageType === 'standard' ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-slate-300'}`}
                  >
                    <div className="font-bold text-slate-900 mb-1">{t('standard_page')}</div>
                    <div className="text-xs text-slate-500">Concise, Single Screen Focus</div>
                  </div>
                  <div
                    onClick={() => setPageType('long')}
                    className={`cursor-pointer p-4 rounded-xl border-2 transition-all ${pageType === 'long' ? 'border-purple-500 bg-purple-50' : 'border-slate-200 hover:border-slate-300'}`}
                  >
                    <div className="font-bold text-slate-900 mb-1">{t('long_page')}</div>
                    <div className="text-xs text-slate-500">Detailed, High Conversion Funnel</div>
                  </div>
                </div>
              </div>

              {/* Targeting (Restored) */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">{t('target_country')}</label>
                  <select
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  >
                    {Object.values(Country).map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">{t('language')}</label>
                  <select
                    name="language"
                    value={formData.language}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  >
                    {Object.values(Language).map((l) => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 1. Visual Asset */}
              <div className="space-y-3">
                <label className="block text-sm font-bold text-slate-800">{t('product_req')}</label>
                <div className="grid grid-cols-2 gap-4">
                  <label className={`cursor-pointer flex flex-col items-center justify-center h-32 border-2 border-dashed rounded-xl transition-all relative overflow-hidden ${productImage ? 'border-emerald-500 bg-emerald-50' : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'}`}>
                    {productImage ? (
                      <>
                        <img src={`data:image/png;base64,${productImage}`} className="absolute inset-0 w-full h-full object-cover opacity-50" />
                        <div className="relative z-10 bg-white/90 px-3 py-1 rounded-full shadow-sm text-xs font-bold text-emerald-600">{t('loaded')}</div>
                      </>
                    ) : (
                      <>
                        <span className="text-3xl mb-2">📸</span>
                        <span className="text-xs font-medium text-slate-500">{t('upload_product')}</span>
                      </>
                    )}
                    <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, setProductImage)} className="hidden" />
                  </label>

                  <div className="input-group flex flex-col h-32">
                    <label className="text-xs font-semibold text-slate-600 mb-1 flex justify-between">
                      <span>{t('logo_opt')}</span>
                      {userProfile?.brandKit?.logo && (
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-indigo-600">Brand Kit</span>
                          <input type="checkbox" checked={useBrandKit} onChange={toggleBrandKit} />
                        </div>
                      )}
                    </label>
                    <label className={`flex-1 cursor-pointer flex flex-col items-center justify-center border-2 border-dashed rounded-xl transition-all relative overflow-hidden ${logoImage ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'}`}>
                      {logoImage ? (
                        <>
                          <span className="text-2xl mb-1">©️</span>
                          <span className="text-xs text-center text-slate-500 truncate w-full px-2">{t('loaded')}</span>
                        </>
                      ) : (
                        <span className="text-xs text-slate-400">Upload Logo</span>
                      )}
                      <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, setLogoImage)} className="hidden" />
                    </label>
                  </div>
                </div>
              </div>

              {/* 2. Content */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-1">{t('prod_desc_label')}</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder={t('prod_desc_ph')}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 min-h-[80px]"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">{t('payment_method')}</label>
                    <select
                      name="paymentMethod"
                      value={formData.paymentMethod}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    >
                      {paymentMethods.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">{t('currency')}</label>
                    <select
                      name="currency"
                      value={formData.currency}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    >
                      {currencies.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="checkbox"
                    checked={formData.showPrice}
                    onChange={toggleShowPrice}
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                  <span className="text-sm text-slate-700">{t('show_price_toggle')}</span>
                </div>

                {formData.showPrice && (
                  <div className="grid grid-cols-2 gap-4 animate-fade-in">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">{t('price_amount')}</label>
                      <input
                        type="text"
                        name="price"
                        value={formData.price}
                        onChange={handleChange}
                        placeholder="e.g. 5000"
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">{t('discount_percent')}</label>
                      <input
                        type="text"
                        name="discount"
                        value={formData.discount}
                        onChange={handleChange}
                        placeholder="e.g. 20"
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-1">{t('custom_features_label')}</label>
                  <textarea
                    name="customization"
                    value={formData.customization}
                    onChange={handleChange}
                    placeholder={t('custom_features_ph')}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 min-h-[60px] text-sm"
                  />
                </div>
              </div>

              {error && <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">{error}</div>}

              <Button
                type="submit"
                variant="primary"
                isLoading={isLoading}
                className="w-full py-4 text-lg font-bold shadow-xl shadow-indigo-200 hover:shadow-indigo-300 transition-all transform hover:-translate-y-1"
                disabled={!productImage}
              >
                <div className="flex flex-col items-center leading-none">
                  <span className="flex items-center gap-2">
                    {t('generate_design')}
                    <span className="bg-white/20 px-2 py-0.5 rounded text-sm flex items-center gap-1">
                      {generationCost} <CoinIcon className="w-3 h-3 text-white" />
                    </span>
                  </span>
                </div>
              </Button>
            </form>
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

                <div className="flex flex-col gap-4">

                  {/* Edit Controls */}
                  <div className="flex flex-col sm:flex-row gap-3">
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

                  {/* Download Controls */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleDownload('png')}
                      className="py-3 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-900 transition-colors flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                      {t('download_png')}
                    </button>
                    <button
                      onClick={() => handleDownload('webp')}
                      className="py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                      {t('download_webp')}
                    </button>
                  </div>
                </div>

                {isPaidUser && (
                  <div className="flex justify-center mt-4 pt-4 border-t border-slate-100">
                    <SaveToCloudButton
                      images={[resultImage]}
                      designType="landing"
                      metadata={{ description: formData.description, country: formData.country }}
                      onSaved={() => alert(t('design_saved') || 'Design saved!')}
                      onError={(err) => alert(err)}
                      className="w-full"
                      variant="secondary"
                    />
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[600px] flex flex-col items-center justify-center bg-white rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
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
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
