import React from 'react';

interface IconProps {
    className?: string;
    size?: number;
}

// Social Media - Modern grid/carousel icon
export const SocialMediaIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
);

// Ad Creative - Spotlight/megaphone icon
export const AdCreativeIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 11l18-5v12L3 13v-2z" />
        <path d="M11.6 16.8a3 3 0 11-5.8-1.6" />
    </svg>
);

// Landing Page - Browser window icon
export const LandingPageIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M3 9h18" />
        <circle cx="6" cy="6.5" r="0.5" fill="currentColor" />
        <circle cx="8.5" cy="6.5" r="0.5" fill="currentColor" />
        <circle cx="11" cy="6.5" r="0.5" fill="currentColor" />
    </svg>
);

// Quick Edit - Magic wand/sparkle icon
export const QuickEditIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3v2M12 19v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M3 12h2M19 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        <circle cx="12" cy="12" r="3" />
    </svg>
);

// Product Description - Document with pen icon
export const ProductDescIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
        <path d="M14 2v6h6" />
        <path d="M16 13H8M16 17H8M10 9H8" />
    </svg>
);

// Virtual Try-On - Shirt/hanger icon
export const VirtualTryOnIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.38 3.46L16 2a4 4 0 01-8 0L3.62 3.46a2 2 0 00-1.34 2.23l.58 3.47a1 1 0 00.99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 002-2V10h2.15a1 1 0 00.99-.84l.58-3.47a2 2 0 00-1.34-2.23z" />
    </svg>
);

// Admin Panel - Shield icon
export const AdminIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="M9 12l2 2 4-4" />
    </svg>
);

// Home icon
export const HomeIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        <polyline points="9,22 9,12 15,12 15,22" />
    </svg>
);

// My Projects/Folder icon
export const ProjectsIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
    </svg>
);

// Tool icon wrapper with gradient background
export const ToolIconWrapper: React.FC<{
    children: React.ReactNode;
    gradient?: string;
    className?: string;
}> = ({ children, gradient = 'from-indigo-500 to-purple-600', className = '' }) => (
    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white shadow-lg ${className}`}>
        {children}
    </div>
);

// Tool data with icons and colors
export const TOOL_ICONS = {
    'social-media': {
        icon: SocialMediaIcon,
        gradient: 'from-blue-500 to-cyan-500',
        bgLight: 'bg-blue-50',
        textColor: 'text-blue-600',
    },
    'ad-creative': {
        icon: AdCreativeIcon,
        gradient: 'from-purple-500 to-pink-500',
        bgLight: 'bg-purple-50',
        textColor: 'text-purple-600',
    },
    'landing-page': {
        icon: LandingPageIcon,
        gradient: 'from-emerald-500 to-teal-500',
        bgLight: 'bg-emerald-50',
        textColor: 'text-emerald-600',
    },
    'quick-edit': {
        icon: QuickEditIcon,
        gradient: 'from-amber-500 to-orange-500',
        bgLight: 'bg-amber-50',
        textColor: 'text-amber-600',
    },
    'product-description': {
        icon: ProductDescIcon,
        gradient: 'from-rose-500 to-red-500',
        bgLight: 'bg-rose-50',
        textColor: 'text-rose-600',
    },
    'virtual-tryon': {
        icon: VirtualTryOnIcon,
        gradient: 'from-violet-500 to-indigo-500',
        bgLight: 'bg-violet-50',
        textColor: 'text-violet-600',
    },
};
