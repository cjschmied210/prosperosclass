'use client';

import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { createStudent } from '@/lib/firestore';
import { Student } from '@/types';

interface BulkStudentImportProps {
    classId: string;
    onSuccess: () => void;
    onCancel: () => void;
}

export default function BulkStudentImport({ classId, onSuccess, onCancel }: BulkStudentImportProps) {
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [extractedStudents, setExtractedStudents] = useState<{ firstName: string; lastName: string }[]>([]);
    const [step, setStep] = useState<'upload' | 'review'>('upload');
    const [error, setError] = useState('');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            const url = URL.createObjectURL(selectedFile);
            setPreviewUrl(url);
            setError('');
        }
    };

    const handleProcessImage = async () => {
        if (!file) return;

        setIsProcessing(true);
        setError('');

        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('/api/process-roster', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to process image');
            }

            setExtractedStudents(data.students);
            setStep('review');
        } catch (err: any) {
            console.error('Error processing image:', err);
            setError(err.message || 'Failed to process image. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleNameChange = (index: number, field: 'firstName' | 'lastName', value: string) => {
        const updated = [...extractedStudents];
        updated[index] = { ...updated[index], [field]: value };
        setExtractedStudents(updated);
    };

    const removeStudent = (index: number) => {
        setExtractedStudents(extractedStudents.filter((_, i) => i !== index));
    };

    const addStudentRow = () => {
        setExtractedStudents([...extractedStudents, { firstName: '', lastName: '' }]);
    };

    const handleImport = async () => {
        setIsProcessing(true);
        try {
            const promises = extractedStudents
                .filter(s => s.firstName && s.lastName)
                .map(s => {
                    const student: Student = {
                        studentId: uuidv4(),
                        classId,
                        firstName: s.firstName,
                        lastName: s.lastName,
                        grade: '', // Default empty
                        parentContacts: [],
                        documentIds: [],
                        createdAt: new Date(),
                    };
                    return createStudent(student);
                });

            await Promise.all(promises);
            onSuccess();
        } catch (err: any) {
            console.error('Error importing students:', err);
            setError('Failed to import students. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="space-y-6">
            {step === 'upload' ? (
                <div className="space-y-6">
                    <div className="border border-dashed border-primary/30 rounded-2xl p-10 text-center hover:bg-primary/5 hover:border-primary/50 transition-all bg-white/50 backdrop-blur-sm group">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="hidden"
                            id="roster-upload"
                        />
                        <label htmlFor="roster-upload" className="cursor-pointer flex flex-col items-center">
                            <div className="w-16 h-16 bg-white rounded-full shadow-sm border border-slate-100 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                                <svg className="w-8 h-8 text-primary/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <span className="text-slate-800 font-semibold text-lg">Click to upload a screenshot</span>
                            <span className="text-sm text-slate-500 font-medium mt-1">PNG, JPG up to 5MB</span>
                        </label>
                    </div>

                    {previewUrl && (
                        <div className="relative rounded-2xl overflow-hidden border border-slate-200 h-56 shadow-inner bg-slate-50">
                            <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
                        </div>
                    )}

                    {error && (
                        <div className="p-4 bg-rose-50 border border-rose-100 text-rose-700 text-sm font-medium rounded-xl flex items-center shadow-sm">
                            <svg className="w-5 h-5 mr-3 text-rose-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            {error}
                        </div>
                    )}

                    <div className="flex space-x-4 pt-4 border-t border-slate-100">
                        <button
                            onClick={onCancel}
                            className="flex-1 px-5 py-3 border border-slate-200 rounded-xl text-slate-700 font-semibold hover:bg-slate-50 transition-colors shadow-sm"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleProcessImage}
                            disabled={!file || isProcessing}
                            className={`flex-1 px-5 py-3 rounded-xl text-white font-semibold transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 ${!file || isProcessing
                                ? 'bg-slate-400 cursor-not-allowed shadow-none hover:translate-y-0'
                                : 'bg-gradient-to-r from-primary to-accent hover:opacity-90'
                                }`}
                        >
                            {isProcessing ? 'Processing...' : 'Scan Roster'}
                        </button>
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="flex justify-between items-center px-2">
                        <h3 className="text-xl font-display font-bold text-slate-900 tracking-tight">Review Students <span className="text-slate-500 font-medium ml-1 bg-slate-100 px-2.5 py-1 rounded-full text-sm">({extractedStudents.length})</span></h3>
                        <button onClick={addStudentRow} className="text-sm font-semibold text-primary hover:text-primary/80 flex items-center bg-primary/5 px-3 py-1.5 rounded-lg border border-primary/10 transition-colors">
                            + Add Row
                        </button>
                    </div>

                    <div className="max-h-[60vh] overflow-y-auto border border-slate-200 rounded-2xl shadow-inner bg-slate-50/50">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-white/90 backdrop-blur-md sticky top-0 z-10 shadow-sm">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">First Name</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Last Name</th>
                                    <th className="px-4 py-4 w-12"></th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-100">
                                {extractedStudents.map((student, index) => (
                                    <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-4 py-3">
                                            <input
                                                type="text"
                                                value={student.firstName}
                                                onChange={(e) => handleNameChange(index, 'firstName', e.target.value)}
                                                className="w-full border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors bg-white shadow-sm"
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <input
                                                type="text"
                                                value={student.lastName}
                                                onChange={(e) => handleNameChange(index, 'lastName', e.target.value)}
                                                className="w-full border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors bg-white shadow-sm"
                                            />
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <button
                                                onClick={() => removeStudent(index)}
                                                className="text-rose-400 hover:text-rose-600 bg-white hover:bg-rose-50 p-2 rounded-lg transition-colors border border-transparent hover:border-rose-100"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex space-x-4 pt-6 border-t border-slate-100">
                        <button
                            onClick={() => setStep('upload')}
                            className="flex-1 px-5 py-3 border border-slate-200 rounded-xl text-slate-700 font-semibold hover:bg-slate-50 transition-colors shadow-sm"
                        >
                            Back
                        </button>
                        <button
                            onClick={handleImport}
                            disabled={isProcessing || extractedStudents.length === 0}
                            className={`flex-1 px-5 py-3 rounded-xl text-white font-semibold transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 ${isProcessing || extractedStudents.length === 0
                                ? 'bg-slate-400 cursor-not-allowed shadow-none hover:translate-y-0'
                                : 'bg-emerald-500 hover:bg-emerald-600'
                                }`}
                        >
                            {isProcessing ? 'Importing...' : `Import ${extractedStudents.length} Students`}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
