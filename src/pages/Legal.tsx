import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { Logo } from '../../components/Logo';
import { LanguageSwitcher } from '../../components/LanguageSwitcher';
import { useLocation, Link, useNavigate } from 'react-router-dom';

const PrivacyContent = {
    en: (
        <>
            <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
            <p className="mb-4">Last updated: January 18, 2026</p>
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
            <section className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-900">
                <h2 className="text-xl font-bold mb-3">4. Design Hosting Service</h2>
                <p className="mb-2">We provide a <strong>design hosting service only upon explicit user request</strong>. If you choose to save your designs to our cloud storage:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Your designs are stored securely and accessible only to you.</li>
                    <li>We do <strong>not</strong> have access to your unsaved images or temporary files.</li>
                    <li>You can delete your saved designs at any time from your account.</li>
                </ul>
            </section>
            <section className="mb-8 p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900">
                <h2 className="text-xl font-bold mb-3">5. Your Privacy & Unsaved Content</h2>
                <p>We prioritize your privacy:</p>
                <ul className="list-disc list-inside space-y-1 ml-2 mt-2">
                    <li><strong>Unsaved images are never stored or accessed by us.</strong></li>
                    <li>All AI processing happens securely and data is not retained after session ends.</li>
                    <li>We have no access to images that you did not explicitly save to your account.</li>
                </ul>
            </section>
            <section className="mb-8 p-4 bg-indigo-50 border border-indigo-200 rounded-lg text-indigo-900">
                <h2 className="text-xl font-bold mb-3">6. Compensation for Technical Issues</h2>
                <p className="mb-2">In the event of verified technical errors or service disruptions:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Compensation is provided strictly as <strong>Service Credits (Points)</strong> or <strong>Subscription Extension</strong>.</li>
                    <li>We ensure the user receives the full value of the service they paid for.</li>
                    <li>This does <strong>not</strong> imply a monetary refund of the payment.</li>
                </ul>
            </section>
            <section className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800">
                <h2 className="text-xl font-bold mb-2">🔴 Important Disclaimer</h2>
                <p className="font-bold">We are not responsible before God Almighty for any use of the platform to produce images of living beings, immodest images, or any content that violates Islamic Sharia or public morals. The user bears full responsibility for the content they generate.</p>
            </section>
        </>
    ),
    ar: (
        <>
            <h1 className="text-3xl font-bold mb-6">سياسة الخصوصية</h1>
            <p className="mb-4">آخر تحديث: 18 يناير 2026</p>
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
            <section className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-900">
                <h2 className="text-xl font-bold mb-3">4. خدمة استضافة التصاميم</h2>
                <p className="mb-2">نقدم <strong>خدمة استضافة التصاميم فقط عند طلب المستخدم صراحةً</strong>. إذا اخترت حفظ تصاميمك في التخزين السحابي الخاص بنا:</p>
                <ul className="list-disc list-inside space-y-1 mr-2">
                    <li>يتم تخزين تصاميمك بشكل آمن ولا يمكن الوصول إليها إلا أنت.</li>
                    <li><strong>ليس لدينا</strong> أي وصول إلى صورك غير المحفوظة أو الملفات المؤقتة.</li>
                    <li>يمكنك حذف تصاميمك المحفوظة في أي وقت من حسابك.</li>
                </ul>
            </section>
            <section className="mb-8 p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900">
                <h2 className="text-xl font-bold mb-3">5. خصوصيتك والمحتوى غير المحفوظ</h2>
                <p>نحن نولي أولوية قصوى لخصوصيتك:</p>
                <ul className="list-disc list-inside space-y-1 mr-2 mt-2">
                    <li><strong>الصور غير المحفوظة لا يتم تخزينها أو الوصول إليها من قبلنا أبداً.</strong></li>
                    <li>تتم جميع عمليات الذكاء الاصطناعي بشكل آمن ولا يتم الاحتفاظ بالبيانات بعد انتهاء الجلسة.</li>
                    <li>ليس لدينا أي وصول للصور التي لم تقم بحفظها صراحةً في حسابك.</li>
                </ul>
            </section>
            <section className="mb-8 p-4 bg-indigo-50 border border-indigo-200 rounded-lg text-indigo-900">
                <h2 className="text-xl font-bold mb-3">6. التعويض عن المشاكل التقنية</h2>
                <p className="mb-2">في حال حدوث أخطاء تقنية مثبتة أو انقطاع في الخدمة:</p>
                <ul className="list-disc list-inside space-y-1 mr-2">
                    <li>يتم التعويض حصراً على شكل <strong>نقاط خدمة (رصيد)</strong> أو <strong>تمديد للاشتراك</strong>.</li>
                    <li>نضمن حصول المستخدم على القيمة الكاملة للخدمة التي دفع مقابلها.</li>
                    <li>هذا <strong>لا</strong> يعني استرداداً مالياً للمبلغ المدفوع.</li>
                </ul>
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
            <p className="mb-4">Dernière mise à jour : 18 janvier 2026</p>
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
            <section className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-900">
                <h2 className="text-xl font-bold mb-3">4. Service d'Hébergement de Designs</h2>
                <p className="mb-2">Nous fournissons un <strong>service d'hébergement de designs uniquement sur demande explicite de l'utilisateur</strong>. Si vous choisissez de sauvegarder vos designs dans notre stockage cloud :</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Vos designs sont stockés en toute sécurité et accessibles uniquement par vous.</li>
                    <li>Nous n'avons <strong>pas</strong> accès à vos images non sauvegardées ou fichiers temporaires.</li>
                    <li>Vous pouvez supprimer vos designs sauvegardés à tout moment depuis votre compte.</li>
                </ul>
            </section>
            <section className="mb-8 p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900">
                <h2 className="text-xl font-bold mb-3">5. Votre Vie Privée & Contenu Non Sauvegardé</h2>
                <p>Nous accordons la priorité à votre vie privée :</p>
                <ul className="list-disc list-inside space-y-1 ml-2 mt-2">
                    <li><strong>Les images non sauvegardées ne sont jamais stockées ni accessibles par nous.</strong></li>
                    <li>Tout le traitement IA se fait de manière sécurisée et les données ne sont pas conservées après la fin de la session.</li>
                    <li>Nous n'avons aucun accès aux images que vous n'avez pas explicitement sauvegardées dans votre compte.</li>
                </ul>
            </section>
            <section className="mb-8 p-4 bg-indigo-50 border border-indigo-200 rounded-lg text-indigo-900">
                <h2 className="text-xl font-bold mb-3">6. Compensation pour Problèmes Techniques</h2>
                <p className="mb-2">En cas d'erreurs techniques vérifiées ou d'interruptions de service :</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>La compensation est fournie strictement sous forme de <strong>Crédits de Service (Points)</strong> ou <strong>d'Extension d'Abonnement</strong>.</li>
                    <li>Nous garantissons que l'utilisateur reçoit la pleine valeur du service pour lequel il a payé.</li>
                    <li>Cela n'implique <strong>pas</strong> un remboursement monétaire du paiement.</li>
                </ul>
            </section>
            <section className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800">
                <h2 className="text-xl font-bold mb-2">🔴 Avis de non-responsabilité important</h2>
                <p className="font-bold">Nous ne sommes pas responsables devant Dieu Tout-Puissant de toute utilisation de la plateforme pour produire des images d'êtres vivants, des images impudiques ou tout contenu violant la Charia islamique ou les mœurs publiques. L'utilisateur assume l'entière responsabilité du contenu qu'il génère.</p>
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
            <section className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg text-red-900">
                <h2 className="text-xl font-bold mb-3">4. No Refund Policy</h2>
                <p className="mb-2"><strong>All purchases are final and non-refundable.</strong></p>
                <p className="mb-2">Due to the nature of digital products and instant access to AI services:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>We incur immediate server and AI processing costs upon your usage.</li>
                    <li>We provide a Free Trial for you to test the service quality before purchasing.</li>
                    <li>Once a purchase is made and credits/access are delivered, no monetary refunds will be issued under any circumstances.</li>
                </ul>
            </section>
            <section className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800">
                <h2 className="text-xl font-bold mb-2">🔴 Important Disclaimer</h2>
                <p className="font-bold">We fully disclaim responsibility before God Almighty and before everyone for any use of these tools to generate images of living beings, immodest images, or any content prohibited by Sharia. The platform's goal is to assist business owners and designers in their lawful (Halal) work, and any misuse lies solely with the user.</p>
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
            <section className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg text-red-900">
                <h2 className="text-xl font-bold mb-3">4. سياسة عدم الاسترداد</h2>
                <p className="mb-2"><strong>جميع عمليات الشراء نهائية وغير قابلة للاسترداد.</strong></p>
                <p className="mb-2">نظراً لطبيعة المنتجات الرقمية والوصول الفوري لخدمات الذكاء الاصطناعي:</p>
                <ul className="list-disc list-inside space-y-1 mr-2">
                    <li>نحن نتحمل تكاليف فورية للخوادم والمعالجة بمجرد استخدامك للخدمة.</li>
                    <li>نحن نوفر "تجربة مجانية" لتتمكن من اختبار جودة الخدمة قبل الشراء.</li>
                    <li>بمجرد إتمام الشراء ووصول النقاط/الصلاحيات، لا يتم إصدار أي مبالغ مستردة مالياً تحت أي ظرف.</li>
                </ul>
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
            <section className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg text-red-900">
                <h2 className="text-xl font-bold mb-3">4. Politique de Non-Remboursement</h2>
                <p className="mb-2"><strong>Tous les achats sont définitifs et non remboursables.</strong></p>
                <p className="mb-2">En raison de la nature des produits numériques et de l'accès instantané aux services IA :</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Nous engageons des coûts de serveur et de traitement IA immédiats dès votre utilisation.</li>
                    <li>Nous proposons un Essai Gratuit pour que vous puissiez tester la qualité du service avant d'acheter.</li>
                    <li>Une fois l'achat effectué et les crédits/accès livrés, aucun remboursement monétaire ne sera émis en aucune circonstance.</li>
                </ul>
            </section>
            <section className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800">
                <h2 className="text-xl font-bold mb-2">🔴 Décharge de responsabilité</h2>
                <p className="font-bold">Nous déclinons toute responsabilité devant Dieu Tout-Puissant et devant tous de toute utilisation de ces outils pour générer des images d'êtres vivants, des images impudiques ou tout contenu interdit par la Charia. L'objectif de la plateforme est d'aider les propriétaires d'entreprises et les concepteurs dans leur travail licite (Halal), et toute mauvaise utilisation incombe uniquement à l'utilisateur.</p>
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
