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
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content p-6 max-w-2xl" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-bold">Assign Focus Behaviors</h2>
                        <p className="text-sm text-gray-600 mt-1">
                            {student.firstName} {student.lastName}
                        </p>
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

                <div className="flex justify-between items-center mb-4">
                    <p className="text-sm text-gray-600">
                        Select behaviors to show as quick-log buttons on this student's Focus Zone card
                    </p>
                    <button
                        onClick={() => setShowIEPModal(true)}
                        className="flex items-center space-x-2 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <span>Analyze IEP with AI</span>
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
                                <h3 className="font-semibold text-sm text-gray-700 mb-3 flex items-center">
                                    <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                                    Positive Behaviors
                                </h3>
                                <div className="space-y-2">
                                    {positiveBehaviors.map((behavior) => (
                                        <label
                                            key={behavior.behaviorId}
                                            className="flex items-center p-3 border-2 border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedBehaviorIds.includes(behavior.behaviorId)}
                                                onChange={() => toggleBehavior(behavior.behaviorId)}
                                                className="w-5 h-5 text-primary rounded focus:ring-2 focus:ring-primary"
                                            />
                                            <div className="ml-3 flex-1">
                                                <div className="font-medium text-gray-900">{behavior.name}</div>
                                                {behavior.description && (
                                                    <div className="text-xs text-gray-500 mt-1">{behavior.description}</div>
                                                )}
                                            </div>
                                        </label>
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
                                <div className="space-y-2">
                                    {negativeBehaviors.map((behavior) => (
                                        <label
                                            key={behavior.behaviorId}
                                            className="flex items-center p-3 border-2 border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedBehaviorIds.includes(behavior.behaviorId)}
                                                onChange={() => toggleBehavior(behavior.behaviorId)}
                                                className="w-5 h-5 text-primary rounded focus:ring-2 focus:ring-primary"
                                            />
                                            <div className="ml-3 flex-1">
                                                <div className="font-medium text-gray-900">{behavior.name}</div>
                                                {behavior.description && (
                                                    <div className="text-xs text-gray-500 mt-1">{behavior.description}</div>
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
                <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
                    <button
                        onClick={onClose}
                        className="btn btn-outline"
                        disabled={saving}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="btn btn-primary"
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
