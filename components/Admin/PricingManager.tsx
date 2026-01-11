import React, { useState } from 'react';
import { PricingConfig, PricingPlan, PricingService } from '../../src/services/pricingService';
import { Button } from '../Button';
import { CoinIcon } from '../CoinIcon';

interface PricingManagerProps {
    config: PricingConfig;
    onUpdate: () => void;
}

export const PricingManager: React.FC<PricingManagerProps> = ({ config, onUpdate }) => {
    const [editingPlan, setEditingPlan] = useState<PricingPlan | null>(null);
    const [isAddingMode, setIsAddingMode] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Form State
    const [formData, setFormData] = useState<Partial<PricingPlan>>({});
    const [featuresText, setFeaturesText] = useState(''); // Textarea for features (count|label per line)

    const handleEdit = (plan: PricingPlan) => {
        setEditingPlan(plan);
        setFormData(plan);
        // Convert features to string format for textarea
        setFeaturesText(plan.features.map(f => `${f.count}|${f.label}`).join('\n'));
        setIsAddingMode(false);
    };

    const handleAdd = () => {
        const newPlanSkeleton: Partial<PricingPlan> = {
            name: 'NEW PLAN',
            basePoints: 1000,
            prices: { DZD: 2000, USD: 10 },
            description: 'New plan description',
            features: [{ count: '10', label: 'Feature 1' }],
            isPopular: false,
            gradient: 'from-slate-500 to-slate-700',
            buttonVariant: 'primary',
            isActive: true,
            order: config.plans.length + 1,
            isCustomPricing: false
        };
        setEditingPlan(newPlanSkeleton as PricingPlan); // Cast for initial state
        setFormData(newPlanSkeleton);
        setFeaturesText('10|Feature 1\n20|Feature 2');
        setIsAddingMode(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name) return;

        setIsSaving(true);
        try {
            // Parse features
            const features = featuresText.split('\n').filter(line => line.trim()).map(line => {
                const [count, ...labelParts] = line.split('|');
                return {
                    count: count.trim(),
                    label: labelParts.join('|').trim()
                };
            });

            const planData: PricingPlan = {
                ...formData as PricingPlan,
                features,
                id: editingPlan?.id || `plan_${Date.now()}` // Generate ID if new
            };

            if (isAddingMode) {
                await PricingService.addPlan(config, planData);
            } else {
                await PricingService.updatePlan(config, planData.id, planData);
            }

            setEditingPlan(null);
            onUpdate(); // Refresh parent data
        } catch (err) {
            console.error(err);
            alert('Failed to save plan');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (planId: string) => {
        if (confirm('Are you sure you want to delete this plan?')) {
            setIsSaving(true);
            try {
                await PricingService.deletePlan(config, planId);
                onUpdate();
            } catch (err) {
                alert('Failed to delete');
            } finally {
                setIsSaving(false);
            }
        }
    };

    const handleChange = (field: keyof PricingPlan, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handlePriceChange = (currency: 'DZD' | 'USD', value: string) => {
        const numValue = parseFloat(value);
        setFormData(prev => ({
            ...prev,
            prices: {
                ...prev.prices!,
                [currency]: isNaN(numValue) ? null : numValue
            }
        }));
    };

    if (editingPlan) {
        return (
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 animate-fade-in">
                <h3 className="text-xl font-bold mb-6">{isAddingMode ? 'Add New Plan' : `Edit ${editingPlan.name}`}</h3>
                <form onSubmit={handleSave} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Plan Name</label>
                            <input
                                className="w-full p-2 border rounded-lg"
                                value={formData.name || ''}
                                onChange={e => handleChange('name', e.target.value)}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Points (or 'Custom')</label>
                            <input
                                className="w-full p-2 border rounded-lg"
                                value={formData.basePoints || ''}
                                onChange={e => handleChange('basePoints', e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Price DZD (null for Contact)</label>
                            <input
                                type="number"
                                className="w-full p-2 border rounded-lg"
                                value={formData.prices?.DZD ?? ''}
                                onChange={e => handlePriceChange('DZD', e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Price USD</label>
                            <input
                                type="number"
                                className="w-full p-2 border rounded-lg"
                                value={formData.prices?.USD ?? ''}
                                onChange={e => handlePriceChange('USD', e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Description</label>
                        <input
                            className="w-full p-2 border rounded-lg"
                            value={formData.description || ''}
                            onChange={e => handleChange('description', e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Features (Format: Count|Label per line)</label>
                        <textarea
                            className="w-full p-2 border rounded-lg font-mono text-sm"
                            rows={6}
                            value={featuresText}
                            onChange={e => setFeaturesText(e.target.value)}
                            placeholder="10|Social Media Posts&#10;Unlimited|Support"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Gradient Class</label>
                            <input
                                className="w-full p-2 border rounded-lg text-xs"
                                value={formData.gradient || ''}
                                onChange={e => handleChange('gradient', e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-2 pt-6">
                            <input
                                type="checkbox"
                                checked={formData.isPopular || false}
                                onChange={e => handleChange('isPopular', e.target.checked)}
                                className="w-5 h-5 rounded"
                            />
                            <label className="text-sm font-bold">Mark as Most Popular</label>
                        </div>
                        <div className="flex items-center gap-2 pt-6">
                            <input
                                type="checkbox"
                                checked={formData.isActive ?? true}
                                onChange={e => handleChange('isActive', e.target.checked)}
                                className="w-5 h-5 rounded"
                            />
                            <label className="text-sm font-bold">Plan Active</label>
                        </div>
                    </div>

                    <div className="flex gap-4 pt-4 border-t border-slate-200">
                        <Button type="button" variant="secondary" onClick={() => setEditingPlan(null)}>Cancel</Button>
                        <Button type="submit" variant="primary" isLoading={isSaving}>{isAddingMode ? 'Create Plan' : 'Save Changes'}</Button>
                    </div>
                </form>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-slate-800">Pricing Plans Customization</h2>
                <Button onClick={handleAdd} variant="primary">
                    + Add New Plan
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {config.plans.map((plan) => (
                    <div
                        key={plan.id}
                        className={`relative rounded-3xl p-6 border transition-all flex flex-col bg-white border-slate-200 ${!plan.isActive ? 'opacity-60 grayscale' : ''}`}
                    >
                        <div className={`absolute top-0 left-0 right-0 h-2 rounded-t-3xl bg-gradient-to-r ${plan.gradient}`}></div>

                        <div className="mt-4 flex justify-between items-start">
                            <div>
                                <h3 className="text-lg font-bold text-slate-700">{plan.name}</h3>
                                <div className="flex items-center gap-1 font-bold text-2xl text-slate-900 mt-1">
                                    {plan.basePoints} <span className="text-xs font-normal text-slate-400">pts</span>
                                </div>
                            </div>
                            {plan.isPopular && <span className="text-[10px] bg-indigo-100 text-indigo-700 font-bold px-2 py-1 rounded-full uppercase">Popular</span>}
                        </div>

                        <div className="mt-4 space-y-2 border-t border-slate-100 pt-4 flex-1">
                            {plan.features.slice(0, 3).map((f, i) => (
                                <div key={i} className="text-xs text-slate-600 flex justify-between">
                                    <span>{f.label}</span>
                                    <span className="font-bold">{f.count}</span>
                                </div>
                            ))}
                            {plan.features.length > 3 && <div className="text-xs text-slate-400 italic">+{plan.features.length - 3} more...</div>}
                        </div>

                        <div className="mt-6 pt-4 border-t border-slate-100 grid grid-cols-2 gap-2">
                            <button
                                onClick={() => handleEdit(plan)}
                                className="p-2 text-xs font-bold text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100"
                            >
                                Edit
                            </button>
                            <button
                                onClick={() => handleDelete(plan.id)}
                                className="p-2 text-xs font-bold text-red-600 bg-red-50 rounded-lg hover:bg-red-100"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-slate-50 p-4 rounded-xl text-xs text-slate-500 border border-slate-200 mt-8">
                <strong>Tip:</strong> You can use standard Tailwind gradients like 'from-blue-500 to-indigo-600' for the card styling.
                The price 'null' indicates a "Contact Sales" or custom pricing plan.
            </div>
        </div>
    );
};
