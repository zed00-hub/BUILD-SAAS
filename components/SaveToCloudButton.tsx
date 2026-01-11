import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { CloudStorageService, DesignType, StorageQuota } from '../src/services/cloudStorageService';
import { auth } from '../src/firebase';

interface SaveToCloudButtonProps {
    images: string[];  // Base64 images to save
    designType: DesignType;
    designName?: string;
    metadata?: Record<string, any>;
    onSaved?: (designId: string) => void;
    onError?: (error: string) => void;
    className?: string;
    variant?: 'primary' | 'secondary' | 'icon';
}

export const SaveToCloudButton: React.FC<SaveToCloudButtonProps> = ({
    images,
    designType,
    designName,
    metadata,
    onSaved,
    onError,
    className = '',
    variant = 'primary'
}) => {
    const { language } = useLanguage();
    const isRtl = language === 'ar';

    const [saving, setSaving] = useState(false);
    const [showNameModal, setShowNameModal] = useState(false);
    const [name, setName] = useState(designName || '');
    const [quota, setQuota] = useState<StorageQuota | null>(null);

    const handleClick = async () => {
        if (!auth.currentUser) {
            onError?.(isRtl ? 'يجب تسجيل الدخول أولاً' : 'Please login first');
            return;
        }

        // Check quota first
        const quotaData = await CloudStorageService.getStorageQuota(auth.currentUser.uid);
        setQuota(quotaData);

        if (quotaData.planType === 'trial') {
            onError?.(isRtl
                ? 'الحفظ السحابي متاح فقط للخطط المدفوعة. قم بالترقية الآن!'
                : 'Cloud storage is only available for paid plans. Upgrade now!');
            return;
        }

        if (!quotaData.canSave) {
            onError?.(isRtl
                ? `لقد وصلت للحد الأقصى (${quotaData.used}/${quotaData.limit} تصميم). احذف بعض التصاميم أو قم بالترقية.`
                : `You've reached your limit (${quotaData.used}/${quotaData.limit} designs). Delete some or upgrade.`);
            return;
        }

        // Show name modal if no name provided
        if (!designName) {
            setShowNameModal(true);
            return;
        }

        await saveDesign(designName);
    };

    const saveDesign = async (saveName: string) => {
        if (!auth.currentUser || !images.length) return;

        setSaving(true);
        setShowNameModal(false);

        try {
            // Compress images before saving
            const compressedImages = await Promise.all(
                images.map(img => CloudStorageService.compressImage(img, 1500, 0.85))
            );

            const result = await CloudStorageService.saveDesign(
                auth.currentUser.uid,
                designType,
                saveName,
                compressedImages,
                metadata
            );

            if (result.success && result.designId) {
                onSaved?.(result.designId);
            } else {
                onError?.(result.error || (isRtl ? 'حدث خطأ أثناء الحفظ' : 'Error saving design'));
            }
        } catch (error: any) {
            console.error('Save error:', error);
            onError?.(error.message || (isRtl ? 'حدث خطأ أثناء الحفظ' : 'Error saving design'));
        } finally {
            setSaving(false);
        }
    };

    const getButtonContent = () => {
        if (saving) {
            return (
                <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                    <span>{isRtl ? 'جاري الحفظ...' : 'Saving...'}</span>
                </>
            );
        }

        return (
            <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                {variant !== 'icon' && <span>{isRtl ? 'حفظ في السحابة' : 'Save to Cloud'}</span>}
            </>
        );
    };

    const baseStyles = 'flex items-center justify-center gap-2 font-medium transition-all disabled:opacity-50';
    const variantStyles = {
        primary: 'px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg hover:scale-105',
        secondary: 'px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600',
        icon: 'p-2 bg-white/20 backdrop-blur-sm text-white rounded-lg hover:bg-white/30'
    };

    return (
        <>
            <button
                onClick={handleClick}
                disabled={saving || !images.length}
                className={`${baseStyles} ${variantStyles[variant]} ${className}`}
                title={isRtl ? 'حفظ في السحابة' : 'Save to Cloud'}
            >
                {getButtonContent()}
            </button>

            {/* Name Modal */}
            {showNameModal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowNameModal(false)}></div>
                    <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 w-full max-w-md" dir={isRtl ? 'rtl' : 'ltr'}>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                            {isRtl ? 'حفظ التصميم' : 'Save Design'}
                        </h3>

                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder={isRtl ? 'اسم التصميم...' : 'Design name...'}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent mb-4"
                            autoFocus
                        />

                        {quota && (
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                                {isRtl
                                    ? `${quota.used} / ${quota.limit} تصميم محفوظ`
                                    : `${quota.used} / ${quota.limit} designs saved`
                                }
                            </p>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowNameModal(false)}
                                className="flex-1 px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600"
                            >
                                {isRtl ? 'إلغاء' : 'Cancel'}
                            </button>
                            <button
                                onClick={() => saveDesign(name || `Design ${Date.now()}`)}
                                disabled={!name.trim()}
                                className="flex-1 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg disabled:opacity-50"
                            >
                                {isRtl ? 'حفظ' : 'Save'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default SaveToCloudButton;
