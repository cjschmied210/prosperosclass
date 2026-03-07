'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useRouter, useParams } from 'next/navigation';
import { getClass, getStudentsByClass, deleteStudent, getBehaviorsByTeacher, getFocusList, saveFocusList } from '@/lib/firestore';
import { v4 as uuidv4 } from 'uuid';
import { Class, Student, Behavior, FocusList } from '@/types';
import MasterRoster from '@/components/MasterRoster';
import FocusZone from '@/components/FocusZone';
import StudentForm from '@/components/StudentForm';
import DataAnalysisView from '@/components/DataAnalysisView';
import BulkStudentImport from '@/components/BulkStudentImport';
import AssignFocusBehaviorsModal from '@/components/AssignFocusBehaviorsModal';

export default function ClassDetailPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const params = useParams();
    const classId = params?.classId as string;

    const [classData, setClassData] = useState<Class | null>(null);
    const [students, setStudents] = useState<Student[]>([]);
    const [loadingClass, setLoadingClass] = useState(true);
    const [showStudentForm, setShowStudentForm] = useState(false);
    const [isBulkImportMode, setIsBulkImportMode] = useState(false);
    const [focusStudentIds, setFocusStudentIds] = useState<string[]>([]);
    const [focusListId, setFocusListId] = useState<string | null>(null);
    const [error, setError] = useState('');
    const [currentView, setCurrentView] = useState<'monitoring' | 'analytics'>('monitoring');

    // Lifted state for DataAnalysisView
    const [analyticsStudentId, setAnalyticsStudentId] = useState<string>('');
    const [analyticsDateRange, setAnalyticsDateRange] = useState<'all' | 'week' | 'month' | '3months'>('all');

    // New state for editing and managing behaviors
    const [editingStudent, setEditingStudent] = useState<Student | null>(null);
    const [managingBehaviorsStudent, setManagingBehaviorsStudent] = useState<Student | null>(null);
    const [behaviors, setBehaviors] = useState<Behavior[]>([]);

    // CRITICAL: Early return if classId is not available yet
    if (!classId) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-lg text-secondary">Loading...</div>
            </div>
        );
    }

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        const loadData = async () => {
            if (!user?.teacherId || !classId) return;

            try {
                setError('');
                const [classInfo, classStudents, teacherBehaviors, focusList] = await Promise.all([
                    getClass(classId),
                    getStudentsByClass(classId),
                    getBehaviorsByTeacher(user.teacherId),
                    getFocusList(user.teacherId, classId)
                ]);

                if (!classInfo) {
                    setError('Class not found');
                    setLoadingClass(false);
                    return;
                }

                if (classInfo.teacherId !== user.teacherId) {
                    router.push('/');
                    return;
                }

                setClassData(classInfo);
                setStudents(classStudents);
                setBehaviors(teacherBehaviors);
                if (focusList) {
                    setFocusStudentIds(focusList.studentIds);
                    setFocusListId(focusList.focusListId);
                }
            } catch (err: any) {
                console.error('Error loading class data:', err);
                setError('Failed to load class data. ' + err.message);
            } finally {
                setLoadingClass(false);
            }
        };

        if (user && classId) {
            loadData();
        }
    }, [user, classId, router]);

    const saveFocusListToFirestore = async (ids: string[]) => {
        if (!user?.teacherId || !classId) return;

        const listId = focusListId || uuidv4();
        if (!focusListId) setFocusListId(listId);

        const focusListData: FocusList = {
            focusListId: listId,
            teacherId: user.teacherId,
            classId: classId,
            studentIds: ids,
            lastUpdated: new Date()
        };

        try {
            await saveFocusList(focusListData);
        } catch (error) {
            console.error('Error saving focus list:', error);
        }
    };

    const addToFocus = async (studentId: string) => {
        if (!focusStudentIds.includes(studentId)) {
            const newIds = [...focusStudentIds, studentId];
            setFocusStudentIds(newIds);
            await saveFocusListToFirestore(newIds);
        }
    };

    const removeFromFocus = async (studentId: string) => {
        const newIds = focusStudentIds.filter(id => id !== studentId);
        setFocusStudentIds(newIds);
        await saveFocusListToFirestore(newIds);
    };

    const handleStudentAdded = async () => {
        if (classId) {
            const classStudents = await getStudentsByClass(classId);
            setStudents(classStudents);
            setShowStudentForm(false);
            setEditingStudent(null);
        }
    };

    const handleStudentUpdate = async () => {
        if (classId) {
            const classStudents = await getStudentsByClass(classId);
            setStudents(classStudents);
        }
    };

    const handleDeleteStudent = async (studentId: string) => {
        if (confirm('Are you sure you want to remove this student from the class? This action cannot be undone.')) {
            try {
                await deleteStudent(studentId);
                setStudents(students.filter(s => s.studentId !== studentId));
                const newIds = focusStudentIds.filter(id => id !== studentId);
                setFocusStudentIds(newIds);
                await saveFocusListToFirestore(newIds);
            } catch (error) {
                console.error('Error deleting student:', error);
                alert('Failed to delete student');
            }
        }
    };

    const handleEditStudent = (student: Student) => {
        setEditingStudent(student);
        setIsBulkImportMode(false);
        setShowStudentForm(true);
    };

    const handleManageBehaviors = (student: Student) => {
        setManagingBehaviorsStudent(student);
    };

    const handleBehaviorCreated = (newBehavior: Behavior) => {
        setBehaviors([...behaviors, newBehavior]);
    };

    if (authLoading || !user || loadingClass) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!classData) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-lg text-secondary">Class not found</div>
            </div>
        );
    }

    const focusStudents = students.filter((s) => focusStudentIds.includes(s.studentId));
    const rosterStudents = students.filter((s) => !focusStudentIds.includes(s.studentId));

    return (
        <div className="h-screen flex flex-col bg-gray-50">
            {error && (
                <div className="bg-red-50 border-b border-red-200 px-6 py-3">
                    <p className="text-red-600">{error}</p>
                </div>
            )}

            {/* Context Bar (Class Header) */}
            <div className="bg-white border-b border-gray-200 flex flex-col">
                {/* Row 1: Class Info & Actions */}
                <div className="px-6 py-6 flex items-center justify-between">
                    {/* Left: Class Info */}
                    <div className="flex items-baseline space-x-3">
                        <h2 className="text-2xl font-bold text-gray-900">{classData.className}</h2>
                        <span className="text-gray-500">
                            {classData.period && `Period ${classData.period} • `}
                            {students.length} students
                        </span>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={() => {
                                setEditingStudent(null);
                                setIsBulkImportMode(false);
                                setShowStudentForm(true);
                            }}
                            className="text-sm text-primary hover:text-cyan-700 font-medium flex items-center space-x-1 transition-colors px-3 py-1.5 rounded-md hover:bg-cyan-50"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            <span>Add Student</span>
                        </button>

                        <button
                            onClick={() => router.push(`/classes/${classId}/behaviors`)}
                            className="text-sm text-primary hover:text-cyan-700 font-medium flex items-center space-x-1 transition-colors px-3 py-1.5 rounded-md hover:bg-cyan-50"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span>Configure</span>
                        </button>
                    </div>
                </div>

                {/* Row 2: Tabs */}
                <div className="px-6 flex items-center justify-between relative">
                    <div className="flex space-x-8 translate-y-px">
                        <button
                            onClick={() => setCurrentView('monitoring')}
                            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${currentView === 'monitoring'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            Live Monitoring
                        </button>
                        <button
                            onClick={() => setCurrentView('analytics')}
                            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${currentView === 'analytics'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            Data Analysis
                        </button>
                    </div>
                </div>
            </div>

            {/* Content Area - Conditional Rendering */}
            {currentView === 'monitoring' ? (
                /* Split Screen: Master Roster + Focus Zone */
                <div className="flex-1 flex overflow-hidden">
                    {/* Master Roster - Left Sidebar */}
                    <MasterRoster
                        students={rosterStudents}
                        onStudentClick={addToFocus}
                        onDeleteStudent={handleDeleteStudent}
                        onEditStudent={handleEditStudent}
                        onManageBehaviors={handleManageBehaviors}
                    />

                    {/* Focus Zone - Right Panel */}
                    <FocusZone
                        students={focusStudents}
                        onRemoveStudent={removeFromFocus}
                        classId={classId}
                        onStudentUpdate={handleStudentUpdate}
                    />
                </div>
            ) : (
                /* Data Analysis View */
                <DataAnalysisView
                    students={students}
                    classId={classId}
                    selectedStudentId={analyticsStudentId}
                    dateRange={analyticsDateRange}
                    onStudentChange={setAnalyticsStudentId}
                    onDateRangeChange={setAnalyticsDateRange}
                />
            )}

            {/* Student Form Modal */}
            {showStudentForm && (
                <div className="modal-overlay" onClick={() => setShowStudentForm(false)}>
                    <div className="modal-content p-6" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold">
                                {editingStudent ? 'Edit Student' : 'Add Student'}
                            </h2>
                            <button
                                onClick={() => setShowStudentForm(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Mode Tabs - Only show if NOT editing */}
                        {!editingStudent && (
                            <div className="flex space-x-4 border-b border-gray-200 mb-6">
                                <button
                                    className={`pb-2 text-sm font-medium transition-colors ${!isBulkImportMode
                                        ? 'border-b-2 border-primary text-primary'
                                        : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                    onClick={() => setIsBulkImportMode(false)}
                                >
                                    Manual Entry
                                </button>
                                <button
                                    className={`pb-2 text-sm font-medium transition-colors ${isBulkImportMode
                                        ? 'border-b-2 border-primary text-primary'
                                        : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                    onClick={() => setIsBulkImportMode(true)}
                                >
                                    Bulk Import from Image
                                </button>
                            </div>
                        )}

                        {isBulkImportMode && !editingStudent ? (
                            <BulkStudentImport
                                classId={classId}
                                onSuccess={handleStudentAdded}
                                onCancel={() => setShowStudentForm(false)}
                            />
                        ) : (
                            <StudentForm
                                classId={classId}
                                onSuccess={handleStudentAdded}
                                onCancel={() => setShowStudentForm(false)}
                                initialData={editingStudent || undefined}
                            />
                        )}
                    </div>
                </div>
            )}

            {/* Assign Behaviors Modal */}
            {managingBehaviorsStudent && (
                <AssignFocusBehaviorsModal
                    student={managingBehaviorsStudent}
                    behaviors={behaviors}
                    onClose={() => setManagingBehaviorsStudent(null)}
                    onSuccess={async () => {
                        // Re-fetch students to update any behavior assignments displayed
                        const updatedStudents = await getStudentsByClass(classId);
                        setStudents(updatedStudents);
                    }}
                    onBehaviorCreated={handleBehaviorCreated}
                />
            )}
        </div>
    );
}
