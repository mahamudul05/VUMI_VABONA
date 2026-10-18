// ============================================================
// Mutation Application Page — Multi-step guided form
// ============================================================
import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, MapPin, Users, Upload, ClipboardCheck, CheckCircle,
  Plus, Trash2, FileText, AlertCircle, ArrowLeft, ArrowRight
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  Card, ProgressSteps, Breadcrumb, Disclaimer, ConfirmDialog
} from '../components/SharedUI';
import { generateAppId, generateId, formatFileSize, computeSHA256, readFileAsArrayBuffer } from '../utils';
import { storeFileBlob } from '../utils/fileStorage';
import type { HeirInfo, MutationApplication, UploadedDocument } from '../types';

const STEPS_BN = ['মৃত ব্যক্তির তথ্য', 'আবেদনকারীর তথ্য', 'জমি নির্বাচন', 'উত্তরাধিকারী', 'কাগজপত্র', 'পর্যালোচনা ও জমা'];
const STEPS_EN = ['Deceased Info', 'Applicant Info', 'Select Land', 'Heirs', 'Documents', 'Review & Submit'];

const DOC_TYPES = [
  { type: 'death_certificate', bn: 'মৃত্যু সনদ', en: 'Death Certificate', required: true },
  { type: 'warish_certificate', bn: 'ওয়ারিশ সনদ', en: 'Warish Certificate', required: true },
  { type: 'land_document', bn: 'জমি সংক্রান্ত কাগজপত্র', en: 'Land Documents', required: true },
  { type: 'nid_copy', bn: 'জাতীয় পরিচয়পত্রের কপি', en: 'NID Copy', required: true },
  { type: 'other', bn: 'অন্যান্য কাগজপত্র', en: 'Other Documents', required: false },
];

export default function MutationPage() {
  const { t, language, currentUser, parcels, dispatch, addAudit } = useApp();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submittedId, setSubmittedId] = useState('');

  // Form data
  const [deceasedName, setDeceasedName] = useState('');
  const [deceasedNameEn, setDeceasedNameEn] = useState('');
  const [applicantName, setApplicantName] = useState(
    currentUser ? (language === 'bn' ? currentUser.name : currentUser.nameEn) : ''
  );
  const [applicantNid, setApplicantNid] = useState(currentUser?.nid || '');
  const [relationship, setRelationship] = useState('');
  const [selectedParcelId, setSelectedParcelId] = useState('');
  const [claimedShare, setClaimedShare] = useState('');
  const [heirs, setHeirs] = useState<HeirInfo[]>([]);
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const steps = language === 'bn' ? STEPS_BN : STEPS_EN;
  const selectedParcel = parcels.find(p => p.id === selectedParcelId);

  // Validation
  const validateStep = (s: number): boolean => {
    const errs: Record<string, string> = {};

    if (s === 0) {
      if (!deceasedName.trim()) errs.deceasedName = language === 'bn' ? 'নাম আবশ্যক' : 'Name required';
    }
    if (s === 1) {
      if (!applicantName.trim()) errs.applicantName = language === 'bn' ? 'নাম আবশ্যক' : 'Name required';
      if (!applicantNid.trim()) errs.applicantNid = language === 'bn' ? 'NID আবশ্যক' : 'NID required';
      if (!relationship.trim()) errs.relationship = language === 'bn' ? 'সম্পর্ক আবশ্যক' : 'Relationship required';
    }
    if (s === 2) {
      if (!selectedParcelId) errs.parcel = language === 'bn' ? 'জমি নির্বাচন করুন' : 'Select a parcel';
      if (!claimedShare || parseFloat(claimedShare) <= 0) errs.claimedShare = language === 'bn' ? 'দাবিকৃত অংশ দিন' : 'Enter claimed share';
    }
    if (s === 3) {
      if (heirs.length === 0) errs.heirs = language === 'bn' ? 'কমপক্ষে একজন উত্তরাধিকারী যোগ করুন' : 'Add at least one heir';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setStep(Math.min(step + 1, 5));
    }
  };

  const prevStep = () => setStep(Math.max(step - 1, 0));

  const addHeir = () => {
    setHeirs([...heirs, {
      name: '', nameEn: '', relationship: '', relationshipEn: '',
      nid: '', claimedShareDecimal: 0,
    }]);
  };

  const updateHeir = (idx: number, field: keyof HeirInfo, value: string | number) => {
    const updated = [...heirs];
    (updated[idx] as any)[field] = value;
    setHeirs(updated);
  };

  const removeHeir = (idx: number) => {
    setHeirs(heirs.filter((_, i) => i !== idx));
  };

  const handleDocUpload = async (docType: string, file: File) => {
    const docTypeDef = DOC_TYPES.find(d => d.type === docType);
    let hash = '';
    try {
      const buffer = await readFileAsArrayBuffer(file);
      hash = await computeSHA256(buffer);
    } catch {
      // ignore hash error
    }

    const newDoc: UploadedDocument = {
      id: generateId('doc'),
      name: docTypeDef ? (language === 'bn' ? docTypeDef.bn : docTypeDef.en) : file.name,
      type: docType,
      typeLabel: docTypeDef?.bn || docType,
      typeLabelEn: docTypeDef?.en || docType,
      fileName: file.name,
      fileSize: file.size,
      uploadedAt: new Date().toISOString(),
      hash,
    };

    // Persist file into IndexedDB
    await storeFileBlob(newDoc.id, file);
    if (hash) {
      await storeFileBlob(hash, file);
    }

    setDocuments(prev => [...prev.filter(d => d.type !== docType), newDoc]);
  };

  const handleSubmit = () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    setShowConfirm(true);
  };

  const confirmSubmit = () => {
    const appId = generateAppId();
    const now = new Date().toISOString();

    const application: MutationApplication = {
      id: appId,
      type: 'inheritance',
      applicantId: currentUser!.id,
      applicantName: currentUser!.name,
      applicantNameEn: currentUser!.nameEn,
      parcelId: selectedParcelId,
      deceasedName,
      deceasedNameEn,
      heirs,
      claimedShareDecimal: parseFloat(claimedShare) || 0,
      uploadedDocuments: documents,
      status: 'submitted',
      statusHistory: [
        { status: 'draft', changedBy: currentUser!.id, changedAt: now },
        { status: 'submitted', changedBy: currentUser!.id, changedAt: now },
      ],
      officerNotes: [],
      createdAt: now,
      updatedAt: now,
      submittedAt: now,
    };

    dispatch({ type: 'ADD_APPLICATION', payload: application });

    dispatch({
      type: 'ADD_NOTIFICATION',
      payload: {
        id: generateId('notif'),
        userId: currentUser!.id,
        title: 'আবেদন জমা হয়েছে',
        titleEn: 'Application Submitted',
        message: `আপনার আবেদন ${appId} সফলভাবে জমা হয়েছে।`,
        messageEn: `Your application ${appId} has been submitted successfully.`,
        type: 'success',
        read: false,
        createdAt: now,
        link: `/track/${appId}`,
      },
    });

    addAudit(
      'আবেদন জমা',
      'Application Submitted',
      'application',
      appId,
      `নামজারি আবেদন জমা দেওয়া হয়েছে: ${appId}`
    );

    setSubmittedId(appId);
    setShowConfirm(false);
    setStep(6); // Success state
  };

  // If not logged in
  if (!currentUser) {
    return (
      <div className="container page-content">
        <Breadcrumb items={[
          { label: t('nav.home'), path: '/' },
          { label: t('nav.inheritance') },
        ]} />
        <Card className="login-prompt-card">
          <AlertCircle size={48} className="prompt-icon" />
          <h2>{language === 'bn' ? 'লগইন প্রয়োজন' : 'Login Required'}</h2>
          <p>{language === 'bn' ? 'আবেদন করতে প্রথমে লগইন করুন।' : 'Please log in to submit an application.'}</p>
          <button className="btn btn-primary btn-lg" onClick={() => navigate('/login')}>
            {t('nav.login')}
          </button>
        </Card>
      </div>
    );
  }

  // Success state
  if (submittedId) {
    return (
      <div className="container page-content">
        <Card className="success-card">
          <CheckCircle size={64} className="success-icon" />
          <h2>{t('mutation.success')}</h2>
          <div className="app-id-display">
            <span className="app-id-label">{t('mutation.appId')}</span>
            <span className="app-id-value">{submittedId}</span>
          </div>
          <p className="save-hint">{t('mutation.saveAppId')}</p>
          <Disclaimer text={t('mutation.disclaimer')} type="warning" />
          <div className="success-actions">
            <button className="btn btn-primary" onClick={() => navigate(`/track/${submittedId}`)}>
              {t('nav.trackApp')}
            </button>
            <button className="btn btn-outline" onClick={() => navigate('/dashboard')}>
              {t('nav.dashboard')}
            </button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="page-mutation">
      <div className="container">
        <Breadcrumb items={[
          { label: t('nav.home'), path: '/' },
          { label: t('nav.inheritance') },
        ]} />

        <h1 className="page-title">{t('mutation.title')}</h1>
        <p className="page-subtitle">{t('mutation.subtitle')}</p>

        <Disclaimer text={t('mutation.disclaimer')} type="warning" />

        <ProgressSteps steps={steps} currentStep={step} />

        {/* Step 0: Deceased Information */}
        {step === 0 && (
          <Card title={t('mutation.step1')} icon={<User size={18} />}>
            <div className="form-grid">
              <div className="form-group">
                <label>{t('mutation.deceasedName')} *</label>
                <input
                  type="text"
                  value={deceasedName}
                  onChange={e => setDeceasedName(e.target.value)}
                  placeholder={language === 'bn' ? 'মৃত ব্যক্তির পূর্ণ নাম' : "Deceased person's full name"}
                  className={errors.deceasedName ? 'input-error' : ''}
                />
                {errors.deceasedName && <span className="error-text">{errors.deceasedName}</span>}
              </div>
              <div className="form-group">
                <label>{t('mutation.deceasedNameEn')}</label>
                <input
                  type="text"
                  value={deceasedNameEn}
                  onChange={e => setDeceasedNameEn(e.target.value)}
                  placeholder="Full name in English"
                />
              </div>
            </div>
          </Card>
        )}

        {/* Step 1: Applicant Information */}
        {step === 1 && (
          <Card title={t('mutation.step2')} icon={<User size={18} />}>
            <div className="form-grid">
              <div className="form-group">
                <label>{t('mutation.applicantName')} *</label>
                <input
                  type="text"
                  value={applicantName}
                  onChange={e => setApplicantName(e.target.value)}
                  className={errors.applicantName ? 'input-error' : ''}
                />
                {errors.applicantName && <span className="error-text">{errors.applicantName}</span>}
              </div>
              <div className="form-group">
                <label>{t('mutation.nid')} *</label>
                <input
                  type="text"
                  value={applicantNid}
                  onChange={e => setApplicantNid(e.target.value)}
                  className={errors.applicantNid ? 'input-error' : ''}
                />
                {errors.applicantNid && <span className="error-text">{errors.applicantNid}</span>}
              </div>
              <div className="form-group">
                <label>{t('mutation.relationship')} *</label>
                <select
                  value={relationship}
                  onChange={e => setRelationship(e.target.value)}
                  className={errors.relationship ? 'input-error' : ''}
                >
                  <option value="">{language === 'bn' ? 'নির্বাচন করুন' : 'Select'}</option>
                  <option value="পুত্র">{language === 'bn' ? 'পুত্র' : 'Son'}</option>
                  <option value="কন্যা">{language === 'bn' ? 'কন্যা' : 'Daughter'}</option>
                  <option value="স্ত্রী">{language === 'bn' ? 'স্ত্রী' : 'Wife'}</option>
                  <option value="স্বামী">{language === 'bn' ? 'স্বামী' : 'Husband'}</option>
                  <option value="অন্যান্য">{language === 'bn' ? 'অন্যান্য' : 'Other'}</option>
                </select>
                {errors.relationship && <span className="error-text">{errors.relationship}</span>}
              </div>
            </div>
          </Card>
        )}

        {/* Step 2: Select Land Parcel */}
        {step === 2 && (
          <Card title={t('mutation.step3')} icon={<MapPin size={18} />}>
            <div className="form-group">
              <label>{t('mutation.selectParcel')} *</label>
              <select
                value={selectedParcelId}
                onChange={e => setSelectedParcelId(e.target.value)}
                className={errors.parcel ? 'input-error' : ''}
              >
                <option value="">{language === 'bn' ? 'জমি নির্বাচন করুন' : 'Select a land parcel'}</option>
                {parcels.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.id} — {language === 'bn' ? p.mouza : p.mouzaEn}, {language === 'bn' ? `দাগ ${p.dagNumber}` : `Dag ${p.dagNumber}`} ({p.totalAreaDecimal} {t('land.decimal')})
                  </option>
                ))}
              </select>
              {errors.parcel && <span className="error-text">{errors.parcel}</span>}
            </div>

            {selectedParcel && (
              <div className="selected-parcel-info">
                <div className="info-grid">
                  <div className="info-item">
                    <span className="info-label">{t('search.district')}</span>
                    <span className="info-value">{language === 'bn' ? selectedParcel.district : selectedParcel.districtEn}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">{t('land.area')}</span>
                    <span className="info-value">{selectedParcel.totalAreaDecimal} {t('land.decimal')}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">{t('land.owners')}</span>
                    <span className="info-value">
                      {selectedParcel.owners.map(o =>
                        `${language === 'bn' ? o.ownerName : o.ownerNameEn} (${o.shareDecimal})`
                      ).join(', ')}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="form-group mt-3">
              <label>{t('mutation.claimedShare')} *</label>
              <input
                type="number"
                step="0.01"
                value={claimedShare}
                onChange={e => setClaimedShare(e.target.value)}
                placeholder={language === 'bn' ? 'শতকে পরিমাণ দিন' : 'Enter amount in decimals'}
                className={errors.claimedShare ? 'input-error' : ''}
              />
              {errors.claimedShare && <span className="error-text">{errors.claimedShare}</span>}
            </div>
          </Card>
        )}

        {/* Step 3: Heir List */}
        {step === 3 && (
          <Card title={t('mutation.step4')} icon={<Users size={18} />}>
            {errors.heirs && <div className="form-error-banner">{errors.heirs}</div>}

            {heirs.map((heir, idx) => (
              <div key={idx} className="heir-card">
                <div className="heir-header">
                  <span>{language === 'bn' ? `উত্তরাধিকারী ${idx + 1}` : `Heir ${idx + 1}`}</span>
                  <button className="btn btn-danger-sm" onClick={() => removeHeir(idx)}>
                    <Trash2 size={14} />
                    <span>{t('mutation.removeHeir')}</span>
                  </button>
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label>{t('mutation.heirName')} *</label>
                    <input
                      type="text"
                      value={heir.name}
                      onChange={e => updateHeir(idx, 'name', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>{t('mutation.heirRelation')} *</label>
                    <select value={heir.relationship} onChange={e => updateHeir(idx, 'relationship', e.target.value)}>
                      <option value="">{language === 'bn' ? 'নির্বাচন করুন' : 'Select'}</option>
                      <option value="পুত্র">{language === 'bn' ? 'পুত্র' : 'Son'}</option>
                      <option value="কন্যা">{language === 'bn' ? 'কন্যা' : 'Daughter'}</option>
                      <option value="স্ত্রী">{language === 'bn' ? 'স্ত্রী' : 'Wife'}</option>
                      <option value="স্বামী">{language === 'bn' ? 'স্বামী' : 'Husband'}</option>
                      <option value="অন্যান্য">{language === 'bn' ? 'অন্যান্য' : 'Other'}</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>{t('mutation.nid')}</label>
                    <input
                      type="text"
                      value={heir.nid}
                      onChange={e => updateHeir(idx, 'nid', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>{t('mutation.heirShare')} *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={heir.claimedShareDecimal || ''}
                      onChange={e => updateHeir(idx, 'claimedShareDecimal', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>
              </div>
            ))}

            <button className="btn btn-outline btn-lg btn-block" onClick={addHeir}>
              <Plus size={18} />
              <span>{t('mutation.addHeir')}</span>
            </button>
          </Card>
        )}

        {/* Step 4: Document Upload */}
        {step === 4 && (
          <Card title={t('mutation.step5')} icon={<Upload size={18} />}>
            <div className="checklist-header">
              <ClipboardCheck size={18} />
              <h4>{t('mutation.checklist')}</h4>
            </div>
            <div className="doc-upload-list">
              {DOC_TYPES.map(docType => {
                const uploaded = documents.find(d => d.type === docType.type);
                return (
                  <div key={docType.type} className={`doc-upload-item ${uploaded ? 'uploaded' : ''}`}>
                    <div className="doc-upload-info">
                      <FileText size={18} />
                      <div>
                        <span className="doc-name">{language === 'bn' ? docType.bn : docType.en}</span>
                        {docType.required && <span className="required-mark">*</span>}
                        {uploaded && (
                          <span className="doc-uploaded-info">
                            ✓ {uploaded.fileName} ({formatFileSize(uploaded.fileSize)})
                          </span>
                        )}
                      </div>
                    </div>
                    <label className={`btn ${uploaded ? 'btn-outline-sm' : 'btn-primary-sm'}`}>
                      <Upload size={14} />
                      <span>{uploaded ? (language === 'bn' ? 'পুনরায়' : 'Replace') : t('mutation.upload')}</span>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={e => {
                          const f = e.target.files?.[0];
                          if (f) handleDocUpload(docType.type, f);
                        }}
                        hidden
                      />
                    </label>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* Step 5: Review & Submit */}
        {step === 5 && (
          <Card title={t('mutation.step6')} icon={<ClipboardCheck size={18} />}>
            <div className="review-section">
              <h4>{t('mutation.step1')}</h4>
              <div className="review-item">
                <span>{t('mutation.deceasedName')}: </span>
                <strong>{deceasedName} {deceasedNameEn && `(${deceasedNameEn})`}</strong>
              </div>
            </div>

            <div className="review-section">
              <h4>{t('mutation.step2')}</h4>
              <div className="review-item">
                <span>{t('mutation.applicantName')}: </span>
                <strong>{applicantName}</strong>
              </div>
              <div className="review-item">
                <span>{t('mutation.nid')}: </span>
                <strong>{applicantNid}</strong>
              </div>
              <div className="review-item">
                <span>{t('mutation.relationship')}: </span>
                <strong>{relationship}</strong>
              </div>
            </div>

            <div className="review-section">
              <h4>{t('mutation.step3')}</h4>
              <div className="review-item">
                <span>{t('land.parcelId')}: </span>
                <strong>{selectedParcelId}</strong>
              </div>
              <div className="review-item">
                <span>{t('mutation.claimedShare')}: </span>
                <strong>{claimedShare} {t('land.decimal')}</strong>
              </div>
            </div>

            <div className="review-section">
              <h4>{t('mutation.step4')}</h4>
              {heirs.length === 0 ? (
                <p className="text-muted">{language === 'bn' ? 'কোনো উত্তরাধিকারী যোগ করা হয়নি' : 'No heirs added'}</p>
              ) : (
                heirs.map((h, idx) => (
                  <div key={idx} className="review-item">
                    <span>{h.name} — {h.relationship} — {h.claimedShareDecimal} {t('land.decimal')}</span>
                  </div>
                ))
              )}
            </div>

            <div className="review-section">
              <h4>{t('mutation.step5')}</h4>
              {documents.length === 0 ? (
                <p className="text-muted">{language === 'bn' ? 'কোনো কাগজপত্র আপলোড করা হয়নি' : 'No documents uploaded'}</p>
              ) : (
                documents.map(d => (
                  <div key={d.id} className="review-item">
                    <FileText size={14} />
                    <span>{language === 'bn' ? d.typeLabel : d.typeLabelEn}: {d.fileName}</span>
                  </div>
                ))
              )}
            </div>

            <Disclaimer text={t('mutation.disclaimer')} type="warning" />

            <button className="btn btn-primary btn-lg btn-block mt-3" onClick={handleSubmit}>
              <CheckCircle size={18} />
              <span>{t('mutation.submit')}</span>
            </button>
          </Card>
        )}

        {/* Navigation Buttons */}
        {step < 6 && (
          <div className="step-navigation">
            {step > 0 && (
              <button className="btn btn-outline btn-lg" onClick={prevStep}>
                <ArrowLeft size={16} />
                <span>{t('mutation.prev')}</span>
              </button>
            )}
            {step < 5 && (
              <button className="btn btn-primary btn-lg" onClick={nextStep}>
                <span>{t('mutation.next')}</span>
                <ArrowRight size={16} />
              </button>
            )}
          </div>
        )}

        <ConfirmDialog
          open={showConfirm}
          title={language === 'bn' ? 'আবেদন জমা নিশ্চিত করুন' : 'Confirm Submission'}
          message={language === 'bn'
            ? 'আপনি কি নিশ্চিত যে আবেদনটি জমা দিতে চান? জমা দেওয়ার পর পরিবর্তন করা যাবে না।'
            : 'Are you sure you want to submit this application? Changes cannot be made after submission.'
          }
          onConfirm={confirmSubmit}
          onCancel={() => setShowConfirm(false)}
        />
      </div>
    </div>
  );
}
