'use client';

import { Student } from '@/types';
import StudentCard from './StudentCard';
import { useState, useEffect } from 'react';

interface MasterRosterProps {
    students: Student[];
    onStudentClick: (studentId: string) => void;
    onDeleteStudent?: (studentId: string) => void;
    onEditStudent?: (student: Student) => void;
    onManageBehaviors?: (student: Student) => void;
}

export default function MasterRoster({
    students,
    onStudentClick,
    onDeleteStudent,
    onEditStudent,
    onManageBehaviors
}: MasterRosterProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [isDeleteMode, setIsDeleteMode] = useState(false);
    const [activeMenu, setActiveMenu] = useState<{ id: string; top: number; left: number } | null>(null);

    const filteredStudents = students.filter((student) =>
        `${student.firstName} ${student.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleStudentClick = (studentId: string) => {
        if (isDeleteMode) {
            if (onDeleteStudent) {
                onDeleteStudent(studentId);
            }
        } else {
            onStudentClick(studentId);
        }
    };

    const handleMenuClick = (e: React.MouseEvent, studentId: string) => {
        e.stopPropagation();
        e.preventDefault();

        if (activeMenu?.id === studentId) {
            setActiveMenu(null);
        } else {
            const rect = e.currentTarget.getBoundingClientRect();
            setActiveMenu({
                id: studentId,
                top: rect.bottom + 5,
                left: rect.right - 192, // Align right edge (w-48 is 192px)
            });
        }
    };

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = () => setActiveMenu(null);
        window.addEventListener('click', handleClickOutside);
        return () => window.removeEventListener('click', handleClickOutside);
    }, []);

    const handleScroll = () => {
        if (activeMenu) setActiveMenu(null);
    };

    return (
        <div className="roster-sidebar w-80 p-4 flex flex-col h-full relative">
            <div className="mb-4 flex-shrink-0">
                <h2 className="text-lg font-bold text-gray-700">Master Roster</h2>
                <p className="text-xs text-gray-500 mb-3">
                    {isDeleteMode ? 'Select a student to remove' : 'Select students to monitor'}
                </p>

                {/* Search */}
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search students..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="input text-sm"
                    />
                    <svg
                        className="w-5 h-5 text-gray-400 absolute right-3 top-2.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                    </svg>
                </div>
            </div>

            {/* Student List */}
            <div
                className="space-y-2 overflow-y-auto flex-1 pb-20"
                onScroll={handleScroll}
            >
                {filteredStudents.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-sm text-gray-500">
                            {searchTerm ? 'No students found' : 'No students in roster'}
                        </p>
                    </div>
                ) : (
                    filteredStudents.map((student) => (
                        <div
                            key={student.studentId}
                            onClick={() => handleStudentClick(student.studentId)}
                            className={`cursor-pointer group relative transition-all duration-200 ${isDeleteMode ? 'hover:opacity-75' : ''}`}
                        >
                            <div className={`${isDeleteMode ? 'ring-2 ring-red-400 rounded-lg' : ''}`}>
                                <StudentCard student={student} variant="roster" />
                            </div>

                            {/* Hover Actions - Only show when NOT in delete mode */}
                            {!isDeleteMode && (
                                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-2">
                                    {/* Settings Button */}
                                    <button
                                        onClick={(e) => handleMenuClick(e, student.studentId)}
                                        className="w-8 h-8 bg-white text-gray-500 hover:text-primary hover:bg-gray-50 rounded-full flex items-center justify-center shadow-md border border-gray-200 transition-colors"
                                        title="Student Settings"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                    </button>

                                    {/* Add Button */}
                                    <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center shadow-md">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                    </div>
                                </div>
                            )}

                            {/* Delete Mode Indicator Overlay */}
                            {isDeleteMode && (
                                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                    <div className="w-8 h-8 bg-red-100 text-red-500 rounded-full flex items-center justify-center shadow-sm">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Fixed Menu Dropdown */}
            {activeMenu && (
                <div
                    className="fixed bg-white rounded-md shadow-lg py-1 z-50 ring-1 ring-black ring-opacity-5 w-48"
                    style={{ top: activeMenu.top, left: activeMenu.left }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {onEditStudent && (
                        <button
                            onClick={() => {
                                const student = students.find(s => s.studentId === activeMenu.id);
                                if (student) onEditStudent(student);
                                setActiveMenu(null);
                            }}
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                            Edit Details
                        </button>
                    )}
                    {onManageBehaviors && (
                        <button
                            onClick={() => {
                                const student = students.find(s => s.studentId === activeMenu.id);
                                if (student) onManageBehaviors(student);
                                setActiveMenu(null);
                            }}
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                            Manage Behaviors
                        </button>
                    )}
                </div>
            )}

            {/* Bottom Actions */}
            {onDeleteStudent && (
                <div className="pt-4 mt-2 border-t border-gray-200">
                    <button
                        onClick={() => setIsDeleteMode(!isDeleteMode)}
                        className={`w-full flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${isDeleteMode
                            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            : 'text-red-600 hover:bg-red-50'
                            }`}
                    >
                        {isDeleteMode ? (
                            <>
                                <span className="mr-2">Done Removing</span>
                            </>
                        ) : (
                            <>
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Remove Student
                            </>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
}
