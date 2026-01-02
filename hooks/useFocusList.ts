import { useState, useEffect } from 'react';
import { getFocusList, saveFocusList } from '@/lib/firestore';
import { FocusList } from '@/types';
import { v4 as uuidv4 } from 'uuid';

export function useFocusList(teacherId: string, classId: string) {
  const [focusListId, setFocusListId] = useState<string>('');
  const [studentIds, setStudentIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Load focus list on mount
  useEffect(() => {
    const loadFocusList = async () => {
      if (!teacherId || !classId) {
        setLoading(false);
        return;
      }

      try {
        const focusList = await getFocusList(teacherId, classId);

        if (focusList) {
          setFocusListId(focusList.focusListId);
          setStudentIds(focusList.studentIds);
        } else {
          // Create new focus list
          const newId = uuidv4();
          setFocusListId(newId);
          setStudentIds([]);
        }
      } catch (error) {
        console.error('Error loading focus list:', error);
      } finally {
        setLoading(false);
      }
    };

    loadFocusList();
  }, [teacherId, classId]);

  // Save focus list to Firestore
  const saveFocus = async (newStudentIds: string[]) => {
    const focusList: FocusList = {
      focusListId,
      teacherId,
      classId,
      studentIds: newStudentIds,
      lastUpdated: new Date(),
    };

    await saveFocusList(focusList);
  };

  const addToFocus = async (studentId: string) => {
    if (!studentIds.includes(studentId)) {
      const newStudentIds = [...studentIds, studentId];
      setStudentIds(newStudentIds);
      await saveFocus(newStudentIds);
    }
  };

  const removeFromFocus = async (studentId: string) => {
    const newStudentIds = studentIds.filter((id) => id !== studentId);
    setStudentIds(newStudentIds);
    await saveFocus(newStudentIds);
  };

  const reorderFocus = async (newOrder: string[]) => {
    setStudentIds(newOrder);
    await saveFocus(newOrder);
  };

  return {
    studentIds,
    loading,
    addToFocus,
    removeFromFocus,
    reorderFocus,
  };
}
