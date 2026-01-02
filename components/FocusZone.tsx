'use client';

import { Student, Behavior } from '@/types';
import StudentCard from './StudentCard';
import { useState, useEffect, useRef } from 'react';
import BehaviorLogModal from './BehaviorLogModal';
import AssignFocusBehaviorsModal from './AssignFocusBehaviorsModal';
import { useAuth } from './AuthProvider';
import { getBehaviorsByTeacher, logIncident } from '@/lib/firestore';
import { v4 as uuidv4 } from 'uuid';
import { playPositiveSound, playNegativeSound } from '@/lib/sounds';

interface FocusZoneProps {
    students: Student[];
    onRemoveStudent: (studentId: string) => void;
    classId: string;
    onStudentUpdate?: () => void; // Callback to refresh student data
}

export default function FocusZone({ students, onRemoveStudent, classId, onStudentUpdate }: FocusZoneProps) {
    const { user } = useAuth();
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [assigningStudent, setAssigningStudent] = useState<Student | null>(null);
    const [behaviors, setBehaviors] = useState<Behavior[]>([]);
    const [loading, setLoading] = useState(true);
    const [isProjectionMode, setIsProjectionMode] = useState(false);
    const focusZoneRef = useRef<HTMLDivElement>(null);

    // Load behaviors
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

    // Handle fullscreen changes
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsProjectionMode(!!document.fullscreenElement);
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    const toggleProjection = async () => {
        if (!focusZoneRef.current) return;

        try {
            if (!document.fullscreenElement) {
                await focusZoneRef.current.requestFullscreen();
            } else {
                await document.exitFullscreen();
            }
        } catch (err) {
            console.error('Error toggling fullscreen:', err);
        }
    };

    // Calculate grid layout for projection mode
    const getProjectionGridStyle = () => {
        if (!isProjectionMode || students.length === 0) return {};

        const count = students.length;
        // Calculate optimal cols based on count and aspect ratio approximation
        // We want somewhat square-ish handling but favoring width
        let cols = Math.ceil(Math.sqrt(count));
        let rows = Math.ceil(count / cols);

        // Adjust for wider screens if needed, but simple sqrt is a good start
        // For very small counts, maybe force a row
        if (count <= 2) {
            cols = count;
            rows = 1;
        }

        return {
            gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
        };
    };

    const handleQuickLog = async (student: Student, behaviorId: string) => {
        if (!user) return;

        try {
            await logIncident({
                incidentId: uuidv4(),
                studentId: student.studentId,
                classId,
                teacherId: user.teacherId,
                behaviorId,
                timestamp: new Date(),
            });

            // Play sound based on behavior type
            const loggedBehavior = behaviors.find(b => b.behaviorId === behaviorId);
            if (loggedBehavior) {
                if (loggedBehavior.type === 'positive') {
                    playPositiveSound();
                } else {
                    playNegativeSound();
                }
            }
        } catch (error) {
            console.error('Failed to log behavior:', error);
        }
    };

    const handleAssignSuccess = () => {
        if (onStudentUpdate) {
            onStudentUpdate();
        }
    };

    return (
        <>
            <div
                ref={focusZoneRef}
                className={`flex-1 focus-zone p-6 overflow-y-auto ${isProjectionMode ? 'bg-slate-900 overflow-hidden flex flex-col h-screen w-screen' : ''}`}
            >
                <div className="mb-6 flex justify-between items-start">
                    <div>
                        <h2 className="text-2xl font-display font-bold text-white mb-2">Focus Zone</h2>
                        <p className="text-gray-300">
                            {students.length} {students.length === 1 ? 'student' : 'students'} being monitored
                        </p>
                    </div>
                    <button
                        onClick={toggleProjection}
                        className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
                        title={isProjectionMode ? "Exit Projection Mode" : "Enter Projection Mode"}
                    >
                        {isProjectionMode ? (
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        ) : (
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 4l-5-5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                            </svg>
                        )}
                    </button>
                </div>

                {students.length === 0 ? (
                    <div className="flex items-center justify-center h-96">
                        <div className="text-center">
                            <div className="w-24 h-24 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg
                                    className="w-12 h-12 text-slate-500"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                                    />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-2">Focus Zone is Empty</h3>
                            <p className="text-gray-300 max-w-md">
                                Click students from the Master Roster to add them here for easy monitoring
                            </p>
                        </div>
                    </div>
                ) : (
                    <div
                        className={`grid gap-4 ${isProjectionMode ? 'h-full grid-flow-row' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}
                        style={isProjectionMode ? getProjectionGridStyle() : {}}
                    >
                        {students.map((student) => (
                            <div key={student.studentId} className={`relative group ${isProjectionMode ? 'h-full w-full' : ''}`}>
                                <div onClick={() => setSelectedStudent(student)} className="h-full">
                                    <StudentCard
                                        student={student}
                                        variant="focus"
                                        behaviors={behaviors}
                                        onQuickLog={(behaviorId) => handleQuickLog(student, behaviorId)}
                                    />
                                </div>

                                {/* Action Buttons */}
                                <div className="absolute -top-2 -right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {/* Assign Behaviors Button */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setAssigningStudent(student);
                                        }}
                                        className="w-8 h-8 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center"
                                        title="Assign Focus Behaviors"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                    </button>

                                    {/* Remove Button */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onRemoveStudent(student.studentId);
                                        }}
                                        className="w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg flex items-center justify-center"
                                        title="Remove from Focus Zone"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Behavior Log Modal (full behavior list) */}
            {selectedStudent && (
                <BehaviorLogModal
                    student={selectedStudent}
                    classId={classId}
                    onClose={() => setSelectedStudent(null)}
                />
            )}

            {/* Assign Focus Behaviors Modal */}
            {assigningStudent && (
                <AssignFocusBehaviorsModal
                    student={assigningStudent}
                    behaviors={behaviors}
                    onClose={() => setAssigningStudent(null)}
                    onSuccess={handleAssignSuccess}
                    onBehaviorCreated={(newBehavior) => setBehaviors([...behaviors, newBehavior])}
                />
            )}
        </>
    );
}
