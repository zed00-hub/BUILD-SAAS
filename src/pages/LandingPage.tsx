import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { Logo } from '../../components/Logo';
import { LanguageSwitcher } from '../../components/LanguageSwitcher';
import { PricingSection } from '../../components/PricingSection';
import {
    SocialMediaIcon,
    AdCreativeIcon,
    LandingPageIcon,
    ProductDescIcon,
    VirtualTryOnIcon
} from '../../components/ToolIcons';

export const LandingPage: React.FC = () => {
    const { t } = useLanguage();
    const navigate = useNavigate();

    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <div className="bg-slate-50 min-h-screen flex flex-col font-inter">
            {/* Header / Floating Navbar */}
            <header className="fixed top-4 left-0 right-0 z-50 px-4 md:px-6 pointer-events-none">
                <div className="max-w-7xl mx-auto bg-white/80 backdrop-blur-md shadow-xl shadow-slate-200/40 rounded-2xl border border-white/50 px-6 h-20 flex items-center justify-between pointer-events-auto transition-all duration-300 hover:bg-white/95">
                    {/* Logo Area */}
                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                        <Logo className="w-8 h-8" showText={true} />
                    </div>

                    {/* Nav Links - Desktop */}
                    <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
                        <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="hover:text-indigo-600 transition-colors">{t('nav_home') || 'Home'}</button>
                        <button onClick={() => scrollToSection('features-section')} className="hover:text-indigo-600 transition-colors">{t('nav_features') || 'Features'}</button>
                        <button onClick={() => scrollToSection('pricing-section')} className="hover:text-indigo-600 transition-colors">{t('nav_pricing') || 'Pricing'}</button>
                        <a href="mailto:contact@creakits.com" className="hover:text-indigo-600 transition-colors">{t('nav_contact') || 'Contact'}</a>
                    </nav>

                    {/* Actions */}
                    <div className="flex items-center gap-3 md:gap-4">
                        <LanguageSwitcher />
                        <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>
                        <a href="/login" className="text-slate-600 font-bold hover:text-indigo-600 text-sm hidden sm:block px-2">
                            {t('sign_in') || 'Sign In'}
                        </a>
                        <button
                            onClick={() => navigate('/app')}
                            className="px-6 py-2.5 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 hover:-translate-y-0.5 active:translate-y-0"
                        >
                            {t('start_free') || 'Start Free'}
                        </button>
                    </div>
                </div>
            </header>

            {/* 1. Hero Section */}
            <section className="relative pt-40 pb-12 lg:pt-52 lg:pb-20 overflow-hidden bg-white rounded-b-[3rem] shadow-sm z-10">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-indigo-50/60 via-white to-white pointer-events-none" />

                <div className="max-w-5xl mx-auto px-6 relative z-10 text-center">

                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-indigo-100 shadow-sm text-indigo-600 text-sm font-bold uppercase tracking-wide mb-8 animate-fade-in">
                        <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                        {t('hero_badge')}
                    </div>

                    {/* Main Headline */}
                    <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-slate-900 tracking-tight mb-8 leading-[1.1] md:leading-[1.1] drop-shadow-sm">
                        {t('hero_title_1')} <br className="hidden md:block" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-300% animate-gradient"> {t('hero_title_highlight')} </span>
                        {t('hero_title_2')}
                    </h1>

                    {/* Subheadline */}
                    <p className="text-xl md:text-2xl text-slate-500 mb-12 max-w-3xl mx-auto leading-relaxed font-medium">
                        {t('hero_subtitle')}
                    </p>

                    {/* CTA */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center mb-24">
                        <button
                            onClick={() => navigate('/app')}
                            className="px-10 py-5 bg-slate-900 text-white text-lg font-bold rounded-2xl hover:bg-slate-800 hover:shadow-2xl hover:shadow-indigo-200 hover:-translate-y-1 transition-all"
                        >
                            {t('cta_start_free')}
                        </button>
                    </div>

                    {/* Visual Graduation: Before & After */}
                    <div className="relative mx-auto max-w-5xl">
                        {/* Speed Badge */}
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 z-30 bg-green-500 text-white px-8 py-3 rounded-full font-bold shadow-xl shadow-green-200 animate-bounce flex items-center gap-2 border-[6px] border-white whitespace-nowrap">
                            <span>{t('speed_badge')}</span>
                        </div>

                        <div className="bg-slate-50 rounded-[2.5rem] p-6 md:p-10 border border-slate-200 shadow-2xl flex flex-col md:flex-row items-center gap-8 md:gap-16 relative overflow-hidden group hover:shadow-3xl transition-shadow duration-500">
                            <div className="absolute inset-0 bg-grid-slate-200/50 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] pointer-events-none" style={{ backgroundSize: '30px 30px' }}></div>

                            {/* BEFORE CARD */}
                            <div className="relative w-72 flex-shrink-0 transform transition-transform duration-500 group-hover:scale-95 group-hover:blur-[1px] hover:!blur-0 hover:!scale-105">
                                <div className="absolute -top-4 left-6 bg-slate-800 text-white text-sm font-bold px-4 py-1.5 rounded-lg shadow-lg z-20 rtl:left-auto rtl:right-6 tracking-wide">{t('before')}</div>
                                <div className="bg-white p-5 rounded-3xl shadow-xl border border-slate-100 rotate-[-3deg] rtl:rotate-[3deg]">
                                    <div className="aspect-square bg-slate-100 rounded-2xl overflow-hidden mb-5 border border-slate-50 relative flex items-center justify-center">
                                        <img src="/placeholder-before.jpg" onError={(e) => e.currentTarget.src = "https://images.unsplash.com/photo-1551732993-e778438fc7da?w=500&q=80"} alt="Raw Product Input" className="w-full h-full object-cover opacity-80 mix-blend-multiply transition-opacity" />
                                    </div>
                                    <div className="mt-4 px-2">
                                        <div className="flex gap-2 mb-2 opacity-40">
                                            <div className="w-8 h-1 bg-slate-400 rounded-full"></div>
                                            <div className="w-12 h-1 bg-slate-300 rounded-full"></div>
                                        </div>
                                        <div className="w-full h-1 bg-slate-200 rounded-full mb-1.5 opacity-40"></div>
                                        <div className="w-2/3 h-1 bg-slate-200 rounded-full opacity-40"></div>
                                        <div className="mt-3 text-[10px] text-slate-400 font-bold tracking-widest uppercase text-center opacity-60">
                                            Raw Product
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* ARROW */}
                            <div className="flex-shrink-0 z-10 relative">
                                <div className="w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center text-indigo-600 text-3xl font-black border-4 border-slate-50 rtl:rotate-180 relative z-10">
                                    ➔
                                </div>
                                <div className="absolute inset-0 bg-indigo-500 rounded-full blur-xl opacity-20"></div>
                            </div>

                            {/* AFTER CARD */}
                            <div className="relative w-full max-w-sm mx-auto md:mx-0 flex-grow transform transition-transform duration-500 hover:scale-105 z-10">
                                <div className="absolute -top-4 right-6 bg-indigo-600 text-white text-sm font-bold px-4 py-1.5 rounded-full shadow-lg shadow-indigo-200 z-20 animate-pulse rtl:right-auto rtl:left-6 tracking-wide">{t('after')}</div>
                                <div className="bg-slate-900 p-3 rounded-[3rem] shadow-2xl border-4 border-slate-800 ring-4 ring-indigo-50">
                                    <div className="bg-white rounded-[2.5rem] overflow-hidden relative h-[420px] w-full">
                                        {/* Mockup Content - Animated Scroll */}
                                        <div className="absolute top-0 left-0 w-full animate-[translateY_20s_linear_infinite] hover:pause cursor-pointer">
                                            {/* Design Block 1 */}
                                            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-6 text-center pb-10 rounded-b-[2.5rem] relative overflow-hidden">
                                                <div className="flex justify-between items-center text-[10px] mb-6 opacity-70 font-mono">
                                                    <span>📦 FREE SHIPPING</span>
                                                    <span>⭐ 4.9/5 RATING</span>
                                                </div>
                                                <h3 className="text-2xl font-black mb-3 leading-tight tracking-tight">Level Up Your<br />Home Entertainment</h3>
                                                <div className="w-full h-40 bg-white/10 rounded-2xl mt-6 overflow-hidden shadow-inner backdrop-blur-sm border border-white/10 p-2">
                                                    <img src="https://images.unsplash.com/photo-1593784653056-4912e4000392?w=500&q=80" className="w-full h-full object-cover rounded-xl" alt="TV" />
                                                </div>
                                            </div>
                                            {/* Design Block 2 */}
                                            <div className="p-6 bg-white space-y-4">
                                                <div className="flex gap-3">
                                                    <div className="flex-1 bg-red-50 p-3 rounded-2xl border border-red-100 text-center">
                                                        <span className="text-[10px] uppercase text-red-400 font-bold block mb-1">Old Way</span>
                                                        <div className="text-2xl">😫</div>
                                                    </div>
                                                    <div className="flex-1 bg-green-50 p-3 rounded-2xl border border-green-100 text-center ring-2 ring-green-500/20">
                                                        <span className="text-[10px] uppercase text-green-500 font-bold block mb-1">New Way</span>
                                                        <div className="text-2xl">🤩</div>
                                                    </div>
                                                </div>
                                                <button className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl shadow-xl shadow-slate-200 text-lg hover:scale-[1.02] transition-transform">
                                                    Shop Now 👉
                                                </button>
                                            </div>
                                            {/* Spacer */}
                                            <div className="h-32 bg-slate-50 p-6 flex flex-col items-center justify-center text-slate-300">
                                                <div className="w-12 h-1 bg-slate-200 rounded-full mb-2"></div>
                                                <div className="w-8 h-1 bg-slate-200 rounded-full"></div>
                                            </div>
                                        </div>

                                        {/* Phone Bottom Bar */}
                                        <div className="absolute bottom-0 left-0 w-full h-16 bg-gradient-to-t from-white via-white/90 to-transparent backdrop-blur-[2px] z-20 pointer-events-none"></div>
                                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1.5 bg-slate-200 rounded-full z-30"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 2. Features Grid */}
            <section id="features-section" className="py-32 bg-slate-50">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-20">
                        <span className="text-indigo-600 font-bold uppercase tracking-wider text-sm bg-indigo-50 px-4 py-1.5 rounded-full">{t('features_badge') || 'POWERFUL TOOLS'}</span>
                        <h2 className="text-4xl lg:text-5xl font-black text-slate-900 mt-6 mb-6">Five Engines.<br />One Platform.</h2>
                        <p className="text-xl text-slate-600 max-w-2xl mx-auto font-medium">Everything you need to create high-converting marketing assets in seconds.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 px-4">
                        <div onClick={() => navigate('/app/social-media')} className="group relative bg-white rounded-[2.5rem] p-8 lg:p-10 shadow-sm hover:shadow-2xl hover:shadow-blue-100/50 transition-all duration-300 cursor-pointer border border-slate-100 overflow-hidden hover:-translate-y-2">
                            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg shadow-blue-200">
                                <SocialMediaIcon size={32} className="text-white" />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-4">{t('tool_social')}</h3>
                            <p className="text-slate-500 mb-8 leading-relaxed text-lg">Generate engaging content for your social media channels tailored to your brand voice.</p>
                            <div className="flex items-center text-blue-600 font-bold group-hover:gap-3 transition-all">
                                Try functionality <span className="opacity-0 group-hover:opacity-100 transition-opacity rtl:rotate-180">→</span>
                            </div>
                        </div>

                        <div onClick={() => navigate('/app/ad-creative')} className="group relative bg-white rounded-[2.5rem] p-8 lg:p-10 shadow-sm hover:shadow-2xl hover:shadow-purple-100/50 transition-all duration-300 cursor-pointer border border-slate-100 overflow-hidden hover:-translate-y-2">
                            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:-rotate-6 transition-all duration-300 shadow-lg shadow-purple-200">
                                <AdCreativeIcon size={32} className="text-white" />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-4">{t('tool_ad')}</h3>
                            <p className="text-slate-500 mb-8 leading-relaxed text-lg">Create high-conversion ad creatives perfectly sized for Facebook, Instagram & Google Ads.</p>
                            <div className="flex items-center text-purple-600 font-bold group-hover:gap-3 transition-all">
                                Create Ads <span className="opacity-0 group-hover:opacity-100 transition-opacity rtl:rotate-180">→</span>
                            </div>
                        </div>

                        <div onClick={() => navigate('/app/landing-page')} className="group relative bg-white rounded-[2.5rem] p-8 lg:p-10 shadow-sm hover:shadow-2xl hover:shadow-emerald-100/50 transition-all duration-300 cursor-pointer border border-slate-100 overflow-hidden hover:-translate-y-2">
                            <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg shadow-emerald-200">
                                <LandingPageIcon size={32} className="text-white" />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-4">{t('tool_landing')}</h3>
                            <p className="text-slate-500 mb-8 leading-relaxed text-lg">Instant landing page layouts based on your product. Turn visitors into customers.</p>
                            <div className="flex items-center text-emerald-600 font-bold group-hover:gap-3 transition-all">
                                Build Pages <span className="opacity-0 group-hover:opacity-100 transition-opacity rtl:rotate-180">→</span>
                            </div>
                        </div>

                        {/* Landing Page Pro (NEW) */}
                        <div onClick={() => navigate('/app/landing-page-pro')} className="group relative bg-white rounded-[2.5rem] p-8 lg:p-10 shadow-sm hover:shadow-2xl hover:shadow-indigo-100/50 transition-all duration-300 cursor-pointer border-2 border-indigo-100 overflow-hidden hover:-translate-y-2 ring-4 ring-transparent hover:ring-indigo-50">
                            {/* New Badge */}
                            <div className="absolute top-6 right-6 bg-indigo-600 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider animate-pulse">
                                NEW
                            </div>

                            <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg shadow-indigo-200">
                                <span className="text-3xl text-white">🚀</span>
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-4">{t('tool_landing')} PRO</h3>
                            <p className="text-slate-500 mb-8 leading-relaxed text-lg">Create extensive, multi-section landing pages with professional copywriting and layout.</p>
                            <div className="flex items-center text-indigo-600 font-bold group-hover:gap-3 transition-all">
                                Build Pro Pages <span className="opacity-0 group-hover:opacity-100 transition-opacity rtl:rotate-180">→</span>
                            </div>
                        </div>

                        {/* Product Description */}
                        <div onClick={() => navigate('/app/product-description')} className="group relative bg-white rounded-[2.5rem] p-8 lg:p-10 shadow-sm hover:shadow-2xl hover:shadow-rose-100/50 transition-all duration-300 cursor-pointer border border-slate-100 overflow-hidden hover:-translate-y-2">
                            <div className="w-16 h-16 bg-gradient-to-br from-rose-500 to-red-500 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg shadow-rose-200">
                                <ProductDescIcon size={32} className="text-white" />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-4">{t('tool_product_desc')}</h3>
                            <p className="text-slate-500 mb-8 leading-relaxed text-lg">Generate compelling, SEO-optimized product descriptions that sell instantly.</p>
                            <div className="flex items-center text-rose-600 font-bold group-hover:gap-3 transition-all">
                                Write Now <span className="opacity-0 group-hover:opacity-100 transition-opacity rtl:rotate-180">→</span>
                            </div>
                        </div>

                        {/* Virtual Try-On */}
                        <div onClick={() => navigate('/app/virtual-tryon')} className="group relative bg-white rounded-[2.5rem] p-8 lg:p-10 shadow-sm hover:shadow-2xl hover:shadow-violet-100/50 transition-all duration-300 cursor-pointer border border-slate-100 overflow-hidden hover:-translate-y-2">
                            <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-indigo-500 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:-rotate-6 transition-all duration-300 shadow-lg shadow-violet-200">
                                <VirtualTryOnIcon size={32} className="text-white" />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-4">{t('tool_virtual_tryon')}</h3>
                            <p className="text-slate-500 mb-8 leading-relaxed text-lg">Let customers try clothes virtually. Upload a photo and see the magic.</p>
                            <div className="flex items-center text-violet-600 font-bold group-hover:gap-3 transition-all">
                                Try It On <span className="opacity-0 group-hover:opacity-100 transition-opacity rtl:rotate-180">→</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 3. Pricing Section (NEW) */}
            <PricingSection />

            {/* 4. Workflow (Simplified) */}
            <section className="py-24 bg-slate-900 text-white rounded-t-[3rem] mt-0">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <span className="text-indigo-400 font-bold uppercase tracking-wider text-sm">{t('how_it_works')}</span>
                        <h2 className="text-3xl lg:text-4xl font-extrabold mt-4 mb-4">{t('steps_title')}</h2>
                    </div>
                    <div className="grid md:grid-cols-3 gap-12 text-center relative">
                        {/* Connecting Line */}
                        <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-slate-700 z-0"></div>

                        <div className="relative z-10 group">
                            <div className="w-24 h-24 mx-auto bg-slate-800 border-4 border-slate-700 shadow-xl rounded-full flex items-center justify-center mb-6 group-hover:-translate-y-2 transition-transform duration-300">
                                <span className="text-4xl">📤</span>
                            </div>
                            <h3 className="text-xl font-bold mb-2">{t('step1_title')}</h3>
                            <p className="text-slate-400 max-w-xs mx-auto text-sm">{t('step1_desc')}</p>
                        </div>
                        <div className="relative z-10 group">
                            <div className="w-24 h-24 mx-auto bg-slate-800 border-4 border-slate-700 shadow-xl rounded-full flex items-center justify-center mb-6 group-hover:-translate-y-2 transition-transform duration-300">
                                <span className="text-4xl">🎛️</span>
                            </div>
                            <h3 className="text-xl font-bold mb-2">{t('step2_title')}</h3>
                            <p className="text-slate-400 max-w-xs mx-auto text-sm">{t('step2_desc')}</p>
                        </div>
                        <div className="relative z-10 group">
                            <div className="w-24 h-24 mx-auto bg-slate-800 border-4 border-slate-700 shadow-xl rounded-full flex items-center justify-center mb-6 group-hover:-translate-y-2 transition-transform duration-300">
                                <span className="text-4xl">🚀</span>
                            </div>
                            <h3 className="text-xl font-bold mb-2">{t('step3_title')}</h3>
                            <p className="text-slate-400 max-w-xs mx-auto text-sm">{t('step3_desc')}</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-white py-12">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all">
                        <Logo className="w-8 h-8" showText={true} />
                    </div>
                    <div className="flex gap-8 text-sm text-slate-500 font-medium">
                        <a href="/privacy" className="hover:text-indigo-600 transition-colors">{t('privacy')}</a>
                        <a href="/terms" className="hover:text-indigo-600 transition-colors">{t('terms')}</a>
                        <a href="mailto:support@creakits.com" className="hover:text-indigo-600 transition-colors">{t('contact')}</a>
                    </div>
                    <div className="text-sm text-slate-400">
                        {t('rights')}
                    </div>
                </div>
            </footer>
        </div>
    );
};
