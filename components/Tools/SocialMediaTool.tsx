import React, { useState, useRef } from 'react';
import { Button } from '../Button';
import { fileToBase64, generateImage, generateSocialPlan, editGeneratedImage } from '../../services/geminiService';
import { SlidePlan } from '../../types';
import { CoinIcon } from '../CoinIcon';

interface SocialMediaToolProps {
  points: number;
  deductPoints: (amount: number) => boolean;
}

export const SocialMediaTool: React.FC<SocialMediaToolProps> = ({ points, deductPoints }) => {
  const [description, setDescription] = useState('');
  const [manualContent, setManualContent] = useState(''); // New state for manual content
  const [additionalElementsText, setAdditionalElementsText] = useState('');
  const [styleImage, setStyleImage] = useState<string | null>(null);
  const [logoImage, setLogoImage] = useState<string | null>(null);
  const [elementImage, setElementImage] = useState<string | null>(null);
  const [slideCount, setSlideCount] = useState<number>(3);

  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [generatedPlan, setGeneratedPlan] = useState<SlidePlan[] | null>(null);
  
  // Edit State
  const [selectedSlideIndex, setSelectedSlideIndex] = useState<number | null>(null);
  const [editInstruction, setEditInstruction] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // Loading states
  const [isPlanning, setIsPlanning] = useState(false);
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const resultsRef = useRef<HTMLDivElement>(null);

  // Calculate Cost Logic - Fixed 30
  const costPerSlide = 30;
  const totalCost = costPerSlide * slideCount;
  const editCost = 15;
  const hasManualContent = manualContent.trim().length > 0;

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

  const handleDownloadAll = () => {
    generatedImages.forEach((img, idx) => {
      const link = document.createElement('a');
      link.href = img;
      link.download = `creakits-social-slide-${idx + 1}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  };

  const incrementSlides = () => setSlideCount(prev => Math.min(10, prev + 1));
  const decrementSlides = () => setSlideCount(prev => Math.max(1, prev - 1));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check points
    if (!deductPoints(totalCost)) {
        return;
    }

    setIsPlanning(false);
    setIsGeneratingImages(false);
    setError(null);
    setGeneratedImages([]);
    setGeneratedPlan(null);
    setSelectedSlideIndex(null);

    // Determine if we should use Auto Plan based on whether Manual Content is provided
    const shouldAutoPlan = !hasManualContent;

    try {
      let currentPlan: SlidePlan[] = [];

      if (shouldAutoPlan) {
        setIsPlanning(true);
        // Step 1: Generate the Content Plan
        currentPlan = await generateSocialPlan(description, slideCount);
        setGeneratedPlan(currentPlan);
        setIsPlanning(false);
      }

      setIsGeneratingImages(true);

      // Step 2: Generate Images
      const images: string[] = [];
      // If auto-planned, use the plan length. If manual, use the slide selector count.
      const loopCount = shouldAutoPlan ? currentPlan.length : slideCount;

      for (let i = 0; i < loopCount; i++) {
        let prompt = '';

        if (shouldAutoPlan) {
            const slide = currentPlan[i];
            prompt = `Create a high-quality social media design for Slide ${slide.slideNumber} of ${loopCount}.
            
            STRATEGY & CONTENT:
            - Role: ${slide.role}
            - Headline Text to Display: "${slide.title}"
            - Subtitle/Body Text to Display: "${slide.subtitle}"
            
            VISUAL DESCRIPTION:
            ${slide.visualDescription}
            
            STYLE & ATMOSPHERE:
            ${slide.designNotes}
            Modern, clean, engaging aesthetic. High resolution.`;
        } else {
            // Manual Mode Prompt
            prompt = `Create a high-quality social media design for Slide ${i + 1} of ${loopCount}.
            
            GENERAL CONTEXT:
            ${description}
            
            SPECIFIC CONTENT/SCRIPT PROVIDED BY USER:
            ${manualContent}
            
            DESIGN INSTRUCTION:
            - Focus on the content relevant to Slide ${i + 1} if specified in the script above.
            - Maintain visual consistency with previous/next slides.
            - High resolution, professional finish.
            `;
        }

        if (loopCount > 1) {
          prompt += ` Ensure visual consistency with a panoramic flow if placed next to other slides.`;
        }

        if (styleImage) {
          prompt += ` Use the attached style reference image as a strict visual theme guide.`;
        }
        
        if (additionalElementsText) {
          prompt += ` Include these specific design elements: ${additionalElementsText}.`;
        }

        const result = await generateImage({
          prompt,
          referenceImage: styleImage || undefined,
          logoImage: logoImage || undefined,
          elementImage: elementImage || undefined,
          aspectRatio: "1:1"
        });
        images.push(result);
      }

      setGeneratedImages(images);
      
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);

    } catch (err: any) {
      setError(err.message || "Failed to generate designs.");
    } finally {
      setIsPlanning(false);
      setIsGeneratingImages(false);
    }
  };

  const handleEditSlide = async () => {
    if (selectedSlideIndex === null || !editInstruction) return;
    
    // Check points for edit
    if (!deductPoints(editCost)) {
        return;
    }

    setIsEditing(true);
    try {
      const currentImage = generatedImages[selectedSlideIndex];
      const newImage = await editGeneratedImage(currentImage, editInstruction);
      
      const updatedImages = [...generatedImages];
      updatedImages[selectedSlideIndex] = newImage;
      setGeneratedImages(updatedImages);
      setEditInstruction('');
    } catch (err: any) {
      setError("Failed to edit slide: " + err.message);
    } finally {
      setIsEditing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 lg:p-8 animate-fade-in">
      <div className="mb-8 border-b border-slate-200 pb-6">
        <h2 className="text-3xl font-bold text-slate-900 mb-2">Social Media Designer</h2>
        <p className="text-slate-600">Smart content planning & design generation.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Input Form */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl shadow-lg border border-slate-100 h-fit sticky top-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="input-group">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                 Topic / Theme
              </label>
              <textarea
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none min-h-[80px] bg-white text-slate-900 placeholder:text-slate-400 transition-colors"
                placeholder="E.g., Benefits of Siwak, Modern Islamic Vibe..."
              />
            </div>

            <div className="input-group">
              <label className="block text-sm font-semibold text-slate-700 mb-2 flex justify-between">
                 <span>Specific Content (Optional)</span>
                 <span className="text-xs font-normal text-slate-400 bg-slate-100 px-2 py-0.5 rounded">Skips AI Planning</span>
              </label>
              <textarea
                value={manualContent}
                onChange={(e) => setManualContent(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none min-h-[100px] bg-white text-slate-900 placeholder:text-slate-400 transition-colors"
                placeholder="If you have a script, paste it here to skip AI planning. E.g:&#10;Slide 1: Title 'Hello'&#10;Slide 2: Product Image"
              />
            </div>

            <div className="input-group">
               <label className="block text-sm font-semibold text-slate-700 mb-2">Number of Slides</label>
               <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-xl border border-slate-200">
                 <button 
                  type="button" 
                  onClick={decrementSlides}
                  className="w-10 h-10 flex items-center justify-center bg-white rounded-lg shadow-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors border border-slate-200"
                 >
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>
                 </button>
                 
                 <div className="flex-1 text-center font-bold text-xl text-indigo-700">
                    {slideCount} <span className="text-sm font-normal text-slate-400">/ 10</span>
                 </div>

                 <button 
                  type="button" 
                  onClick={incrementSlides}
                  className="w-10 h-10 flex items-center justify-center bg-white rounded-lg shadow-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors border border-slate-200"
                 >
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                 </button>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="input-group">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Style (Opt)</label>
                <label className={`cursor-pointer flex flex-col items-center justify-center h-20 border-2 border-dashed rounded-xl transition-all w-full ${styleImage ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'}`}>
                  <span className="text-xl mb-1">🎨</span>
                  <span className="text-[10px] text-slate-500 text-center px-1 truncate w-full">
                    {styleImage ? "Loaded" : "Ref Image"}
                  </span>
                  <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, setStyleImage)} className="hidden" />
                </label>
              </div>

              <div className="input-group">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Logo (Opt)</label>
                <label className={`cursor-pointer flex flex-col items-center justify-center h-20 border-2 border-dashed rounded-xl transition-all w-full ${logoImage ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'}`}>
                  <span className="text-xl mb-1">©️</span>
                  <span className="text-[10px] text-slate-500 text-center px-1 truncate w-full">
                    {logoImage ? "Loaded" : "Logo PNG"}
                  </span>
                  <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, setLogoImage)} className="hidden" />
                </label>
              </div>
            </div>
            
            <div className="input-group">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Add Element (Opt)</label>
                <div className="flex gap-2">
                   <label className={`cursor-pointer flex-shrink-0 w-20 flex flex-col items-center justify-center h-[50px] border-2 border-dashed rounded-lg transition-all ${elementImage ? 'border-emerald-500 bg-emerald-50' : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'}`}>
                    <span className="text-lg">🖼️</span>
                    <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, setElementImage)} className="hidden" />
                   </label>
                   <input
                    type="text"
                    value={additionalElementsText}
                    onChange={(e) => setAdditionalElementsText(e.target.value)}
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-900 placeholder:text-slate-400 text-sm"
                    placeholder="Describe element (e.g. arrows)"
                  />
                </div>
            </div>

            <Button type="submit" isLoading={isPlanning || isGeneratingImages} className="w-full py-4 text-lg shadow-indigo-200 mt-4">
              {isPlanning ? 'Planning Content...' : isGeneratingImages ? 'Designing...' : (
                <span className="flex items-center gap-1">
                   Generate ({totalCost} <CoinIcon className="w-5 h-5 inline-block" />)
                </span>
              )}
            </Button>
            
            {error && (
              <div className="p-4 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                {error}
              </div>
            )}
          </form>
        </div>

        {/* Results */}
        <div className="lg:col-span-7 space-y-6" ref={resultsRef}>
          {/* Plan Visualization (Only if Auto-Planned) */}
          {generatedPlan && !manualContent && (
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 animate-fade-in">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">AI Content Strategy</h3>
              <div className="space-y-4">
                {generatedPlan.map((slide) => (
                   <div key={slide.slideNumber} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex gap-4 items-start">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm flex-shrink-0">
                        {slide.slideNumber}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{slide.role}</span>
                          <h4 className="font-semibold text-slate-900">{slide.title}</h4>
                        </div>
                        <p className="text-sm text-slate-500 mb-2">{slide.subtitle}</p>
                      </div>
                   </div>
                ))}
              </div>
            </div>
          )}

          {/* Generated Images & Editing */}
          {generatedImages.length > 0 ? (
            <div className="animate-fade-in space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-800">Final Designs</h3>
                <div className="flex gap-2">
                  <span className="text-xs text-slate-500 self-center hidden sm:block">Click a slide to edit</span>
                  {generatedImages.length > 1 && (
                    <button 
                      onClick={handleDownloadAll}
                      className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-700 transition-colors"
                    >
                      Download All
                    </button>
                  )}
                </div>
              </div>

              {/* Carousel View Container */}
              <div className={`
                ${generatedImages.length > 1 ? 'flex overflow-x-auto pb-6 snap-x snap-mandatory gap-0.5' : 'grid grid-cols-1 gap-6'}
              `}>
                {generatedImages.map((img, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => setSelectedSlideIndex(idx)}
                    className={`
                      relative group bg-white cursor-pointer transition-all duration-200
                      ${selectedSlideIndex === idx ? 'ring-4 ring-indigo-500 scale-[0.98]' : 'hover:scale-[0.99]'}
                      ${generatedImages.length > 1 ? 'min-w-[280px] sm:min-w-[320px] snap-center first:rounded-l-xl last:rounded-r-xl' : 'rounded-2xl shadow-md overflow-hidden'}
                    `}
                  >
                    <img src={img} alt={`Slide ${idx + 1}`} className="w-full h-auto object-cover" />
                    
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center gap-3 backdrop-blur-sm pointer-events-none">
                      <span className="text-white font-medium">Click to Edit Slide {idx + 1}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Live Editing Interface for Carousel */}
              {selectedSlideIndex !== null && (
                 <div className="bg-white p-5 rounded-2xl border border-indigo-200 shadow-lg animate-fade-in relative ring-4 ring-indigo-50/50">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-bold text-indigo-900">Editing Slide {selectedSlideIndex + 1}</h4>
                      <button onClick={() => setSelectedSlideIndex(null)} className="text-slate-400 hover:text-slate-600 text-sm">Cancel</button>
                    </div>
                    <div className="flex gap-2">
                       <input 
                        type="text" 
                        value={editInstruction}
                        onChange={(e) => setEditInstruction(e.target.value)}
                        placeholder="What do you want to change on this slide?"
                        className="flex-1 px-4 py-3 border border-slate-200 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                        onKeyDown={(e) => e.key === 'Enter' && handleEditSlide()}
                       />
                       <Button onClick={handleEditSlide} isLoading={isEditing} variant="primary" className="px-6">
                         <span className="flex items-center gap-1">
                           Update ({editCost} <CoinIcon className="w-4 h-4 inline-block" />)
                         </span>
                       </Button>
                    </div>
                 </div>
              )}
            </div>
          ) : (
             !isPlanning && !isGeneratingImages && (
              <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                  <span className="text-4xl">✨</span>
                </div>
                <p className="text-lg font-medium text-slate-500">Enter a topic to start</p>
                <p className="text-sm">We'll {manualContent ? "design based on your script" : "plan the content"} automatically.</p>
              </div>
            )
          )}
          
          {/* Loading States Visuals */}
          {(isPlanning || isGeneratingImages) && (
             <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-indigo-100 rounded-3xl bg-indigo-50/20">
                <svg className="animate-spin h-10 w-10 text-indigo-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-lg font-medium text-indigo-800">
                  {isPlanning ? "🧠 AI is Planning Content..." : "🎨 Generating Designs..."}
                </p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};