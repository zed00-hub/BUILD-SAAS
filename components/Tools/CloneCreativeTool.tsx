import React, { useState, useRef } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { generateImage, fileToBase64 } from '../../services/geminiService';
import { WalletService } from '../../src/services/walletService';
import { Language, Country } from '../../types';
import { saveHistoryItem } from '../../services/storageService';
import { UsageLimitsCard } from '../UsageLimitsCard';
import { CoinIcon } from '../CoinIcon';
import { auth } from '../../src/firebase';
import { UserData } from '../../src/types/dbTypes';

interface CloneCreativeToolProps {
    points: number;
    deductPoints: (amount: number, reason: string) => Promise<boolean>;
    isPaidUser: boolean;
    userProfile: any; // UserData | null
}

const CloneCreativeTool: React.FC<CloneCreativeToolProps> = ({ points, deductPoints, isPaidUser, userProfile }) => {
    const { t } = useLanguage();

    const [productImage, setProductImage] = useState<string | null>(null);
    const [referenceImage, setReferenceImage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [resultImage, setResultImage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        language: Language.Arabic,
        country: Country.Algeria,
        price: '',
        currency: 'DZD',
        paymentMethod: 'cod', // cod | online
        discount: false,
        additionalInfo: ''
    });

    const isSubmittingRef = useRef(false);
    const cost = 45; // Fixed cost for Clone Creative

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.size > 10 * 1024 * 1024) { // 10MB Limit
                setError(t('upload_limit_note') || "Max file size: 10MB");
                return;
            }
            try {
                const base64 = await fileToBase64(file);
                setter(base64);
                setError(null);
            } catch (err) {
                console.error("Error reading file", err);
                setError("Failed to read image file");
            }
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: checked }));
    };

    const handleDownload = (format: 'png' | 'webp') => {
        if (!resultImage) return;

        const link = document.createElement('a');
        link.href = resultImage;
        link.download = `creakits-clone-${Date.now()}.${format}`;

        if (format === 'webp') {
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
                        link.href = webpData;
                        link.click();
                    } catch (e) {
                        link.click();
                    }
                }
            };
            img.src = resultImage;
            return;
        }

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmittingRef.current) return;

        if (!productImage || !referenceImage) {
            setError("Please upload both Product Image and Reference Landing Page Image.");
            return;
        }

        if (!formData.price) {
            setError("Please enter a price for the product.");
            return;
        }

        isSubmittingRef.current = true;
        setIsLoading(true);
        setError(null);
        setResultImage(null);

        const hasPoints = await deductPoints(cost, "Generate Clone Creative");
        if (!hasPoints) {
            setIsLoading(false);
            isSubmittingRef.current = false;
            return;
        }

        try {
            // --- COPY OF ADVANCED LOGIC FROM LANDING PAGE TOOL ---

            // 1. Smart Ethnicity & Style Selection
            let ethnicityInstruction = "Models should have an International/Universal appearance.";
            if ([Country.Algeria, Country.Morocco, Country.Tunisia].includes(formData.country)) {
                ethnicityInstruction = "Models MUST have a North African (Maghrebi) appearance (Olive skin, Mediterranean features). Authentic representation of Algerian/Moroccan people.";
            } else if (formData.country === Country.Gulf) {
                ethnicityInstruction = "Models MUST have a Gulf Arab (Khaleeji) appearance. Clothing can include modern-traditional fusion (e.g., Thobe/Abaya hints) but keep it commercial.";
            } else if ([Country.France, Country.Spain, Country.Italy, Country.Germany, Country.UK, Country.USA].includes(formData.country)) {
                ethnicityInstruction = "Models should have a Western/European appearance.";
            }

            // 2. Advanced Language Instructions
            let languageInstruction = "";
            switch (formData.language) {
                case Language.Darija:
                    languageInstruction = "🔴 WRITING LANGUAGE: NORTH AFRICAN DARIJA (Arabic Script). Use local dialect expressions common in Algeria/Morocco (e.g., 'بزاف', 'ديالك', 'شري دابا'). Mix strictly necessary French terms only if common in marketing.";
                    break;
                case Language.Amazigh:
                    languageInstruction = "🔴 WRITING LANGUAGE: AMAZIGH (Tamazight) using LATIN SCRIPT (e.g., 'Azul', 'Tanmmirt'). Ensure correct Latin spelling for Berber languages.";
                    break;
                case Language.Arabic:
                    languageInstruction = "🔴 WRITING LANGUAGE: Modern Standard Arabic (Fusha). Elegant and professional.";
                    break;
                case Language.French:
                    languageInstruction = "🔴 WRITING LANGUAGE: Professional French.";
                    break;
                default:
                    languageInstruction = `🔴 WRITING LANGUAGE: ${formData.language}. Translate all text to this language.`;
            }

            let paymentInstruction = "";
            if (formData.paymentMethod === 'cod') {
                paymentInstruction = "Include prominent icons/badges for 'Cash on Delivery'.";
            } else if (formData.paymentMethod === 'online') {
                paymentInstruction = "Include secure payment icons (Visa/Mastercard).";
            } else {
                paymentInstruction = "Include trust badges for both Secure Payment and Cash on Delivery.";
            }

            const priceInstruction = `PRICE DISPLAY: Show the price "${formData.price} ${formData.currency}" clearly.`;
            const hasDiscount = formData.discount;

            const baseRules = `
      🚨 CRITICAL RULES (ZERO TOLERANCE):
      1. ⛔ NO BUTTONS: Do NOT draw "Buy Now" buttons. This is an informational graphic.
      2. ⛔ NO WEBSITE UI: No browser frames, no scrollbars, no navigation menus.
      3. ⛔ NO IMMODESTY (STRICT): Models MUST wear modest, loose clothing (Long sleeves, High necklines). AVOID any skin exposure or tight clothing. Family-friendly atmosphere is MANDATORY.
      4. ⛔ NO META-TEXT: Do NOT write "SECTION 1", "HERO", "STRUCTURE", or any layout instructions on the image. Only write the actual marketing copy.
      5. ⛔ NO FAKE REVIEWS: Use generic trust badges (e.g., "5 Stars", "Trusted Choice") unless specific reviews are provided.
      6. ✅ MARKETING FOCUS: Focus on PAIN POINTS vs. SOLUTIONS. Use visual storytelling.
      7. ✅ LANGUAGE ADHERENCE: ${languageInstruction}
      8. ✅ ETHNICITY & LOCALIZATION: ${ethnicityInstruction}
      9. ✅ ULTRA HIGH QUALITY: 4K resolution, sharp details, professional studio lighting.

      🎨 ART DIRECTION & STYLE:
      - Vibe: Commercial Advertising, High-End Packaging Design, Persuasive.
      - Lighting: Studio brightness, soft shadows.
      - Colors: Fresh and Vivid (match product branding).
      - Textures: Glossy, Clean.
      `;

            const narrativeStyleInstruction = `
      🎨 VISUAL STYLE & COLOR CONSISTENCY (CRITICAL):
      - **UNIFIED COLOR PALETTE:** Analyze the PRODUCT COLOR. Use this color scheme for the ENTIRE image background, gradients, and accents.
      - **RICH & DENSE DESIGN:** Avoid empty white spaces. Fill backgrounds with subtle textures, patterns, soft luxury gradients, or bokeh effects matching the product theme.
      - **SEAMLESS FLOW:** This is a VERTICAL SCROLLING STRIP. Sections must MELT into each other using gradients. NO hard horizontal lines or section dividers.
      - **COMMERCIAL VIBRANCE:** Use high-saturation, commercial-grade lighting. Make it look like a premium packaging box or a high-end flyer.
      - **TEXT STYLING:** Use modern, bold fonts with thick strokes and distinctive shadows/outlines for maximum readability relative to the background.
      `;

            // --- END OF COPIED LOGIC ---

            const prompt = `
      ACT AS A SENIOR UI/UX DESIGNER & ART DIRECTOR.
      
      YOUR TASK: Create a PIXEL-PERFECT COPY of the layout structure of the REFERENCE IMAGE provided, but Apply the ${narrativeStyleInstruction} and ${baseRules} strictly.

      INPUTS:
      1. REFERENCE IMAGE (Style/Structure Source): The vertical layout structure (Header, Hero, Feature Bubbles, Offer Box).
      2. PRODUCT IMAGE (Content Source): The user's product to insert.
      3. TARGET LANGUAGE: ${formData.language}
      4. TARGET MARKET: ${formData.country}

      INSTRUCTIONS:
      1. 📐 LAYOUT CLONING: Analyze the vertical sections of the Reference Image. RECREATE this exact structural flow (e.g., If reference has 3 bubbles, make 3 bubbles).
      2. 🎨 STYLE & ATMOSPHERE:
         - IGNORE the reference image's specific colors if they clash with the USER PRODUCT.
         - Instead, ADAPT the reference style to match the USER PRODUCT'S COLOR PALETTE (as per 'narrativeStyleInstruction').
         - Ensure the result is RICH, DENSE, and SEAMLESS.
      3. 🔄 CONTENT SWAP & COPYWRITING:
         - Replace the product in the reference with the provided USER PRODUCT (Integrate naturally).
         - Replace original text with HIGH-CONVERTING marketing copy in [${formData.language}].
         - **OFFER SECTION:** Must include the Price: "${formData.price} ${formData.currency}" and Payment Icons: "${paymentInstruction}".
         - ${hasDiscount ? 'Add a Discount Badge.' : ''}
      4. ⛔ STRICT COMPLIANCE:
         - **NO IMMODESTY:** If the reference shows immodest models, REPLACE them with modest ones (Long sleeves) as per 'baseRules'.
         - **NO FAKE TEXT:** Do not fake user names. Use generic badges.

      OUTPUT: A Single, Seamless, Vertical, 4K High-Converting E-Commerce Strip.
      `;

            const result = await generateImage({
                prompt: prompt,
                referenceImage: referenceImage, // Logic: Reference is Style
                productImage: productImage,     // Logic: Product is Insert
                aspectRatio: "9:16",
                imageSize: "4K"
            });

            setResultImage(result);

            if (isPaidUser) {
                saveHistoryItem({
                    tool: 'clone-creative',
                    results: result,
                    inputs: { formData: { ...formData } }
                });
            }

        } catch (err: any) {
            console.error("Clone failed", err);
            if (auth.currentUser) {
                await WalletService.refundPoints(auth.currentUser.uid, cost, "Refund: Clone Failed", undefined, 1);
            }
            setError(err.message || "Failed to generate design.");
        } finally {
            setIsLoading(false);
            isSubmittingRef.current = false;
        }
    };

    return (
        <div className="max-w-5xl mx-auto p-4 lg:p-8 animate-fade-in">
            {/* Header */}
            <div className="mb-8 border-b border-slate-200 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900 mb-2">{t('clone_title')}</h2>
                    <p className="text-slate-600">{t('clone_desc')}</p>
                </div>
                <UsageLimitsCard userProfile={userProfile} compact />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column: Inputs */}
                <div className="space-y-6">
                    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-6">

                        {/* 1. Reference Image Upload */}
                        <div>
                            <label className="block text-sm font-bold text-slate-800 mb-2">{t('ref_landing_upload')}</label>
                            <label className={`cursor-pointer flex flex-col items-center justify-center h-48 border-2 border-dashed rounded-xl transition-all relative overflow-hidden ${referenceImage ? 'border-violet-500 bg-violet-50' : 'border-slate-300 hover:border-violet-400 hover:bg-slate-50'}`}>
                                {referenceImage ? (
                                    <>
                                        <img src={`data:image/png;base64,${referenceImage}`} className="absolute inset-0 w-full h-full object-contain p-2" />
                                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                            <span className="bg-white px-3 py-1 rounded-full text-xs font-bold">Change</span>
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center p-4">
                                        <span className="text-4xl mb-2 block">📑</span>
                                        <span className="text-sm font-medium text-slate-600">Upload Reference Layout</span>
                                        <span className="text-xs text-slate-400 block mt-1">10MB Max</span>
                                    </div>
                                )}
                                <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, setReferenceImage)} className="hidden" />
                            </label>
                        </div>

                        {/* 2. Product Image Upload */}
                        <div>
                            <label className="block text-sm font-bold text-slate-800 mb-2">{t('product_upload')}</label>
                            <label className={`cursor-pointer flex flex-col items-center justify-center h-32 border-2 border-dashed rounded-xl transition-all relative overflow-hidden ${productImage ? 'border-emerald-500 bg-emerald-50' : 'border-slate-300 hover:border-emerald-400 hover:bg-slate-50'}`}>
                                {productImage ? (
                                    <>
                                        <img src={`data:image/png;base64,${productImage}`} className="absolute inset-0 w-full h-full object-contain p-2" />
                                        <div className="relative z-10 bg-white/90 px-3 py-1 rounded-full shadow-sm text-xs font-bold text-emerald-600">{t('loaded')}</div>
                                    </>
                                ) : (
                                    <div className="text-center">
                                        <span className="text-2xl mb-1 block">📸</span>
                                        <span className="text-xs font-medium text-slate-500">Your Product</span>
                                    </div>
                                )}
                                <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, setProductImage)} className="hidden" />
                            </label>
                        </div>

                        {/* 3. Product Details */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-1">
                                <label className="block text-xs font-bold text-slate-700 mb-1">{t('price')} *</label>
                                <input
                                    type="number"
                                    name="price"
                                    value={formData.price}
                                    onChange={handleChange}
                                    placeholder="e.g. 2900"
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                                    required
                                />
                            </div>
                            <div className="col-span-1">
                                <label className="block text-xs font-bold text-slate-700 mb-1">{t('currency')}</label>
                                <select name="currency" value={formData.currency} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
                                    <option value="DZD">DZD (Algerian Dinar)</option>
                                    <option value="MAD">MAD (Moroccan Dirham)</option>
                                    <option value="TND">TND (Tunisian Dinar)</option>
                                    <option value="SAR">SAR (Saudi Riyal)</option>
                                    <option value="AED">AED (UAE Dirham)</option>
                                    <option value="QAR">QAR (Qatari Riyal)</option>
                                    <option value="USD">USD ($)</option>
                                    <option value="EUR">EUR (€)</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-1">
                                <label className="block text-xs font-bold text-slate-700 mb-1">Payment Method</label>
                                <select name="paymentMethod" value={formData.paymentMethod} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
                                    <option value="cod">Cash on Delivery 🏠</option>
                                    <option value="online">Online Payment 💳</option>
                                </select>
                            </div>
                            <div className="col-span-1 flex items-center pt-6">
                                <label className="flex items-center space-x-2 cursor-pointer">
                                    <input type="checkbox" name="discount" checked={formData.discount} onChange={handleCheckboxChange} className="rounded text-violet-600 focus:ring-violet-500" />
                                    <span className="text-xs font-bold text-slate-700">Add Discount Badge?</span>
                                </label>
                            </div>
                        </div>

                        {/* 4. Settings */}
                        <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">{t('country') || 'Target Market'}</label>
                                <select name="country" value={formData.country} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
                                    {Object.values(Country).map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">{t('language')}</label>
                                <select name="language" value={formData.language} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
                                    {Object.values(Language).map(l => <option key={l} value={l}>{l}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading || !productImage || !referenceImage}
                            className={`w-full py-4 text-white font-bold rounded-xl shadow-lg transition-all transform hover:scale-[1.02] flex items-center justify-center gap-3 relative overflow-hidden
                    ${isLoading || !productImage || !referenceImage ? 'bg-slate-300 cursor-not-allowed' : 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:shadow-indigo-500/30'}`}
                        >
                            {isLoading ? (
                                <>
                                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                                    <span>{t('processing')}</span>
                                </>
                            ) : (
                                <>
                                    <span>✨ {t('clone_btn')}</span>
                                    <div className="flex items-center gap-1 bg-white/20 px-2 py-0.5 rounded-full text-sm">
                                        <span>{cost}</span>
                                        <CoinIcon className="w-4 h-4 text-amber-300" />
                                    </div>
                                </>
                            )}
                        </button>

                        {error && (
                            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2">
                                <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                {error}
                            </div>
                        )}
                    </form>
                </div>

                {/* Right Column: Result */}
                <div className="flex flex-col gap-6">
                    <div className={`flex-1 min-h-[500px] bg-slate-100 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center relative overflow-hidden group ${resultImage ? 'bg-slate-900 border-none' : ''}`}>
                        {resultImage ? (
                            <>
                                <img src={resultImage} className="w-full h-full object-contain" />
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                                    <button onClick={() => setReferenceImage(null)} className="p-3 bg-white/10 text-white rounded-full backdrop-blur-md hover:bg-white/20" title="Clear">
                                        🔄
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="text-center text-slate-400 p-8">
                                <div className="w-20 h-20 bg-slate-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                                    <span className="text-4xl grayscale opacity-50">🖼️</span>
                                </div>
                                <p className="font-medium">{t('ready_to_design_desc')}</p>
                            </div>
                        )}
                    </div>

                    {/* Download Actions */}
                    {resultImage && (
                        <div className="grid grid-cols-2 gap-3 animate-fade-in-up">
                            <div className="flex flex-col gap-1">
                                <button
                                    onClick={() => handleDownload('png')}
                                    className="py-3 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-900 transition-colors flex items-center justify-center gap-2 w-full"
                                >
                                    <span>PNG</span>
                                </button>
                                <span className="text-[10px] text-center text-slate-400">⚠️ {t('large_file_size') || 'Large Size'}</span>
                            </div>

                            <div className="flex flex-col gap-1 relative">
                                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm z-10 whitespace-nowrap">
                                    ✨ {t('recommended') || 'Recommended'}
                                </div>
                                <button
                                    onClick={() => handleDownload('webp')}
                                    className="py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 w-full"
                                >
                                    <span>WEBP</span>
                                </button>
                                <span className="text-[10px] text-center text-indigo-600 font-medium">🚀 {t('fast_loading') || 'Fast'}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CloneCreativeTool;
