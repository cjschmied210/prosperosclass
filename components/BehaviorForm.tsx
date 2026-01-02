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
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{error}</p>
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
                <p className="text-xs text-gray-500 mt-1">
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    rows={3}
                    placeholder="Additional details about this behavior..."
                />
            </div>

            <div className="flex space-x-4 pt-4">
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
                    className="btn btn-primary flex-1"
                    disabled={isLoading}
                >
                    {isLoading ? 'Saving...' : initialData ? 'Update Behavior' : 'Create Behavior'}
                </button>
            </div>
        </form>
    );
}
