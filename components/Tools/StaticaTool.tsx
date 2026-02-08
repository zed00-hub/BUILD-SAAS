
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

interface StaticaToolProps {
    points: number;
    deductPoints: (amount: number, description: string, count?: number) => Promise<boolean>;
    isPaidUser: boolean;
    userProfile?: UserData | null;
}

const STYLES = [
    {
        id: 'showcase',
        label: 'Product Showcase',
        icon: '💎',
        desc: 'Focus on the product with isolated background and dramatic lighting.',
        prompt: 'STYLE: PRODUCT SHOWCASE. Create a high-end, studio-quality product shot. The background should be minimal or isolated to heavily emphasize the product. Use dramatic lighting (rim lighting, softbox) to highlight textures and curves. Focus: 100% on the product.'
    },
    {
        id: 'lifestyle',
        label: 'Lifestyle Context',
        icon: '🏡',
        desc: 'Product in a realistic, everyday use environment.',
        prompt: 'STYLE: LIFESTYLE CONTEXT. Place the product in a realistic, aspirational environment where it is being used naturally. The setting should imply a specific user persona and use case. Lighting should be natural and inviting (golden hour or bright daylight).'
    },
    {
        id: 'testimonial',
        label: 'Testimonial Style',
        icon: '💬',
        desc: 'Visuals that highlight customer feedback and trust.',
        prompt: 'STYLE: TESTIMONIAL. Design a layout that features the product alongside a visual representation of social proof. This could be a happy user holding the product, or a composition that leaves clear negative space for a quote (do not write the quote, just design the space). Mood: Trustworthy, Authentic.'
    },
    {
        id: 'comparison',
        label: 'Before/After & Comparison',
        icon: '⚖️',
        desc: 'Split-screen or comparison layout.',
        prompt: 'STYLE: BEFORE/AFTER COMPARISON. Create a split-screen composition. One side (Left/Top) represents the "Problem" (desaturated, chaotic) and the other side (Right/Bottom) represents the "Solution/Product" (bright, organized, solved). Use a visual divider. Focus on the transformation.'
    },
    {
        id: 'offer',
        label: 'Offer-Centric (Flash Sale)',
        icon: '🏷️',
        desc: 'High energy, bold colors, focus on discounts.',
        prompt: 'STYLE: OFFER-CENTRIC / FLASH SALE. High energy, vibrant design. Use bold, punchy colors (Red, Yellow, Neon). The composition should center the product but create dynamic zones for "50% OFF" or "LIMITED TIME" graphics (text can be simulated or implied). Aesthetics: Urgency, Excitement.'
    },
    {
        id: 'educational',
        label: 'Educational Infographic',
        icon: '🧠',
        desc: 'Explains benefits with icons and arrows.',
        prompt: 'STYLE: EDUCATIONAL INFOGRAPHIC. A clean, structured layout showing the product with "exploded view" elements or floating icons pointing to key features. Use lines, arrows, and glassmorphism panels to explain the tech/benefits. Style: Tech-forward, Clean, Informative.'
    },
    {
        id: 'minimalist',
        label: 'Minimalist Typography',
        icon: 'Aa',
        desc: 'Clean aesthetics with focus on typography and space.',
        prompt: 'STYLE: MINIMALIST TYPOGRAPHY. Ultra-clean, sophisticated design. Use massive amounts of negative space (white or solid color). The product plays with large, bold typographic elements (abstract letters). Style: Swiss Design, Editorial, Vogue-like.'
    },
    {
        id: 'ugc',
        label: 'UGC (Pseudo-Native)',
        icon: '📱',
        desc: 'Looks like a raw photo taken with a phone.',
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
    const [resultImage, setResultImage] = useState<string | null>(null);

    const [productImage, setProductImage] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        styleId: 'showcase',
        description: '',
        aspectRatio: '1:1' as any,
        colorPreference: '',
    });

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

    const handleGenerate = async () => {
        if (!productImage) {
            setError('Please upload a product image.');
            return;
        }

        setLoading(true);
        setError(null);

        // Check points
        const hasPoints = await deductPoints(GENERATION_COST, 'Statica Design Generation');
        if (!hasPoints) {
            setLoading(false);
            return;
        }

        try {
            const selectedStyle = STYLES.find(s => s.id === formData.styleId) || STYLES[0];

            const prompt = `
      ACT AS: "STATICA", an elite AI Art Director specialized in Conversion-Centered Design.
      
      YOUR TASK: Transform the provided product image into a professional advertising creative based on the following specifications.

      🎨 SELECTED STYLE: ${selectedStyle.label}
      ${selectedStyle.prompt}

      📦 PRODUCT CONTEXT:
      - Description/Angle: ${formData.description || 'Analyze the product and highlight its best features.'}
      - Color Palette: ${formData.colorPreference ? `Use this palette/mood: ${formData.colorPreference}` : 'EXTRACT and harmoniously apply the product\'s own color identity.'}

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

            const result = await generateImage({
                prompt,
                productImage,
                aspectRatio: formData.aspectRatio,
                imageSize: '4K',
            });

            setResultImage(result);

        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Generation failed');
            // Refund logic could go here
            if (auth.currentUser) {
                await WalletService.refundPoints(auth.currentUser.uid, GENERATION_COST, "Refund: Statica Failed");
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
                    <p className="text-slate-500 mt-2">Intelligent Ad Creative Generator • Smart Styles • Commercial Ready</p>
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
                                <label className="text-sm font-bold text-slate-800">1. Upload Product Image</label>
                                <div className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${productImage ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300 hover:border-indigo-400'}`}>
                                    {productImage ? (
                                        <div className="relative h-48 w-full">
                                            <img src={`data:image/png;base64,${productImage}`} className="w-full h-full object-contain mx-auto" alt="Product" />
                                            <button onClick={() => setProductImage(null)} className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-full transform translate-x-1/2 -translate-y-1/2 hover:bg-red-600">✕</button>
                                        </div>
                                    ) : (
                                        <label className="cursor-pointer block">
                                            <div className="text-4xl mb-2">📸</div>
                                            <span className="text-sm font-medium text-slate-600">Click to upload product</span>
                                            <input type="file" onChange={handleImageUpload} accept="image/*" className="hidden" />
                                        </label>
                                    )}
                                </div>
                            </div>

                            {/* Style Selection */}
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-800">2. Select Ad Style</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {STYLES.map(style => (
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
                                    {STYLES.find(s => s.id === formData.styleId)?.desc}
                                </p>
                            </div>

                            {/* Aspect Ratio */}
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-800">3. Format & Size</label>
                                <div className="flex gap-2">
                                    {ASPECT_RATIOS.map(ratio => (
                                        <button
                                            key={ratio.value}
                                            onClick={() => setFormData(prev => ({ ...prev, aspectRatio: ratio.value as any }))}
                                            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold border transition-all ${formData.aspectRatio === ratio.value ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                                        >
                                            {ratio.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Context & Details */}
                            <div className="space-y-3">
                                <label className="text-sm font-bold text-slate-800">4. Creative Details</label>
                                <textarea
                                    placeholder="Describe your product & objective (e.g., 'Luxury perfume, evening wear, mysterious vibe')..."
                                    value={formData.description}
                                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm min-h-[80px]"
                                />
                                <input
                                    type="text"
                                    placeholder="Color Preference (Optional, e.g., 'Pastel Pink & Gold')"
                                    value={formData.colorPreference}
                                    onChange={(e) => setFormData(prev => ({ ...prev, colorPreference: e.target.value }))}
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                />
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
                                    Generate Statica Design
                                    <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                                        {GENERATION_COST} <CoinIcon className="w-3 h-3" />
                                    </span>
                                </span>
                            </Button>

                        </div>
                    </div>
                </div>

                {/* Right Panel: Result */}
                <div className="lg:col-span-7">
                    <div className="bg-white rounded-2xl shadow-xl border border-slate-100 h-full min-h-[600px] p-8 flex flex-col items-center justify-center relative overflow-hidden group">
                        {resultImage ? (
                            <div className="w-full h-full flex flex-col items-center animate-fade-in z-10">
                                <img
                                    src={resultImage}
                                    alt="Generated Creative"
                                    className="max-h-[600px] w-auto object-contain rounded-lg shadow-2xl ring-1 ring-slate-900/5 mb-6"
                                />
                                <div className="flex gap-4">
                                    <a
                                        href={resultImage}
                                        download={`statica-${Date.now()}.png`}
                                        className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-black transition-all flex items-center gap-2"
                                    >
                                        <span>⬇️ Download PNG</span>
                                    </a>
                                    {isPaidUser && (
                                        <SaveToCloudButton
                                            images={[resultImage]}
                                            designType="social-media" // Reusing category
                                            metadata={{
                                                style: formData.styleId,
                                                ratio: formData.aspectRatio,
                                                app: 'STATICA'
                                            }}
                                        />
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="text-center z-10 opacity-60">
                                <div className="text-8xl mb-6 grayscale opacity-20">⚡</div>
                                <h3 className="text-2xl font-bold text-slate-800 mb-2">Ready to Design</h3>
                                <p className="text-slate-500 max-w-md mx-auto">
                                    Upload a product, select a style, and let STATICA generate professional ad creatives in seconds.
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
        </div>
    );
};
