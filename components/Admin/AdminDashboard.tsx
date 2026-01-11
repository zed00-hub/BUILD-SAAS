import React, { useEffect, useState } from 'react';
import { AdminService, PLAN_CONFIGS } from '../../src/services/adminService';
import { LIMITS } from '../../src/services/walletService';
import { PricingService, PricingConfig, PricingPlan, DEFAULT_PRICING_CONFIG } from '../../src/services/pricingService';
import { UserData, Order, AccountType, PlanType } from '../../src/types/dbTypes';
import { Button } from '../Button';
import { CoinIcon } from '../CoinIcon';
import { PricingManager } from './PricingManager';

type AdjustmentType = 'trial' | 'paid';

export const AdminDashboard: React.FC = () => {
    const [users, setUsers] = useState<UserData[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [activeTab, setActiveTab] = useState<'users' | 'orders' | 'limits' | 'pricing'>('users');
    const [isLoading, setIsLoading] = useState(true);

    // Action States
    const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
    const [adjustmentType, setAdjustmentType] = useState<AdjustmentType>('trial');
    const [amountToAdjust, setAmountToAdjust] = useState<string>('');
    const [adjustReason, setAdjustReason] = useState<string>('');
    const [selectedPlan, setSelectedPlan] = useState<'basic' | 'pro' | 'elite'>('basic');

    // Pricing Management States
    const [pricingConfig, setPricingConfig] = useState<PricingConfig>(DEFAULT_PRICING_CONFIG);
    const [editingPlan, setEditingPlan] = useState<PricingPlan | null>(null);
    const [isAddingPlan, setIsAddingPlan] = useState(false);
    const [pricingSaving, setPricingSaving] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [usersData, ordersData, pricingData] = await Promise.all([
                AdminService.getAllUsers(),
                AdminService.getAllOrders(),
                PricingService.getPricingConfig()
            ]);
            setUsers(usersData);
            setOrders(ordersData);
            setPricingConfig(pricingData);
        } catch (e) {
            console.error("Failed to load admin data", e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleBalanceAdjustment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser) return;

        let success = false;

        if (adjustmentType === 'trial') {
            // Trial adjustment - just add/remove points
            const amount = parseInt(amountToAdjust);
            if (isNaN(amount)) {
                alert("Please enter a valid amount");
                return;
            }
            success = await AdminService.adjustTrialBalance(
                selectedUser.uid,
                amount,
                adjustReason || 'Admin Manual Adjustment'
            );
        } else {
            // Paid plan upgrade
            success = await AdminService.upgradeToPaidPlan(
                selectedUser.uid,
                selectedPlan,
                adjustReason || 'Plan Purchase'
            );
        }

        if (success) {
            alert(adjustmentType === 'trial'
                ? "Trial balance updated successfully!"
                : `User upgraded to ${PLAN_CONFIGS[selectedPlan].name} plan with ${PLAN_CONFIGS[selectedPlan].points} points!`
            );
            closeModal();
            loadData();
        } else {
            alert("Failed to update user");
        }
    };

    const handleDowngrade = async (user: UserData) => {
        if (confirm(`Are you sure you want to downgrade ${user.displayName || user.email} to Trial account? Their plan benefits will be removed.`)) {
            const success = await AdminService.downgradeToTrial(user.uid);
            if (success) {
                alert("User downgraded to Trial successfully");
                loadData();
            } else {
                alert("Failed to downgrade user");
            }
        }
    };

    const toggleUserStatus = async (user: UserData) => {
        if (confirm(`Are you sure you want to ${user.isDisabled ? 'enable' : 'disable'} this user?`)) {
            await AdminService.toggleUserStatus(user.uid, user.isDisabled);
            loadData();
        }
    };

    const closeModal = () => {
        setSelectedUser(null);
        setAmountToAdjust('');
        setAdjustReason('');
        setAdjustmentType('trial');
        setSelectedPlan('basic');
    };

    const getAccountBadge = (user: UserData) => {
        if (user.accountType === 'paid') {
            const planName = user.planType ? PLAN_CONFIGS[user.planType as keyof typeof PLAN_CONFIGS]?.name : 'Paid';
            return (
                <span className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-2 py-1 rounded-full text-xs font-bold shadow-sm">
                    💎 {planName}
                </span>
            );
        }
        return (
            <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-medium">
                🆓 Trial
            </span>
        );
    };

    if (isLoading) {
        return <div className="p-8 text-center">Loading Admin Dashboard...</div>;
    }

    return (
        <div className="max-w-7xl mx-auto p-6 md:p-10 animate-fade-in">
            <h1 className="text-3xl font-bold text-slate-900 mb-8 flex items-center gap-3">
                <span className="bg-indigo-600 text-white p-2 rounded-lg text-xl">🛡️</span>
                Admin Dashboard
            </h1>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <p className="text-slate-500 text-sm font-bold uppercase">Total Users</p>
                    <p className="text-4xl font-bold text-indigo-600 mt-2">{users.length}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <p className="text-slate-500 text-sm font-bold uppercase">Paid Users</p>
                    <p className="text-4xl font-bold text-emerald-600 mt-2">
                        {users.filter(u => u.accountType === 'paid').length}
                    </p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <p className="text-slate-500 text-sm font-bold uppercase">Trial Users</p>
                    <p className="text-4xl font-bold text-amber-500 mt-2">
                        {users.filter(u => u.accountType !== 'paid').length}
                    </p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <p className="text-slate-500 text-sm font-bold uppercase">Total Orders</p>
                    <p className="text-4xl font-bold text-purple-600 mt-2">{orders.length}</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-slate-200 mb-6 overflow-x-auto">
                <button
                    onClick={() => setActiveTab('users')}
                    className={`pb-4 px-2 font-semibold whitespace-nowrap ${activeTab === 'users' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-800'}`}
                >
                    User Management
                </button>
                <button
                    onClick={() => setActiveTab('orders')}
                    className={`pb-4 px-2 font-semibold whitespace-nowrap ${activeTab === 'orders' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-800'}`}
                >
                    Order History
                </button>
                <button
                    onClick={() => setActiveTab('limits')}
                    className={`pb-4 px-2 font-semibold whitespace-nowrap ${activeTab === 'limits' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-800'}`}
                >
                    System Limits & Rules
                </button>
                <button
                    onClick={() => setActiveTab('pricing')}
                    className={`pb-4 px-2 font-semibold whitespace-nowrap ${activeTab === 'pricing' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-800'}`}
                >
                    🎨 Pricing Design
                </button>
            </div>

            {/* Content */}
            {activeTab === 'users' ? (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold">
                                <tr>
                                    <th className="p-4">User</th>
                                    <th className="p-4">Balance</th>
                                    <th className="p-4">Account Type</th>
                                    <th className="p-4">Role</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {users.map(user => (
                                    <tr key={user.uid} className="hover:bg-slate-50 transition-colors">
                                        <td className="p-4">
                                            <div className="font-bold text-slate-900">{user.displayName || 'No Name'}</div>
                                            <div className="text-xs text-slate-500">{user.email}</div>
                                        </td>
                                        <td className="p-4 font-bold text-indigo-700">
                                            {user.balance} <CoinIcon className="w-4 h-4 inline" />
                                        </td>
                                        <td className="p-4">
                                            {getAccountBadge(user)}
                                        </td>
                                        <td className="p-4">
                                            {user.isAdmin ? (
                                                <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs font-bold">Admin</span>
                                            ) : (
                                                <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs">User</span>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${user.isDisabled ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                                {user.isDisabled ? 'Disabled' : 'Active'}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex gap-2 flex-wrap">
                                                <button
                                                    onClick={() => setSelectedUser(user)}
                                                    className="px-3 py-1.5 bg-indigo-50 text-indigo-600 text-xs font-bold rounded-lg hover:bg-indigo-100"
                                                >
                                                    💰 Manage Points
                                                </button>
                                                {user.accountType === 'paid' && (
                                                    <button
                                                        onClick={() => handleDowngrade(user)}
                                                        className="px-3 py-1.5 bg-amber-50 text-amber-600 text-xs font-bold rounded-lg hover:bg-amber-100"
                                                    >
                                                        ⬇️ Downgrade
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => toggleUserStatus(user)}
                                                    className={`px-3 py-1.5 text-xs font-bold rounded-lg border ${user.isDisabled ? 'border-emerald-200 text-emerald-600 hover:bg-emerald-50' : 'border-red-200 text-red-600 hover:bg-red-50'}`}
                                                >
                                                    {user.isDisabled ? 'Unban' : 'Ban'}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : activeTab === 'orders' ? (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold">
                                <tr>
                                    <th className="p-4">Order ID</th>
                                    <th className="p-4">User</th>
                                    <th className="p-4">Tool</th>
                                    <th className="p-4">Cost</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4">Time</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {orders.map(order => (
                                    <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="p-4 text-xs font-mono text-slate-400">
                                            {order.id.slice(0, 8)}...
                                        </td>
                                        <td className="p-4 text-xs font-mono text-indigo-600">
                                            {order.userId.slice(0, 8)}...
                                        </td>
                                        <td className="p-4">
                                            <span className="px-2 py-1 bg-slate-100 rounded text-xs font-semibold">{order.toolType}</span>
                                        </td>
                                        <td className="p-4 font-bold text-slate-700">
                                            {order.cost}
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase
                                                ${order.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : ''}
                                                ${order.status === 'pending' ? 'bg-amber-100 text-amber-700' : ''}
                                                ${order.status === 'failed' ? 'bg-red-100 text-red-700' : ''}
                                            `}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-xs text-slate-500">
                                            {order.createdAt?.seconds ? new Date(order.createdAt.seconds * 1000).toLocaleString() : ''}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : activeTab === 'pricing' ? (
                <PricingManager config={pricingConfig} onUpdate={loadData} />
            ) : (
                <div className="space-y-8 animate-fade-in">

                    {/* Storage & Retention Rules */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                            🗄️ Storage & Retention Policy
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl">
                                <span className="inline-block px-2 py-1 bg-amber-200 text-amber-800 text-xs font-bold rounded mb-2">TRIAL USERS</span>
                                <h3 className="font-bold text-lg text-slate-800 mb-1">No Storage (Temporary)</h3>
                                <p className="text-sm text-slate-600">
                                    Trial users <strong>cannot save their work</strong>. All generated content is lost upon refreshing or leaving the page. They must download their work immediately.
                                </p>
                            </div>
                            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
                                <span className="inline-block px-2 py-1 bg-emerald-200 text-emerald-800 text-xs font-bold rounded mb-2">PAID SUBSCRIBERS</span>
                                <h3 className="font-bold text-lg text-slate-800 mb-1">30-Day Retention</h3>
                                <p className="text-sm text-slate-600">
                                    All paid users (Basic, Pro, Elite) have their generation history saved for <strong>30 days</strong>. They can reload, edit, and download past projects anytime within this window.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Gen Limits */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                            ⚡ Daily Generation Limits
                        </h2>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-100 text-slate-500 text-xs uppercase">
                                        <th className="py-3 px-4">Plan Level</th>
                                        <th className="py-3 px-4">Daily Limit</th>
                                        <th className="py-3 px-4">Cooldown</th>
                                        <th className="py-3 px-4">Reset Time</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    <tr className="hover:bg-slate-50">
                                        <td className="py-3 px-4 font-bold text-amber-600">Trial</td>
                                        <td className="py-3 px-4">{LIMITS.trial.maxDaily} generations</td>
                                        <td className="py-3 px-4">{LIMITS.trial.cooldownMin > 0 ? `${LIMITS.trial.cooldownMin} mins` : 'None'}</td>
                                        <td className="py-3 px-4 text-slate-400 text-sm">Midnight UTC</td>
                                    </tr>
                                    <tr className="hover:bg-slate-50">
                                        <td className="py-3 px-4 font-bold text-slate-700">Basic</td>
                                        <td className="py-3 px-4">{LIMITS.basic.maxDaily} generations</td>
                                        <td className="py-3 px-4">{LIMITS.basic.cooldownMin > 0 ? `${LIMITS.basic.cooldownMin} mins` : 'None'}</td>
                                        <td className="py-3 px-4 text-slate-400 text-sm">Midnight UTC</td>
                                    </tr>
                                    <tr className="hover:bg-slate-50">
                                        <td className="py-3 px-4 font-bold text-indigo-600">Pro</td>
                                        <td className="py-3 px-4">{LIMITS.pro.maxDaily} generations</td>
                                        <td className="py-3 px-4">{LIMITS.pro.cooldownMin > 0 ? `${LIMITS.pro.cooldownMin} mins` : 'None'}</td>
                                        <td className="py-3 px-4 text-slate-400 text-sm">Midnight UTC</td>
                                    </tr>
                                    <tr className="hover:bg-slate-50">
                                        <td className="py-3 px-4 font-bold text-emerald-600">Elite / Admin</td>
                                        <td className="py-3 px-4">{LIMITS.elite.maxDaily} generations</td>
                                        <td className="py-3 px-4">Unlimited</td>
                                        <td className="py-3 px-4 text-slate-400 text-sm">Midnight UTC</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Points System Explanation */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                            💰 Points System Logic
                        </h2>
                        <div className="space-y-4 text-slate-700">
                            <p>
                                The points system is designed to govern <strong>"Heavy"</strong> AI operations.
                                Points are deducted per successful generation request. If a request fails, points are usually not deducted or are refunded.
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                                    <h4 className="font-bold text-indigo-700 mb-2">Social Media Post</h4>
                                    <p className="text-2xl font-black text-slate-900">30 <span className="text-sm font-normal text-slate-500">pts / slide</span></p>
                                    <ul className="text-xs text-slate-500 mt-2 list-disc list-inside">
                                        <li>High-res Image Generation</li>
                                        <li>Content Planning & Strategy</li>
                                        <li>Smart Editing Available</li>
                                    </ul>
                                </div>

                                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                                    <h4 className="font-bold text-indigo-700 mb-2">Ad Creative</h4>
                                    <p className="text-2xl font-black text-slate-900">20 <span className="text-sm font-normal text-slate-500">pts / variant</span></p>
                                    <ul className="text-xs text-slate-500 mt-2 list-disc list-inside">
                                        <li>Commercial License</li>
                                        <li>Product Integration</li>
                                        <li>Text Overlay & Layout</li>
                                    </ul>
                                </div>

                                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                                    <h4 className="font-bold text-indigo-700 mb-2">Landing Page</h4>
                                    <p className="text-2xl font-black text-slate-900">50 <span className="text-sm font-normal text-slate-500">pts / section</span></p>
                                    <ul className="text-xs text-slate-500 mt-2 list-disc list-inside">
                                        <li>Full Copywriting</li>
                                        <li>Layout Code (HTML/Tailwind)</li>
                                        <li>Image Assets Selection</li>
                                    </ul>
                                </div>
                            </div>

                            <div className="mt-4 p-4 bg-blue-50 text-blue-800 rounded-xl text-sm border border-blue-100">
                                <span className="font-bold">Note:</span> Trial users start with 0 points and rely on the free daily counts. Paid users perform actions using points relative to their monthly allowance.
                            </div>
                        </div>
                    </div>
                </div>
            )
            }

            {/* Modal for Balance/Plan Adjustment */}
            {
                selectedUser && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl animate-fade-in">
                            <h3 className="text-xl font-bold mb-2">
                                Manage: <span className="text-indigo-600">{selectedUser.displayName || selectedUser.email}</span>
                            </h3>
                            <div className="flex gap-2 mb-6">
                                <span className="text-sm text-slate-500">Current Balance: <strong>{selectedUser.balance}</strong></span>
                                <span className="mx-2 text-slate-300">|</span>
                                {getAccountBadge(selectedUser)}
                            </div>

                            {/* Type Selection */}
                            <div className="flex gap-2 mb-6">
                                <button
                                    type="button"
                                    onClick={() => setAdjustmentType('trial')}
                                    className={`flex-1 py-3 rounded-xl font-bold border-2 transition-all ${adjustmentType === 'trial'
                                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                                        : 'border-slate-200 text-slate-500 hover:border-slate-300'
                                        }`}
                                >
                                    🆓 Trial Points
                                    <p className="text-xs font-normal mt-1">Add/remove points for testing</p>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setAdjustmentType('paid')}
                                    className={`flex-1 py-3 rounded-xl font-bold border-2 transition-all ${adjustmentType === 'paid'
                                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                                        : 'border-slate-200 text-slate-500 hover:border-slate-300'
                                        }`}
                                >
                                    💎 Paid Plan
                                    <p className="text-xs font-normal mt-1">Upgrade to paid subscription</p>
                                </button>
                            </div>

                            <form onSubmit={handleBalanceAdjustment}>
                                {adjustmentType === 'trial' ? (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-1">Amount to Add/Remove</label>
                                            <input
                                                type="number"
                                                value={amountToAdjust}
                                                onChange={e => setAmountToAdjust(e.target.value)}
                                                placeholder="e.g. 100 or -50"
                                                className="w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                                                autoFocus
                                                required
                                            />
                                            <p className="text-xs text-slate-400 mt-1">Use negative values to deduct points. This does NOT change account type.</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-1">Reason</label>
                                            <input
                                                type="text"
                                                value={adjustReason}
                                                onChange={e => setAdjustReason(e.target.value)}
                                                placeholder="e.g. Testing bonus"
                                                className="w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                                                required
                                            />
                                        </div>

                                        {/* Warning for Trial accounts */}
                                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
                                            ⚠️ <strong>Trial Account Note:</strong> Trial users cannot save work history. They must download their work immediately.
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Select Plan</label>
                                            <div className="grid grid-cols-3 gap-3">
                                                {(['basic', 'pro', 'elite'] as const).map(plan => (
                                                    <button
                                                        key={plan}
                                                        type="button"
                                                        onClick={() => setSelectedPlan(plan)}
                                                        className={`p-4 rounded-xl border-2 text-center transition-all ${selectedPlan === plan
                                                            ? 'border-emerald-500 bg-emerald-50'
                                                            : 'border-slate-200 hover:border-slate-300'
                                                            }`}
                                                    >
                                                        <div className="text-lg font-bold text-slate-900">{PLAN_CONFIGS[plan].name}</div>
                                                        <div className="text-2xl font-black text-emerald-600 my-1">{PLAN_CONFIGS[plan].points}</div>
                                                        <div className="text-xs text-slate-500">
                                                            {PLAN_CONFIGS[plan].price > 0 ? `$${PLAN_CONFIGS[plan].price}` : 'Custom'}
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-1">Note (Optional)</label>
                                            <input
                                                type="text"
                                                value={adjustReason}
                                                onChange={e => setAdjustReason(e.target.value)}
                                                placeholder="e.g. Annual subscription"
                                                className="w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                                            />
                                        </div>

                                        {/* Info for Paid accounts */}
                                        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-sm text-emerald-800">
                                            ✅ <strong>Paid Account Benefits:</strong> Work history is saved for 30 days. Can download anytime.
                                        </div>
                                    </div>
                                )}

                                <div className="flex gap-3 mt-8">
                                    <Button type="button" variant="secondary" onClick={closeModal} className="flex-1">Cancel</Button>
                                    <Button
                                        type="submit"
                                        variant="primary"
                                        className={`flex-1 ${adjustmentType === 'paid' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
                                    >
                                        {adjustmentType === 'trial' ? 'Confirm Adjustment' : `Upgrade to ${PLAN_CONFIGS[selectedPlan].name}`}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
        </div>
    );
};
