'use client';

import { useState } from 'react';
import { Student, Behavior } from '@/types';

interface StudentCardProps {
    student: Student;
    variant: 'roster' | 'focus';
    behaviors?: Behavior[]; // Available behaviors for focus variant
    onQuickLog?: (behaviorId: string) => void; // Quick-log handler for focus variant
}

export default function StudentCard({ student, variant, behaviors = [], onQuickLog }: StudentCardProps) {
    const [justLogged, setJustLogged] = useState<string | null>(null);

    const baseClasses = 'student-card';
    const variantClasses = variant === 'focus'
        ? 'student-card-focus'
        : 'bg-white hover:bg-gray-50 border border-transparent hover:border-primary hover:shadow-md';

    const getInitials = (firstName: string, lastName: string) => {
        return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    };

    const handleQuickLog = (behaviorId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (onQuickLog) {
            onQuickLog(behaviorId);
            // Visual feedback
            setJustLogged(behaviorId);
            setTimeout(() => setJustLogged(null), 1000);
        }
    };

    // Get assigned focus behaviors for this student
    const focusBehaviors = variant === 'focus' && student.focusBehaviorIds
        ? behaviors
            .filter(b => student.focusBehaviorIds?.includes(b.behaviorId))
            .sort((a, b) => {
                // Sort by type: positive first
                if (a.type !== b.type) {
                    return a.type === 'positive' ? -1 : 1;
                }
                // Then sort by name
                return a.name.localeCompare(b.name);
            })
        : [];

    return (
        <div className={`${baseClasses} ${variantClasses}`}>
            <div className="flex items-center space-x-3">
                {/* Avatar */}
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white ${variant === 'focus'
                    ? 'bg-gradient-to-br from-primary to-accent'
                    : 'bg-gradient-to-br from-gray-400 to-gray-600'
                    }`}>
                    {getInitials(student.firstName, student.lastName)}
                </div>

                {/* Student Info */}
                <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">
                        {student.firstName} {student.lastName}
                    </h3>
                    {student.grade && (
                        <p className="text-sm text-gray-600">Grade {student.grade}</p>
                    )}
                </div>

                {/* Indicators */}
                <div className="flex items-center space-x-1">
                    {/* IEP/504 Indicator */}
                    {student.documentIds && student.documentIds.length > 0 && (
                        <div
                            className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center"
                            title={`${student.documentIds.length} document(s)`}
                        >
                            <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                    )}
                </div>
            </div>

            {/* Focus Behavior Quick-Log Buttons */}
            {variant === 'focus' && focusBehaviors.length > 0 && (
                <div className="mt-3 pt-3 border-t border-indigo-200">
                    <div className="flex flex-wrap gap-2 w-full">
                        {focusBehaviors.map((behavior) => {
                            const isPositive = behavior.type === 'positive';
                            const isJustLogged = justLogged === behavior.behaviorId;

                            return (
                                <button
                                    key={behavior.behaviorId}
                                    onClick={(e) => handleQuickLog(behavior.behaviorId, e)}
                                    className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all text-center justify-center items-center flex shadow-sm ${isPositive
                                        ? 'bg-green-100 text-green-800 hover:bg-green-200 border border-green-200'
                                        : 'bg-red-100 text-red-800 hover:bg-red-200 border border-red-200'
                                        } ${isJustLogged ? 'ring-2 ring-offset-2 ring-primary scale-105' : ''}`}
                                    title={behavior.description || behavior.name}
                                >
                                    {isJustLogged && <span className="mr-1">✓</span>}
                                    {behavior.name}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Hover hint for focus cards without assigned behaviors */}
            {variant === 'focus' && focusBehaviors.length === 0 && (
                <div className="mt-2 pt-2 border-t border-indigo-200">
                    <p className="text-xs text-gray-600 text-center">
                        Click to log behavior
                    </p>
                </div>
            )}
        </div>
    );
}
