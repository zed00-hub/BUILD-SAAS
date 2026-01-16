
import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { DashboardContextType, TrialBanner } from './Dashboard';
import { SocialMediaTool } from '../../components/Tools/SocialMediaTool';
import { AdCreativeTool } from '../../components/Tools/AdCreativeTool';
import { LandingPageTool } from '../../components/Tools/LandingPageTool';
import { QuickEditTool } from '../../components/Tools/QuickEditTool';
import { ProductDescriptionTool } from '../../components/Tools/ProductDescriptionTool';
import { VirtualTryOnTool } from '../../components/Tools/VirtualTryOnTool';
import { AdminDashboard } from '../../components/Admin/AdminDashboard';

// --- Tool Guard Component ---
const ToolGuard: React.FC<{ toolId: string; children: React.ReactNode }> = ({ toolId, children }) => {
    const [isLocked, setIsLocked] = useState(false);
    const [lockReason, setLockReason] = useState('');
    // Initialize loading to true only initially helps prevent flash, but for UX 'false' might be better to show tool instantly 
    // and then hide if locked (optimistic), but 'true' is safer for security.
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Use real-time listener for instant updates
        const unsubscribe = onSnapshot(doc(db, 'tool_locks', toolId), (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                const isGlobal = data.isGlobal;
                const userId = auth.currentUser?.uid;

                // Check if user is specifically targeted
                // If affectedUserIds is missing/undefined, and not global, then nobody is affected (safe fallback)
                const userIsAffected = !isGlobal && (data.affectedUserIds || []).includes(userId);

                if (isGlobal || userIsAffected) {
                    setIsLocked(true);
                    setLockReason(data.reason || 'Under Maintenance');
                } else {
                    setIsLocked(false);
                }
            } else {
                // No lock document means tool is open
                setIsLocked(false);
            }
            setIsLoading(false);
        }, (error) => {
            console.error("ToolGuard Error:", error);
            setIsLoading(false); // Fallback to allowing access or blocking? Letting Open for now to avoid blocking on network error.
        });

        return () => unsubscribe();
    }, [toolId]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (isLocked) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 animate-fade-in">
                <div className="bg-red-50 p-8 rounded-3xl max-w-lg border border-red-100 shadow-sm">
                    <div className="text-6xl mb-6">🚫</div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Access Restricted</h2>
                    <p className="text-slate-600 mb-6 font-medium">This tool is currently unavailable for your account.</p>
                    <div className="bg-white p-4 rounded-xl border border-red-100 text-red-800 text-sm font-semibold shadow-sm">
                        "{lockReason}"
                    </div>
                    <div className="mt-8 text-xs text-slate-400">
                        Administrator Restriction • {new Date().toLocaleDateString()}
                    </div>
                </div>
            </div>
        );
    }

    return <>{children}</>;
};


export const SocialMediaWrapper: React.FC = () => {
    const { points, deductPoints, isPaidUser, userProfile } = useOutletContext<DashboardContextType>();
    return (
        <ToolGuard toolId="social-media">
            {!isPaidUser && <TrialBanner />}
            <SocialMediaTool points={points} deductPoints={deductPoints} isPaidUser={isPaidUser} userProfile={userProfile} />
        </ToolGuard>
    );
};

export const AdCreativeWrapper: React.FC = () => {
    const { points, deductPoints, isPaidUser, userProfile } = useOutletContext<DashboardContextType>();
    return (
        <ToolGuard toolId="ad-creative">
            {!isPaidUser && <TrialBanner />}
            <AdCreativeTool points={points} deductPoints={deductPoints} isPaidUser={isPaidUser} userProfile={userProfile} />
        </ToolGuard>
    );
};

export const LandingPageToolWrapper: React.FC = () => {
    const { points, deductPoints, isPaidUser, userProfile } = useOutletContext<DashboardContextType>();
    return (
        <ToolGuard toolId="landing-page">
            {!isPaidUser && <TrialBanner />}
            <LandingPageTool points={points} deductPoints={deductPoints} isPaidUser={isPaidUser} userProfile={userProfile} />
        </ToolGuard>
    );
};

export const QuickEditWrapper: React.FC = () => {
    const { points, deductPoints, isPaidUser, userProfile } = useOutletContext<DashboardContextType>();
    return (
        <ToolGuard toolId="quick-edit">
            {!isPaidUser && <TrialBanner />}
            <QuickEditTool points={points} deductPoints={deductPoints} isPaidUser={isPaidUser} userProfile={userProfile} />
        </ToolGuard>
    );
};

export const AdminWrapper: React.FC = () => {
    const { isAdmin } = useOutletContext<DashboardContextType>();
    return isAdmin ? <AdminDashboard /> : <div className="p-8 text-center text-red-500 font-bold text-xl">Access Denied: Admins Only</div>;
};

export const ProductDescriptionWrapper: React.FC = () => {
    const { points, deductPoints, isPaidUser, userProfile } = useOutletContext<DashboardContextType>();
    return (
        <ToolGuard toolId="product-description">
            {!isPaidUser && <TrialBanner />}
            <ProductDescriptionTool points={points} deductPoints={deductPoints} isPaidUser={isPaidUser} userProfile={userProfile} />
        </ToolGuard>
    );
};

export const VirtualTryOnWrapper: React.FC = () => {
    const { points, deductPoints, isPaidUser, userProfile } = useOutletContext<DashboardContextType>();
    return (
        <ToolGuard toolId="virtual-tryon">
            {!isPaidUser && <TrialBanner />}
            <VirtualTryOnTool points={points} deductPoints={deductPoints} isPaidUser={isPaidUser} userProfile={userProfile} />
        </ToolGuard>
    );
};

