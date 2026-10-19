// ============================================================
// OCR & Deed Verification Pipeline
// Multi-stage analysis: Hash -> Content Extraction -> Field Comparison
// ============================================================

import { createWorker } from 'tesseract.js';
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
      onProgress?.(30, 'পিডিএফ ফাইল বিশ্লেষণ করা হচ্ছে...');
      // Extract binary stream text snippets
      const buffer = await readFileAsArrayBuffer(file);
      const textDecoder = new TextDecoder('utf-8', { fatal: false });
      const rawString = textDecoder.decode(buffer);

      // Search for text streams in PDF
      const matches = rawString.match(/\(([^()]{3,})\)[\s]*Tj/g) || [];
      const extractedTokens = matches
        .map(m => m.replace(/^\(/, '').replace(/\)[\s]*Tj$/, ''))
        .filter(t => t.length > 2);

      let pdfText = extractedTokens.join(' ');
      if (!pdfText || pdfText.length < 20) {
        // Fallback extract printable ascii/utf8 blocks
        const printableMatches = rawString.match(/[a-zA-Z0-9\u0980-\u09FF\s,.-]{5,}/g) || [];
        pdfText = printableMatches.slice(0, 100).join(' ');
      }

      onProgress?.(80, 'পিডিএফ মেটাডাটা ও তথ্য শনাক্ত সম্পন্ন');
      return {
        text: pdfText.length > 20 ? pdfText : `[পিডিএফ ফাইল: ${file.name}]`,
        ocrStatus: pdfText.length > 20 ? 'completed' : 'partial'
      };
    } catch (err) {
      console.warn('PDF parsing error:', err);
      return { text: `[পিডিএফ ফাইল: ${file.name}]`, ocrStatus: 'failed' };
    }
  }

  return { text: `[নথি: ${file.name}]`, ocrStatus: 'not_needed' };
}

/**
 * Extract structured cadastral deed fields from raw text
 */
export function extractDeedFields(rawText: string, fileName?: string): ExtractedDeedFields {
  const fields: ExtractedDeedFields = { rawText };
  const combined = `${fileName || ''}\n${rawText}`;

  // 1. Deed Number extraction
  // Match patterns like: দলিল নং ১২৩৪, Deed No. 1234, দলিল নম্বর: ৪৫০২, বা ফাইলে "deed-1042"
  const deedRegexes = [
    /(?:দলিল\s*(?:নম্বর|নং|নম্বার)?[:\s\-_]*)([০-৯0-9\w/-]+)/i,
    /(?:deed\s*(?:no|number)?[:\s\-_]*)([০-৯0-9\w/-]+)/i,
    /(?:দলিল[:\s]+)([০-৯0-9\w/-]+)/i,
    /deed[_\-\s]+([0-9]+)/i
  ];
  for (const rx of deedRegexes) {
    const match = combined.match(rx);
    if (match && match[1]) {
      fields.deedNumber = match[1].trim();
      break;
    }
  }

  // 2. Dag Number extraction
  const dagRegexes = [
    /(?:দাগ\s*(?:নং|নম্বর)?[:\s\-_]*)([০-৯0-9/-]+)/i,
    /(?:dag\s*(?:no|number)?[:\s\-_]*)([০-৯0-9/-]+)/i,
    /(?:plot\s*(?:no)?[:\s\-_]*)([০-৯0-9/-]+)/i
  ];
  for (const rx of dagRegexes) {
    const match = combined.match(rx);
    if (match && match[1]) {
      fields.dagNumber = match[1].trim();
      break;
    }
  }

  // 3. Khatian Number extraction
  const khatianRegexes = [
    /(?:খতিয়ান\s*(?:নং|নম্বর)?[:\s\-_]*)([০-৯0-9/-]+)/i,
    /(?:khatian\s*(?:no|number)?[:\s\-_]*)([০-৯0-9/-]+)/i
  ];
  for (const rx of khatianRegexes) {
    const match = combined.match(rx);
    if (match && match[1]) {
      fields.khatianNumber = match[1].trim();
      break;
    }
  }

  // 4. Mouza extraction
  const mouzaRegexes = [
    /(?:মৌজা[:\s\-_]*)([\u0980-\u09FFa-zA-Z\s]+?)(?:,|\n|জেএল|দাগ|খতিয়ান|$)/i,
    /(?:mouza[:\s\-_]*)([a-zA-Z\s]+?)(?:,|\n|jl|dag|$)/i
  ];
  for (const rx of mouzaRegexes) {
    const match = combined.match(rx);
    if (match && match[1] && match[1].trim().length > 1) {
      fields.mouza = match[1].trim();
      break;
    }
  }

  // 5. Land Area
  const areaRegexes = [
    /(?:জমির\s*পরিমাণ|পরিমাণ|area)[:\s\-_]*([০-৯0-9.]+)\s*(শতাংশ|শতক|একর|decimal)?/i,
    /([০-৯0-9.]+)\s*(শতাংশ|শতক|decimal)/i
  ];
  for (const rx of areaRegexes) {
    const match = combined.match(rx);
    if (match && match[1]) {
      fields.landArea = `${match[1]} ${match[2] || 'শতাংশ'}`.trim();
      break;
    }
  }

  // 6. Registration Date / Year
  const dateRegexes = [
    /(?:তারিখ|রেজিস্ট্রেশন|তারিখঃ|date)[:\s\-_]*([০-৯0-9\/\-\.]+)/i,
    /([০-৯0-9]{1,2}[\/\-][০-৯0-9]{1,2}[\/\-][০-৯0-9]{2,4})/,
    /(?:20[0-2][0-9]|19[8-9][0-9])/
  ];
  for (const rx of dateRegexes) {
    const match = combined.match(rx);
    if (match && match[1]) {
      fields.registrationDate = match[1].trim();
      break;
    } else if (match && match[0]) {
      fields.registrationDate = match[0].trim();
      break;
    }
  }

  // 7. Parties / Names
  const partyRegexes = [
    /(?:দাতা|গ্রহীতা|মালিক|parties|buyer|seller)[:\s\-_]*([\u0980-\u09FFa-zA-Z\s,]+?)(?:\n|দলিল|দাগ|$)/i
  ];
  for (const rx of partyRegexes) {
    const match = combined.match(rx);
    if (match && match[1] && match[1].trim().length > 2) {
      fields.parties = match[1].trim();
      break;
    }
  }

  return fields;
}

/**
 * Compare two values handling Bengali / English digit normalization & whitespace
 */
function compareValues(
  uploadedVal?: string, 
  referenceVal?: string
): 'match' | 'partial' | 'mismatch' | 'not_found' | 'unable' {
  if (!uploadedVal && !referenceVal) return 'unable';
  if (!uploadedVal) return 'not_found';
  if (!referenceVal) return 'not_found';

  const upNorm = toEnglishDigits(uploadedVal).toLowerCase().trim().replace(/[\s\-_,.:]+/g, '');
  const refNorm = toEnglishDigits(referenceVal).toLowerCase().trim().replace(/[\s\-_,.:]+/g, '');

  if (upNorm === refNorm) return 'match';
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

  // Check exact file hash match
  const exactMatchDoc = referenceDocs.find(
    doc => doc.fileHash && doc.fileHash.toLowerCase() === fileHash.toLowerCase()
  );

  // 2. Stage B: Content & Text Extraction
  const { text: extractedRawText, ocrStatus } = await extractTextFromDocument(file, onProgress);
  const extractedFields = extractDeedFields(extractedRawText, file.name);

  // Merge manual hints if provided by user
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

  // 3. Find matching reference record candidate
  let matchedDoc: RegisteredDocument | undefined = exactMatchDoc;

  if (!matchedDoc) {
    // Try matching by Deed Number
    if (extractedFields.deedNumber) {
      const deedEng = toEnglishDigits(extractedFields.deedNumber).trim();
      matchedDoc = referenceDocs.find(
        doc => doc.deedNumber && toEnglishDigits(doc.deedNumber).trim() === deedEng
      );
    }

    // Try matching by Dag & Mouza
    if (!matchedDoc && extractedFields.dagNumber) {
      const dagEng = toEnglishDigits(extractedFields.dagNumber).trim();
      matchedDoc = referenceDocs.find(doc => {
        const docDagEng = doc.dagNumber ? toEnglishDigits(doc.dagNumber).trim() : '';
        return docDagEng && docDagEng === dagEng;
      });
    }

    // Fallback: match by filename reference
    if (!matchedDoc) {
      matchedDoc = referenceDocs.find(doc => 
        doc.fileName && file.name.toLowerCase().includes(doc.fileName.toLowerCase().replace(/\.[^.]+$/, ''))
      );
    }
  }

  // 4. Build field-by-field comparisons
  const comparisons: FieldComparison[] = [
    {
      field: 'deedNumber',
      fieldLabelBn: 'দলিল নম্বর',
      fieldLabelEn: 'Deed Number',
      uploadedValue: extractedFields.deedNumber || 'সনাক্ত হয়নি',
      referenceValue: matchedDoc?.deedNumber || 'রেফারেন্সে নেই',
      status: matchedDoc 
        ? compareValues(extractedFields.deedNumber, matchedDoc.deedNumber)
        : 'not_found'
    },
    {
      field: 'registrationDate',
      fieldLabelBn: 'রেজিস্ট্রেশনের তারিখ',
      fieldLabelEn: 'Registration Date',
      uploadedValue: extractedFields.registrationDate || 'সনাক্ত হয়নি',
      referenceValue: matchedDoc?.registrationDate || 'রেফারেন্সে নেই',
      status: matchedDoc 
        ? compareValues(extractedFields.registrationDate, matchedDoc.registrationDate)
        : 'not_found'
    },
    {
      field: 'mouza',
      fieldLabelBn: 'মৌজা',
      fieldLabelEn: 'Mouza',
      uploadedValue: extractedFields.mouza || 'সনাক্ত হয়নি',
      referenceValue: matchedDoc?.mouza || 'রেফারেন্সে নেই',
      status: matchedDoc 
        ? compareValues(extractedFields.mouza, matchedDoc.mouza)
        : 'not_found'
    },
    {
      field: 'dagNumber',
      fieldLabelBn: 'দাগ নম্বর',
      fieldLabelEn: 'Dag Number',
      uploadedValue: extractedFields.dagNumber || 'সনাক্ত হয়নি',
      referenceValue: matchedDoc?.dagNumber || 'রেফারেন্সে নেই',
      status: matchedDoc 
        ? compareValues(extractedFields.dagNumber, matchedDoc.dagNumber)
        : 'not_found'
    },
    {
      field: 'khatianNumber',
      fieldLabelBn: 'খতিয়ান নম্বর',
      fieldLabelEn: 'Khatian Number',
      uploadedValue: extractedFields.khatianNumber || 'সনাক্ত হয়নি',
      referenceValue: matchedDoc?.khatianNumber || 'রেফারেন্সে নেই',
      status: matchedDoc 
        ? compareValues(extractedFields.khatianNumber, matchedDoc.khatianNumber)
        : 'not_found'
    },
    {
      field: 'landArea',
      fieldLabelBn: 'জমির পরিমাণ',
      fieldLabelEn: 'Land Area',
      uploadedValue: extractedFields.landArea || 'সনাক্ত হয়নি',
      referenceValue: matchedDoc?.landAreaDecimal ? `${matchedDoc.landAreaDecimal} শতাংশ` : 'রেফারেন্সে নেই',
      status: matchedDoc 
        ? compareValues(extractedFields.landArea, matchedDoc.landAreaDecimal ? String(matchedDoc.landAreaDecimal) : undefined)
        : 'not_found'
    },
    {
      field: 'parties',
      fieldLabelBn: 'সংশ্লিষ্ট পক্ষসমূহ',
      fieldLabelEn: 'Parties',
      uploadedValue: extractedFields.parties || 'সনাক্ত হয়নি',
      referenceValue: matchedDoc?.parties || 'রেফারেন্সে নেই',
      status: matchedDoc 
        ? compareValues(extractedFields.parties, matchedDoc.parties)
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

  if (exactMatchDoc) {
    status = 'EXACT_MATCH';
    statusExplanationBn = 'আপলোডকৃত দলিলের ক্রিপ্টোগ্রাফিক হ্যাশ (SHA-256) সিস্টেমের সংরক্ষিত রেফারেন্স দলিলের সাথে হুবহু মিলে গেছে।';
    statusExplanationEn = 'The cryptographic hash (SHA-256) matches the registered reference deed record exactly.';
    manualReviewRecommended = false;
  } else if (matchedDoc) {
    const matchCount = comparisons.filter(c => c.status === 'match').length;
    const mismatchCount = comparisons.filter(c => c.status === 'mismatch').length;

    if (mismatchCount > 0) {
      status = 'MISMATCH';
      statusExplanationBn = 'রেফারেন্স দলিলের তথ্যের সাথে এক বা একাধিক গুরুত্বপূর্ণ তথ্যের অমিল বা অসঙ্গতি পাওয়া গেছে।';
      statusExplanationEn = 'One or more important cadastral fields conflict with the reference deed record.';
      manualReviewRecommended = true;
    } else if (matchCount >= 2) {
      status = 'REFERENCE_MATCH';
      statusExplanationBn = 'দলিল নম্বর ও মৌজা/দাগসহ মূল শনাক্তকারী তথ্যসমূহ সংরক্ষিত রেফারেন্স তথ্যের সাথে সঠিকভাবে মিলেছে।';
      statusExplanationEn = 'Key identifying fields match the stored cadastral reference record.';
      manualReviewRecommended = false;
    } else {
      status = 'PARTIAL_MATCH';
      statusExplanationBn = 'কিছু তথ্য মিলেছে তবে কিছু তথ্য অস্পষ্ট বা নথিতে পাওয়া যায়নি। কর্মকর্তা দ্বারা ম্যানুয়াল যাচাই প্রয়োজন।';
      statusExplanationEn = 'Some fields matched while others are incomplete or unverified. Manual review recommended.';
      manualReviewRecommended = true;
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
