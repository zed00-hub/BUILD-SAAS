
import React, { useState, useEffect } from 'react';
import { AdminService } from '../../src/services/adminService';
import { ToolLock } from '../../types';
import { Button } from '../Button';
import { auth } from '../../src/firebase';

const AVAILABLE_TOOLS = [
    { id: 'social-media', name: 'Social Media Tool', icon: '📱' },
    { id: 'ad-creative', name: 'Ad Creative Tool', icon: '📢' },
    { id: 'landing-page', name: 'Landing Page Tool', icon: '📄' },
    { id: 'quick-edit', name: 'Quick Edit Tool', icon: '✨' },
    { id: 'product-description', name: 'Product Description', icon: '📝' },
    { id: 'virtual-tryon', name: 'Virtual Try-On', icon: '👕' },
];

export const ToolManager: React.FC = () => {
    const [locks, setLocks] = useState<ToolLock[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editingTool, setEditingTool] = useState<string | null>(null);

    // Form State
    const [reason, setReason] = useState('');
    const [isGlobal, setIsGlobal] = useState(true);
    const [affectedUserIds, setAffectedUserIds] = useState('');

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

    const handleEditClick = (toolId: string) => {
        const existingLock = locks.find(l => l.toolId === toolId);
        if (existingLock) {
            setReason(existingLock.reason);
            setIsGlobal(existingLock.isGlobal);
            setAffectedUserIds(existingLock.affectedUserIds?.join(', ') || '');
        } else {
            setReason('');
            setIsGlobal(true);
            setAffectedUserIds('');
        }
        setEditingTool(toolId);
    };

    const handleSave = async () => {
        if (!editingTool) return;
        if (!reason.trim()) {
            alert("Please provide a reason.");
            return;
        }

        const lockData: ToolLock = {
            toolId: editingTool,
            isGlobal,
            reason,
            affectedUserIds: isGlobal ? [] : affectedUserIds.split(',').map(id => id.trim()).filter(id => id),
            createdAt: Date.now(),
            createdBy: auth.currentUser?.email || 'admin'
        };

        try {
            await AdminService.setToolLock(lockData);
            setEditingTool(null);
            loadLocks();
        } catch (error) {
            alert("Failed to save lock settings.");
        }
    };

    const handleUnlock = async (toolId: string) => {
        if (confirm("Are you sure you want to unlock this tool?")) {
            try {
                await AdminService.removeToolLock(toolId);
                loadLocks();
            } catch (error) {
                alert("Failed to unlock.");
            }
        }
    };

    return (
        <div className="space-y-6">
            <h3 className="text-xl font-bold text-slate-800">Tool Access Management</h3>
            <p className="text-slate-500">Lock specific tools for maintenance or restrict access for certain users.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {AVAILABLE_TOOLS.map(tool => {
                    const lock = locks.find(l => l.toolId === tool.id);
                    const isLocked = !!lock;

                    return (
                        <div key={tool.id} className={`bg-white rounded-xl shadow-sm border p-6 transition-all ${isLocked ? 'border-red-200 bg-red-50' : 'border-slate-200'}`}>
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">{tool.icon}</span>
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
                                    onClick={() => handleEditClick(tool.id)}
                                >
                                    {isLocked ? 'Edit Settings' : 'Lock Tool'}
                                </Button>
                                {isLocked && (
                                    <Button
                                        variant="danger" // Assuming danger variant exists or default styling fallback
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

            {editingTool && (
                <div className="fixed inset-0 w-full h-full bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-fade-in text-left rtl:text-right">
                        <h4 className="text-lg font-bold mb-4">Lock Settings: {AVAILABLE_TOOLS.find(t => t.id === editingTool)?.name}</h4>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Reason for Lockout</label>
                                <textarea
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                                    placeholder="e.g. Under maintenance, Server upgrade..."
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    rows={3}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Scope</label>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            checked={isGlobal}
                                            onChange={() => setIsGlobal(true)}
                                            className="w-4 h-4 text-indigo-600"
                                        />
                                        <span>Everyone (Global)</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            checked={!isGlobal}
                                            onChange={() => setIsGlobal(false)}
                                            className="w-4 h-4 text-indigo-600"
                                        />
                                        <span>Specific Users</span>
                                    </label>
                                </div>
                            </div>

                            {!isGlobal && (
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">User IDs (Comma Separated)</label>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                                        placeholder="uid1, uid2, uid3..."
                                        value={affectedUserIds}
                                        onChange={(e) => setAffectedUserIds(e.target.value)}
                                    />
                                    <p className="text-xs text-slate-400 mt-1">Copy UIDs from the Users tab.</p>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <Button variant="secondary" onClick={() => setEditingTool(null)}>Cancel</Button>
                            <Button variant="primary" onClick={handleSave}>Save Lock</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
