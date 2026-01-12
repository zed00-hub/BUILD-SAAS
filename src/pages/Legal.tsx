import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { Logo } from '../../components/Logo';
import { LanguageSwitcher } from '../../components/LanguageSwitcher';
import { useLocation, Link, useNavigate } from 'react-router-dom';

const PrivacyContent = {
    en: (
        <>
            <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
            <p className="mb-4">Last updated: January 1, 2026</p>
            <section className="mb-8">
                <h2 className="text-xl font-bold mb-4">1. Information We Collect</h2>
                <p>We collect information you provide directly to us, such as when you create an account, use our AI tools, or communicate with us.</p>
            </section>
            <section className="mb-8">
                <h2 className="text-xl font-bold mb-4">2. How We Use Your Information</h2>
                <p>We use your information to provide, maintain, and improve our services, including generating content based on your inputs.</p>
            </section>
            <section className="mb-8">
                <h2 className="text-xl font-bold mb-4">3. Data Security</h2>
                <p>We implement appropriate security measures to protect your personal information.</p>
            </section>
        </>
    ),
    ar: (
        <>
            <h1 className="text-3xl font-bold mb-6">سياسة الخصوصية</h1>
            <p className="mb-4">آخر تحديث: 1 يناير 2026</p>
            <section className="mb-8">
                <h2 className="text-xl font-bold mb-4">1. المعلومات التي نجمعها</h2>
                <p>نقوم بجمع المعلومات التي تقدمها لنا مباشرة، مثل عند إنشاء حساب، أو استخدام أدوات الذكاء الاصطناعي الخاصة بنا، أو التواصل معنا.</p>
            </section>
            <section className="mb-8">
                <h2 className="text-xl font-bold mb-4">2. كيف نستخدم معلوماتك</h2>
                <p>نستخدم معلوماتك لتقديم خدماتنا والحفاظ عليها وتحسينها، بما في ذلك إنشاء المحتوى بناءً على مدخلاتك.</p>
            </section>
            <section className="mb-8">
                <h2 className="text-xl font-bold mb-4">3. أمان البيانات</h2>
                <p>نقوم بتنفيذ تدابير أمنية مناسبة لحماية معلوماتك الشخصية.</p>
            </section>
            <section className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800">
                <h2 className="text-xl font-bold mb-2">🔴 إخلاء مسؤولية هام</h2>
                <p className="font-bold">نحن غير مسؤولين أمام الله عز وجل عن أي استخدام للمنصة في إنتاج صور لذوات الأرواح، أو صور تبرج، أو أي محتوى يخالف الشريعة الإسلامية أو الآداب العامة. المستخدم يتحمل المسؤولية الكاملة عن المحتوى الذي يقوم بتوليده.</p>
            </section>
        </>
    ),
    fr: (
        <>
            <h1 className="text-3xl font-bold mb-6">Politique de Confidentialité</h1>
            <p className="mb-4">Dernière mise à jour : 1er janvier 2026</p>
            <section className="mb-8">
                <h2 className="text-xl font-bold mb-4">1. Informations que nous collectons</h2>
                <p>Nous collectons les informations que vous nous fournissez directement, par exemple lorsque vous créez un compte, utilisez nos outils d'IA ou communiquez avec nous.</p>
            </section>
            <section className="mb-8">
                <h2 className="text-xl font-bold mb-4">2. Comment nous utilisons vos informations</h2>
                <p>Nous utilisons vos informations pour fournir, maintenir et améliorer nos services, y compris pour générer du contenu basé sur vos entrées.</p>
            </section>
            <section className="mb-8">
                <h2 className="text-xl font-bold mb-4">3. Sécurité des données</h2>
                <p>Nous mettons en œuvre des mesures de sécurité appropriées pour protéger vos informations personnelles.</p>
            </section>
        </>
    )
};

const TermsContent = {
    en: (
        <>
            <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
            <section className="mb-8">
                <h2 className="text-xl font-bold mb-4">1. Acceptance of Terms</h2>
                <p>By accessing or using our services, you agree to be bound by these Terms.</p>
            </section>
            <section className="mb-8">
                <h2 className="text-xl font-bold mb-4">2. Use of Services</h2>
                <p>You may use our services only for lawful purposes and in accordance with these Terms.</p>
            </section>
            <section className="mb-8">
                <h2 className="text-xl font-bold mb-4">3. AI Generated Content</h2>
                <p>You represent and warrant that you have all necessary rights to the content you submit for generation. We do not claim ownership of the content you generate.</p>
            </section>
        </>
    ),
    ar: (
        <>
            <h1 className="text-3xl font-bold mb-6">شروط الخدمة</h1>
            <section className="mb-8">
                <h2 className="text-xl font-bold mb-4">1. قبول الشروط</h2>
                <p>من خلال الوصول إلى خدماتنا أو استخدامها، فإنك توافق على الالتزام بهذه الشروط.</p>
            </section>
            <section className="mb-8">
                <h2 className="text-xl font-bold mb-4">2. استخدام الخدمات</h2>
                <p>لا يجوز لك استخدام خدماتنا إلا لأغراض قانونية ووفقًا لهذه الشروط.</p>
            </section>
            <section className="mb-8">
                <h2 className="text-xl font-bold mb-4">3. المحتوى المُنشأ بواسطة الذكاء الاصطناعي</h2>
                <p>تقر وتضمن أنك تمتلك جميع الحقوق اللازمة للمحتوى الذي ترسله للتوليد. نحن لا ندعي ملكية المحتوى الذي تنشئه.</p>
            </section>
            <section className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800">
                <h2 className="text-xl font-bold mb-2">🔴 إبراء ذمة</h2>
                <p className="font-bold">نحن نخلي مسؤوليتنا تماماً أمام الله عز وجل ثم أمام الجميع عن أي استخدام لهذه الأدوات في توليد صور ذوات الأرواح، أو صور غير محتشمة (تبرج)، أو أي محتوى محرم شرعاً. الهدف من المنصة هو مساعدة أصحاب الأعمال والمصممين في أعمالهم الحلال، وأي سوء استخدام يقع على عاتق المستخدم وحده.</p>
            </section>
        </>
    ),
    fr: (
        <>
            <h1 className="text-3xl font-bold mb-6">Conditions d'Utilisation</h1>
            <section className="mb-8">
                <h2 className="text-xl font-bold mb-4">1. Acceptation des conditions</h2>
                <p>En accédant à ou en utilisant nos services, vous acceptez d'être lié par ces conditions.</p>
            </section>
            <section className="mb-8">
                <h2 className="text-xl font-bold mb-4">2. Utilisation des services</h2>
                <p>Vous ne pouvez utiliser nos services qu'à des fins légales et conformément à ces conditions.</p>
            </section>
            <section className="mb-8">
                <h2 className="text-xl font-bold mb-4">3. Contenu généré par IA</h2>
                <p>Vous déclarez et garantissez que vous disposez de tous les droits nécessaires sur le contenu que vous soumettez pour génération. Nous ne revendiquons pas la propriété du contenu que vous générez.</p>
            </section>
        </>
    )
};

export const LegalPage: React.FC = () => {
    const { language, t } = useLanguage();
    const location = useLocation();
    const navigate = useNavigate();

    const isPrivacy = location.pathname === '/privacy';
    const content = isPrivacy ? PrivacyContent : TermsContent;

    // Type guard for language
    const currentLang = (language === 'en' || language === 'fr' || language === 'ar') ? language : 'en';

    return (
        <div className="bg-slate-50 min-h-screen flex flex-col">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div onClick={() => navigate('/')} className="cursor-pointer">
                        <Logo className="w-8 h-8" showText={true} />
                    </div>

                    <div className="flex items-center gap-4">
                        <LanguageSwitcher />
                        <Link to="/" className="text-slate-600 font-medium hover:text-indigo-600 text-sm">
                            {t('home') || 'Home'}
                        </Link>
                    </div>
                </div>
            </header>

            <main className="flex-1 max-w-4xl mx-auto px-6 py-12 w-full">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 md:p-12">
                    {content[currentLang]}
                </div>
            </main>

            {/* Footer */}
            <footer className="bg-white border-t border-slate-100 py-12 mt-auto">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="text-sm text-slate-500">
                        &copy; {new Date().getFullYear()} Creakits. {t('rights')}
                    </div>
                    <div className="flex gap-6 text-sm text-slate-500">
                        <Link to="/privacy" className={`hover:text-indigo-600 ${isPrivacy ? 'font-bold text-indigo-600' : ''}`}>{t('privacy')}</Link>
                        <Link to="/terms" className={`hover:text-indigo-600 ${!isPrivacy ? 'font-bold text-indigo-600' : ''}`}>{t('terms')}</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
};
