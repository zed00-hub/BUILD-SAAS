import React, { useState, useEffect } from 'react';
import { ToolType } from './types';
import { SocialMediaTool } from './components/Tools/SocialMediaTool';
import { AdCreativeTool } from './components/Tools/AdCreativeTool';
import { LandingPageTool } from './components/Tools/LandingPageTool';
import { CoinIcon } from './components/CoinIcon';
import { Logo } from './components/Logo';
import { PricingModal } from './components/PricingModal';
import { AuthScreen } from './components/AuthScreen';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { LanguageSwitcher } from './components/LanguageSwitcher';

import { auth } from './src/firebase';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';

import { VerifyEmailScreen } from './components/VerifyEmailScreen';
import { WalletService } from './src/services/walletService';
import { OrderService } from './src/services/orderService';

import { AdminDashboard } from './components/Admin/AdminDashboard';

const AppContent: React.FC = () => {
  const [currentTool, setCurrentTool] = useState<ToolType>('home');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isPricingOpen, setIsPricingOpen] = useState(false);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Get language from context to handle RTL logic explicitly
  const { t, language } = useLanguage();
  const isRtl = language === 'ar';

  // Points System Handling
  const [points, setPoints] = useState<number>(0);

  const handleDeduction = async (amount: number, description: string): Promise<boolean> => {
    // ... logic remains same ...
    if (!user) return false;

    // Optimistic local check
    if (points < amount) {
      setIsPricingOpen(true);
      return false;
    }

    try {
      const orderId = await OrderService.createOrder(
        user.uid,
        currentTool as any,
        { description, amount },
        amount
      );

      const success = await WalletService.deductPoints(user.uid, amount, description, orderId);

      if (success) {
        setPoints(prev => prev - amount);
        await OrderService.updateOrderStatus(orderId, 'completed', { resultCode: 'SUCCESS' });
        return true;
      } else {
        await OrderService.updateOrderStatus(orderId, 'failed', { error: 'Insufficient funds transaction' });
        setIsPricingOpen(true);
        return false;
      }
    } catch (e) {
      console.error("Deduction error:", e);
      setIsPricingOpen(true);
      return false;
    }
  };

  // Monitor Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          // 1. Initialize Wallet if not exists
          await WalletService.initializeUserWallet(
            currentUser.uid,
            currentUser.email || '',
            currentUser.displayName || undefined,
            currentUser.photoURL || undefined
          );

          // 2. Fetch User Profile
          const userProfile = await WalletService.getUserProfile(currentUser.uid);
          if (userProfile) {
            setPoints(userProfile.balance);
            setIsAdmin(!!userProfile.isAdmin);
          }
        } catch (error) {
          console.error("Error fetching wallet:", error);
        }
      } else {
        setIsAdmin(false);
      }
      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  const handleAuthSuccess = () => {
    // Managed automatically by onAuthStateChanged
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const renderContent = () => {
    if (loadingAuth) return <div className="h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;

    if (!user) {
      return <AuthScreen onLogin={handleAuthSuccess} />;
    }

    // Force Email Verification
    if (!user.emailVerified) {
      return <VerifyEmailScreen />;
    }

    switch (currentTool) {
      case 'social-media':
        return <SocialMediaTool points={points} deductPoints={handleDeduction} />;
      case 'ad-creative':
        return <AdCreativeTool points={points} deductPoints={handleDeduction} />;
      case 'landing-page':
        return <LandingPageTool points={points} deductPoints={handleDeduction} />;
      case 'admin':
        return isAdmin ? <AdminDashboard /> : <div className="p-8 text-center text-red-500">Access Denied</div>;
      case 'home':
      default:
        return (
          <div className="bg-white">
            {/* 1. Hero Section */}
            <section className="relative pt-20 pb-12 lg:pt-32 lg:pb-20 overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-indigo-50/50 via-white to-white pointer-events-none" />

              <div className="max-w-5xl mx-auto px-6 relative z-10 text-center">

                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-indigo-100 shadow-sm text-indigo-600 text-sm font-bold uppercase tracking-wide mb-8 animate-fade-in">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                  {t('hero_badge')}
                </div>

                {/* Main Headline */}
                <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold text-slate-900 tracking-tight mb-8 leading-[1.1]">
                  {t('hero_title_1')} <br className="hidden md:block" />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600"> {t('hero_title_highlight')} </span>
                  {t('hero_title_2')}
                </h1>

                {/* Subheadline */}
                <p className="text-xl md:text-2xl text-slate-600 mb-10 max-w-3xl mx-auto leading-relaxed">
                  {t('hero_subtitle')}
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
                    {t('cta_start_free')}
                  </button>
                </div>

                {/* Visual Graduation: Before & After */}
                <div className="relative mx-auto max-w-4xl">
                  {/* Speed Badge */}
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-30 bg-green-500 text-white px-6 py-2 rounded-full font-bold shadow-lg shadow-green-200 animate-bounce flex items-center gap-2 border-4 border-white whitespace-nowrap">
                    <span>{t('speed_badge')}</span>
                  </div>

                  <div className="bg-slate-50 rounded-3xl p-4 md:p-8 border border-slate-200 shadow-2xl flex flex-col md:flex-row items-center gap-8 md:gap-12 relative overflow-hidden">
                    <div className="absolute inset-0 bg-grid-slate-200/50 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] pointer-events-none" style={{ backgroundSize: '20px 20px' }}></div>

                    {/* BEFORE CARD */}
                    <div className="relative group w-64 md:w-72 flex-shrink-0">
                      <div className="absolute -top-3 left-4 bg-slate-800 text-white text-xs font-bold px-3 py-1 rounded shadow-md z-20 rtl:left-auto rtl:right-4">{t('before')}</div>
                      <div className="bg-white p-4 rounded-2xl shadow-lg border border-slate-200 transform group-hover:rotate-0 rotate-[-2deg] rtl:rotate-[2deg] transition-all duration-500">
                        <div className="aspect-square bg-slate-100 rounded-xl overflow-hidden mb-4 border border-slate-100 relative">
                          <img src="https://images.unsplash.com/photo-1551732993-e778438fc7da?w=500&q=80" alt="Raw Product Input" className="w-full h-full object-cover mix-blend-multiply opacity-90 p-4" />
                        </div>
                        <div className="space-y-2">
                          <div className="h-4 bg-slate-100 rounded-md w-3/4"></div>
                          <div className="h-3 bg-slate-50 rounded-md w-1/2"></div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-slate-50 flex items-center gap-2 text-slate-400 text-xs font-medium">
                          <span>📸</span>
                          <span>{t('upload_text')}</span>
                        </div>
                      </div>
                    </div>

                    {/* ARROW */}
                    <div className="flex-shrink-0 z-10">
                      <div className="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center text-indigo-600 text-2xl font-bold border border-indigo-50 rtl:rotate-180">
                        ➔
                      </div>
                    </div>

                    {/* AFTER CARD */}
                    <div className="relative w-full max-w-sm mx-auto md:mx-0 flex-grow">
                      <div className="absolute -top-3 right-4 bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md z-20 animate-pulse rtl:right-auto rtl:left-4">{t('after')}</div>
                      <div className="bg-slate-900 p-2 rounded-[2.5rem] shadow-2xl transform hover:scale-[1.02] transition-transform duration-500 border-4 border-slate-800">
                        <div className="bg-white rounded-[2rem] overflow-hidden relative h-[400px] w-full">
                          {/* Mockup Content */}
                          <div className="absolute top-0 left-0 w-full animate-[translateY_15s_linear_infinite] hover:pause">
                            <div className="bg-blue-600 text-white p-4 text-center pb-8 rounded-b-3xl relative overflow-hidden">
                              <div className="flex justify-between items-center text-[10px] mb-4 opacity-80">
                                <span>🚛 Free Shipping</span>
                                <span>💰 Cash on Delivery</span>
                              </div>
                              <h3 className="text-xl font-bold mb-2 leading-tight">Instant Control for all devices!</h3>
                              <div className="w-full h-32 bg-slate-200 rounded-xl mt-4 overflow-hidden shadow-lg border-2 border-white/20">
                                <img src="https://images.unsplash.com/photo-1593784653056-4912e4000392?w=500&q=80" className="w-full h-full object-cover" alt="Family TV" />
                              </div>
                            </div>
                            <div className="p-4 bg-white">
                              <div className="flex gap-2 mb-4">
                                <div className="flex-1 bg-red-50 p-2 rounded-lg border border-red-100 text-center">
                                  <span className="text-xs text-red-500 font-bold block mb-1">Before</span>
                                  <div className="h-12 bg-red-200/50 rounded flex items-center justify-center text-[10px] text-red-400">❌</div>
                                </div>
                                <div className="flex-1 bg-green-50 p-2 rounded-lg border border-green-100 text-center">
                                  <span className="text-xs text-green-600 font-bold block mb-1">After</span>
                                  <div className="h-12 bg-green-200/50 rounded flex items-center justify-center text-[10px] text-green-500">✅</div>
                                </div>
                              </div>
                            </div>
                            <div className="p-6 bg-white text-center">
                              <img src="https://images.unsplash.com/photo-1551732993-e778438fc7da?w=500&q=80" className="w-32 mx-auto drop-shadow-2xl mb-4" />
                              <button className="w-full bg-green-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-green-200 text-lg">Order Now</button>
                            </div>
                            <div className="h-20 bg-slate-50"></div>
                          </div>
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

            {/* 2. Tools Grid */}
            <section id="tools-section" className="py-24 bg-slate-50">
              <div className="max-w-7xl mx-auto px-6">
                <div className="text-center mb-16">
                  <h2 className="text-3xl lg:text-4xl font-extrabold text-slate-900 mb-4">Three Powerful Engines.</h2>
                  <p className="text-lg text-slate-600">Choose your tool and let AI handle the rest.</p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                  <div onClick={() => setCurrentTool('social-media')} className="group relative bg-white rounded-3xl p-8 shadow-sm hover:shadow-2xl transition-all duration-300 cursor-pointer border border-slate-100 overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-400 to-blue-600 rtl:right-0 rtl:left-auto"></div>
                    <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform">📱</div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-3">{t('tool_social')}</h3>
                    <p className="text-slate-500 mb-6 leading-relaxed">Perfect for Instagram & LinkedIn strategies.</p>
                    <div className="flex items-center text-blue-600 font-bold group-hover:gap-2 transition-all">
                      Create Post <span className="opacity-0 group-hover:opacity-100 transition-opacity rtl:rotate-180">→</span>
                    </div>
                  </div>

                  <div onClick={() => setCurrentTool('ad-creative')} className="group relative bg-white rounded-3xl p-8 shadow-sm hover:shadow-2xl transition-all duration-300 cursor-pointer border border-slate-100 overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-purple-400 to-pink-600 rtl:right-0 rtl:left-auto"></div>
                    <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform">📢</div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-3">{t('tool_ad')}</h3>
                    <p className="text-slate-500 mb-6 leading-relaxed">High-conversion square ads for any market.</p>
                    <div className="flex items-center text-purple-600 font-bold group-hover:gap-2 transition-all">
                      Design Ad <span className="opacity-0 group-hover:opacity-100 transition-opacity rtl:rotate-180">→</span>
                    </div>
                  </div>

                  <div onClick={() => setCurrentTool('landing-page')} className="group relative bg-white rounded-3xl p-8 shadow-sm hover:shadow-2xl transition-all duration-300 cursor-pointer border border-slate-100 overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 to-teal-600 rtl:right-0 rtl:left-auto"></div>
                    <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform">🌐</div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-3">{t('tool_landing')}</h3>
                    <p className="text-slate-500 mb-6 leading-relaxed">Turn a product shot into a full mobile landing page UI.</p>
                    <div className="flex items-center text-emerald-600 font-bold group-hover:gap-2 transition-all">
                      Build Page <span className="opacity-0 group-hover:opacity-100 transition-opacity rtl:rotate-180">→</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* 3. Workflow */}
            <section className="py-24 bg-white">
              <div className="max-w-7xl mx-auto px-6">
                <div className="text-center mb-16">
                  <span className="text-indigo-600 font-bold uppercase tracking-wider text-sm">{t('how_it_works')}</span>
                  <h2 className="text-3xl lg:text-4xl font-extrabold text-slate-900 mt-2">{t('steps_title')}</h2>
                </div>
                <div className="grid md:grid-cols-3 gap-12 text-center relative">
                  <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-slate-200 via-indigo-200 to-slate-200 z-0"></div>
                  <div className="relative z-10 group">
                    <div className="w-24 h-24 mx-auto bg-white border-4 border-white shadow-xl rounded-full flex items-center justify-center mb-6 group-hover:-translate-y-2 transition-transform duration-300 relative">
                      <div className="absolute inset-0 bg-indigo-50 rounded-full transform scale-90"></div>
                      <span className="relative text-4xl">📤</span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">{t('step1_title')}</h3>
                    <p className="text-slate-500 max-w-xs mx-auto">{t('step1_desc')}</p>
                  </div>
                  <div className="relative z-10 group">
                    <div className="w-24 h-24 mx-auto bg-white border-4 border-white shadow-xl rounded-full flex items-center justify-center mb-6 group-hover:-translate-y-2 transition-transform duration-300 relative">
                      <div className="absolute inset-0 bg-indigo-50 rounded-full transform scale-90"></div>
                      <span className="relative text-4xl">🎛️</span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">{t('step2_title')}</h3>
                    <p className="text-slate-500 max-w-xs mx-auto">{t('step2_desc')}</p>
                  </div>
                  <div className="relative z-10 group">
                    <div className="w-24 h-24 mx-auto bg-white border-4 border-white shadow-xl rounded-full flex items-center justify-center mb-6 group-hover:-translate-y-2 transition-transform duration-300 relative">
                      <div className="absolute inset-0 bg-indigo-50 rounded-full transform scale-90"></div>
                      <span className="relative text-4xl">🚀</span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">{t('step3_title')}</h3>
                    <p className="text-slate-500 max-w-xs mx-auto">{t('step3_desc')}</p>
                  </div>
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
                  <a href="#" className="hover:text-indigo-600">{t('privacy')}</a>
                  <a href="#" className="hover:text-indigo-600">{t('terms')}</a>
                  <a href="#" className="hover:text-indigo-600">{t('contact')}</a>
                </div>
                <div className="text-sm text-slate-400">
                  {t('rights')}
                </div>
              </div>
            </footer>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-800 font-sans">
      {/* Mobile Menu Button - Correctly Positioned for LTR and RTL */}
      {user && (
        <button
          onClick={toggleSidebar}
          className="fixed top-4 left-4 rtl:left-auto rtl:right-4 z-50 p-2 bg-white rounded-lg shadow-md md:hidden text-slate-600 hover:text-indigo-600 hover:bg-slate-50 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
        </button>
      )}

      {/* Pricing Modal */}
      <PricingModal isOpen={isPricingOpen} onClose={() => setIsPricingOpen(false)} />

      {/* Sidebar Overlay */}
      {isSidebarOpen && user && (
        <div
          className="fixed inset-0 bg-black/20 z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Improved LTR/RTL Logic */}
      {user && (
        <aside
          className={`
            fixed top-0 bottom-0 z-50 w-72 bg-white border-r rtl:border-r-0 rtl:border-l border-slate-100 shadow-xl transition-transform duration-300 ease-in-out
            
            /* Horizontal Positioning */
            left-0 rtl:left-auto rtl:right-0
            
            /* Desktop Overrides - Force Visible and In-Flow */
            md:relative md:!translate-x-0 md:shadow-none
            
            /* Mobile Transform Logic based on language state */
            ${isSidebarOpen
              ? 'translate-x-0'
              : (isRtl ? 'translate-x-full' : '-translate-x-full')
            }
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
                label={t('home')}
              />
              <div className="pt-4 pb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">{t('tools')}</div>
              <SidebarItem
                active={currentTool === 'social-media'}
                onClick={() => { setCurrentTool('social-media'); setIsSidebarOpen(false); }}
                icon="📱"
                label={t('tool_social')}
              />
              <SidebarItem
                active={currentTool === 'ad-creative'}
                onClick={() => { setCurrentTool('ad-creative'); setIsSidebarOpen(false); }}
                icon="📢"
                label={t('tool_ad')}
              />
              <SidebarItem
                active={currentTool === 'landing-page'}
                onClick={() => { setCurrentTool('landing-page'); setIsSidebarOpen(false); }}
                icon="🌐"
                label={t('tool_landing')}
              />

              {isAdmin && (
                <>
                  <div className="pt-4 pb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">Administration</div>
                  <SidebarItem
                    active={currentTool === 'admin'}
                    onClick={() => { setCurrentTool('admin'); setIsSidebarOpen(false); }}
                    icon="🛡️"
                    label="Admin Panel"
                  />
                </>
              )}
            </nav>

            <div className="mt-auto pt-6 border-t border-slate-100 flex flex-col gap-4">
              <div className="text-xs text-slate-400 text-center">
                {t('powered_by')}
              </div>
            </div>
          </div>
        </aside>
      )}

      {/* Main Content */}
      <main className="flex-1 relative overflow-x-hidden">

        {/* Top Header Controls - Correctly Positioned for LTR and RTL */}
        {user && (
          <div className="fixed top-4 right-4 rtl:right-auto rtl:left-4 sm:top-6 sm:right-8 rtl:sm:left-8 z-50 flex items-center gap-3">

            {/* Language Switcher */}
            <div className="bg-white/90 backdrop-blur-md shadow-lg border border-slate-200 rounded-full px-1 py-1">
              <LanguageSwitcher className="!mb-0" />
            </div>

            {/* Account Dropdown (Simplified as Icon for now, can be expanded) */}
            <div className="relative group">
              <div className="w-10 h-10 rounded-full bg-white shadow-lg border border-slate-200 cursor-pointer overflow-hidden flex items-center justify-center hover:ring-2 hover:ring-indigo-100 transition-all">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="User" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-indigo-700 font-bold">{user.email?.[0].toUpperCase() || "U"}</span>
                )}
              </div>

              {/* Dropdown Menu */}
              <div className="absolute top-12 right-0 rtl:right-auto rtl:left-0 w-48 bg-white rounded-xl shadow-xl border border-slate-100 p-2 invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all transform origin-top-right rtl:origin-top-left z-50">
                <div className="px-3 py-2 border-b border-slate-50 mb-1">
                  <p className="text-sm font-bold text-slate-900 truncate">{user.displayName || t('welcome_back')}</p>
                  <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
                </div>
                <button
                  onClick={() => signOut(auth)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors text-left rtl:text-right"
                >
                  <span>🚪</span> {t('sign_out')}
                </button>
              </div>
            </div>

            {/* Points Display */}
            <div
              onClick={() => setIsPricingOpen(true)}
              className="cursor-pointer bg-white/90 backdrop-blur-md shadow-lg border border-slate-200 rounded-full pl-5 pr-2 rtl:pl-2 rtl:pr-5 py-2 flex items-center gap-3 transition-transform hover:scale-105 active:scale-95 group"
            >
              <div className="flex flex-col items-end leading-none">
                <span className="font-bold text-slate-900 text-lg tabular-nums group-hover:text-indigo-600 transition-colors">{points}</span>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{t('credits')}</span>
              </div>
              <div className="w-8 h-8 flex items-center justify-center bg-indigo-50 rounded-full group-hover:bg-indigo-100 transition-colors">
                <CoinIcon className="w-6 h-6" />
              </div>
              {/* Notification Dot */}
              <div className="absolute -top-1 -right-1 rtl:right-auto rtl:-left-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-pulse"></div>
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
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-left rtl:text-right
      ${active
        ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-sm'
        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}
    `}
  >
    <span className="text-lg">{icon}</span>
    <span>{label}</span>
  </button>
);

const App: React.FC = () => {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
};

export default App;