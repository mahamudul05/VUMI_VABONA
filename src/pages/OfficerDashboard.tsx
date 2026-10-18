// ============================================================
// Officer Dashboard — Dedicated Land Officer Portal
// Focused entirely on application review and processing
// ============================================================
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ClipboardList, CheckCircle2, XCircle, AlertTriangle,
  MessageSquare, FileText, Filter, AlertCircle, MapPin,
  Search, Eye, Clock, Check, ChevronRight, User, Shield,
  ArrowRight, FileCheck, Landmark, Settings, Bell, ExternalLink, Download
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatDateTime, formatDate, generateId, toBanglaDigits } from '../utils';
import { getFileBlob, downloadBlob } from '../utils/fileStorage';
import type { ApplicationStatus, MutationApplication } from '../types';

type OfficerTab =
  | 'overview'
  | 'review'
  | 'mutation'
  | 'documents'
  | 'search'
  | 'notifications'
  | 'profile';

export default function OfficerDashboard() {
  const {
    t, language, currentUser, applications, parcels, registeredDocuments,
    auditLog, notifications, dispatch, addAudit
  } = useApp();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<OfficerTab>('overview');
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'mutation' | 'inheritance'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Review Workspace Modal state
  const [selectedApp, setSelectedApp] = useState<MutationApplication | null>(null);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | 'request_docs' | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [newOfficerNote, setNewOfficerNote] = useState('');
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');

  // Search citizen apps tab state
  const [citizenSearchInput, setCitizenSearchInput] = useState('');
  const [citizenSearchResults, setCitizenSearchResults] = useState<MutationApplication[]>([]);
  const [citizenSearchPerformed, setCitizenSearchPerformed] = useState(false);

  // Document verification tab state
  const [docHashSearch, setDocHashSearch] = useState('');
  const [matchedDoc, setMatchedDoc] = useState<any>(null);
  const [docSearched, setDocSearched] = useState(false);

  const isBn = language === 'bn';

  if (!currentUser || currentUser.role !== 'officer') {
    return (
      <div className="container section">
        <div className="card text-center p-4">
          <Shield size={48} style={{ color: 'var(--color-primary)', margin: '0 auto 1rem' }} />
          <h2>{t('nav.login')}</h2>
          <p className="text-muted" style={{ marginBottom: '1.5rem' }}>
            {isBn ? 'কর্মকর্তা ড্যাশবোর্ড দেখতে ভূমি কর্মকর্তা হিসেবে লগইন করুন।' : 'Please login as a land officer to access this portal.'}
          </p>
          <Link to="/login" className="btn btn-primary">{t('nav.login')}</Link>
        </div>
      </div>
    );
  }

  // Four Overview Summary Counts (Derived from live state)
  const pendingCount = applications.filter(a => a.status === 'submitted' || a.status === 'under_review').length;
  const docsRequiredCount = applications.filter(a => a.status === 'more_documents_required').length;
  const recentlyReviewedCount = applications.filter(a => a.officerNotes.length > 0 || a.statusHistory.length > 1).length;
  const decisionsMadeCount = applications.filter(a => a.status === 'approved' || a.status === 'rejected').length;

  const officerNotifs = notifications.filter(n => n.userId === currentUser.id || !n.userId);
  const unreadNotifs = officerNotifs.filter(n => !n.read);

  // Filtered applications
  const filteredApps = applications.filter(app => {
    // Status filter
    if (statusFilter !== 'all' && app.status !== statusFilter) return false;
    // Type filter
    if (typeFilter !== 'all' && app.type !== typeFilter) return false;
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchId = app.id.toLowerCase().includes(q);
      const matchApplicant = (app.applicantName || '').toLowerCase().includes(q) || (app.applicantNameEn || '').toLowerCase().includes(q);
      const matchParcel = (app.parcelId || '').toLowerCase().includes(q);
      const matchDeceased = (app.deceasedName || '').toLowerCase().includes(q) || (app.deceasedNameEn || '').toLowerCase().includes(q);
      if (!matchId && !matchApplicant && !matchParcel && !matchDeceased) return false;
    }
    return true;
  });

  // Recent officer activities from auditLog
  const recentActivities = auditLog
    .filter(a => a.targetType === 'application' || a.targetType === 'document')
    .slice(-6)
    .reverse();

  // Navigation Items
  const navItems: { key: OfficerTab; label: string; icon: any; count?: number }[] = [
    { key: 'overview', label: isBn ? 'ওভারভিউ' : 'Overview', icon: Landmark },
    { key: 'review', label: isBn ? 'আবেদন পর্যালোচনা' : 'Application Review', icon: ClipboardList, count: pendingCount },
    { key: 'mutation', label: isBn ? 'নামজারি ও উত্তরাধিকার' : 'Mutation & Inheritance', icon: FileText, count: applications.length },
    { key: 'documents', label: isBn ? 'দলিল/নথি যাচাই' : 'Deed/Document Verify', icon: FileCheck },
    { key: 'search', label: isBn ? 'আবেদন অনুসন্ধান' : 'Search Applications', icon: Search },
    { key: 'notifications', label: isBn ? 'বিজ্ঞপ্তি' : 'Notifications', icon: Bell, count: unreadNotifs.length },
    { key: 'profile', label: isBn ? 'প্রোফাইল ও সেটিংস' : 'Profile & Settings', icon: Settings },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <span className="badge badge-success">{t('status.approved')}</span>;
      case 'rejected':
        return <span className="badge badge-danger">{t('status.rejected')}</span>;
      case 'under_review':
        return <span className="badge badge-warning">{t('status.under_review')}</span>;
      case 'more_documents_required':
        return <span className="badge badge-warning">{t('status.more_documents_required')}</span>;
      default:
        return <span className="badge badge-info">{t(`status.${status}`) || status}</span>;
    }
  };

  const getParcel = (parcelId: string) => parcels.find(p => p.id === parcelId);

  const handleDownloadDoc = async (doc: any) => {
    let blob = await getFileBlob(doc.id);
    if (!blob && doc.hash) {
      blob = await getFileBlob(doc.hash);
    }
    if (!blob) {
      const content = `ভূমি ভাবনা — কর্মকর্তা নথি প্রিভিউ
ডকুমেন্ট: ${isBn ? doc.typeLabel : doc.typeLabelEn}
ফাইলের নাম: ${doc.fileName}
হ্যাশ (SHA-256): ${doc.hash || 'N/A'}
আপলোড তারিখ: ${doc.uploadedAt}
আবেদন আইডি: ${selectedApp?.id || ''}
----------------------------------------
ডেমো নথিপত্র (Synthetic Demo Record)`;
      blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    }
    downloadBlob(blob, doc.fileName || `document-${doc.id}.txt`);
  };

  // Open review modal
  const openReviewModal = (app: MutationApplication) => {
    setSelectedApp(app);
    setReviewAction(null);
    setActionReason('');
    setNewOfficerNote('');
    setActionSuccessMsg('');
  };

  // Execute Review Decision
  const handleExecuteDecision = () => {
    if (!selectedApp || !reviewAction || !actionReason.trim()) return;

    let newStatus: ApplicationStatus;
    let labelBn: string;
    let labelEn: string;

    if (reviewAction === 'approve') {
      newStatus = 'approved';
      labelBn = 'আবেদন অনুমোদিত';
      labelEn = 'Application Approved';
    } else if (reviewAction === 'reject') {
      newStatus = 'rejected';
      labelBn = 'আবেদন প্রত্যাখ্যাত';
      labelEn = 'Application Rejected';
    } else {
      newStatus = 'more_documents_required';
      labelBn = 'অতিরিক্ত নথি অনুরোধ';
      labelEn = 'Additional Documents Requested';
    }

    dispatch({
      type: 'UPDATE_APPLICATION_STATUS',
      payload: {
        id: selectedApp.id,
        status: newStatus,
        changedBy: currentUser.id,
        reason: actionReason,
      },
    });

    // Send Notification to Applicant
    dispatch({
      type: 'ADD_NOTIFICATION',
      payload: {
        id: generateId('notif'),
        userId: selectedApp.applicantId,
        title: labelBn,
        titleEn: labelEn,
        message: `আবেদন ${selectedApp.id}: ${actionReason}`,
        messageEn: `Application ${selectedApp.id}: ${actionReason}`,
        type: reviewAction === 'approve' ? 'success' : reviewAction === 'reject' ? 'warning' : 'action_required',
        read: false,
        createdAt: new Date().toISOString(),
        link: `/track/${selectedApp.id}`,
      },
    });

    // Log Audit
    addAudit(labelBn, labelEn, 'application', selectedApp.id, `${labelBn} (${currentUser.name}): ${actionReason}`);

    setActionSuccessMsg(isBn ? 'সিদ্ধান্ত সফলভাবে সংরক্ষিত হয়েছে।' : 'Decision recorded successfully.');
    setTimeout(() => {
      setSelectedApp(null);
      setReviewAction(null);
      setActionReason('');
      setActionSuccessMsg('');
    }, 1200);
  };

  // Add internal officer note
  const handleAddOfficerNote = () => {
    if (!selectedApp || !newOfficerNote.trim()) return;
    const noteObj = {
      id: generateId('note'),
      officerId: currentUser.id,
      officerName: currentUser.name,
      note: newOfficerNote,
      createdAt: new Date().toISOString(),
    };
    dispatch({
      type: 'ADD_OFFICER_NOTE',
      payload: {
        applicationId: selectedApp.id,
        note: noteObj,
      },
    });
    addAudit('মন্তব্য যোগ', 'Officer Note Added', 'application', selectedApp.id, newOfficerNote);
    
    // Update local selectedApp view
    setSelectedApp({
      ...selectedApp,
      officerNotes: [...selectedApp.officerNotes, noteObj],
    });
    setNewOfficerNote('');
  };

  // Citizen search handler
  const handleCitizenSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!citizenSearchInput.trim()) return;
    const q = citizenSearchInput.trim().toLowerCase();
    const res = applications.filter(a =>
      a.id.toLowerCase().includes(q) ||
      a.applicantName.toLowerCase().includes(q) ||
      a.applicantNameEn.toLowerCase().includes(q) ||
      a.parcelId.toLowerCase().includes(q) ||
      (a.applicantId && a.applicantId.toLowerCase().includes(q))
    );
    setCitizenSearchResults(res);
    setCitizenSearchPerformed(true);
  };

  // Document verification search
  const handleDocVerifySearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docHashSearch.trim()) return;
    const q = docHashSearch.trim().toLowerCase();
    const found = registeredDocuments.find(d =>
      d.id.toLowerCase().includes(q) ||
      d.deedNumber.toLowerCase().includes(q) ||
      d.fileHash.toLowerCase() === q
    );
    setMatchedDoc(found || null);
    setDocSearched(true);
  };

  return (
    <div className="portal-container">
      {/* ── Officer Sidebar Navigation ─────────────── */}
      <aside className="portal-sidebar">
        <div className="portal-sidebar-header">
          <div className="portal-user-badge">
            <span className="user-avatar-sm avatar-officer">{currentUser.name.charAt(0)}</span>
            <div className="portal-user-meta">
              <span className="portal-user-name">{isBn ? currentUser.name : currentUser.nameEn}</span>
              <span className="portal-role-tag badge-role-officer">{isBn ? 'সহকারী কমিশনার (ভূমি)' : 'Land Officer'}</span>
            </div>
          </div>
        </div>

        <nav className="portal-sidebar-nav">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.key;
            return (
              <button
                key={item.key}
                className={`portal-nav-btn ${isActive ? 'active' : ''}`}
                onClick={() => setActiveTab(item.key)}
              >
                <Icon size={18} className="portal-nav-icon" />
                <span className="portal-nav-label">{item.label}</span>
                {item.count !== undefined && item.count > 0 && (
                  <span className={`portal-nav-count ${item.key === 'review' ? 'count-alert' : ''}`}>
                    {isBn ? toBanglaDigits(item.count) : item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="portal-sidebar-footer">
          <div className="portal-sidebar-help">
            <span className="text-muted" style={{ fontSize: '0.8rem' }}>
              {isBn ? 'ভূমি কার্যালয়: সাভার উপজেলা' : 'Land Office: Savar Upazila'}
            </span>
          </div>
        </div>
      </aside>

      {/* ── Main Officer Workspace ─────────────────── */}
      <main className="portal-main">
        {/* ═════════ 1. OVERVIEW TAB ═════════ */}
        {activeTab === 'overview' && (
          <div className="portal-content">
            {/* 1. Compact heading: “কর্মকর্তা ড্যাশবোর্ড” */}
            <div className="welcome-banner welcome-banner-officer">
              <div className="welcome-content">
                <div className="officer-title-row">
                  <h1 className="welcome-title">
                    {t('officer.title')}
                  </h1>
                  <span className="badge badge-success">
                    {isBn ? 'সক্রিয় পর্যালোচনা অধিবেশন' : 'Active Review Session'}
                  </span>
                </div>
                <p className="welcome-subtitle">
                  {isBn
                    ? 'দাখিলকৃত আবেদন পর্যালোচনা, সংযুক্ত দলিলপত্র ও ওয়ারিশ সনদ যাচাই, এবং সিদ্ধান্ত প্রদান ব্যবস্থা।'
                    : 'Application review queue, document verification, and decision workflow.'}
                </p>
                <div className="welcome-meta-chips">
                  <span className="meta-chip">
                    <User size={13} /> {isBn ? currentUser.name : currentUser.nameEn} (AC Land / কানুনগো)
                  </span>
                  <span className="meta-chip">
                    <MapPin size={13} /> {isBn ? 'ঢাকা বিভাগ › সাভার সার্কেল' : 'Dhaka Div › Savar Circle'}
                  </span>
                  <span className="meta-chip">
                    <Clock size={13} /> {formatDate(new Date().toISOString(), language)}
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Four summary cards */}
            <div className="summary-cards-grid">
              <div className="summary-stat-card card-hover-click" onClick={() => { setStatusFilter('submitted'); setActiveTab('review'); }}>
                <div className="stat-card-icon stat-icon-amber">
                  <Clock size={22} />
                </div>
                <div className="stat-card-data">
                  <span className="stat-card-value font-mono">
                    {isBn ? toBanglaDigits(pendingCount) : pendingCount}
                  </span>
                  <span className="stat-card-title">{t('officer.pending')}</span>
                </div>
              </div>

              <div className="summary-stat-card card-hover-click" onClick={() => { setStatusFilter('more_documents_required'); setActiveTab('review'); }}>
                <div className="stat-card-icon stat-icon-danger">
                  <AlertTriangle size={22} />
                </div>
                <div className="stat-card-data">
                  <span className="stat-card-value font-mono">
                    {isBn ? toBanglaDigits(docsRequiredCount) : docsRequiredCount}
                  </span>
                  <span className="stat-card-title">{t('officer.docsRequired')}</span>
                </div>
              </div>

              <div className="summary-stat-card card-hover-click" onClick={() => setActiveTab('review')}>
                <div className="stat-card-icon stat-icon-blue">
                  <ClipboardList size={22} />
                </div>
                <div className="stat-card-data">
                  <span className="stat-card-value font-mono">
                    {isBn ? toBanglaDigits(recentlyReviewedCount) : recentlyReviewedCount}
                  </span>
                  <span className="stat-card-title">{t('officer.recentlyReviewed')}</span>
                </div>
              </div>

              <div className="summary-stat-card card-hover-click" onClick={() => { setStatusFilter('approved'); setActiveTab('review'); }}>
                <div className="stat-card-icon stat-icon-green">
                  <CheckCircle2 size={22} />
                </div>
                <div className="stat-card-data">
                  <span className="stat-card-value font-mono">
                    {isBn ? toBanglaDigits(decisionsMadeCount) : decisionsMadeCount}
                  </span>
                  <span className="stat-card-title">{t('officer.decisionsMade')}</span>
                </div>
              </div>
            </div>

            {/* 3. Prominent Application Queue with Search and Filters */}
            <div className="content-card">
              <div className="queue-header-block">
                <div className="queue-title-row">
                  <div className="card-header-title">
                    <ClipboardList size={20} className="text-primary" />
                    <h3>{isBn ? 'আবেদন পর্যালোচনা কার্যতালিকা' : 'Application Review Queue'}</h3>
                  </div>
                  <span className="badge badge-muted">
                    {isBn ? `মোট ${toBanglaDigits(filteredApps.length)}টি আবেদন প্রদর্শিত` : `${filteredApps.length} applications displayed`}
                  </span>
                </div>

                {/* Filter Controls Bar */}
                <div className="queue-controls-bar">
                  <div className="queue-search-input-wrapper">
                    <Search size={16} className="search-icon" />
                    <input
                      type="text"
                      className="queue-search-input"
                      placeholder={isBn ? 'আবেদন আইডি, আবেদনকারীর নাম, বা পার্সেল খুঁজুন...' : 'Search by App ID, Applicant Name, or Parcel...'}
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                      <button className="clear-btn" onClick={() => setSearchQuery('')}>×</button>
                    )}
                  </div>

                  <div className="filter-chips-cluster">
                    <div className="filter-chip-group">
                      <span className="filter-label">{isBn ? 'অবস্থা:' : 'Status:'}</span>
                      {(['all', 'submitted', 'under_review', 'more_documents_required', 'approved', 'rejected'] as const).map(st => (
                        <button
                          key={st}
                          className={`filter-pill-btn ${statusFilter === st ? 'active' : ''}`}
                          onClick={() => setStatusFilter(st)}
                        >
                          {st === 'all' ? t('common.all') : t(`status.${st}`)}
                        </button>
                      ))}
                    </div>

                    <div className="filter-chip-group">
                      <span className="filter-label">{isBn ? 'ধরন:' : 'Type:'}</span>
                      {(['all', 'mutation', 'inheritance'] as const).map(tp => (
                        <button
                          key={tp}
                          className={`filter-pill-btn ${typeFilter === tp ? 'active' : ''}`}
                          onClick={() => setTypeFilter(tp)}
                        >
                          {tp === 'all' ? t('common.all') : tp === 'mutation' ? (isBn ? 'নামজারি' : 'Mutation') : (isBn ? 'উত্তরাধিকার' : 'Inheritance')}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Application Table */}
              {filteredApps.length === 0 ? (
                <div className="table-empty-state">
                  <ClipboardList size={36} className="text-muted" />
                  <p>{isBn ? 'নির্বাচিত ফিল্টারে কোনো আবেদন পাওয়া যায়নি।' : 'No applications match the selected filter.'}</p>
                  <button className="btn btn-outline-sm mt-2" onClick={() => { setStatusFilter('all'); setTypeFilter('all'); setSearchQuery(''); }}>
                    {isBn ? 'ফিল্টার রিসেট করুন' : 'Reset Filters'}
                  </button>
                </div>
              ) : (
                <div className="table-responsive mt-3">
                  <table className="portal-table officer-table">
                    <thead>
                      <tr>
                        <th>{isBn ? 'আবেদন আইডি' : 'ID'}</th>
                        <th>{isBn ? 'আবেদনকারী' : 'Applicant'}</th>
                        <th>{isBn ? 'জমির অবস্থান ও দাগ' : 'Location & Parcel'}</th>
                        <th>{isBn ? 'দাবিকৃত অংশ' : 'Share'}</th>
                        <th>{isBn ? 'কাগজপত্র' : 'Docs'}</th>
                        <th>{isBn ? 'অবস্থা' : 'Status'}</th>
                        <th style={{ textAlign: 'right' }}>{isBn ? 'কার্যক্রম' : 'Review Action'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredApps.map(app => {
                        const parcel = getParcel(app.parcelId);
                        const hasMissingDocs = !app.uploadedDocuments.some(d => d.type === 'death_certificate') && app.type === 'inheritance';

                        return (
                          <tr key={app.id} className={app.status === 'submitted' ? 'row-pending' : ''}>
                            <td>
                              <strong className="table-code">{app.id}</strong>
                              <span className="sub-tag">
                                {app.type === 'inheritance' ? (isBn ? 'উত্তরাধিকার' : 'Inheritance') : (isBn ? 'নামজারি' : 'Mutation')}
                              </span>
                            </td>
                            <td>
                              <span className="font-semibold">{isBn ? app.applicantName : app.applicantNameEn}</span>
                              {app.deceasedName && (
                                <small className="text-muted d-block">
                                  {isBn ? 'মৃত' : 'Dec'}: {isBn ? app.deceasedName : app.deceasedNameEn}
                                </small>
                              )}
                            </td>
                            <td>
                              {parcel ? (
                                <div>
                                  <span className="location-crumb">
                                    {isBn ? `${parcel.mouza}, ${parcel.upazila}` : `${parcel.mouzaEn}, ${parcel.upazilaEn}`}
                                  </span>
                                  <small className="text-muted d-block">
                                    {t('search.dagNumber')}: {parcel.dagNumber} | {t('search.khatianNumber')}: {parcel.khatianNumber}
                                  </small>
                                </div>
                              ) : (
                                <span>{app.parcelId}</span>
                              )}
                            </td>
                            <td>
                              <span className="font-semibold">
                                {isBn ? toBanglaDigits(app.claimedShareDecimal) : app.claimedShareDecimal} {t('land.decimal')}
                              </span>
                            </td>
                            <td>
                              <span className={`doc-count-badge ${hasMissingDocs ? 'badge-warning' : 'badge-muted'}`}>
                                <FileText size={12} /> {app.uploadedDocuments.length} {isBn ? 'টি' : ''}
                              </span>
                            </td>
                            <td>{getStatusBadge(app.status)}</td>
                            <td style={{ textAlign: 'right' }}>
                              {/* 4. A clear “পর্যালোচনা শুরু করুন” action for each application */}
                              <button
                                className="btn btn-primary-sm btn-review-start"
                                onClick={() => openReviewModal(app)}
                              >
                                {isBn ? 'পর্যালোচনা শুরু করুন' : 'Start Review'} <ArrowRight size={14} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* 5. Small recent activity section */}
            <div className="content-card">
              <div className="card-header-row">
                <div className="card-header-title">
                  <Clock size={18} className="text-primary" />
                  <h3>{isBn ? 'সাম্প্রতিক কর্মকর্তা পর্যালোচনা ও সিদ্ধান্ত লগ' : 'Recent Officer Activity & Decision Log'}</h3>
                </div>
              </div>

              {recentActivities.length === 0 ? (
                <div className="table-empty-state">
                  <p>{isBn ? 'কোনো সাম্প্রতিক সিদ্ধান্ত লগ পাওয়া যায়নি।' : 'No recent activity logged.'}</p>
                </div>
              ) : (
                <div className="activity-timeline-list">
                  {recentActivities.map(act => (
                    <div key={act.id} className="activity-log-item">
                      <div className="activity-log-dot" />
                      <div className="activity-log-details">
                        <div className="activity-log-top">
                          <strong>{isBn ? act.action : act.actionEn}</strong>
                          <span className="activity-log-time">{formatDateTime(act.timestamp, language)}</span>
                        </div>
                        <p>{act.details}</p>
                        <small className="text-muted">
                          {isBn ? 'লক্ষ্য আইডি' : 'Target'}: <code>{act.targetId}</code>
                        </small>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═════════ 2. APPLICATION REVIEW WORKSPACE TAB ═════════ */}
        {activeTab === 'review' && (
          <div className="portal-content">
            <div className="section-title-bar">
              <div>
                <h2>{isBn ? 'আবেদন পর্যালোচনা ও সিদ্ধান্ত কার্যপ্রবাহ' : 'Application Review Queue & Decisions'}</h2>
                <p className="text-muted">{isBn ? 'অপেক্ষমান ও পর্যালোচনার জন্য নির্ধারিত আবেদনসমূহ' : 'Pending and assigned review queue'}</p>
              </div>
              <div className="status-toggle-pills">
                <button
                  className={`btn btn-sm ${statusFilter === 'submitted' ? 'btn-primary' : 'btn-outline-sm'}`}
                  onClick={() => setStatusFilter('submitted')}
                >
                  {isBn ? 'অপেক্ষমান' : 'Submitted'} ({pendingCount})
                </button>
                <button
                  className={`btn btn-sm ${statusFilter === 'more_documents_required' ? 'btn-primary' : 'btn-outline-sm'}`}
                  onClick={() => setStatusFilter('more_documents_required')}
                >
                  {isBn ? 'অতিরিক্ত নথি' : 'Docs Required'} ({docsRequiredCount})
                </button>
                <button
                  className={`btn btn-sm ${statusFilter === 'all' ? 'btn-primary' : 'btn-outline-sm'}`}
                  onClick={() => setStatusFilter('all')}
                >
                  {isBn ? 'সকল' : 'All'}
                </button>
              </div>
            </div>

            <div className="review-cards-list">
              {filteredApps.map(app => {
                const parcel = getParcel(app.parcelId);
                return (
                  <div key={app.id} className="review-card-item">
                    <div className="review-card-top">
                      <div>
                        <div className="d-flex align-items-center gap-2">
                          <h3 className="app-code">{app.id}</h3>
                          <span className="badge badge-muted">
                            {app.type === 'inheritance' ? (isBn ? 'উত্তরাধিকার' : 'Inheritance') : (isBn ? 'নামজারি' : 'Mutation')}
                          </span>
                        </div>
                        <p className="text-muted" style={{ fontSize: '0.85rem', marginTop: '0.2rem' }}>
                          {isBn ? 'আবেদনকারী' : 'Applicant'}: <strong>{isBn ? app.applicantName : app.applicantNameEn}</strong> | {isBn ? 'জমা' : 'Submitted'}: {app.submittedAt ? formatDate(app.submittedAt, language) : '—'}
                        </p>
                      </div>
                      {getStatusBadge(app.status)}
                    </div>

                    {parcel && (
                      <div className="review-parcel-snippet">
                        <MapPin size={14} className="text-primary" />
                        <span>
                          {isBn ? `${parcel.mouza}, ${parcel.upazila}, ${parcel.district}` : `${parcel.mouzaEn}, ${parcel.upazilaEn}, ${parcel.districtEn}`}
                          {' '}— {t('search.dagNumber')}: <strong>{parcel.dagNumber}</strong>, {t('search.khatianNumber')}: <strong>{parcel.khatianNumber}</strong>
                        </span>
                      </div>
                    )}

                    <div className="review-card-meta">
                      <div>
                        <span className="text-muted">{isBn ? 'দাবিকৃত অংশ' : 'Claimed'}:</span>{' '}
                        <strong>{isBn ? toBanglaDigits(app.claimedShareDecimal) : app.claimedShareDecimal} {t('land.decimal')}</strong>
                      </div>
                      <div>
                        <span className="text-muted">{isBn ? 'সংযুক্ত কাগজপত্র' : 'Docs'}:</span>{' '}
                        <strong>{app.uploadedDocuments.length} {isBn ? 'টি' : 'files'}</strong>
                      </div>
                      <div>
                        <span className="text-muted">{isBn ? 'উত্তরাধিকারী তালিকা' : 'Heirs'}:</span>{' '}
                        <strong>{app.heirs.length} {isBn ? 'জন' : 'persons'}</strong>
                      </div>
                    </div>

                    <div className="review-card-actions">
                      <button
                        className="btn btn-primary-sm"
                        onClick={() => openReviewModal(app)}
                      >
                        {isBn ? 'পর্যালোচনা শুরু করুন' : 'Start Review'} <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ═════════ 3. MUTATION & INHERITANCE TAB ═════════ */}
        {activeTab === 'mutation' && (
          <div className="portal-content">
            <div className="section-title-bar">
              <div>
                <h2>{isBn ? 'নামজারি ও উত্তরাধিকার আবেদন' : 'Mutation & Inheritance Applications'}</h2>
                <p className="text-muted">{isBn ? 'ওয়ারিশ সনদ, মৃত্যু সনদ ও রেকর্ড সংশোধনের আবেদনসমূহ' : 'Applications with warish certificates and inheritance records'}</p>
              </div>
            </div>

            <div className="content-card">
              <div className="table-responsive">
                <table className="portal-table">
                  <thead>
                    <tr>
                      <th>{isBn ? 'আইডি' : 'ID'}</th>
                      <th>{isBn ? 'ধরন' : 'Type'}</th>
                      <th>{isBn ? 'মৃত ব্যক্তি' : 'Deceased Person'}</th>
                      <th>{isBn ? 'আবেদনকারী' : 'Applicant'}</th>
                      <th>{isBn ? 'হিস্যা' : 'Share'}</th>
                      <th>{isBn ? 'অবস্থা' : 'Status'}</th>
                      <th style={{ textAlign: 'right' }}>{isBn ? 'পদক্ষেপ' : 'Action'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applications.map(app => (
                      <tr key={app.id}>
                        <td><strong>{app.id}</strong></td>
                        <td>
                          <span className="table-tag">
                            {app.type === 'inheritance' ? (isBn ? 'উত্তরাধিকার' : 'Inheritance') : (isBn ? 'নামজারি' : 'Mutation')}
                          </span>
                        </td>
                        <td>{app.deceasedName ? (isBn ? app.deceasedName : app.deceasedNameEn) : '—'}</td>
                        <td>{isBn ? app.applicantName : app.applicantNameEn}</td>
                        <td>{isBn ? toBanglaDigits(app.claimedShareDecimal) : app.claimedShareDecimal} {t('land.decimal')}</td>
                        <td>{getStatusBadge(app.status)}</td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            className="btn-table-action"
                            onClick={() => openReviewModal(app)}
                          >
                            {isBn ? 'পর্যালোচনা' : 'Review'} ›
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ═════════ 4. DEED & DOCUMENT VERIFICATION TAB ═════════ */}
        {activeTab === 'documents' && (
          <div className="portal-content">
            <div className="section-title-bar">
              <div>
                <h2>{isBn ? 'দলিল ও নথি যাচাই সেবা' : 'Deed & Document Verification'}</h2>
                <p className="text-muted">{isBn ? 'ডিজিটাল দলিলের হ্যাশ, কিউআর কোড এবং রেফারেন্স ডাটা যাচাই' : 'Verify deed hash, QR codes and reference archive records'}</p>
              </div>
            </div>

            <div className="content-card">
              <h3>{isBn ? 'রেফারেন্স দলিল হ্যাশ বা নম্বর অনুসন্ধান' : 'Deed Reference & SHA-256 Hash Lookup'}</h3>
              <form onSubmit={handleDocVerifySearch} className="deed-search-inline mt-2">
                <input
                  type="text"
                  placeholder={isBn ? 'দলিল নম্বর বা হ্যাশ লিখুন (যেমন: 1190 বা REG-DOC-2022-1190)' : 'Deed No or Hash'}
                  value={docHashSearch}
                  onChange={e => { setDocHashSearch(e.target.value); setDocSearched(false); }}
                  className="input-field"
                />
                <button type="submit" className="btn btn-primary">
                  <Search size={16} /> {isBn ? 'অনুসন্ধান' : 'Search'}
                </button>
              </form>

              {docSearched && matchedDoc && (
                <div className="deed-verify-result success-card mt-3">
                  <div className="result-header">
                    <CheckCircle2 size={24} className="text-success" />
                    <div>
                      <h4>{isBn ? 'দলিল তথ্য নিশ্চিত হয়েছে' : 'Deed Record Found'}</h4>
                      <p className="text-muted">{isBn ? 'সরকারি ডিজিটাল আর্কাইভে এই দলিলটির নিবন্ধন রেকর্ড সংরক্ষিত আছে।' : 'Registered record found in digital archive.'}</p>
                    </div>
                  </div>
                  <div className="result-details mt-2">
                    <p><strong>{isBn ? 'দলিল নম্বর' : 'Deed No'}:</strong> {matchedDoc.deedNumber}</p>
                    <p><strong>{isBn ? 'ধরন' : 'Type'}:</strong> {isBn ? matchedDoc.deedType : matchedDoc.deedTypeEn}</p>
                    <p><strong>{isBn ? 'নিবন্ধন তারিখ' : 'Registration Date'}:</strong> {matchedDoc.registrationDate}</p>
                    <p><strong>{isBn ? 'সংশ্লিষ্ট পার্সেল' : 'Parcel ID'}:</strong> {matchedDoc.parcelId}</p>
                    <p className="hash-display"><strong>SHA-256 Hash:</strong> <code>{matchedDoc.fileHash}</code></p>
                  </div>
                </div>
              )}

              {docSearched && !matchedDoc && (
                <div className="deed-verify-result notfound-card mt-3">
                  <div className="result-header">
                    <AlertTriangle size={24} className="text-warning" />
                    <div>
                      <h4>{isBn ? 'কোনো রেফারেন্স রেকর্ড মেলেনি' : 'No Reference Match'}</h4>
                      <p className="text-muted">{isBn ? 'প্রদত্ত তথ্য অনুযায়ী কোনো নিবন্ধিত রেফারেন্স দলিল পাওয়া যায়নি।' : 'No registered deed found.'}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="content-card">
              <h3>{isBn ? 'সংরক্ষিত রেফারেন্স দলিলসমূহ' : 'Registered Reference Deeds Archive'}</h3>
              <div className="table-responsive mt-2">
                <table className="portal-table">
                  <thead>
                    <tr>
                      <th>{isBn ? 'দলিল আইডি' : 'ID'}</th>
                      <th>{isBn ? 'দলিল নং' : 'Deed No'}</th>
                      <th>{isBn ? 'ধরন' : 'Type'}</th>
                      <th>{isBn ? 'পার্সেল' : 'Parcel'}</th>
                      <th>{isBn ? 'তারিখ' : 'Date'}</th>
                      <th>{isBn ? 'হ্যাশ' : 'SHA-256'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {registeredDocuments.map(doc => (
                      <tr key={doc.id}>
                        <td><strong>{doc.id}</strong></td>
                        <td>{doc.deedNumber}</td>
                        <td>{isBn ? doc.deedType : doc.deedTypeEn}</td>
                        <td><Link to={`/land/${doc.parcelId}`}>{doc.parcelId}</Link></td>
                        <td>{doc.registrationDate}</td>
                        <td><code style={{ fontSize: '0.75rem' }}>{doc.fileHash.slice(0, 16)}...</code></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ═════════ 5. CITIZEN APPLICATION SEARCH TAB ═════════ */}
        {activeTab === 'search' && (
          <div className="portal-content">
            <div className="section-title-bar">
              <div>
                <h2>{isBn ? 'নাগরিকের আবেদন অনুসন্ধান' : 'Search Citizen Applications'}</h2>
                <p className="text-muted">{isBn ? 'আবেদন আইডি, আবেদনকারীর নাম, এনআইডি বা পার্সেল নম্বর দিয়ে দ্রুত অনুসন্ধান' : 'Lookup application by ID, applicant name, NID, or parcel'}</p>
              </div>
            </div>

            <div className="content-card">
              <form onSubmit={handleCitizenSearch} className="deed-search-inline">
                <input
                  type="text"
                  placeholder={isBn ? 'যেমন: APP-2025-0001, আবদুল করিম, বা PARCEL-001' : 'e.g. APP-2025-0001 or Abdul Karim'}
                  value={citizenSearchInput}
                  onChange={e => { setCitizenSearchInput(e.target.value); setCitizenSearchPerformed(false); }}
                  className="input-field"
                />
                <button type="submit" className="btn btn-primary">
                  <Search size={16} /> {isBn ? 'অনুসন্ধান করুন' : 'Search'}
                </button>
              </form>

              {citizenSearchPerformed && citizenSearchResults.length > 0 && (
                <div className="table-responsive mt-3">
                  <table className="portal-table">
                    <thead>
                      <tr>
                        <th>{isBn ? 'আবেদন আইডি' : 'ID'}</th>
                        <th>{isBn ? 'আবেদনকারী' : 'Applicant'}</th>
                        <th>{isBn ? 'পার্সেল' : 'Parcel'}</th>
                        <th>{isBn ? 'তারিখ' : 'Date'}</th>
                        <th>{isBn ? 'অবস্থা' : 'Status'}</th>
                        <th style={{ textAlign: 'right' }}>{isBn ? 'পদক্ষেপ' : 'Action'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {citizenSearchResults.map(app => (
                        <tr key={app.id}>
                          <td><strong>{app.id}</strong></td>
                          <td>{isBn ? app.applicantName : app.applicantNameEn}</td>
                          <td>{app.parcelId}</td>
                          <td>{app.submittedAt ? formatDate(app.submittedAt, language) : '—'}</td>
                          <td>{getStatusBadge(app.status)}</td>
                          <td style={{ textAlign: 'right' }}>
                            <button
                              className="btn btn-primary-sm"
                              onClick={() => openReviewModal(app)}
                            >
                              {isBn ? 'পর্যালোচনা' : 'Review'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {citizenSearchPerformed && citizenSearchResults.length === 0 && (
                <div className="table-empty-state">
                  <p>{isBn ? 'কোনো ফলাফল পাওয়া যায়নি।' : 'No matching applications found.'}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═════════ 6. NOTIFICATIONS TAB ═════════ */}
        {activeTab === 'notifications' && (
          <div className="portal-content">
            <div className="section-title-bar">
              <div>
                <h2>{t('dashboard.notifications')}</h2>
                <p className="text-muted">{isBn ? 'নতুন আবেদন দাখিল ও সিস্টেম নোটিফিকেশন' : 'Application submissions and review notifications'}</p>
              </div>
            </div>

            <div className="content-card">
              {officerNotifs.length === 0 ? (
                <div className="table-empty-state">
                  <Bell size={36} className="text-muted" />
                  <p>{isBn ? 'কোনো বিজ্ঞপ্তি নেই।' : 'No notifications.'}</p>
                </div>
              ) : (
                <div className="notifications-full-list">
                  {officerNotifs.map(n => (
                    <div key={n.id} className="notification-full-card">
                      <div className={`notif-icon-circle notif-bg-${n.type}`}>
                        <Bell size={18} />
                      </div>
                      <div className="notif-full-body">
                        <div className="notif-full-top">
                          <h4>{isBn ? n.title : n.titleEn}</h4>
                          <span className="notif-time">{formatDateTime(n.createdAt, language)}</span>
                        </div>
                        <p>{isBn ? n.message : n.messageEn}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═════════ 7. PROFILE & SETTINGS TAB ═════════ */}
        {activeTab === 'profile' && (
          <div className="portal-content">
            <div className="section-title-bar">
              <div>
                <h2>{isBn ? 'কর্মকর্তা প্রোফাইল ও সেটিংস' : 'Officer Profile & Office Settings'}</h2>
                <p className="text-muted">{isBn ? 'অফিসার পদবি, এখতিয়ারভুক্ত এলাকা ও সেটিংস' : 'Designation, jurisdiction and account preferences'}</p>
              </div>
            </div>

            <div className="profile-layout-grid">
              <div className="content-card">
                <h3>{isBn ? 'কর্মকর্তার পরিচয়পত্র' : 'Officer Credentials'}</h3>
                <div className="profile-info-grid mt-3">
                  <div className="profile-item">
                    <span className="profile-label">{isBn ? 'কর্মকর্তার নাম' : 'Officer Name'}</span>
                    <strong className="profile-val">{isBn ? currentUser.name : currentUser.nameEn}</strong>
                  </div>
                  <div className="profile-item">
                    <span className="profile-label">{isBn ? 'পদবি' : 'Designation'}</span>
                    <strong className="profile-val">{isBn ? 'সহকারী কমিশনার (ভূমি)' : 'Assistant Commissioner (Land)'}</strong>
                  </div>
                  <div className="profile-item">
                    <span className="profile-label">{isBn ? 'এখতিয়ার এলাকা' : 'Jurisdiction'}</span>
                    <strong className="profile-val">{isBn ? 'সাভার উপজেলা সার্কেল, ঢাকা' : 'Savar Upazila Circle, Dhaka'}</strong>
                  </div>
                  <div className="profile-item">
                    <span className="profile-label">{isBn ? 'ইমেইল' : 'Email'}</span>
                    <strong className="profile-val">{currentUser.email || 'fatema@demo.test'}</strong>
                  </div>
                </div>
              </div>

              <div className="content-card">
                <h3>{isBn ? 'সেশন ও পছন্দসমূহ' : 'Session & Preferences'}</h3>
                <div className="settings-rows mt-3">
                  <div className="setting-row">
                    <div>
                      <strong>{isBn ? 'ভাষা নির্বাচন' : 'Language'}</strong>
                      <p className="text-muted" style={{ fontSize: '0.85rem' }}>{language === 'bn' ? 'বাংলা সক্রিয়' : 'English active'}</p>
                    </div>
                    <button
                      className="btn btn-outline-sm"
                      onClick={() => dispatch({ type: 'SET_LANGUAGE', payload: language === 'bn' ? 'en' : 'bn' })}
                    >
                      {language === 'bn' ? 'English' : 'বাংলা'}
                    </button>
                  </div>
                  <div className="setting-row">
                    <div>
                      <strong>{isBn ? 'অফিসার লগআউট' : 'Officer Logout'}</strong>
                      <p className="text-muted" style={{ fontSize: '0.85rem' }}>{isBn ? 'পর্যালোচনা অধিবেশন শেষ করুন' : 'End review session'}</p>
                    </div>
                    <button
                      className="btn btn-outline-sm text-danger"
                      onClick={() => { dispatch({ type: 'LOGOUT' }); navigate('/'); }}
                    >
                      {t('nav.logout')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ── Comprehensive Application Review Modal ──────── */}
      {selectedApp && (
        <div className="review-modal-overlay">
          <div className="review-modal-box">
            <div className="review-modal-header">
              <div>
                <div className="d-flex align-items-center gap-2">
                  <h2>{isBn ? 'আবেদন পর্যালোচনা ও সিদ্ধান্ত' : 'Application Review & Decision'}</h2>
                  <span className="badge badge-info">{selectedApp.id}</span>
                </div>
                <p className="text-muted" style={{ fontSize: '0.85rem' }}>
                  {selectedApp.type === 'inheritance' ? (isBn ? 'উত্তরাধিকার নামজারি আবেদন' : 'Inheritance Mutation') : (isBn ? 'সাধারণ নামজারি আবেদন' : 'Mutation Application')}
                </p>
              </div>
              <button className="modal-close-btn" onClick={() => setSelectedApp(null)}>×</button>
            </div>

            <div className="review-modal-body">
              {actionSuccessMsg && (
                <div className="alert alert-success mb-3">
                  <CheckCircle2 size={16} /> <span>{actionSuccessMsg}</span>
                </div>
              )}

              {/* Applicant & Parcel Information */}
              <div className="review-info-section">
                <h4>{isBn ? 'আবেদনকারী ও জমির পরিচিতি' : 'Applicant & Parcel Information'}</h4>
                <div className="review-grid-2">
                  <div>
                    <p><strong>{isBn ? 'আবেদনকারীর নাম' : 'Applicant'}:</strong> {isBn ? selectedApp.applicantName : selectedApp.applicantNameEn}</p>
                    {selectedApp.deceasedName && (
                      <p><strong>{isBn ? 'মৃত মূল মালিকের নাম' : 'Deceased Owner'}:</strong> {isBn ? selectedApp.deceasedName : selectedApp.deceasedNameEn}</p>
                    )}
                    <p><strong>{isBn ? 'দাবিকৃত হিস্যা/অংশ' : 'Claimed Share'}:</strong> {isBn ? toBanglaDigits(selectedApp.claimedShareDecimal) : selectedApp.claimedShareDecimal} {t('land.decimal')}</p>
                    <p><strong>{isBn ? 'দাখিলের সময়' : 'Submitted At'}:</strong> {selectedApp.submittedAt ? formatDateTime(selectedApp.submittedAt, language) : '—'}</p>
                  </div>
                  <div>
                    <p>
                      <strong>{isBn ? 'পার্সেল আইডি' : 'Parcel ID'}:</strong>{' '}
                      <Link to={`/land/${selectedApp.parcelId}`} target="_blank" className="font-bold">
                        {selectedApp.parcelId} <ExternalLink size={12} />
                      </Link>
                    </p>
                    {getParcel(selectedApp.parcelId) && (
                      <>
                        <p><strong>{isBn ? 'অবস্থান' : 'Location'}:</strong> {getParcel(selectedApp.parcelId)?.mouza}, {getParcel(selectedApp.parcelId)?.upazila}</p>
                        <p><strong>{t('search.dagNumber')}:</strong> {getParcel(selectedApp.parcelId)?.dagNumber} | <strong>{t('search.khatianNumber')}:</strong> {getParcel(selectedApp.parcelId)?.khatianNumber}</p>
                        <p><strong>{t('land.area')}:</strong> {getParcel(selectedApp.parcelId)?.totalAreaDecimal} {t('land.decimal')}</p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Uploaded Documents */}
              <div className="review-info-section mt-3">
                <h4>{isBn ? 'সংযুক্ত নথিপত্র' : 'Uploaded Documents'} ({selectedApp.uploadedDocuments.length})</h4>
                <div className="review-docs-chips">
                  {selectedApp.uploadedDocuments.map(doc => (
                    <div key={doc.id} className="review-doc-pill" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                      <FileText size={14} className="text-primary" />
                      <span>{isBn ? doc.typeLabel : doc.typeLabelEn} ({doc.fileName})</span>
                      <button
                        type="button"
                        onClick={() => handleDownloadDoc(doc)}
                        title={isBn ? 'ডকুমেন্ট ডাউনলোড' : 'Download Document'}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '2px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          color: 'var(--color-primary, #059669)'
                        }}
                      >
                        <Download size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Heirs breakdown if available */}
              {selectedApp.heirs.length > 0 && (
                <div className="review-info-section mt-3">
                  <h4>{isBn ? 'দাবিকৃত উত্তরাধিকারীদের হিস্যা' : 'Claimed Heir Distribution'}</h4>
                  <div className="review-heir-tags">
                    {selectedApp.heirs.map((h, i) => (
                      <span key={i} className="heir-tag-badge">
                        <strong>{h.name}</strong> ({h.relationship}) — {h.claimedShareDecimal} {t('land.decimal')}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Officer Notes history */}
              <div className="review-info-section mt-3">
                <h4>{isBn ? 'পূর্ববর্তী কর্মকর্তা মন্তব্য ও নোট' : 'Officer Notes'}</h4>
                {selectedApp.officerNotes.length === 0 ? (
                  <p className="text-muted" style={{ fontSize: '0.85rem' }}>{isBn ? 'কোনো পূর্ববর্তী মন্তব্য নেই।' : 'No previous notes.'}</p>
                ) : (
                  <div className="review-notes-history">
                    {selectedApp.officerNotes.map(note => (
                      <div key={note.id} className="note-history-item">
                        <span className="note-author">{note.officerName}</span>
                        <span className="note-time">{formatDateTime(note.createdAt, language)}</span>
                        <p className="note-text">{note.note}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add note inline */}
                <div className="add-note-inline mt-2">
                  <input
                    type="text"
                    placeholder={isBn ? 'অভ্যন্তরীণ কর্মকর্তা নোট লিখুন...' : 'Add internal note...'}
                    value={newOfficerNote}
                    onChange={e => setNewOfficerNote(e.target.value)}
                    className="input-field"
                  />
                  <button className="btn btn-outline-sm" onClick={handleAddOfficerNote}>
                    {isBn ? 'নোট সংরক্ষণ' : 'Save Note'}
                  </button>
                </div>
              </div>

              {/* Decision Section */}
              <div className="review-decision-section mt-4">
                <h4>{isBn ? 'চূড়ান্ত সিদ্ধান্ত গ্রহণ' : 'Record Official Decision'}</h4>
                <div className="decision-actions-row">
                  <button
                    className={`btn-decision btn-decision-approve ${reviewAction === 'approve' ? 'selected' : ''}`}
                    onClick={() => setReviewAction('approve')}
                  >
                    <CheckCircle2 size={16} /> {isBn ? 'অনুমোদন প্রদান' : 'Approve'}
                  </button>
                  <button
                    className={`btn-decision btn-decision-docs ${reviewAction === 'request_docs' ? 'selected' : ''}`}
                    onClick={() => setReviewAction('request_docs')}
                  >
                    <AlertTriangle size={16} /> {isBn ? 'অতিরিক্ত নথি অনুরোধ' : 'Request Docs'}
                  </button>
                  <button
                    className={`btn-decision btn-decision-reject ${reviewAction === 'reject' ? 'selected' : ''}`}
                    onClick={() => setReviewAction('reject')}
                  >
                    <XCircle size={16} /> {isBn ? 'প্রত্যাখ্যান' : 'Reject'}
                  </button>
                </div>

                {reviewAction && (
                  <div className="decision-reason-box mt-3">
                    <label>
                      {reviewAction === 'approve' ? (isBn ? 'অনুমোদনের কারণ / মন্তব্য:' : 'Approval Remarks:') :
                       reviewAction === 'reject' ? (isBn ? 'প্রত্যাখ্যানের সুনির্দিষ্ট কারণ:' : 'Rejection Reason:') :
                       (isBn ? 'যে সকল অতিরিক্ত নথি প্রয়োজন তা উল্লেখ করুন:' : 'Specify required additional documents:')}
                    </label>
                    <textarea
                      rows={3}
                      className="input-textarea"
                      placeholder={isBn ? 'মন্তব্য বা কারণ লিখুন (আবশ্যক)...' : 'Enter remarks or reason (required)...'}
                      value={actionReason}
                      onChange={e => setActionReason(e.target.value)}
                    />

                    <div className="decision-submit-row mt-2">
                      <button
                        className="btn btn-primary"
                        disabled={!actionReason.trim()}
                        onClick={handleExecuteDecision}
                      >
                        {isBn ? 'সিদ্ধান্ত নিশ্চিত ও কার্যকর করুন' : 'Confirm & Apply Decision'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
