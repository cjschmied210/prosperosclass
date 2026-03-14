'use client';

import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { createBehavior, updateBehavior } from '@/lib/firestore';
import { Behavior, BehaviorType } from '@/types';

interface BehaviorFormProps {
    teacherId: string;
    onSuccess: () => void;
    onCancel: () => void;
    initialData?: Behavior;
}

export default function BehaviorForm({ teacherId, onSuccess, onCancel, initialData }: BehaviorFormProps) {
    const [formData, setFormData] = useState({
        name: initialData?.name || '',
        type: (initialData?.type || 'positive') as BehaviorType,
        description: initialData?.description || '',
        color: initialData?.color || '#10b981',
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            if (initialData) {
                // Update existing behavior
                await updateBehavior(initialData.behaviorId, formData);
            } else {
                // Create new behavior
                const behavior: Behavior = {
                    behaviorId: uuidv4(),
                    teacherId,
                    name: formData.name,
                    type: formData.type,
                    description: formData.description,
                    color: formData.color,
                    createdAt: new Date(),
                };
                await createBehavior(behavior);
            }
            onSuccess();
        } catch (err: any) {
            setError(err.message || 'Failed to save behavior');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
                <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-center shadow-sm">
                    <svg className="w-5 h-5 mr-3 text-rose-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <p className="text-sm font-medium text-rose-700">{error}</p>
                </div>
            )}

            <div>
                <label htmlFor="name" className="label">
                    Behavior Name *
                </label>
                <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="input"
                    placeholder="e.g., Active Listening, Disruption"
                    required
                />
            </div>

            <div>
                <label htmlFor="type" className="label">
                    Type *
                </label>
                <select
                    id="type"
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    className="input"
                    required
                >
                    <option value="positive">Positive</option>
                    <option value="negative">Negative</option>
                </select>
                <p className="text-xs text-slate-500 font-medium mt-1.5 ml-1">
                    Positive behaviors are encouraged; negative behaviors need correction
                </p>
            </div>

            <div>
                <label htmlFor="description" className="label">
                    Description (Optional)
                </label>
                <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary focus:bg-white bg-slate-50 transition-colors shadow-inner resize-none"
                    rows={3}
                    placeholder="Additional details about this behavior..."
                />
            </div>

            <div className="flex space-x-4 pt-6 mt-2 border-t border-slate-100">
                <button
                    type="button"
                    onClick={onCancel}
                    className="btn btn-outline flex-1"
                    disabled={isLoading}
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    className="btn btn-primary flex-1 shadow-md hover:shadow-lg transition-all"
                    disabled={isLoading}
                >
                    {isLoading ? 'Saving...' : initialData ? 'Update Behavior' : 'Create Behavior'}
                </button>
            </div>
        </form>
    );
}
