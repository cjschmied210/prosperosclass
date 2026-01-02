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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Analyze IEP for {studentName}</h2>
                        <p className="text-sm text-gray-500">Paste IEP text to extract actionable behaviors</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1">
                    {!results ? (
                        <div className="space-y-4">
                            <textarea
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                placeholder="Paste text from IEP, 504 Plan, or behavior support plan here..."
                                className="w-full h-64 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                            />
                            {error && (
                                <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg">
                                    {error}
                                </div>
                            )}
                            <div className="flex justify-end">
                                <button
                                    onClick={handleAnalyze}
                                    disabled={isAnalyzing || !text.trim()}
                                    className={`px-6 py-2 rounded-lg font-medium text-white transition-colors ${isAnalyzing || !text.trim()
                                        ? 'bg-gray-400 cursor-not-allowed'
                                        : 'bg-gradient-to-r from-primary to-accent hover:shadow-lg'
                                        }`}
                                >
                                    {isAnalyzing ? (
                                        <span className="flex items-center space-x-2">
                                            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            <span>Analyzing...</span>
                                        </span>
                                    ) : (
                                        <span className="flex items-center space-x-2">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                                <h3 className="text-sm font-bold text-green-700 uppercase tracking-wide mb-3 flex items-center">
                                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                                    Positive Behaviors
                                </h3>
                                <div className="space-y-2">
                                    {results.positive.map((behavior, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-100">
                                            <span className="text-gray-800">{behavior}</span>
                                            <button
                                                onClick={() => onAddBehavior(behavior, 'positive')}
                                                className="text-xs font-medium bg-white text-green-600 px-3 py-1.5 rounded border border-green-200 hover:bg-green-50 transition-colors"
                                            >
                                                + Add
                                            </button>
                                        </div>
                                    ))}
                                    {results.positive.length === 0 && (
                                        <p className="text-sm text-gray-500 italic">No positive behaviors found.</p>
                                    )}
                                </div>
                            </div>

                            {/* Negative Behaviors */}
                            <div>
                                <h3 className="text-sm font-bold text-red-700 uppercase tracking-wide mb-3 flex items-center">
                                    <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                                    Negative Behaviors
                                </h3>
                                <div className="space-y-2">
                                    {results.negative.map((behavior, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
                                            <span className="text-gray-800">{behavior}</span>
                                            <button
                                                onClick={() => onAddBehavior(behavior, 'negative')}
                                                className="text-xs font-medium bg-white text-red-600 px-3 py-1.5 rounded border border-red-200 hover:bg-red-50 transition-colors"
                                            >
                                                + Add
                                            </button>
                                        </div>
                                    ))}
                                    {results.negative.length === 0 && (
                                        <p className="text-sm text-gray-500 italic">No negative behaviors found.</p>
                                    )}
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-100 flex justify-between">
                                <button
                                    onClick={() => setResults(null)}
                                    className="text-sm text-gray-500 hover:text-gray-700 underline"
                                >
                                    Analyze different text
                                </button>
                                <button
                                    onClick={onClose}
                                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
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
