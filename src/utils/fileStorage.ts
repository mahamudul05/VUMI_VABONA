// ============================================================
// IndexedDB File Storage — Persistent document caching using idb-keyval
// ============================================================
import { get, set, del } from 'idb-keyval';

const FILE_STORAGE_PREFIX = 'vumi_doc_';

/**
 * Save an uploaded file or blob into IndexedDB
 */
export async function storeFileBlob(docIdOrHash: string, file: Blob | File): Promise<void> {
  try {
    await set(`${FILE_STORAGE_PREFIX}${docIdOrHash}`, file);
  } catch (err) {
    console.warn('Failed to store document in IndexedDB:', err);
  }
}

/**
 * Retrieve a stored file blob from IndexedDB by document ID or hash
 */
export async function getFileBlob(docIdOrHash: string): Promise<Blob | undefined> {
  try {
    const file = await get<Blob>(`${FILE_STORAGE_PREFIX}${docIdOrHash}`);
    return file;
  } catch (err) {
    console.warn('Failed to retrieve document from IndexedDB:', err);
    return undefined;
  }
}

/**
 * Delete a file blob from IndexedDB
 */
export async function deleteFileBlob(docIdOrHash: string): Promise<void> {
  try {
    await del(`${FILE_STORAGE_PREFIX}${docIdOrHash}`);
  } catch (err) {
    console.warn('Failed to delete document from IndexedDB:', err);
  }
}

/**
 * Trigger browser download for a Blob
 */
export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Open a Blob in a new browser tab for preview
 */
export function previewBlob(blob: Blob): void {
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
}
