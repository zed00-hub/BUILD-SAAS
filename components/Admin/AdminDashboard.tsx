import React, { useEffect, useState } from 'react';
import { AdminService, PLAN_CONFIGS } from '../../src/services/adminService';
import { LIMITS } from '../../src/services/walletService';
import { PricingService, PricingConfig, PricingPlan, DEFAULT_PRICING_CONFIG } from '../../src/services/pricingService';
import { UserData, Order } from '../../src/types/dbTypes';
import { Button } from '../Button';
import { CoinIcon } from '../CoinIcon';
import { PricingManager } from './PricingManager';
import { ToolManager } from './ToolManager';

import { useLanguage } from '../../contexts/LanguageContext';

type AdjustmentType = 'trial' | 'paid';

export const AdminDashboard: React.FC = () => {
    const { t } = useLanguage();
    const [users, setUsers] = useState<UserData[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [activeTab, setActiveTab] = useState<'users' | 'orders' | 'limits' | 'pricing' | 'tools'>('users');
    const [isLoading, setIsLoading] = useState(true);

    // Action States
    const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
    const [adjustmentType, setAdjustmentType] = useState<AdjustmentType>('trial');
    const [amountToAdjust, setAmountToAdjust] = useState<string>('');
    const [adjustReason, setAdjustReason] = useState<string>('');
    const [selectedPlan, setSelectedPlan] = useState<'basic' | 'pro' | 'elite' | 'e-commerce'>('basic');

    // Pricing Management States
    const [pricingConfig, setPricingConfig] = useState<PricingConfig>(DEFAULT_PRICING_CONFIG);

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
                🆓 {t('trial_plan')}
            </span>
        );
    };

    if (isLoading) {
        return <div className="p-8 text-center">{t('processing')}...</div>;
    }

    return (
        <div className="max-w-7xl mx-auto p-6 md:p-10 animate-fade-in">
            <h1 className="text-3xl font-bold text-slate-900 mb-8 flex items-center gap-3">
                <span className="bg-indigo-600 text-white p-2 rounded-lg text-xl">🛡️</span>
                {t('admin_dashboard')}
            </h1>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <p className="text-slate-500 text-sm font-bold uppercase">{t('total_users')}</p>
                    <p className="text-4xl font-bold text-indigo-600 mt-2">{users.length}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <p className="text-slate-500 text-sm font-bold uppercase">{t('paid_users')}</p>
                    <p className="text-4xl font-bold text-emerald-600 mt-2">
                        {users.filter(u => u.accountType === 'paid').length}
                    </p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <p className="text-slate-500 text-sm font-bold uppercase">{t('trial_users')}</p>
                    <p className="text-4xl font-bold text-amber-500 mt-2">
                        {users.filter(u => u.accountType !== 'paid').length}
                    </p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <p className="text-slate-500 text-sm font-bold uppercase">{t('total_orders')}</p>
                    <p className="text-4xl font-bold text-purple-600 mt-2">{orders.length}</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-slate-200 mb-6 overflow-x-auto">
                <button
                    onClick={() => setActiveTab('pricing')}
                    className={`pb-4 px-2 font-semibold whitespace-nowrap ${activeTab === 'pricing' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-800'}`}
                >
                    💎 {t('manage_pricing')}
                </button>
                <button
                    onClick={() => setActiveTab('tools')}
                    className={`pb-4 px-2 font-semibold whitespace-nowrap ${activeTab === 'tools' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-800'}`}
                >
                    🔨 {t('manage_tools', 'Manage Tools')}
                </button>
                <button
                    onClick={() => setActiveTab('users')}
                    className={`pb-4 px-2 font-semibold whitespace-nowrap ${activeTab === 'users' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-800'}`}
                >
                    {t('user_management')}
                </button>
                <button
                    onClick={() => setActiveTab('orders')}
                    className={`pb-4 px-2 font-semibold whitespace-nowrap ${activeTab === 'orders' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-800'}`}
                >
                    {t('order_history')}
                </button>
                <button
                    onClick={() => setActiveTab('limits')}
                    className={`pb-4 px-2 font-semibold whitespace-nowrap ${activeTab === 'limits' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-800'}`}
                >
                    {t('system_limits')}
                </button>
            </div>

            {/* Content */}
            {activeTab === 'users' ? (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold">
                                <tr>
                                    <th className="p-4">{t('user_col')}</th>
                                    <th className="p-4">{t('balance_col')}</th>
                                    <th className="p-4">{t('account_type_col')}</th>
                                    <th className="p-4">{t('role_col')}</th>
                                    <th className="p-4">{t('status_col')}</th>
                                    <th className="p-4">{t('actions_col')}</th>
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
                                                    💰 {t('manage_points_btn')}
                                                </button>
                                                {user.accountType === 'paid' && (
                                                    <button
                                                        onClick={() => handleDowngrade(user)}
                                                        className="px-3 py-1.5 bg-amber-50 text-amber-600 text-xs font-bold rounded-lg hover:bg-amber-100"
                                                    >
                                                        ⬇️ {t('downgrade_btn')}
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => toggleUserStatus(user)}
                                                    className={`px-3 py-1.5 text-xs font-bold rounded-lg border ${user.isDisabled ? 'border-emerald-200 text-emerald-600 hover:bg-emerald-50' : 'border-red-200 text-red-600 hover:bg-red-50'}`}
                                                >
                                                    {user.isDisabled ? t('unban_btn') : t('ban_btn')}
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
                                    <th className="p-4">{t('order_id')}</th>
                                    <th className="p-4">{t('user_col')}</th>
                                    <th className="p-4">{t('tool_col')}</th>
                                    <th className="p-4">{t('cost_col')}</th>
                                    <th className="p-4">{t('status_col')}</th>
                                    <th className="p-4">{t('time_col')}</th>
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
                            🗄️ {t('storage_policy_title')}
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl">
                                <span className="inline-block px-2 py-1 bg-amber-200 text-amber-800 text-xs font-bold rounded mb-2 uppercase">{t('trial_plan')}</span>
                                <h3 className="font-bold text-lg text-slate-800 mb-1">50MB Limit</h3>
                                <p className="text-sm text-slate-600">
                                    {t('storage_trial_desc')}
                                </p>
                            </div>
                            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                                <span className="inline-block px-2 py-1 bg-slate-200 text-slate-800 text-xs font-bold rounded mb-2 uppercase">{t('basic_plan')}</span>
                                <h3 className="font-bold text-lg text-slate-800 mb-1">1GB Storage</h3>
                                <p className="text-sm text-slate-600">
                                    {t('storage_basic_desc')}
                                </p>
                            </div>
                            <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
                                <span className="inline-block px-2 py-1 bg-indigo-200 text-indigo-800 text-xs font-bold rounded mb-2 uppercase">{t('pro_plan')}</span>
                                <h3 className="font-bold text-lg text-slate-800 mb-1">10GB Storage</h3>
                                <p className="text-sm text-slate-600">
                                    {t('storage_pro_desc')}
                                </p>
                            </div>
                            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
                                <span className="inline-block px-2 py-1 bg-emerald-200 text-emerald-800 text-xs font-bold rounded mb-2 uppercase">{t('elite_plan')}</span>
                                <h3 className="font-bold text-lg text-slate-800 mb-1">50GB Storage</h3>
                                <p className="text-sm text-slate-600">
                                    {t('storage_elite_desc')}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Gen Limits */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                            ⚡ {t('daily_gen_limits')}
                        </h2>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-100 text-slate-500 text-xs uppercase">
                                        <th className="py-3 px-4">{t('account_type_col')}</th>
                                        <th className="py-3 px-4">{t('daily_limit_col')}</th>
                                        <th className="py-3 px-4">{t('cooldown_col')}</th>
                                        <th className="py-3 px-4">{t('reset_time_col')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    <tr className="hover:bg-slate-50">
                                        <td className="py-3 px-4 font-bold text-amber-600">{t('trial_plan')}</td>
                                        <td className="py-3 px-4">{LIMITS.trial.maxDaily}</td>
                                        <td className="py-3 px-4">{LIMITS.trial.cooldownMin > 0 ? `${LIMITS.trial.cooldownMin} mins` : t('none')}</td>
                                        <td className="py-3 px-4 text-slate-400 text-sm">{t('midnight_utc')}</td>
                                    </tr>
                                    <tr className="hover:bg-slate-50">
                                        <td className="py-3 px-4 font-bold text-slate-700">{t('basic_plan')}</td>
                                        <td className="py-3 px-4">{LIMITS.basic.maxDaily}</td>
                                        <td className="py-3 px-4">{LIMITS.basic.cooldownMin > 0 ? `${LIMITS.basic.cooldownMin} mins` : t('none')}</td>
                                        <td className="py-3 px-4 text-slate-400 text-sm">{t('midnight_utc')}</td>
                                    </tr>
                                    <tr className="hover:bg-slate-50">
                                        <td className="py-3 px-4 font-bold text-indigo-600">{t('pro_plan')}</td>
                                        <td className="py-3 px-4">{LIMITS.pro.maxDaily}</td>
                                        <td className="py-3 px-4">{LIMITS.pro.cooldownMin > 0 ? `${LIMITS.pro.cooldownMin} mins` : t('none')}</td>
                                        <td className="py-3 px-4 text-slate-400 text-sm">{t('midnight_utc')}</td>
                                    </tr>
                                    <tr className="hover:bg-slate-50">
                                        <td className="py-3 px-4 font-bold text-emerald-600">{t('elite_plan')}</td>
                                        <td className="py-3 px-4">{t('unlimited')}</td>
                                        <td className="py-3 px-4">{t('none')}</td>
                                        <td className="py-3 px-4 text-slate-400 text-sm">{t('midnight_utc')}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Points System Explanation */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                            💰 {t('points_system_logic')}
                        </h2>
                        <div className="space-y-4 text-slate-700">
                            <p dangerouslySetInnerHTML={{ __html: t('points_desc') }}></p>

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-indigo-300 transition-colors">
                                    <h4 className="font-bold text-indigo-700 mb-2">{t('tool_social')}</h4>
                                    <p className="text-2xl font-black text-slate-900">30 <span className="text-sm font-normal text-slate-500">{t('pts_per_slide')}</span></p>
                                </div>

                                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-indigo-300 transition-colors">
                                    <h4 className="font-bold text-indigo-700 mb-2">{t('tool_ad')}</h4>
                                    <p className="text-2xl font-black text-slate-900">20 <span className="text-sm font-normal text-slate-500">{t('pts_per_variant')}</span></p>
                                </div>

                                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-indigo-300 transition-colors">
                                    <h4 className="font-bold text-indigo-700 mb-2">{t('tool_landing')}</h4>
                                    <p className="text-2xl font-black text-slate-900">50 <span className="text-sm font-normal text-slate-500">{t('pts_per_section')}</span></p>
                                </div>

                                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-indigo-300 transition-colors">
                                    <h4 className="font-bold text-indigo-700 mb-2">{t('tool_quick_edit')}</h4>
                                    <p className="text-2xl font-black text-slate-900">10 <span className="text-sm font-normal text-slate-500">{t('pts_per_edit')}</span></p>
                                </div>
                            </div>

                            <div className="mt-4 p-4 bg-blue-50 text-blue-800 rounded-xl text-sm border border-blue-100 flex items-start gap-2">
                                <span className="text-lg">ℹ️</span>
                                <div>
                                    <span className="font-bold">{t('fair_usage_title')}:</span> {t('fair_usage_desc')}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )
            }

            {activeTab === 'tools' && (
                <ToolManager />
            )}

            {/* Modal for Balance/Plan Adjustment */}
            {
                selectedUser && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl animate-fade-in">
                            <h3 className="text-xl font-bold mb-2">
                                {t('manage_user_title')}: <span className="text-indigo-600">{selectedUser.displayName || selectedUser.email}</span>
                            </h3>
                            <div className="flex gap-2 mb-6">
                                <span className="text-sm text-slate-500">{t('current_balance')}: <strong>{selectedUser.balance}</strong></span>
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
                                    🆓 {t('trial_plan')}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setAdjustmentType('paid')}
                                    className={`flex-1 py-3 rounded-xl font-bold border-2 transition-all ${adjustmentType === 'paid'
                                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                                        : 'border-slate-200 text-slate-500 hover:border-slate-300'
                                        }`}
                                >
                                    💎 {t('upgrade_plan')}
                                </button>
                            </div>

                            <form onSubmit={handleBalanceAdjustment}>
                                {adjustmentType === 'trial' ? (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-1">{t('amount_adjust')}</label>
                                            <input
                                                type="number"
                                                value={amountToAdjust}
                                                onChange={e => setAmountToAdjust(e.target.value)}
                                                placeholder="e.g. 100 or -50"
                                                className="w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                                                autoFocus
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-1">{t('reason')}</label>
                                            <input
                                                type="text"
                                                value={adjustReason}
                                                onChange={e => setAdjustReason(e.target.value)}
                                                placeholder="e.g. Testing bonus"
                                                className="w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                                                required
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">{t('upgrade_plan')}</label>
                                            <div className="grid grid-cols-2 gap-3">
                                                {(['basic', 'e-commerce', 'pro', 'elite'] as const).map(plan => (
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
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-1">{t('reason')}</label>
                                            <input
                                                type="text"
                                                value={adjustReason}
                                                onChange={e => setAdjustReason(e.target.value)}
                                                placeholder="..."
                                                className="w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="flex gap-3 mt-8">
                                    <Button type="button" variant="secondary" onClick={closeModal} className="flex-1">{t('cancel')}</Button>
                                    <Button
                                        type="submit"
                                        variant="primary"
                                        className={`flex-1 ${adjustmentType === 'paid' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
                                    >
                                        {t('confirm_adjustment')}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
        </div>
    );
};
