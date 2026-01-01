import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, Link, Outlet, useNavigate } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from './src/firebase'; // Adjust import if necessary
import { SocialMediaTool } from './components/Tools/SocialMediaTool';
import { AdCreativeTool } from './components/Tools/AdCreativeTool';
import { LandingPageTool } from './components/Tools/LandingPageTool';
import { AdminDashboard } from './components/Admin/AdminDashboard';
import { AuthScreen } from './components/AuthScreen';
import { VerifyEmailScreen } from './components/VerifyEmailScreen';
import { CoinIcon } from './components/CoinIcon';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { WalletService } from './src/services/walletService';
import { PricingModal } from './components/PricingModal';
import { Logo } from './components/Logo';
import { UserData } from './src/types/dbTypes';

// --- Components ---

// Trial Account Warning Banner
const TrialBanner: React.FC = () => {
  const { language } = useLanguage();
  const isRtl = language === 'ar';

  return (
    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <p className="text-amber-800 font-semibold text-sm">
              {isRtl ? 'حساب تجريبي' : 'Trial Account'}
            </p>
            <p className="text-amber-600 text-xs">
              {isRtl
                ? 'لا يتم حفظ أعمالك. يرجى تحميلها مباشرة قبل مغادرة الصفحة!'
                : "Your work is NOT saved. Please download immediately before leaving the page!"
              }
            </p>
          </div>
        </div>
        <button
          onClick={() => document.dispatchEvent(new CustomEvent('open-pricing'))}
          className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all shadow-sm"
        >
          {isRtl ? '💎 ترقية للحفظ' : '💎 Upgrade to Save'}
        </button>
      </div>
    </div>
  );
};

// Sidebar Item Component
const SidebarItem: React.FC<{ to: string; active: boolean; icon: string; label: string; onClick?: () => void }> = ({ to, active, icon, label, onClick }) => (
  <Link
    to={to}
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-left rtl:text-right
      ${active
        ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-sm'
        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}
    `}
  >
    <span className="text-lg">{icon}</span>
    <span>{label}</span>
  </Link>
);

// Layout Component (Sidebar + Content)
const MainLayout = ({
  children,
  user,
  isAdmin,
  isPaidUser,
  points,
  setIsPricingOpen
}: {
  children: React.ReactNode,
  user: User | null,
  isAdmin: boolean,
  isPaidUser: boolean,
  points: number,
  setIsPricingOpen: (v: boolean) => void
}) => {
  const { t, language, setLanguage } = useLanguage();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const isRtl = language === 'ar';

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // Handle Redirect from 404.html (for GitHub Pages SPA support)
  useEffect(() => {
    const redirect = sessionStorage.redirect;
    if (redirect) {
      delete sessionStorage.redirect;
      navigate(redirect);
    }
  }, []);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className={`min-h-screen bg-white text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-800 ${isRtl ? 'rtl' : 'ltr'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-slate-200 z-50 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={toggleSidebar} className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <Logo className="h-8 w-auto" />
        </div>
        {/* Points Display Mobile */}
        {user && (
          <div
            onClick={() => setIsPricingOpen(true)}
            className="cursor-pointer bg-slate-50 border border-slate-200 rounded-full px-3 py-1 flex items-center gap-2"
          >
            <span className="font-bold text-slate-900 text-sm">{points}</span>
            <CoinIcon className="w-4 h-4" />
          </div>
        )}
      </header>

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 rtl:left-auto rtl:right-0 z-40 w-72 bg-white border-r rtl:border-r-0 rtl:border-l border-slate-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : (isRtl ? 'translate-x-full' : '-translate-x-full')} pt-20 lg:pt-0`}>
        <div className="h-full flex flex-col p-6">
          <div className="mb-10 hidden lg:block">
            <Logo className="h-10 w-auto" />
          </div>

          <nav className="space-y-2 flex-1">
            <SidebarItem to="/" active={location.pathname === '/'} icon="🏠" label={t('home')} />
            <div className="pt-4 pb-2">
              <p className="px-4 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{t('tools')}</p>
              <div className="space-y-1">
                <SidebarItem
                  to="/tools/social-media"
                  active={location.pathname.includes('/tools/social-media')}
                  icon="📱"
                  label={t('nav_social')}
                />
                <SidebarItem
                  to="/tools/ad-creative"
                  active={location.pathname.includes('/tools/ad-creative')}
                  icon="🎨"
                  label={t('nav_ads')}
                />
                <SidebarItem
                  to="/tools/landing-page"
                  active={location.pathname.includes('/tools/landing-page')}
                  icon="📄"
                  label={t('nav_landing')}
                />
              </div>
            </div>

            {isAdmin && (
              <div className="pt-4 border-t border-slate-100 mt-4">
                <p className="px-4 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Admin</p>
                <SidebarItem to="/admin" active={location.pathname === '/admin'} icon="⚡" label="Dashboard" />
              </div>
            )}
          </nav>

          <div className="mt-auto pt-6 border-t border-slate-100 space-y-4">
            {/* Language Switcher */}
            <div className="bg-slate-50 p-1 rounded-xl flex gap-1">
              <button onClick={() => setLanguage('en')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${language === 'en' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-900'}`}>English</button>
              <button onClick={() => setLanguage('fr')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${language === 'fr' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-900'}`}>Français</button>
              <button onClick={() => setLanguage('ar')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${language === 'ar' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-900'}`}>العربية</button>
            </div>

            {user && (
              <div className="flex items-center gap-3 px-2">
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                  {user.email?.[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">{user.email}</p>
                  <p className="text-xs text-slate-500 capitalize">{isPaidUser ? 'Pro Account' : 'Trial Account'}</p>
                </div>
                <button onClick={() => auth.signOut()} className="text-slate-400 hover:text-red-500 transition-colors">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="lg:pl-72 lg:rtl:pl-0 lg:rtl:pr-72 pt-16 lg:pt-0 min-h-screen transition-all duration-300">
        {/* Floating Points Widget (Desktop) */}
        {user && (
          <div className="fixed top-6 right-6 rtl:right-auto rtl:left-6 z-30 hidden lg:block">
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

        {children}
      </main>

      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/20 z-30 lg:hidden backdrop-blur-sm" onClick={toggleSidebar}></div>
      )}
    </div>
  );
};


// --- Pages ---

const HomePage = () => {
  const { t } = useLanguage();
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
            <Link
              to="/tools/social-media"
              className="px-10 py-5 bg-slate-900 text-white text-lg font-bold rounded-2xl hover:bg-slate-800 hover:shadow-2xl hover:-translate-y-1 transition-all"
            >
              {t('cta_start_free')}
            </Link>
          </div>

          {/* Quick Tools Grid - Visual only for homepage */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            <div className="p-6 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              <div className="text-3xl mb-3">📱</div>
              <h3 className="font-bold text-lg mb-1">{t('social_title')}</h3>
              <p className="text-slate-500 text-sm">{t('social_desc')}</p>
            </div>
            <div className="p-6 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              <div className="text-3xl mb-3">🎨</div>
              <h3 className="font-bold text-lg mb-1">{t('ad_title')}</h3>
              <p className="text-slate-500 text-sm">{t('ad_desc')}</p>
            </div>
            <div className="p-6 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              <div className="text-3xl mb-3">📄</div>
              <h3 className="font-bold text-lg mb-1">{t('landing_title')}</h3>
              <p className="text-slate-500 text-sm">{t('landing_desc')}</p>
            </div>
          </div>

        </div>
      </section>
    </div>
  );
};

// --- App Container ---

const AppContent: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [points, setPoints] = useState(0);
  const [isPricingOpen, setIsPricingOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isPaidUser, setIsPaidUser] = useState(false);

  // Auth & Wallet Hook
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Fetch User Data for Admin Check & Account Type
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data() as UserData;
            setIsAdmin(userData.isAdmin || false);
            setIsPaidUser(userData.accountType === 'paid');
          }

          // Wallet Listener
          WalletService.subscribeToWallet(currentUser.uid, (newBalance) => {
            setPoints(newBalance);
          });
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      } else {
        setIsAdmin(false);
        setIsPaidUser(false);
        setPoints(0);
      }
      setLoadingAuth(false);
    });

    // Listen for custom event to open pricing
    const handleOpenPricing = () => setIsPricingOpen(true);
    document.addEventListener('open-pricing', handleOpenPricing);

    return () => {
      unsubscribe();
      document.removeEventListener('open-pricing', handleOpenPricing);
    };
  }, []);

  const handleDeduction = async (amount: number, description: string): Promise<boolean> => {
    if (!user) return false;
    if (points < amount) {
      setIsPricingOpen(true);
      return false;
    }

    // Optimistic UI update handled by subscription
    const success = await WalletService.deductPoints(user.uid, amount, description);
    if (!success) {
      alert("Transaction failed. Please try again.");
    }
    return success;
  };

  if (loadingAuth) {
    return <div className="h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;
  }

  // Auth Guard Component
  const RequireAuth = ({ children }: { children: React.ReactElement }) => {
    if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
    // Check email verification
    // if (!user.emailVerified) return <VerifyEmailScreen />; // Uncomment if verification is enforced
    return children;
  };

  // Admin Guard Component
  const RequireAdmin = ({ children }: { children: React.ReactElement }) => {
    if (!user) return <Navigate to="/login" replace />;
    if (!isAdmin) return <div className="p-8 text-center text-red-500">Access Denied. Admins Only.</div>;
    return children;
  };

  return (
    <BrowserRouter>
      <MainLayout
        user={user}
        isAdmin={isAdmin}
        isPaidUser={isPaidUser}
        points={points}
        setIsPricingOpen={setIsPricingOpen}
      >
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={!user ? <AuthScreen onLogin={() => { }} /> : <Navigate to="/" replace />} />

          {/* Protected Tool Routes */}
          <Route path="/tools/social-media" element={
            <RequireAuth>
              <>
                {!isPaidUser && <TrialBanner />}
                <SocialMediaTool points={points} deductPoints={handleDeduction} isPaidUser={isPaidUser} />
              </>
            </RequireAuth>
          } />

          <Route path="/tools/ad-creative" element={
            <RequireAuth>
              <>
                {!isPaidUser && <TrialBanner />}
                <AdCreativeTool points={points} deductPoints={handleDeduction} isPaidUser={isPaidUser} />
              </>
            </RequireAuth>
          } />

          <Route path="/tools/landing-page" element={
            <RequireAuth>
              <>
                {!isPaidUser && <TrialBanner />}
                <LandingPageTool points={points} deductPoints={handleDeduction} isPaidUser={isPaidUser} />
              </>
            </RequireAuth>
          } />

          {/* Admin Route */}
          <Route path="/admin" element={
            <RequireAdmin>
              <AdminDashboard />
            </RequireAdmin>
          } />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        {/* Global Modals */}
        <PricingModal
          isOpen={isPricingOpen}
          onClose={() => setIsPricingOpen(false)}
          userId={user?.uid || ''}
        />
      </MainLayout>
    </BrowserRouter>
  );
};

const App: React.FC = () => {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
};

export default App;