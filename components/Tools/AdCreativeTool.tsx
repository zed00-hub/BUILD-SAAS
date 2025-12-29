import React, { useState } from 'react';
import { Country, Language } from '../../types';
import { Button } from '../Button';
import { fileToBase64, generateImage, editGeneratedImage } from '../../services/geminiService';
import { CoinIcon } from '../CoinIcon';

interface AdCreativeToolProps {
  points: number;
  deductPoints: (amount: number) => boolean;
}

export const AdCreativeTool: React.FC<AdCreativeToolProps> = ({ points, deductPoints }) => {
  const [formData, setFormData] = useState({
    headline: '',
    subheadline: '',
    cta: '',
    price: '',
    additionalElements: '',
    language: Language.English,
    country: Country.USA
  });
  
  const [productImage, setProductImage] = useState<string | null>(null);
  const [logoImage, setLogoImage] = useState<string | null>(null);
  const [imageCount, setImageCount] = useState<number>(1);
  
  // Store array of images instead of single image
  const [resultImages, setResultImages] = useState<string[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [editInstruction, setEditInstruction] = useState('');
  const [error, setError] = useState<string | null>(null);

  const costPerImage = 20;
  const totalCost = costPerImage * imageCount;
  const editCost = 15;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    if (e.target.files && e.target.files[0]) {
      try {
        const base64 = await fileToBase64(e.target.files[0]);
        setter(base64);
      } catch (err) {
        console.error("Error converting image", err);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const incrementImages = () => setImageCount(prev => Math.min(4, prev + 1));
  const decrementImages = () => setImageCount(prev => Math.max(1, prev - 1));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productImage) {
      setError("Product image is required.");
      return;
    }
    
    // Check points
    if (!deductPoints(totalCost)) {
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setResultImages([]);
    setSelectedImageIndex(null);

    try {
      // Loop to generate multiple images
      const promises = Array.from({ length: imageCount }).map(async (_, index) => {
         const prompt = `Create a high-converting, professional square advertisement design. Variation ${index + 1}.
      
          CONTEXT:
          - Product: See attached image.
          - Target Market: ${formData.country}
          - Language: ${formData.language}
          
          TEXT ELEMENTS TO INCLUDE (Make them legible, aesthetic and readable):
          ${formData.headline ? `- Headline: "${formData.headline}"` : ''}
          ${formData.subheadline ? `- Sub-headline: "${formData.subheadline}"` : ''}
          ${formData.cta ? `- Button/CTA: "${formData.cta}"` : ''}
          ${formData.price ? `- Price tag: "${formData.price}"` : '- DO NOT include any price tag or random numbers.'}
          
          ADDITIONAL VISUALS:
          ${formData.additionalElements ? `- Elements: ${formData.additionalElements}` : ''}
          
          DESIGN STYLE:
          Commercial, trustworthy, high contrast, branded. Place the product centrally or naturally in a scene appropriate for the country/culture. 
          Make this design unique from other variations.`;

          return generateImage({
            prompt,
            referenceImage: productImage,
            logoImage: logoImage || undefined,
            aspectRatio: "1:1"
          });
      });

      const results = await Promise.all(promises);
      setResultImages(results);
    } catch (err: any) {
      setError(err.message || "Failed to generate ad creative.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = async () => {
    if (selectedImageIndex === null || !editInstruction) return;

    if (!deductPoints(editCost)) {
      return;
    }

    setIsEditing(true);
    try {
      const currentImage = resultImages[selectedImageIndex];
      const newImage = await editGeneratedImage(currentImage, editInstruction);
      
      const updatedImages = [...resultImages];
      updatedImages[selectedImageIndex] = newImage;
      setResultImages(updatedImages);
      
      setEditInstruction('');
    } catch (err: any) {
      setError("Failed to update design: " + err.message);
    } finally {
      setIsEditing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 lg:p-8 animate-fade-in">
       <div className="mb-8 border-b border-slate-200 pb-6">
        <h2 className="text-3xl font-bold text-slate-800 mb-2">Ad Creative Designer</h2>
        <p className="text-slate-600">High-conversion ads tailored to your market.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 bg-white p-6 rounded-2xl shadow-lg border border-slate-100 h-fit">
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Image Uploads Row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="input-group">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">Product (Req)</label>
                <label className={`cursor-pointer flex flex-col items-center justify-center h-24 border-2 border-dashed rounded-xl transition-all ${productImage ? 'border-emerald-500 bg-emerald-50' : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'}`}>
                  <span className="text-2xl mb-1">{productImage ? '✅' : '📸'}</span>
                  <span className="text-xs text-slate-500 text-center font-medium px-1">
                    {productImage ? "Ready" : "Upload"}
                  </span>
                  <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, setProductImage)} className="hidden" required={!productImage} />
                </label>
              </div>
              
              <div className="input-group">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">Logo (Opt)</label>
                <label className={`cursor-pointer flex flex-col items-center justify-center h-24 border-2 border-dashed rounded-xl transition-all ${logoImage ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'}`}>
                   <span className="text-2xl mb-1">©️</span>
                   <span className="text-xs text-slate-500 text-center font-medium px-1">
                    {logoImage ? "Ready" : "Upload"}
                  </span>
                  <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, setLogoImage)} className="hidden" />
                </label>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="input-group">
                <label className="block text-sm font-medium text-slate-700 mb-1">Language</label>
                <select name="language" value={formData.language} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg bg-white text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none">
                  {Object.values(Language).map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div className="input-group">
                <label className="block text-sm font-medium text-slate-700 mb-1">Market</label>
                <select name="country" value={formData.country} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg bg-white text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none">
                  {Object.values(Country).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            {/* Image Count Selector - UPDATED */}
            <div className="input-group">
               <label className="block text-sm font-semibold text-slate-700 mb-2">Number of Variations</label>
               <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-xl border border-slate-200">
                 <button 
                  type="button" 
                  onClick={decrementImages}
                  className="w-10 h-10 flex items-center justify-center bg-white rounded-lg shadow-sm text-slate-600 hover:bg-slate-100 transition-colors border border-slate-200"
                 >
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>
                 </button>
                 
                 <div className="flex-1 text-center font-bold text-xl text-indigo-700">
                    {imageCount} <span className="text-sm font-normal text-slate-400">/ 4</span>
                 </div>

                 <button 
                  type="button" 
                  onClick={incrementImages}
                  className="w-10 h-10 flex items-center justify-center bg-white rounded-lg shadow-sm text-slate-600 hover:bg-slate-100 transition-colors border border-slate-200"
                 >
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                 </button>
               </div>
            </div>

            <div className="space-y-3 pt-2">
                <div className="input-group">
                    <input name="headline" value={formData.headline} onChange={handleChange} placeholder="Main Headline" className="w-full px-4 py-2 border rounded-lg bg-white text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div className="input-group">
                    <input name="subheadline" value={formData.subheadline} onChange={handleChange} placeholder="Subheadline" className="w-full px-4 py-2 border rounded-lg bg-white text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <input name="cta" value={formData.cta} onChange={handleChange} placeholder="CTA Button" className="w-full px-4 py-2 border rounded-lg bg-white text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 outline-none" />
                    <input name="price" value={formData.price} onChange={handleChange} placeholder="Price" className="w-full px-4 py-2 border rounded-lg bg-white text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div className="input-group">
                    <input name="additionalElements" value={formData.additionalElements} onChange={handleChange} placeholder="Extra Elements (e.g. arrows)" className="w-full px-4 py-2 border rounded-lg bg-white text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
            </div>

            <Button type="submit" isLoading={isLoading} className="w-full py-3 text-lg font-semibold shadow-xl shadow-indigo-100">
              <span className="flex items-center gap-1">
                Generate {imageCount} Creative{imageCount > 1 ? 's' : ''} ({totalCost} <CoinIcon className="w-5 h-5 inline-block" />)
              </span>
            </Button>
             {error && <div className="text-red-600 text-sm p-2 bg-red-50 rounded border border-red-100">{error}</div>}
          </form>
        </div>

        <div className="lg:col-span-8 flex flex-col gap-6">
           {resultImages.length > 0 ? (
            <div className="animate-fade-in space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {resultImages.map((img, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`group relative rounded-2xl overflow-hidden shadow-lg border border-slate-200 bg-white cursor-pointer transition-all ${selectedImageIndex === idx ? 'ring-4 ring-indigo-500 ring-offset-2' : 'hover:shadow-xl'}`}
                  >
                    <img src={img} alt={`Ad Variation ${idx+1}`} className="w-full h-auto" />
                    <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded backdrop-blur-md">
                      Var {idx + 1}
                    </div>
                    {/* Hover Overlay */}
                     <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center gap-3 backdrop-blur-sm">
                        <span className="text-white font-bold">Click to Edit</span>
                     </div>
                  </div>
                ))}
              </div>

              {/* Download & Live Editing Section */}
              <div className="bg-white p-5 rounded-2xl border border-indigo-100 shadow-sm sticky bottom-6">
                 {selectedImageIndex !== null ? (
                    <div className="space-y-4">
                       <div className="flex justify-between items-center">
                          <h4 className="font-bold text-slate-800">Editing Variation {selectedImageIndex + 1}</h4>
                          <button onClick={() => setSelectedImageIndex(null)} className="text-sm text-slate-400 hover:text-slate-600">Cancel Selection</button>
                       </div>
                       
                       <div className="flex gap-2">
                          <input 
                            type="text" 
                            value={editInstruction}
                            onChange={(e) => setEditInstruction(e.target.value)}
                            placeholder="E.g., Change background to blue, remove text..."
                            className="flex-1 px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                            onKeyDown={(e) => e.key === 'Enter' && handleEdit()}
                          />
                          <Button onClick={handleEdit} isLoading={isEditing} variant="primary" className="px-6">
                            <span className="flex items-center gap-1">
                              Update ({editCost} <CoinIcon className="w-4 h-4 inline-block" />)
                            </span>
                          </Button>
                       </div>
                       <a 
                          href={resultImages[selectedImageIndex]} 
                          download={`creakits-ad-var-${selectedImageIndex+1}.png`} 
                          className="block w-full text-center py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                        >
                          Download This Version
                        </a>
                    </div>
                 ) : (
                    <div className="text-center text-slate-500 py-2">
                       Select an image above to edit or download.
                    </div>
                 )}
              </div>
            </div>
           ) : (
            <div className="h-full min-h-[500px] flex flex-col items-center justify-center bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-300 text-slate-400">
               <span className="text-6xl mb-4 opacity-20">📢</span>
               <p className="font-medium">Ad results will appear here</p>
               <p className="text-sm opacity-60 mt-2">Generate up to 4 variations at once</p>
            </div>
           )}
        </div>
      </div>
    </div>
  );
};