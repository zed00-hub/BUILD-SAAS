import React, { useState, useRef } from 'react';
import { Button } from '../Button';
import { fileToBase64 } from '../../services/geminiService';
import { UserData } from '../../src/types/dbTypes';
import { CoinIcon } from '../CoinIcon';
import { useLanguage } from '../../contexts/LanguageContext';
import { UsageLimitsCard } from '../UsageLimitsCard';
import { WalletService } from '../../src/services/walletService';
import { auth, functions } from '../../src/firebase';
import { httpsCallable } from 'firebase/functions';

interface ProductDescriptionToolProps {
    points: number;
    deductPoints: (amount: number, description: string, count?: number) => Promise<boolean>;
    isPaidUser: boolean;
    userProfile?: UserData | null;
}

type DescriptionStyle = 'professional' | 'casual' | 'luxury' | 'minimalist' | 'storytelling';
type DescriptionTone = 'formal' | 'friendly' | 'persuasive' | 'informative' | 'exciting';
type OutputLength = 'short' | 'medium' | 'long';

interface GeneratedDescription {
    title: string;
    shortDescription: string;
    fullDescription: string;
    features: string[];
    keywords: string[];
    targetAudience: string;
    suggestedPrice?: string;
    marketingAngle: string;
}

export const ProductDescriptionTool: React.FC<ProductDescriptionToolProps> = ({
    points,
    deductPoints,
    isPaidUser,
    userProfile
}) => {
    const { t, language } = useLanguage();
    const isRtl = language === 'ar';

    // State
    const [productImage, setProductImage] = useState<string | null>(null);
    const [additionalContext, setAdditionalContext] = useState('');
    const [descriptionStyle, setDescriptionStyle] = useState<DescriptionStyle>('professional');
    const [tone, setTone] = useState<DescriptionTone>('persuasive');
    const [outputLength, setOutputLength] = useState<OutputLength>('medium');
    const [targetLanguage, setTargetLanguage] = useState<'ar' | 'en' | 'fr'>('ar');
    const [includeEmojis, setIncludeEmojis] = useState(false);
    const [includeSEO, setIncludeSEO] = useState(true);

    const [generatedContent, setGeneratedContent] = useState<GeneratedDescription | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copiedField, setCopiedField] = useState<string | null>(null);

    const resultsRef = useRef<HTMLDivElement>(null);

    const cost = 15; // Cost per description generation

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            try {
                const base64 = await fileToBase64(e.target.files[0]);
                setProductImage(base64);
                setGeneratedContent(null);
                setError(null);
            } catch (err) {
                console.error("Error converting image", err);
            }
        }
    };

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!productImage) {
            setError(isRtl ? 'يرجى رفع صورة المنتج أولاً' : 'Please upload a product image first');
            return;
        }

        const hasPoints = await deductPoints(cost, 'Generate Product Description');
        if (!hasPoints) return;

        setIsGenerating(true);
        setError(null);
        setGeneratedContent(null);

        const langMap = { ar: 'Arabic', en: 'English', fr: 'French' };
        const styleDescriptions = {
            professional: 'Professional and business-oriented',
            casual: 'Casual and conversational',
            luxury: 'Luxury and premium-feeling',
            minimalist: 'Minimalist and clean',
            storytelling: 'Story-driven and emotional'
        };
        const toneDescriptions = {
            formal: 'formal and respectful',
            friendly: 'friendly and approachable',
            persuasive: 'persuasive and compelling',
            informative: 'informative and educational',
            exciting: 'exciting and energetic'
        };
        const lengthDescriptions = {
            short: '50-100 words for short description, 150-200 for full',
            medium: '100-150 words for short description, 300-400 for full',
            long: '150-200 words for short description, 500-700 for full'
        };

        const prompt = `You are an expert e-commerce copywriter and product analyst.
    
Analyze the product image provided and generate a comprehensive product description.

OUTPUT LANGUAGE: ${langMap[targetLanguage]} (All content MUST be in ${langMap[targetLanguage]})

STYLE: ${styleDescriptions[descriptionStyle]}
TONE: ${toneDescriptions[tone]}
LENGTH REQUIREMENT: ${lengthDescriptions[outputLength]}
${includeEmojis ? 'USE EMOJIS: Include relevant emojis throughout the content to make it engaging.' : 'NO EMOJIS: Do not use any emojis.'}
${includeSEO ? 'SEO OPTIMIZATION: Include SEO-friendly keywords naturally in the description.' : ''}

${additionalContext ? `ADDITIONAL CONTEXT FROM SELLER: ${additionalContext}` : ''}

REQUIREMENTS:
1. Analyze the product image thoroughly to identify the product type, features, materials, colors, and unique selling points.
2. Create a compelling product title that captures attention.
3. Write a short description suitable for social media or preview cards.
4. Write a full, detailed description for product pages.
5. Extract key features as bullet points.
6. Suggest relevant keywords for SEO and searchability.
7. Identify the target audience for this product.
8. Suggest a marketing angle or unique value proposition.
9. If possible, suggest a price range based on similar products (optional).

Be creative but accurate. Do not make up features that are not visible in the image.`;

        try {
            const generateContent = httpsCallable(functions, 'generateContent', { timeout: 120000 });
            const response = await generateContent({
                modelName: 'gemini-3-flash-preview',
                parts: [
                    {
                        inlineData: {
                            mimeType: 'image/jpeg',
                            data: productImage
                        }
                    },
                    { text: prompt }
                ],
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: "OBJECT",
                        properties: {
                            title: { type: "STRING", description: "Product title" },
                            shortDescription: { type: "STRING", description: "Short description for previews/social" },
                            fullDescription: { type: "STRING", description: "Full detailed product description" },
                            features: { type: "ARRAY", items: { type: "STRING" }, description: "Key product features as bullet points" },
                            keywords: { type: "ARRAY", items: { type: "STRING" }, description: "SEO keywords" },
                            targetAudience: { type: "STRING", description: "Target audience description" },
                            suggestedPrice: { type: "STRING", description: "Suggested price range (optional)" },
                            marketingAngle: { type: "STRING", description: "Unique marketing angle or value proposition" }
                        },
                        required: ["title", "shortDescription", "fullDescription", "features", "keywords", "targetAudience", "marketingAngle"]
                    }
                }
            });

            const data = response.data as { text: string };
            if (data.text) {
                const parsed = JSON.parse(data.text) as GeneratedDescription;
                setGeneratedContent(parsed);
                setTimeout(() => {
                    resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 100);
            } else {
                throw new Error('No content generated');
            }
        } catch (err: any) {
            console.error("Generation failed, refunding points...", err);
            if (auth.currentUser) {
                await WalletService.refundPoints(auth.currentUser.uid, cost, "Refund: Product Description Generation Failed");
            }
            setError(err.message || (isRtl ? 'فشل في توليد الوصف. تم استرداد النقاط.' : 'Failed to generate description. Points refunded.'));
        } finally {
            setIsGenerating(false);
        }
    };

    const copyToClipboard = (text: string, fieldName: string) => {
        navigator.clipboard.writeText(text);
        setCopiedField(fieldName);
        setTimeout(() => setCopiedField(null), 2000);
    };

    const downloadAsText = () => {
        if (!generatedContent) return;
        const content = `
${generatedContent.title}
${'='.repeat(50)}

📝 الوصف المختصر / Short Description:
${generatedContent.shortDescription}

📄 الوصف الكامل / Full Description:
${generatedContent.fullDescription}

✨ المميزات / Features:
${generatedContent.features.map(f => `• ${f}`).join('\n')}

🔍 الكلمات المفتاحية / Keywords:
${generatedContent.keywords.join(', ')}

🎯 الجمهور المستهدف / Target Audience:
${generatedContent.targetAudience}

💡 الزاوية التسويقية / Marketing Angle:
${generatedContent.marketingAngle}

${generatedContent.suggestedPrice ? `💰 السعر المقترح / Suggested Price: ${generatedContent.suggestedPrice}` : ''}
    `.trim();

        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'product-description.txt';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="max-w-6xl mx-auto p-4 lg:p-8 animate-fade-in">
            {/* Header */}
            <div className="mb-8 border-b border-slate-200 pb-6">
                <div className="flex items-center gap-3 mb-2">
                    <span className="text-4xl">📝</span>
                    <h2 className="text-3xl font-bold text-slate-900">
                        {isRtl ? 'مولّد وصف المنتج' : 'Product Description Generator'}
                    </h2>
                </div>
                <p className="text-slate-600">
                    {isRtl
                        ? 'حوّل صور منتجاتك إلى أوصاف احترافية وجذابة للبيع باستخدام الذكاء الاصطناعي.'
                        : 'Transform your product images into professional, compelling sales descriptions using AI.'}
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Input Form */}
                <div className="lg:col-span-5 space-y-6">
                    <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100">
                        <form onSubmit={handleGenerate} className="space-y-6">
                            {/* Image Upload */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    {isRtl ? 'صورة المنتج *' : 'Product Image *'}
                                </label>
                                <label className={`cursor-pointer flex flex-col items-center justify-center min-h-[180px] border-2 border-dashed rounded-2xl transition-all overflow-hidden ${productImage ? 'border-emerald-500 bg-emerald-50' : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'}`}>
                                    {productImage ? (
                                        <div className="relative w-full h-full">
                                            <img src={`data:image/jpeg;base64,${productImage}`} alt="Product" className="w-full h-48 object-contain p-2" />
                                            <div className="absolute bottom-0 left-0 right-0 bg-emerald-600 text-white text-center py-2 text-sm font-medium">
                                                {isRtl ? '✓ تم رفع الصورة - انقر للتغيير' : '✓ Image Uploaded - Click to Change'}
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <span className="text-5xl mb-3">📸</span>
                                            <span className="text-sm text-slate-500 text-center px-4">
                                                {isRtl ? 'انقر لرفع صورة المنتج' : 'Click to upload product image'}
                                            </span>
                                            <span className="text-xs text-slate-400 mt-1">PNG, JPG, WEBP</span>
                                        </>
                                    )}
                                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                                </label>
                            </div>

                            {/* Additional Context */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    {isRtl ? 'سياق إضافي (اختياري)' : 'Additional Context (Optional)'}
                                </label>
                                <textarea
                                    value={additionalContext}
                                    onChange={(e) => setAdditionalContext(e.target.value)}
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none min-h-[80px] bg-white text-slate-900 placeholder:text-slate-400"
                                    placeholder={isRtl ? 'معلومات إضافية عن المنتج مثل المادة، الحجم، العلامة التجارية...' : 'Additional info like material, size, brand name...'}
                                />
                            </div>

                            {/* Style Selection */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    {isRtl ? 'أسلوب الوصف' : 'Description Style'}
                                </label>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                    {([
                                        { value: 'professional', label: isRtl ? 'احترافي' : 'Professional', icon: '💼' },
                                        { value: 'casual', label: isRtl ? 'غير رسمي' : 'Casual', icon: '😊' },
                                        { value: 'luxury', label: isRtl ? 'فاخر' : 'Luxury', icon: '✨' },
                                        { value: 'minimalist', label: isRtl ? 'بسيط' : 'Minimalist', icon: '🎯' },
                                        { value: 'storytelling', label: isRtl ? 'قصصي' : 'Storytelling', icon: '📖' },
                                    ] as { value: DescriptionStyle; label: string; icon: string }[]).map((style) => (
                                        <button
                                            key={style.value}
                                            type="button"
                                            onClick={() => setDescriptionStyle(style.value)}
                                            className={`p-3 rounded-xl border-2 transition-all text-sm font-medium ${descriptionStyle === style.value
                                                ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                                                : 'border-slate-200 hover:border-indigo-300 text-slate-600'}`}
                                        >
                                            <span className="block text-lg mb-1">{style.icon}</span>
                                            {style.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Tone Selection */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    {isRtl ? 'نبرة الكتابة' : 'Writing Tone'}
                                </label>
                                <select
                                    value={tone}
                                    onChange={(e) => setTone(e.target.value as DescriptionTone)}
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-900"
                                >
                                    <option value="formal">{isRtl ? 'رسمي' : 'Formal'}</option>
                                    <option value="friendly">{isRtl ? 'ودود' : 'Friendly'}</option>
                                    <option value="persuasive">{isRtl ? 'مقنع' : 'Persuasive'}</option>
                                    <option value="informative">{isRtl ? 'معلوماتي' : 'Informative'}</option>
                                    <option value="exciting">{isRtl ? 'مثير' : 'Exciting'}</option>
                                </select>
                            </div>

                            {/* Output Language */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    {isRtl ? 'لغة الوصف' : 'Output Language'}
                                </label>
                                <div className="flex gap-2">
                                    {(['ar', 'en', 'fr'] as const).map((lang) => (
                                        <button
                                            key={lang}
                                            type="button"
                                            onClick={() => setTargetLanguage(lang)}
                                            className={`flex-1 py-3 px-4 rounded-xl border-2 transition-all font-medium ${targetLanguage === lang
                                                ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                                                : 'border-slate-200 hover:border-indigo-300 text-slate-600'}`}
                                        >
                                            {lang === 'ar' ? '🇩🇿 العربية' : lang === 'en' ? '🇺🇸 English' : '🇫🇷 Français'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Output Length */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    {isRtl ? 'طول الوصف' : 'Description Length'}
                                </label>
                                <div className="flex gap-2">
                                    {([
                                        { value: 'short', label: isRtl ? 'قصير' : 'Short' },
                                        { value: 'medium', label: isRtl ? 'متوسط' : 'Medium' },
                                        { value: 'long', label: isRtl ? 'طويل' : 'Long' }
                                    ] as { value: OutputLength; label: string }[]).map((len) => (
                                        <button
                                            key={len.value}
                                            type="button"
                                            onClick={() => setOutputLength(len.value)}
                                            className={`flex-1 py-3 px-4 rounded-xl border-2 transition-all font-medium ${outputLength === len.value
                                                ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                                                : 'border-slate-200 hover:border-indigo-300 text-slate-600'}`}
                                        >
                                            {len.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Toggles */}
                            <div className="space-y-3">
                                <label className="flex items-center justify-between p-3 bg-slate-50 rounded-xl cursor-pointer">
                                    <span className="text-sm font-medium text-slate-700">
                                        {isRtl ? 'تضمين الرموز التعبيرية 😊' : 'Include Emojis 😊'}
                                    </span>
                                    <input
                                        type="checkbox"
                                        checked={includeEmojis}
                                        onChange={(e) => setIncludeEmojis(e.target.checked)}
                                        className="w-5 h-5 text-indigo-600 rounded"
                                    />
                                </label>
                                <label className="flex items-center justify-between p-3 bg-slate-50 rounded-xl cursor-pointer">
                                    <span className="text-sm font-medium text-slate-700">
                                        {isRtl ? 'تحسين SEO 🔍' : 'SEO Optimization 🔍'}
                                    </span>
                                    <input
                                        type="checkbox"
                                        checked={includeSEO}
                                        onChange={(e) => setIncludeSEO(e.target.checked)}
                                        className="w-5 h-5 text-indigo-600 rounded"
                                    />
                                </label>
                            </div>

                            {/* Submit Button */}
                            <Button
                                type="submit"
                                isLoading={isGenerating}
                                disabled={!productImage}
                                className="w-full py-4 text-lg shadow-indigo-200"
                            >
                                {isGenerating ? (
                                    isRtl ? 'جاري التحليل والكتابة...' : 'Analyzing & Writing...'
                                ) : (
                                    <span className="flex items-center justify-center gap-2">
                                        {isRtl ? 'توليد الوصف' : 'Generate Description'}
                                        <span className="flex items-center gap-1 bg-white/20 px-2 py-1 rounded-lg">
                                            {cost} <CoinIcon className="w-4 h-4" />
                                        </span>
                                    </span>
                                )}
                            </Button>

                            {error && (
                                <div className="p-4 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">
                                    {error}
                                </div>
                            )}
                        </form>
                    </div>

                    <UsageLimitsCard userProfile={userProfile} compact />
                </div>

                {/* Results Column */}
                <div className="lg:col-span-7" ref={resultsRef}>
                    {generatedContent ? (
                        <div className="space-y-6 animate-fade-in">
                            {/* Header Actions */}
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-bold text-slate-800">
                                    {isRtl ? '📋 الوصف المولّد' : '📋 Generated Description'}
                                </h3>
                                <button
                                    onClick={downloadAsText}
                                    className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-700 transition-colors"
                                >
                                    {isRtl ? 'تحميل الكل' : 'Download All'}
                                </button>
                            </div>

                            {/* Title */}
                            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-6 rounded-2xl text-white shadow-xl">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <span className="text-xs font-bold uppercase tracking-wider opacity-75">
                                            {isRtl ? 'عنوان المنتج' : 'Product Title'}
                                        </span>
                                        <h2 className="text-2xl font-bold mt-1">{generatedContent.title}</h2>
                                    </div>
                                    <button
                                        onClick={() => copyToClipboard(generatedContent.title, 'title')}
                                        className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                                        title="Copy"
                                    >
                                        {copiedField === 'title' ? '✓' : '📋'}
                                    </button>
                                </div>
                            </div>

                            {/* Short Description */}
                            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                                <div className="flex items-start justify-between gap-4 mb-3">
                                    <span className="text-sm font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                                        {isRtl ? 'الوصف المختصر' : 'Short Description'}
                                    </span>
                                    <button
                                        onClick={() => copyToClipboard(generatedContent.shortDescription, 'short')}
                                        className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"
                                    >
                                        {copiedField === 'short' ? '✓ Copied!' : '📋'}
                                    </button>
                                </div>
                                <p className="text-slate-700 leading-relaxed">{generatedContent.shortDescription}</p>
                            </div>

                            {/* Full Description */}
                            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                                <div className="flex items-start justify-between gap-4 mb-3">
                                    <span className="text-sm font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                                        {isRtl ? 'الوصف الكامل' : 'Full Description'}
                                    </span>
                                    <button
                                        onClick={() => copyToClipboard(generatedContent.fullDescription, 'full')}
                                        className="p-2 text-slate-400 hover:text-emerald-600 transition-colors"
                                    >
                                        {copiedField === 'full' ? '✓ Copied!' : '📋'}
                                    </button>
                                </div>
                                <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{generatedContent.fullDescription}</p>
                            </div>

                            {/* Features */}
                            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                                <div className="flex items-start justify-between gap-4 mb-3">
                                    <span className="text-sm font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-full">
                                        {isRtl ? 'المميزات الرئيسية' : 'Key Features'}
                                    </span>
                                    <button
                                        onClick={() => copyToClipboard(generatedContent.features.join('\n• '), 'features')}
                                        className="p-2 text-slate-400 hover:text-amber-600 transition-colors"
                                    >
                                        {copiedField === 'features' ? '✓ Copied!' : '📋'}
                                    </button>
                                </div>
                                <ul className="space-y-2">
                                    {generatedContent.features.map((feature, idx) => (
                                        <li key={idx} className="flex items-start gap-3 text-slate-700">
                                            <span className="w-6 h-6 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">✓</span>
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Keywords */}
                            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                                <span className="text-sm font-bold text-purple-600 bg-purple-50 px-3 py-1 rounded-full mb-4 inline-block">
                                    {isRtl ? 'الكلمات المفتاحية (SEO)' : 'SEO Keywords'}
                                </span>
                                <div className="flex flex-wrap gap-2 mt-3">
                                    {generatedContent.keywords.map((keyword, idx) => (
                                        <span
                                            key={idx}
                                            onClick={() => copyToClipboard(keyword, `keyword-${idx}`)}
                                            className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-full text-sm cursor-pointer hover:bg-indigo-100 hover:text-indigo-700 transition-colors"
                                        >
                                            {keyword}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Target Audience & Marketing Angle */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-gradient-to-br from-cyan-50 to-teal-50 p-5 rounded-2xl border border-cyan-100">
                                    <span className="text-xs font-bold text-cyan-600 uppercase tracking-wider">
                                        {isRtl ? '🎯 الجمهور المستهدف' : '🎯 Target Audience'}
                                    </span>
                                    <p className="text-slate-700 mt-2 text-sm leading-relaxed">{generatedContent.targetAudience}</p>
                                </div>
                                <div className="bg-gradient-to-br from-rose-50 to-pink-50 p-5 rounded-2xl border border-rose-100">
                                    <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">
                                        {isRtl ? '💡 الزاوية التسويقية' : '💡 Marketing Angle'}
                                    </span>
                                    <p className="text-slate-700 mt-2 text-sm leading-relaxed">{generatedContent.marketingAngle}</p>
                                </div>
                            </div>

                            {/* Suggested Price (if available) */}
                            {generatedContent.suggestedPrice && (
                                <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-5 rounded-2xl text-white text-center">
                                    <span className="text-sm font-bold uppercase tracking-wider opacity-80">
                                        {isRtl ? '💰 السعر المقترح' : '💰 Suggested Price Range'}
                                    </span>
                                    <p className="text-2xl font-bold mt-1">{generatedContent.suggestedPrice}</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        !isGenerating && (
                            <div className="h-full min-h-[500px] flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
                                <div className="w-24 h-24 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mb-6">
                                    <span className="text-5xl">📝</span>
                                </div>
                                <p className="text-xl font-medium text-slate-500 mb-2">
                                    {isRtl ? 'ارفع صورة منتج للبدء' : 'Upload a product image to start'}
                                </p>
                                <p className="text-sm text-slate-400 text-center max-w-sm">
                                    {isRtl
                                        ? 'سيقوم الذكاء الاصطناعي بتحليل الصورة وكتابة وصف احترافي جاهز للنشر'
                                        : 'AI will analyze the image and write a professional, ready-to-publish description'}
                                </p>
                            </div>
                        )
                    )}

                    {/* Loading State */}
                    {isGenerating && (
                        <div className="h-full min-h-[500px] flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-indigo-100 rounded-3xl bg-indigo-50/30">
                            <div className="relative">
                                <div className="w-20 h-20 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                                <span className="absolute inset-0 flex items-center justify-center text-3xl">📝</span>
                            </div>
                            <p className="text-lg font-medium text-indigo-800 mt-6">
                                {isRtl ? '🔍 جاري تحليل المنتج وكتابة الوصف...' : '🔍 Analyzing product & writing description...'}
                            </p>
                            <p className="text-sm text-indigo-600 mt-2">
                                {isRtl ? 'قد يستغرق هذا بضع ثوانٍ' : 'This may take a few seconds'}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
