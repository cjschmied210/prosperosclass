'use client';

import { useState } from 'react';

interface IEPAnalysisModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAddBehavior: (label: string, type: 'positive' | 'negative') => void;
    studentName: string;
}

interface AnalysisResult {
    positive: string[];
    negative: string[];
}

export default function IEPAnalysisModal({ isOpen, onClose, onAddBehavior, studentName }: IEPAnalysisModalProps) {
    const [text, setText] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [results, setResults] = useState<AnalysisResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleAnalyze = async () => {
        if (!text.trim()) return;

        setIsAnalyzing(true);
        setError(null);
        setResults(null);

        try {
            const response = await fetch('/api/analyze-iep', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Analysis failed');
            }

            setResults(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
            <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-floating w-full max-w-2xl max-h-[90vh] flex flex-col border border-white/50 my-8" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between p-6 sm:p-8 border-b border-slate-100">
                    <div>
                        <h2 className="text-2xl font-display font-bold text-slate-900 tracking-tight">Analyze IEP for {studentName}</h2>
                        <p className="text-sm font-medium text-slate-500 uppercase tracking-wider mt-1">Paste IEP text to extract actionable behaviors</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 p-2 rounded-full transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 sm:p-8 overflow-y-auto flex-1">
                    {!results ? (
                        <div className="space-y-6">
                            <textarea
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                placeholder="Paste text from IEP, 504 Plan, or behavior support plan here..."
                                className="w-full h-64 p-5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary focus:bg-white bg-slate-50 transition-colors resize-none shadow-inner leading-relaxed text-slate-700"
                            />
                            {error && (
                                <div className="p-4 bg-rose-50 border border-rose-100 text-rose-700 text-sm font-medium rounded-xl flex items-center shadow-sm">
                                    <svg className="w-5 h-5 mr-3 text-rose-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                    {error}
                                </div>
                            )}
                            <div className="flex justify-end pt-2">
                                <button
                                    onClick={handleAnalyze}
                                    disabled={isAnalyzing || !text.trim()}
                                    className={`flex items-center px-6 py-3 rounded-xl font-semibold text-white transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 ${isAnalyzing || !text.trim()
                                        ? 'bg-slate-400 cursor-not-allowed shadow-none hover:translate-y-0'
                                        : 'bg-gradient-to-r from-primary to-accent hover:opacity-90'
                                        }`}
                                >
                                    {isAnalyzing ? (
                                        <span className="flex items-center space-x-2.5">
                                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            <span>Analyzing...</span>
                                        </span>
                                    ) : (
                                        <span className="flex items-center space-x-2">
                                            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                            </svg>
                                            <span>Generate Suggestions</span>
                                        </span>
                                    )}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {/* Positive Behaviors */}
                            <div>
                                <h3 className="font-semibold text-sm text-slate-700 mb-4 flex items-center uppercase tracking-wider">
                                    <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full mr-2 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                                    Positive Behaviors
                                </h3>
                                <div className="space-y-3">
                                    {results.positive.map((behavior, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-4 bg-emerald-50/50 rounded-xl border border-emerald-100 shadow-sm group hover:border-emerald-200 hover:bg-emerald-50 transition-all">
                                            <span className="text-slate-800 font-medium">{behavior}</span>
                                            <button
                                                onClick={() => onAddBehavior(behavior, 'positive')}
                                                className="text-xs font-semibold bg-white text-emerald-700 px-4 py-2 rounded-lg border border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300 transition-all shadow-sm hover:shadow active:translate-y-px"
                                            >
                                                + Add
                                            </button>
                                        </div>
                                    ))}
                                    {results.positive.length === 0 && (
                                        <p className="text-sm text-slate-500 italic p-4 bg-slate-50 rounded-xl border border-slate-100">No positive behaviors found.</p>
                                    )}
                                </div>
                            </div>

                            {/* Negative Behaviors */}
                            <div className="pt-2">
                                <h3 className="font-semibold text-sm text-slate-700 mb-4 flex items-center uppercase tracking-wider">
                                    <span className="w-2.5 h-2.5 bg-rose-500 rounded-full mr-2 shadow-[0_0_8px_rgba(244,63,94,0.5)]"></span>
                                    Negative Behaviors
                                </h3>
                                <div className="space-y-3">
                                    {results.negative.map((behavior, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-4 bg-rose-50/50 rounded-xl border border-rose-100 shadow-sm group hover:border-rose-200 hover:bg-rose-50 transition-all">
                                            <span className="text-slate-800 font-medium">{behavior}</span>
                                            <button
                                                onClick={() => onAddBehavior(behavior, 'negative')}
                                                className="text-xs font-semibold bg-white text-rose-700 px-4 py-2 rounded-lg border border-rose-200 hover:bg-rose-100 hover:border-rose-300 transition-all shadow-sm hover:shadow active:translate-y-px"
                                            >
                                                + Add
                                            </button>
                                        </div>
                                    ))}
                                    {results.negative.length === 0 && (
                                        <p className="text-sm text-slate-500 italic p-4 bg-slate-50 rounded-xl border border-slate-100">No negative behaviors found.</p>
                                    )}
                                </div>
                            </div>

                            <div className="pt-8 mt-2 border-t border-slate-100 flex justify-between items-center">
                                <button
                                    onClick={() => setResults(null)}
                                    className="text-sm font-semibold text-slate-500 hover:text-primary transition-colors flex items-center"
                                >
                                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                    </svg>
                                    Analyze different text
                                </button>
                                <button
                                    onClick={onClose}
                                    className="btn btn-primary"
                                >
                                    Done
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
