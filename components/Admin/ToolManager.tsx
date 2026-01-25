import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AdminService } from '../../src/services/adminService';
import { ToolLock } from '../../types';
import { Button } from '../Button';
import { auth } from '../../src/firebase';
import {
    SocialMediaIcon,
    AdCreativeIcon,
    LandingPageIcon,
    QuickEditIcon,
    ProductDescIcon,
    VirtualTryOnIcon,
    LandingPageProIcon
} from '../ToolIcons';

const AVAILABLE_TOOLS = [
    { id: 'social-media', name: 'Social Media Tool', Icon: SocialMediaIcon, gradient: 'from-blue-500 to-cyan-500' },
    { id: 'ad-creative', name: 'Ad Creative Tool', Icon: AdCreativeIcon, gradient: 'from-purple-500 to-pink-500' },
    { id: 'landing-page', name: 'Landing Page Tool', Icon: LandingPageIcon, gradient: 'from-emerald-500 to-teal-500' },
    { id: 'landing-page-pro', name: 'Landing Page Flow Pro', Icon: LandingPageProIcon, gradient: 'from-blue-600 to-indigo-600' },
    { id: 'quick-edit', name: 'Quick Edit Tool', Icon: QuickEditIcon, gradient: 'from-amber-500 to-orange-500' },
    { id: 'product-description', name: 'Product Description', Icon: ProductDescIcon, gradient: 'from-rose-500 to-red-500' },
    { id: 'virtual-tryon', name: 'Virtual Try-On', Icon: VirtualTryOnIcon, gradient: 'from-violet-500 to-indigo-500' },
];

// Modal Component using Portal
const LockModal: React.FC<{
    toolId: string;
    toolName: string;
    existingLock?: ToolLock;
    onClose: () => void;
    onSave: (lock: ToolLock) => Promise<void>;
}> = ({ toolId, toolName, existingLock, onClose, onSave }) => {
    const [reason, setReason] = useState(existingLock?.reason || '');
    const [isGlobal, setIsGlobal] = useState(existingLock?.isGlobal ?? true);
    const [affectedUserIds, setAffectedUserIds] = useState(existingLock?.affectedUserIds?.join(', ') || '');
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        if (!reason.trim()) {
            alert("Please provide a reason.");
            return;
        }

        setSaving(true);
        const lockData: ToolLock = {
            toolId,
            isGlobal,
            reason,
            affectedUserIds: isGlobal ? [] : affectedUserIds.split(',').map(id => id.trim()).filter(id => id),
            createdAt: Date.now(),
            createdBy: auth.currentUser?.email || 'admin'
        };

        try {
            await onSave(lockData);
            onClose();
        } catch (error) {
            alert("Failed to save lock settings.");
        } finally {
            setSaving(false);
        }
    };

    // Close on Escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [onClose]);

    // Prevent body scroll when modal is open
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = '';
        };
    }, []);

    const modalContent = (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                backdropFilter: 'blur(4px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '16px',
                zIndex: 99999,
            }}
            onClick={onClose}
        >
            <div
                style={{
                    backgroundColor: 'white',
                    borderRadius: '16px',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                    width: '100%',
                    maxWidth: '28rem',
                    padding: '24px',
                    position: 'relative',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        top: '16px',
                        right: '16px',
                        width: '32px',
                        height: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '50%',
                        backgroundColor: '#f1f5f9',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '16px',
                        color: '#64748b',
                    }}
                >
                    ✕
                </button>

                <h4 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', paddingRight: '40px' }}>
                    Lock Settings: {toolName}
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', color: '#334155', marginBottom: '4px' }}>
                            Reason for Lockout
                        </label>
                        <textarea
                            style={{
                                width: '100%',
                                padding: '8px 12px',
                                border: '1px solid #e2e8f0',
                                borderRadius: '8px',
                                resize: 'vertical',
                                minHeight: '80px',
                            }}
                            placeholder="e.g. Under maintenance, Server upgrade..."
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', color: '#334155', marginBottom: '4px' }}>
                            Scope
                        </label>
                        <div style={{ display: 'flex', gap: '16px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                <input
                                    type="radio"
                                    checked={isGlobal}
                                    onChange={() => setIsGlobal(true)}
                                />
                                <span>Everyone (Global)</span>
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                <input
                                    type="radio"
                                    checked={!isGlobal}
                                    onChange={() => setIsGlobal(false)}
                                />
                                <span>Specific Users</span>
                            </label>
                        </div>
                    </div>

                    {!isGlobal && (
                        <div>
                            <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', color: '#334155', marginBottom: '4px' }}>
                                User IDs (Comma Separated)
                            </label>
                            <input
                                type="text"
                                style={{
                                    width: '100%',
                                    padding: '8px 12px',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '8px',
                                }}
                                placeholder="uid1, uid2, uid3..."
                                value={affectedUserIds}
                                onChange={(e) => setAffectedUserIds(e.target.value)}
                            />
                            <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                                Copy UIDs from the Users tab.
                            </p>
                        </div>
                    )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                    <Button variant="secondary" onClick={onClose} disabled={saving}>
                        Cancel
                    </Button>
                    <Button variant="primary" onClick={handleSave} disabled={saving}>
                        {saving ? 'Saving...' : 'Save Lock'}
                    </Button>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
};

export const ToolManager: React.FC = () => {
    const [locks, setLocks] = useState<ToolLock[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editingToolId, setEditingToolId] = useState<string | null>(null);

    useEffect(() => {
        loadLocks();
    }, []);

    const loadLocks = async () => {
        setIsLoading(true);
        try {
            const data = await AdminService.getToolLocks();
            setLocks(data);
        } catch (error) {
            console.error("Failed to load locks", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveLock = async (lockData: ToolLock) => {
        await AdminService.setToolLock(lockData);
        await loadLocks();
    };

    const handleUnlock = async (toolId: string) => {
        if (confirm("Are you sure you want to unlock this tool?")) {
            try {
                await AdminService.removeToolLock(toolId);
                await loadLocks();
            } catch (error) {
                alert("Failed to unlock.");
            }
        }
    };

    const editingTool = AVAILABLE_TOOLS.find(t => t.id === editingToolId);
    const existingLock = locks.find(l => l.toolId === editingToolId);

    return (
        <div className="space-y-6">
            <h3 className="text-xl font-bold text-slate-800">Tool Access Management</h3>
            <p className="text-slate-500">Lock specific tools for maintenance or restrict access for certain users.</p>

            {isLoading ? (
                <div className="text-center py-10 text-slate-400">Loading tools...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {AVAILABLE_TOOLS.map(tool => {
                        const lock = locks.find(l => l.toolId === tool.id);
                        const isLocked = !!lock;

                        return (
                            <div key={tool.id} className={`bg-white rounded-xl shadow-sm border p-6 transition-all ${isLocked ? 'border-red-200 bg-red-50' : 'border-slate-200'}`}>
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${tool.gradient} flex items-center justify-center shadow-md`}>
                                            <tool.Icon size={20} className="text-white" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-800">{tool.name}</h4>
                                            <div className={`text-xs font-bold px-2 py-0.5 rounded-full w-fit mt-1 ${isLocked ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                                {isLocked ? 'LOCKED' : 'ACTIVE'}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {isLocked && (
                                    <div className="text-sm text-slate-600 mb-4 bg-white/50 p-3 rounded-lg border border-red-100">
                                        <p><strong>Reason:</strong> {lock.reason}</p>
                                        <p className="mt-1"><strong>Scope:</strong> {lock.isGlobal ? 'Global (All Users)' : `Specific Users (${lock.affectedUserIds?.length || 0})`}</p>
                                    </div>
                                )}

                                <div className="flex gap-2">
                                    <Button
                                        variant="secondary"
                                        className="flex-1 text-sm"
                                        onClick={() => setEditingToolId(tool.id)}
                                    >
                                        {isLocked ? 'Edit Settings' : 'Lock Tool'}
                                    </Button>
                                    {isLocked && (
                                        <Button
                                            variant="secondary"
                                            className="text-sm bg-white border border-red-200 text-red-600 hover:bg-red-50"
                                            onClick={() => handleUnlock(tool.id)}
                                        >
                                            Unlock
                                        </Button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modal rendered via Portal */}
            {editingToolId && editingTool && (
                <LockModal
                    toolId={editingToolId}
                    toolName={editingTool.name}
                    existingLock={existingLock}
                    onClose={() => setEditingToolId(null)}
                    onSave={handleSaveLock}
                />
            )}
        </div>
    );
};
