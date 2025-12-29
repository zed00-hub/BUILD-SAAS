import React, { useState } from 'react';
import { Country, Language } from '../../types';
import { Button } from '../Button';
import { fileToBase64, generateImage, editGeneratedImage } from '../../services/geminiService';
import { CoinIcon } from '../CoinIcon';

interface LandingPageToolProps {
  points: number;
  deductPoints: (amount: number) => boolean;
}

export const LandingPageTool: React.FC<LandingPageToolProps> = ({ points, deductPoints }) => {
  const [formData, setFormData] = useState({
    description: '',
    price: '',
    customization: '',
    language: Language.English,
    country: Country.USA,
    socialProofType: 'none' as 'none' | 'customer' | 'expert'
  });
  
  const [productImage, setProductImage] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editInstruction, setEditInstruction] = useState('');
  const [error, setError] = useState<string | null>(null);

  const generationCost = 30;
  const editCost = 15;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
        const base64 = await fileToBase64(e.target.files[0]);
        setProductImage(base64);
        setError(null);
      } catch (err) {
        console.error("Error converting image", err);
        setError("Failed to read file.");
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productImage) {
      setError("Product image is required.");
      return;
    }

    // Check Points
    if (!deductPoints(generationCost)) {
      return;
    }

    setIsLoading(true);
    setError(null);
    setResultImage(null);

    try {
      const prompt = `Act as a Senior Designer. Design a LONG-FORM VERTICAL Mobile Sales Page. 
      
      CONTEXT:
      - Market/Country: ${formData.country}
      - Language: ${formData.language}
      - Product Description: ${formData.description}
      ${formData.price ? `- Price Point to Display: ${formData.price}` : ''}
      ${formData.customization ? `- Design Customization/Notes: ${formData.customization}` : ''}

      STRUCTURE:
      Include sections for Hero, Value Proposition, Before/After visuals, and Features. 
      Ensure the layout is clean, sequential, and not cluttered.`;

      const result = await generateImage({
        prompt,
        referenceImage: productImage,
        aspectRatio: "9:16", 
        imageSize: "2K" 
      });
      setResultImage(result);
    } catch (err: any) {
      setError(err.message || "Failed to generate design.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!resultImage || !editInstruction) return;
    
    // Check points for edit
    if (!deductPoints(editCost)) {
      return;
    }

    setIsEditing(true);
    try {
      const newImage = await editGeneratedImage(resultImage, editInstruction);
      setResultImage(newImage);
      setEditInstruction('');
    } catch (err: any) {
      setError("Failed to update: " + err.message);
    } finally {
      setIsEditing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 lg:p-8 animate-fade-in">
       <div className="mb-8 border-b border-slate-200 pb-6">
        <h2 className="text-3xl font-bold text-slate-900 mb-2">Landing Page Designer</h2>
        <p className="text-slate-600">Create high-conversion vertical sales pages.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 bg-white p-6 rounded-2xl shadow-lg border border-slate-100 h-fit">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Product Image (Required)</label>
              <label className={`cursor-pointer flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl transition-all ${productImage ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'}`}>
                <span className="text-3xl mb-2">{productImage ? '✅' : '📤'}</span>
                <span className="text-sm font-medium text-slate-700">{productImage ? 'Image Loaded' : 'Click to Upload'}</span>
                <input type="file" accept="image/png, image/webp, image/jpeg, image/jpg" onChange={handleImageUpload} className="hidden" />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Language</label>
                <select name="language" value={formData.language} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none">
                  {Object.values(Language).map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Market</label>
                <select name="country" value={formData.country} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none">
                  {Object.values(Country).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Product Description</label>
              <textarea 
                name="description"
                value={formData.description} 
                onChange={handleChange} 
                className="w-full px-3 py-2 border border-slate-200 rounded-lg h-24 outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900 placeholder:text-slate-400" 
                placeholder="Describe your product (e.g., Wireless Gaming Headset with 7.1 Surround Sound)..." 
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Price (Optional)</label>
              <input 
                name="price"
                type="text" 
                value={formData.price} 
                onChange={handleChange} 
                className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900 placeholder:text-slate-400" 
                placeholder="e.g. $49.99 or 5000 DZD" 
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Customization / Notes (Optional)</label>
              <textarea 
                name="customization"
                value={formData.customization} 
                onChange={handleChange} 
                className="w-full px-3 py-2 border border-slate-200 rounded-lg h-20 outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900 placeholder:text-slate-400" 
                placeholder="Specific colors, vibes, or things to avoid..." 
              />
            </div>
            
            <Button type="submit" isLoading={isLoading} className="w-full py-4 text-lg">
              <span className="flex items-center gap-1">
                Generate Design ({generationCost} <CoinIcon className="w-5 h-5 inline-block" />)
              </span>
            </Button>
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          </form>
        </div>

        <div className="lg:col-span-8">
           {resultImage ? (
             <div className="space-y-6">
                <div className="rounded-2xl overflow-hidden shadow-2xl bg-slate-900 flex justify-center py-8">
                  <img src={resultImage} alt="Mockup" className="max-w-[80%] h-auto rounded-lg" />
                </div>
                <div className="flex gap-3">
                  <input type="text" value={editInstruction} onChange={(e) => setEditInstruction(e.target.value)} placeholder="Live edit (e.g., make background darker)..." className="flex-1 px-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 bg-white" />
                  <Button onClick={handleEdit} isLoading={isEditing}>
                    <span className="flex items-center gap-1">
                      Update ({editCost} <CoinIcon className="w-4 h-4 inline-block" />)
                    </span>
                  </Button>
                </div>
            </div>
           ) : (
            <div className="h-[500px] flex items-center justify-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-300 text-slate-400">
               Design will appear here.
            </div>
           )}
        </div>
      </div>
    </div>
  );
};