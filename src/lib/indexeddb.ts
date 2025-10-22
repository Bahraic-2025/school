import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface FileRecord {
  id: string;
  ownerType: string;
  ownerId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  blob: Blob;
  uploadedAt: number;
}

interface SchoolDBSchema extends DBSchema {
  student_documents: {
    key: string;
    value: FileRecord;
    indexes: { 'by-owner': [string, string] };
  };
  staff_documents: {
    key: string;
    value: FileRecord;
    indexes: { 'by-owner': [string, string] };
  };
  temp_uploads: {
    key: string;
    value: FileRecord;
  };
}

const DB_NAME = 'school_admin_db';
const DB_VERSION = 1;

let dbInstance: IDBPDatabase<SchoolDBSchema> | null = null;

export async function initDB(): Promise<IDBPDatabase<SchoolDBSchema>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<SchoolDBSchema>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('student_documents')) {
        const studentStore = db.createObjectStore('student_documents', { keyPath: 'id' });
        studentStore.createIndex('by-owner', ['ownerType', 'ownerId']);
      }

      if (!db.objectStoreNames.contains('staff_documents')) {
        const staffStore = db.createObjectStore('staff_documents', { keyPath: 'id' });
        staffStore.createIndex('by-owner', ['ownerType', 'ownerId']);
      }

      if (!db.objectStoreNames.contains('temp_uploads')) {
        db.createObjectStore('temp_uploads', { keyPath: 'id' });
      }
    },
  });

  return dbInstance;
}

export async function saveFile(
  file: File,
  ownerType: string,
  ownerId: string,
  storeName: 'student_documents' | 'staff_documents' | 'temp_uploads' = 'temp_uploads'
): Promise<string> {
  const db = await initDB();
  const id = crypto.randomUUID();

  const fileRecord: FileRecord = {
    id,
    ownerType,
    ownerId,
    fileName: file.name,
    fileType: file.type,
    fileSize: file.size,
    blob: file,
    uploadedAt: Date.now(),
  };

  await db.put(storeName, fileRecord);
  return id;
}

export async function getFile(
  id: string,
  storeName: 'student_documents' | 'staff_documents' | 'temp_uploads' = 'temp_uploads'
): Promise<FileRecord | undefined> {
  const db = await initDB();
  return await db.get(storeName, id);
}

export async function getFilesByOwner(
  ownerType: string,
  ownerId: string,
  storeName: 'student_documents' | 'staff_documents' = 'student_documents'
): Promise<FileRecord[]> {
  const db = await initDB();
  return await db.getAllFromIndex(storeName, 'by-owner', [ownerType, ownerId]);
}

export async function deleteFile(
  id: string,
  storeName: 'student_documents' | 'staff_documents' | 'temp_uploads' = 'temp_uploads'
): Promise<void> {
  const db = await initDB();
  await db.delete(storeName, id);
}

export async function getAllFiles(
  storeName: 'student_documents' | 'staff_documents' | 'temp_uploads' = 'temp_uploads'
): Promise<FileRecord[]> {
  const db = await initDB();
  return await db.getAll(storeName);
}

export async function getStorageUsage(): Promise<{ used: number; quota: number; percentage: number }> {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    const estimate = await navigator.storage.estimate();
    const used = estimate.usage || 0;
    const quota = estimate.quota || 0;
    const percentage = quota > 0 ? (used / quota) * 100 : 0;
    return { used, quota, percentage };
  }
  return { used: 0, quota: 0, percentage: 0 };
}

export async function clearAllFiles(): Promise<void> {
  const db = await initDB();
  await db.clear('student_documents');
  await db.clear('staff_documents');
  await db.clear('temp_uploads');
}

export function createFileURL(blob: Blob): string {
  return URL.createObjectURL(blob);
}

export function revokeFileURL(url: string): void {
  URL.revokeObjectURL(url);
}

export async function moveFile(
  id: string,
  fromStore: 'student_documents' | 'staff_documents' | 'temp_uploads',
  toStore: 'student_documents' | 'staff_documents'
): Promise<void> {
  const db = await initDB();
  const file = await db.get(fromStore, id);

  if (file) {
    await db.put(toStore, file);
    await db.delete(fromStore, id);
  }
}
