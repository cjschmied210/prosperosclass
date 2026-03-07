// Core user and class types
export interface Teacher {
    teacherId: string;
    email: string;
    displayName: string;
    createdAt: Date;
}

export interface Class {
    classId: string;
    teacherId: string;
    className: string;
    period?: string;
    schoolYear: string;
    createdAt: Date;
}

export interface ParentContact {
    name: string;
    email: string;
    phone?: string;
    relationship: string; // "Mother", "Father", "Guardian", etc.
}

export interface Student {
    studentId: string;
    classId: string;
    firstName: string;
    lastName: string;
    grade?: string;
    parentContacts: ParentContact[];
    documentIds: string[]; // References to uploaded IEP/504 documents
    focusBehaviorIds?: string[]; // Behaviors to show as quick-log buttons in Focus Zone
    createdAt: Date;
}

export type BehaviorType = 'positive' | 'negative';

export interface Behavior {
    behaviorId: string;
    teacherId: string; // Teacher who defined this behavior
    name: string; // e.g., "Active Listening", "Disruption"
    type: BehaviorType;
    description?: string;
    color?: string; // Optional color for visualization
    createdAt: Date;
}

export interface Incident {
    incidentId: string;
    studentId: string;
    classId: string;
    teacherId: string;
    behaviorId: string;
    timestamp: Date;
    notes?: string;
}

export interface FocusList {
    focusListId: string;
    teacherId: string;
    classId: string;
    studentIds: string[]; // Ordered list of students in focus zone
    lastUpdated: Date;
}

export interface StudentDocument {
    documentId: string;
    studentId: string;
    fileName: string;
    fileType: string; // "IEP", "504", "Other"
    storagePath: string; // Firebase Storage path
    uploadedAt: Date;
    uploadedBy: string; // teacherId
}

// Analytics and reporting types
export interface BehaviorSummary {
    behaviorId: string;
    behaviorName: string;
    type: BehaviorType;
    count: number;
}

export interface StudentReport {
    studentId: string;
    studentName: string;
    dateRange: {
        start: Date;
        end: Date;
    };
    totalIncidents: number;
    positiveCount: number;
    negativeCount: number;
    behaviorBreakdown: BehaviorSummary[];
    recentIncidents: Incident[];
}

// UI state types
export interface DragItem {
    type: 'STUDENT';
    studentId: string;
    student: Student;
}
