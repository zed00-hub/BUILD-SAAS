import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { CloudStorageService, StorageQuota, STORAGE_LIMITS } from '../src/services/cloudStorageService';
import { LIMITS } from '../src/services/walletService';
import { auth } from '../src/firebase';
import { UserData } from '../src/types/dbTypes';

interface UsageLimitsCardProps {
    userProfile?: UserData | null;
    compact?: boolean;
}

export const UsageLimitsCard: React.FC<UsageLimitsCardProps> = ({ userProfile, compact = false }) => {
    const { language } = useLanguage();
    const isRtl = language === 'ar';

    const [storageQuota, setStorageQuota] = useState<StorageQuota | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (auth.currentUser) {
            loadQuota();
        }
    }, [userProfile]);

    const loadQuota = async () => {
        if (!auth.currentUser) return;
        setLoading(true);
        try {
            const quota = await CloudStorageService.getStorageQuota(auth.currentUser.uid);
            setStorageQuota(quota);
        } catch (error) {
            console.error('Error loading quota:', error);
        } finally {
            setLoading(false);
        }
    };

    // Determine plan type
    const getPlanType = (): 'trial' | 'basic' | 'pro' | 'elite' => {
        if (!userProfile) return 'trial';
        if (userProfile.accountType === 'paid') {
            if (userProfile.planType === 'pro') return 'pro';
            if (userProfile.planType === 'elite') return 'elite';
            return 'basic';
        }
        return 'trial';
    };

    const planType = getPlanType();
    const dailyLimits = LIMITS[planType];
    const storageLimits = STORAGE_LIMITS[planType];

    const getPlanLabel = () => {
        const labels = {
            trial: { ar: 'تجريبي', en: 'Trial' },
            basic: { ar: 'أساسي', en: 'Basic' },
            pro: { ar: 'احترافي', en: 'Pro' },
            elite: { ar: 'متميز', en: 'Elite' }
        };
        return isRtl ? labels[planType].ar : labels[planType].en;
    };

    const getPlanColor = () => {
        const colors = {
            trial: 'bg-slate-100 text-slate-600',
            basic: 'bg-blue-100 text-blue-700',
            pro: 'bg-purple-100 text-purple-700',
            elite: 'bg-amber-100 text-amber-700'
        };
        return colors[planType];
    };

    const formatProgress = (used: number, total: number) => {
        if (total === 0) return 0;
        return Math.min((used / total) * 100, 100);
    };

    const dailyUsed = userProfile?.dailyUsageCount || 0;
    const dailyMax = dailyLimits.maxDaily;
    const dailyProgress = formatProgress(dailyUsed, dailyMax);

    const storageUsed = storageQuota?.used || 0;
    const storageMax = storageLimits.maxDesigns;
    const storageProgress = formatProgress(storageUsed, storageMax);

    if (loading) {
        return (
            <div className={`bg-white rounded-xl border border-slate-200 ${compact ? 'p-3' : 'p-4'} animate-pulse`}>
                <div className="h-4 bg-slate-200 rounded w-1/3 mb-3"></div>
                <div className="h-2 bg-slate-200 rounded w-full mb-2"></div>
                <div className="h-2 bg-slate-200 rounded w-full"></div>
            </div>
        );
    }

    if (compact) {
        return (
            <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl p-3 border border-slate-200" dir={isRtl ? 'rtl' : 'ltr'}>
                <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${getPlanColor()}`}>
                        {getPlanLabel()}
                    </span>
                    <span className="text-xs text-slate-500">
                        {isRtl ? 'الاستخدام اليوم' : 'Today\'s Usage'}
                    </span>
                </div>
                <div className="flex items-center gap-4">
                    {/* Daily Limit */}
                    <div className="flex-1">
                        <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-slate-600">{isRtl ? 'يومي' : 'Daily'}</span>
                            <span className="font-medium text-slate-800">{dailyUsed}/{dailyMax === 9999 ? '∞' : dailyMax}</span>
                        </div>
                        <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all ${dailyProgress > 80 ? 'bg-red-500' : dailyProgress > 50 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                style={{ width: `${dailyMax === 9999 ? 5 : dailyProgress}%` }}
                            />
                        </div>
                    </div>
                    {/* Storage Limit */}
                    {storageMax > 0 && (
                        <div className="flex-1">
                            <div className="flex items-center justify-between text-xs mb-1">
                                <span className="text-slate-600">{isRtl ? 'تخزين' : 'Storage'}</span>
                                <span className="font-medium text-slate-800">{storageUsed}/{storageMax}</span>
                            </div>
                            <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all ${storageProgress > 80 ? 'bg-red-500' : storageProgress > 50 ? 'bg-amber-500' : 'bg-indigo-500'}`}
                                    style={{ width: `${storageProgress}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-5" dir={isRtl ? 'rtl' : 'ltr'}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    📊 {isRtl ? 'حدود الاستخدام' : 'Usage Limits'}
                </h3>
                <span className={`text-sm font-bold px-3 py-1 rounded-full ${getPlanColor()}`}>
                    {getPlanLabel()}
                </span>
            </div>

            <div className="space-y-4">
                {/* Daily Generation Limit */}
                <div className="p-4 bg-slate-50 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <span className="text-xl">⚡</span>
                            <span className="font-medium text-slate-700">
                                {isRtl ? 'التوليد اليومي' : 'Daily Generations'}
                            </span>
                        </div>
                        <span className="text-sm font-bold text-slate-800">
                            {dailyUsed} / {dailyMax === 9999 ? '∞' : dailyMax}
                        </span>
                    </div>
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-500 ${dailyProgress > 80 ? 'bg-gradient-to-r from-red-400 to-red-500' : dailyProgress > 50 ? 'bg-gradient-to-r from-amber-400 to-amber-500' : 'bg-gradient-to-r from-emerald-400 to-emerald-500'}`}
                            style={{ width: `${dailyMax === 9999 ? 3 : dailyProgress}%` }}
                        />
                    </div>
                    {dailyLimits.cooldownMin > 0 && (
                        <p className="text-xs text-slate-500 mt-2">
                            ⏱️ {isRtl ? `فترة انتظار: ${dailyLimits.cooldownMin} دقيقة بين كل عملية` : `Cooldown: ${dailyLimits.cooldownMin} min between generations`}
                        </p>
                    )}
                </div>

                {/* Cloud Storage Limit */}
                <div className={`p-4 rounded-xl ${storageMax === 0 ? 'bg-amber-50 border border-amber-200' : 'bg-indigo-50'}`}>
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <span className="text-xl">☁️</span>
                            <span className="font-medium text-slate-700">
                                {isRtl ? 'التخزين السحابي' : 'Cloud Storage'}
                            </span>
                        </div>
                        {storageMax === 0 ? (
                            <span className="text-xs font-medium text-amber-700 bg-amber-100 px-2 py-1 rounded-full">
                                {isRtl ? 'غير متاح' : 'Not Available'}
                            </span>
                        ) : (
                            <span className="text-sm font-bold text-slate-800">
                                {storageUsed} / {storageMax} {isRtl ? 'تصميم' : 'designs'}
                            </span>
                        )}
                    </div>

                    {storageMax === 0 ? (
                        <p className="text-xs text-amber-700">
                            {isRtl
                                ? 'قم بالترقية لخطة مدفوعة لحفظ تصاميمك في السحابة'
                                : 'Upgrade to a paid plan to save your designs to the cloud'
                            }
                        </p>
                    ) : (
                        <>
                            <div className="h-2 bg-indigo-200 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-500 ${storageProgress > 80 ? 'bg-gradient-to-r from-red-400 to-red-500' : 'bg-gradient-to-r from-indigo-400 to-purple-500'}`}
                                    style={{ width: `${storageProgress}%` }}
                                />
                            </div>
                            <p className="text-xs text-slate-500 mt-2">
                                💾 {storageQuota?.usedSizeMB || 0} / {storageLimits.maxSizeMB} MB
                            </p>
                        </>
                    )}
                </div>

                {/* Plan Comparison Mini */}
                {planType === 'trial' && (
                    <div className="p-4 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl text-white">
                        <p className="font-bold mb-2">{isRtl ? '🚀 قم بالترقية الآن!' : '🚀 Upgrade Now!'}</p>
                        <div className="text-sm opacity-90 space-y-1">
                            <p>• Basic: 20 {isRtl ? 'يومياً' : 'daily'} + 15 {isRtl ? 'تخزين' : 'storage'}</p>
                            <p>• Pro: 30 {isRtl ? 'يومياً' : 'daily'} + 40 {isRtl ? 'تخزين' : 'storage'}</p>
                            <p>• Elite: ∞ {isRtl ? 'يومياً' : 'daily'} + 100 {isRtl ? 'تخزين' : 'storage'}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UsageLimitsCard;
