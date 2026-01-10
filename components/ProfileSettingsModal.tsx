import React, { useState, useRef } from 'react';
import { Button } from './Button';
import { UserData } from '../src/types/dbTypes';
import { fileToBase64 } from '../services/geminiService'; // Reusing this helper
import { WalletService } from '../src/services/walletService';

interface ProfileSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: UserData;
    onUpdate: () => void; // Trigger refresh in parent
}

export const ProfileSettingsModal: React.FC<ProfileSettingsModalProps> = ({ isOpen, onClose, user, onUpdate }) => {
    const [activeTab, setActiveTab] = useState<'profile' | 'brand'>('profile');
    const [isLoading, setIsLoading] = useState(false);

    // Profile State
    const [displayName, setDisplayName] = useState(user.displayName || '');
    const [photoURL, setPhotoURL] = useState(user.photoURL || '');

    // Brand Kit State
    const [logoImage, setLogoImage] = useState<string | null>(user.brandKit?.logo || null);
    const [styleImage, setStyleImage] = useState<string | null>(user.brandKit?.styleImage || null);

    if (!isOpen) return null;

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await WalletService.updateUserProfile(user.uid, {
                displayName,
                photoURL
            });
            onUpdate();
            alert("Profile updated successfully!");
        } catch (error) {
            console.error(error);
            alert("Failed to update profile.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveBrandKit = async () => {
        setIsLoading(true);
        try {
            await WalletService.updateUserProfile(user.uid, {
                brandKit: {
                    logo: logoImage || undefined,
                    styleImage: styleImage || undefined
                }
            });
            onUpdate();
            alert("Brand Kit updated successfully! These assets will be auto-applied in Social Media tool.");
        } catch (error) {
            console.error(error);
            alert("Failed to update Brand Kit.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
        if (e.target.files && e.target.files[0]) {
            try {
                const base64 = await fileToBase64(e.target.files[0]);
                setter(base64);
            } catch (err) {
                console.error("Error converting image", err);
            }
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>

            <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-fade-in flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h2 className="text-2xl font-bold text-slate-900">Settings</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-200 text-slate-500 transition-colors">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-200">
                    <button
                        onClick={() => setActiveTab('profile')}
                        className={`flex-1 py-4 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'profile' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
                    >
                        My Profile
                    </button>
                    <button
                        onClick={() => setActiveTab('brand')}
                        className={`flex-1 py-4 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'brand' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
                    >
                        🎨 Brand Kit <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded ml-1">NEW</span>
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto">
                    {activeTab === 'profile' ? (
                        <form onSubmit={handleSaveProfile} className="space-y-6">
                            <div className="flex flex-col items-center mb-6">
                                <div className="w-24 h-24 rounded-full bg-slate-100 border-2 border-slate-200 mb-4 overflow-hidden relative group cursor-pointer">
                                    {photoURL ? (
                                        <img src={photoURL} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-400 text-2xl font-bold">
                                            {displayName?.[0]?.toUpperCase() || 'U'}
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <span className="text-white text-xs">Change</span>
                                    </div>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                        onChange={(e) => handleImageUpload(e, setPhotoURL)}
                                    />
                                </div>
                                <p className="text-xs text-slate-500">Click to upload new photo</p>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Display Name</label>
                                <input
                                    type="text"
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                    placeholder="Your Name"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Email</label>
                                <input
                                    type="email"
                                    value={user.email}
                                    disabled
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-500 cursor-not-allowed"
                                />
                            </div>

                            <Button type="submit" isLoading={isLoading} className="w-full py-3">Save Changes</Button>
                        </form>
                    ) : (
                        <div className="space-y-8">
                            <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl text-sm text-indigo-800">
                                <strong>Brand Kit:</strong> Set your fixed assets here. They will be
                                <span className="font-bold underline ml-1">automatically enabled</span> in the Social Media tool,
                                and available as options in other tools.
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Default Logo</label>
                                    <div className={`relative h-40 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all ${logoImage ? 'border-indigo-500 bg-white' : 'border-slate-300 bg-slate-50 hover:bg-slate-100'}`}>
                                        {logoImage ? (
                                            <>
                                                <img src={logoImage} alt="Logo" className="max-h-full max-w-full p-2 object-contain" />
                                                <button
                                                    onClick={() => setLogoImage(null)}
                                                    className="absolute top-2 right-2 p-1 bg-red-100 text-red-600 rounded-full hover:bg-red-200"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                                </button>
                                            </>
                                        ) : (
                                            <div className="text-center p-4">
                                                <span className="text-2xl block mb-2">©️</span>
                                                <span className="text-xs text-slate-500">Upload Logo (PNG)</span>
                                            </div>
                                        )}
                                        {!logoImage && (
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="absolute inset-0 opacity-0 cursor-pointer"
                                                onChange={(e) => handleImageUpload(e, setLogoImage)}
                                            />
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Fixed Style Reference</label>
                                    <div className={`relative h-40 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all ${styleImage ? 'border-indigo-500 bg-white' : 'border-slate-300 bg-slate-50 hover:bg-slate-100'}`}>
                                        {styleImage ? (
                                            <>
                                                <img src={styleImage} alt="Style" className="max-h-full max-w-full p-2 object-contain" />
                                                <button
                                                    onClick={() => setStyleImage(null)}
                                                    className="absolute top-2 right-2 p-1 bg-red-100 text-red-600 rounded-full hover:bg-red-200"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                                </button>
                                            </>
                                        ) : (
                                            <div className="text-center p-4">
                                                <span className="text-2xl block mb-2">🎨</span>
                                                <span className="text-xs text-slate-500">Upload Style Image</span>
                                            </div>
                                        )}
                                        {!styleImage && (
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="absolute inset-0 opacity-0 cursor-pointer"
                                                onChange={(e) => handleImageUpload(e, setStyleImage)}
                                            />
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-slate-100 pt-6">
                                <Button onClick={handleSaveBrandKit} isLoading={isLoading} className="w-full py-3">
                                    Save Brand Assets
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
