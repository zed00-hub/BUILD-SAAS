import React, { useState } from 'react';
import { Logo } from './Logo';
import { Button } from './Button';
import { useLanguage } from '../contexts/LanguageContext';
import { LanguageSwitcher } from './LanguageSwitcher';

interface AuthScreenProps {
  onLogin: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      onLogin();
    }, 1500);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-6 relative overflow-hidden">
       {/* Background Decoration */}
       <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-200/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-200/20 rounded-full blur-3xl"></div>
       </div>

       {/* Language Switcher - Correctly Positioned */}
       <div className="absolute top-6 right-6 rtl:right-auto rtl:left-6 z-20">
         <LanguageSwitcher />
       </div>

       <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 p-8 relative z-10 animate-fade-in">
          
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <Logo className="w-16 h-16" textClassName="text-2xl" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">
              {isSignUp ? t('create_account') : t('welcome_back')}
            </h1>
            <p className="text-slate-500 mt-2 text-sm">
              {isSignUp ? t('auth_desc_signup') : t('auth_desc_login')}
            </p>
          </div>

          {/* Social Login */}
          <button 
            onClick={() => { setIsLoading(true); setTimeout(onLogin, 1000); }}
            className="w-full flex items-center justify-center gap-3 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all font-medium py-3 px-4 rounded-xl mb-6 focus:ring-2 focus:ring-offset-1 focus:ring-slate-200"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            <span>{t('continue_google')}</span>
          </button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-400">{t('continue_email')}</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div className="input-group">
                <label className="block text-sm font-semibold text-slate-700 mb-1">{t('full_name')}</label>
                <input
                  type="text"
                  name="name"
                  required={isSignUp}
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all bg-slate-50 focus:bg-white"
                />
              </div>
            )}
            
            <div className="input-group">
              <label className="block text-sm font-semibold text-slate-700 mb-1">{t('email_address')}</label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="name@company.com"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all bg-slate-50 focus:bg-white"
              />
            </div>

            <div className="input-group">
              <label className="block text-sm font-semibold text-slate-700 mb-1">{t('password')}</label>
              <input
                type="password"
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all bg-slate-50 focus:bg-white"
              />
            </div>

            <Button type="submit" isLoading={isLoading} className="w-full py-3.5 text-lg shadow-lg shadow-indigo-100 mt-2">
              {isSignUp ? t('sign_up') : t('sign_in')}
            </Button>
          </form>

          <div className="mt-8 text-center text-sm text-slate-500">
            {isSignUp ? t('already_have_account') : t('dont_have_account')}{' '}
            <button 
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-indigo-600 font-bold hover:underline"
            >
              {isSignUp ? t('sign_in') : t('sign_up')}
            </button>
          </div>
       </div>

       <div className="mt-8 text-xs text-slate-400 text-center max-w-xs">
          {t('terms_agree')}
       </div>
    </div>
  );
};
