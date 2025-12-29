import React, { useState, useEffect } from 'react';
import { ToolType } from './types';
import { SocialMediaTool } from './components/Tools/SocialMediaTool';
import { AdCreativeTool } from './components/Tools/AdCreativeTool';
import { LandingPageTool } from './components/Tools/LandingPageTool';
import { CoinIcon } from './components/CoinIcon';
import { Logo } from './components/Logo';
import { PricingModal } from './components/PricingModal';

const App: React.FC = () => {
  const [currentTool, setCurrentTool] = useState<ToolType>('home');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [apiKeyReady, setApiKeyReady] = useState(false);
  const [isPricingOpen, setIsPricingOpen] = useState(false);
  
  // Points System State (Simulation)
  const [points, setPoints] = useState<number>(500);

  const deductPoints = (amount: number): boolean => {
    if (points >= amount) {
      setPoints(prev => prev - amount);
      return true;
    }
    // Open pricing modal instead of alert if insufficient funds
    setIsPricingOpen(true);
    return false;
  };

  // Check for API key on mount
  useEffect(() => {
    const checkApiKey = async () => {
      try {
        if ((window as any).aistudio && await (window as any).aistudio.hasSelectedApiKey()) {
          setApiKeyReady(true);
        }
      } catch (e) {
        console.error("Error checking API key status", e);
      }
    };
    checkApiKey();
  }, []);

  const handleApiKeySelect = async () => {
     if ((window as any).aistudio) {
       (window as any).aistudio.openSelectKey();
       setApiKeyReady(true);
     } else {
       setApiKeyReady(true);
     }
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const renderContent = () => {
    if (!apiKeyReady) {
      return (
        <div className="flex flex-col items-center justify-center h-screen bg-slate-50 text-center px-6">
           <div className="max-w-md p-8 bg-white rounded-2xl shadow-lg border border-slate-100 flex flex-col items-center">
              <div className="mb-6">
                <Logo className="w-20 h-20" textClassName="text-3xl" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 mb-4">Welcome to Creakits</h1>
              <p className="text-slate-600 mb-8">
                To access the Design Studio and our premium tools, please connect your API Key.
              </p>
              <button 
                onClick={handleApiKeySelect}
                className="px-8 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-all shadow-lg hover:shadow-indigo-200"
              >
                Connect API Key
              </button>
              <div className="mt-4 text-xs text-slate-400">
                <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="underline hover:text-slate-600">
                  API Key Documentation
                </a>
              </div>
           </div>
        </div>
      );
    }

    switch (currentTool) {
      case 'social-media':
        return <SocialMediaTool points={points} deductPoints={deductPoints} />;
      case 'ad-creative':
        return <AdCreativeTool points={points} deductPoints={deductPoints} />;
      case 'landing-page':
        return <LandingPageTool points={points} deductPoints={deductPoints} />;
      case 'home':
      default:
        return (
          <div className="bg-white">
            {/* 1. Hero Section - Centered Vertical Hierarchy */}
            <section className="relative pt-20 pb-12 lg:pt-32 lg:pb-20 overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-indigo-50/50 via-white to-white pointer-events-none" />
              
              <div className="max-w-5xl mx-auto px-6 relative z-10 text-center">
                
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-indigo-100 shadow-sm text-indigo-600 text-sm font-bold uppercase tracking-wide mb-8 animate-fade-in">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                  Powered by Advanced AI
                </div>

                {/* Main Headline */}
                <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold text-slate-900 tracking-tight mb-8 leading-[1.1]">
                  Turn your idea into <br className="hidden md:block"/>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Pro Design</span> in seconds.
                </h1>

                {/* Subheadline */}
                <p className="text-xl md:text-2xl text-slate-600 mb-10 max-w-3xl mx-auto leading-relaxed">
                  Generate high-conversion Landing Pages, Ad Creatives, and Social Media posts from a single product image.
                </p>

                {/* CTA */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center mb-20">
                  <button 
                    onClick={() => {
                      const element = document.getElementById('tools-section');
                      element?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="px-10 py-5 bg-slate-900 text-white text-lg font-bold rounded-2xl hover:bg-slate-800 hover:shadow-2xl hover:-translate-y-1 transition-all"
                  >
                    Start Designing Free
                  </button>
                </div>

                {/* Visual Graduation: Before & After */}
                <div className="relative mx-auto max-w-4xl">
                   {/* Speed Badge */}
                   <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-30 bg-green-500 text-white px-6 py-2 rounded-full font-bold shadow-lg shadow-green-200 animate-bounce flex items-center gap-2 border-4 border-white">
                      <span>⚡ In less than 1 min</span>
                   </div>

                   <div className="bg-slate-50 rounded-3xl p-4 md:p-8 border border-slate-200 shadow-2xl flex flex-col md:flex-row items-center gap-8 md:gap-12 relative overflow-hidden">
                      <div className="absolute inset-0 bg-grid-slate-200/50 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] pointer-events-none" style={{ backgroundSize: '20px 20px' }}></div>
                      
                      {/* BEFORE CARD */}
                      <div className="relative group w-64 md:w-72 flex-shrink-0">
                         <div className="absolute -top-3 left-4 bg-slate-800 text-white text-xs font-bold px-3 py-1 rounded shadow-md z-20">BEFORE</div>
                         <div className="bg-white p-4 rounded-2xl shadow-lg border border-slate-200 transform group-hover:rotate-0 rotate-[-2deg] transition-all duration-500">
                            <div className="aspect-square bg-slate-100 rounded-xl overflow-hidden mb-4 border border-slate-100 relative">
                               {/* Placeholder for the Keyboard/Remote */}
                               <img src="https://images.unsplash.com/photo-1551732993-e778438fc7da?w=500&q=80" alt="Raw Product Input" className="w-full h-full object-cover mix-blend-multiply opacity-90 p-4" />
                            </div>
                            <div className="space-y-2">
                               <div className="h-4 bg-slate-100 rounded-md w-3/4"></div>
                               <div className="h-3 bg-slate-50 rounded-md w-1/2"></div>
                            </div>
                            <div className="mt-4 pt-4 border-t border-slate-50 flex items-center gap-2 text-slate-400 text-xs font-medium">
                               <span>📸</span>
                               <span>Product Image Uploaded</span>
                            </div>
                         </div>
                      </div>

                      {/* ARROW */}
                      <div className="flex-shrink-0 z-10">
                        <div className="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center text-indigo-600 text-2xl font-bold border border-indigo-50">
                           ➔
                        </div>
                      </div>

                      {/* AFTER CARD (Mockup Simulation) */}
                      <div className="relative w-full max-w-sm mx-auto md:mx-0 flex-grow">
                         <div className="absolute -top-3 right-4 bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md z-20 animate-pulse">AFTER</div>
                         <div className="bg-slate-900 p-2 rounded-[2.5rem] shadow-2xl transform hover:scale-[1.02] transition-transform duration-500 border-4 border-slate-800">
                            {/* Phone Screen Container */}
                            <div className="bg-white rounded-[2rem] overflow-hidden relative h-[400px] w-full">
                               {/* Simulated Landing Page Scroll */}
                               <div className="absolute top-0 left-0 w-full animate-[translateY_15s_linear_infinite] hover:pause">
                                  
                                  {/* 1. Header & Hero */}
                                  <div className="bg-blue-600 text-white p-4 text-center pb-8 rounded-b-3xl relative overflow-hidden">
                                     <div className="flex justify-between items-center text-[10px] mb-4 opacity-80">
                                        <span>🚛 Free Shipping</span>
                                        <span>💰 Cash on Delivery</span>
                                     </div>
                                     <h3 className="text-xl font-bold mb-2 leading-tight" dir="rtl">تحكم فوري وسهولة فائقة لكل أجهزتك!</h3>
                                     <div className="w-full h-32 bg-slate-200 rounded-xl mt-4 overflow-hidden shadow-lg border-2 border-white/20">
                                        <img src="https://images.unsplash.com/photo-1593784653056-4912e4000392?w=500&q=80" className="w-full h-full object-cover" alt="Family TV" />
                                     </div>
                                  </div>

                                  {/* 2. Comparison */}
                                  <div className="p-4 bg-white">
                                     <div className="flex gap-2 mb-4">
                                        <div className="flex-1 bg-red-50 p-2 rounded-lg border border-red-100 text-center">
                                           <span className="text-xs text-red-500 font-bold block mb-1">قبل (الفوضى)</span>
                                           <div className="h-12 bg-red-200/50 rounded flex items-center justify-center text-[10px] text-red-400">❌</div>
                                        </div>
                                        <div className="flex-1 bg-green-50 p-2 rounded-lg border border-green-100 text-center">
                                           <span className="text-xs text-green-600 font-bold block mb-1">بعد (راحة)</span>
                                           <div className="h-12 bg-green-200/50 rounded flex items-center justify-center text-[10px] text-green-500">✅</div>
                                        </div>
                                     </div>
                                  </div>

                                  {/* 3. Satisfaction Guarantee */}
                                  <div className="bg-red-600 p-4 text-white text-center">
                                     <div className="w-16 h-16 mx-auto bg-yellow-400 rounded-full flex items-center justify-center border-4 border-white/20 shadow-lg mb-2 text-red-700 font-bold text-xs">
                                        100%<br/>Original
                                     </div>
                                     <h4 className="font-bold text-lg mb-1" dir="rtl">ضمان الرضا التام</h4>
                                     <p className="text-xs opacity-90" dir="rtl">خالي من المخاطر - دفع آمن</p>
                                  </div>

                                  {/* 4. Features Grid */}
                                  <div className="p-4 grid grid-cols-3 gap-2 bg-slate-50">
                                     {[1,2,3].map(i => (
                                        <div key={i} className="bg-white p-2 rounded-lg shadow-sm text-center">
                                           <div className="w-8 h-8 mx-auto bg-indigo-50 rounded-full mb-1"></div>
                                           <div className="h-2 bg-slate-100 rounded w-full"></div>
                                        </div>
                                     ))}
                                  </div>
                                  
                                  {/* 5. Product Shot */}
                                  <div className="p-6 bg-white text-center">
                                     <img src="https://images.unsplash.com/photo-1551732993-e778438fc7da?w=500&q=80" className="w-32 mx-auto drop-shadow-2xl mb-4" />
                                     <button className="w-full bg-green-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-green-200 text-lg">
                                       اطلب الآن
                                     </button>
                                  </div>

                                  {/* Padding for loop */}
                                  <div className="h-20 bg-slate-50"></div>

                               </div>
                               
                               {/* Sticky Nav Bar Simulation */}
                               <div className="absolute bottom-0 left-0 w-full h-12 bg-white/90 backdrop-blur border-t border-slate-100 flex items-center justify-around px-4 z-10">
                                  <div className="w-8 h-1 bg-slate-300 rounded-full"></div>
                               </div>
                            </div>
                         </div>
                      </div>

                   </div>
                </div>

              </div>
            </section>

            {/* 2. The Trinity Tools */}
            <section id="tools-section" className="py-24 bg-slate-50">
              <div className="max-w-7xl mx-auto px-6">
                <div className="text-center mb-16">
                  <h2 className="text-3xl lg:text-4xl font-extrabold text-slate-900 mb-4">Three Powerful Engines.</h2>
                  <p className="text-lg text-slate-600">Choose your tool and let AI handle the rest.</p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                  {/* Social Media Card */}
                  <div 
                    onClick={() => setCurrentTool('social-media')}
                    className="group relative bg-white rounded-3xl p-8 shadow-sm hover:shadow-2xl transition-all duration-300 cursor-pointer border border-slate-100 overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-400 to-blue-600"></div>
                    <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform">
                      📱
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-3">Social Media</h3>
                    <p className="text-slate-500 mb-6 leading-relaxed">
                      Type your idea and get a full carousel or post instantly. 
                      Perfect for Instagram & LinkedIn strategies.
                    </p>
                    <div className="flex items-center text-blue-600 font-bold group-hover:gap-2 transition-all">
                      Create Post <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                    </div>
                  </div>

                  {/* Ad Creative Card */}
                  <div 
                    onClick={() => setCurrentTool('ad-creative')}
                    className="group relative bg-white rounded-3xl p-8 shadow-sm hover:shadow-2xl transition-all duration-300 cursor-pointer border border-slate-100 overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-purple-400 to-pink-600"></div>
                    <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform">
                      📢
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-3">Ad Creative</h3>
                    <p className="text-slate-500 mb-6 leading-relaxed">
                      Upload your product, we handle the background and copy.
                      High-conversion square ads for any market.
                    </p>
                    <div className="flex items-center text-purple-600 font-bold group-hover:gap-2 transition-all">
                      Design Ad <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                    </div>
                  </div>

                  {/* Landing Page Card */}
                  <div 
                    onClick={() => setCurrentTool('landing-page')}
                    className="group relative bg-white rounded-3xl p-8 shadow-sm hover:shadow-2xl transition-all duration-300 cursor-pointer border border-slate-100 overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 to-teal-600"></div>
                    <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform">
                      🌐
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-3">Landing Pages</h3>
                    <p className="text-slate-500 mb-6 leading-relaxed">
                      Turn a product shot into a full mobile landing page UI.
                      Optimized for sales and visual hierarchy.
                    </p>
                    <div className="flex items-center text-emerald-600 font-bold group-hover:gap-2 transition-all">
                      Build Page <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* 3. Workflow - How it Works */}
            <section className="py-24 bg-white">
              <div className="max-w-7xl mx-auto px-6">
                <div className="text-center mb-16">
                  <span className="text-indigo-600 font-bold uppercase tracking-wider text-sm">How it Works</span>
                  <h2 className="text-3xl lg:text-4xl font-extrabold text-slate-900 mt-2">From Idea to Result in 3 Steps</h2>
                </div>
                
                <div className="grid md:grid-cols-3 gap-12 text-center relative">
                  {/* Connector Line (Desktop) */}
                  <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-slate-200 via-indigo-200 to-slate-200 z-0"></div>

                  {/* Step 1 */}
                  <div className="relative z-10 group">
                    <div className="w-24 h-24 mx-auto bg-white border-4 border-white shadow-xl rounded-full flex items-center justify-center mb-6 group-hover:-translate-y-2 transition-transform duration-300 relative">
                       <div className="absolute inset-0 bg-indigo-50 rounded-full transform scale-90"></div>
                       <span className="relative text-4xl">📤</span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">1. Upload or Describe</h3>
                    <p className="text-slate-500 max-w-xs mx-auto">Simply upload your product photo or describe the content you need.</p>
                  </div>

                  {/* Step 2 */}
                  <div className="relative z-10 group">
                    <div className="w-24 h-24 mx-auto bg-white border-4 border-white shadow-xl rounded-full flex items-center justify-center mb-6 group-hover:-translate-y-2 transition-transform duration-300 relative">
                        <div className="absolute inset-0 bg-indigo-50 rounded-full transform scale-90"></div>
                        <span className="relative text-4xl">🎛️</span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">2. Customize</h3>
                    <p className="text-slate-500 max-w-xs mx-auto">Select your tool (Social, Ads, Landing) and tweak the settings.</p>
                  </div>

                  {/* Step 3 */}
                  <div className="relative z-10 group">
                    <div className="w-24 h-24 mx-auto bg-white border-4 border-white shadow-xl rounded-full flex items-center justify-center mb-6 group-hover:-translate-y-2 transition-transform duration-300 relative">
                        <div className="absolute inset-0 bg-indigo-50 rounded-full transform scale-90"></div>
                        <span className="relative text-4xl">🚀</span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">3. Launch</h3>
                    <p className="text-slate-500 max-w-xs mx-auto">Get high-quality, professional assets ready for your campaign.</p>
                  </div>
                </div>
              </div>
            </section>

            {/* 4. Showcase / Gallery */}
            <section className="py-24 bg-slate-900 text-white overflow-hidden">
              <div className="max-w-7xl mx-auto px-6">
                <div className="flex flex-col md:flex-row items-end justify-between mb-12 gap-6">
                  <div>
                    <h2 className="text-3xl lg:text-4xl font-extrabold mb-4">Made with Creakits</h2>
                    <p className="text-slate-400 text-lg">See what's possible with our technology.</p>
                  </div>
                  <button onClick={() => setCurrentTool('ad-creative')} className="px-6 py-2 border border-slate-700 rounded-full hover:bg-slate-800 transition-colors">
                    Try it yourself
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 h-[500px]">
                  {/* Simulated Masonry Grid */}
                  <div className="space-y-4 translate-y-8">
                     <div className="bg-slate-800 rounded-xl h-48 w-full animate-pulse opacity-50"></div>
                     <div className="bg-gradient-to-br from-pink-500 to-orange-400 rounded-xl h-64 w-full flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform duration-500">
                        <span className="font-bold text-2xl">Ad Creative</span>
                     </div>
                  </div>
                  <div className="space-y-4 -translate-y-4">
                     <div className="bg-gradient-to-br from-indigo-500 to-blue-500 rounded-xl h-56 w-full flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform duration-500">
                       <span className="font-bold text-2xl">Carousel</span>
                     </div>
                     <div className="bg-slate-800 rounded-xl h-40 w-full animate-pulse opacity-30"></div>
                  </div>
                  <div className="space-y-4 translate-y-12">
                     <div className="bg-slate-800 rounded-xl h-32 w-full animate-pulse opacity-40"></div>
                     <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl h-72 w-full flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform duration-500">
                       <span className="font-bold text-2xl">Landing UI</span>
                     </div>
                  </div>
                  <div className="space-y-4">
                     <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl h-48 w-full flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform duration-500">
                       <span className="font-bold text-2xl text-slate-900">Social</span>
                     </div>
                     <div className="bg-slate-800 rounded-xl h-56 w-full animate-pulse opacity-60"></div>
                  </div>
                </div>
              </div>
            </section>

            {/* 5. Value Proposition */}
            <section className="py-24 bg-white">
              <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
                 <div>
                   <h2 className="text-3xl lg:text-4xl font-extrabold text-slate-900 mb-6">Why Creakits?</h2>
                   <div className="space-y-8">
                      <div className="flex gap-4">
                        <div className="w-12 h-12 bg-indigo-50 rounded-lg flex items-center justify-center text-xl shrink-0">⏱️</div>
                        <div>
                          <h4 className="font-bold text-lg text-slate-900">Save Time</h4>
                          <p className="text-slate-500">Skip hours of Photoshop. Get 80% of the work done in 10 seconds.</p>
                        </div>
                      </div>
                      <div className="flex gap-4">
                        <div className="w-12 h-12 bg-indigo-50 rounded-lg flex items-center justify-center text-xl shrink-0">💸</div>
                        <div>
                          <h4 className="font-bold text-lg text-slate-900">Save Money</h4>
                          <p className="text-slate-500">No need to hire expensive agencies for daily content needs.</p>
                        </div>
                      </div>
                      <div className="flex gap-4">
                        <div className="w-12 h-12 bg-indigo-50 rounded-lg flex items-center justify-center text-xl shrink-0">🧠</div>
                        <div>
                          <h4 className="font-bold text-lg text-slate-900">Specialized AI</h4>
                          <p className="text-slate-500">Unlike generic models, Creakits is tuned for marketing & conversion.</p>
                        </div>
                      </div>
                   </div>
                 </div>
                 <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 relative">
                    <div className="absolute top-4 right-4 text-6xl opacity-10">💪</div>
                    <div className="space-y-4">
                      <div className="h-4 w-1/3 bg-slate-200 rounded"></div>
                      <div className="h-4 w-2/3 bg-slate-200 rounded"></div>
                      <div className="h-32 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center text-slate-300">
                        Visualizing Success
                      </div>
                    </div>
                 </div>
              </div>
            </section>

            {/* 6. FAQ & Final CTA */}
            <section className="py-24 bg-slate-50 border-t border-slate-100">
              <div className="max-w-3xl mx-auto px-6 text-center">
                <h2 className="text-3xl font-bold text-slate-900 mb-12">Frequently Asked Questions</h2>
                
                <div className="space-y-4 text-left mb-16">
                  <div className="bg-white p-6 rounded-xl shadow-sm">
                    <h4 className="font-bold text-slate-900 mb-2">Do I need design experience?</h4>
                    <p className="text-slate-600">Absolutely not. Creakits is built for entrepreneurs and marketers, not just designers.</p>
                  </div>
                  <div className="bg-white p-6 rounded-xl shadow-sm">
                    <h4 className="font-bold text-slate-900 mb-2">Is the content copyright free?</h4>
                    <p className="text-slate-600">Yes, you own the designs generated by the AI.</p>
                  </div>
                </div>

                <div className="bg-slate-900 rounded-3xl p-12 text-white">
                  <h2 className="text-3xl font-bold mb-6">Ready to upgrade your workflow?</h2>
                  <p className="text-slate-400 mb-8 max-w-lg mx-auto">Join thousands of creators using Creakits today.</p>
                  <button 
                    onClick={() => {
                      const element = document.getElementById('tools-section');
                      element?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="px-8 py-4 bg-white text-slate-900 font-bold rounded-xl hover:bg-indigo-50 transition-colors"
                  >
                    Start Creating Now
                  </button>
                </div>
              </div>
            </section>

            {/* Footer */}
            <footer className="bg-white border-t border-slate-100 py-12">
              <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-2">
                   <Logo className="w-8 h-8" showText={true} />
                </div>
                <div className="flex gap-6 text-sm text-slate-500">
                  <a href="#" className="hover:text-indigo-600">Privacy Policy</a>
                  <a href="#" className="hover:text-indigo-600">Terms of Service</a>
                  <a href="#" className="hover:text-indigo-600">Contact Us</a>
                </div>
                <div className="text-sm text-slate-400">
                  © 2024 Creakits AI. All rights reserved.
                </div>
              </div>
            </footer>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-800 font-sans">
      {/* Mobile Menu Button (only when logged in) */}
      {apiKeyReady && (
        <button 
          onClick={toggleSidebar}
          className="fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md md:hidden text-slate-600"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
        </button>
      )}

      {/* Pricing Modal */}
      <PricingModal isOpen={isPricingOpen} onClose={() => setIsPricingOpen(false)} />

      {/* Sidebar Overlay */}
      {isSidebarOpen && apiKeyReady && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      {apiKeyReady && (
        <aside 
          className={`
            fixed top-0 left-0 h-full w-72 bg-white border-r border-slate-100 shadow-xl z-50 transform transition-transform duration-300 ease-in-out
            md:translate-x-0 md:static md:shadow-none
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          `}
        >
          <div className="p-6 h-full flex flex-col">
            <div className="mb-8 flex items-center gap-2 cursor-pointer" onClick={() => { setCurrentTool('home'); setIsSidebarOpen(false); }}>
              <Logo className="w-10 h-10" textClassName="text-xl" />
            </div>
            
            <nav className="flex-1 space-y-2">
              <SidebarItem 
                active={currentTool === 'home'} 
                onClick={() => { setCurrentTool('home'); setIsSidebarOpen(false); }}
                icon="🏠" 
                label="Home" 
              />
              <div className="pt-4 pb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">Tools</div>
              <SidebarItem 
                active={currentTool === 'social-media'} 
                onClick={() => { setCurrentTool('social-media'); setIsSidebarOpen(false); }}
                icon="📱" 
                label="Social Media" 
              />
              <SidebarItem 
                active={currentTool === 'ad-creative'} 
                onClick={() => { setCurrentTool('ad-creative'); setIsSidebarOpen(false); }}
                icon="📢" 
                label="Ad Creative" 
              />
              <SidebarItem 
                active={currentTool === 'landing-page'} 
                onClick={() => { setCurrentTool('landing-page'); setIsSidebarOpen(false); }}
                icon="🌐" 
                label="Landing Page" 
              />
            </nav>

            <div className="mt-auto pt-6 border-t border-slate-100">
               <div className="text-xs text-slate-400 text-center">
                 Powered by Creakits AI Engine
               </div>
            </div>
          </div>
        </aside>
      )}

      {/* Main Content */}
      <main className="flex-1 relative overflow-x-hidden">
        
        {/* Points Display - Top Right */}
        {apiKeyReady && (
          <div className="fixed top-4 right-4 sm:top-6 sm:right-8 z-50 pointer-events-none">
             <div 
              onClick={() => setIsPricingOpen(true)}
              className="pointer-events-auto cursor-pointer bg-white/90 backdrop-blur-md shadow-lg border border-slate-200 rounded-full pl-5 pr-2 py-2 flex items-center gap-3 transition-transform hover:scale-105 active:scale-95 group"
             >
                <div className="flex flex-col items-end leading-none">
                   <span className="font-bold text-slate-900 text-lg tabular-nums group-hover:text-indigo-600 transition-colors">{points}</span>
                   <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Credits</span>
                </div>
                <div className="w-8 h-8 flex items-center justify-center bg-indigo-50 rounded-full group-hover:bg-indigo-100 transition-colors">
                  <CoinIcon className="w-6 h-6" />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-pulse"></div>
             </div>
          </div>
        )}

        {renderContent()}
      </main>
    </div>
  );
};

const SidebarItem: React.FC<{ active: boolean; onClick: () => void; icon: string; label: string }> = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-left
      ${active 
        ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-sm' 
        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}
    `}
  >
    <span className="text-lg">{icon}</span>
    <span>{label}</span>
  </button>
);

export default App;