import {
    ref,
    uploadBytesResumable,
    getDownloadURL,
    deleteObject,
    UploadTaskSnapshot,
} from 'firebase/storage';
import { storage } from './firebase';

export interface UploadProgress {
    progress: number;
    snapshot: UploadTaskSnapshot;
}

/**
 * Upload a file to Firebase Storage
 * @param file - File to upload
 * @param path - Storage path (e.g., 'students/studentId/documents/filename.pdf')
 * @param onProgress - Optional callback for upload progress
 * @returns Promise with download URL
 */
export async function uploadFile(
    file: File,
    path: string,
    onProgress?: (progress: UploadProgress) => void
): Promise<string> {
    const storageRef = ref(storage, path);
    const uploadTask = uploadBytesResumable(storageRef, file);

    return new Promise((resolve, reject) => {
        uploadTask.on(
            'state_changed',
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                if (onProgress) {
                    onProgress({ progress, snapshot });
                }
            },
            (error) => {
                reject(error);
            },
            async () => {
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                resolve(downloadURL);
            }
        );
    });
}

/**
 * Get download URL for a file
 * @param path - Storage path
 * @returns Promise with download URL
 */
export async function getFileURL(path: string): Promise<string> {
    const storageRef = ref(storage, path);
    return await getDownloadURL(storageRef);
}

/**
 * Delete a file from Firebase Storage
 * @param path - Storage path
 */
export async function deleteFile(path: string): Promise<void> {
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
}

/**
 * Validate file before upload
 * @param file - File to validate
 * @param maxSizeMB - Maximum file size in MB (default: 10)
 * @param allowedTypes - Array of allowed MIME types
 * @returns Error message if validation fails, null if valid
 */
export function validateFile(
    file: File,
    maxSizeMB: number = 10,
    allowedTypes: string[] = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
): string | null {
    // Check file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
        return `File size exceeds ${maxSizeMB}MB limit`;
    }

    // Check file type
    if (!allowedTypes.includes(file.type)) {
        return 'Invalid file type. Please upload PDF or Word documents only.';
    }

    return null;
}
