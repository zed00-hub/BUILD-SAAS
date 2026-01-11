import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { CloudStorageService, SavedDesign, StorageQuota, DesignType } from '../src/services/cloudStorageService';
import { auth } from '../src/firebase';

interface DesignGalleryProps {
    isOpen: boolean;
    onClose: () => void;
    filterType?: DesignType;
    onSelectDesign?: (design: SavedDesign) => void;
}

export const DesignGallery: React.FC<DesignGalleryProps> = ({
    isOpen,
    onClose,
    filterType,
    onSelectDesign
}) => {
    const { t, language } = useLanguage();
    const isRtl = language === 'ar';

    const [designs, setDesigns] = useState<SavedDesign[]>([]);
    const [quota, setQuota] = useState<StorageQuota | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedDesign, setSelectedDesign] = useState<SavedDesign | null>(null);
    const [deleting, setDeleting] = useState<string | null>(null);
    const [activeFilter, setActiveFilter] = useState<DesignType | 'all'>(filterType || 'all');

    useEffect(() => {
        if (isOpen && auth.currentUser) {
            loadData();
        }
    }, [isOpen, activeFilter]);

    const loadData = async () => {
        if (!auth.currentUser) return;

        setLoading(true);
        try {
            const [designsData, quotaData] = await Promise.all([
                CloudStorageService.getUserDesigns(
                    auth.currentUser.uid,
                    activeFilter === 'all' ? undefined : activeFilter
                ),
                CloudStorageService.getStorageQuota(auth.currentUser.uid)
            ]);

            setDesigns(designsData);
            setQuota(quotaData);
        } catch (error) {
            console.error('Error loading gallery:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (designId: string) => {
        if (!auth.currentUser || !confirm(isRtl ? 'هل أنت متأكد من حذف هذا التصميم؟' : 'Are you sure you want to delete this design?')) {
            return;
        }

        setDeleting(designId);
        try {
            const success = await CloudStorageService.deleteDesign(auth.currentUser.uid, designId);
            if (success) {
                setDesigns(prev => prev.filter(d => d.id !== designId));
                // Refresh quota
                const newQuota = await CloudStorageService.getStorageQuota(auth.currentUser!.uid);
                setQuota(newQuota);
            }
        } catch (error) {
            console.error('Error deleting design:', error);
        } finally {
            setDeleting(null);
        }
    };

    const getTypeLabel = (type: DesignType) => {
        const labels: Record<DesignType, { ar: string; en: string }> = {
            'social': { ar: 'سوشيال ميديا', en: 'Social Media' },
            'ad': { ar: 'إعلان', en: 'Ad Creative' },
            'landing': { ar: 'صفحة هبوط', en: 'Landing Page' },
            'quick-edit': { ar: 'تعديل سريع', en: 'Quick Edit' }
        };
        return isRtl ? labels[type].ar : labels[type].en;
    };

    const getTypeColor = (type: DesignType) => {
        const colors: Record<DesignType, string> = {
            'social': 'bg-pink-500',
            'ad': 'bg-orange-500',
            'landing': 'bg-blue-500',
            'quick-edit': 'bg-purple-500'
        };
        return colors[type];
    };

    const formatDate = (timestamp: any) => {
        if (!timestamp) return '';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return new Intl.DateTimeFormat(isRtl ? 'ar-SA' : 'en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };

    const formatSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" onClick={onClose}></div>

            <div className="relative bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-6xl overflow-hidden animate-fade-in flex flex-col max-h-[90vh]" dir={isRtl ? 'rtl' : 'ltr'}>
                {/* Header */}
                <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                            <span className="text-3xl">🎨</span>
                            {isRtl ? 'معرض التصاميم' : 'Design Gallery'}
                        </h2>
                        {quota && quota.planType !== 'trial' && (
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                {isRtl
                                    ? `${quota.used} / ${quota.limit} تصميم • ${quota.usedSizeMB} / ${quota.limitSizeMB} MB`
                                    : `${quota.used} / ${quota.limit} designs • ${quota.usedSizeMB} / ${quota.limitSizeMB} MB`
                                }
                            </p>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Quota Warning for Trial */}
                {quota?.planType === 'trial' && (
                    <div className="mx-6 mt-4 p-4 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-xl">
                        <p className="text-amber-800 dark:text-amber-200 text-sm">
                            ⚠️ {isRtl
                                ? 'الحفظ السحابي غير متاح للحسابات التجريبية. قم بالترقية لحفظ تصاميمك!'
                                : 'Cloud storage is not available for trial accounts. Upgrade to save your designs!'
                            }
                        </p>
                    </div>
                )}

                {/* Filter Tabs */}
                <div className="px-6 pt-4 flex gap-2 flex-wrap">
                    {(['all', 'social', 'ad', 'landing', 'quick-edit'] as const).map(filter => (
                        <button
                            key={filter}
                            onClick={() => setActiveFilter(filter)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${activeFilter === filter
                                ? 'bg-indigo-600 text-white shadow-lg'
                                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                                }`}
                        >
                            {filter === 'all'
                                ? (isRtl ? 'الكل' : 'All')
                                : getTypeLabel(filter)
                            }
                        </button>
                    ))}
                </div>

                {/* Gallery Grid */}
                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
                        </div>
                    ) : designs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                            <svg className="w-16 h-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <p className="text-lg">{isRtl ? 'لا توجد تصاميم محفوظة' : 'No saved designs'}</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {designs.map(design => (
                                <div
                                    key={design.id}
                                    className="group relative bg-slate-100 dark:bg-slate-700 rounded-xl overflow-hidden aspect-square cursor-pointer hover:ring-2 hover:ring-indigo-500 transition-all"
                                    onClick={() => setSelectedDesign(design)}
                                >
                                    <img
                                        src={design.thumbnailUrl}
                                        alt={design.name}
                                        className="w-full h-full object-cover"
                                    />

                                    {/* Type Badge */}
                                    <div className={`absolute top-2 ${isRtl ? 'right-2' : 'left-2'} ${getTypeColor(design.type)} text-white text-xs px-2 py-1 rounded-full`}>
                                        {getTypeLabel(design.type)}
                                    </div>

                                    {/* Hover Overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                                        <p className="text-white text-sm font-medium truncate">{design.name}</p>
                                        <p className="text-white/70 text-xs">{formatDate(design.createdAt)}</p>
                                        <p className="text-white/50 text-xs">{formatSize(design.sizeBytes)}</p>
                                    </div>

                                    {/* Delete Button */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDelete(design.id);
                                        }}
                                        disabled={deleting === design.id}
                                        className={`absolute top-2 ${isRtl ? 'left-2' : 'right-2'} p-1.5 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 disabled:opacity-50`}
                                    >
                                        {deleting === design.id ? (
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        ) : (
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Design Preview Modal */}
                {selectedDesign && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4" onClick={() => setSelectedDesign(null)}>
                        <div className="absolute inset-0 bg-black/80"></div>
                        <div className="relative max-w-4xl max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
                            <button
                                onClick={() => setSelectedDesign(null)}
                                className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>

                            {selectedDesign.imageUrls.length === 1 ? (
                                <img
                                    src={selectedDesign.imageUrls[0]}
                                    alt={selectedDesign.name}
                                    className="max-w-full max-h-[85vh] rounded-xl shadow-2xl"
                                />
                            ) : (
                                <div className="flex gap-4 overflow-x-auto pb-4">
                                    {selectedDesign.imageUrls.map((url, idx) => (
                                        <img
                                            key={idx}
                                            src={url}
                                            alt={`${selectedDesign.name} - ${idx + 1}`}
                                            className="max-h-[80vh] rounded-xl shadow-2xl flex-shrink-0"
                                        />
                                    ))}
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex justify-center gap-4 mt-4">
                                <a
                                    href={selectedDesign.imageUrls[0]}
                                    download={`${selectedDesign.name}.webp`}
                                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                    {isRtl ? 'تحميل' : 'Download'}
                                </a>
                                {onSelectDesign && (
                                    <button
                                        onClick={() => {
                                            onSelectDesign(selectedDesign);
                                            setSelectedDesign(null);
                                            onClose();
                                        }}
                                        className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                                    >
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        {isRtl ? 'استخدام' : 'Use'}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DesignGallery;
