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
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
            <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-floating w-full max-w-2xl border border-white/50 p-6 sm:p-8 transform transition-all my-8" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
                    <div className="flex items-center space-x-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center font-bold text-white shadow-glow ring-2 ring-primary/20 text-lg">
                            {student.firstName.charAt(0)}{student.lastName.charAt(0)}
                        </div>
                        <div>
                            <h2 className="text-2xl font-display font-bold text-slate-900 tracking-tight">
                                {student.firstName} {student.lastName}
                            </h2>
                            <p className="text-sm font-medium text-slate-500 uppercase tracking-wider mt-0.5">Log Behavior</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 p-2 rounded-full transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                                <h3 className="font-semibold text-sm text-slate-700 mb-3 flex items-center uppercase tracking-wider">
                                    <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full mr-2 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                                    Positive Behaviors
                                </h3>
                                <div className="grid grid-cols-2 gap-3">
                                    {positiveBehaviors.map((behavior) => (
                                        <button
                                            key={behavior.behaviorId}
                                            onClick={() => handleLogBehavior(behavior.behaviorId)}
                                            disabled={isLogging}
                                            className="p-4 border border-emerald-100 bg-emerald-50/50 hover:bg-emerald-50 hover:border-emerald-200 hover:shadow-sm rounded-xl text-left transition-all disabled:opacity-50 group hover:-translate-y-0.5"
                                        >
                                            <div className="font-semibold text-emerald-800 flex justify-between items-center">
                                                {behavior.name}
                                                <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                                            </div>
                                            {behavior.description && (
                                                <div className="text-xs text-emerald-600/80 mt-1">{behavior.description}</div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Negative Behaviors */}
                        {negativeBehaviors.length > 0 && (
                            <div className="pt-2">
                                <h3 className="font-semibold text-sm text-slate-700 mb-3 flex items-center uppercase tracking-wider">
                                    <span className="w-2.5 h-2.5 bg-rose-500 rounded-full mr-2 shadow-[0_0_8px_rgba(244,63,94,0.5)]"></span>
                                    Negative Behaviors
                                </h3>
                                <div className="grid grid-cols-2 gap-3">
                                    {negativeBehaviors.map((behavior) => (
                                        <button
                                            key={behavior.behaviorId}
                                            onClick={() => handleLogBehavior(behavior.behaviorId)}
                                            disabled={isLogging}
                                            className="p-4 border border-rose-100 bg-rose-50/50 hover:bg-rose-50 hover:border-rose-200 hover:shadow-sm rounded-xl text-left transition-all disabled:opacity-50 group hover:-translate-y-0.5"
                                        >
                                            <div className="font-semibold text-rose-800 flex justify-between items-center">
                                                {behavior.name}
                                                <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                                            </div>
                                            {behavior.description && (
                                                <div className="text-xs text-rose-600/80 mt-1">{behavior.description}</div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Optional Notes */}
                        <div className="pt-4 border-t border-slate-100">
                            <label className="block text-sm font-semibold text-slate-700 mb-2 uppercase tracking-wider">Notes (Optional)</label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary focus:bg-white transition-all resize-none shadow-inner"
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
