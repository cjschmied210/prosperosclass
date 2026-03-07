import { useState, useEffect } from 'react';
import { Student, Behavior } from '@/types';
import { updateStudent, createBehavior } from '@/lib/firestore';
import { useAuth } from './AuthProvider';
import { v4 as uuidv4 } from 'uuid';
import IEPAnalysisModal from './IEPAnalysisModal';

interface AssignFocusBehaviorsModalProps {
    student: Student;
    behaviors: Behavior[];
    onClose: () => void;
    onSuccess: () => void;
    onBehaviorCreated?: (behavior: Behavior) => void;
}

export default function AssignFocusBehaviorsModal({
    student,
    behaviors,
    onClose,
    onSuccess,
    onBehaviorCreated
}: AssignFocusBehaviorsModalProps) {
    const { user } = useAuth();
    const [selectedBehaviorIds, setSelectedBehaviorIds] = useState<string[]>(
        student.focusBehaviorIds || []
    );
    const [saving, setSaving] = useState(false);
    const [showIEPModal, setShowIEPModal] = useState(false);

    // Local behaviors state to immediately show newly created ones
    // (Though parent updates props, this ensures immediate feedback if parent is slow)
    const displayBehaviors = behaviors;

    const positiveBehaviors = displayBehaviors.filter(b => b.type === 'positive');
    const negativeBehaviors = displayBehaviors.filter(b => b.type === 'negative');

    const toggleBehavior = (behaviorId: string) => {
        if (selectedBehaviorIds.includes(behaviorId)) {
            setSelectedBehaviorIds(selectedBehaviorIds.filter(id => id !== behaviorId));
        } else {
            setSelectedBehaviorIds([...selectedBehaviorIds, behaviorId]);
        }
    };

    const handleIEPBehavior = async (label: string, type: 'positive' | 'negative') => {
        if (!user?.teacherId) return;

        // Check if behavior already exists (case insensitive)
        const existing = behaviors.find(b =>
            b.name.toLowerCase() === label.toLowerCase() &&
            b.type === type
        );

        if (existing) {
            if (!selectedBehaviorIds.includes(existing.behaviorId)) {
                setSelectedBehaviorIds(prev => [...prev, existing.behaviorId]);
            }
            return;
        }

        // Create new behavior
        const newBehavior: Behavior = {
            behaviorId: uuidv4(),
            teacherId: user.teacherId,
            name: label,
            type,
            createdAt: new Date(),
        };

        try {
            await createBehavior(newBehavior);
            if (onBehaviorCreated) {
                onBehaviorCreated(newBehavior);
            }
            setSelectedBehaviorIds(prev => [...prev, newBehavior.behaviorId]);
        } catch (error) {
            console.error('Failed to create AI behavior:', error);
            alert('Failed to add behavior');
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateStudent(student.studentId, {
                focusBehaviorIds: selectedBehaviorIds
            });
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error updating focus behaviors:', error);
            alert('Failed to save focus behaviors');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
            <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-floating w-full max-w-2xl border border-white/50 p-6 sm:p-8 transform transition-all my-8" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
                    <div>
                        <h2 className="text-2xl font-display font-bold text-slate-900 tracking-tight">Assign Focus Behaviors</h2>
                        <p className="text-sm font-medium text-slate-500 uppercase tracking-wider mt-1">
                            {student.firstName} {student.lastName}
                        </p>
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

                <div className="flex justify-between items-center mb-6 bg-indigo-50/50 p-4 rounded-xl border border-indigo-100/50">
                    <p className="text-sm text-indigo-800/80 font-medium">
                        Select behaviors to show as quick-log buttons on this student's Focus Zone card
                    </p>
                    <button
                        onClick={() => setShowIEPModal(true)}
                        className="flex items-center space-x-2 px-4 py-2 bg-white text-primary border border-primary/20 rounded-lg text-sm font-semibold hover:bg-primary/5 hover:border-primary/40 transition-all shadow-sm shrink-0 ml-4 hover:-translate-y-0.5"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <span>Analyze IEP</span>
                    </button>
                </div>

                {displayBehaviors.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-gray-600 mb-4">No behaviors configured yet.</p>
                        <p className="text-sm text-gray-500">Configure behaviors manually or use the AI tool.</p>
                    </div>
                ) : (
                    <div className="space-y-6 max-h-96 overflow-y-auto">
                        {/* Positive Behaviors */}
                        {positiveBehaviors.length > 0 && (
                            <div>
                                <h3 className="font-semibold text-sm text-slate-700 mb-3 flex items-center uppercase tracking-wider">
                                    <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full mr-2 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                                    Positive Behaviors
                                </h3>
                                <div className="space-y-2.5">
                                    {positiveBehaviors.map((behavior) => (
                                        <label
                                            key={behavior.behaviorId}
                                            className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all group hover:-translate-y-0.5 ${selectedBehaviorIds.includes(behavior.behaviorId) ? 'border-emerald-300 bg-emerald-50/50 shadow-sm ring-1 ring-emerald-100' : 'border-slate-200 bg-white hover:border-emerald-200 hover:bg-slate-50'}`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedBehaviorIds.includes(behavior.behaviorId)}
                                                onChange={() => toggleBehavior(behavior.behaviorId)}
                                                className="w-5 h-5 text-emerald-500 rounded border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1 transition-colors"
                                            />
                                            <div className="ml-4 flex-1">
                                                <div className={`font-semibold ${selectedBehaviorIds.includes(behavior.behaviorId) ? 'text-emerald-800' : 'text-slate-700 group-hover:text-emerald-700'}`}>{behavior.name}</div>
                                                {behavior.description && (
                                                    <div className={`text-xs mt-0.5 ${selectedBehaviorIds.includes(behavior.behaviorId) ? 'text-emerald-600/80' : 'text-slate-500'}`}>{behavior.description}</div>
                                                )}
                                            </div>
                                        </label>
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
                                <div className="space-y-2.5">
                                    {negativeBehaviors.map((behavior) => (
                                        <label
                                            key={behavior.behaviorId}
                                            className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all group hover:-translate-y-0.5 ${selectedBehaviorIds.includes(behavior.behaviorId) ? 'border-rose-300 bg-rose-50/50 shadow-sm ring-1 ring-rose-100' : 'border-slate-200 bg-white hover:border-rose-200 hover:bg-slate-50'}`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedBehaviorIds.includes(behavior.behaviorId)}
                                                onChange={() => toggleBehavior(behavior.behaviorId)}
                                                className="w-5 h-5 text-rose-500 rounded border-slate-300 focus:ring-2 focus:ring-rose-500 focus:ring-offset-1 transition-colors"
                                            />
                                            <div className="ml-4 flex-1">
                                                <div className={`font-semibold ${selectedBehaviorIds.includes(behavior.behaviorId) ? 'text-rose-800' : 'text-slate-700 group-hover:text-rose-700'}`}>{behavior.name}</div>
                                                {behavior.description && (
                                                    <div className={`text-xs mt-0.5 ${selectedBehaviorIds.includes(behavior.behaviorId) ? 'text-rose-600/80' : 'text-slate-500'}`}>{behavior.description}</div>
                                                )}
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Footer */}
                <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-slate-100">
                    <button
                        onClick={onClose}
                        className="btn btn-outline"
                        disabled={saving}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="btn btn-primary shadow-md hover:shadow-lg transition-all"
                        disabled={saving || displayBehaviors.length === 0}
                    >
                        {saving ? 'Saving...' : 'Save Focus Behaviors'}
                    </button>
                </div>
            </div>

            {/* IEP Analysis Modal */}
            <IEPAnalysisModal
                isOpen={showIEPModal}
                onClose={() => setShowIEPModal(false)}
                onAddBehavior={handleIEPBehavior}
                studentName={`${student.firstName} ${student.lastName}`}
            />
        </div>
    );
}
