import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { Logo } from '../../components/Logo';
import { LanguageSwitcher } from '../../components/LanguageSwitcher';

export const LandingPage: React.FC = () => {
    const { t } = useLanguage();
    const navigate = useNavigate();

    return (
        <div className="bg-white min-h-screen flex flex-col">
            {/* Header */}
            <header className="fixed w-full top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <Logo className="w-8 h-8" showText={true} />

                    <div className="flex items-center gap-4">
                        <LanguageSwitcher />
                        <a href="/login" className="text-slate-600 font-medium hover:text-indigo-600 text-sm hidden sm:block">
                            {t('sign_in') || 'Sign In'}
                        </a>
                        <button
                            onClick={() => navigate('/app')}
                            className="px-5 py-2.5 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
                        >
                            {t('start_free') || 'Get Started'}
                        </button>
                    </div>
                </div>
            </header>

            {/* 1. Hero Section */}
            <section className="relative pt-32 pb-12 lg:pt-48 lg:pb-20 overflow-hidden">
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
                            onClick={() => navigate('/app')}
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
                        <div onClick={() => navigate('/app')} className="group relative bg-white rounded-3xl p-8 shadow-sm hover:shadow-2xl transition-all duration-300 cursor-pointer border border-slate-100 overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-400 to-blue-600 rtl:right-0 rtl:left-auto"></div>
                            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform">📱</div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-3">{t('tool_social')}</h3>
                            <p className="text-slate-500 mb-6 leading-relaxed">Perfect for Instagram & LinkedIn strategies.</p>
                            <div className="flex items-center text-blue-600 font-bold group-hover:gap-2 transition-all">
                                Create Post <span className="opacity-0 group-hover:opacity-100 transition-opacity rtl:rotate-180">→</span>
                            </div>
                        </div>

                        <div onClick={() => navigate('/app')} className="group relative bg-white rounded-3xl p-8 shadow-sm hover:shadow-2xl transition-all duration-300 cursor-pointer border border-slate-100 overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-purple-400 to-pink-600 rtl:right-0 rtl:left-auto"></div>
                            <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform">📢</div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-3">{t('tool_ad')}</h3>
                            <p className="text-slate-500 mb-6 leading-relaxed">High-conversion square ads for any market.</p>
                            <div className="flex items-center text-purple-600 font-bold group-hover:gap-2 transition-all">
                                Design Ad <span className="opacity-0 group-hover:opacity-100 transition-opacity rtl:rotate-180">→</span>
                            </div>
                        </div>

                        <div onClick={() => navigate('/app')} className="group relative bg-white rounded-3xl p-8 shadow-sm hover:shadow-2xl transition-all duration-300 cursor-pointer border border-slate-100 overflow-hidden">
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
            <footer className="bg-white border-t border-slate-100 py-12 mt-auto">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2">
                        <Logo className="w-8 h-8" showText={true} />
                    </div>
                    <div className="flex gap-6 text-sm text-slate-500">
                        <a href="/privacy" className="hover:text-indigo-600">{t('privacy')}</a>
                        <a href="/terms" className="hover:text-indigo-600">{t('terms')}</a>
                        <a href="#" className="hover:text-indigo-600">{t('contact')}</a>
                    </div>
                    <div className="text-sm text-slate-400">
                        {t('rights')}
                    </div>
                </div>
            </footer>
        </div>
    );
};
