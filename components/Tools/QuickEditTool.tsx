import React, { useState, useEffect } from 'react';
import { HistoryItem } from '../../types';
import { UserData as DbUserData } from '../../src/types/dbTypes';
import { Button } from '../Button';
import { fileToBase64, editGeneratedImage } from '../../services/geminiService';
import { CoinIcon } from '../CoinIcon';
import { useLanguage } from '../../contexts/LanguageContext';
import { getHistory, saveHistoryItem, deleteHistoryItem } from '../../services/storageService';
import { SaveToCloudButton } from '../SaveToCloudButton';
import { UsageLimitsCard } from '../UsageLimitsCard';
import { WalletService } from '../../src/services/walletService';
import { auth } from '../../src/firebase';

interface QuickEditToolProps {
    points: number;
    deductPoints: (amount: number, description: string, count?: number) => Promise<boolean>;
    isPaidUser: boolean;
    userProfile?: DbUserData | null;
}

export const QuickEditTool: React.FC<QuickEditToolProps> = ({ points, deductPoints, isPaidUser, userProfile }) => {
    const { t } = useLanguage();

    const [sourceImage, setSourceImage] = useState<string | null>(null);
    const [editedImage, setEditedImage] = useState<string | null>(null);
    const [editInstruction, setEditInstruction] = useState('');
    const [history, setHistory] = useState<HistoryItem[]>([]);

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const editCost = 20; // 20 points per edit

    useEffect(() => {
        setHistory(getHistory('quick-edit'));
    }, []);

    const refreshHistory = () => {
        setHistory(getHistory('quick-edit'));
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            try {
                const base64 = await fileToBase64(e.target.files[0]);
                setSourceImage(`data:image/png;base64,${base64}`);
                setEditedImage(null);
                setError(null);
            } catch (err) {
                console.error("Error converting image", err);
                setError("Failed to upload image");
            }
        }
    };

    const handleLoadHistory = (item: HistoryItem) => {
        if (!item.inputs || !item.results) return;
        setSourceImage(item.inputs.sourceImage);
        setEditedImage(item.results as string);
        setEditInstruction(item.inputs.instruction || '');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDeleteHistory = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        deleteHistoryItem(id);
        refreshHistory();
    };

    const handleApplyEdit = async () => {
        if (!sourceImage || !editInstruction.trim()) {
            setError("Please upload an image and describe the changes you want.");
            return;
        }

        const hasPoints = await deductPoints(editCost, `Quick Edit Image`);
        if (!hasPoints) {
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const result = await editGeneratedImage(sourceImage, editInstruction);
            setEditedImage(result);

            // Save to History ONLY for Paid Users
            if (isPaidUser) {
                saveHistoryItem({
                    tool: 'quick-edit' as any, // Type assertion since it's a new tool
                    results: result,
                    inputs: {
                        sourceImage,
                        instruction: editInstruction,
                    }
                });
                refreshHistory();
            }
        } catch (err: any) {
            console.error("Quick edit failed, refunding points...", err);
            if (auth.currentUser) {
                await WalletService.refundPoints(auth.currentUser.uid, editCost, "Refund: Quick Edit Failed", undefined, 1);
            }
            setError(err.message || "Failed to edit image. Points refunded.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleReset = () => {
        setSourceImage(null);
        setEditedImage(null);
        setEditInstruction('');
        setError(null);
    };

    return (
        <div className="max-w-6xl mx-auto p-4 lg:p-8 animate-fade-in">
            <div className="mb-8 border-b border-slate-200 pb-6">
                <h2 className="text-3xl font-bold text-slate-800 mb-2">{t('quick_edit_title')}</h2>
                <p className="text-slate-600">{t('quick_edit_desc')}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Panel - Controls */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100 h-fit">
                        <div className="space-y-5">

                            {/* Image Upload */}
                            <div className="input-group">
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">
                                    {t('upload_image_edit')}
                                </label>
                                <label className={`cursor-pointer flex flex-col items-center justify-center h-32 border-2 border-dashed rounded-xl transition-all ${sourceImage ? 'border-emerald-500 bg-emerald-50' : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'}`}>
                                    {sourceImage ? (
                                        <img src={sourceImage} alt="Source" className="h-full w-auto object-contain rounded-lg" />
                                    ) : (
                                        <>
                                            <span className="text-3xl mb-2">🖼️</span>
                                            <span className="text-sm text-slate-500 font-medium">{t('upload')}</span>
                                        </>
                                    )}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        className="hidden"
                                    />
                                </label>
                                {sourceImage && (
                                    <button
                                        type="button"
                                        onClick={handleReset}
                                        className="text-xs text-red-500 hover:text-red-700 mt-2"
                                    >
                                        {t('remove')}
                                    </button>
                                )}
                            </div>

                            {/* Edit Instructions */}
                            <div className="input-group">
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">
                                    {t('edit_instruction_label')}
                                </label>
                                <textarea
                                    value={editInstruction}
                                    onChange={(e) => setEditInstruction(e.target.value)}
                                    placeholder={t('edit_instruction_ph')}
                                    rows={4}
                                    className="w-full px-4 py-3 border rounded-xl bg-white text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                                />
                            </div>

                            {/* Apply Button */}
                            <Button
                                onClick={handleApplyEdit}
                                isLoading={isLoading}
                                disabled={!sourceImage || !editInstruction.trim()}
                                className="w-full py-3 text-lg font-semibold shadow-xl shadow-indigo-100"
                            >
                                <span className="flex items-center gap-2">
                                    {t('apply_edit')} ({editCost} <CoinIcon className="w-5 h-5 inline-block" />)
                                </span>
                            </Button>

                            {error && (
                                <div className="text-red-600 text-sm p-3 bg-red-50 rounded-lg border border-red-100">
                                    {error}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* History Section */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2 flex justify-between items-center">
                            {t('history_title')}
                            <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-full">{history.length}</span>
                        </h3>
                        {history.length === 0 ? (
                            <div className="text-center text-slate-400 py-6 text-sm">
                                {t('history_empty')}
                            </div>
                        ) : (
                            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                                {history.map(item => (
                                    <div key={item.id} className="flex gap-3 items-start p-3 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all group">
                                        <div className="w-16 h-16 bg-slate-100 rounded-md overflow-hidden flex-shrink-0">
                                            {item.results && (
                                                <img src={item.results as string} className="w-full h-full object-cover" alt="History" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold text-slate-800 truncate leading-tight mb-1">
                                                {item.inputs?.instruction?.slice(0, 30) || "Quick Edit"}...
                                            </p>
                                            <p className="text-[10px] text-slate-400 mb-2">
                                                {new Date(item.timestamp).toLocaleDateString()}
                                            </p>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleLoadHistory(item)}
                                                    className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-1 rounded hover:bg-indigo-100 font-medium transition-colors"
                                                >
                                                    {t('history_load')}
                                                </button>
                                                <button
                                                    onClick={(e) => handleDeleteHistory(e, item.id)}
                                                    className="text-[10px] text-red-400 hover:text-red-600 px-1 py-1 transition-colors opacity-0 group-hover:opacity-100"
                                                >
                                                    {t('history_delete')}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Usage Limits */}
                        <UsageLimitsCard userProfile={userProfile} compact />
                    </div>
                </div>

                {/* Right Panel - Results */}
                <div className="lg:col-span-8 flex flex-col gap-6">
                    {editedImage ? (
                        <div className="animate-fade-in space-y-6">
                            {/* Before/After Comparison */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Original Image */}
                                <div className="bg-white rounded-2xl overflow-hidden shadow-lg border border-slate-200">
                                    <div className="bg-slate-100 px-4 py-2 border-b border-slate-200">
                                        <span className="text-sm font-bold text-slate-600">{t('original_image')}</span>
                                    </div>
                                    <div className="p-4">
                                        <img src={sourceImage || ''} alt="Original" className="w-full h-auto rounded-lg" />
                                    </div>
                                </div>

                                {/* Edited Image */}
                                <div className="bg-white rounded-2xl overflow-hidden shadow-lg border border-indigo-200">
                                    <div className="bg-gradient-to-r from-indigo-500 to-purple-500 px-4 py-2">
                                        <span className="text-sm font-bold text-white">{t('edited_image')}</span>
                                    </div>
                                    <div className="p-4">
                                        <img src={editedImage} alt="Edited" className="w-full h-auto rounded-lg" />
                                    </div>
                                </div>
                            </div>

                            {/* Download Section */}
                            <div className="bg-white p-5 rounded-2xl border border-indigo-100 shadow-sm">
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <a
                                        href={editedImage}
                                        download="creakits-quick-edit.png"
                                        className="flex-1 text-center py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-colors shadow-lg"
                                    >
                                        {t('download')}
                                    </a>
                                    {isPaidUser && (
                                        <SaveToCloudButton
                                            images={[editedImage]}
                                            designType="quick-edit"
                                            metadata={{ instruction: editInstruction }}
                                            onSaved={() => alert(t('design_saved') || 'Design saved!')}
                                            onError={(err) => alert(err)}
                                            className="flex-1"
                                        />
                                    )}
                                    <button
                                        onClick={() => {
                                            setSourceImage(editedImage);
                                            setEditedImage(null);
                                            setEditInstruction('');
                                        }}
                                        className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                                    >
                                        Edit Again
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full min-h-[500px] flex flex-col items-center justify-center bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-300 text-slate-400">
                            <span className="text-6xl mb-4 opacity-20">✨</span>
                            <p className="font-medium">{t('quick_edit_empty')}</p>
                            <p className="text-sm opacity-60 mt-2">{t('quick_edit_sub')}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
