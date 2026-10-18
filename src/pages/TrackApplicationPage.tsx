// ============================================================
// Track Application Page — With Document Resubmission & Print Slip
// ============================================================
import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import {
  Search, ClipboardList, CheckCircle, Clock, AlertTriangle,
  XCircle, FileText, MessageSquare, Info, Printer, Download,
  Upload, CheckCircle2, ShieldCheck
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Card, Breadcrumb, StatusBadge, EmptyState, Disclaimer } from '../components/SharedUI';
import { formatDateTime, formatDate, triggerPrint, computeSHA256, readFileAsArrayBuffer, generateId } from '../utils';
import { getFileBlob, storeFileBlob, downloadBlob } from '../utils/fileStorage';
import type { UploadedDocument } from '../types';

export default function TrackApplicationPage() {
  const { appId: paramId } = useParams<{ appId: string }>();
  const { t, language, applications, dispatch, addAudit, currentUser } = useApp();
  const [searchId, setSearchId] = useState(paramId || '');
  const [searched, setSearched] = useState(!!paramId);

  // Resubmission state
  const [resubDocType, setResubDocType] = useState('additional_document');
  const [resubDocName, setResubDocName] = useState('');
  const [resubFile, setResubFile] = useState<File | null>(null);
  const [resubNote, setResubNote] = useState('');
  const [isResubmitting, setIsResubmitting] = useState(false);
  const [resubSuccess, setResubSuccess] = useState(false);

  const isBn = language === 'bn';
  const app = searched ? applications.find(a => a.id.toLowerCase() === searchId.trim().toLowerCase()) : null;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearched(true);
    setResubSuccess(false);
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle size={16} />;
      case 'rejected': return <XCircle size={16} />;
      case 'more_documents_required': return <AlertTriangle size={16} />;
      case 'under_review': return <Clock size={16} />;
      case 'submitted': return <Info size={16} />;
      default: return <FileText size={16} />;
    }
  };

  const handleDownloadDoc = async (doc: UploadedDocument) => {
    let blob = await getFileBlob(doc.id);
    if (!blob && doc.hash) {
      blob = await getFileBlob(doc.hash);
    }
    if (!blob) {
      // Create a representative text file with the document metadata and hash
      const content = `ভূমি ভাবনা — ডিজিটাল ভূমি সেবা প্ল্যাটফর্ম
ডকুমেন্ট: ${isBn ? doc.typeLabel : doc.typeLabelEn}
ফাইলের নাম: ${doc.fileName}
হ্যাশ (SHA-256): ${doc.hash || 'N/A'}
আপলোড তারিখ: ${formatDateTime(doc.uploadedAt, language)}
আবেদন আইডি: ${app?.id || ''}
----------------------------------------
ডেমো নথিপত্র (Synthetic Demo Record)`;
      blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    }
    downloadBlob(blob, doc.fileName || `document-${doc.id}.txt`);
  };

  const handleResubmitDocuments = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!app || !resubFile) return;

    setIsResubmitting(true);
    try {
      const buffer = await readFileAsArrayBuffer(resubFile);
      const hash = await computeSHA256(buffer);
      const docId = generateId('doc');

      // Persist in IndexedDB
      await storeFileBlob(docId, resubFile);
      if (hash) await storeFileBlob(hash, resubFile);

      const newDoc: UploadedDocument = {
        id: docId,
        name: resubDocName.trim() || resubFile.name,
        type: resubDocType,
        typeLabel: resubDocName.trim() || (isBn ? 'অতিরিক্ত কাগজপত্র' : 'Additional Document'),
        typeLabelEn: resubDocName.trim() || 'Additional Document',
        fileName: resubFile.name,
        fileSize: resubFile.size,
        uploadedAt: new Date().toISOString(),
        hash,
      };

      // Add document to application
      dispatch({
        type: 'ADD_DOCUMENT_TO_APP',
        payload: { applicationId: app.id, doc: newDoc },
      });

      // Update status back to under_review
      const reasonMsg = isBn
        ? `নাগরিক কর্তৃক অতিরিক্ত কাগজপত্র জমা দেওয়া হয়েছে (${resubFile.name})। ${resubNote ? `মন্তব্য: ${resubNote}` : ''}`
        : `Additional documents submitted by applicant (${resubFile.name}). ${resubNote ? `Note: ${resubNote}` : ''}`;

      dispatch({
        type: 'UPDATE_APPLICATION_STATUS',
        payload: {
          id: app.id,
          status: 'under_review',
          changedBy: currentUser?.id || app.applicantId,
          reason: reasonMsg,
        },
      });

      addAudit(
        'কাগজপত্র পুনঃদাখিল',
        'Document Resubmission',
        'application',
        app.id,
        `নতুন নথি: ${resubFile.name} (SHA-256: ${hash.substring(0, 12)}...)`
      );

      dispatch({
        type: 'ADD_NOTIFICATION',
        payload: {
          id: generateId('notif'),
          userId: app.applicantId,
          title: 'কাগজপত্র গৃহীত হয়েছে',
          titleEn: 'Documents Received',
          message: `আপনার আবেদন ${app.id}-এর জন্য অতিরিক্ত কাগজপত্র সফলভাবে গৃহীত হয়েছে এবং পুনর্বিবেচনার জন্য পাঠানো হয়েছে।`,
          messageEn: `Additional documents for ${app.id} have been received and sent for re-examination.`,
          type: 'info',
          read: false,
          createdAt: new Date().toISOString(),
          link: `/track/${app.id}`,
        },
      });

      setResubFile(null);
      setResubDocName('');
      setResubNote('');
      setResubSuccess(true);
    } catch (err) {
      console.error('Error submitting additional doc:', err);
    } finally {
      setIsResubmitting(false);
    }
  };

  const appTrackUrl = app ? `${window.location.origin}/track/${app.id}` : '';

  return (
    <div className="page-track">
      <div className="container">
        <Breadcrumb items={[
          { label: t('nav.home'), path: '/' },
          { label: t('nav.trackApp') },
        ]} />

        <div className="track-page-header-row">
          <div>
            <h1 className="page-title">{t('track.title')}</h1>
            <p className="page-subtitle">
              {isBn ? 'আবেদনের বর্তমান অবস্থা, অগ্রগতি ও কর্মকর্তাদের সিদ্ধান্ত দেখুন' : 'View application status, progress and officer reviews'}
            </p>
          </div>
          {app && (
            <button className="btn btn-outline" onClick={triggerPrint}>
              <Printer size={16} />
              <span>{isBn ? 'প্রাপ্তিস্বীকার পত্র প্রিন্ট' : 'Print Receipt Slip'}</span>
            </button>
          )}
        </div>

        {/* Search form */}
        <Card className="track-search-card">
          <form onSubmit={handleSearch} className="track-search-form">
            <div className="form-group">
              <label>{t('track.enterID')}</label>
              <input
                type="text"
                value={searchId}
                onChange={e => { setSearchId(e.target.value); setSearched(false); setResubSuccess(false); }}
                placeholder="APP-2025-0001"
                className="input-lg"
              />
            </div>
            <button type="submit" className="btn btn-primary btn-lg">
              <Search size={18} />
              <span>{t('track.search')}</span>
            </button>
          </form>
        </Card>

        {/* Results */}
        {searched && !app && (
          <EmptyState
            icon={<ClipboardList size={48} />}
            title={t('track.notFound')}
            description={language === 'bn'
              ? 'আবেদন আইডি পরীক্ষা করে আবার চেষ্টা করুন (যেমন: APP-2025-0001 বা APP-2025-0002)।'
              : 'Check the application ID and try again (e.g. APP-2025-0001 or APP-2025-0002).'
            }
          />
        )}

        {app && (
          <div className="track-results">
            {/* Summary Card / Print Slip */}
            <Card className="track-summary-card printable-receipt">
              <div className="print-slip-watermark">
                <ShieldCheck size={160} />
              </div>

              <div className="track-summary-header">
                <div>
                  <div className="receipt-gov-banner">
                    <span className="gov-title">{isBn ? 'গণপ্রজাতন্ত্রী বাংলাদেশ সরকার' : "Government of the People's Republic of Bangladesh"}</span>
                    <span className="gov-subtitle">{isBn ? 'ভূমি মন্ত্রণালয় — ডিজিটাল ভূমি সেবা প্রাপ্তিস্বীকার পত্র' : 'Ministry of Land — Digital Land Service Acknowledgment'}</span>
                  </div>
                  <h2 className="track-app-id">{app.id}</h2>
                  <span className="track-app-type">
                    {app.type === 'inheritance'
                      ? (isBn ? 'উত্তরাধিকার নামজারি আবেদন' : 'Inheritance Mutation Application')
                      : (isBn ? 'সাধারণ নামজারি আবেদন' : 'Regular Mutation Application')
                    }
                  </span>
                </div>
                <div className="receipt-qr-side">
                  <QRCodeSVG value={appTrackUrl} size={90} level="M" />
                  <StatusBadge status={app.status} />
                </div>
              </div>

              <div className="info-grid mt-3">
                <div className="info-item">
                  <span className="info-label">{t('mutation.applicantName')}</span>
                  <span className="info-value font-bold">{isBn ? app.applicantName : app.applicantNameEn}</span>
                </div>
                {app.deceasedName && (
                  <div className="info-item">
                    <span className="info-label">{t('mutation.deceasedName')}</span>
                    <span className="info-value">{isBn ? app.deceasedName : app.deceasedNameEn}</span>
                  </div>
                )}
                <div className="info-item">
                  <span className="info-label">{t('land.parcelId')}</span>
                  <span className="info-value font-mono">{app.parcelId}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">{t('mutation.claimedShare')}</span>
                  <span className="info-value">{app.claimedShareDecimal} {t('land.decimal')}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">{isBn ? 'দাখিলের তারিখ' : 'Submission Date'}</span>
                  <span className="info-value">{app.submittedAt ? formatDate(app.submittedAt, language) : '—'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">{isBn ? 'সর্বশেষ অবস্থা' : 'Current Status'}</span>
                  <span className="info-value font-bold">{t(`status.${app.status}`)}</span>
                </div>
              </div>
            </Card>

            {/* If more docs required, show warning & Resubmission Box */}
            {app.status === 'more_documents_required' && (
              <div className="resubmission-container mt-4">
                <Disclaimer
                  text={isBn
                    ? 'কর্মকর্তার পর্যালোচনা অনুযায়ী অতিরিক্ত কাগজপত্র জমা দেওয়া প্রয়োজন। অনুগ্রহ করে নিচের ফরমের মাধ্যমে ফাইল সংযুক্ত করুন।'
                    : 'Additional documents required by reviewing officer. Please upload required files using the form below.'
                  }
                  type="warning"
                />

                <Card
                  title={isBn ? 'অতিরিক্ত কাগজপত্র দাখিল ফরম' : 'Resubmit Additional Documents'}
                  icon={<Upload size={18} />}
                  className="mt-3 border-warning"
                >
                  <form onSubmit={handleResubmitDocuments} className="resub-form">
                    <div className="form-grid">
                      <div className="form-group">
                        <label>{isBn ? 'কাগজপত্রের ধরন' : 'Document Type'} *</label>
                        <select
                          value={resubDocType}
                          onChange={e => setResubDocType(e.target.value)}
                          className="input-field"
                        >
                          <option value="warish_certificate">{isBn ? 'ওয়ারিশ সনদপত্র' : 'Warish Certificate'}</option>
                          <option value="death_certificate">{isBn ? 'মৃত্যু সনদপত্র' : 'Death Certificate'}</option>
                          <option value="deed_copy">{isBn ? 'মূল দলিলের সত্যায়িত কপি' : 'Certified Deed Copy'}</option>
                          <option value="khatian_copy">{isBn ? 'খতিয়ানের পর্চা' : 'Khatian Record Copy'}</option>
                          <option value="tax_receipt">{isBn ? 'হালনাগাদ দাখিলা / কর রশিদ' : 'Land Tax Receipt'}</option>
                          <option value="additional_document">{isBn ? 'অন্যান্য আবশ্যকীয় দলিল' : 'Other Document'}</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label>{isBn ? 'কাগজপত্রের বিবরণ বা নাম' : 'Document Title / Description'}</label>
                        <input
                          type="text"
                          value={resubDocName}
                          onChange={e => setResubDocName(e.target.value)}
                          placeholder={isBn ? 'যেমন: সংশোধিত ওয়ারিশ সনদ' : 'e.g. Revised Warish Certificate'}
                          className="input-field"
                        />
                      </div>
                    </div>

                    <div className="form-group mt-2">
                      <label>{isBn ? 'ফাইল নির্বাচন করুন (PDF, JPG, PNG)' : 'Select File (PDF, JPG, PNG)'} *</label>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png,.txt"
                        onChange={e => setResubFile(e.target.files?.[0] || null)}
                        required
                        className="input-field"
                      />
                    </div>

                    <div className="form-group mt-2">
                      <label>{isBn ? 'কর্মকর্তার উদ্দেশ্যে নোট বা মন্তব্য' : 'Applicant Note to Officer'}</label>
                      <textarea
                        value={resubNote}
                        onChange={e => setResubNote(e.target.value)}
                        placeholder={isBn ? 'যেমন: চেয়ারম্যান কার্যালয় থেকে সংশোধিত সনদ সংযুক্ত করা হলো।' : 'e.g. Attached corrected certificate.'}
                        rows={2}
                        className="input-field"
                      />
                    </div>

                    <div className="resub-actions mt-3">
                      <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={!resubFile || isResubmitting}
                      >
                        <Upload size={16} />
                        <span>{isResubmitting ? (isBn ? 'জমা হচ্ছে...' : 'Submitting...') : (isBn ? 'কাগজপত্র জমা দিন' : 'Submit Documents')}</span>
                      </button>
                    </div>
                  </form>
                </Card>
              </div>
            )}

            {resubSuccess && (
              <div className="alert alert-success mt-3" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle2 size={18} />
                <span>
                  {isBn
                    ? 'অতিরিক্ত কাগজপত্র সফলভাবে জমা হয়েছে এবং আবেদনের অবস্থা "পর্যালোচনাধীন" করা হয়েছে।'
                    : 'Additional documents submitted successfully. Application status changed to "Under Review".'}
                </span>
              </div>
            )}

            {/* Status Timeline */}
            <Card title={t('track.timeline')} icon={<Clock size={18} />} className="mt-4">
              <div className="timeline">
                {app.statusHistory.map((sh, idx) => (
                  <div key={idx} className={`timeline-item ${idx === app.statusHistory.length - 1 ? 'timeline-current' : ''}`}>
                    <div className="timeline-marker">
                      {statusIcon(sh.status)}
                    </div>
                    <div className="timeline-content">
                      <div className="timeline-header">
                        <StatusBadge status={sh.status} size="sm" />
                        <span className="timeline-date">{formatDateTime(sh.changedAt, language)}</span>
                      </div>
                      {sh.reason && (
                        <p className="timeline-reason">{sh.reason}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Officer Notes */}
            {app.officerNotes.length > 0 && (
              <Card
                title={language === 'bn' ? 'কর্মকর্তার মন্তব্য' : 'Officer Notes'}
                icon={<MessageSquare size={18} />}
                className="mt-4"
              >
                {app.officerNotes.map(note => (
                  <div key={note.id} className="officer-note-item">
                    <div className="note-header">
                      <strong>{note.officerName}</strong>
                      <span className="note-date">{formatDateTime(note.createdAt, language)}</span>
                    </div>
                    <p className="note-text">{note.note}</p>
                  </div>
                ))}
              </Card>
            )}

            {/* Uploaded Documents */}
            <Card
              title={language === 'bn' ? 'জমা দেওয়া কাগজপত্র' : 'Submitted Documents'}
              icon={<FileText size={18} />}
              className="mt-4"
            >
              {app.uploadedDocuments.length === 0 ? (
                <EmptyState icon={<FileText size={36} />} title={t('common.noData')} />
              ) : (
                <div className="doc-list">
                  {app.uploadedDocuments.map(doc => (
                    <div key={doc.id} className="doc-list-item">
                      <div className="doc-meta-main">
                        <FileText size={18} className="text-primary" />
                        <div>
                          <span className="doc-name">{language === 'bn' ? doc.typeLabel : doc.typeLabelEn}</span>
                          <span className="doc-file text-muted">{doc.fileName}</span>
                          {doc.hash && (
                            <span className="doc-hash-badge font-mono">
                              SHA-256: {doc.hash.substring(0, 16)}...
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        className="btn btn-outline-sm"
                        onClick={() => handleDownloadDoc(doc)}
                        title={isBn ? 'ডকুমেন্ট ডাউনলোড বা দেখুন' : 'Download or view document'}
                      >
                        <Download size={14} />
                        <span>{isBn ? 'ডাউনলোড' : 'Download'}</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
