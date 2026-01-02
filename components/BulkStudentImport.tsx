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
                <div className="space-y-4">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:bg-gray-50 transition-colors">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="hidden"
                            id="roster-upload"
                        />
                        <label htmlFor="roster-upload" className="cursor-pointer flex flex-col items-center">
                            <svg className="w-12 h-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="text-gray-600 font-medium">Click to upload a screenshot</span>
                            <span className="text-sm text-gray-500 mt-1">PNG, JPG up to 5MB</span>
                        </label>
                    </div>

                    {previewUrl && (
                        <div className="relative rounded-lg overflow-hidden border border-gray-200 h-48">
                            <img src={previewUrl} alt="Preview" className="w-full h-full object-contain bg-gray-50" />
                        </div>
                    )}

                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                            {error}
                        </div>
                    )}

                    <div className="flex space-x-3 pt-4">
                        <button
                            onClick={onCancel}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleProcessImage}
                            disabled={!file || isProcessing}
                            className={`flex-1 px-4 py-2 rounded-md text-white font-medium ${!file || isProcessing
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-primary hover:bg-cyan-700'
                                }`}
                        >
                            {isProcessing ? 'Processing...' : 'Scan Roster'}
                        </button>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="font-semibold text-gray-900">Review Students ({extractedStudents.length})</h3>
                        <button onClick={addStudentRow} className="text-sm text-primary hover:underline">
                            + Add Row
                        </button>
                    </div>

                    <div className="max-h-[60vh] overflow-y-auto border border-gray-200 rounded-lg">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">First Name</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Last Name</th>
                                    <th className="px-4 py-2 w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {extractedStudents.map((student, index) => (
                                    <tr key={index}>
                                        <td className="px-2 py-2">
                                            <input
                                                type="text"
                                                value={student.firstName}
                                                onChange={(e) => handleNameChange(index, 'firstName', e.target.value)}
                                                className="w-full border-gray-300 rounded-md text-sm focus:ring-primary focus:border-primary"
                                            />
                                        </td>
                                        <td className="px-2 py-2">
                                            <input
                                                type="text"
                                                value={student.lastName}
                                                onChange={(e) => handleNameChange(index, 'lastName', e.target.value)}
                                                className="w-full border-gray-300 rounded-md text-sm focus:ring-primary focus:border-primary"
                                            />
                                        </td>
                                        <td className="px-2 py-2 text-center">
                                            <button
                                                onClick={() => removeStudent(index)}
                                                className="text-red-400 hover:text-red-600"
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

                    <div className="flex space-x-3 pt-4">
                        <button
                            onClick={() => setStep('upload')}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                        >
                            Back
                        </button>
                        <button
                            onClick={handleImport}
                            disabled={isProcessing || extractedStudents.length === 0}
                            className={`flex-1 px-4 py-2 rounded-md text-white font-medium ${isProcessing || extractedStudents.length === 0
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-green-600 hover:bg-green-700'
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
