import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { auth } from '../src/firebase';
import { sendEmailVerification, signOut, reload } from 'firebase/auth';
import { Logo } from './Logo';

export const VerifyEmailScreen: React.FC = () => {
    const { t } = useLanguage();
    const [loading, setLoading] = useState(false);

    const handleResend = async () => {
        if (auth.currentUser) {
            setLoading(true);
            try {
                await sendEmailVerification(auth.currentUser);
                alert(t('email_sent_success'));
            } catch (error) {
                console.error("Error sending email:", error);
                alert("Error sending email. Please try again later.");
            } finally {
                setLoading(false);
            }
        }
    };

    const handleCheckStatus = async () => {
        if (auth.currentUser) {
            setLoading(true);
            try {
                await auth.currentUser.reload();
                // Force refresh the page or parent state will update automatically via onAuthChanged if implemented correctly,
                // but explicit reload ensures the cleanest state update.
                window.location.reload();
            } catch (error) {
                console.error("Error reloading user:", error);
            } finally {
                setLoading(false);
            }
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-xl p-8 w-full max-w-md text-center">
                <div className="flex justify-center mb-6">
                    <Logo />
                </div>

                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl">
                    ✉️
                </div>

                <h2 className="text-2xl font-bold text-slate-900 mb-3">{t('verify_title')}</h2>

                <p className="text-slate-600 mb-8 leading-relaxed">
                    {t('verify_desc')}
                    <br />
                    <span className="text-sm text-slate-400 mt-2 block font-mono bg-slate-100 p-1 rounded">
                        {auth.currentUser?.email}
                    </span>
                </p>

                <div className="flex flex-col gap-3">
                    <button
                        onClick={handleCheckStatus}
                        disabled={loading}
                        className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-all shadow-lg shadow-indigo-200 disabled:opacity-50"
                    >
                        {loading ? '...' : t('check_status')}
                    </button>

                    <button
                        onClick={handleResend}
                        disabled={loading}
                        className="w-full py-3 px-4 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl font-semibold transition-all"
                    >
                        {t('resend_email')}
                    </button>

                    <button
                        onClick={() => signOut(auth)}
                        className="text-sm text-slate-400 hover:text-slate-600 mt-4 underline decoration-slate-300"
                    >
                        {t('sign_out')}
                    </button>
                </div>
            </div>
        </div>
    );
};
