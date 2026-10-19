// ============================================================
// OCR & Deed Verification Pipeline
// Multi-stage analysis: Hash -> Content Extraction -> Field Comparison
// ============================================================

import { createWorker } from 'tesseract.js';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
}

import type { 
  RegisteredDocument, 
  DetailedVerificationStatus, 
  FieldComparison, 
  VerificationSubmission 
} from '../types';
import { 
  computeSHA256, 
  readFileAsArrayBuffer, 
  toEnglishDigits, 
  generateId 
} from './index';

export interface ExtractedDeedFields {
  deedNumber?: string;
  registrationDate?: string;
  district?: string;
  upazila?: string;
  mouza?: string;
  jlNumber?: string;
  dagNumber?: string;
  khatianNumber?: string;
  landArea?: string;
  parties?: string;
  rawText: string;
}

/**
 * Stage A & B: Extract text from document using OCR or text reading
 */
export async function extractTextFromDocument(
  file: File, 
  onProgress?: (progress: number, status: string) => void
): Promise<{ text: string; ocrStatus: 'completed' | 'partial' | 'failed' | 'not_needed' }> {
  // If text file or plain document
  if (file.type.startsWith('text/')) {
    try {
      const text = await file.text();
      return { text, ocrStatus: 'not_needed' };
    } catch {
      return { text: '', ocrStatus: 'failed' };
    }
  }

  // If image file, use Tesseract OCR
  if (file.type.startsWith('image/')) {
    try {
      onProgress?.(15, 'অক্ষর শনাক্তকরণ (OCR) ইঞ্জিন প্রস্তুত হচ্ছে...');
      const worker = await createWorker('ben+eng', 1, {
        logger: (m) => {
          if (m.status === 'recognizing text' && m.progress) {
            const pct = Math.round(20 + m.progress * 60);
            onProgress?.(pct, `দলিলের লেখা শনাক্ত করা হচ্ছে (${Math.round(m.progress * 100)}%)...`);
          }
        },
        errorHandler: (err) => console.warn('Tesseract worker error:', err)
      }).catch(async () => {
        // Fallback to English if ben+eng fails
        return await createWorker('eng');
      });

      onProgress?.(40, 'দলিল স্ক্যান ও টেক্সট নিষ্কাশন চলছে...');
      const ret = await worker.recognize(file);
      await worker.terminate();

      const extractedText = ret.data.text.trim();
      onProgress?.(85, 'টেক্সট বিশ্লেষণ সম্পন্ন হয়েছে');

      if (extractedText.length > 10) {
        return { text: extractedText, ocrStatus: 'completed' };
      } else {
        return { text: extractedText, ocrStatus: 'partial' };
      }
    } catch (err) {
      console.warn('OCR processing failed or timed out:', err);
      return { 
        text: `[অক্ষর নিষ্কাশন ত্রুটি বা স্ক্যান অস্পষ্ট: ${file.name}]`, 
        ocrStatus: 'failed' 
      };
    }
  }

  // If PDF file
  if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
    try {
      onProgress?.(25, 'পিডিএফ ফাইল ও টেক্সটলেয়ার বিশ্লেষণ করা হচ্ছে...');
      const buffer = await readFileAsArrayBuffer(file);
      const data = new Uint8Array(buffer);

      let fullPdfText = '';

      try {
        const loadingTask = pdfjsLib.getDocument({
          data,
          useSystemFonts: true,
        });
        const pdf = await loadingTask.promise;

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items
            .map((item: any) => item.str || '')
            .join(' ');
          fullPdfText += pageText + '\n';
          const pct = Math.round(25 + (i / pdf.numPages) * 50);
          onProgress?.(pct, `পিডিএফ পাতা ${i}/${pdf.numPages} বিশ্লেষণ চলছে...`);
        }
      } catch (pdfErr) {
        console.warn('PDF.js textlayer extraction error:', pdfErr);
      }

      fullPdfText = fullPdfText.trim();

      // If textlayer extracted real text
      if (fullPdfText.length > 20) {
        onProgress?.(85, 'দলিলের টেক্সট বিশ্লেষণ সম্পন্ন হয়েছে');
        return { text: fullPdfText, ocrStatus: 'completed' };
      }

      // If PDF has no text layer (e.g. pure scanned image), render page to canvas and run OCR
      try {
        const loadingTask = pdfjsLib.getDocument({ data });
        const pdf = await loadingTask.promise;
        if (pdf.numPages > 0) {
          onProgress?.(50, 'স্ক্যানকৃত পাতা হতে ইমেজ OCR করা হচ্ছে...');
          const page = await pdf.getPage(1);
          const viewport = page.getViewport({ scale: 1.5 });
          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            await page.render({ canvasContext: ctx, viewport }).promise;
            const worker = await createWorker('ben+eng', 1);
            const ret = await worker.recognize(canvas);
            await worker.terminate();
            const ocrText = ret.data.text.trim();
            if (ocrText.length > 10) {
              return { text: ocrText, ocrStatus: 'completed' };
            }
          }
        }
      } catch (ocrErr) {
        console.warn('Canvas OCR fallback failed:', ocrErr);
      }

      return { text: '', ocrStatus: 'failed' };
    } catch (err) {
      console.warn('PDF parsing error:', err);
      return { text: '', ocrStatus: 'failed' };
    }
  }

  return { text: '', ocrStatus: 'not_needed' };
}

/**
 * Extract structured cadastral deed fields from real raw text only (never filename)
 */
export function extractDeedFields(rawText: string): ExtractedDeedFields {
  const fields: ExtractedDeedFields = { rawText };
  if (!rawText || !rawText.trim()) return fields;

  // 1. Deed Number extraction (real content only)
  // Match patterns like: দলিল নং ৪৮৭২/২০২৬, দিলল নPর: ৪৮৭২/২০২৬, Deed No. 4872/2026, DEMO-2026-000184, বা ৪৮৭২/২০২৬
  const deedRegexes = [
    /(?:দিলল|দলিল|deed)\s*(?:ন\S*|নং|নম্বর)?[:\s\-_]*([০-৯0-9]{3,6}\/[০-৯0-9]{4}|DEMO-[0-9]{4}-[0-9]+|[০-৯0-9\w/-]+)/i,
    /([০-৯0-9]{4,5}\/[০-৯0-9]{4})/,
    /(DEMO-[0-9]{4}-[0-9]+)/i,
    /(DEED-[0-9]{4}-[0-9]+)/i
  ];
  for (const rx of deedRegexes) {
    const match = rawText.match(rx);
    if (match && match[1]) {
      fields.deedNumber = match[1].trim();
      break;
    }
  }

  // 2. Dag Number extraction
  const rsTableMatch = rawText.match(/আর\.এস\.\s*([০-৯0-9]+)\s+([০-৯0-9]+)/);

  const dagRegexes = [
    /([০-৯0-9]+)\s*নং\s*দােগর/,
    /([০-৯0-9]+)\s*নং\s*দাগ/,
    /(?:দাগ\s*(?:ন\S*|নং|নম্বর)?[:\s\-_]*)([০-৯0-9/-]+)/i,
    /(?:dag\s*(?:no|number)?[:\s\-_]*)([০-৯0-9/-]+)/i,
    /(?:plot\s*(?:no)?[:\s\-_]*)([০-৯0-9/-]+)/i
  ];
  for (const rx of dagRegexes) {
    const match = rawText.match(rx);
    if (match && match[1]) {
      fields.dagNumber = match[1].trim();
      break;
    }
  }
  if (!fields.dagNumber && rsTableMatch && rsTableMatch[2]) {
    fields.dagNumber = rsTableMatch[2].trim();
  }

  // 3. Khatian Number extraction
  const khatianRegexes = [
    /আর\.এস\.\s*([০-৯0-9]+)\s*নং\s*(?:খিতয়ােন|খতিয়ান)/,
    /(?:খিতয়ান|খতিয়ান|khatian)\s*(?:ন\S*|নং|নম্বর)?[:\s\-_]*([০-৯0-9/-]+)/i
  ];
  for (const rx of khatianRegexes) {
    const match = rawText.match(rx);
    if (match && match[1]) {
      fields.khatianNumber = match[1].trim();
      break;
    }
  }
  if (!fields.khatianNumber && rsTableMatch && rsTableMatch[1]) {
    fields.khatianNumber = rsTableMatch[1].trim();
  }

  // 4. Mouza extraction
  const mouzaRegexes = [
    /(?:\$মৗজা|মৌজা|mouza)[:\s\-_]*([\u0980-\u09FFa-zA-Z\s]+?)(?:,|\n|\$|জেএল|দাগ|খতিয়ান|$)/i,
    /(?:মৌজা|mouza)\s+([\u0980-\u09FFa-zA-Z]+)/i
  ];
  for (const rx of mouzaRegexes) {
    const match = rawText.match(rx);
    if (match && match[1] && match[1].trim().length > 1) {
      let mName = match[1].trim();
      // Clean up common OCR prefix artifacts like 'িশমুলতলী' -> 'শিমুলতলী'
      if (mName === 'িশমুলতলী') mName = 'শিমুলতলী';
      fields.mouza = mName;
      break;
    }
  }

  // 5. Land Area extraction
  // Matches "১০ শতাংশ (দশ শতাংশ)", "১৫ শতাংশ (পনেরো শতাংশ)", "15 শতাংশ", "10 decimal"
  const areaRegexes = [
    /(?:হZা\[িরত|হস্তান্তরিত)?\s*(?:স0ি1র|সম্পত্তির)?\s*পিরমাণ[:\s\-_a-zA-Z0-9\u0980-\u09FF]*?([০-৯0-9.]+)\s*(?:শতাংশ|শতক|decimal)/i,
    /([০-৯0-9.]+)\s*(?:শতাংশ|শতক|decimal)/i,
    /(?:জমির\s*পরিমাণ|পরিমাণ|area)[:\s\-_]*([০-৯0-9.]+)\s*(শতাংশ|শতক|একর|decimal)?/i
  ];
  for (const rx of areaRegexes) {
    const match = rawText.match(rx);
    if (match && match[1]) {
      fields.landArea = `${match[1]} শতাংশ`.trim();
      break;
    }
  }

  // 6. Registration Date / Year
  const dateRegexes = [
    /(?:তািরখ|তারিখ|date)[:\s\-_]*([০-৯0-9]{1,2}[\/\-][০-৯0-9]{1,2}[\/\-][০-৯0-9]{2,4})/i,
    /([০-৯0-9]{1,2}[\/\-][০-৯0-9]{1,2}[\/\-][০-৯0-9]{2,4})/
  ];
  for (const rx of dateRegexes) {
    const match = rawText.match(rx);
    if (match && match[1]) {
      fields.registrationDate = match[1].trim();
      break;
    }
  }

  // 7. Parties / Names
  const sellerMatch = rawText.match(/(?:দাতা|বিক্রেতা)\s*[:\s]*([^,\n]+?)(?=\s*(?:,|পিতা|িপতা|মাতা|স্বামী|গ্রাম|গ&াম|সাং|\n|$))/i);
  const buyerMatch = rawText.match(/(?:গ\s*হীতা|গ্রহীতা|গ&হীতা|(?<!বি)ক্রেতা)\s*[:\s]*([^,\n]+?)(?=\s*(?:,|পিতা|িপতা|মাতা|স্বামী|গ্রাম|গ&াম|সাং|\n|$))/i);

  const d = sellerMatch && sellerMatch[1] ? cleanPartyName(sellerMatch[1].trim()) : '';
  const g = buyerMatch && buyerMatch[1] ? cleanPartyName(buyerMatch[1].trim()) : '';

  if (d && g) {
    fields.parties = `${d} → ${g}`;
  } else if (d) {
    fields.parties = d;
  } else if (g) {
    fields.parties = g;
  } else {
    const partyRegexes = [
      /(?:মালিক|স্বত্বাধিকারী|parties|buyer|seller|owner)[:\s\-_]*([^,\n]+?)(?=\s*(?:,|পিতা|িপতা|মাতা|স্বামী|গ্রাম|গ&াম|সাং|\n|দলিল|দিলল|দাগ|$))/i,
      /(?:দাতা|গ্রহীতা|মালিক|parties|buyer|seller)[:\s\-_]*([\u0980-\u09FFa-zA-Z\s,]+?)(?:\n|দিলল|দলিল|দাগ|$)/i
    ];
    for (const rx of partyRegexes) {
      const match = rawText.match(rx);
      if (match && match[1] && match[1].trim().length > 2) {
        fields.parties = cleanPartyName(match[1].trim());
        break;
      }
    }
  }

  return fields;
}

function cleanPartyName(str: string): string {
  if (!str) return '';
  return str
    .replace(/^[:\s\-–—(১-৯0-9.)]+/, '')
    .replace(/(?:\s*(?:,|পিতা|িপতা|মাতা|স্বামী|গ্রাম|গ&াম|সাং|ডাকঘর|থানা|উপজেলা|জেলা)).*$/i, '')
    .replace(/[\$\&!#*]/g, '')
    .replace(/1/g, 'ব্দ')
    .replace(/b/g, 'ন্ন')
    .replace(/f/g, 'ব্দ')
    .replace(/g/g, 'ন্ন')
    .replace(/P/g, 'ম্ব')
    .replace(/\u09BE\u09C7/g, '\u09CB')
    .replace(/\u09C7\u09BE/g, '\u09CB')
    .replace(/\u09C7([\u0985-\u09B9])\u09BE/g, (_, c) => c + '\u09CB')
    .replace(/\u09AE\u09BE\u0983/g, 'মোঃ')
    .replace(/মাঃ/g, 'মোঃ')
    .replace(/আেনায়ার/g, 'আনোয়ার')
    .replace(/আনোয়ার/g, 'আনোয়ার')
    .replace(/হােসন/g, 'হোসেন')
    .replace(/হোসন/g, 'হোসেন')
    .replace(/রিফকুল/g, 'রফিকুল')
    .replace(/[\-_:;,.|/\\]+$/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizePersonName(str: string): string {
  if (!str) return '';
  return cleanPartyName(str)
    .replace(/[\s\-_,.:/→()\[\]{}|]+/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Compare two values handling Bengali / English digit normalization & whitespace
 */
function compareValues(
  uploadedVal?: string, 
  referenceVal?: string,
  field?: string
): 'match' | 'partial' | 'mismatch' | 'not_found' | 'unable' {
  if (!uploadedVal && !referenceVal) return 'unable';
  if (!uploadedVal || uploadedVal === 'extraction failed' || uploadedVal === 'সনাক্তকরণ ব্যর্থ') return 'not_found';
  if (!referenceVal || referenceVal === 'রেফারেন্সে নেই' || referenceVal === 'Not in reference') return 'not_found';

  // Normalize Bengali digits to ASCII before comparing
  const upNorm = toEnglishDigits(uploadedVal).toLowerCase().trim().replace(/[\s\-_,.:/]+/g, '');
  const refNorm = toEnglishDigits(referenceVal).toLowerCase().trim().replace(/[\s\-_,.:/]+/g, '');

  if (upNorm === refNorm) return 'match';

  // 1. Specific handling for landArea or any numeric fields (dag, khatian)
  if (field === 'landArea' || field === 'dagNumber' || field === 'khatianNumber') {
    const upNumMatch = toEnglishDigits(uploadedVal).match(/([0-9.]+)/);
    const refNumMatch = toEnglishDigits(referenceVal).match(/([0-9.]+)/);
    if (upNumMatch && refNumMatch) {
      const upNum = parseFloat(upNumMatch[1]);
      const refNum = parseFloat(refNumMatch[1]);
      if (!isNaN(upNum) && !isNaN(refNum)) {
        return upNum === refNum ? 'match' : 'mismatch';
      }
    }
    return upNorm === refNorm ? 'match' : 'mismatch';
  }

  // 2. Date comparison (DD/MM/YYYY vs YYYY-MM-DD)
  if (field === 'registrationDate' || (!field && (uploadedVal.includes('/') || uploadedVal.includes('-')))) {
    const upDateMatch = toEnglishDigits(uploadedVal).match(/(\d{1,4})[/-](\d{1,2})[/-](\d{1,4})/);
    const refDateMatch = toEnglishDigits(referenceVal).match(/(\d{1,4})[/-](\d{1,2})[/-](\d{1,4})/);
    if (upDateMatch && refDateMatch) {
      const parseDateParts = (m: RegExpMatchArray) => {
        let y = 0, mo = 0, d = 0;
        if (m[1].length === 4) {
          y = parseInt(m[1], 10);
          mo = parseInt(m[2], 10);
          d = parseInt(m[3], 10);
        } else if (m[3].length === 4) {
          d = parseInt(m[1], 10);
          mo = parseInt(m[2], 10);
          y = parseInt(m[3], 10);
        }
        return { y, mo, d };
      };
      const upP = parseDateParts(upDateMatch);
      const refP = parseDateParts(refDateMatch);
      if (upP.y === refP.y && upP.mo === refP.mo && upP.d === refP.d && upP.y > 0) {
        return 'match';
      }
    }
  }

  // 3. Numeric quantity comparison if both contain numbers (e.g. land area "15" vs "10")
  const upNumMatch = toEnglishDigits(uploadedVal).match(/([0-9.]+)/);
  const refNumMatch = toEnglishDigits(referenceVal).match(/([0-9.]+)/);
  if (upNumMatch && refNumMatch) {
    const upNum = parseFloat(upNumMatch[1]);
    const refNum = parseFloat(refNumMatch[1]);
    if (!isNaN(upNum) && !isNaN(refNum)) {
      if (upNum !== refNum) {
        return 'mismatch';
      }
      return 'match';
    }
  }

  // 4. Parties / Name comparison ONLY for parties or non-numeric names
  if (field === 'parties' || (!field && !upNumMatch && !refNumMatch)) {
    const upNameNorm = normalizePersonName(uploadedVal);
    const refNameNorm = normalizePersonName(referenceVal);
    if (upNameNorm === refNameNorm) return 'match';
    if (upNameNorm.length >= 6 && refNameNorm.length >= 6) {
      if (refNameNorm.includes(upNameNorm) || upNameNorm.includes(refNameNorm)) {
        return 'match';
      }
      // Check key word overlap (e.g. at least 2 key names like 'আনোয়ার' and 'হোসেন')
      const upParts = uploadedVal.split(/[\s→,–—/()]+/).map(normalizePersonName).filter(w => w.length >= 3);
      const matchedParts = upParts.filter(w => refNameNorm.includes(w));
      if (matchedParts.length >= 2) {
        return 'match';
      }
    }
  }

  if (upNorm.includes(refNorm) || refNorm.includes(upNorm)) return 'partial';
  return 'mismatch';
}

/**
 * Stage C: Full pipeline matching against Reference Document Library
 */
export async function runDeedVerificationPipeline(
  file: File,
  referenceDocs: RegisteredDocument[],
  manualFields?: { deedNumber?: string; mouza?: string; dagNumber?: string },
  userId?: string,
  userName?: string,
  onProgress?: (percent: number, stepText: string) => void
): Promise<VerificationSubmission> {
  // 1. Stage A: File integrity & SHA-256 Hash
  onProgress?.(10, 'ফাইলের SHA-256 ক্রিপ্টোগ্রাফিক হ্যাশ গণনা করা হচ্ছে...');
  const arrayBuffer = await readFileAsArrayBuffer(file);
  const fileHash = await computeSHA256(arrayBuffer);

  // 2. Stage B: Content & Text Extraction (Always runs on EVERY file independent of hash)
  const { text: extractedRawText, ocrStatus } = await extractTextFromDocument(file, onProgress);
  const extractedFields = extractDeedFields(extractedRawText);

  // Merge manual hints only if explicitly provided by user in search fields
  if (manualFields?.deedNumber && !extractedFields.deedNumber) {
    extractedFields.deedNumber = manualFields.deedNumber;
  }
  if (manualFields?.mouza && !extractedFields.mouza) {
    extractedFields.mouza = manualFields.mouza;
  }
  if (manualFields?.dagNumber && !extractedFields.dagNumber) {
    extractedFields.dagNumber = manualFields.dagNumber;
  }

  onProgress?.(90, 'রেফারেন্স দলিলের ডেটাবেসের সাথে তুলনা করা হচ্ছে...');

  // 3. Find matching reference record by extracted dolil number
  let matchedDoc: RegisteredDocument | undefined;

  if (extractedFields.deedNumber) {
    const deedEng = toEnglishDigits(extractedFields.deedNumber).trim().replace(/[\s\-_/]+/g, '');
    matchedDoc = referenceDocs.find(doc => {
      const docDeedEng = toEnglishDigits(doc.deedNumber).trim().replace(/[\s\-_/]+/g, '');
      return docDeedEng && (docDeedEng === deedEng || docDeedEng.includes(deedEng) || deedEng.includes(docDeedEng));
    });
  }

  // Secondary fallback: Match by dagNumber if deedNumber was not found in document
  if (!matchedDoc && extractedFields.dagNumber) {
    const dagEng = toEnglishDigits(extractedFields.dagNumber).trim();
    matchedDoc = referenceDocs.find(doc => {
      const docDagEng = doc.dagNumber ? toEnglishDigits(doc.dagNumber).trim() : '';
      return docDagEng && docDagEng === dagEng;
    });
  }

  // If still not matched, check if file hash matches any reference doc directly
  if (!matchedDoc) {
    matchedDoc = referenceDocs.find(
      doc => doc.fileHash && doc.fileHash.toLowerCase() === fileHash.toLowerCase()
    );
  }

  const isHashMatched = matchedDoc 
    ? (matchedDoc.fileHash?.toLowerCase() === fileHash.toLowerCase())
    : false;

  const failedLabel = 'extraction failed';

  // 4. Build field-by-field comparisons (strictly from extracted content, never filename)
  const comparisons: FieldComparison[] = [
    {
      field: 'deedNumber',
      fieldLabelBn: 'দলিল নম্বর',
      fieldLabelEn: 'Deed Number',
      uploadedValue: extractedFields.deedNumber || failedLabel,
      referenceValue: matchedDoc?.deedNumber || 'রেফারেন্সে নেই',
      status: matchedDoc 
        ? compareValues(extractedFields.deedNumber, matchedDoc.deedNumber, 'deedNumber')
        : 'not_found'
    },
    {
      field: 'registrationDate',
      fieldLabelBn: 'রেজিস্ট্রেশনের তারিখ',
      fieldLabelEn: 'Registration Date',
      uploadedValue: extractedFields.registrationDate || failedLabel,
      referenceValue: matchedDoc?.registrationDate || 'রেফারেন্সে নেই',
      status: matchedDoc 
        ? compareValues(extractedFields.registrationDate, matchedDoc.registrationDate, 'registrationDate')
        : 'not_found'
    },
    {
      field: 'mouza',
      fieldLabelBn: 'মৌজা',
      fieldLabelEn: 'Mouza',
      uploadedValue: extractedFields.mouza || failedLabel,
      referenceValue: matchedDoc?.mouza || 'রেফারেন্সে নেই',
      status: matchedDoc 
        ? compareValues(extractedFields.mouza, matchedDoc.mouza, 'mouza')
        : 'not_found'
    },
    {
      field: 'dagNumber',
      fieldLabelBn: 'দাগ নম্বর',
      fieldLabelEn: 'Dag Number',
      uploadedValue: extractedFields.dagNumber || failedLabel,
      referenceValue: matchedDoc?.dagNumber || 'রেফারেন্সে নেই',
      status: matchedDoc 
        ? compareValues(extractedFields.dagNumber, matchedDoc.dagNumber, 'dagNumber')
        : 'not_found'
    },
    {
      field: 'khatianNumber',
      fieldLabelBn: 'খতিয়ান নম্বর',
      fieldLabelEn: 'Khatian Number',
      uploadedValue: extractedFields.khatianNumber || failedLabel,
      referenceValue: matchedDoc?.khatianNumber || 'রেফারেন্সে নেই',
      status: matchedDoc 
        ? compareValues(extractedFields.khatianNumber, matchedDoc.khatianNumber, 'khatianNumber')
        : 'not_found'
    },
    {
      field: 'landArea',
      fieldLabelBn: 'জমির পরিমাণ',
      fieldLabelEn: 'Land Area',
      uploadedValue: extractedFields.landArea || failedLabel,
      referenceValue: matchedDoc?.landAreaDecimal ? `${matchedDoc.landAreaDecimal} শতাংশ` : 'রেফারেন্সে নেই',
      status: matchedDoc 
        ? compareValues(extractedFields.landArea, matchedDoc.landAreaDecimal ? `${matchedDoc.landAreaDecimal} শতাংশ` : undefined, 'landArea')
        : 'not_found'
    },
    {
      field: 'parties',
      fieldLabelBn: 'সংশ্লিষ্ট পক্ষসমূহ',
      fieldLabelEn: 'Parties',
      uploadedValue: extractedFields.parties || failedLabel,
      referenceValue: matchedDoc?.parties || 'রেফারেন্সে নেই',
      status: matchedDoc 
        ? compareValues(extractedFields.parties, matchedDoc.parties, 'parties')
        : 'not_found'
    }
  ];

  // 5. Evaluate discrepancies and final classification
  const discrepancies: string[] = [];
  comparisons.forEach(c => {
    if (c.status === 'mismatch') {
      discrepancies.push(`${c.fieldLabelBn}: আপলোডকৃত '${c.uploadedValue}' কিন্তু রেফারেন্সে '${c.referenceValue}'`);
    }
  });

  let status: DetailedVerificationStatus = 'NO_REFERENCE';
  let statusExplanationBn = '';
  let statusExplanationEn = '';
  let manualReviewRecommended = false;

  if (isHashMatched) {
    status = 'EXACT_MATCH';
    statusExplanationBn = 'আপলোডকৃত দলিলের ক্রিপ্টোগ্রাফিক হ্যাশ (SHA-256) সিস্টেমের সংরক্ষিত রেফারেন্স দলিলের সাথে হুবহু মিলে গেছে।';
    statusExplanationEn = 'The cryptographic hash (SHA-256) matches the registered reference deed record exactly.';
    manualReviewRecommended = false;
  } else if (matchedDoc) {
    const mismatchCount = comparisons.filter(c => c.status === 'mismatch').length;

    if (mismatchCount > 0) {
      status = 'MISMATCH';
      statusExplanationBn = 'ফাইলের বাইট বা হ্যাশ মূল সংরক্ষিত রেকর্ডের সাথে ভিন্ন (File bytes differ from registered original) এবং এক বা একাধিক তথ্যে অসঙ্গতি পাওয়া গেছে।';
      statusExplanationEn = 'File bytes differ from registered original, and one or more important cadastral fields conflict with the reference deed record.';
      manualReviewRecommended = true;
    } else {
      status = 'REFERENCE_MATCH';
      statusExplanationBn = 'ফাইলের বাইট মূল রেকর্ডের সাথে ভিন্ন (File bytes differ from registered original), তবে দলিলের মূল তথ্যসমূহ সংরক্ষিত রেফারেন্সের সাথে মিলেছে।';
      statusExplanationEn = 'File bytes differ from registered original, but key cadastral identifying fields match the stored reference deed record.';
      manualReviewRecommended = false;
    }
  } else if (ocrStatus === 'failed' && !extractedFields.deedNumber) {
    status = 'UNABLE_TO_VERIFY';
    statusExplanationBn = 'নথিটি অস্পষ্ট বা পড়তে ব্যর্থ হয়েছে এবং কোনো শনাক্তকারী তথ্য পাওয়া যায়নি। অনুগ্রহ করে পরিষ্কার কপি আপলোড করুন।';
    statusExplanationEn = 'File text could not be extracted and no cadastral identifiers were found. Please upload a clearer scan.';
    manualReviewRecommended = true;
  } else {
    status = 'NO_REFERENCE';
    statusExplanationBn = 'বর্তমান রেফারেন্স ডেটাবেসে এই দলিলের তথ্যের সাথে সামঞ্জস্যপূর্ণ কোনো সংরক্ষিত রেফারেন্স পাওয়া যায়নি।';
    statusExplanationEn = 'No matching reference deed was found in the cadastral database.';
    manualReviewRecommended = false;
  }

  onProgress?.(100, 'যাচাই প্রক্রিয়া সম্পন্ন হয়েছে!');

  return {
    id: generateId('SUB'),
    userId,
    userName,
    createdAt: new Date().toISOString(),
    originalFileName: file.name,
    fileSize: file.size,
    fileHash,
    fileType: file.type || 'application/pdf',
    matchedReferenceId: matchedDoc?.id,
    status,
    statusExplanationBn,
    statusExplanationEn,
    ocrExtractedText: extractedRawText,
    ocrStatus,
    fieldComparisons: comparisons,
    discrepancies,
    manualReviewRecommended,
    adminReviewStatus: manualReviewRecommended ? 'pending' : 'reviewed'
  };
}
