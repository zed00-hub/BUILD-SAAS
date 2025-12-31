import React, { useEffect, useState } from 'react';
import { AdminService } from '../../src/services/adminService';
import { UserData, Order } from '../../src/types/dbTypes';
import { Button } from '../Button';
import { CoinIcon } from '../CoinIcon';

export const AdminDashboard: React.FC = () => {
    const [users, setUsers] = useState<UserData[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [activeTab, setActiveTab] = useState<'users' | 'orders'>('users');
    const [isLoading, setIsLoading] = useState(true);

    // Action States
    const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
    const [amountToAdjust, setAmountToAdjust] = useState<string>('');
    const [adjustReason, setAdjustReason] = useState<string>('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [usersData, ordersData] = await Promise.all([
                AdminService.getAllUsers(),
                AdminService.getAllOrders()
            ]);
            setUsers(usersData);
            setOrders(ordersData);
        } catch (e) {
            console.error("Failed to load admin data", e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleBalanceAdjustment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser || !amountToAdjust) return;

        const amount = parseInt(amountToAdjust);
        if (isNaN(amount)) return;

        const success = await AdminService.adjustUserBalance(
            selectedUser.uid,
            amount,
            adjustReason || 'Admin Manual Adjustment'
        );

        if (success) {
            alert("Balance updated successfully");
            setSelectedUser(null);
            setAmountToAdjust('');
            setAdjustReason('');
            loadData(); // Reload to see changes
        } else {
            alert("Failed to update balance");
        }
    };

    const toggleUserStatus = async (user: UserData) => {
        if (confirm(`Are you sure you want to ${user.isDisabled ? 'enable' : 'disable'} this user?`)) {
            await AdminService.toggleUserStatus(user.uid, user.isDisabled);
            loadData();
        }
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <p className="text-slate-500 text-sm font-bold uppercase">Total Users</p>
                    <p className="text-4xl font-bold text-indigo-600 mt-2">{users.length}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <p className="text-slate-500 text-sm font-bold uppercase">Total Orders</p>
                    <p className="text-4xl font-bold text-emerald-600 mt-2">{orders.length}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <p className="text-slate-500 text-sm font-bold uppercase">Pending Orders</p>
                    <p className="text-4xl font-bold text-amber-500 mt-2">
                        {orders.filter(o => o.status === 'pending').length}
                    </p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-slate-200 mb-6">
                <button
                    onClick={() => setActiveTab('users')}
                    className={`pb-4 px-2 font-semibold ${activeTab === 'users' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-800'}`}
                >
                    User Management
                </button>
                <button
                    onClick={() => setActiveTab('orders')}
                    className={`pb-4 px-2 font-semibold ${activeTab === 'orders' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-800'}`}
                >
                    Order History
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
                                    <th className="p-4">Role</th>
                                    <th className="p-4">Joined</th>
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
                                            <div className="text-[10px] text-slate-400 font-mono mt-1">{user.uid}</div>
                                        </td>
                                        <td className="p-4 font-bold text-indigo-700">
                                            {user.balance} <CoinIcon className="w-4 h-4 inline" />
                                        </td>
                                        <td className="p-4">
                                            {user.isAdmin ? (
                                                <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs font-bold">Admin</span>
                                            ) : (
                                                <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs">User</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-sm text-slate-500">
                                            {user.createdAt?.seconds ? new Date(user.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${user.isDisabled ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                                {user.isDisabled ? 'Disabled' : 'Active'}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setSelectedUser(user)}
                                                    className="px-3 py-1.5 bg-indigo-50 text-indigo-600 text-xs font-bold rounded-lg hover:bg-indigo-100"
                                                >
                                                    Add/Remove Points
                                                </button>
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
            ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold">
                                <tr>
                                    <th className="p-4">Order ID</th>
                                    <th className="p-4">User</th>
                                    <th className="p-4">Tool</th>
                                    <th className="p-4">Description</th>
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
                                        <td className="p-4 text-sm text-slate-600 max-w-xs truncate">
                                            {order.inputData?.description || 'No Description'}
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
            )}

            {/* Modal for Balance Adjustment */}
            {selectedUser && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl animate-fade-in">
                        <h3 className="text-xl font-bold mb-4">Adjust Balance: <span className="text-indigo-600">{selectedUser.displayName}</span></h3>
                        <p className="text-sm text-slate-500 mb-6">Current Balance: {selectedUser.balance}</p>

                        <form onSubmit={handleBalanceAdjustment}>
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
                                    <p className="text-xs text-slate-400 mt-1">Use negative values to deduct points.</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Reason</label>
                                    <input
                                        type="text"
                                        value={adjustReason}
                                        onChange={e => setAdjustReason(e.target.value)}
                                        placeholder="e.g. Compensation for failed generation"
                                        className="w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3 mt-8">
                                <Button type="button" variant="secondary" onClick={() => setSelectedUser(null)} className="flex-1">Cancel</Button>
                                <Button type="submit" variant="primary" className="flex-1">Confirm Adjustment</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
