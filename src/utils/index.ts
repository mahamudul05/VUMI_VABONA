// ============================================================
// Utility functions
// ============================================================

/**
 * Compute SHA-256 hash of an ArrayBuffer using Web Crypto API
 */
export async function computeSHA256(buffer: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Read a File as ArrayBuffer
 */
export function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Generate a unique ID
 */
export function generateId(prefix: string = ''): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).substring(2, 8);
  return prefix ? `${prefix}-${ts}-${rand}` : `${ts}-${rand}`;
}

/**
 * Generate application ID in format APP-YYYY-NNNN
 */
export function generateAppId(): string {
  const year = new Date().getFullYear();
  const num = Math.floor(1000 + Math.random() * 9000);
  return `APP-${year}-${num.toString().padStart(4, '0')}`;
}

/**
 * Format date in Bangla-friendly format
 */
export function formatDate(dateStr: string, lang: 'bn' | 'en' = 'bn'): string {
  try {
    const date = new Date(dateStr);
    if (lang === 'bn') {
      return date.toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric' });
    }
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch {
    return dateStr;
  }
}

/**
 * Format date-time
 */
export function formatDateTime(dateStr: string, lang: 'bn' | 'en' = 'bn'): string {
  try {
    const date = new Date(dateStr);
    if (lang === 'bn') {
      return date.toLocaleString('bn-BD', {
        year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
    }
    return date.toLocaleString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Format file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Convert number to Bangla digits
 */
export function toBanglaDigits(num: number | string): string {
  const banglaDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(num).replace(/[0-9]/g, (d) => banglaDigits[parseInt(d)]);
}

/**
 * Convert number or string to English digits
 */
export function toEnglishDigits(str: string | number): string {
  const banglaDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  let result = String(str);
  banglaDigits.forEach((b, i) => {
    result = result.split(b).join(String(i));
  });
  return result;
}

/**
 * Check if two digit strings match regardless of English/Bangla script
 */
export function matchesDigits(source: string | number, query: string | number): boolean {
  if (!source || !query) return false;
  const sourceEng = toEnglishDigits(source).trim();
  const queryEng = toEnglishDigits(query).trim();
  return sourceEng.includes(queryEng);
}

/**
 * Format currency amount
 */
export function formatAmount(amount: number, lang: 'bn' | 'en' = 'bn'): string {
  if (lang === 'bn') {
    return `৳ ${toBanglaDigits(amount.toLocaleString('en-IN'))}`;
  }
  return `৳ ${amount.toLocaleString('en-IN')}`;
}

/**
 * Create a sample file content for demo deed verification
 */
export function createSampleFileContent(content: string): Blob {
  return new Blob([content], { type: 'text/plain' });
}

/**
 * Trigger window print dialog
 */
export function triggerPrint(): void {
  if (typeof window !== 'undefined') {
    window.print();
  }
}
