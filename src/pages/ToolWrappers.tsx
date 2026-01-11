import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { DashboardContextType, TrialBanner } from './Dashboard';
import { SocialMediaTool } from '../../components/Tools/SocialMediaTool';
import { AdCreativeTool } from '../../components/Tools/AdCreativeTool';
import { LandingPageTool } from '../../components/Tools/LandingPageTool';
import { QuickEditTool } from '../../components/Tools/QuickEditTool';
import { AdminDashboard } from '../../components/Admin/AdminDashboard';

export const SocialMediaWrapper: React.FC = () => {
    const { points, deductPoints, isPaidUser, userProfile } = useOutletContext<DashboardContextType>();
    return (
        <>
            {!isPaidUser && <TrialBanner />}
            <SocialMediaTool points={points} deductPoints={deductPoints} isPaidUser={isPaidUser} userProfile={userProfile} />
        </>
    );
};

export const AdCreativeWrapper: React.FC = () => {
    const { points, deductPoints, isPaidUser, userProfile } = useOutletContext<DashboardContextType>();
    return (
        <>
            {!isPaidUser && <TrialBanner />}
            <AdCreativeTool points={points} deductPoints={deductPoints} isPaidUser={isPaidUser} userProfile={userProfile} />
        </>
    );
};

export const LandingPageToolWrapper: React.FC = () => {
    const { points, deductPoints, isPaidUser, userProfile } = useOutletContext<DashboardContextType>();
    return (
        <>
            {!isPaidUser && <TrialBanner />}
            <LandingPageTool points={points} deductPoints={deductPoints} isPaidUser={isPaidUser} userProfile={userProfile} />
        </>
    );
};

export const QuickEditWrapper: React.FC = () => {
    const { points, deductPoints, isPaidUser, userProfile } = useOutletContext<DashboardContextType>();
    return (
        <>
            {!isPaidUser && <TrialBanner />}
            <QuickEditTool points={points} deductPoints={deductPoints} isPaidUser={isPaidUser} userProfile={userProfile} />
        </>
    );
};

export const AdminWrapper: React.FC = () => {
    const { isAdmin } = useOutletContext<DashboardContextType>();
    return isAdmin ? <AdminDashboard /> : <div className="p-8 text-center text-red-500 font-bold text-xl">Access Denied: Admins Only</div>;
};
