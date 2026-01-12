import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut, User, getRedirectResult } from 'firebase/auth';
import { useLocation, useNavigate, Outlet } from 'react-router-dom';

// Adjust paths based on file location: src/pages/Dashboard.tsx -> ../../filename
import { CoinIcon } from '../../components/CoinIcon';
import { Logo } from '../../components/Logo';
import { PricingModal } from '../../components/PricingModal';
import { AuthScreen } from '../../components/AuthScreen';
import { useLanguage } from '../../contexts/LanguageContext';
import { LanguageSwitcher } from '../../components/LanguageSwitcher';

import { auth } from '../firebase'; // src/pages/.. -> src/firebase
import { VerifyEmailScreen } from '../../components/VerifyEmailScreen';
import { WalletService } from '../services/walletService'; // src/pages/.. -> src/services
import { OrderService } from '../services/orderService';
import { ProfileSettingsModal } from '../../components/ProfileSettingsModal';
import { UserData } from '../types/dbTypes';

export interface DashboardContextType {
    user: User | null;
    points: number;
    deductPoints: (amount: number, description: string, count?: number) => Promise<boolean>;
    isPaidUser: boolean;
    isAdmin: boolean;
    userProfile: UserData | null;
}

// Trial Account Warning Banner
export const TrialBanner: React.FC = () => {
    const { t, language } = useLanguage();
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
                <button className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all shadow-sm">
                    {isRtl ? '💎 ترقية للحفظ' : '💎 Upgrade to Save'}
                </button>
            </div>
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

export const Dashboard: React.FC = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [user, setUser] = useState<User | null>(null);
    const [isPricingOpen, setIsPricingOpen] = useState(false);
    const [loadingAuth, setLoadingAuth] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isPaidUser, setIsPaidUser] = useState(false);
    const [userProfile, setUserProfile] = useState<UserData | null>(null);
    const [isProfileSettingsOpen, setIsProfileSettingsOpen] = useState(false);

    const { t, language } = useLanguage();
    const isRtl = language === 'ar';
    const navigate = useNavigate();
    const location = useLocation();

    // Points System Handling
    const [points, setPoints] = useState<number>(0);

    const handleDeduction = async (amount: number, description: string, count: number = 1): Promise<boolean> => {
        if (!user) return false;
        if (points < amount) {
            setIsPricingOpen(true);
            return false;
        }

        let orderId = '';
        try {
            // Determine tool type from URL roughly or pass generic 'tool'
            const toolType = location.pathname.split('/').pop() || 'unknown-tool';

            orderId = await OrderService.createOrder(
                user.uid,
                toolType as any,
                { description, amount, count },
                amount
            );
            await WalletService.deductPoints(user.uid, amount, description, orderId, count);
            await OrderService.updateOrderStatus(orderId, 'completed', { resultCode: 'SUCCESS' });
            setPoints(prev => Math.max(0, prev - amount));
            return true;

        } catch (error: any) {
            console.error("Deduction failed:", error);
            if (orderId) {
                await OrderService.updateOrderStatus(orderId, 'failed', { error: error.message });
            }
            if (error.message === "INSUFFICIENT_FUNDS") {
                setIsPricingOpen(true);
            } else if (error.message && (error.message.includes("DAILY_LIMIT") || error.message.includes("COOLDOWN"))) {
                alert(error.message);
            } else {
                alert("Transaction failed. Please try again.");
            }
            return false;
        }
    };

    // Handle Google Redirect Result
    useEffect(() => {
        const handleRedirectResult = async () => {
            try {
                const result = await getRedirectResult(auth);
                if (result) {
                    console.log("Google Sign-In Redirect successful:", result.user.email);
                }
            } catch (error: any) {
                console.error("Google Redirect Error:", error);
            }
        };
        handleRedirectResult();
    }, []);

    // Monitor Auth State
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                await fetchUserProfile(currentUser.uid, currentUser);
            } else {
                setIsAdmin(false);
                setIsPaidUser(false);
                setUserProfile(null);
            }
            setLoadingAuth(false);
        });
        return () => unsubscribe();
    }, []);

    const fetchUserProfile = async (uid: string, authUser: User) => {
        try {
            await WalletService.initializeUserWallet(
                uid,
                authUser.email || '',
                authUser.displayName || undefined,
                authUser.photoURL || undefined
            );
            const profile = await WalletService.getUserProfile(uid);
            if (profile) {
                setPoints(profile.balance);
                setIsAdmin(!!profile.isAdmin);
                setIsPaidUser(profile.accountType === 'paid');
                setUserProfile(profile);
            }
        } catch (error) {
            console.error("Error fetching wallet:", error);
        }
    };

    // Subscribe to wallet changes
    useEffect(() => {
        if (!user) return;
        const unsubscribeWallet = WalletService.subscribeToWallet(user.uid, (newBalance) => {
            setPoints(newBalance);
        });
        return () => unsubscribeWallet();
    }, [user]);

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    const isActive = (path: string) => location.pathname.includes(path);

    const renderContent = () => {
        if (loadingAuth) return <div className="h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;

        if (!user) {
            return <AuthScreen onLogin={() => { }} />;
        }

        if (!user.emailVerified) {
            return <VerifyEmailScreen />;
        }

        // Context provider for nested routes (Tools)
        return <Outlet context={{ user, points, deductPoints: handleDeduction, isPaidUser, isAdmin, userProfile } as DashboardContextType} />;
    };

    return (
        <div className="min-h-screen flex bg-slate-50 text-slate-800 font-sans">
            {/* Mobile Menu Button */}
            {user && (
                <button
                    onClick={toggleSidebar}
                    className="fixed top-4 left-4 rtl:left-auto rtl:right-4 z-50 p-2 bg-white rounded-lg shadow-md md:hidden text-slate-600 hover:text-indigo-600 hover:bg-slate-50 transition-colors"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                </button>
            )}

            <PricingModal isOpen={isPricingOpen} onClose={() => setIsPricingOpen(false)} />
            {userProfile && (
                <ProfileSettingsModal
                    isOpen={isProfileSettingsOpen}
                    onClose={() => setIsProfileSettingsOpen(false)}
                    user={userProfile}
                    onUpdate={() => user && fetchUserProfile(user.uid, user)}
                />
            )}

            {/* Sidebar Overlay */}
            {isSidebarOpen && user && (
                <div
                    className="fixed inset-0 bg-black/20 z-40 md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            {user && (
                <aside
                    className={`
            fixed top-0 bottom-0 z-50 w-72 bg-white border-r rtl:border-r-0 rtl:border-l border-slate-100 shadow-xl transition-transform duration-300 ease-in-out
            left-0 rtl:left-auto rtl:right-0
            md:relative md:!translate-x-0 md:shadow-none
            ${isSidebarOpen ? 'translate-x-0' : (isRtl ? 'translate-x-full' : '-translate-x-full')}
          `}
                >
                    <div className="p-6 h-full flex flex-col">
                        <div className="mb-8 flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
                            <Logo className="w-10 h-10" textClassName="text-xl" />
                        </div>

                        <nav className="flex-1 space-y-2">
                            <SidebarItem
                                active={location.pathname === '/' || location.pathname === '/app' || location.pathname === '/app/'}
                                onClick={() => { navigate('/'); setIsSidebarOpen(false); }}
                                icon="🏠"
                                label={t('home')}
                            />
                            <div className="pt-4 pb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">{t('tools')}</div>
                            <SidebarItem
                                active={isActive('social-media')}
                                onClick={() => { navigate('social-media'); setIsSidebarOpen(false); }}
                                icon="📱"
                                label={t('tool_social')}
                            />
                            <SidebarItem
                                active={isActive('ad-creative')}
                                onClick={() => { navigate('ad-creative'); setIsSidebarOpen(false); }}
                                icon="📢"
                                label={t('tool_ad')}
                            />
                            <SidebarItem
                                active={isActive('landing-page')}
                                onClick={() => { navigate('landing-page'); setIsSidebarOpen(false); }}
                                icon="🌐"
                                label={t('tool_landing')}
                            />
                            <SidebarItem
                                active={isActive('quick-edit')}
                                onClick={() => { navigate('quick-edit'); setIsSidebarOpen(false); }}
                                icon="✨"
                                label={t('tool_quick_edit')}
                            />

                            {isAdmin && (
                                <>
                                    <div className="pt-4 pb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">Administration</div>
                                    <SidebarItem
                                        active={isActive('admin')}
                                        onClick={() => { navigate('admin'); setIsSidebarOpen(false); }}
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
                {user && (
                    <div className="fixed top-4 right-4 rtl:right-auto rtl:left-4 sm:top-6 sm:right-8 rtl:sm:left-8 z-50 flex items-center gap-3">
                        <div className="bg-white/90 backdrop-blur-md shadow-lg border border-slate-200 rounded-full px-1 py-1">
                            <LanguageSwitcher className="!mb-0" />
                        </div>

                        <div className="relative group">
                            <div className="w-10 h-10 rounded-full bg-white shadow-lg border border-slate-200 cursor-pointer overflow-hidden flex items-center justify-center hover:ring-2 hover:ring-indigo-100 transition-all">
                                {user.photoURL ? (
                                    <img src={user.photoURL} alt="User" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-indigo-700 font-bold">{user.email?.[0].toUpperCase() || "U"}</span>
                                )}
                            </div>
                            <div className="absolute top-12 right-0 rtl:right-auto rtl:left-0 w-48 bg-white rounded-xl shadow-xl border border-slate-100 p-2 invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all transform origin-top-right rtl:origin-top-left z-50">
                                <div className="px-3 py-2 border-b border-slate-50 mb-1">
                                    <p className="text-sm font-bold text-slate-900 truncate">{user.displayName || t('welcome_back')}</p>
                                    <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
                                </div>
                                <button
                                    onClick={() => setIsProfileSettingsOpen(true)}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg transition-colors text-left rtl:text-right"
                                >
                                    <span>⚙️</span> Settings
                                </button>
                                <button
                                    onClick={() => signOut(auth)}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors text-left rtl:text-right"
                                >
                                    <span>🚪</span> {t('sign_out')}
                                </button>
                            </div>
                        </div>

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
                            <div className="absolute -top-1 -right-1 rtl:right-auto rtl:-left-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-pulse"></div>
                        </div>
                    </div>
                )}

                {/* Activation Gateway - Free Trial */}
                {user && !isPaidUser && points <= 0 && userProfile?.accountType === 'trial' && (
                    <div className="mx-4 mt-20 sm:mt-24 mb-6 relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 shadow-xl shadow-emerald-200 animate-fade-in group hover:shadow-2xl transition-all duration-500">
                        {/* Background Effects */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none group-hover:bg-white/20 transition-all duration-500"></div>
                        <div className="absolute bottom-0 left-0 w-40 h-40 bg-black/10 rounded-full blur-3xl -ml-10 -mb-10 pointer-events-none"></div>
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none"></div>

                        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between p-6 md:p-8 gap-6 text-center md:text-left rtl:md:text-right">
                            <div className="flex-1 space-y-2">
                                <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-white mb-2 shadow-sm border border-white/20">
                                    <span className="animate-pulse">✨</span> {isRtl ? 'عرض خاص للمستخدمين الجدد' : 'New User Special'}
                                </div>
                                <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-tight">
                                    {isRtl ? 'تفعيل 20 نقطة تجريبية مجاناً' : 'Activate 20 Free Trial Points'}
                                </h2>
                                <p className="text-emerald-50 text-sm md:text-base max-w-xl font-medium leading-relaxed opacity-90">
                                    {isRtl
                                        ? 'ابدأ تصميماتك الأولى الآن مجاناً! اضغط على الزر لتفعيل رصيدك التجريبي وتجربة جميع أدوات المنصة المتقدمة.'
                                        : 'Start your first designs for free! Click below to activate your trial balance and experience all advanced platform tools.'}
                                </p>
                            </div>

                            <button
                                onClick={() => {
                                    const message = `مرحباً، أنشأت حساباً في المنصة وأريد تفعيل النقاط التجريبية. اسم المستخدم: ${userProfile?.displayName || user.email || ''}`;
                                    window.open(`https://wa.me/213658491823?text=${encodeURIComponent(message)}`, '_blank');
                                }}
                                className="flex-shrink-0 bg-white text-emerald-700 hover:text-emerald-800 px-8 py-4 rounded-xl font-bold shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-300 flex items-center gap-3 group/btn"
                            >
                                <span className="text-2xl group-hover/btn:rotate-12 transition-transform duration-300">🎁</span>
                                <span className="flex flex-col items-start leading-none gap-1">
                                    <span className="text-sm uppercase tracking-wider opacity-60 font-bold">{isRtl ? 'اضغط هنا' : 'CLICK HERE'}</span>
                                    <span className="text-lg">{isRtl ? 'تفعيل الآن مجاناً' : 'Activate For Free'}</span>
                                </span>
                                <svg className={`w-5 h-5 ${isRtl ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                            </button>
                        </div>
                    </div>
                )}

                {renderContent()}
            </main>
        </div>
    );
};
