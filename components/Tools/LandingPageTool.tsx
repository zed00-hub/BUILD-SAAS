
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

    const hasPoints = await deductPoints(generationCost, `Generate Landing Page ${formData.pageType === 'extended' ? '(Extended)' : ''}`);
    if (!hasPoints) {
      setIsLoading(false);
      isSubmittingRef.current = false;
      return;
    }

    try {
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

      const priceInstruction = formData.showPrice
        ? `PRICE DISPLAY: Show the price "${formData.price} ${formData.currency}" clearly.`
        : "PRICE DISPLAY: Do NOT show a specific price. Focus on value.";

      const hasDiscount = !!formData.discount && formData.showPrice;
      const hasReviews = !!formData.reviews && formData.reviews.length > 5;

      // 3. Number Format Instruction
      const useLatinNumerals = [Country.Algeria, Country.Morocco, Country.Tunisia].includes(formData.country);
      const numberInstruction = useLatinNumerals
        ? "🔢 NUMERALS: MUST use Western Arabic Numerals (1234567890) ONLY. Do NOT use Eastern Arabic numerals (١٢٣)."
        : "";

      const baseRules = `
      🚨 CRITICAL RULES (ZERO TOLERANCE):
      1. ⛔ NO META-TEXT/LABELS (STRICT): Do NOT write "SECTION 1", "HERO", "PART 1", or any structural labels on the image. Only write the actual marketing copy.
      2. ⛔ NO BUTTONS: Do NOT draw "Buy Now" buttons. This is an informational graphic.
      3. ⛔ NO WEBSITE UI: No browser frames, no scrollbars, no navigation menus.
      4. ⛔ NO IMMODESTY (STRICT): Models MUST wear modest, loose clothing (Long sleeves, High necklines). AVOID any skin exposure or tight clothing. Family-friendly atmosphere is MANDATORY.
      5. ⛔ NO FAKE REVIEWS: If no specific review text is provided below, DO NOT invent fake customer quotes. Use generic trust badges (e.g., "5 Stars", "Trusted Choice") instead.
      6. ✅ MARKETING FOCUS: Focus on PAIN POINTS vs. SOLUTIONS. Use visual storytelling to show the *benefit* not just the features.
      7. ✅ LANGUAGE ADHERENCE: ${languageInstruction}
      8. ✅ ETHNICITY & LOCALIZATION: ${ethnicityInstruction}
      9. ✅ NUMBER FORMAT: ${numberInstruction}
      10. ✅ ULTRA HIGH QUALITY: 4K resolution, sharp details, professional studio lighting.

      📦 PRODUCT INFO:
      - Description: ${formData.description || 'Analyze image to identify key marketing angles and benefits'}
      ${hasReviews ? `- Reviews to Display: "${formData.reviews}" (Present these EXACTLY as customer quotes)` : '- NO CUSTOMER REVIEWS PROVIDED. Do NOT create fake quotes. Focus on Star Ratings and Trust Badges only.'}
      
      🎨 ART DIRECTION & STYLE:
      - Vibe: Commercial Advertising, High-End Packaging Design, Persuasive.
      - Lighting: Studio brightness, soft shadows.
      - Colors: Fresh and Vivid (match product branding).
      - Textures: Glossy, Clean.
      `;

      const narrativeStyleInstruction = `
      🎨 VISUAL STYLE & COLOR CONSISTENCY (CRITICAL - SUPER SATURATED):
      - **EXTREME COMPOSITION DENSITY:** NO WHITE SPACE. Every pixel must be filled with rich textures, gradients, or background elements. "Busy but organized" aesthetic.
      - **VIBRANT & SATURATED:** Use PUNCHY, CONTRASTING colors. Allow colors to pop neon-bright where appropriate for the product. Think "High-End Advertising" meets "TikTok Visuals".
      - **SEAMLESS VERTICALITY:** Sections must BLEED into each other. No hard white dividers. Use gradients to transition between the Hero and the Split-Screen.
      - **GLOSSY & PREMIUM:** Everything should look shiny, expensive, and 3D rendered.
      - **TEXT IMPACT:** Fonts should be HUGE, BOLD, and have heavy drop shadows or outlines to stand out against the busy backgrounds.
      `;

      let result: string;

      if (formData.pageType === 'extended') {
        // ===== EXTENDED EDITION (Two merged images) =====
        // "صورتين متناسقتين كل قسمين في صورة" -> 2 Images x 2 Sections each = 4 Distinct Sections.

        const splitStyleInstruction = `
        🎨 VISUAL STRUCTURE: STRICT 50/50 SPLIT (Classic Vertical Rhythm)
        - This image must be visually divided into TWO DISTINCT EQUAL HALVES (Top 50% and Bottom 50%).
        - SEAMLESS TRANSITION: Use a soft gradient or texture bleed to connect the two halves. Do NOT use hard white lines.
        - ATMOSPHERE: High-End, Magazine Quality, Commercial yet Authentic.
        `;

        // Image 1: The Hook & The Logic (Hero + Before/After)
        // Image 1: The Hook & The Logic (Hero + Before/After)
        const prompt1 = `PART 1 of 2: TOP HALF of the Landing Page.
        ${narrativeStyleInstruction}
        ${splitStyleInstruction}
        ${baseRules}

        CONTENTS (Top to Bottom):

        🔻 [TOP 50%] - VISUAL INSTRUCTION (Use Full Width):
        - **Visual:** A Cinematic, fully immersive product shot in a real-life context (${ethnicityInstruction}).
        - **Focus:** Capture the "Spirit" and "Vibe" of the product. If it's cozy, make it warm. If it's tech, make it sleek.
        - **Elements:** 
           - Massive, 3D Headline in [${formData.language}] centered or distinct.
           - Product shining with studio lighting.
           - Trust badges (small) at the very top.

        🔻 [BOTTOM 50%] - VISUAL INSTRUCTION (Use Split Layout):
        - **Visual:** A powerful "Split-Screen" comparison.
        - **Structure:**
           - LEFT: The "Old Way" (Gray, Problematic). Label: "BEFORE" (in ${formData.language}).
           - RIGHT: The "New Way" (Bright, Solved with Product). Label: "AFTER" (in ${formData.language}).
        - **Style:** Clean, convincing transformation visual. Labels in [${formData.language}].
        
        ⚠️ IMPORTANT: Ideally, show the user's problem disappearing.
        ⛔ NEGATIVE CONSTRAINT: Do NOT write "Hero", "Section 1", "Part 1" on the image.
        `;

        // Image 2: The Trust & The Deal (Social + Ingredients/Offer)
        // Image 2: The Trust & The Deal (Social + Ingredients/Offer)
        const prompt2 = `PART 2 of 2: BOTTOM HALF of the Landing Page.
        ${narrativeStyleInstruction}
        ${splitStyleInstruction}
        ${baseRules}
        
        CONTENTS (Top to Bottom):

        🔻 [TOP 50%] - VISUAL INSTRUCTION (Social Proof Zone):
        - **Layout:** ${hasReviews ? 'A dedicated "Wall of Love" or "Testimonial Section".' : 'A sleek "Trust & Authority" section with Badges & Logos.'}
        - **CONTENT:** ${hasReviews ? 'You MUST display the specific user reviews provided below in CHAT BUBBLES or CARDS.' : 'Do NOT invent reviews. Display only "Trusted by 10k+" badge, 5-Star Icons, and potentially Media Logos.'}
        - **TEXT TO WRITE:**
          ${hasReviews ? `"${formData.reviews}" (DISTRIBUTE these sentences into 2-3 visual bubbles/cards).` : 'Use generic terms like "Excellent Quality", "Recommended", "Top Rated". NO FAKE QUOTES.'}
        - **Visuals:** ${hasReviews ? 'User avatars + bubbles.' : 'Shield icons, Checkmarks, Gold Seals.'}

        🔻 [BOTTOM 50%] - VISUAL INSTRUCTION (Offer & Mechanism):
        - **Visual:** A technical or detailed breakdown (Ingredients/Mechanism) combined with the Final Offer.
        - **Components:**
           1. **Mechanism/Ingredients:** 3 Circular "Lens" bubbles showing what's inside (Micro-zoom).
           2. **The Offer:** A distinct box with:
              - **PRICE:** Giant "${priceInstruction}".
              - **CTA:** A huge "Order Now" button graphic in ${formData.language}.
              - **Trust:** ${paymentInstruction} icons.

        ⚠️ INTEGRATION NOTE: The Top of this image (Section 3) must blend seamlessly with the Bottom of the previous image (Section 2).
        ⛔ NEGATIVE CONSTRAINT: Do NOT write "Section", "Offer", "Part 2" labels on the image.
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
        // ===== STANDARD EDITION (Single Image) =====
        const prompt = `Design a COMPLETE, seamless vertical E-Commerce Infographic (Long Strip) for ${formData.country}.
        ${narrativeStyleInstruction}
        ${baseRules}

        VISUAL NARRATIVE (Continuous Vertical Flow - DO NOT PRINT STRUCTURE LABELS):

        [TOP STRIP]: A sleek trust strip with 3 small icons (Shipping, Warranty, Guarantee).
        
        [HERO ZONE]: A Vivid, fully realized scene showing the PRODUCT + HAPPY PERSON (${ethnicityInstruction}, Modest) in a relevant setting. Big captivating Arabic Headline.

        [TRANSFORMATION ZONE]: A soft-blended Split-View. 
           - Left: "Before" (Dull/Problem). 
           - Right: "After" (Bright/Solution). 
           - Connected by a flowing stylistic Arrow.

        [FEATURE BUBBLES]: 3 Circular close-ups floating on a textured background, showing product details.

        [OFFER FOOTER]: A distinct, bold bottom section (Darker background).
           - Large Price Display (${priceInstruction}).
           - ${hasDiscount ? 'Discount Badge.' : ''}
           - Trust Seals & "${paymentInstruction}" icons.
           - Final Call-To-Action text.

        ⚠️ CRITICAL: The entire image must look like ONE cohesive design. Use color gradients to blend sections. Do NOT use white borders between sections.
        ⛔ NEGATIVE CONSTRAINT: Do NOT write "Hero", "Section", "Header" labels on the image.
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
                {/* Critical Download Warning */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-center shadow-sm">
                  <p className="text-amber-900 font-bold text-sm">⚠️ Please download your result immediately. We do not save your files.</p>
                  <p className="text-amber-900 font-bold text-sm mt-2 font-arabic" dir="rtl">⚠️ يرجى تحميل النتيجة فوراً. نحن لا نقوم بحفظ الملفات تلقائياً.</p>
                  <p className="text-amber-900 font-bold text-sm mt-2">⚠️ Veuillez télécharger votre résultat immédiatement. Nous ne sauvegardons pas vos fichiers.</p>
                </div>
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
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => handleDownload('png')}
                        className="py-3 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-900 transition-colors flex items-center justify-center gap-2 w-full"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        {t('download_png')}
                      </button>
                      <span className="text-[10px] text-center text-slate-400">⚠️ {t('large_file_size') || 'حجم ملف كبير'}</span>
                    </div>

                    <div className="flex flex-col gap-1 relative">
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm z-10 whitespace-nowrap">
                        ✨ {t('recommended') || 'موصى به للويب'}
                      </div>
                      <button
                        onClick={() => handleDownload('webp')}
                        className="py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 w-full"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        {t('download_webp')}
                      </button>
                      <span className="text-[10px] text-center text-indigo-600 font-medium">🚀 {t('fast_loading') || 'سريع التحميل'}</span>
                    </div>
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
