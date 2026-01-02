'use client';

import { useState, useEffect } from 'react';
import { Student, Incident, Behavior } from '@/types';
import { getIncidentsByStudent, getIncidentsByClass, getBehaviorsByTeacher } from '@/lib/firestore';
import { useAuth } from './AuthProvider';
import BehaviorLogTable from './BehaviorLogTable';
import BehaviorCharts from './BehaviorCharts';
import EmailReportModal from './EmailReportModal';
import { subDays, subWeeks, subMonths, startOfDay, endOfDay } from 'date-fns';

interface DataAnalysisViewProps {
    students: Student[];
    classId: string;
    selectedStudentId: string;
    dateRange: 'all' | 'week' | 'month' | '3months';
    onStudentChange: (studentId: string) => void;
    onDateRangeChange: (range: 'all' | 'week' | 'month' | '3months') => void;
}

export default function DataAnalysisView({
    students,
    classId,
    selectedStudentId,
    dateRange,
    onStudentChange,
    onDateRangeChange
}: DataAnalysisViewProps) {
    const { user } = useAuth();
    const [incidents, setIncidents] = useState<Incident[]>([]);
    const [behaviors, setBehaviors] = useState<Behavior[]>([]);
    const [loading, setLoading] = useState(false);
    const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
    const [focusedBehaviorId, setFocusedBehaviorId] = useState<string | undefined>(undefined);

    // Load behaviors on mount
    useEffect(() => {
        const loadBehaviors = async () => {
            if (user?.teacherId) {
                const teacherBehaviors = await getBehaviorsByTeacher(user.teacherId);
                setBehaviors(teacherBehaviors);
            }
        };
        loadBehaviors();
    }, [user]);

    // Load incidents when student or date range changes
    useEffect(() => {
        const loadIncidents = async () => {
            setLoading(true);
            try {
                let startDate: Date | undefined;
                let endDate: Date | undefined = endOfDay(new Date());

                switch (dateRange) {
                    case 'week':
                        startDate = startOfDay(subWeeks(new Date(), 1));
                        break;
                    case 'month':
                        startDate = startOfDay(subMonths(new Date(), 1));
                        break;
                    case '3months':
                        startDate = startOfDay(subMonths(new Date(), 3));
                        break;
                    case 'all':
                    default:
                        startDate = undefined;
                        endDate = undefined;
                        break;
                }

                let fetchedIncidents: Incident[] = [];

                if (selectedStudentId) {
                    // Fetch for specific student
                    fetchedIncidents = await getIncidentsByStudent(
                        selectedStudentId,
                        startDate,
                        endDate
                    );
                } else {
                    // Fetch for entire class (Overview)
                    fetchedIncidents = await getIncidentsByClass(
                        classId,
                        startDate,
                        endDate
                    );
                }
                setIncidents(fetchedIncidents);
            } catch (error) {
                console.error('Error loading incidents:', error);
            } finally {
                setLoading(false);
            }
        };

        // Always load incidents when dependencies change (including on mount)
        if (classId) {
            loadIncidents();
        }
    }, [selectedStudentId, dateRange, classId]);

    const handleIncidentDeleted = () => {
        // Reload incidents after deletion (re-trigger effect logic essentially)
        // For simplicity, we can just rely on the effect if we had a refresh trigger, 
        // but here we'll duplicate the fetch logic briefly or just force a reload.
        // A cleaner way is to extract the fetch logic, but for now let's just re-fetch.
        const reload = async () => {
            setLoading(true);
            try {
                let startDate: Date | undefined;
                let endDate: Date | undefined = endOfDay(new Date());
                // ... (same date logic)
                switch (dateRange) {
                    case 'week': startDate = startOfDay(subWeeks(new Date(), 1)); break;
                    case 'month': startDate = startOfDay(subMonths(new Date(), 1)); break;
                    case '3months': startDate = startOfDay(subMonths(new Date(), 3)); break;
                    default: startDate = undefined; endDate = undefined; break;
                }

                let fetchedIncidents: Incident[] = [];
                if (selectedStudentId) {
                    fetchedIncidents = await getIncidentsByStudent(selectedStudentId, startDate, endDate);
                } else {
                    fetchedIncidents = await getIncidentsByClass(classId, startDate, endDate);
                }
                setIncidents(fetchedIncidents);
            } catch (error) {
                console.error('Error reloading incidents:', error);
            } finally {
                setLoading(false);
            }
        };
        reload();
    };

    const selectedStudent = students.find(s => s.studentId === selectedStudentId);

    return (
        <div className="h-full flex flex-col bg-gray-50">
            {/* Filter Bar */}
            <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center space-x-4">
                    <span className="text-sm font-medium text-gray-500">Filter Data:</span>

                    {/* Student Selector */}
                    <select
                        value={selectedStudentId}
                        onChange={(e) => onStudentChange(e.target.value)}
                        className="text-sm border-gray-300 rounded-md focus:ring-primary focus:border-primary py-1.5 pl-3 pr-8 min-w-[200px]"
                    >
                        <option value="">Class Overview (All Students)</option>
                        {students.map((s) => (
                            <option key={s.studentId} value={s.studentId}>
                                {s.firstName} {s.lastName}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Time Range */}
                <div className="flex items-center space-x-1 bg-gray-100 rounded-md p-1">
                    {(['week', 'month', '3months', 'all'] as const).map((range) => (
                        <button
                            key={range}
                            onClick={() => onDateRangeChange(range)}
                            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${dateRange === range
                                ? 'bg-white text-primary shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            {range === 'week' ? '1W' : range === 'month' ? '1M' : range === '3months' ? '3M' : 'All'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6">
                {loading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-lg text-gray-600">Loading data...</div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Header Card */}
                        <div className="bg-white border border-gray-200 rounded-lg p-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                    {selectedStudent ? (
                                        <>
                                            <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center font-bold text-white text-xl">
                                                {selectedStudent.firstName.charAt(0)}{selectedStudent.lastName.charAt(0)}
                                            </div>
                                            <div>
                                                <h2 className="text-2xl font-bold text-gray-900">
                                                    {selectedStudent.firstName} {selectedStudent.lastName}
                                                </h2>
                                                {selectedStudent.grade && (
                                                    <p className="text-gray-600">Grade {selectedStudent.grade}</p>
                                                )}
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="w-16 h-16 bg-gradient-to-br from-slate-700 to-slate-900 rounded-full flex items-center justify-center font-bold text-white text-xl">
                                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                                </svg>
                                            </div>
                                            <div>
                                                <h2 className="text-2xl font-bold text-gray-900">
                                                    Class Overview
                                                </h2>
                                                <p className="text-gray-600">Aggregate data for all students</p>
                                            </div>
                                        </>
                                    )}
                                </div>

                                {selectedStudent && (
                                    <button
                                        onClick={() => {
                                            setFocusedBehaviorId(undefined);
                                            setIsEmailModalOpen(true);
                                        }}
                                        className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                                    >
                                        <svg className="w-5 h-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                        Email Report
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Charts */}
                        <BehaviorCharts
                            incidents={incidents}
                            behaviors={behaviors}
                            onGenerateReport={(behaviorId) => {
                                setFocusedBehaviorId(behaviorId);
                                setIsEmailModalOpen(true);
                            }}
                        />

                        {/* Behavior Log Table */}
                        <div>
                            <h3 className="text-lg font-semibold mb-4">Behavior Log</h3>
                            <BehaviorLogTable
                                incidents={incidents}
                                behaviors={behaviors}
                                onIncidentDeleted={handleIncidentDeleted}
                            />
                        </div>
                    </div>
                )}
            </div>

            <EmailReportModal
                isOpen={isEmailModalOpen}
                onClose={() => setIsEmailModalOpen(false)}
                student={selectedStudent}
                incidents={incidents}
                behaviors={behaviors}
                dateRange={dateRange}
                focusedBehaviorId={focusedBehaviorId}
            />
        </div>
    );
}
