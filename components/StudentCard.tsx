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

    const baseClasses = 'student-card p-4 rounded-2xl flex flex-col justify-between';
    const variantClasses = variant === 'focus'
        ? 'bg-[#f5ede3] border border-amber-200/60 shadow-soft hover:shadow-md transition-shadow'
        : 'bg-white hover:bg-slate-50 border border-transparent hover:border-primary/30 hover:shadow-soft';

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
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white shadow-soft ${variant === 'focus'
                    ? 'bg-gradient-to-br from-[#14291A] to-[#1a3320]'
                    : 'bg-gradient-to-br from-stone-500 to-amber-800'
                    }`}>
                    {getInitials(student.firstName, student.lastName)}
                </div>

                {/* Student Info */}
                <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-800 text-lg tracking-tight truncate">
                        {student.firstName} {student.lastName}
                    </h3>
                    {student.grade && (
                        <p className="text-sm text-slate-500 font-medium tracking-wide">Grade {student.grade}</p>
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
                <div className="mt-4 pt-3 border-t border-indigo-100/50">
                    <div className="flex flex-wrap gap-2 w-full">
                        {focusBehaviors.map((behavior) => {
                            const isPositive = behavior.type === 'positive';
                            const isJustLogged = justLogged === behavior.behaviorId;

                            return (
                                <button
                                    key={behavior.behaviorId}
                                    onClick={(e) => handleQuickLog(behavior.behaviorId, e)}
                                    className={`flex-1 px-3 py-2 rounded-xl text-sm font-bold transition-all text-center justify-center items-center flex ${isPositive
                                        ? 'bg-[#14291A] text-emerald-50 hover:bg-[#1a3320] border border-[#14291A] shadow-soft'
                                        : 'bg-rose-900 text-rose-50 hover:bg-rose-800 border border-rose-900 shadow-soft'
                                        } ${isJustLogged ? 'ring-2 ring-primary scale-105 shadow-md' : 'hover:-translate-y-0.5 hover:shadow-md'}`}
                                    title={behavior.description || behavior.name}
                                >
                                    {isJustLogged && <span className="mr-1.5 animate-bounce">✓</span>}
                                    {behavior.name}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Hover hint for focus cards without assigned behaviors */}
            {variant === 'focus' && focusBehaviors.length === 0 && (
                <div className="mt-3 pt-3 border-t border-indigo-100/50">
                    <p className="text-xs text-slate-500 text-center font-medium tracking-wide">
                        Click to log behavior
                    </p>
                </div>
            )}
        </div>
    );
}
