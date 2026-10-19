import { useState, useRef, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Upload, FileCheck, Search, AlertTriangle, CheckCircle,
  XCircle, HelpCircle, Info, Printer,
  Eye, Trash2, Clock, ShieldCheck, FileText, ArrowRight,
  Download, RotateCcw
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Card, Breadcrumb, Disclaimer } from '../components/SharedUI';
import { computeSHA256, readFileAsArrayBuffer, triggerPrint } from '../utils';
import { storeFileBlob, downloadBlob, previewBlob, getStoredDocumentBlob } from '../utils/fileStorage';
import { runDeedVerificationPipeline } from '../utils/ocrService';
import type { 
  DetailedVerificationStatus, 
  VerificationSubmission, 
  RegisteredDocument 
} from '../types';

export default function DeedVerificationPage() {
  const { 
    t, 
    language, 
    registeredDocuments, 
    verificationSubmissions, 
    dispatch, 
    addAudit, 
    currentUser 
  } = useApp();
  const [searchParams] = useSearchParams();
  const paramId = searchParams.get('id') || '';

  const [file, setFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [recordId, setRecordId] = useState(paramId);
  const [optionalDeedNo, setOptionalDeedNo] = useState('');
  const [optionalMouza, setOptionalMouza] = useState('');
  const [optionalDag, setOptionalDag] = useState('');

  const [computedHash, setComputedHash] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingStatusText, setProcessingStatusText] = useState('');

  // Active submission result
  const [activeSubmission, setActiveSubmission] = useState<VerificationSubmission | null>(null);
  const [activeTab, setActiveTab] = useState<'upload' | 'record' | 'history'>(paramId ? 'record' : 'upload');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clean up object URL when file changes
  useEffect(() => {
    return () => {
      if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl);
    };
  }, [filePreviewUrl]);

  // Filter user's past submissions
  const userSubmissions = verificationSubmissions.filter(s => 
    currentUser ? (s.userId === currentUser.id || s.userName === currentUser.name) : true
  );

  // Retrieve persistent stored file blob and load into verification workflow
  const loadSubmissionAndFile = useCallback(async (sub: VerificationSubmission, switchToUploadTab = false) => {
    setActiveSubmission(sub);
    try {
      localStorage.setItem('vumi_active_verification_id', sub.id);
    } catch {
      // ignore
    }

    // Retrieve file blob persistently stored in IndexedDB
    const storedBlob = await getStoredDocumentBlob(sub.id, sub.fileHash);
    if (storedBlob) {
      const mimeType = sub.fileType || storedBlob.type || (sub.originalFileName.endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream');
      const retrievedFile = new File([storedBlob], sub.originalFileName, {
        type: mimeType,
        lastModified: new Date(sub.createdAt).getTime(),
      });
      setFile(retrievedFile);
      setComputedHash(sub.fileHash);
      if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl);
      const url = URL.createObjectURL(storedBlob);
      setFilePreviewUrl(url);
    }

    if (switchToUploadTab) {
      setActiveTab('upload');
      window.scrollTo({ top: 200, behavior: 'smooth' });
    }
  }, [filePreviewUrl]);

  // Restore active verification and its persistent stored document after page refresh or application restart
  useEffect(() => {
    if (activeSubmission) return;
    try {
      const targetId = paramId || localStorage.getItem('vumi_active_verification_id');
      if (targetId) {
        const found = verificationSubmissions.find(s => s.id === targetId || s.fileHash === targetId);
        if (found) {
          loadSubmissionAndFile(found, false);
        }
      }
    } catch {
      // ignore
    }
  }, [verificationSubmissions, paramId, activeSubmission, loadSubmissionAndFile]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    
    // File validation: Size limit 15MB
    if (f.size > 15 * 1024 * 1024) {
      alert(language === 'bn' ? 'ফাইল সাইজ ১৫ মেগাবাইটের বেশি হতে পারবে না' : 'File size cannot exceed 15MB');
      return;
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'text/plain'];
    if (!allowedTypes.includes(f.type) && !f.name.match(/\.(pdf|jpg|jpeg|png|txt)$/i)) {
      alert(language === 'bn' 
        ? 'শুধুমাত্র PDF, JPG, PNG বা TXT ফাইল গ্রহণযোগ্য' 
        : 'Only PDF, JPG, PNG or TXT files are accepted');
      return;
    }

    setFile(f);
    setActiveSubmission(null);

    // Create preview URL
    if (f.type.startsWith('image/') || f.type === 'application/pdf') {
      const url = URL.createObjectURL(f);
      setFilePreviewUrl(url);
    } else {
      setFilePreviewUrl(null);
    }

    try {
      const buffer = await readFileAsArrayBuffer(f);
      const hash = await computeSHA256(buffer);
      setComputedHash(hash);
      // Persistently cache file blob in IndexedDB by hash
      await storeFileBlob(hash, f);
    } catch {
      setComputedHash('');
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setFilePreviewUrl(null);
    setComputedHash('');
    setActiveSubmission(null);
    try {
      localStorage.removeItem('vumi_active_verification_id');
    } catch {
      // ignore
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRunVerification = async () => {
    if (!file) return;

    setIsProcessing(true);
    setProcessingProgress(10);
    setProcessingStatusText(language === 'bn' ? 'যাচাই পাইপলাইন চালু হচ্ছে...' : 'Initializing verification pipeline...');

    try {
      const submission = await runDeedVerificationPipeline(
        file,
        registeredDocuments,
        {
          deedNumber: optionalDeedNo || recordId,
          mouza: optionalMouza,
          dagNumber: optionalDag
        },
        currentUser?.id,
        currentUser?.name,
        (progress, status) => {
          setProcessingProgress(progress);
          setProcessingStatusText(status);
        }
      );

      // Persistently store the uploaded file blob in IndexedDB under submission.id AND submission.fileHash
      await storeFileBlob(submission.id, file);
      if (submission.fileHash) {
        await storeFileBlob(submission.fileHash, file);
      }

      // Persist active ID so verification result and file remain available after page refresh / restart
      try {
        localStorage.setItem('vumi_active_verification_id', submission.id);
      } catch {
        // ignore
      }

      setActiveSubmission(submission);
      dispatch({ type: 'ADD_VERIFICATION_SUBMISSION', payload: submission });

      addAudit(
        'দলিল যাচাই',
        'Deed Verification',
        'document',
        submission.id,
        `ফলাফল: ${submission.status}, ফাইল: ${file.name}`
      );
    } catch (err) {
      console.error('Verification error:', err);
      // Show a user-friendly error state
      const errorSubmission: VerificationSubmission = {
        id: `ERR-${Date.now()}`,
        userId: currentUser?.id,
        userName: currentUser?.name,
        createdAt: new Date().toISOString(),
        originalFileName: file.name,
        fileSize: file.size,
        fileHash: computedHash || '',
        status: 'UNABLE_TO_VERIFY',
        statusExplanationBn: 'প্রক্রিয়াকরণের সময় একটি ত্রুটি ঘটেছে। একটু পরে আবার চেষ্টা করুন।',
        statusExplanationEn: 'An error occurred during processing. Please try again.',
        ocrStatus: 'failed',
        fieldComparisons: [],
        discrepancies: ['Processing error'],
        manualReviewRecommended: true,
      };
      setActiveSubmission(errorSubmission);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVerifyByRecordId = useCallback(() => {
    if (!recordId.trim()) return;
    setIsProcessing(true);

    const found = registeredDocuments.find(
      doc => doc.id.toLowerCase() === recordId.trim().toLowerCase() || 
             doc.deedNumber.toLowerCase() === recordId.trim().toLowerCase()
    );

    if (found) {
      const mockSubmission: VerificationSubmission = {
        id: `REC-${Date.now()}`,
        userId: currentUser?.id,
        userName: currentUser?.name,
        createdAt: new Date().toISOString(),
        originalFileName: found.fileName || 'রেকর্ড অনুসন্ধান',
        fileSize: 0,
        fileHash: found.fileHash,
        matchedReferenceId: found.id,
        status: 'REFERENCE_MATCH',
        statusExplanationBn: 'রেকর্ড ডেটাবেসে দলিল নম্বর এবং মৌজার তথ্য সক্রিয় অবস্থায় পাওয়া গেছে।',
        statusExplanationEn: 'Active deed record found in cadastral reference database.',
        ocrStatus: 'not_needed',
        fieldComparisons: [
          { field: 'deedNumber', fieldLabelBn: 'দলিল নম্বর', fieldLabelEn: 'Deed Number', uploadedValue: found.deedNumber, referenceValue: found.deedNumber, status: 'match' },
          { field: 'registrationDate', fieldLabelBn: 'রেজিস্ট্রেশনের তারিখ', fieldLabelEn: 'Registration Date', uploadedValue: found.registrationDate, referenceValue: found.registrationDate, status: 'match' },
          { field: 'mouza', fieldLabelBn: 'মৌজা', fieldLabelEn: 'Mouza', uploadedValue: found.mouza || 'তথ্য নেই', referenceValue: found.mouza || 'তথ্য নেই', status: 'match' },
          { field: 'dagNumber', fieldLabelBn: 'দাগ নম্বর', fieldLabelEn: 'Dag Number', uploadedValue: found.dagNumber || 'তথ্য নেই', referenceValue: found.dagNumber || 'তথ্য নেই', status: 'match' },
          { field: 'khatianNumber', fieldLabelBn: 'খতিয়ান নম্বর', fieldLabelEn: 'Khatian Number', uploadedValue: found.khatianNumber || 'তথ্য নেই', referenceValue: found.khatianNumber || 'তথ্য নেই', status: 'match' },
          { field: 'landArea', fieldLabelBn: 'জমির পরিমাণ', fieldLabelEn: 'Land Area', uploadedValue: found.landAreaDecimal ? `${found.landAreaDecimal} শতাংশ` : 'তথ্য নেই', referenceValue: found.landAreaDecimal ? `${found.landAreaDecimal} শতাংশ` : 'তথ্য নেই', status: 'match' },
        ],
        discrepancies: [],
        manualReviewRecommended: false,
        adminReviewStatus: 'reviewed'
      };
      setActiveSubmission(mockSubmission);
    } else {
      const notFoundSubmission: VerificationSubmission = {
        id: `REC-${Date.now()}`,
        userId: currentUser?.id,
        userName: currentUser?.name,
        createdAt: new Date().toISOString(),
        originalFileName: `অনুসন্ধান: ${recordId}`,
        fileSize: 0,
        fileHash: '',
        status: 'NO_REFERENCE',
        statusExplanationBn: 'উক্ত রেকর্ড আইডি বা দলিল নম্বর দিয়ে রেফারেন্স লাইব্রেরিতে কোনো দলিল পাওয়া যায়নি। তবে এই দলিলটি অবৈধ নয় — এর অর্থ হচ্ছে এটি বর্তমান রেফারেন্স ডেটাবেসে অন্তর্ভুক্ত নয়।',
        statusExplanationEn: 'No reference record found with this ID or Deed Number. This does not imply the deed is invalid — it may not be included in the current reference database.',
        ocrStatus: 'not_needed',
        fieldComparisons: [],
        discrepancies: ['রেকর্ড আইডি বিদ্যমান নেই'],
        manualReviewRecommended: false,
        adminReviewStatus: 'reviewed'
      };
      setActiveSubmission(notFoundSubmission);
    }

    addAudit(
      'রেকর্ড অনুসন্ধান',
      'Record Search',
      'document',
      recordId,
      `রেকর্ড আইডি দিয়ে অনুসন্ধান: ${recordId}`
    );

    setIsProcessing(false);
  }, [recordId, registeredDocuments, currentUser, addAudit]);

  const statusConfig: Record<DetailedVerificationStatus, {
    icon: any;
    className: string;
    badgeBg: string;
    badgeColor: string;
    titleBn: string;
    titleEn: string;
    nextStepBn: string;
    nextStepEn: string;
  }> = {
    EXACT_MATCH: {
      icon: CheckCircle,
      className: 'result-match',
      badgeBg: '#10b981',
      badgeColor: '#ffffff',
      titleBn: 'EXACT FILE MATCH (ক্রিপ্টোগ্রাফিক হ্যাশ হুবহু মিল)',
      titleEn: 'EXACT FILE MATCH (Cryptographic Hash Match)',
      nextStepBn: 'ফাইলটি সরকারি রেফারেন্স নথির ডিজিটাল প্রতিলিপি। নামজারি বা অন্যান্য কার্যক্রমে এটি ব্যবহারযোগ্য।',
      nextStepEn: 'The file is a bit-for-bit digital replica of the reference record.',
    },
    REFERENCE_MATCH: {
      icon: CheckCircle,
      className: 'result-match',
      badgeBg: '#059669',
      badgeColor: '#ffffff',
      titleBn: 'REFERENCE MATCH — FIELDS MATCH (তথ্যগত মিল)',
      titleEn: 'REFERENCE MATCH — FIELDS MATCH',
      nextStepBn: 'দলিল নম্বর, মৌজা ও দাগের তথ্য সরকারি রেজিস্টারের সাথে মিলেছে। পরবর্তী যাচাইয়ের জন্য প্রস্তুত।',
      nextStepEn: 'Key cadastral fields match the stored registry reference.',
    },
    PARTIAL_MATCH: {
      icon: AlertTriangle,
      className: 'result-notfound',
      badgeBg: '#f59e0b',
      badgeColor: '#ffffff',
      titleBn: 'PARTIAL MATCH — MANUAL REVIEW (আংশিক মিল / পর্যালোচনা প্রয়োজন)',
      titleEn: 'PARTIAL MATCH — MANUAL REVIEW REQUIRED',
      nextStepBn: 'কিছু তথ্য অস্পষ্ট বা অমিল রয়েছে। সহকারী কমিশনার (ভূমি) বা সাব-রেজিস্ট্রারের ম্যানুয়াল যাচাই প্রয়োজন।',
      nextStepEn: 'Some fields matched while others are incomplete. Official manual review recommended.',
    },
    MISMATCH: {
      icon: XCircle,
      className: 'result-mismatch',
      badgeBg: '#ef4444',
      badgeColor: '#ffffff',
      titleBn: 'MISMATCH — REFERENCE CONFLICT (তথ্যগত অসঙ্গতি / অমিল)',
      titleEn: 'MISMATCH — REFERENCE CONFLICT',
      nextStepBn: 'রেজিস্ট্রেশনের তথ্যের সাথে আপলোডকৃত দলিলের দাগ, খতিয়ান বা দলিল নম্বরে অসঙ্গতি দেখা গেছে। সংশ্লিষ্ট অফিসে যোগাযোগ করুন। শুধুমাত্র এই ফলাফলের ভিত্তিতে দলিলকে জাল বলা যাবে না।',
      nextStepEn: 'Cadastral discrepancies detected against stored references. Contact the relevant land office. This result alone does not establish fraud.',
    },
    NO_REFERENCE: {
      icon: HelpCircle,
      className: 'result-unable',
      badgeBg: '#64748b',
      badgeColor: '#ffffff',
      titleBn: 'NO REFERENCE FOUND (রেফারেন্স রেকর্ড পাওয়া যায়নি)',
      titleEn: 'NO REFERENCE FOUND',
      nextStepBn: 'বর্তমান রেফারেন্স ডেটাবেসে এই দলিলের তথ্য পাওয়া যায়নি। তবে এর অর্থ এই নয় যে দলিলটি অবৈধ।',
      nextStepEn: 'No cadastral record found in current library. This does not imply invalidity.',
    },
    UNABLE_TO_VERIFY: {
      icon: AlertTriangle,
      className: 'result-unable',
      badgeBg: '#475569',
      badgeColor: '#ffffff',
      titleBn: 'UNABLE TO VERIFY (যাচাই সম্ভব হয়নি)',
      titleEn: 'UNABLE TO VERIFY',
      nextStepBn: 'নথির স্ক্যান বা টেক্সট অস্পষ্ট হওয়ায় তথ্য পড়া সম্ভব হয়নি। পরিষ্কার ও উচ্চ রেজুলিউশনের ফাইল আপলোড করুন।',
      nextStepEn: 'Document scan or image quality is too low to extract text reliably.',
    },
  };

  const matchedRefDoc: RegisteredDocument | undefined = activeSubmission?.matchedReferenceId
    ? registeredDocuments.find(d => d.id === activeSubmission.matchedReferenceId)
    : undefined;

  return (
    <div className="page-deed-verify">
      <div className="container">
        <Breadcrumb items={[
          { label: t('nav.home'), path: '/' },
          { label: t('nav.deedVerify') },
        ]} />

        <h1 className="page-title">{t('deed.title')}</h1>
        <p className="page-subtitle">{t('deed.subtitle')}</p>

        <Disclaimer text={t('deed.hashDisclaimer')} type="info" />

        {/* Tabs — Upload, Record ID search, History */}
        <div className="tab-bar">
          <button
            className={`tab-btn ${activeTab === 'upload' ? 'active' : ''}`}
            onClick={() => setActiveTab('upload')}
          >
            <Upload size={16} />
            <span>{t('deed.uploadFile')}</span>
          </button>
          <button
            className={`tab-btn ${activeTab === 'record' ? 'active' : ''}`}
            onClick={() => setActiveTab('record')}
          >
            <Search size={16} />
            <span>{t('deed.recordId')}</span>
          </button>
          <button
            className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            <Clock size={16} />
            <span>{language === 'bn' ? `পূর্ববর্তী যাচাই (${userSubmissions.length})` : `My Verifications (${userSubmissions.length})`}</span>
          </button>
        </div>

        {/* Upload & Multi-stage Pipeline Tab */}
        {activeTab === 'upload' && (
          <Card className="verify-card">
            {!file ? (
              <div
                className="upload-area"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={e => { e.preventDefault(); }}
                onDrop={e => {
                  e.preventDefault();
                  const droppedFile = e.dataTransfer.files?.[0];
                  if (droppedFile) {
                    const fakeEvent = { target: { files: [droppedFile] } } as unknown as React.ChangeEvent<HTMLInputElement>;
                    handleFileSelect(fakeEvent);
                  }
                }}
              >
                <Upload size={40} color="var(--color-primary)" />
                <p style={{ fontWeight: 600, marginTop: '0.5rem' }}>{t('deed.uploadFile')}</p>
                <p className="upload-hint">PDF, JPG, JPEG, PNG (সর্বোচ্চ ১৫ মেগাবাইট)</p>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                  {language === 'bn' ? 'ক্লিক করুন অথবা ফাইল টেনে এনে ছাড়ুন' : 'Click to browse or drag and drop'}
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.txt"
                  onChange={handleFileSelect}
                  hidden
                />
              </div>
            ) : (
              <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ background: 'var(--color-primary)', color: 'white', padding: '0.5rem', borderRadius: '8px' }}>
                      <FileCheck size={24} />
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '1rem' }}>{file.name}</h4>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                        {(file.size / 1024).toFixed(1)} KB • {file.type || 'ডকুমেন্ট'}
                      </p>
                    </div>
                  </div>

                  <button 
                    className="btn btn-outline btn-sm" 
                    onClick={handleRemoveFile}
                    style={{ color: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}
                  >
                    <Trash2 size={14} /> <span>{language === 'bn' ? 'ফাইল সরান' : 'Remove File'}</span>
                  </button>
                </div>

                {/* Document Preview thumbnail / frame */}
                {filePreviewUrl && (
                  <div style={{ marginTop: '1rem', borderTop: '1px solid #e2e8f0', paddingTop: '0.75rem' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.5rem' }}>
                      {language === 'bn' ? 'নথির প্রিভিউ:' : 'Document Preview:'}
                    </span>
                    {file.type.startsWith('image/') ? (
                      <img 
                        src={filePreviewUrl} 
                        alt="Deed preview" 
                        style={{ maxHeight: '180px', borderRadius: '6px', border: '1px solid #cbd5e1', objectFit: 'contain' }} 
                      />
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--color-primary)' }}>
                        <Eye size={16} /> 
                        <a href={filePreviewUrl} target="_blank" rel="noreferrer" style={{ textDecoration: 'underline' }}>
                          {language === 'bn' ? 'নতুন ট্যাবে পিডিএফ প্রিভিউ দেখুন' : 'Open PDF preview in new tab'}
                        </a>
                      </div>
                    )}
                  </div>
                )}

                {computedHash && (
                  <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', background: '#ffffff', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                    <span style={{ fontWeight: 600, color: 'var(--color-text-muted)' }}>SHA-256 Hash: </span>
                    <code style={{ wordBreak: 'break-all', color: 'var(--color-primary)' }}>{computedHash}</code>
                  </div>
                )}
              </div>
            )}

            {/* Optional cadastral identifiers */}
            <div style={{ background: '#f1f5f9', padding: '1rem', borderRadius: '8px', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
                <Info size={16} color="var(--color-primary)" />
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                  {language === 'bn' ? 'ঐচ্ছিক শনাক্তকারী তথ্য (যাচাই নির্ভুল করার জন্য)' : 'Optional Identifying Info (Improves Accuracy)'}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '0.2rem' }}>
                    {language === 'bn' ? 'দলিল নম্বর' : 'Deed Number'}
                  </label>
                  <input
                    type="text"
                    value={optionalDeedNo}
                    onChange={e => setOptionalDeedNo(e.target.value)}
                    placeholder="যেমন: DEED-2019-7821"
                    className="form-control"
                    style={{ width: '100%', fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '0.2rem' }}>
                    {language === 'bn' ? 'মৌজা' : 'Mouza'}
                  </label>
                  <input
                    type="text"
                    value={optionalMouza}
                    onChange={e => setOptionalMouza(e.target.value)}
                    placeholder="যেমন: আমিনবাজার"
                    className="form-control"
                    style={{ width: '100%', fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '0.2rem' }}>
                    {language === 'bn' ? 'দাগ নম্বর' : 'Dag Number'}
                  </label>
                  <input
                    type="text"
                    value={optionalDag}
                    onChange={e => setOptionalDag(e.target.value)}
                    placeholder="যেমন: ২৩৪"
                    className="form-control"
                    style={{ width: '100%', fontSize: '0.85rem' }}
                  />
                </div>
              </div>
            </div>

            {/* Verification progress bar */}
            {isProcessing && (
              <div style={{ marginBottom: '1.25rem', padding: '1rem', background: '#e0f2fe', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 600 }}>
                  <span>{processingStatusText}</span>
                  <span>{processingProgress}%</span>
                </div>
                <div style={{ width: '100%', height: '8px', background: '#bae6fd', borderRadius: '4px', overflow: 'hidden' }}>
                  <div 
                    style={{ 
                      width: `${processingProgress}%`, 
                      height: '100%', 
                      background: 'var(--color-primary)', 
                      transition: 'width 0.3s ease' 
                    }} 
                  />
                </div>
              </div>
            )}

            <button
              className="btn btn-primary btn-lg btn-block"
              onClick={handleRunVerification}
              disabled={!file || isProcessing}
            >
              <ShieldCheck size={20} />
              <span>
                {isProcessing 
                  ? (language === 'bn' ? 'যাচাই প্রক্রিয়া চলছে...' : 'Verifying Document...') 
                  : (language === 'bn' ? 'দলিল যাচাই করুন' : 'Verify Deed Document')}
              </span>
            </button>
          </Card>
        )}

        {/* Record ID Search Tab */}
        {activeTab === 'record' && (
          <Card className="verify-card">
            <div className="form-group">
              <label>{t('deed.recordId')}</label>
              <input
                type="text"
                value={recordId}
                onChange={e => setRecordId(e.target.value)}
                placeholder="REG-DOC-001 বা DEED-2019-7821"
                className="input-lg"
                onKeyDown={e => { if (e.key === 'Enter') handleVerifyByRecordId(); }}
              />
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.4rem' }}>
                {language === 'bn' 
                  ? 'দলিলের রেকর্ড আইডি বা দলিল নম্বর প্রবেশ করুন। উদাহরণ: REG-DOC-001'
                  : 'Enter the deed record ID or deed number. Example: REG-DOC-001'}
              </p>
            </div>
            <button
              className="btn btn-primary btn-lg btn-block mt-3"
              onClick={handleVerifyByRecordId}
              disabled={!recordId.trim() || isProcessing}
            >
              <Search size={18} />
              <span>{isProcessing ? t('common.loading') : (language === 'bn' ? 'রেকর্ড অনুসন্ধান করুন' : 'Search Record')}</span>
            </button>
          </Card>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <Card className="verify-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>
                {language === 'bn' ? 'আমার পূর্ববর্তী যাচাই তালিকা' : 'My Past Verifications'}
              </h3>
              <span className="badge badge-neutral">{userSubmissions.length} টি রেকর্ড</span>
            </div>

            {userSubmissions.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '2rem 0' }}>
                {language === 'bn' ? 'এখনো কোনো দলিল যাচাই করা হয়নি।' : 'No deeds verified yet.'}
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {userSubmissions.map(sub => {
                  const cfg = statusConfig[sub.status] || statusConfig.UNABLE_TO_VERIFY;
                  return (
                    <div 
                      key={sub.id}
                      onClick={() => {
                        loadSubmissionAndFile(sub, false);
                        window.scrollTo({ top: 400, behavior: 'smooth' });
                      }}
                      style={{
                        padding: '1rem',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        background: '#ffffff',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '0.75rem',
                        flexWrap: 'wrap',
                        transition: 'box-shadow 0.2s',
                      }}
                      className="history-row"
                    >
                      <div style={{ flex: 1, minWidth: '220px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{sub.originalFileName}</span>
                          <span 
                            style={{ 
                              background: cfg.badgeBg, 
                              color: cfg.badgeColor, 
                              fontSize: '0.7rem', 
                              padding: '2px 8px', 
                              borderRadius: '4px',
                              fontWeight: 600
                            }}
                          >
                            {sub.status}
                          </span>
                        </div>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                          {new Date(sub.createdAt).toLocaleString('bn-BD')} • ID: {sub.id}
                        </p>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <button
                          className="btn btn-outline btn-sm"
                          title={language === 'bn' ? 'সংরক্ষিত মূল দলিল ডাউনলোড' : 'Download Stored Deed'}
                          onClick={async (e) => {
                            e.stopPropagation();
                            const blob = await getStoredDocumentBlob(sub.id, sub.fileHash);
                            if (blob) {
                              downloadBlob(blob, sub.originalFileName);
                            } else {
                              alert(language === 'bn' ? 'সংরক্ষিত মূল ফাইল পাওয়া যায়নি' : 'Stored deed file not found');
                            }
                          }}
                          style={{ padding: '4px 8px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          <Download size={13} />
                          <span>{language === 'bn' ? 'ডাউনলোড' : 'Download'}</span>
                        </button>

                        <button
                          className="btn btn-outline btn-sm"
                          title={language === 'bn' ? 'মূল দলিল প্রিভিউ' : 'Preview Deed'}
                          onClick={async (e) => {
                            e.stopPropagation();
                            const blob = await getStoredDocumentBlob(sub.id, sub.fileHash);
                            if (blob) {
                              previewBlob(blob);
                            } else {
                              alert(language === 'bn' ? 'সংরক্ষিত মূল ফাইল পাওয়া যায়নি' : 'Stored deed file not found');
                            }
                          }}
                          style={{ padding: '4px 8px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          <Eye size={13} />
                          <span>{language === 'bn' ? 'প্রিভিউ' : 'Preview'}</span>
                        </button>

                        <button
                          className="btn btn-outline btn-sm"
                          title={language === 'bn' ? 'পুনরায় যাচাইয়ে লোড করুন' : 'Load for Verification'}
                          onClick={(e) => {
                            e.stopPropagation();
                            loadSubmissionAndFile(sub, true);
                          }}
                          style={{ padding: '4px 8px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-primary)' }}
                        >
                          <RotateCcw size={13} />
                          <span>{language === 'bn' ? 'যাচাই' : 'Re-verify'}</span>
                        </button>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--color-primary)', fontSize: '0.85rem', marginLeft: '0.25rem' }}>
                          <span>{language === 'bn' ? 'রিপোর্ট' : 'Report'}</span>
                          <ArrowRight size={15} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        )}

        {/* Structured Verification Report */}
        {activeSubmission && (
          <Card className={`result-card-full ${statusConfig[activeSubmission.status]?.className || 'result-unable'}`} style={{ marginTop: '2rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
              {(() => {
                const Icon = statusConfig[activeSubmission.status]?.icon || HelpCircle;
                return <Icon size={32} />;
              })()}
              <div>
                <h2 style={{ margin: 0, fontSize: '1.3rem' }}>
                  {language === 'bn' 
                    ? statusConfig[activeSubmission.status]?.titleBn 
                    : statusConfig[activeSubmission.status]?.titleEn}
                </h2>
                <span style={{ fontSize: '0.8rem', opacity: 0.85 }}>
                  যাচাই আইডি: {activeSubmission.id} • {new Date(activeSubmission.createdAt).toLocaleString('bn-BD')}
                </span>
              </div>
            </div>

            {/* Explanation banner */}
            <p className="result-desc" style={{ marginBottom: '1.25rem' }}>
              {language === 'bn' ? activeSubmission.statusExplanationBn : activeSubmission.statusExplanationEn}
            </p>

            {/* Hash Comparison */}
            {activeSubmission.fileHash && (
              <div className="hash-comparison" style={{ marginBottom: '1.25rem' }}>
                <div className="hash-row">
                  <span className="hash-label">{t('deed.computedHash')}:</span>
                  <code style={{ wordBreak: 'break-all' }}>{activeSubmission.fileHash}</code>
                </div>
                {matchedRefDoc && (
                  <div className="hash-row">
                    <span className="hash-label">{t('deed.storedHash')}:</span>
                    <code style={{ wordBreak: 'break-all' }}>{matchedRefDoc.fileHash}</code>
                  </div>
                )}
              </div>
            )}

            {/* Comparison Table */}
            {activeSubmission.fieldComparisons && activeSubmission.fieldComparisons.length > 0 && (
              <div style={{ marginBottom: '1.5rem', overflowX: 'auto' }}>
                <h4 style={{ marginBottom: '0.5rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <FileText size={18} />
                  <span>{language === 'bn' ? 'তথ্যগত তুলনামূলক বিশ্লেষণ (Field Comparison Report)' : 'Field-by-Field Comparison Report'}</span>
                </h4>
                <table className="data-table" style={{ width: '100%', fontSize: '0.875rem' }}>
                  <thead>
                    <tr>
                      <th>{language === 'bn' ? 'বিষয় / ফিল্ড' : 'Field'}</th>
                      <th>{language === 'bn' ? 'আপলোডকৃত দলিল হতে প্রাপ্ত' : 'Uploaded Document'}</th>
                      <th>{language === 'bn' ? 'সরকারি রেফারেন্স রেকর্ড' : 'Reference Record'}</th>
                      <th>{language === 'bn' ? 'ফলাফল' : 'Result'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeSubmission.fieldComparisons.map((fc, idx) => (
                      <tr key={idx}>
                        <td style={{ fontWeight: 600 }}>
                          {language === 'bn' ? fc.fieldLabelBn : fc.fieldLabelEn}
                        </td>
                        <td>{fc.uploadedValue}</td>
                        <td>{fc.referenceValue}</td>
                        <td>
                          {fc.status === 'match' && (
                            <span className="badge badge-success" style={{ background: '#10b981', color: 'white' }}>
                              ✓ {language === 'bn' ? 'সঠিক মিল' : 'Match'}
                            </span>
                          )}
                          {fc.status === 'partial' && (
                            <span className="badge badge-warning" style={{ background: '#f59e0b', color: 'white' }}>
                              ~ {language === 'bn' ? 'আংশিক মিল' : 'Partial'}
                            </span>
                          )}
                          {fc.status === 'mismatch' && (
                            <span className="badge badge-danger" style={{ background: '#ef4444', color: 'white' }}>
                              ✕ {language === 'bn' ? 'অসঙ্গতি' : 'Mismatch'}
                            </span>
                          )}
                          {fc.status === 'not_found' && (
                            <span className="badge badge-neutral" style={{ background: '#94a3b8', color: 'white' }}>
                              {language === 'bn' ? 'পাওয়া যায়নি' : 'Not Found'}
                            </span>
                          )}
                          {fc.status === 'unable' && (
                            <span className="badge badge-neutral">
                              {language === 'bn' ? 'অস্পষ্ট' : 'Unable'}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Discrepancies list */}
            {activeSubmission.discrepancies && activeSubmission.discrepancies.length > 0 && activeSubmission.status === 'MISMATCH' && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', padding: '0.75rem 1rem', marginBottom: '1.25rem' }}>
                <p style={{ fontWeight: 600, fontSize: '0.875rem', color: '#b91c1c', marginBottom: '0.4rem' }}>
                  {language === 'bn' ? 'শনাক্তকৃত অসঙ্গতি:' : 'Identified Discrepancies:'}
                </p>
                <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.85rem', color: '#991b1b' }}>
                  {activeSubmission.discrepancies.map((d, i) => <li key={i}>{d}</li>)}
                </ul>
              </div>
            )}

            {/* Manual review recommendation */}
            {activeSubmission.manualReviewRecommended && (
              <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '6px', padding: '0.75rem 1rem', marginBottom: '1.25rem', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                <AlertTriangle size={18} color="#d97706" style={{ flexShrink: 0, marginTop: '2px' }} />
                <p style={{ margin: 0, fontSize: '0.875rem', color: '#92400e' }}>
                  {language === 'bn' 
                    ? 'এই ক্ষেত্রে সংশ্লিষ্ট সাব-রেজিস্ট্রি অফিস বা সহকারী কমিশনার (ভূমি) এর দফতরে সরাসরি ম্যানুয়াল যাচাই করার পরামর্শ দেওয়া হচ্ছে।'
                    : 'Manual verification at the Sub-Registry Office or Assistant Commissioner (Land) office is recommended for this case.'}
                </p>
              </div>
            )}

            {/* OCR Extracted Text Preview if available */}
            {activeSubmission.ocrExtractedText && (
              <details style={{ background: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '6px', border: '1px solid #cbd5e1', marginBottom: '1.25rem' }}>
                <summary style={{ cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>
                  {language === 'bn' ? '📄 ওসিআর (OCR) দ্বারা সনাক্তকৃত মূল টেক্সট দেখুন' : '📄 View Raw OCR Extracted Text'}
                </summary>
                <pre style={{ marginTop: '0.5rem', whiteSpace: 'pre-wrap', fontSize: '0.8rem', color: '#334155', maxHeight: '150px', overflowY: 'auto' }}>
                  {activeSubmission.ocrExtractedText}
                </pre>
              </details>
            )}

            {/* Next Steps */}
            <div className="next-steps" style={{ marginTop: '1rem' }}>
              <h4>{t('deed.nextSteps')}</h4>
              <p>
                {language === 'bn' 
                  ? statusConfig[activeSubmission.status]?.nextStepBn 
                  : statusConfig[activeSubmission.status]?.nextStepEn}
              </p>
            </div>

            {/* Official Report Actions */}
            <div className="result-print-actions mt-3" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button className="btn btn-outline" onClick={triggerPrint}>
                <Printer size={16} />
                <span>{language === 'bn' ? 'যাচাই প্রত্যয়নপত্র প্রিন্ট / সংরক্ষণ' : 'Print / Export Certificate'}</span>
              </button>
              
              <button 
                className="btn btn-outline" 
                onClick={async () => {
                  const blob = await getStoredDocumentBlob(activeSubmission.id, activeSubmission.fileHash);
                  if (blob) {
                    downloadBlob(blob, activeSubmission.originalFileName);
                  } else {
                    alert(language === 'bn' ? 'সংরক্ষিত মূল ফাইল পাওয়া যায়নি' : 'Stored document file not found');
                  }
                }}
              >
                <Download size={16} />
                <span>{language === 'bn' ? 'সংরক্ষিত মূল দলিল ডাউনলোড' : 'Download Stored Deed'}</span>
              </button>

              <button 
                className="btn btn-outline" 
                onClick={async () => {
                  const blob = await getStoredDocumentBlob(activeSubmission.id, activeSubmission.fileHash);
                  if (blob) {
                    previewBlob(blob);
                  } else {
                    alert(language === 'bn' ? 'সংরক্ষিত মূল ফাইল পাওয়া যায়নি' : 'Stored document file not found');
                  }
                }}
              >
                <Eye size={16} />
                <span>{language === 'bn' ? 'মূল দলিল প্রিভিউ' : 'Preview Stored Deed'}</span>
              </button>

              <button 
                className="btn btn-primary" 
                onClick={() => {
                  loadSubmissionAndFile(activeSubmission, true);
                }}
              >
                <RotateCcw size={16} />
                <span>{language === 'bn' ? 'নথি পুনরায় যাচাইয়ে লোড করুন' : 'Reload for Re-verification'}</span>
              </button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
