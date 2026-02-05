
import React, { useState, useEffect } from 'react';
import { Country, Language, HistoryItem } from '../../types';
import { UserData } from '../../src/types/dbTypes';
import { Button } from '../Button';
import { fileToBase64, generateImage, editGeneratedImage, stitchImagesVertically } from '../../services/geminiService';
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
    reviews: '', // New field for expert reviews
    pageType: 'standard' as 'standard' | 'extended', // الوضع العادي أو الموسع
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

  // التكلفة تعتمد على نوع الصفحة: عادية 30، موسعة 45 (1.5×)
  const generationCost = formData.pageType === 'extended' ? 45 : 30;
  const editCost = 10;

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
    if (isSubmittingRef.current) return; // STOP double clicks immediately

    if (!productImage) {
      setError("Product image is required.");
      return;
    }

    if (formData.showPrice && !formData.price) {
      setError("Please enter the product price or uncheck 'Show Price'.");
      return;
    }

    isSubmittingRef.current = true; // LOCK
    setIsLoading(true);
    setError(null);
    setResultImage(null);

    const hasPoints = await deductPoints(generationCost, `Generate Landing Page ${formData.pageType === 'extended' ? '(Extended)' : ''}`);
    if (!hasPoints) {
      setIsLoading(false);
      isSubmittingRef.current = false; // UNLOCK
      return;
    }

    try {
      let paymentInstruction = "";
      if (formData.paymentMethod === 'cod') {
        paymentInstruction = "Include prominent icons/badges for 'Cash on Delivery' (الدفع عند الاستلام).";
      } else if (formData.paymentMethod === 'online') {
        paymentInstruction = "Include secure payment icons (Visa/Mastercard).";
      } else {
        paymentInstruction = "Include trust badges for both Secure Payment and Cash on Delivery.";
      }

      // STRICT PRICE LOGIC
      const priceInstruction = formData.showPrice && formData.price
        ? `السعر: ${formData.price} ${formData.currency}`
        : "⛔ ممنوع عرض السعر نهائياً. (DO NOT SHOW ANY PRICE).";

      const hasDiscount = formData.discount && parseInt(formData.discount) > 0;
      const hasReviews = formData.reviews && formData.reviews.trim().length > 0;

      const languageInstruction = formData.language === Language.Arabic
        ? `🔴 TARGET LANGUAGE: ARABIC (العربية الفصحى). 
           - RULE 1: ALL TEXT MUST BE IN ARABIC.
           - RULE 2: IF the user provided reviews/descriptions in English/French, TRANSLATE THEM TO PROFESSIONAL MARKETING ARABIC IMMEDIATELY.
           - RULE 3: Use RTL layout logic for text alignment.`
        : formData.language === Language.French
          ? "🔴 TARGET LANGUAGE: FRENCH (Français). TRANSLATE ALL USER INPUTS TO FRENCH."
          : "🔴 TARGET LANGUAGE: ENGLISH. TRANSLATE ALL USER INPUTS TO ENGLISH.";

      const baseRules = `
      🚨 CRITICAL RULES (ZERO TOLERANCE):
      1. ⛔ NO BUTTONS: Do NOT draw "Buy Now" buttons. This is an informational graphic.
      2. ⛔ NO WEBSITE UI: No browser frames, no scrollbars, no navigation menus.
      3. ⛔ NO IMMODESTY: Models MUST wear modest, loose clothing (Long sleeves). Family-friendly atmosphere.
      4. ⛔ NO META-TEXT: Do NOT write "SECTION 1", "HERO", "STRUCTURE", or any layout instructions on the image. Only write the actual marketing copy (Headline, Description, Price).
      5. ✅ LANGUAGE ADHERENCE: The entire image MUST be in [${formData.language}]. Translate any user inputs to [${formData.language}] automatically.
      6. ✅ ULTRA HIGH QUALITY: 4K resolution, sharp details, professional studio lighting.

      📦 PRODUCT INFO:
      - Description: ${formData.description || 'Analyze image'}
      - ${languageInstruction}
      ${hasReviews ? `- Reviews to Translate & Display: "${formData.reviews}"` : ''}
      
      🎨 ART DIRECTION & STYLE:
      - Vibe: Commercial Advertising, High-End Packaging Design.
      - Lighting: Studio brightness, soft shadows.
      - Colors: Fresh and Vivid (match product branding).
      - Textures: Glossy, Clean.
      `;

      let result: string;

      if (formData.pageType === 'extended') {
        // ===== النسخة الموسعة: صورتين متكاملتين ثم دمج =====

        // الصورة الأولى: Hero Section + Before/After (تفاصيل غنية)
        const prompt1 = `Design the UPPER HALF of a PREMIUM VERTICAL E-COMMERCE INFOGRAPHIC.
        ${baseRules}

        📐 THIS IMAGE CONTAINS (Top to Bottom):

        SECTION 1: [PREMIUM TRUST HEADER]
        - Luxurious header strip with gradient background.
        - 4 trust icons with elegant styling: [🚚 التوصيل السريع] [🛡️ ضمان الجودة] [✅ رضا مضمون] [💳 دفع آمن].
        - Subtle gold/silver accents.

        SECTION 2: [HERO COMPOSITION - EXPANDED]
        - DOMINANT Visual: Ultra-large 3D render of the PRODUCT (60% of this section).
        - Rich Context: A happy person (MODESTLY DRESSED - full coverage, long sleeves) demonstrating the product in an elegant setting.
        - Floating Elements: Golden sparkles, light rays, quality stamps.
        - Main Headline: Big, bold Arabic text with drop shadow effect.
        - Sub-headline: Supporting text explaining the core benefit.

        SECTION 3: [BEFORE/AFTER TRANSFORMATION - DETAILED]
        - Style: Dramatic split-screen with diagonal divider.
        - BEFORE Side (Left/Gray):
          * Detailed visualization of the problem.
          * Sad/tired expression, dull colors.
          * Red X marks or warning icons.
          * Label: "قبل" with timestamp styling.
        - AFTER Side (Right/Vibrant):
          * Detailed visualization of the solution.
          * Happy expression, vibrant colors, glow effects.
          * Green checkmarks, sparkle effects.
          * Label: "بعد" with success styling.
        - Large Gold/Green arrow with "التحول" text.
        - Include real transformation statistics if applicable.

        ⚠️ IMPORTANT: This is the TOP HALF only. End with a subtle visual transition (gradient fade) at the bottom for seamless stitching.
        `;

        // الصورة الثانية: Authority + Ingredients/Mechanism (تفاصيل غنية)
        const prompt2 = `Design the LOWER HALF of a PREMIUM VERTICAL E-COMMERCE INFOGRAPHIC.
        ${baseRules}
        - ${priceInstruction}
        ${hasDiscount ? `- Discount Badge: ${formData.discount}% (Use a luxurious circular badge)` : ''}

        📐 THIS IMAGE CONTAINS (Top to Bottom):

        ⚠️ START: Begin with a subtle visual transition (gradient fade) at the top for seamless stitching with the upper half.

        SECTION 4: [AUTHORITY & SOCIAL PROOF - EXPANDED]
        - Background: Premium gradient section.
        - Star Ratings: Large 5-star display with review count.
        - Customer Testimonials: 2-3 quote boxes with customer photos (modest dress).
        - Trust Badges: "مختبر سريرياً" / "معتمد" / "الأكثر مبيعاً".
        - Statistics: "10,000+ عميل راضٍ" style counters.
        - Expert Endorsement section if applicable.

        SECTION 5: [INGREDIENTS/MECHANISM - DETAILED CIRCLES]
        - Layout: 4-5 Large Circular Frames in elegant arrangement.
        - Each Circle Contains:
          * High-quality zoomed detail of product component.
          * Arabic label below with benefit description.
          * Subtle glow/ring effect around circles.
        - Connecting lines/arrows showing how components work together.
        - "كيف يعمل؟" section title with decorative styling.

        SECTION 6: [PREMIUM OFFER FOOTER]
        - Luxurious box with gradient background.
        - Price Display: Large, bold, with original price struck through if discount.
        - ${priceInstruction}
        ${hasDiscount ? `- Discount Badge: -${formData.discount}% in a premium circular design.` : ''}
        - ${paymentInstruction}
        - Quality seals, warranty badges, limited time offer styling.
        - Final CTA text (not button): "اطلب الآن ووفر!".
        `;

        // توليد الصورتين بالتوازي
        const [image1, image2] = await Promise.all([
          generateImage({
            prompt: prompt1,
            referenceImage: productImage,
            logoImage: logoImage || undefined,
            aspectRatio: "9:16",
            imageSize: "4K"
          }),
          generateImage({
            prompt: prompt2,
            referenceImage: productImage,
            logoImage: logoImage || undefined,
            aspectRatio: "9:16",
            imageSize: "4K"
          })
        ]);

        // دمج الصورتين عمودياً
        result = await stitchImagesVertically([image1, image2]);

      } else {
        // ===== النسخة العادية: صورة واحدة =====
        const prompt = `Design a PREMIUM VERTICAL E-COMMERCE INFOGRAPHIC (Long Marketing Strip).
        ${baseRules}
        - ${priceInstruction}
        ${hasDiscount ? `- Discount Badge: ${formData.discount}% (Use a circular badge, NOT a button)` : ''}

        📐 LAYOUT STRUCTURE (Must follow this EXACT sequence from Top to Bottom):

        SECTION 1: [TOP TRUST STRIP]
        - A narrow solid color strip at the very top.
        - 3 small floating icons in a row: [🚚 Fast Shipping] [🛡️ Secure Payment] [✅ Satisfaction Guarantee].
        - No text other than the icon labels.

        SECTION 2: [HERO COMPOSITION]
        - Main Visual: Large 3D render of the PRODUCT in a realistic home setting.
        - Context: A happy person (MODESTLY DRESSED) using the product or smiling near it.
        - Text: Big, bold Arabic Headline floating in empty space (e.g., "The Perfect Solution").

        SECTION 3: [VISUAL TRANSFORMATION]
        - Style: A "Split Screen" or "Arrow Flow" visual.
        - Content: 
          * Left Side (Gray/Dull): The "Problem" (e.g., dirty floor, tired face). Label: "BEFORE".
          * Right Side (Bright/Vibrant): The "Solution" (e.g., clean floor, glowing face). Label: "AFTER".
        - Connecting Element: A large Gold/Green arrow pointing from Before to After.

        SECTION 4: [KEY FEATURES - CIRCLES]
        - Layout: A row of 3 or 4 Circular Frames (Bubbles) at the bottom.
        - Content: Inside each circle, show a zoomed-in detail of the product (e.g., Texture, Mechanism, Ingredients).
        - Labels: Short Arabic text under each circle.

        SECTION 5: [OFFER FOOTER]
        - A distinct colored box at the bottom.
        - Content: The Price (Large Font) + Quality Seal Badge.
        - background: Clean, contrasting color (e.g., Deep Blue or Gold).

        FINAL CHECKLIST:
        - Is it vertical? YES.
        - Are there buttons? NO.
        - Is the text Arabic? YES.
        - Are the women modest? YES.
        `;

        result = await generateImage({
          prompt,
          referenceImage: productImage,
          logoImage: logoImage || undefined,
          aspectRatio: "9:16",
          imageSize: "4K"
        });
      }

      setResultImage(result);

      if (isPaidUser) {
        saveHistoryItem({
          tool: 'landing',
          results: result,
          inputs: { formData: { ...formData } }
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
      isSubmittingRef.current = false; // UNLOCK
    }
  };

  const handleEdit = async () => {
    if (!resultImage || !editInstruction) return;

    // Prevent double charge
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;

    setIsEditing(true);
    const hasPoints = await deductPoints(editCost, "Edit Landing Page");
    if (!hasPoints) {
      setIsEditing(false);
      isSubmittingRef.current = false; // UNLOCK
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
      isSubmittingRef.current = false; // UNLOCK
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
                <label className="block text-sm font-bold text-slate-800">{t('page_type') || 'نوع الصفحة'}</label>
                <div className="grid grid-cols-2 gap-3">
                  <label
                    className={`cursor-pointer p-4 rounded-xl border-2 transition-all ${formData.pageType === 'standard'
                      ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200'
                      : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
                      }`}
                  >
                    <input
                      type="radio"
                      name="pageType"
                      value="standard"
                      checked={formData.pageType === 'standard'}
                      onChange={handleChange}
                      className="hidden"
                    />
                    <div className="text-center">
                      <div className="text-2xl mb-2">📄</div>
                      <div className="font-bold text-slate-800 text-sm">{t('standard_page') || 'عادية'}</div>
                      <div className="text-xs text-slate-500 mt-1">{t('standard_desc') || 'صورة واحدة شاملة'}</div>
                      <div className="mt-2 inline-flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-full">
                        <span className="text-xs font-bold text-slate-700">30</span>
                        <CoinIcon className="w-3 h-3 text-amber-500" />
                      </div>
                    </div>
                  </label>

                  <label
                    className={`cursor-pointer p-4 rounded-xl border-2 transition-all relative overflow-hidden ${formData.pageType === 'extended'
                      ? 'border-violet-500 bg-violet-50 ring-2 ring-violet-200'
                      : 'border-slate-200 hover:border-violet-300 hover:bg-slate-50'
                      }`}
                  >
                    <div className="absolute top-0 right-0 bg-gradient-to-r from-violet-500 to-purple-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-bl-lg">PRO</div>
                    <input
                      type="radio"
                      name="pageType"
                      value="extended"
                      checked={formData.pageType === 'extended'}
                      onChange={handleChange}
                      className="hidden"
                    />
                    <div className="text-center">
                      <div className="text-2xl mb-2">📑</div>
                      <div className="font-bold text-slate-800 text-sm">{t('extended_page') || 'موسعة'}</div>
                      <div className="text-xs text-slate-500 mt-1">{t('extended_desc') || 'صورتين مدمجتين بتفاصيل أكثر'}</div>
                      <div className="mt-2 inline-flex items-center gap-1 bg-violet-100 px-2 py-1 rounded-full">
                        <span className="text-xs font-bold text-violet-700">45</span>
                        <CoinIcon className="w-3 h-3 text-amber-500" />
                      </div>
                    </div>
                  </label>
                </div>

                {formData.pageType === 'extended' && (
                  <div className="bg-violet-50 border border-violet-100 rounded-lg p-3 text-xs text-violet-800 animate-fade-in">
                    <div className="font-bold mb-1">✨ {t('extended_features') || 'مميزات النسخة الموسعة:'}</div>
                    <ul className="space-y-1 list-disc list-inside text-violet-700">
                      <li>{t('ext_feat_1') || 'Hero Section + Before/After بتفاصيل غنية'}</li>
                      <li>{t('ext_feat_2') || 'Authority & Social Proof موسع'}</li>
                      <li>{t('ext_feat_3') || 'Ingredients/Mechanism مع دوائر تفصيلية'}</li>
                      <li>{t('ext_feat_4') || 'دمج تلقائي لصورتين عالية الجودة'}</li>
                    </ul>
                  </div>
                )}
              </div>

              {/* Targeting */}
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
                  <label className="block text-sm font-bold text-slate-800 mb-1 flex items-center gap-2">
                    {t('prod_desc_label')}
                    <span className="text-xs font-normal text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{t('optional') || 'اختياري'}</span>
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder={t('prod_desc_ph_optional') || 'اترك فارغاً ليقوم الذكاء الاصطناعي باستخراج الوصف تلقائياً من صورة المنتج...'}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 min-h-[80px]"
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

                {/* Reviews */}
                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-1">{t('expert_reviews_label')}</label>
                  <textarea
                    name="reviews"
                    value={formData.reviews}
                    onChange={handleChange}
                    placeholder={t('expert_reviews_ph')}
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
