'use client';

import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { createClass } from '@/lib/firestore';
import { Class } from '@/types';

interface ClassFormProps {
    teacherId: string;
    onSuccess: () => void;
    onCancel: () => void;
    initialData?: Class;
}

export default function ClassForm({ teacherId, onSuccess, onCancel, initialData }: ClassFormProps) {
    const [formData, setFormData] = useState({
        className: initialData?.className || '',
        period: initialData?.period || '',
        schoolYear: initialData?.schoolYear || new Date().getFullYear().toString(),
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
            const classData: Class = {
                classId: initialData?.classId || uuidv4(),
                teacherId,
                className: formData.className,
                period: formData.period,
                schoolYear: formData.schoolYear,
                createdAt: initialData?.createdAt || new Date(),
            };

            await createClass(classData);
            onSuccess();
        } catch (err: any) {
            setError(err.message || 'Failed to create class');
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
                <label htmlFor="className" className="label">
                    Class Name *
                </label>
                <input
                    type="text"
                    id="className"
                    name="className"
                    value={formData.className}
                    onChange={handleChange}
                    className="input"
                    placeholder="e.g., English 101, Math 8A"
                    required
                />
            </div>

            <div>
                <label htmlFor="period" className="label">
                    Period (Optional)
                </label>
                <input
                    type="text"
                    id="period"
                    name="period"
                    value={formData.period}
                    onChange={handleChange}
                    className="input"
                    placeholder="e.g., 1, 2A, etc."
                />
            </div>

            <div>
                <label htmlFor="schoolYear" className="label">
                    School Year *
                </label>
                <input
                    type="text"
                    id="schoolYear"
                    name="schoolYear"
                    value={formData.schoolYear}
                    onChange={handleChange}
                    className="input"
                    placeholder="e.g., 2024-2025"
                    required
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
                    {isLoading ? 'Creating...' : initialData ? 'Update Class' : 'Create Class'}
                </button>
            </div>
        </form>
    );
}
