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
import { SaveToCloudButton } from '../SaveToCloudButton';

interface VirtualTryOnToolProps {
    points: number;
    deductPoints: (amount: number, description: string, count?: number) => Promise<boolean>;
    isPaidUser: boolean;
    userProfile?: UserData | null;
}

type ToolMode = 'virtual-tryon' | 'product-placement';

// Virtual Try-On Options
type ClothingType = 'tshirt' | 'shirt' | 'dress' | 'jacket' | 'pants' | 'full-outfit' | 'accessories' | 'shoes';
type ModelGender = 'male' | 'female' | 'unisex';
type ModelBodyType = 'slim' | 'average' | 'athletic' | 'plus-size';
type ModelSkinTone = 'light' | 'medium' | 'tan' | 'dark';

// Product Placement Options
type PlacementScene = 'living-room' | 'bedroom' | 'office' | 'kitchen' | 'outdoor' | 'studio' | 'nature' | 'urban' | 'minimalist' | 'luxury' | 'custom';
type LightingStyle = 'natural' | 'warm' | 'cool' | 'dramatic' | 'soft' | 'studio';
type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

// Scene Presets for quick selection
const SCENE_PRESETS = {
    'living-room': { en: 'Living Room', ar: 'غرفة المعيشة', icon: '🛋️' },
    'bedroom': { en: 'Bedroom', ar: 'غرفة النوم', icon: '🛏️' },
    'office': { en: 'Office', ar: 'المكتب', icon: '💼' },
    'kitchen': { en: 'Kitchen', ar: 'المطبخ', icon: '🍳' },
    'outdoor': { en: 'Outdoor Garden', ar: 'حديقة خارجية', icon: '🌳' },
    'studio': { en: 'Studio', ar: 'استوديو', icon: '📸' },
    'nature': { en: 'Nature', ar: 'طبيعة', icon: '🏔️' },
    'urban': { en: 'Urban Street', ar: 'شارع حضري', icon: '🏙️' },
    'minimalist': { en: 'Minimalist', ar: 'بسيط', icon: '⬜' },
    'luxury': { en: 'Luxury', ar: 'فاخر', icon: '✨' },
    'custom': { en: 'Custom Scene', ar: 'مشهد مخصص', icon: '🎨' }
};

export const VirtualTryOnTool: React.FC<VirtualTryOnToolProps> = ({
    points,
    deductPoints,
    isPaidUser,
    userProfile
}) => {
    const { language } = useLanguage();
    const isRtl = language === 'ar';

    // Mode Selection
    const [mode, setMode] = useState<ToolMode>('virtual-tryon');

    // Common State
    const [productImage, setProductImage] = useState<string | null>(null);
    const [modelImage, setModelImage] = useState<string | null>(null); // For try-on: person image
    const [generatedImages, setGeneratedImages] = useState<string[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [variationCount, setVariationCount] = useState(2);

    // Virtual Try-On State
    const [clothingType, setClothingType] = useState<ClothingType>('tshirt');
    const [modelGender, setModelGender] = useState<ModelGender>('female');
    const [modelBodyType, setModelBodyType] = useState<ModelBodyType>('average');
    const [modelSkinTone, setModelSkinTone] = useState<ModelSkinTone>('medium');
    const [useCustomModel, setUseCustomModel] = useState(false);
    const [modelPose, setModelPose] = useState('standing-front');

    // Product Placement State
    const [placementScene, setPlacementScene] = useState<PlacementScene>('living-room');
    const [customSceneDescription, setCustomSceneDescription] = useState('');
    const [lightingStyle, setLightingStyle] = useState<LightingStyle>('natural');
    const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('afternoon');
    const [cameraAngle, setCameraAngle] = useState('eye-level');
    const [additionalProps, setAdditionalProps] = useState('');

    const resultsRef = useRef<HTMLDivElement>(null);

    const costPerVariation = 25;
    const totalCost = costPerVariation * variationCount;

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
        if (e.target.files && e.target.files[0]) {
            try {
                const base64 = await fileToBase64(e.target.files[0]);
                setter(base64);
                setGeneratedImages([]);
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

        if (mode === 'virtual-tryon' && useCustomModel && !modelImage) {
            setError(isRtl ? 'يرجى رفع صورة الموديل أو إيقاف خيار "استخدام صورتي"' : 'Please upload a model image or disable "Use My Image"');
            return;
        }

        const hasPoints = await deductPoints(totalCost, `${mode === 'virtual-tryon' ? 'Virtual Try-On' : 'Product Placement'} x${variationCount}`, variationCount);
        if (!hasPoints) return;

        setIsGenerating(true);
        setError(null);
        setGeneratedImages([]);

        try {
            const generateContent = httpsCallable(functions, 'generateContent', { timeout: 300000 });
            const images: string[] = [];

            for (let i = 0; i < variationCount; i++) {
                let prompt = '';
                const parts: any[] = [];

                // Add product image
                parts.push({
                    inlineData: {
                        mimeType: 'image/jpeg',
                        data: productImage
                    }
                });

                if (mode === 'virtual-tryon') {
                    // Virtual Try-On Prompt
                    if (useCustomModel && modelImage) {
                        parts.push({
                            inlineData: {
                                mimeType: 'image/jpeg',
                                data: modelImage
                            }
                        });
                        prompt = `VIRTUAL TRY-ON TASK:
You are given TWO images:
1. FIRST IMAGE: A clothing item/product that needs to be worn
2. SECOND IMAGE: A real person/model who will wear the product

YOUR TASK: Generate a PHOTOREALISTIC image of the person in the second image wearing the clothing item from the first image.

CRITICAL REQUIREMENTS:
- The person's face, body proportions, and overall appearance MUST remain EXACTLY the same
- The clothing MUST fit naturally on the person's body
- Preserve ALL details of the clothing: color, texture, pattern, fabric appearance
- The lighting on the clothing should match the lighting on the person
- Shadows and creases should look natural and realistic
- The clothing should have proper depth and dimension
- This is variation ${i + 1} of ${variationCount} - maintain consistency but allow slight natural pose variations
- Output must be ULTRA HIGH QUALITY, photorealistic, no artifacts

POSE: ${modelPose}
CLOTHING TYPE: ${clothingType}

DO NOT change the person's face, hair, or body shape. ONLY add/replace clothing.`;
                    } else {
                        // Generate model
                        prompt = `VIRTUAL TRY-ON / FASHION SHOWCASE:
Generate a PHOTOREALISTIC image of a model wearing the clothing item shown in the provided image.

MODEL SPECIFICATIONS:
- Gender: ${modelGender}
- Body Type: ${modelBodyType}
- Skin Tone: ${modelSkinTone}
- Pose: ${modelPose}

CLOTHING ITEM: ${clothingType}

REQUIREMENTS:
- Create a realistic fashion photography image
- The model should look natural and professional
- The clothing MUST be the EXACT item from the input image (same colors, patterns, details)
- Use a clean, professional background suitable for e-commerce
- Studio-quality lighting that highlights the clothing
- Full body or appropriate framing based on clothing type
- This is variation ${i + 1} of ${variationCount} - vary the pose/angle slightly for each
- ULTRA HIGH QUALITY output, no artifacts

The goal is to create a professional product photography image suitable for an online store.`;
                    }
                } else {
                    // Product Placement Prompt
                    const sceneDesc = placementScene === 'custom' ? customSceneDescription : SCENE_PRESETS[placementScene].en;

                    prompt = `PRODUCT PLACEMENT / LIFESTYLE PHOTOGRAPHY:
Take the product from the provided image and place it naturally in the following scene.

SCENE: ${sceneDesc}
LIGHTING: ${lightingStyle} lighting
TIME OF DAY: ${timeOfDay}
CAMERA ANGLE: ${cameraAngle}
${additionalProps ? `ADDITIONAL ELEMENTS: ${additionalProps}` : ''}

CRITICAL REQUIREMENTS:
- The product MUST be the EXACT item from the input image (preserve all colors, textures, branding, details)
- The product should be placed NATURALLY in the scene, as if photographed there
- The lighting on the product MUST match the scene lighting perfectly
- Add realistic shadows and reflections based on the environment
- The product should be the HERO/focal point of the image
- Create a lifestyle/aspirational feel that makes the product desirable
- This is variation ${i + 1} of ${variationCount} - vary the angle/arrangement slightly
- ULTRA HIGH QUALITY, professional commercial photography style
- 4K resolution quality, no artifacts, no blur
- The product should look like it belongs in this environment

IMPORTANT: Do NOT alter the product itself - only place it in the new environment.`;
                }

                parts.push({ text: prompt });

                const response = await generateContent({
                    modelName: 'gemini-3-pro-image-preview',
                    parts: parts,
                    config: {
                        imageConfig: {
                            aspectRatio: mode === 'virtual-tryon' ? '3:4' : '4:3',
                            imageSize: '2K'
                        }
                    }
                });

                const data = response.data as { candidates?: any[] };
                for (const part of data.candidates?.[0]?.content?.parts || []) {
                    if (part.inlineData) {
                        images.push(`data:image/png;base64,${part.inlineData.data}`);
                        break;
                    }
                }
            }

            if (images.length === 0) {
                throw new Error('No images generated');
            }

            setGeneratedImages(images);
            setTimeout(() => {
                resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
        } catch (err: any) {
            console.error("Generation failed, refunding points...", err);
            if (auth.currentUser) {
                await WalletService.refundPoints(auth.currentUser.uid, totalCost, `Refund: ${mode} Generation Failed`, undefined, variationCount);
            }
            setError(err.message || (isRtl ? 'فشل في التوليد. تم استرداد النقاط.' : 'Generation failed. Points refunded.'));
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDownload = (img: string, index: number) => {
        const link = document.createElement('a');
        link.href = img;
        link.download = `creakits-${mode}-${index + 1}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleDownloadAll = () => {
        generatedImages.forEach((img, idx) => handleDownload(img, idx));
    };

    return (
        <div className="max-w-7xl mx-auto p-4 lg:p-8 animate-fade-in">
            {/* Header */}
            <div className="mb-8 border-b border-slate-200 pb-6">
                <div className="flex items-center gap-3 mb-2">
                    <span className="text-4xl">{mode === 'virtual-tryon' ? '👗' : '🏠'}</span>
                    <h2 className="text-3xl font-bold text-slate-900">
                        {mode === 'virtual-tryon'
                            ? (isRtl ? 'التجربة الافتراضية للملابس' : 'Virtual Try-On Studio')
                            : (isRtl ? 'وضع المنتج في المشاهد' : 'Product Placement Studio')}
                    </h2>
                </div>
                <p className="text-slate-600">
                    {mode === 'virtual-tryon'
                        ? (isRtl ? 'جرّب ملابسك على موديل افتراضي أو صورتك الخاصة بتقنية الذكاء الاصطناعي.' : 'Try your clothes on a virtual model or your own image using AI technology.')
                        : (isRtl ? 'ضع منتجاتك في مشاهد احترافية لجذب العملاء.' : 'Place your products in professional lifestyle scenes to attract customers.')}
                </p>
            </div>

            {/* Mode Toggle */}
            <div className="mb-8 bg-slate-100 p-1.5 rounded-2xl inline-flex gap-1">
                <button
                    onClick={() => { setMode('virtual-tryon'); setGeneratedImages([]); setError(null); }}
                    className={`px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${mode === 'virtual-tryon' ? 'bg-white text-indigo-700 shadow-md' : 'text-slate-600 hover:text-slate-900'}`}
                >
                    <span className="text-xl">👗</span>
                    {isRtl ? 'تجربة الملابس' : 'Virtual Try-On'}
                </button>
                <button
                    onClick={() => { setMode('product-placement'); setGeneratedImages([]); setError(null); }}
                    className={`px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${mode === 'product-placement' ? 'bg-white text-indigo-700 shadow-md' : 'text-slate-600 hover:text-slate-900'}`}
                >
                    <span className="text-xl">🏠</span>
                    {isRtl ? 'وضع المنتج' : 'Product Placement'}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Input Form */}
                <div className="lg:col-span-5 space-y-6">
                    <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100">
                        <form onSubmit={handleGenerate} className="space-y-6">
                            {/* Product Image Upload */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    {mode === 'virtual-tryon'
                                        ? (isRtl ? 'صورة الملابس / المنتج *' : 'Clothing / Product Image *')
                                        : (isRtl ? 'صورة المنتج *' : 'Product Image *')}
                                </label>
                                <label className={`cursor-pointer flex flex-col items-center justify-center min-h-[160px] border-2 border-dashed rounded-2xl transition-all overflow-hidden ${productImage ? 'border-emerald-500 bg-emerald-50' : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'}`}>
                                    {productImage ? (
                                        <div className="relative w-full">
                                            <img src={`data:image/jpeg;base64,${productImage}`} alt="Product" className="w-full h-40 object-contain p-2" />
                                            <div className="absolute bottom-0 left-0 right-0 bg-emerald-600 text-white text-center py-1.5 text-xs font-medium">
                                                ✓ {isRtl ? 'تم الرفع' : 'Uploaded'}
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <span className="text-4xl mb-2">{mode === 'virtual-tryon' ? '👕' : '📦'}</span>
                                            <span className="text-sm text-slate-500">{isRtl ? 'انقر لرفع صورة المنتج' : 'Click to upload product'}</span>
                                        </>
                                    )}
                                    <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, setProductImage)} className="hidden" />
                                </label>
                            </div>

                            {/* Virtual Try-On Specific Options */}
                            {mode === 'virtual-tryon' && (
                                <>
                                    {/* Use Custom Model Toggle */}
                                    <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl">
                                        <label className="flex items-center justify-between cursor-pointer">
                                            <div className="flex items-center gap-3">
                                                <span className="text-2xl">📸</span>
                                                <div>
                                                    <p className="font-semibold text-indigo-900">{isRtl ? 'استخدام صورتي الخاصة' : 'Use My Own Image'}</p>
                                                    <p className="text-xs text-indigo-700">{isRtl ? 'ارفع صورة لشخص لتجربة الملابس عليه' : 'Upload a photo to try clothes on'}</p>
                                                </div>
                                            </div>
                                            <input
                                                type="checkbox"
                                                checked={useCustomModel}
                                                onChange={(e) => setUseCustomModel(e.target.checked)}
                                                className="w-5 h-5 text-indigo-600 rounded"
                                            />
                                        </label>
                                    </div>

                                    {/* Custom Model Image Upload */}
                                    {useCustomModel && (
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                                {isRtl ? 'صورة الموديل / الشخص *' : 'Model / Person Image *'}
                                            </label>
                                            <label className={`cursor-pointer flex flex-col items-center justify-center min-h-[140px] border-2 border-dashed rounded-2xl transition-all overflow-hidden ${modelImage ? 'border-purple-500 bg-purple-50' : 'border-slate-300 hover:border-purple-400 hover:bg-slate-50'}`}>
                                                {modelImage ? (
                                                    <div className="relative w-full">
                                                        <img src={`data:image/jpeg;base64,${modelImage}`} alt="Model" className="w-full h-36 object-contain p-2" />
                                                        <div className="absolute bottom-0 left-0 right-0 bg-purple-600 text-white text-center py-1.5 text-xs font-medium">
                                                            ✓ {isRtl ? 'تم الرفع' : 'Uploaded'}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <span className="text-4xl mb-2">🧍</span>
                                                        <span className="text-sm text-slate-500">{isRtl ? 'ارفع صورة الشخص' : 'Upload person image'}</span>
                                                    </>
                                                )}
                                                <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, setModelImage)} className="hidden" />
                                            </label>
                                        </div>
                                    )}

                                    {/* AI Model Options (when not using custom) */}
                                    {!useCustomModel && (
                                        <>
                                            {/* Clothing Type */}
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                                    {isRtl ? 'نوع الملابس' : 'Clothing Type'}
                                                </label>
                                                <div className="grid grid-cols-4 gap-2">
                                                    {([
                                                        { value: 'tshirt', label: isRtl ? 'تيشيرت' : 'T-Shirt', icon: '👕' },
                                                        { value: 'shirt', label: isRtl ? 'قميص' : 'Shirt', icon: '👔' },
                                                        { value: 'dress', label: isRtl ? 'فستان' : 'Dress', icon: '👗' },
                                                        { value: 'jacket', label: isRtl ? 'جاكيت' : 'Jacket', icon: '🧥' },
                                                        { value: 'pants', label: isRtl ? 'بنطلون' : 'Pants', icon: '👖' },
                                                        { value: 'full-outfit', label: isRtl ? 'طقم كامل' : 'Full Outfit', icon: '🎽' },
                                                        { value: 'accessories', label: isRtl ? 'إكسسوار' : 'Accessory', icon: '👜' },
                                                        { value: 'shoes', label: isRtl ? 'حذاء' : 'Shoes', icon: '👟' },
                                                    ] as { value: ClothingType; label: string; icon: string }[]).map((item) => (
                                                        <button
                                                            key={item.value}
                                                            type="button"
                                                            onClick={() => setClothingType(item.value)}
                                                            className={`p-2 rounded-xl border-2 transition-all text-center ${clothingType === item.value ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 hover:border-indigo-300 text-slate-600'}`}
                                                        >
                                                            <span className="text-xl block">{item.icon}</span>
                                                            <span className="text-[10px] font-medium">{item.label}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Model Gender */}
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                                    {isRtl ? 'جنس الموديل' : 'Model Gender'}
                                                </label>
                                                <div className="flex gap-2">
                                                    {(['female', 'male', 'unisex'] as const).map((g) => (
                                                        <button
                                                            key={g}
                                                            type="button"
                                                            onClick={() => setModelGender(g)}
                                                            className={`flex-1 py-3 px-4 rounded-xl border-2 transition-all font-medium ${modelGender === g ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 hover:border-indigo-300 text-slate-600'}`}
                                                        >
                                                            {g === 'female' ? (isRtl ? '👩 أنثى' : '👩 Female') : g === 'male' ? (isRtl ? '👨 ذكر' : '👨 Male') : (isRtl ? '🧑 محايد' : '🧑 Unisex')}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Body Type & Skin Tone */}
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                                        {isRtl ? 'نوع الجسم' : 'Body Type'}
                                                    </label>
                                                    <select
                                                        value={modelBodyType}
                                                        onChange={(e) => setModelBodyType(e.target.value as ModelBodyType)}
                                                        className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-sm"
                                                    >
                                                        <option value="slim">{isRtl ? 'نحيف' : 'Slim'}</option>
                                                        <option value="average">{isRtl ? 'متوسط' : 'Average'}</option>
                                                        <option value="athletic">{isRtl ? 'رياضي' : 'Athletic'}</option>
                                                        <option value="plus-size">{isRtl ? 'ممتلئ' : 'Plus Size'}</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                                        {isRtl ? 'لون البشرة' : 'Skin Tone'}
                                                    </label>
                                                    <select
                                                        value={modelSkinTone}
                                                        onChange={(e) => setModelSkinTone(e.target.value as ModelSkinTone)}
                                                        className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-sm"
                                                    >
                                                        <option value="light">{isRtl ? 'فاتح' : 'Light'}</option>
                                                        <option value="medium">{isRtl ? 'متوسط' : 'Medium'}</option>
                                                        <option value="tan">{isRtl ? 'قمحي' : 'Tan'}</option>
                                                        <option value="dark">{isRtl ? 'داكن' : 'Dark'}</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    {/* Model Pose */}
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                                            {isRtl ? 'وضعية الموديل' : 'Model Pose'}
                                        </label>
                                        <select
                                            value={modelPose}
                                            onChange={(e) => setModelPose(e.target.value)}
                                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                                        >
                                            <option value="standing-front">{isRtl ? 'واقف - أمامي' : 'Standing - Front'}</option>
                                            <option value="standing-side">{isRtl ? 'واقف - جانبي' : 'Standing - Side'}</option>
                                            <option value="standing-3/4">{isRtl ? 'واقف - ثلاثة أرباع' : 'Standing - 3/4 View'}</option>
                                            <option value="walking">{isRtl ? 'يمشي' : 'Walking'}</option>
                                            <option value="sitting">{isRtl ? 'جالس' : 'Sitting'}</option>
                                            <option value="casual">{isRtl ? 'وضعية عفوية' : 'Casual Pose'}</option>
                                        </select>
                                    </div>
                                </>
                            )}

                            {/* Product Placement Specific Options */}
                            {mode === 'product-placement' && (
                                <>
                                    {/* Scene Selection */}
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                                            {isRtl ? 'المشهد / البيئة' : 'Scene / Environment'}
                                        </label>
                                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                            {Object.entries(SCENE_PRESETS).map(([key, value]) => (
                                                <button
                                                    key={key}
                                                    type="button"
                                                    onClick={() => setPlacementScene(key as PlacementScene)}
                                                    className={`p-2 rounded-xl border-2 transition-all text-center ${placementScene === key ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 hover:border-indigo-300 text-slate-600'}`}
                                                >
                                                    <span className="text-xl block">{value.icon}</span>
                                                    <span className="text-[10px] font-medium">{isRtl ? value.ar : value.en}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Custom Scene Description */}
                                    {placementScene === 'custom' && (
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                                {isRtl ? 'صف المشهد المخصص' : 'Describe Custom Scene'}
                                            </label>
                                            <textarea
                                                value={customSceneDescription}
                                                onChange={(e) => setCustomSceneDescription(e.target.value)}
                                                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none min-h-[80px] bg-white text-slate-900 placeholder:text-slate-400"
                                                placeholder={isRtl ? 'مثال: شاطئ استوائي مع غروب الشمس، رمال بيضاء...' : 'E.g., Tropical beach at sunset with white sand...'}
                                            />
                                        </div>
                                    )}

                                    {/* Lighting & Time */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                                {isRtl ? 'الإضاءة' : 'Lighting'}
                                            </label>
                                            <select
                                                value={lightingStyle}
                                                onChange={(e) => setLightingStyle(e.target.value as LightingStyle)}
                                                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-sm"
                                            >
                                                <option value="natural">{isRtl ? 'طبيعية' : 'Natural'}</option>
                                                <option value="warm">{isRtl ? 'دافئة' : 'Warm'}</option>
                                                <option value="cool">{isRtl ? 'باردة' : 'Cool'}</option>
                                                <option value="dramatic">{isRtl ? 'درامية' : 'Dramatic'}</option>
                                                <option value="soft">{isRtl ? 'ناعمة' : 'Soft'}</option>
                                                <option value="studio">{isRtl ? 'استوديو' : 'Studio'}</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                                {isRtl ? 'وقت اليوم' : 'Time of Day'}
                                            </label>
                                            <select
                                                value={timeOfDay}
                                                onChange={(e) => setTimeOfDay(e.target.value as TimeOfDay)}
                                                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-sm"
                                            >
                                                <option value="morning">{isRtl ? 'صباحاً' : 'Morning'}</option>
                                                <option value="afternoon">{isRtl ? 'بعد الظهر' : 'Afternoon'}</option>
                                                <option value="evening">{isRtl ? 'مساءً' : 'Evening'}</option>
                                                <option value="night">{isRtl ? 'ليلاً' : 'Night'}</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Camera Angle */}
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                                            {isRtl ? 'زاوية الكاميرا' : 'Camera Angle'}
                                        </label>
                                        <select
                                            value={cameraAngle}
                                            onChange={(e) => setCameraAngle(e.target.value)}
                                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                                        >
                                            <option value="eye-level">{isRtl ? 'مستوى العين' : 'Eye Level'}</option>
                                            <option value="high-angle">{isRtl ? 'من الأعلى' : 'High Angle'}</option>
                                            <option value="low-angle">{isRtl ? 'من الأسفل' : 'Low Angle'}</option>
                                            <option value="bird-eye">{isRtl ? 'عين الطائر' : 'Bird\'s Eye'}</option>
                                            <option value="close-up">{isRtl ? 'قريب' : 'Close-up'}</option>
                                            <option value="wide">{isRtl ? 'واسع' : 'Wide Shot'}</option>
                                        </select>
                                    </div>

                                    {/* Additional Props */}
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                                            {isRtl ? 'عناصر إضافية (اختياري)' : 'Additional Props (Optional)'}
                                        </label>
                                        <input
                                            type="text"
                                            value={additionalProps}
                                            onChange={(e) => setAdditionalProps(e.target.value)}
                                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white placeholder:text-slate-400"
                                            placeholder={isRtl ? 'مثال: نباتات، كتب، فنجان قهوة...' : 'E.g., plants, books, coffee cup...'}
                                        />
                                    </div>
                                </>
                            )}

                            {/* Variation Count */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    {isRtl ? 'عدد التنويعات' : 'Number of Variations'}
                                </label>
                                <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-xl border border-slate-200">
                                    <button
                                        type="button"
                                        onClick={() => setVariationCount(Math.max(1, variationCount - 1))}
                                        className="w-10 h-10 flex items-center justify-center bg-white rounded-lg shadow-sm text-slate-600 hover:bg-slate-100 border border-slate-200"
                                    >−</button>
                                    <div className="flex-1 text-center font-bold text-xl text-indigo-700">
                                        {variationCount} <span className="text-sm font-normal text-slate-400">/ 4</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setVariationCount(Math.min(4, variationCount + 1))}
                                        className="w-10 h-10 flex items-center justify-center bg-white rounded-lg shadow-sm text-slate-600 hover:bg-slate-100 border border-slate-200"
                                    >+</button>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <Button
                                type="submit"
                                isLoading={isGenerating}
                                disabled={!productImage}
                                className="w-full py-4 text-lg shadow-indigo-200"
                            >
                                {isGenerating ? (
                                    isRtl ? 'جاري التوليد...' : 'Generating...'
                                ) : (
                                    <span className="flex items-center justify-center gap-2">
                                        {mode === 'virtual-tryon' ? (isRtl ? 'توليد التجربة' : 'Generate Try-On') : (isRtl ? 'وضع المنتج' : 'Place Product')}
                                        <span className="flex items-center gap-1 bg-white/20 px-2 py-1 rounded-lg">
                                            {totalCost} <CoinIcon className="w-4 h-4" />
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
                    {generatedImages.length > 0 ? (
                        <div className="space-y-6 animate-fade-in">
                            {/* Header Actions */}
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-bold text-slate-800">
                                    {isRtl ? '🎨 النتائج' : '🎨 Generated Results'}
                                </h3>
                                <div className="flex gap-2">
                                    {isPaidUser && (
                                        <SaveToCloudButton
                                            images={generatedImages}
                                            designType={mode === 'virtual-tryon' ? 'ad' : 'social'}
                                            metadata={{ mode, variationCount }}
                                            onSaved={() => alert(isRtl ? 'تم الحفظ!' : 'Saved!')}
                                            onError={(err) => alert(err)}
                                            variant="secondary"
                                        />
                                    )}
                                    <button
                                        onClick={handleDownloadAll}
                                        className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-700 transition-colors"
                                    >
                                        {isRtl ? 'تحميل الكل' : 'Download All'}
                                    </button>
                                </div>
                            </div>

                            {/* Image Grid */}
                            <div className={`grid gap-4 ${generatedImages.length === 1 ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'}`}>
                                {generatedImages.map((img, idx) => (
                                    <div key={idx} className="group relative rounded-2xl overflow-hidden shadow-lg border border-slate-100 bg-white">
                                        <img src={img} alt={`Result ${idx + 1}`} className="w-full h-auto" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                                            <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center">
                                                <span className="text-white font-medium">
                                                    {isRtl ? `تنويع ${idx + 1}` : `Variation ${idx + 1}`}
                                                </span>
                                                <button
                                                    onClick={() => handleDownload(img, idx)}
                                                    className="px-4 py-2 bg-white text-slate-900 rounded-lg text-sm font-medium hover:bg-slate-100 transition-colors"
                                                >
                                                    {isRtl ? 'تحميل' : 'Download'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Tips */}
                            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-5 rounded-2xl border border-indigo-100">
                                <h4 className="font-bold text-indigo-900 mb-2">
                                    💡 {isRtl ? 'نصيحة' : 'Pro Tip'}
                                </h4>
                                <p className="text-sm text-indigo-700">
                                    {mode === 'virtual-tryon'
                                        ? (isRtl ? 'للحصول على أفضل النتائج، استخدم صور ملابس على خلفية بيضاء أو شفافة.' : 'For best results, use clothing images with white or transparent backgrounds.')
                                        : (isRtl ? 'جرب مشاهد مختلفة لمعرفة أيها يعزز قيمة منتجك أكثر.' : 'Try different scenes to see which one enhances your product\'s perceived value the most.')}
                                </p>
                            </div>
                        </div>
                    ) : (
                        !isGenerating && (
                            <div className="h-full min-h-[500px] flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
                                <div className="w-28 h-28 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mb-6">
                                    <span className="text-6xl">{mode === 'virtual-tryon' ? '👗' : '🏠'}</span>
                                </div>
                                <p className="text-xl font-medium text-slate-500 mb-2">
                                    {mode === 'virtual-tryon'
                                        ? (isRtl ? 'ارفع صورة الملابس لتجربتها' : 'Upload clothing to try on')
                                        : (isRtl ? 'ارفع صورة المنتج لوضعها في مشهد' : 'Upload a product to place in a scene')}
                                </p>
                                <p className="text-sm text-slate-400 text-center max-w-md px-4">
                                    {mode === 'virtual-tryon'
                                        ? (isRtl ? 'سيقوم الذكاء الاصطناعي بتوليد صورة احترافية لموديل يرتدي ملابسك' : 'AI will generate a professional image of a model wearing your clothes')
                                        : (isRtl ? 'سيقوم الذكاء الاصطناعي بوضع منتجك في بيئة احترافية مناسبة' : 'AI will place your product in a professional lifestyle environment')}
                                </p>
                            </div>
                        )
                    )}

                    {/* Loading State */}
                    {isGenerating && (
                        <div className="h-full min-h-[500px] flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-indigo-100 rounded-3xl bg-indigo-50/30">
                            <div className="relative">
                                <div className="w-24 h-24 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                                <span className="absolute inset-0 flex items-center justify-center text-4xl">
                                    {mode === 'virtual-tryon' ? '👗' : '🏠'}
                                </span>
                            </div>
                            <p className="text-lg font-medium text-indigo-800 mt-6">
                                {mode === 'virtual-tryon'
                                    ? (isRtl ? '✨ جاري تطبيق الملابس...' : '✨ Applying clothes to model...')
                                    : (isRtl ? '✨ جاري وضع المنتج في المشهد...' : '✨ Placing product in scene...')}
                            </p>
                            <p className="text-sm text-indigo-600 mt-2">
                                {isRtl ? `جاري توليد ${variationCount} تنويع...` : `Generating ${variationCount} variation(s)...`}
                            </p>
                            <div className="mt-6 flex gap-2">
                                {Array.from({ length: variationCount }).map((_, i) => (
                                    <div key={i} className="w-3 h-3 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.2}s` }}></div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
