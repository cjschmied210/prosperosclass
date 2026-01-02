'use client';

import { useState } from 'react';
import { Incident, Behavior } from '@/types';
import { format } from 'date-fns';
import { deleteIncident } from '@/lib/firestore';

interface BehaviorLogTableProps {
    incidents: Incident[];
    behaviors: Behavior[];
    onIncidentDeleted?: () => void; // Callback to refresh data after deletion
}

export default function BehaviorLogTable({ incidents, behaviors, onIncidentDeleted }: BehaviorLogTableProps) {
    const [deletingId, setDeletingId] = useState<string | null>(null);

    // Create a map of behaviorId to behavior details
    const behaviorMap = new Map(behaviors.map(b => [b.behaviorId, b]));

    const handleDelete = async (incidentId: string) => {
        if (!confirm('Are you sure you want to delete this behavior log entry?')) {
            return;
        }

        setDeletingId(incidentId);
        try {
            await deleteIncident(incidentId);
            if (onIncidentDeleted) {
                onIncidentDeleted();
            }
        } catch (error) {
            console.error('Error deleting incident:', error);
            alert('Failed to delete behavior log');
        } finally {
            setDeletingId(null);
        }
    };

    if (incidents.length === 0) {
        return (
            <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
                <div className="text-gray-400 mb-2">
                    <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                </div>
                <p className="text-gray-600 font-medium">No behaviors logged yet</p>
                <p className="text-sm text-gray-500 mt-1">Behavior logs will appear here once you start tracking</p>
            </div>
        );
    }

    return (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Date & Time
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Behavior
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Type
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Notes
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {incidents.map((incident) => {
                            const behavior = behaviorMap.get(incident.behaviorId);
                            const isPositive = behavior?.type === 'positive';
                            const isDeleting = deletingId === incident.incidentId;

                            return (
                                <tr key={incident.incidentId} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        <div>{format(incident.timestamp, 'MMM dd, yyyy')}</div>
                                        <div className="text-xs text-gray-500">{format(incident.timestamp, 'h:mm a')}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">
                                            {behavior?.name || 'Unknown'}
                                        </div>
                                        {behavior?.description && (
                                            <div className="text-xs text-gray-500">{behavior.description}</div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isPositive
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-red-100 text-red-800'
                                            }`}>
                                            {isPositive ? '✓ Positive' : '✗ Negative'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {incident.notes || '—'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                        <button
                                            onClick={() => handleDelete(incident.incidentId)}
                                            disabled={isDeleting}
                                            className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
                                            title="Delete this log entry"
                                        >
                                            {isDeleting ? (
                                                <span className="text-xs">Deleting...</span>
                                            ) : (
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            )}
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
