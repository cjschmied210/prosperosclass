'use client';

import { useState, useRef } from 'react';
import { Incident, Behavior } from '@/types';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { format, startOfDay, differenceInDays } from 'date-fns';
import html2canvas from 'html2canvas';

interface BehaviorChartsProps {
    incidents: Incident[];
    behaviors: Behavior[];
    onGenerateReport?: (behaviorId?: string) => void;
}

export default function BehaviorCharts({ incidents, behaviors, onGenerateReport }: BehaviorChartsProps) {
    const [selectedBehaviorId, setSelectedBehaviorId] = useState<string | 'all'>('all');
    const [copySuccess, setCopySuccess] = useState(false);
    const lineChartRef = useRef<HTMLDivElement>(null);

    // Create a map of behaviorId to behavior details
    const behaviorMap = new Map(behaviors.map(b => [b.behaviorId, b]));

    // Calculate summary stats (filtered if a behavior is selected)
    const filteredIncidents = selectedBehaviorId === 'all'
        ? incidents
        : incidents.filter(inc => inc.behaviorId === selectedBehaviorId);

    const totalIncidents = filteredIncidents.length;
    const positiveCount = filteredIncidents.filter(inc => {
        const behavior = behaviorMap.get(inc.behaviorId);
        return behavior?.type === 'positive';
    }).length;
    const negativeCount = totalIncidents - positiveCount;

    // Prepare data for behavior type bar chart (always shows all behaviors to allow selection)
    const behaviorTypeData = behaviors.map(behavior => {
        const count = incidents.filter(inc => inc.behaviorId === behavior.behaviorId).length;
        return {
            name: behavior.name,
            count,
            type: behavior.type,
            behaviorId: behavior.behaviorId, // Added for click handler
        };
    }).filter(item => item.count > 0);

    // Prepare data for timeline chart
    const timelineData = incidents.reduce((acc, incident) => {
        // If filtering, skip incidents that don't match
        if (selectedBehaviorId !== 'all' && incident.behaviorId !== selectedBehaviorId) {
            return acc;
        }

        const dateKey = format(startOfDay(incident.timestamp), 'MMM dd');
        const behavior = behaviorMap.get(incident.behaviorId);
        const type = behavior?.type || 'unknown';

        const existing = acc.find(item => item.date === dateKey);
        if (existing) {
            if (selectedBehaviorId === 'all') {
                // Standard Positive/Negative split
                if (type === 'positive') {
                    existing.positive = (existing.positive || 0) + 1;
                } else {
                    // Count unknown as negative or separate? For now, grouping with negative as per previous logic
                    // but let's be explicit: if it's not positive, it goes to negative line
                    existing.negative = (existing.negative || 0) + 1;
                }
            } else {
                // Single behavior count
                existing.count = (existing.count || 0) + 1;
            }
        } else {
            const newItem: any = { date: dateKey };
            if (selectedBehaviorId === 'all') {
                newItem.positive = type === 'positive' ? 1 : 0;
                newItem.negative = type !== 'positive' ? 1 : 0; // Fix: Ensure non-positive counts as negative
                newItem.count = 0;
            } else {
                newItem.count = 1;
                newItem.positive = 0;
                newItem.negative = 0;
            }
            acc.push(newItem);
        }
        return acc;
    }, [] as Array<{ date: string; positive: number; negative: number; count: number }>);

    // Sort timeline data by date
    timelineData.sort((a, b) => {
        const dateA = new Date(a.date + ' ' + new Date().getFullYear());
        const dateB = new Date(b.date + ' ' + new Date().getFullYear());
        return dateA.getTime() - dateB.getTime();
    });

    const handleCopyChart = async () => {
        if (!lineChartRef.current) return;

        try {
            // Use html2canvas to capture the entire card (including title and legend)
            const canvas = await html2canvas(lineChartRef.current, {
                backgroundColor: '#ffffff', // Ensure white background
                scale: 2, // Higher resolution
                logging: false,
            });

            canvas.toBlob(async (blob) => {
                if (blob) {
                    try {
                        await navigator.clipboard.write([
                            new ClipboardItem({ 'image/png': blob })
                        ]);
                        setCopySuccess(true);
                        setTimeout(() => setCopySuccess(false), 2000);
                    } catch (err) {
                        console.error('Failed to copy to clipboard:', err);
                        alert('Failed to copy chart. Browser may not support this feature.');
                    }
                }
            }, 'image/png');

        } catch (error) {
            console.error('Error copying chart:', error);
            alert('An error occurred while copying the chart.');
        }
    };

    if (incidents.length === 0) {
        return (
            <div className="text-center py-12">
                <div className="text-gray-400 mb-2">
                    <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                </div>
                <p className="text-gray-600 font-medium">No behavior data to display</p>
                <p className="text-sm text-gray-500 mt-1">Log some behaviors to see charts and trends</p>
            </div>
        );
    }

    const selectedBehaviorName = selectedBehaviorId === 'all'
        ? 'All Behaviors'
        : behaviors.find(b => b.behaviorId === selectedBehaviorId)?.name || 'Selected Behavior';

    return (
        <div className="space-y-6">
            {/* Compact Summary Bar */}
            <div className="bg-white border border-gray-200 rounded-lg px-6 py-3 flex items-center justify-between">
                <div className="flex items-center space-x-8">
                    <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500">Total Events:</span>
                        <span className="text-lg font-bold text-gray-900">{totalIncidents}</span>
                    </div>
                    {selectedBehaviorId === 'all' && (
                        <>
                            <div className="h-4 w-px bg-gray-300"></div>
                            <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                <span className="text-sm text-gray-500">Positive:</span>
                                <span className="text-lg font-bold text-green-600">{positiveCount}</span>
                            </div>
                            <div className="h-4 w-px bg-gray-300"></div>
                            <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                <span className="text-sm text-gray-500">Negative:</span>
                                <span className="text-lg font-bold text-red-600">{negativeCount}</span>
                            </div>
                        </>
                    )}
                </div>

            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Behavior Trends Over Time */}
                <div className="bg-white border border-gray-200 rounded-lg p-6 lg:col-span-2" ref={lineChartRef}>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-2">
                            <h3 className="text-lg font-semibold text-gray-700">Trend:</h3>
                            <select
                                value={selectedBehaviorId}
                                onChange={(e) => setSelectedBehaviorId(e.target.value)}
                                className="text-sm font-medium text-gray-900 border-gray-300 rounded-md focus:ring-primary focus:border-primary py-1 pl-2 pr-8"
                            >
                                <option value="all">All Behaviors</option>
                                {behaviors.map(b => (
                                    <option key={b.behaviorId} value={b.behaviorId}>{b.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-center space-x-2">
                            {onGenerateReport && (
                                <button
                                    onClick={() => onGenerateReport(selectedBehaviorId === 'all' ? undefined : selectedBehaviorId)}
                                    className="text-xs flex items-center px-2 py-1 rounded border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 transition-colors"
                                    title="Draft email about this data"
                                >
                                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                    Draft Email
                                </button>
                            )}
                            <button
                                onClick={handleCopyChart}
                                className={`text-xs flex items-center px-2 py-1 rounded border transition-colors ${copySuccess
                                    ? 'bg-green-50 text-green-600 border-green-200'
                                    : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                                    }`}
                                title="Copy chart to clipboard"
                            >
                                {copySuccess ? (
                                    <>
                                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        Copied
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                                        </svg>
                                        Copy
                                    </>
                                )}
                            </button>
                            {selectedBehaviorId !== 'all' && (
                                <button
                                    onClick={() => setSelectedBehaviorId('all')}
                                    className="text-sm text-gray-500 hover:text-primary flex items-center space-x-1 bg-gray-50 hover:bg-gray-100 px-3 py-1 rounded-full transition-colors"
                                >
                                    <span>Show All</span>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                        {selectedBehaviorId === 'all' ? (
                            <LineChart data={timelineData} key="all-behaviors-chart">
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis allowDecimals={false} />
                                <Tooltip />
                                <Legend />
                                <Line type="monotone" dataKey="positive" stroke="#10b981" strokeWidth={2} name="Positive" />
                                <Line type="monotone" dataKey="negative" stroke="#ef4444" strokeWidth={2} name="Negative" />
                            </LineChart>
                        ) : (
                            <LineChart data={timelineData} key={`single-behavior-${selectedBehaviorId}`}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis allowDecimals={false} />
                                <Tooltip />
                                <Legend />
                                <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2} name="Occurrences" />
                            </LineChart>
                        )}
                    </ResponsiveContainer>
                </div>

                {/* Behavior Distribution */}
                <div className="bg-white border border-gray-200 rounded-lg p-6 lg:col-span-1">
                    <h3 className="text-lg font-semibold mb-4">Behavior Distribution (Click to Filter)</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart
                            data={behaviorTypeData}
                            onClick={(data) => {
                                if (data && data.activePayload && data.activePayload.length > 0) {
                                    const clickedId = data.activePayload[0].payload.behaviorId;
                                    setSelectedBehaviorId(clickedId === selectedBehaviorId ? 'all' : clickedId);
                                }
                            }}
                            className="cursor-pointer"
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis allowDecimals={false} />
                            <Tooltip cursor={{ fill: 'transparent' }} />
                            <Legend />
                            <Bar
                                dataKey="count"
                                name="Count"
                                radius={[8, 8, 0, 0]}
                            >
                                {behaviorTypeData.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={entry.type === 'positive' ? '#10b981' : '#ef4444'}
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
