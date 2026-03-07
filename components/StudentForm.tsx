'use client';

import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { createStudent, updateStudent } from '@/lib/firestore';
import { Student, ParentContact } from '@/types';

interface StudentFormProps {
    classId: string;
    onSuccess: () => void;
    onCancel: () => void;
    initialData?: Student;
}

export default function StudentForm({ classId, onSuccess, onCancel, initialData }: StudentFormProps) {
    const [formData, setFormData] = useState({
        firstName: initialData?.firstName || '',
        lastName: initialData?.lastName || '',
        grade: initialData?.grade || '',
    });
    const [parentContacts, setParentContacts] = useState<ParentContact[]>(
        initialData?.parentContacts || [{ name: '', email: '', phone: '', relationship: 'Parent' }]
    );
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleParentChange = (index: number, field: keyof ParentContact, value: string) => {
        const updated = [...parentContacts];
        updated[index] = { ...updated[index], [field]: value };
        setParentContacts(updated);
    };

    const addParentContact = () => {
        setParentContacts([...parentContacts, { name: '', email: '', phone: '', relationship: 'Parent' }]);
    };

    const removeParentContact = (index: number) => {
        setParentContacts(parentContacts.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            // Filter out empty parent contacts
            const validParents = parentContacts.filter(p => p.name && p.email);

            if (initialData) {
                await updateStudent(initialData.studentId, {
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    grade: formData.grade,
                    parentContacts: validParents,
                });
            } else {
                const student: Student = {
                    studentId: uuidv4(),
                    classId,
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    grade: formData.grade,
                    parentContacts: validParents,
                    documentIds: [],
                    focusBehaviorIds: [],
                    createdAt: new Date(),
                };
                await createStudent(student);
            }

            onSuccess();
        } catch (err: any) {
            setError(err.message || 'Failed to save student');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
                <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-center shadow-sm">
                    <svg className="w-5 h-5 mr-3 text-rose-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <p className="text-sm font-medium text-rose-700">{error}</p>
                </div>
            )}

            {/* Student Information */}
            <div className="space-y-4">
                <h3 className="font-semibold text-sm text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-2">Student Information</h3>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="firstName" className="label">
                            First Name *
                        </label>
                        <input
                            type="text"
                            id="firstName"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleChange}
                            className="input"
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="lastName" className="label">
                            Last Name *
                        </label>
                        <input
                            type="text"
                            id="lastName"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleChange}
                            className="input"
                            required
                        />
                    </div>
                </div>

                <div>
                    <label htmlFor="grade" className="label">
                        Grade (Optional)
                    </label>
                    <input
                        type="text"
                        id="grade"
                        name="grade"
                        value={formData.grade}
                        onChange={handleChange}
                        className="input"
                        placeholder="e.g., 9, 10"
                    />
                </div>
            </div>

            {/* Parent Contact Information */}
            <div className="space-y-4 pt-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h3 className="font-semibold text-sm text-slate-700 uppercase tracking-wider">Parent Contact Information</h3>
                    <button
                        type="button"
                        onClick={addParentContact}
                        className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors flex items-center bg-primary/5 px-3 py-1.5 rounded-lg border border-primary/10 hover:bg-primary/10"
                    >
                        <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add Parent
                    </button>
                </div>

                {parentContacts.map((parent, index) => (
                    <div key={index} className="bg-slate-50/50 border border-slate-200 rounded-xl p-5 space-y-4 relative group hover:border-slate-300 transition-colors shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Contact {index + 1}</span>
                            {parentContacts.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => removeParentContact(index)}
                                    className="text-xs font-medium text-rose-500 hover:text-rose-700 hover:bg-rose-50 px-2.5 py-1.5 rounded-lg transition-colors border border-transparent hover:border-rose-100 absolute top-3 right-3 opacity-0 group-hover:opacity-100"
                                >
                                    Remove
                                </button>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="label text-xs">Name</label>
                                <input
                                    type="text"
                                    value={parent.name}
                                    onChange={(e) => handleParentChange(index, 'name', e.target.value)}
                                    className="input text-sm"
                                    placeholder="Full name"
                                />
                            </div>

                            <div>
                                <label className="label text-xs">Relationship</label>
                                <input
                                    type="text"
                                    value={parent.relationship}
                                    onChange={(e) => handleParentChange(index, 'relationship', e.target.value)}
                                    className="input text-sm"
                                    placeholder="Mother, Father, Guardian"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="label text-xs">Email</label>
                                <input
                                    type="email"
                                    value={parent.email}
                                    onChange={(e) => handleParentChange(index, 'email', e.target.value)}
                                    className="input text-sm"
                                    placeholder="parent@email.com"
                                />
                            </div>

                            <div>
                                <label className="label text-xs">Phone (Optional)</label>
                                <input
                                    type="tel"
                                    value={parent.phone}
                                    onChange={(e) => handleParentChange(index, 'phone', e.target.value)}
                                    className="input text-sm"
                                    placeholder="(555) 123-4567"
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Submit Buttons */}
            <div className="flex space-x-4 pt-6 mt-2 border-t border-slate-100">
                <button
                    type="button"
                    onClick={onCancel}
                    className="btn btn-outline flex-1"
                    disabled={isLoading}
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    className="btn btn-primary flex-1 shadow-md hover:shadow-lg transition-all"
                    disabled={isLoading}
                >
                    {isLoading ? 'Saving...' : initialData ? 'Update Student' : 'Add Student'}
                </button>
            </div>
        </form>
    );
}
