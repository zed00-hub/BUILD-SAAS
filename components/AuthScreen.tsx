import React, { useState } from 'react';
import { Logo } from './Logo';
import { Button } from './Button';
import { useLanguage } from '../contexts/LanguageContext';
import { LanguageSwitcher } from './LanguageSwitcher';
import { auth, googleProvider } from '../src/firebase';
import { signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';

interface AuthScreenProps {
  onLogin: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useLanguage();

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      await signInWithPopup(auth, googleProvider);
      onLogin();
    } catch (error) {
      console.error("Google Sign-In Error:", error);
      alert(t('auth_error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (isSignUp) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await sendEmailVerification(userCredential.user);
        alert(t('verification_email_sent'));
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      onLogin();
    } catch (error: any) {
      console.error("Auth Error:", error);
      let errorMessage = "Authentication Error";
      if (error.code === 'auth/email-already-in-use') errorMessage = 'Email already in use';
      if (error.code === 'auth/wrong-password') errorMessage = 'Invalid password';
      if (error.code === 'auth/user-not-found') errorMessage = 'User not found';
      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex overflow-hidden">
      {/* Left Side - Hero/Branding (Hidden on Mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-brand-900 overflow-hidden text-white flex-col justify-between p-16">

        {/* Animated Gradient Background */}
        <div className="absolute inset-0 z-0 opacity-40">
          <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] rounded-full bg-brand-500 blur-[120px] animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-accent-500 blur-[100px] animate-pulse delay-1000" />
        </div>

        <div className="relative z-10">
          <Logo className="text-white mb-8 scale-110 origin-left" />
          <h1 className="text-5xl font-bold leading-tight mb-6">
            {isSignUp ? "Join the Future of" : "Welcome Back to"} <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-200 to-white">
              AI Design
            </span>
          </h1>
          <p className="text-brand-100 text-lg max-w-md leading-relaxed">
            {isSignUp
              ? "Create stunning visuals for your brand in seconds with our advanced AI tools."
              : "Access your saved projects and continue creating high-converting assets."
            }
          </p>
        </div>

        {/* Social Proof / Testimonial Card */}
        <div className="relative z-10 bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-2xl w-full max-w-sm ml-auto animate-slide-up hover:scale-[1.02] transition-transform duration-500">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex -space-x-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className={`w-10 h-10 rounded-full border-2 border-brand-900 bg-brand-${i * 100} flex items-center justify-center text-xs font-bold`}>
                  U{i}
                </div>
              ))}
            </div>
            <div className="text-sm font-medium">
              <span className="block text-white">Join 10,000+</span>
              <span className="text-brand-200">Creators & Marketers</span>
            </div>
          </div>
          <p className="text-sm text-brand-50 italic">
            "Creakits transformed how we handle our social media. It's like having a full design team in my pocket."
          </p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 lg:p-16 relative">
        <div className="absolute top-6 right-8">
          <LanguageSwitcher />
        </div>

        <div className="w-full max-w-md animate-fade-in">
          {/* Mobile Logo */}
          <div className="lg:hidden mb-10 flex justify-center">
            <Logo />
          </div>

          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">
              {isSignUp ? t('create_account') : t('sign_in')}
            </h2>
            <p className="text-slate-500">
              {isSignUp ? t('auth_desc_signup') : t('auth_desc_login')}
            </p>
          </div>

          {/* Google Button */}
          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-700 font-semibold py-3.5 px-4 rounded-xl transition-all mb-6 group shadow-sm hover:shadow-md"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span>{t('continue_google')}</span>
          </button>

          <div className="relative flex py-5 items-center mb-6">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink-0 mx-4 text-slate-400 text-sm">{t('continue_email')}</span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          <form onSubmit={handleEmailAuth} className="space-y-5">
            {isSignUp && (
              <div className="space-y-1.5 text-left">
                <label className="text-sm font-semibold text-slate-700 ml-1">{t('full_name')}</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none transition-all hover:border-slate-300 bg-slate-50/50 focus:bg-white"
                  placeholder="John Doe"
                />
              </div>
            )}

            <div className="space-y-1.5 text-left">
              <label className="text-sm font-semibold text-slate-700 ml-1">{t('email_address')}</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3.5 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none transition-all hover:border-slate-300 bg-slate-50/50 focus:bg-white"
                placeholder="name@company.com"
              />
            </div>

            <div className="space-y-1.5 text-left">
              <div className="flex justify-between items-center ml-1">
                <label className="text-sm font-semibold text-slate-700">{t('password')}</label>
                {!isSignUp && (
                  <a href="#" className="text-xs text-brand-600 hover:text-brand-700 font-medium">Forgot password?</a>
                )}
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3.5 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none transition-all hover:border-slate-300 bg-slate-50/50 focus:bg-white"
                placeholder="••••••••"
              />
            </div>

            <Button
              variant="primary"
              className="w-full py-4 text-base font-bold shadow-lg shadow-brand-500/30 hover:shadow-brand-500/40"
              isLoading={isLoading}
            >
              {isSignUp ? t('sign_up') : t('sign_in')}
            </Button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-slate-500">
              {isSignUp ? t('already_have_account') : t('dont_have_account')}
              {' '}
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                className="font-bold text-brand-600 hover:text-brand-700 hover:underline transition-all"
              >
                {isSignUp ? t('sign_in') : t('sign_up')}
              </button>
            </p>
          </div>

          <div className="mt-8 text-center">
            <p className="text-xs text-slate-400 max-w-xs mx-auto leading-normal">
              {t('terms_agree')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
