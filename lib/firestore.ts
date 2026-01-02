import {
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    Timestamp,
    addDoc,
    QueryConstraint,
    limit,
} from 'firebase/firestore';
import { db } from './firebase';
import {
    Teacher,
    Class,
    Student,
    Behavior,
    Incident,
    FocusList,
    StudentDocument,
} from '@/types';

// Teacher operations
export async function createTeacher(teacher: Teacher) {
    await setDoc(doc(db, 'teachers', teacher.teacherId), {
        ...teacher,
        createdAt: Timestamp.fromDate(teacher.createdAt),
    });
}

export async function getTeacher(teacherId: string): Promise<Teacher | null> {
    const docSnap = await getDoc(doc(db, 'teachers', teacherId));
    if (docSnap.exists()) {
        const data = docSnap.data();
        return {
            ...data,
            createdAt: data.createdAt.toDate(),
        } as Teacher;
    }
    return null;
}

// Class operations
export async function createClass(classData: Class) {
    await setDoc(doc(db, 'classes', classData.classId), {
        ...classData,
        createdAt: Timestamp.fromDate(classData.createdAt),
    });
}

export async function getClassesByTeacher(teacherId: string): Promise<Class[]> {
    if (!teacherId) return [];

    const q = query(
        collection(db, 'classes'),
        where('teacherId', '==', teacherId),
        orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
            ...data,
            createdAt: data.createdAt.toDate(),
        } as Class;
    });
}

export async function getClass(classId: string): Promise<Class | null> {
    if (!classId) return null;

    const docSnap = await getDoc(doc(db, 'classes', classId));
    if (docSnap.exists()) {
        const data = docSnap.data();
        return {
            ...data,
            createdAt: data.createdAt.toDate(),
        } as Class;
    }
    return null;
}

export async function updateClass(classId: string, updates: Partial<Class>) {
    if (!classId) return;
    await updateDoc(doc(db, 'classes', classId), updates);
}

export async function deleteClass(classId: string) {
    if (!classId) return;
    await deleteDoc(doc(db, 'classes', classId));
}

// Student operations
export async function createStudent(student: Student) {
    await setDoc(doc(db, 'students', student.studentId), {
        ...student,
        createdAt: Timestamp.fromDate(student.createdAt),
    });
}

export async function getStudentsByClass(classId: string): Promise<Student[]> {
    if (!classId) return [];

    const q = query(
        collection(db, 'students'),
        where('classId', '==', classId),
        orderBy('lastName', 'asc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
            ...data,
            createdAt: data.createdAt.toDate(),
        } as Student;
    });
}

export async function getStudent(studentId: string): Promise<Student | null> {
    const docSnap = await getDoc(doc(db, 'students', studentId));
    if (docSnap.exists()) {
        const data = docSnap.data();
        return {
            ...data,
            createdAt: data.createdAt.toDate(),
        } as Student;
    }
    return null;
}

export async function updateStudent(studentId: string, updates: Partial<Student>) {
    await updateDoc(doc(db, 'students', studentId), updates);
}

export async function deleteStudent(studentId: string) {
    await deleteDoc(doc(db, 'students', studentId));
}

// Behavior operations
export async function createBehavior(behavior: Behavior) {
    await setDoc(doc(db, 'behaviors', behavior.behaviorId), {
        ...behavior,
        createdAt: Timestamp.fromDate(behavior.createdAt),
    });
}

export async function getBehaviorsByTeacher(teacherId: string): Promise<Behavior[]> {
    if (!teacherId) return [];

    const q = query(
        collection(db, 'behaviors'),
        where('teacherId', '==', teacherId),
        orderBy('type', 'asc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
            ...data,
            createdAt: data.createdAt.toDate(),
        } as Behavior;
    });
}

export async function updateBehavior(behaviorId: string, updates: Partial<Behavior>) {
    await updateDoc(doc(db, 'behaviors', behaviorId), updates);
}

export async function deleteBehavior(behaviorId: string) {
    await deleteDoc(doc(db, 'behaviors', behaviorId));
}

// Incident operations
export async function logIncident(incident: Incident) {
    await setDoc(doc(db, 'incidents', incident.incidentId), {
        ...incident,
        timestamp: Timestamp.fromDate(incident.timestamp),
    });
}

export async function getIncidentsByStudent(
    studentId: string,
    startDate?: Date,
    endDate?: Date
): Promise<Incident[]> {
    // Basic query by studentId only to avoid index requirements
    const q = query(
        collection(db, 'incidents'),
        where('studentId', '==', studentId)
    );

    const querySnapshot = await getDocs(q);
    let incidents = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
            ...data,
            timestamp: data.timestamp.toDate(),
        } as Incident;
    });

    // Client-side filtering
    if (startDate) {
        incidents = incidents.filter(i => i.timestamp >= startDate);
    }
    if (endDate) {
        incidents = incidents.filter(i => i.timestamp <= endDate);
    }

    // Client-side sorting (descending)
    incidents.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return incidents;
}

export async function getIncidentsByClass(
    classId: string,
    startDate?: Date,
    endDate?: Date
): Promise<Incident[]> {
    // Basic query by classId only to avoid index requirements
    const q = query(
        collection(db, 'incidents'),
        where('classId', '==', classId)
    );

    const querySnapshot = await getDocs(q);
    let incidents = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
            ...data,
            timestamp: data.timestamp.toDate(),
        } as Incident;
    });

    // Client-side filtering
    if (startDate) {
        incidents = incidents.filter(i => i.timestamp >= startDate);
    }
    if (endDate) {
        incidents = incidents.filter(i => i.timestamp <= endDate);
    }

    // Client-side sorting (descending)
    incidents.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return incidents;
}

export async function deleteIncident(incidentId: string): Promise<void> {
    await deleteDoc(doc(db, 'incidents', incidentId));
}

// FocusList operations
export async function saveFocusList(focusList: FocusList) {
    await setDoc(doc(db, 'focusLists', focusList.focusListId), {
        ...focusList,
        lastUpdated: Timestamp.fromDate(focusList.lastUpdated),
    });
}

export async function getFocusList(
    teacherId: string,
    classId: string
): Promise<FocusList | null> {
    console.log('getFocusList called with:', { teacherId, classId });

    if (!teacherId || !classId) {
        console.log('getFocusList: returning null due to empty params');
        return null;
    }

    const q = query(
        collection(db, 'focusLists'),
        where('teacherId', '==', teacherId),
        where('classId', '==', classId)
    );
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
        const docs = querySnapshot.docs.map((doc) => {
            const data = doc.data();
            return {
                ...data,
                lastUpdated: data.lastUpdated.toDate(),
            } as FocusList;
        });

        // Sort by lastUpdated descending (newest first)
        docs.sort((a, b) => b.lastUpdated.getTime() - a.lastUpdated.getTime());

        return docs[0];
    }
    return null;
}

// Document operations
export async function createDocument(document: StudentDocument) {
    await setDoc(doc(db, 'documents', document.documentId), {
        ...document,
        uploadedAt: Timestamp.fromDate(document.uploadedAt),
    });
}

export async function getDocumentsByStudent(studentId: string): Promise<StudentDocument[]> {
    const q = query(
        collection(db, 'documents'),
        where('studentId', '==', studentId),
        orderBy('uploadedAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
            ...data,
            uploadedAt: data.uploadedAt.toDate(),
        } as StudentDocument;
    });
}

export async function deleteDocument(documentId: string) {
    await deleteDoc(doc(db, 'documents', documentId));
}
