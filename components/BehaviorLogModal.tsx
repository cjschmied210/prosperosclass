'use client';

import { useState, useEffect } from 'react';
import { Student, Behavior } from '@/types';
import { getBehaviorsByTeacher, logIncident } from '@/lib/firestore';
import { useAuth } from './AuthProvider';
import { v4 as uuidv4 } from 'uuid';
import { playPositiveSound, playNegativeSound } from '@/lib/sounds';

interface BehaviorLogModalProps {
    student: Student;
    classId: string;
    onClose: () => void;
}

export default function BehaviorLogModal({ student, classId, onClose }: BehaviorLogModalProps) {
    const { user } = useAuth();
    const [behaviors, setBehaviors] = useState<Behavior[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedBehavior, setSelectedBehavior] = useState<string>('');
    const [notes, setNotes] = useState('');
    const [isLogging, setIsLogging] = useState(false);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        const loadBehaviors = async () => {
            if (user?.teacherId) {
                const teacherBehaviors = await getBehaviorsByTeacher(user.teacherId);
                setBehaviors(teacherBehaviors);
                setLoading(false);
            }
        };

        loadBehaviors();
    }, [user]);

    const handleLogBehavior = async (behaviorId: string) => {
        if (!user) return;

        setIsLogging(true);
        try {
            const incidentData: any = {
                incidentId: uuidv4(),
                studentId: student.studentId,
                classId,
                teacherId: user.teacherId,
                behaviorId,
                timestamp: new Date(),
            };

            // Only add notes if they exist
            if (notes.trim()) {
                incidentData.notes = notes.trim();
            }

            await logIncident(incidentData);

            setSuccess(true);

            // Play sound based on behavior type
            const loggedBehavior = behaviors.find(b => b.behaviorId === behaviorId);
            if (loggedBehavior) {
                if (loggedBehavior.type === 'positive') {
                    playPositiveSound();
                } else {
                    playNegativeSound();
                }
            }

            setNotes('');

            // Auto-close after success
            setTimeout(() => {
                onClose();
            }, 1000);
        } catch (error) {
            console.error('Failed to log behavior:', error);
        } finally {
            setIsLogging(false);
        }
    };

    const positiveBehaviors = behaviors.filter(b => b.type === 'positive');
    const negativeBehaviors = behaviors.filter(b => b.type === 'negative');

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content p-6 max-w-2xl" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center font-bold text-white">
                            {student.firstName.charAt(0)}{student.lastName.charAt(0)}
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold">
                                {student.firstName} {student.lastName}
                            </h2>
                            <p className="text-sm text-gray-600">Log Behavior</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {success && (
                    <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg fade-in">
                        <p className="text-sm text-green-600 font-medium">✓ Behavior logged successfully!</p>
                    </div>
                )}

                {loading ? (
                    <div className="text-center py-8">
                        <p className="text-gray-500">Loading behaviors...</p>
                    </div>
                ) : behaviors.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-gray-600 mb-4">No behaviors configured yet.</p>
                        <button
                            onClick={() => window.location.href = `/classes/${classId}/behaviors`}
                            className="btn btn-primary"
                        >
                            Configure Behaviors
                        </button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Positive Behaviors */}
                        {positiveBehaviors.length > 0 && (
                            <div>
                                <h3 className="font-semibold text-sm text-gray-700 mb-3 flex items-center">
                                    <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                                    Positive Behaviors
                                </h3>
                                <div className="grid grid-cols-2 gap-2">
                                    {positiveBehaviors.map((behavior) => (
                                        <button
                                            key={behavior.behaviorId}
                                            onClick={() => handleLogBehavior(behavior.behaviorId)}
                                            disabled={isLogging}
                                            className="p-3 border-2 border-green-200 bg-green-50 hover:bg-green-100 rounded-lg text-left transition-colors disabled:opacity-50"
                                        >
                                            <div className="font-medium text-green-900">{behavior.name}</div>
                                            {behavior.description && (
                                                <div className="text-xs text-green-700 mt-1">{behavior.description}</div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Negative Behaviors */}
                        {negativeBehaviors.length > 0 && (
                            <div>
                                <h3 className="font-semibold text-sm text-gray-700 mb-3 flex items-center">
                                    <span className="w-3 h-3 bg-red-500 rounded-full mr-2"></span>
                                    Negative Behaviors
                                </h3>
                                <div className="grid grid-cols-2 gap-2">
                                    {negativeBehaviors.map((behavior) => (
                                        <button
                                            key={behavior.behaviorId}
                                            onClick={() => handleLogBehavior(behavior.behaviorId)}
                                            disabled={isLogging}
                                            className="p-3 border-2 border-red-200 bg-red-50 hover:bg-red-100 rounded-lg text-left transition-colors disabled:opacity-50"
                                        >
                                            <div className="font-medium text-red-900">{behavior.name}</div>
                                            {behavior.description && (
                                                <div className="text-xs text-red-700 mt-1">{behavior.description}</div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Optional Notes */}
                        <div>
                            <label className="label">Notes (Optional)</label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                rows={3}
                                placeholder="Add any additional context..."
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
