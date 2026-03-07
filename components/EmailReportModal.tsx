import { useState } from 'react';
import { Student, Incident, Behavior } from '@/types';

interface EmailReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    student: Student | undefined;
    incidents: Incident[];
    behaviors: Behavior[];
    dateRange: string;
    focusedBehaviorId?: string;
}

export default function EmailReportModal({
    isOpen,
    onClose,
    student,
    incidents,
    behaviors,
    dateRange,
    focusedBehaviorId
}: EmailReportModalProps) {
    const [commentary, setCommentary] = useState('');
    const [generatedReport, setGeneratedReport] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [copySuccess, setCopySuccess] = useState(false);

    if (!isOpen) return null;

    const handleGenerateAI = async () => {
        if (!student) return;

        setIsGenerating(true);
        try {
            const response = await fetch('/api/generate-report', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    studentName: `${student.firstName} ${student.lastName}`,
                    dateRange,
                    incidents,
                    behaviors: behaviors.reduce((acc, b) => ({ ...acc, [b.behaviorId]: b.name }), {}),
                    customNotes: commentary,
                    focusedBehaviorId
                }),
            });

            const data = await response.json();
            if (data.report) {
                setGeneratedReport(data.report);
            } else {
                console.error('Failed to generate report:', data.error);
                alert('Failed to generate report. Please try again.');
            }
        } catch (error) {
            console.error('Error calling AI:', error);
            alert('An error occurred while generating the report.');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(generatedReport);
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-floating w-full max-w-2xl max-h-[90vh] flex flex-col border border-white/50 my-8">
                <div className="flex justify-between items-center p-6 sm:p-8 border-b border-slate-100">
                    <h2 className="text-2xl font-display font-bold text-slate-900 tracking-tight">Email Parent Report</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 p-2 rounded-full transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {student ? (
                    <div className="space-y-6 flex-1 overflow-y-auto p-6 sm:p-8">
                        {/* Input Section */}
                        <div className="bg-slate-50/80 p-5 rounded-xl space-y-3 border border-slate-100">
                            <label className="block text-sm font-semibold text-slate-700 uppercase tracking-wider">
                                Teacher's Notes (Optional)
                            </label>
                            <p className="text-xs text-slate-500 font-medium pb-1">
                                Add any specific context, positive shout-outs, or concerns you want the AI to include.
                            </p>
                            <textarea
                                value={commentary}
                                onChange={(e) => setCommentary(e.target.value)}
                                className="w-full border border-slate-200 rounded-xl p-4 h-28 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all resize-none shadow-inner"
                                placeholder="e.g., He had a great improvement in focus this week, but struggled a bit with peer interactions on Tuesday..."
                            />
                            <div className="flex justify-end pt-2">
                                <button
                                    onClick={handleGenerateAI}
                                    disabled={isGenerating}
                                    className={`flex items-center px-5 py-2.5 rounded-xl text-white text-sm font-semibold transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 ${isGenerating ? 'bg-slate-400 cursor-not-allowed shadow-none hover:translate-y-0' : 'bg-gradient-to-r from-primary to-accent hover:opacity-90'
                                        }`}
                                >
                                    {isGenerating ? (
                                        <>
                                            <svg className="animate-spin -ml-1 mr-2.5 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Generating Report...
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                            </svg>
                                            Generate with AI
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Output Section */}
                        {generatedReport && (
                            <div className="space-y-3 pt-2">
                                <div className="flex justify-between items-center">
                                    <label className="block text-sm font-semibold text-slate-700 uppercase tracking-wider">
                                        Generated Email Draft
                                    </label>
                                    <button
                                        onClick={handleCopy}
                                        className={`text-sm font-medium flex items-center px-3 py-1.5 rounded-lg transition-colors border ${copySuccess
                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                            : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200 shadow-sm'
                                            }`}
                                    >
                                        {copySuccess ? (
                                            <>
                                                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                                Copied!
                                            </>
                                        ) : (
                                            <>
                                                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                                                </svg>
                                                Copy to Clipboard
                                            </>
                                        )}
                                    </button>
                                </div>
                                <textarea
                                    value={generatedReport}
                                    onChange={(e) => setGeneratedReport(e.target.value)}
                                    className="w-full border border-slate-200 rounded-xl p-5 h-64 font-mono text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors shadow-inner whitespace-pre-wrap leading-relaxed text-slate-800"
                                />
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-center py-12 p-6 sm:p-8">
                        <p className="text-slate-600 font-medium mb-6">
                            Please select a specific student to generate a parent report.
                        </p>
                        <button
                            onClick={onClose}
                            className="btn btn-outline"
                        >
                            Close
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
