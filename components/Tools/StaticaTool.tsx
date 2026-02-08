
import React, { useState } from 'react';
import { Button } from '../Button';
import { fileToBase64, generateImage } from '../../services/geminiService';
import { CoinIcon } from '../CoinIcon';
import { useLanguage } from '../../contexts/LanguageContext';
import { WalletService } from '../../src/services/walletService';
import { auth } from '../../src/firebase';
import { UserData } from '../../src/types/dbTypes';
import { SaveToCloudButton } from '../SaveToCloudButton';
import { UsageLimitsCard } from '../UsageLimitsCard';
import { Country, Language } from '../../types';

interface StaticaToolProps {
    points: number;
    deductPoints: (amount: number, description: string, count?: number) => Promise<boolean>;
    isPaidUser: boolean;
    userProfile?: UserData | null;
}

const getStyles = (t: any) => [
    {
        id: 'showcase',
        label: t('style_showcase'),
        icon: '💎',
        desc: t('style_desc_showcase'),
        prompt: 'STYLE: PRODUCT SHOWCASE. Create a high-end, studio-quality product shot. The background should be minimal or isolated to heavily emphasize the product. Use dramatic lighting (rim lighting, softbox) to highlight textures and curves. Focus: 100% on the product.'
    },
    {
        id: 'lifestyle',
        label: t('style_lifestyle'),
        icon: '🏡',
        desc: t('style_desc_lifestyle'),
        prompt: 'STYLE: LIFESTYLE CONTEXT. Place the product in a realistic, aspirational environment where it is being used naturally. The setting should imply a specific user persona and use case. Lighting should be natural and inviting (golden hour or bright daylight).'
    },
    {
        id: 'testimonial',
        label: t('style_testimonial'),
        icon: '💬',
        desc: t('style_desc_testimonial'),
        prompt: 'STYLE: TESTIMONIAL. Design a layout that features the product alongside a visual representation of social proof. This could be a happy user holding the product, or a composition that leaves clear negative space for a quote (do not write the quote, just design the space). Mood: Trustworthy, Authentic.'
    },
    {
        id: 'comparison',
        label: t('style_comparison'),
        icon: '⚖️',
        desc: t('style_desc_comparison'),
        prompt: 'STYLE: BEFORE/AFTER COMPARISON. Create a split-screen composition. One side (Left/Top) represents the "Problem" (desaturated, chaotic) and the other side (Right/Bottom) represents the "Solution/Product" (bright, organized, solved). Use a visual divider. Focus on the transformation.'
    },
    {
        id: 'offer',
        label: t('style_offer'),
        icon: '🏷️',
        desc: t('style_desc_offer'),
        prompt: 'STYLE: OFFER-CENTRIC / FLASH SALE. High energy, vibrant design. Use bold, punchy colors (Red, Yellow, Neon). The composition should center the product but create dynamic zones for "50% OFF" or "LIMITED TIME" graphics (text can be simulated or implied). Aesthetics: Urgency, Excitement.'
    },
    {
        id: 'educational',
        label: t('style_educational'),
        icon: '🧠',
        desc: t('style_desc_educational'),
        prompt: 'STYLE: EDUCATIONAL INFOGRAPHIC. A clean, structured layout showing the product with "exploded view" elements or floating icons pointing to key features. Use lines, arrows, and glassmorphism panels to explain the tech/benefits. Style: Tech-forward, Clean, Informative.'
    },
    {
        id: 'minimalist',
        label: t('style_minimalist'),
        icon: 'Aa',
        desc: t('style_desc_minimalist'),
        prompt: 'STYLE: MINIMALIST TYPOGRAPHY. Ultra-clean, sophisticated design. Use massive amounts of negative space (white or solid color). The product plays with large, bold typographic elements (abstract letters). Style: Swiss Design, Editorial, Vogue-like.'
    },
    {
        id: 'ugc',
        label: t('style_ugc'),
        icon: '📱',
        desc: t('style_desc_ugc'),
        prompt: 'STYLE: UGC / PSEUDO-NATIVE. The image must look like a RAW photo taken with an iPhone 15 Pro. Slightly imperfect framing, realistic lighting (not studio), maybe a hand holding the product. It should feel "native" to Instagram/TikTok feed. Authentic, Unfiltered vibe.'
    }
];

const ASPECT_RATIOS = [
    { value: '1:1', label: 'Square (1:1)' },
    { value: '9:16', label: 'Story (9:16)' },
    { value: '16:9', label: 'Landscape (16:9)' },
    { value: '4:5', label: 'Portrait (4:5)' },
] as const;

export const StaticaTool: React.FC<StaticaToolProps> = ({ points, deductPoints, isPaidUser, userProfile }) => {
    const { t } = useLanguage();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [resultImages, setResultImages] = useState<string[]>([]);

    const [productImage, setProductImage] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        styleId: 'showcase',
        description: '',
        ratios: { '1:1': 0, '9:16': 0, '16:9': 0, '4:5': 0 } as Record<string, number>,
        colorPreference: '',
        price: '',
        reviewText: '',
        country: Country.Algeria,
        language: Language.Arabic,
    });
    const [logoImage, setLogoImage] = useState<string | null>(null);

    const GENERATION_COST = 25;

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            try {
                const base64 = await fileToBase64(e.target.files[0]);
                setProductImage(base64);
                setError(null);
            } catch (err) {
                setError('Failed to load image');
            }
        }
    };

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            try {
                const base64 = await fileToBase64(e.target.files[0]);
                setLogoImage(base64);
            } catch (err) {
                console.error('Failed to load logo');
            }
        }
    };

    const calculateTotalCost = () => {
        const totalImages = Object.values(formData.ratios).reduce((a: number, b: number) => a + b, 0);
        return totalImages * GENERATION_COST;
    };

    const handleGenerate = async () => {
        const totalImages = Object.values(formData.ratios).reduce((a: number, b: number) => a + b, 0);

        if (!productImage) {
            setError(t('upload_image_error') || 'Please upload a product image.');
            return;
        }

        if (totalImages === 0) {
            setError(t('select_ratio_error') || 'Please select at least one image format.');
            return;
        }

        setLoading(true);
        setError(null);
        setResultImages([]);

        // Check points
        const totalCost = calculateTotalCost();
        const hasPoints = await deductPoints(totalCost, `Statica Generation (${totalImages} images)`);

        if (!hasPoints) {
            setLoading(false);
            return;
        }

        try {
            const STYLES = getStyles(t);
            const selectedStyle = STYLES.find(s => s.id === formData.styleId) || STYLES[0];

            const basePrompt = `
      ACT AS: "STATICA", an elite AI Art Director specialized in Conversion-Centered Design.
      
      YOUR TASK: Transform the provided product image into a professional advertising creative based on the following specifications.

      🌍 TARGET AUDIENCE:
      - Country/Market: ${formData.country}
      - Language: ${formData.language} (Ensure ALL text is in ${formData.language} unless specified otherwise).
      - Cultural Nuance: Adapt visuals and models (if any) to respect local customs of ${formData.country}.

      🎨 SELECTED STYLE: ${selectedStyle.label}
      ${selectedStyle.prompt}

      📦 PRODUCT CONTEXT:
      - Description/Angle: ${formData.description || 'Analyze the product and highlight its best features.'}
      - Color Palette: ${formData.colorPreference ? `Use this palette/mood: ${formData.colorPreference}` : 'EXTRACT and harmoniously apply the product\'s own color identity.'}
      ${formData.price ? `- PRICE ELEMENT: distinctively display the price "${formData.price}" in a modern, elegant font.` : ''}
      ${formData.reviewText ? `- SOCIAL PROOF: prominently feature this review: "${formData.reviewText}". Use a quote style layout.` : ''}
      ${logoImage ? `- BRANDING: Place the provided LOGO in a standard branding position (top center, top left, or bottom right) with clear visibility.` : ''}

      💎 GLOBAL STYLE INSPIRATION (GOD-TIER):
      - Aesthetics: High-End Cosmetic / Luxury Editorial.
      - Typography: Use Bold Serif fonts for headlines (Vogue/Harper's Bazaar style) mixed with clean Sans-Serif for body text.
      - Layout: Structured, balanced, using "Problem/Solution" or "Benefit" framing where appropriate.
      - Backgrounds: Clean, solid, or soft gradients (Beige, Pastel Pink, Soft Blue, Cream).
      - Product Presentation: Floating, on a podium, or dynamic spill.
      
      🛡️ SAFETY & ETHICS (STRICT):
      - **NO TABARRUJ**: Do NOT generate images of women or human figures unless absolutely necessary for context (e.g., a hand holding the product).
      - If a human element is required, use ONLY hands/arms. NO faces, NO bodies.
      - Focus purely on the product, nature elements (leaves, water drops, silk), and abstract shapes.

      📐 DESIGN LOGIC (MANDATORY):
      1. **Rule of Thirds:** Place the focal point (product) off-center or balance it with visual weight (text/elements) to create dynamic tension.
      2. **Visual Hierarchy:** Ensure the Product is King. Secondary elements (background, props) must support, not distract.
      3. **Depth & Dimension:** Use intelligent drop shadows (contact shadows for realism, floating shadows for "pop") and atmospheric depth.
      4. **Color Harmony:** Background colors must complement the product to make it "pop". Avoid clashing colors.
      5. **Text Space:** ${selectedStyle.id === 'ugc' ? 'No layout for text needed.' : 'Leave clear, unobscured "Safe Zones" (negative space) where the user can overlay text later.'}

      ⛔ NEGATIVE CONSTRAINTS:
      - Do NOT distort the product logo or text.
      - Do NOT create messy, cluttered backgrounds (unless specified by UGC style).
      - Do NOT add buttons or fake UI elements.
      - Do NOT add standard "Lorem Ipsum" text; keep it visual or use abstract shapes.

      OUTPUT QUALITY: 4K, Commercial Grade, Sharp Focus.
      `;

            // Prepare generation tasks
            const generationTasks: Promise<string>[] = [];

            Object.entries(formData.ratios).forEach(([ratio, count]) => {
                for (let i = 0; i < count; i++) {
                    generationTasks.push(
                        generateImage({
                            prompt: basePrompt,
                            productImage,
                            logoImage: logoImage || undefined,
                            aspectRatio: ratio as any,
                            imageSize: '4K',
                        })
                    );
                }
            });

            // Execute all generations in parallel
            // Note: Use Promise.allSettled to handle partial failures if needed, 
            // but for simplicity we use Promise.all and refund on total failure or handle individually.
            // Let's use Promise.all for speed.
            const results = await Promise.all(generationTasks);
            setResultImages(results);

        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Generation failed');
            // Refund logic
            if (auth.currentUser) {
                await WalletService.refundPoints(auth.currentUser.uid, totalCost, "Refund: Statica Partial/Full Failure");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto p-4 lg:p-8 animate-fade-in">
            {/* Header */}
            <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
                        <span className="text-4xl">⚡</span> STATICA <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">BETA</span>
                    </h1>
                    <p className="text-slate-500 mt-2">{t('statica_desc')}</p>
                </div>
                <UsageLimitsCard userProfile={userProfile} compact />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* Left Panel: Configuration */}
                <div className="lg:col-span-5 space-y-6">
                    <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
                        <div className="p-6 space-y-6">

                            {/* Image Upload */}
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-800">{t('upload_product_image')}</label>
                                <div className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${productImage ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300 hover:border-indigo-400'}`}>
                                    {productImage ? (
                                        <div className="relative h-48 w-full">
                                            <img src={`data:image/png;base64,${productImage}`} className="w-full h-full object-contain mx-auto" alt="Product" />
                                            <button onClick={() => setProductImage(null)} className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-full transform translate-x-1/2 -translate-y-1/2 hover:bg-red-600">✕</button>
                                        </div>
                                    ) : (
                                        <label className="cursor-pointer block">
                                            <div className="text-4xl mb-2">📸</div>
                                            <span className="text-sm font-medium text-slate-600">{t('click_und_upload')}</span>
                                            <input type="file" onChange={handleImageUpload} accept="image/*" className="hidden" />
                                        </label>
                                    )}
                                </div>
                            </div>

                            {/* Style Selection */}
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-800">{t('select_ad_style')}</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {getStyles(t).map(style => (
                                        <button
                                            key={style.id}
                                            onClick={() => setFormData(prev => ({ ...prev, styleId: style.id }))}
                                            className={`p-3 rounded-xl border text-left transition-all hover:shadow-md ${formData.styleId === style.id ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500' : 'border-slate-200 hover:border-indigo-200'}`}
                                        >
                                            <div className="text-xl mb-1">{style.icon}</div>
                                            <div className="font-bold text-xs text-slate-800">{style.label}</div>
                                        </button>
                                    ))}
                                </div>
                                <p className="text-xs text-slate-500 mt-1 italic">
                                    {getStyles(t).find(s => s.id === formData.styleId)?.desc}
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <label className="text-sm font-bold text-slate-800">{t('format_size')}</label>
                                    <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded-lg font-bold">
                                        Total: {Object.values(formData.ratios).reduce((a: number, b: number) => a + b, 0)} {t('images') || 'Images'}
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    {ASPECT_RATIOS.map(ratio => (
                                        <div key={ratio.value} className={`p-3 rounded-xl border transition-all flex flex-col justify-between ${formData.ratios[ratio.value] > 0 ? 'border-indigo-500 bg-indigo-50/50' : 'border-slate-200 bg-white'}`}>
                                            <span className="text-xs font-bold text-slate-700 mb-2">{ratio.label}</span>
                                            <div className="flex items-center justify-between bg-white rounded-lg border border-slate-200 p-1">
                                                <button
                                                    onClick={() => setFormData(prev => ({ ...prev, ratios: { ...prev.ratios, [ratio.value]: Math.max(0, prev.ratios[ratio.value] - 1) } }))}
                                                    className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                                                >-</button>
                                                <span className="font-bold text-slate-800 w-6 text-center">{formData.ratios[ratio.value]}</span>
                                                <button
                                                    onClick={() => setFormData(prev => ({ ...prev, ratios: { ...prev.ratios, [ratio.value]: prev.ratios[ratio.value] + 1 } }))}
                                                    className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                                                >+</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Market & Language */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">{t('target_country') || 'Target Country'}</label>
                                    <select
                                        value={formData.country}
                                        onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value as Country }))}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                                    >
                                        {Object.values(Country).map((c) => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">{t('language') || 'Language'}</label>
                                    <select
                                        value={formData.language}
                                        onChange={(e) => setFormData(prev => ({ ...prev, language: e.target.value as Language }))}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                                    >
                                        {Object.values(Language).map((l) => (
                                            <option key={l} value={l}>{l}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Context & Details */}
                            <div className="space-y-3">
                                <label className="text-sm font-bold text-slate-800">{t('creative_details')}</label>
                                <textarea
                                    placeholder={t('describe_product_ph')}
                                    value={formData.description}
                                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm min-h-[80px]"
                                />
                                <input
                                    type="text"
                                    placeholder={t('color_pref_ph')}
                                    value={formData.colorPreference}
                                    onChange={(e) => setFormData(prev => ({ ...prev, colorPreference: e.target.value }))}
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                />
                            </div>

                            {/* 5. Optional Customizations */}
                            <div className="space-y-4 pt-4 border-t border-slate-100">
                                <label className="text-sm font-bold text-slate-800 flex items-center justify-between cursor-pointer" onClick={() => document.getElementById('opt-custom')?.classList.toggle('hidden')}>
                                    <span>5. Optional Customizations</span>
                                    <span className="text-xs text-indigo-600">(Price, Review, Logo) ▼</span>
                                </label>
                                <div id="opt-custom" className="space-y-3 hidden animate-fade-in">
                                    {/* Price */}
                                    <div>
                                        <label className="text-xs font-semibold text-slate-600 mb-1 block">{t('price_ph') || 'Price'} (Optional)</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. $49.99"
                                            value={formData.price}
                                            onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                                            className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                        />
                                    </div>
                                    {/* Review */}
                                    <div>
                                        <label className="text-xs font-semibold text-slate-600 mb-1 block">{t('expert_reviews_label')}</label>
                                        <textarea
                                            placeholder={t('expert_reviews_ph')}
                                            value={formData.reviewText}
                                            onChange={(e) => setFormData(prev => ({ ...prev, reviewText: e.target.value }))}
                                            className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm min-h-[60px]"
                                        />
                                    </div>
                                    {/* Logo */}
                                    <div>
                                        <label className="text-xs font-semibold text-slate-600 mb-1 block">{t('logo_opt')}</label>
                                        <div className={`border border-dashed rounded-xl p-3 text-center transition-all ${logoImage ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300 hover:border-indigo-400'}`}>
                                            {logoImage ? (
                                                <div className="relative h-12 flex items-center justify-center">
                                                    <img src={`data:image/png;base64,${logoImage}`} className="h-full object-contain" alt="Logo" />
                                                    <button onClick={() => setLogoImage(null)} className="ml-2 text-red-500 text-xs font-bold">✕</button>
                                                </div>
                                            ) : (
                                                <label className="cursor-pointer flex items-center justify-center gap-2">
                                                    <span className="text-lg">🏢</span>
                                                    <span className="text-xs text-slate-500">Upload Logo</span>
                                                    <input type="file" onChange={handleLogoUpload} accept="image/*" className="hidden" />
                                                </label>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {error && (
                                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100">
                                    {error}
                                </div>
                            )}

                            <Button
                                onClick={handleGenerate}
                                isLoading={loading}
                                className="w-full py-4 text-lg shadow-indigo-200 shadow-xl"
                                disabled={!productImage}
                            >
                                <span className="flex items-center gap-2">
                                    {t('generate_statica')}
                                    <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                                        {calculateTotalCost()} <CoinIcon className="w-3 h-3" />
                                    </span>
                                </span>
                            </Button>

                        </div>
                    </div>
                </div>

                {/* Right Panel: Result */}
                <div className="lg:col-span-7">
                    <div className="bg-white rounded-2xl shadow-xl border border-slate-100 h-full min-h-[600px] p-8 flex flex-col items-center relative overflow-hidden group">
                        {resultImages.length > 0 ? (
                            <div className="w-full h-full flex flex-col gap-6 animate-fade-in z-10 overflow-y-auto max-h-[800px] pr-2 custom-scrollbar">

                                <div className="flex justify-between items-center w-full mb-2">
                                    <h3 className="text-xl font-bold text-slate-800">{t('gallery_results') || 'Generated Designs'} ({resultImages.length})</h3>
                                    <div className="flex gap-2">
                                        {/* Download All Logic can be complex due to browser pop-up blockers, usually zip is better but for now individual or simple loop */}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                                    {resultImages.map((imgSrc, idx) => (
                                        <div key={idx} className="relative group/img rounded-xl overflow-hidden shadow-lg border border-slate-100 bg-slate-50">
                                            <img
                                                src={imgSrc}
                                                alt={`Generated Creative ${idx + 1}`}
                                                className="w-full h-auto object-cover"
                                            />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-sm">
                                                <a
                                                    href={imgSrc}
                                                    download={`statica-${Date.now()}-${idx}.png`}
                                                    className="p-2 bg-white text-slate-900 rounded-full hover:bg-indigo-50 transition-colors"
                                                    title={t('download_png') || "Download PNG"}
                                                >
                                                    ⬇️
                                                </a>
                                                {/* Preview / Expand could go here */}
                                            </div>
                                            <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-2 py-1 rounded backdrop-blur-md">
                                                #{idx + 1}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex gap-4 sticky bottom-0 bg-white/90 backdrop-blur p-4 border-t border-slate-100 w-full justify-center rounded-2xl shadow-lg mt-auto">
                                    {isPaidUser && (
                                        <SaveToCloudButton
                                            images={resultImages}
                                            designType="ad-creative"
                                            metadata={{
                                                style: formData.styleId,
                                                app: 'STATICA',
                                                count: resultImages.length
                                            }}
                                            className="w-full sm:w-auto"
                                        />
                                    )}
                                </div>

                            </div>
                        ) : (
                            <div className="text-center z-10 opacity-60 m-auto">
                                <div className="text-8xl mb-6 grayscale opacity-20">⚡</div>
                                <h3 className="text-2xl font-bold text-slate-800 mb-2">{t('ready_to_design')}</h3>
                                <p className="text-slate-500 max-w-md mx-auto">
                                    {t('ready_to_design_desc')}
                                </p>
                            </div>
                        )}

                        {/* Background Decoration */}
                        <div className="absolute inset-0 bg-slate-50/50 -z-0 pointer-events-none">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-100/50 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
                            <div className="absolute bottom-0 left-0 w-64 h-64 bg-violet-100/50 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2"></div>
                        </div>
                    </div>
                </div>

            </div>
        </div >
    );
};
