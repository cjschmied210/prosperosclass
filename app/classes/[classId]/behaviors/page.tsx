'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { getBehaviorsByTeacher, deleteBehavior } from '@/lib/firestore';
import { Behavior } from '@/types';
import BehaviorForm from '@/components/BehaviorForm';
import Link from 'next/link';

interface BehaviorsPageProps {
    params: {
        classId: string;
    };
}

export default function BehaviorsPage({ params }: BehaviorsPageProps) {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [behaviors, setBehaviors] = useState<Behavior[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingBehavior, setEditingBehavior] = useState<Behavior | undefined>();

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        const loadBehaviors = async () => {
            if (user) {
                const teacherBehaviors = await getBehaviorsByTeacher(user.teacherId);
                setBehaviors(teacherBehaviors);
                setLoading(false);
            }
        };

        loadBehaviors();
    }, [user]);

    const handleBehaviorSaved = async () => {
        if (user) {
            const teacherBehaviors = await getBehaviorsByTeacher(user.teacherId);
            setBehaviors(teacherBehaviors);
            setShowForm(false);
            setEditingBehavior(undefined);
        }
    };

    const handleDelete = async (behaviorId: string) => {
        if (confirm('Are you sure you want to delete this behavior?')) {
            await deleteBehavior(behaviorId);
            setBehaviors(behaviors.filter(b => b.behaviorId !== behaviorId));
        }
    };

    const handleEdit = (behavior: Behavior) => {
        setEditingBehavior(behavior);
        setShowForm(true);
    };

    if (authLoading || !user || loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-lg text-secondary">Loading...</div>
            </div>
        );
    }

    const positiveBehaviors = behaviors.filter(b => b.type === 'positive');
    const negativeBehaviors = behaviors.filter(b => b.type === 'negative');

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="mb-8">
                <Link
                    href={`/classes/${params.classId}`}
                    className="text-sm text-primary hover:underline mb-2 inline-block"
                >
                    ← Back to Class
                </Link>
                <h1 className="text-3xl font-display font-bold mb-2">Configure Behaviors</h1>
                <p className="text-gray-600">Define the behaviors you want to track for your students</p>
            </div>

            {/* Add Behavior Button */}
            <div className="mb-6">
                <button
                    onClick={() => {
                        setEditingBehavior(undefined);
                        setShowForm(true);
                    }}
                    className="btn btn-primary flex items-center space-x-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span>Add New Behavior</span>
                </button>
            </div>

            {/* Behaviors List */}
            {behaviors.length === 0 ? (
                <div className="card text-center py-12">
                    <svg
                        className="w-16 h-16 mx-auto mb-4 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                        />
                    </svg>
                    <h3 className="text-xl font-semibold mb-2">No behaviors yet</h3>
                    <p className="text-gray-600 mb-4">
                        Start by adding behaviors you want to track
                    </p>
                    <button onClick={() => setShowForm(true)} className="btn btn-primary">
                        Add First Behavior
                    </button>
                </div>
            ) : (
                <div className="space-y-8">
                    {/* Positive Behaviors */}
                    {positiveBehaviors.length > 0 && (
                        <div>
                            <h2 className="text-xl font-bold mb-4 flex items-center">
                                <span className="w-4 h-4 bg-green-500 rounded-full mr-3"></span>
                                Positive Behaviors ({positiveBehaviors.length})
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {positiveBehaviors.map((behavior) => (
                                    <div key={behavior.behaviorId} className="card bg-green-50 border-2 border-green-200">
                                        <h3 className="font-semibold text-lg mb-2 text-green-900">{behavior.name}</h3>
                                        {behavior.description && (
                                            <p className="text-sm text-green-700 mb-4">{behavior.description}</p>
                                        )}
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={() => handleEdit(behavior)}
                                                className="text-sm text-primary hover:underline"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(behavior.behaviorId)}
                                                className="text-sm text-red-600 hover:underline"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Negative Behaviors */}
                    {negativeBehaviors.length > 0 && (
                        <div>
                            <h2 className="text-xl font-bold mb-4 flex items-center">
                                <span className="w-4 h-4 bg-red-500 rounded-full mr-3"></span>
                                Negative Behaviors ({negativeBehaviors.length})
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {negativeBehaviors.map((behavior) => (
                                    <div key={behavior.behaviorId} className="card bg-red-50 border-2 border-red-200">
                                        <h3 className="font-semibold text-lg mb-2 text-red-900">{behavior.name}</h3>
                                        {behavior.description && (
                                            <p className="text-sm text-red-700 mb-4">{behavior.description}</p>
                                        )}
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={() => handleEdit(behavior)}
                                                className="text-sm text-primary hover:underline"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(behavior.behaviorId)}
                                                className="text-sm text-red-600 hover:underline"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Behavior Form Modal */}
            {showForm && (
                <div className="modal-overlay" onClick={() => setShowForm(false)}>
                    <div className="modal-content p-6" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold">
                                {editingBehavior ? 'Edit Behavior' : 'Add New Behavior'}
                            </h2>
                            <button
                                onClick={() => setShowForm(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <BehaviorForm
                            teacherId={user.teacherId}
                            onSuccess={handleBehaviorSaved}
                            onCancel={() => setShowForm(false)}
                            initialData={editingBehavior}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
