'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { getClassesByTeacher, deleteClass, getStudentsByClass } from '@/lib/firestore';
import { Class } from '@/types';
import Link from 'next/link';
import { v4 as uuidv4 } from 'uuid';
import ClassForm from '@/components/ClassForm';

export default function Dashboard() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [classes, setClasses] = useState<Class[]>([]);
    const [loadingClasses, setLoadingClasses] = useState(true);
    const [showClassForm, setShowClassForm] = useState(false);
    const [studentCounts, setStudentCounts] = useState<Record<string, number>>({});

    useEffect(() => {
        if (!loading && !user) {
            router.push('/');
        }
    }, [user, loading, router]);

    const [error, setError] = useState('');

    useEffect(() => {
        const loadClasses = async () => {
            if (user) {
                try {
                    setError('');
                    const teacherClasses = await getClassesByTeacher(user.teacherId);
                    setClasses(teacherClasses);
                } catch (err: any) {
                    console.error('Error loading classes:', err);
                    setError('Failed to load classes. ' + err.message);
                } finally {
                    setLoadingClasses(false);
                }
            }
        };

        loadClasses();
    }, [user]);

    // Load student counts for each class
    useEffect(() => {
        const loadStudentCounts = async () => {
            const counts: Record<string, number> = {};
            for (const classItem of classes) {
                const students = await getStudentsByClass(classItem.classId);
                counts[classItem.classId] = students.length;
            }
            setStudentCounts(counts);
        };

        if (classes.length > 0) {
            loadStudentCounts();
        }
    }, [classes]);

    const handleClassCreated = async () => {
        // Reload classes
        if (user) {
            try {
                const teacherClasses = await getClassesByTeacher(user.teacherId);
                setClasses(teacherClasses);
                setShowClassForm(false);
            } catch (err: any) {
                console.error('Error reloading classes:', err);
                setError('Failed to refresh list. ' + err.message);
            }
        }
    };

    const handleDeleteClass = async (classId: string) => {
        if (!confirm('Are you sure you want to delete this class? This cannot be undone.')) {
            return;
        }

        try {
            await deleteClass(classId);
            // Remove from local state immediately
            setClasses(classes.filter(c => c.classId !== classId));
        } catch (err: any) {
            console.error('Error deleting class:', err);
            setError('Failed to delete class. ' + err.message);
        }
    };

    if (loading || !user) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-lg text-secondary">Loading...</div>
            </div>
        );
    }

    // Calculate stats
    const totalStudents = Object.values(studentCounts).reduce((a, b) => a + b, 0);

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header with inline Create button */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-display font-bold mb-2 text-gray-900">
                        Welcome, {user.displayName}
                    </h1>
                    <p className="text-gray-500">Manage your classes and monitor student progress</p>
                </div>
                <button
                    onClick={() => setShowClassForm(true)}
                    className="btn btn-primary flex items-center space-x-2 px-6 py-2.5 shadow-md hover:shadow-lg transition-all"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span className="font-semibold">Create New Class</span>
                </button>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                    {error}
                </div>
            )}

            {/* Quick Stats Row */}
            {!loadingClasses && classes.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex items-center space-x-4">
                        <div className="p-3 bg-blue-50 rounded-full text-blue-600">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Active Classes</p>
                            <p className="text-2xl font-bold text-gray-900">{classes.length}</p>
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex items-center space-x-4">
                        <div className="p-3 bg-green-50 rounded-full text-green-600">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Total Students</p>
                            <p className="text-2xl font-bold text-gray-900">{totalStudents}</p>
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex items-center space-x-4">
                        <div className="p-3 bg-orange-50 rounded-full text-orange-600">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Pending Behaviors</p>
                            <p className="text-2xl font-bold text-gray-900">0</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Classes Grid */}
            {
                loadingClasses ? (
                    <div className="text-center py-12">
                        <p className="text-gray-500">Loading your classes...</p>
                    </div>
                ) : classes.length === 0 ? (
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
                                d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                            />
                        </svg>
                        <h3 className="text-xl font-semibold mb-2">No classes yet</h3>
                        <p className="text-gray-600 mb-4">
                            Get started by creating your first class
                        </p>
                        <button onClick={() => setShowClassForm(true)} className="btn btn-primary">
                            Create Class
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {classes.map((classItem, index) => {
                            // Generate color based on period or index
                            const colors = [
                                { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
                                { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200' },
                                { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200' },
                                { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200' },
                                { bg: 'bg-pink-50', text: 'text-pink-600', border: 'border-pink-200' },
                                { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-200' },
                            ];
                            const colorScheme = colors[index % colors.length];

                            // Get student count for this class
                            const studentCount = studentCounts[classItem.classId] || 0;

                            return (
                                <div
                                    key={classItem.classId}
                                    className="relative group"
                                >
                                    {/* Meatball Menu */}
                                    <div className="absolute top-4 right-4 z-10">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const menu = e.currentTarget.nextElementSibling as HTMLElement;
                                                menu?.classList.toggle('hidden');
                                            }}
                                            onBlur={(e) => {
                                                // Delay to allow click on menu item
                                                setTimeout(() => {
                                                    const menu = e.currentTarget.nextElementSibling as HTMLElement;
                                                    menu?.classList.add('hidden');
                                                }, 200);
                                            }}
                                            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
                                            title="Options"
                                        >
                                            <svg className="w-5 h-5 text-gray-400 hover:text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                                            </svg>
                                        </button>
                                        {/* Dropdown Menu */}
                                        <div className="hidden absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteClass(classItem.classId);
                                                }}
                                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                                <span>Delete Class</span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Clickable Card with Hover Effects */}
                                    <Link
                                        href={`/classes/${classItem.classId}`}
                                        className={`block card hover:shadow-lg hover:-translate-y-1 hover:border-primary border-2 border-transparent transition-all duration-200 overflow-hidden`}
                                    >
                                        {/* Card Content - Horizontal Layout with Vertical Centering */}
                                        <div className="p-4 relative">
                                            <div className="flex items-center space-x-4">
                                                {/* Tinted Icon - Left Side */}
                                                <div className={`w-12 h-12 ${colorScheme.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                                                    <svg
                                                        className={`w-6 h-6 ${colorScheme.text}`}
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                                                        />
                                                    </svg>
                                                </div>

                                                {/* Text Content - Right Side */}
                                                <div className="flex-1 min-w-0">
                                                    {/* Class Name */}
                                                    <h3 className="text-xl font-bold mb-1 truncate text-gray-900">{classItem.className}</h3>

                                                    {/* Period, Year, and Student Count - Inline with Bold Count */}
                                                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                                                        {classItem.period && (
                                                            <>
                                                                <span className="font-medium text-gray-600">Period {classItem.period}</span>
                                                                <span>•</span>
                                                            </>
                                                        )}
                                                        <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                                                            {studentCount} {studentCount === 1 ? 'Student' : 'Students'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                </div>
                            );
                        })}
                    </div>
                )
            }

            {/* Class Form Modal */}
            {
                showClassForm && (
                    <div className="modal-overlay" onClick={() => setShowClassForm(false)}>
                        <div className="modal-content p-6" onClick={(e) => e.stopPropagation()}>
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold">Create New Class</h2>
                                <button
                                    onClick={() => setShowClassForm(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            <ClassForm
                                teacherId={user.teacherId}
                                onSuccess={handleClassCreated}
                                onCancel={() => setShowClassForm(false)}
                            />
                        </div>
                    </div>
                )
            }
        </div >
    );
}
