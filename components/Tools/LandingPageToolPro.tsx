
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

interface LandingPageToolProProps {
    points: number;
    deductPoints: (amount: number, description: string, count?: number) => Promise<boolean>;
    isPaidUser: boolean;
    userProfile?: UserData | null;
}

export const LandingPageToolPro: React.FC<LandingPageToolProProps> = ({ points, deductPoints, isPaidUser, userProfile }) => {
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
        reviews: '',
        pageType: 'long', // Default to long for Pro
    });

    const [productImage, setProductImage] = useState<string | null>(null);
    const [logoImage, setLogoImage] = useState<string | null>(null);
    const [useBrandKit, setUseBrandKit] = useState(false);
    const [resultImage, setResultImage] = useState<string | null>(null);

    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editInstruction, setEditInstruction] = useState('');
    const [error, setError] = useState<string | null>(null);
    const isSubmittingRef = React.useRef(false);

    const generationCost = 45; // Higher cost for Pro
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
        setHistory(getHistory('landing-pro'));
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
        setHistory(getHistory('landing-pro'));
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
            link.download = `creakits-landing-pro-${Date.now()}.png`;
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
                        link.download = `creakits-landing-pro-${Date.now()}.webp`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                    } catch (e) {
                        console.error("Download failed (CORS likely):", e);
                        alert("Could not convert to WEBP. Downloading as PNG instead.");
                        const link = document.createElement('a');
                        link.href = resultImage;
                        link.download = `creakits-landing-pro-${Date.now()}.png`;
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
        if (isSubmittingRef.current) return;

        if (!productImage) {
            setError("Product image is required.");
            return;
        }

        if (formData.showPrice && !formData.price) {
            setError("Please enter the product price or uncheck 'Show Price'.");
            return;
        }

        isSubmittingRef.current = true;
        setIsLoading(true);
        setError(null);
        setResultImage(null);

        const hasPoints = await deductPoints(generationCost, `Generate Landing Page Pro`);
        if (!hasPoints) {
            setIsLoading(false);
            isSubmittingRef.current = false;
            return;
        }

        try {
            const priceInstruction = formData.showPrice && formData.price
                ? `Price: ${formData.price} ${formData.currency}`
                : "NO PRICE DISPLAYED";

            const hasDiscount = formData.discount && parseInt(formData.discount) > 0;
            const hasReviews = formData.reviews && formData.reviews.trim().length > 0;

            const languageInstruction = formData.language === Language.Arabic
                ? `🔴 TARGET LANGUAGE: ARABIC (العربية الفصحى). 
           - RULE: ALL TEXT MUST BE IN ARABIC.
           - TRANSLATE ALL ENGLISH/FRENCH INPUTS TO ARABIC AUTOMATICALLY.
           - User RTL layout.`
                : formData.language === Language.French
                    ? "🔴 TARGET LANGUAGE: FRENCH (Français). TRANSLATE ALL INPUTS."
                    : "🔴 TARGET LANGUAGE: ENGLISH. TRANSLATE ALL INPUTS.";

            const prompt = `Design a MASSIVE, PROFESSIONAL LONG-FORM E-COMMERCE LANDING PAGE STRIP.
      
      🚨 KEY REQUIREMENTS:
      1. **Ultra-Long Vertical Format**: This image should look like a full scrollable website screenshot.
      2. **Professional Sections**: Distinct sections with different background shades.
      3. **Content Rich**: Use placeholder text in [${formData.language}] that looks like real marketing copy.
      4. **No Buttons**: This is an infographic/sales strip. Use "Order Now" badges/stickers instead of clickable buttons.

      📝 CONTENT & STRUCTURE:
      
      HEADER:
      - Quick Trust Strip (Icons: Shipping, Warranty).
      - Bold Headline in ${formData.language}.

      HERO SECTION:
      - Large, high-quality 3D render of the product.
      - Emotional imagery (happy user, modest clothing).
      - Main Value Proposition.

      PROBLEM vs SOLUTION (Split Section):
      - Visual comparison showing the "Before" (Pain) and "After" (Benefit).
      - Clear arrows or divider.

      DETAILED FEATURES (Grid):
      - 4-6 Grid of icons/images with short descriptions explaining key benefits.
      - "Why Choose Us?" section.

      SOCIAL PROOF / REVIEWS:
      - Star rating widgets.
      - ${hasReviews ? `Included Review: "${formData.reviews}"` : 'Fake generic positive reviews in target language.'}

      OFFER / PRICING SECTION (Bottom):
      - Big Price Tag: ${priceInstruction}.
      - ${hasDiscount ? `Discount Badge: -${formData.discount}%` : ''}
      - Call to Action Visual (e.g., "Cash on Delivery", "Order via WhatsApp").

      🎨 STYLE:
      - Premium, Corporate, Trustworthy.
      - Use Brand Colors if logo provided, otherwise match product.
      - Clean typography.

      📦 PRODUCT CONTEXT:
      - Description: ${formData.description || 'Analyze image'}
      - ${languageInstruction}
      `;

            const result = await generateImage({
                prompt,
                referenceImage: productImage,
                logoImage: logoImage || undefined,
                aspectRatio: "9:16", // Maintain 9:16 but prompt for density
                imageSize: "4K"
            });
            setResultImage(result);

            if (isPaidUser) {
                saveHistoryItem({
                    tool: 'landing-pro',
                    results: result,
                    inputs: { formData: { ...formData } }
                });
                refreshHistory();
            }

        } catch (err: any) {
            console.error("Generation failed", err);
            if (auth.currentUser) {
                await WalletService.refundPoints(auth.currentUser.uid, generationCost, "Refund: Landing Pro Failed", undefined, 1);
            }
            setError(err.message || "Failed to generate design.");
        } finally {
            setIsLoading(false);
            isSubmittingRef.current = false;
        }
    };

    const handleEdit = async () => {
        if (!resultImage || !editInstruction) return;

        if (isSubmittingRef.current) return;
        isSubmittingRef.current = true;

        setIsEditing(true);
        const hasPoints = await deductPoints(editCost, "Edit Landing Page Pro");
        if (!hasPoints) {
            setIsEditing(false);
            isSubmittingRef.current = false;
            return;
        }
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
            isSubmittingRef.current = false;
        }
    };

    return (
        <div className="max-w-7xl mx-auto p-4 lg:p-8 animate-fade-in">
            <div className="mb-8 border-b border-indigo-100 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-indigo-900 mb-2 flex items-center gap-2">
                        {t('landing_title')} <span className="text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg text-sm border border-indigo-100">PRO</span>
                    </h2>
                    <p className="text-slate-600">Professional multi-section landing pages.</p>
                </div>
                <UsageLimitsCard userProfile={userProfile} compact />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-5 space-y-6">
                    <div className="bg-white rounded-2xl shadow-lg border border-indigo-50 h-fit overflow-hidden ring-4 ring-indigo-50/50">
                        <div className="bg-indigo-50 px-6 py-4 border-b border-indigo-100 flex items-center justify-between">
                            <span className="font-bold text-indigo-800">{t('config_step1')} (PRO)</span>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">

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

                            <div className="space-y-3">
                                <label className="block text-sm font-bold text-slate-800">{t('product_req')}</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <label className={`cursor-pointer flex flex-col items-center justify-center h-40 border-2 border-dashed rounded-xl transition-all relative overflow-hidden ${productImage ? 'border-emerald-500 bg-emerald-50' : 'border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50'}`}>
                                        {productImage ? (
                                            <>
                                                <img src={`data:image/png;base64,${productImage}`} className="absolute inset-0 w-full h-full object-cover opacity-50" />
                                                <div className="relative z-10 bg-white/90 px-3 py-1 rounded-full shadow-sm text-xs font-bold text-emerald-600">{t('loaded')}</div>
                                            </>
                                        ) : (
                                            <>
                                                <span className="text-4xl mb-3">💎</span>
                                                <span className="text-xs font-bold text-indigo-800 text-center px-4">Upload High-Res Product</span>
                                            </>
                                        )}
                                        <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, setProductImage)} className="hidden" />
                                    </label>

                                    <div className="input-group flex flex-col h-40">
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

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-800 mb-1 flex items-center gap-2">
                                        {t('prod_desc_label')}
                                    </label>
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleChange}
                                        placeholder="Detailed explanation of the product features..."
                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 min-h-[100px]"
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

                                {/* Advanced Features */}
                                <div>
                                    <label className="block text-sm font-bold text-slate-800 mb-1">Advanced Customization</label>
                                    <textarea
                                        name="customization"
                                        value={formData.customization}
                                        onChange={handleChange}
                                        placeholder="Specific design instructions (e.g., 'Use Dark Mode', 'Add Technical Specs section')"
                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 min-h-[60px] text-sm"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-800 mb-1">Reviews / Testimonials Source</label>
                                    <textarea
                                        name="reviews"
                                        value={formData.reviews}
                                        onChange={handleChange}
                                        placeholder="Paste real customer reviews here to include them in the design..."
                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 min-h-[60px] text-sm"
                                    />
                                </div>
                            </div>

                            {error && <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">{error}</div>}

                            <Button
                                type="submit"
                                variant="primary"
                                isLoading={isLoading}
                                className="w-full py-4 text-lg font-bold shadow-xl shadow-indigo-200 hover:shadow-indigo-300 transition-all transform hover:-translate-y-1 bg-gradient-to-r from-indigo-600 to-violet-600"
                                disabled={!productImage}
                            >
                                <div className="flex flex-col items-center leading-none">
                                    <span className="flex items-center gap-2">
                                        GENERATE PRO
                                        <span className="bg-white/20 px-2 py-0.5 rounded text-sm flex items-center gap-1">
                                            {generationCost} <CoinIcon className="w-3 h-3 text-white" />
                                        </span>
                                    </span>
                                </div>
                            </Button>
                        </form>
                    </div>
                </div>

                <div className="lg:col-span-7">
                    {resultImage ? (
                        <div className="space-y-6 animate-fade-in">
                            <div className="rounded-2xl overflow-hidden shadow-2xl bg-slate-900 flex justify-center py-8 relative group">
                                <div className="absolute inset-0 bg-grid-white/5 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] pointer-events-none"></div>
                                <img src={resultImage} alt="Mockup" className="max-w-[90%] h-auto rounded-lg shadow-black/50 shadow-2xl ring-1 ring-white/10" />
                            </div>

                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                    <span>✨ {t('refine_result')}</span>
                                </h3>

                                <div className="flex flex-col gap-4">
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

                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            onClick={() => handleDownload('png')}
                                            className="py-3 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-900 transition-colors flex items-center justify-center gap-2"
                                        >
                                            {t('download_png')}
                                        </button>
                                        <button
                                            onClick={() => handleDownload('webp')}
                                            className="py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                                        >
                                            {t('download_webp')}
                                        </button>
                                    </div>
                                </div>

                                {isPaidUser && (
                                    <div className="flex justify-center mt-4 pt-4 border-t border-slate-100">
                                        <SaveToCloudButton
                                            images={[resultImage]}
                                            designType="landing-pro"
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
                        <div className="h-full min-h-[600px] flex flex-col items-center justify-center bg-white rounded-3xl border border-indigo-100 shadow-sm relative overflow-hidden ring-4 ring-indigo-50/30">
                            <div className="absolute inset-0 opacity-40 pointer-events-none">
                                <div className="absolute top-10 right-10 w-48 h-48 bg-indigo-200 rounded-full blur-3xl mix-blend-multiply"></div>
                                <div className="absolute bottom-10 left-10 w-64 h-64 bg-violet-200 rounded-full blur-3xl mix-blend-multiply"></div>
                            </div>

                            <div className="relative z-10 text-center p-8">
                                <div className="w-24 h-24 bg-gradient-to-br from-indigo-100 to-violet-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner ring-4 ring-white">
                                    <span className="text-5xl">🚀</span>
                                </div>
                                <h3 className="text-2xl font-bold text-slate-800 mb-2">{t('ready_to_design')} PRO</h3>
                                <p className="text-slate-500 max-w-sm mx-auto leading-relaxed">
                                    Start creating high-end, multi-section landing pages.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
