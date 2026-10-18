// ============================================================
// Citizen Dashboard — Dedicated Citizen Portal
// Clean, role-specific, university hackathon ready
// ============================================================
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  MapPin, FileText, Users, ClipboardList, Bell, ChevronRight,
  AlertTriangle, CheckCircle2, Clock, XCircle, Search, PlusCircle,
  FileCheck, Info, Landmark, User, Shield, Check, ExternalLink,
  Phone, CreditCard, Calendar, ArrowRight, Settings, SlidersHorizontal
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatDate, formatDateTime, formatAmount, toBanglaDigits, generateId } from '../utils';

type CitizenTab =
  | 'overview'
  | 'land'
  | 'heirs'
  | 'inheritance'
  | 'applications'
  | 'deed'
  | 'notifications'
  | 'profile';

export default function CitizenDashboard() {
  const {
    language, currentUser, parcels, applications, notifications,
    familyMembers, inheritanceClaims, registeredDocuments, t, dispatch, addAudit
  } = useApp();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<CitizenTab>('overview');
  const [searchDeedId, setSearchDeedId] = useState('');
  const [deedSearchResult, setDeedSearchResult] = useState<any>(null);
  const [deedSearched, setDeedSearched] = useState(false);

  const isBn = language === 'bn';

  if (!currentUser || currentUser.role !== 'citizen') {
    return (
      <div className="container section">
        <div className="card text-center p-4">
          <User size={48} style={{ color: 'var(--color-primary)', margin: '0 auto 1rem' }} />
          <h2>{t('nav.login')}</h2>
          <p className="text-muted" style={{ marginBottom: '1.5rem' }}>
            {isBn ? 'নাগরিক ড্যাশবোর্ড দেখতে নাগরিক হিসেবে লগইন করুন।' : 'Please login as a citizen to view this dashboard.'}
          </p>
          <Link to="/login" className="btn btn-primary">{t('nav.login')}</Link>
        </div>
      </div>
    );
  }

  // Derived user-specific data
  const myParcels = parcels.filter(p => p.owners.some(o => o.ownerId === currentUser.id));
  const myApps = applications.filter(a => a.applicantId === currentUser.id);
  const myNotifs = notifications.filter(n => n.userId === currentUser.id);
  const unreadNotifs = myNotifs.filter(n => !n.read);
  const myFamilyMembers = familyMembers.filter(f => f.userId === currentUser.id);
  const myHeirs = myFamilyMembers.filter(f => ['son', 'daughter', 'spouse'].includes(f.relation));
  const myClaims = inheritanceClaims.filter(c => c.heirUserId === currentUser.id);
  const pendingApps = myApps.filter(a => ['submitted', 'under_review', 'more_documents_required'].includes(a.status));

  // Quick stats
  const unpaidTaxParcels = myParcels.filter(p => p.taxRecords.some(tax => tax.status === 'unpaid'));
  const activeMortgageParcels = myParcels.filter(p => p.mortgages.some(m => m.status === 'active'));

  // Navigation Items
  const navItems: { key: CitizenTab; label: string; icon: any; count?: number }[] = [
    { key: 'overview', label: isBn ? 'ওভারভিউ' : 'Overview', icon: Landmark },
    { key: 'land', label: isBn ? 'আমার জমি' : 'My Land', icon: MapPin, count: myParcels.length },
    { key: 'heirs', label: isBn ? 'আমার উত্তরাধিকারী' : 'My Heirs', icon: Users, count: myHeirs.length },
    { key: 'inheritance', label: isBn ? 'আমার উত্তরাধিকারাংশ' : 'My Inheritance Shares', icon: Landmark, count: myClaims.length },
    { key: 'applications', label: isBn ? 'আমার আবেদন' : 'My Applications', icon: ClipboardList, count: myApps.length },
    { key: 'deed', label: isBn ? 'দলিল যাচাই' : 'Deed Verification', icon: FileCheck },
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

  const getVerifBadge = (state: string) => {
    if (state === 'verified' || state === 'verified_demo') {
      return <span className="badge badge-success">{t('vs.verified')}</span>;
    }
    if (state === 'disputed') {
      return <span className="badge badge-danger">{t('vs.disputed')}</span>;
    }
    if (state === 'pending') {
      return <span className="badge badge-warning">{t('vs.pending')}</span>;
    }
    return <span className="badge badge-muted">{t('vs.unverified')}</span>;
  };

  const handleDeedSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchDeedId.trim()) return;
    const found = registeredDocuments.find(d =>
      d.id.toLowerCase() === searchDeedId.trim().toLowerCase() ||
      d.deedNumber.toLowerCase() === searchDeedId.trim().toLowerCase()
    );
    setDeedSearchResult(found || null);
    setDeedSearched(true);
  };

  const markAllNotificationsRead = () => {
    unreadNotifs.forEach(n => {
      dispatch({ type: 'MARK_NOTIFICATION_READ', payload: n.id });
    });
  };

  return (
    <div className="portal-container">
      {/* ── Role Navigation Sidebar ─────────────────── */}
      <aside className="portal-sidebar">
        <div className="portal-sidebar-header">
          <div className="portal-user-badge">
            <span className="user-avatar-sm">{currentUser.name.charAt(0)}</span>
            <div className="portal-user-meta">
              <span className="portal-user-name">{isBn ? currentUser.name : currentUser.nameEn}</span>
              <span className="portal-role-tag">{isBn ? 'নাগরিক সেবা' : 'Citizen Portal'}</span>
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
                  <span className={`portal-nav-count ${item.key === 'notifications' ? 'count-alert' : ''}`}>
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
              {isBn ? 'ভূমি হেল্পলাইন: ১৬১২২' : 'Land Helpline: 16122'}
            </span>
          </div>
        </div>
      </aside>

      {/* ── Main Dashboard Workspace ────────────────── */}
      <main className="portal-main">
        {/* ═════════ OVERVIEW TAB ═════════ */}
        {activeTab === 'overview' && (
          <div className="portal-content">
            {/* 1. Compact welcome header */}
            <div className="welcome-banner">
              <div className="welcome-content">
                <h1 className="welcome-title">
                  {isBn ? `স্বাগতম, ${currentUser.name}` : `Welcome, ${currentUser.nameEn}`}
                </h1>
                <p className="welcome-subtitle">
                  {isBn
                    ? 'আপনার ব্যক্তিগত ভূমি সেবা পোর্টাল — সংরক্ষিত জমি, চলমান আবেদন এবং উত্তরাধিকার সংক্রান্ত তথ্যের সারসংক্ষেপ।'
                    : 'Your personal land service portal — overview of recorded land, active applications, and inheritance shares.'}
                </p>
                <div className="welcome-meta-chips">
                  {currentUser.nid && (
                    <span className="meta-chip">
                      <CreditCard size={13} /> NID: ****{currentUser.nid.slice(-4)}
                    </span>
                  )}
                  {currentUser.phone && (
                    <span className="meta-chip">
                      <Phone size={13} /> {currentUser.phone}
                    </span>
                  )}
                  <span className="meta-chip meta-chip-role">
                    <CheckCircle2 size={13} /> {isBn ? 'যাচাইকৃত নাগরিক' : 'Verified Citizen'}
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Four small summary cards in one consistent row on desktop */}
            <div className="summary-cards-grid">
              <div className="summary-stat-card" onClick={() => setActiveTab('land')}>
                <div className="stat-card-icon stat-icon-green">
                  <MapPin size={22} />
                </div>
                <div className="stat-card-data">
                  <span className="stat-card-value">
                    {isBn ? toBanglaDigits(myParcels.length) : myParcels.length}
                  </span>
                  <span className="stat-card-title">{t('dashboard.totalParcels')}</span>
                </div>
              </div>

              <div className="summary-stat-card" onClick={() => setActiveTab('inheritance')}>
                <div className="stat-card-icon stat-icon-navy">
                  <Landmark size={22} />
                </div>
                <div className="stat-card-data">
                  <span className="stat-card-value">
                    {isBn ? toBanglaDigits(myClaims.length) : myClaims.length}
                  </span>
                  <span className="stat-card-title">{t('dashboard.potentialInheritance')}</span>
                </div>
              </div>

              <div className="summary-stat-card" onClick={() => setActiveTab('applications')}>
                <div className="stat-card-icon stat-icon-amber">
                  <Clock size={22} />
                </div>
                <div className="stat-card-data">
                  <span className="stat-card-value">
                    {isBn ? toBanglaDigits(pendingApps.length) : pendingApps.length}
                  </span>
                  <span className="stat-card-title">{t('dashboard.pendingApps')}</span>
                </div>
              </div>

              <div className="summary-stat-card" onClick={() => setActiveTab('notifications')}>
                <div className="stat-card-icon stat-icon-blue">
                  <Bell size={22} />
                </div>
                <div className="stat-card-data">
                  <span className="stat-card-value">
                    {isBn ? toBanglaDigits(unreadNotifs.length) : unreadNotifs.length}
                  </span>
                  <span className="stat-card-title">{t('dashboard.unreadNotifs')}</span>
                </div>
              </div>
            </div>

            {/* Quick Actions Row */}
            <div className="quick-actions-bar">
              <span className="quick-actions-heading">{t('dashboard.quickActions')}:</span>
              <div className="quick-actions-list">
                <Link to="/search" className="quick-action-btn">
                  <Search size={15} />
                  <span>{isBn ? 'জমি খুঁজুন' : 'Search Land'}</span>
                </Link>
                <Link to="/mutation" className="quick-action-btn quick-action-primary">
                  <PlusCircle size={15} />
                  <span>{isBn ? 'আবেদন করুন' : 'Apply Now'}</span>
                </Link>
                <Link to="/track" className="quick-action-btn">
                  <ClipboardList size={15} />
                  <span>{isBn ? 'আবেদনের অবস্থা দেখুন' : 'Track Application'}</span>
                </Link>
              </div>
            </div>

            {/* Important Alerts (if tax or mortgage exists) */}
            {(unpaidTaxParcels.length > 0 || activeMortgageParcels.length > 0) && (
              <div className="citizen-alerts-box">
                {unpaidTaxParcels.length > 0 && (
                  <div className="inline-alert alert-warning">
                    <AlertTriangle size={16} />
                    <span>
                      {isBn
                        ? `${toBanglaDigits(unpaidTaxParcels.length)}টি জমিতে বকেয়া কর রয়েছে। বিস্তারিত দেখতে 'আমার জমি' দেখুন।`
                        : `${unpaidTaxParcels.length} parcel(s) have unpaid tax records. View 'My Land' for details.`}
                    </span>
                  </div>
                )}
                {activeMortgageParcels.length > 0 && (
                  <div className="inline-alert alert-info">
                    <Info size={16} />
                    <span>
                      {isBn
                        ? `${toBanglaDigits(activeMortgageParcels.length)}টি জমিতে সক্রিয় ব্যাংক বন্ধক রেকর্ড অন্তর্ভুক্ত রয়েছে।`
                        : `${activeMortgageParcels.length} parcel(s) have active bank mortgage records.`}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* 3. “সাম্প্রতিক আবেদন” Table */}
            <div className="content-card">
              <div className="card-header-row">
                <div className="card-header-title">
                  <ClipboardList size={18} className="text-primary" />
                  <h3>{isBn ? 'সাম্প্রতিক আবেদন' : 'Recent Applications'}</h3>
                </div>
                {myApps.length > 0 && (
                  <button className="link-action" onClick={() => setActiveTab('applications')}>
                    {isBn ? `সকল আবেদন দেখুন (${myApps.length}টি)` : `View All (${myApps.length})`} ›
                  </button>
                )}
              </div>

              {myApps.length === 0 ? (
                <div className="table-empty-state">
                  <ClipboardList size={36} className="text-muted" />
                  <p>{isBn ? 'এখনও কোনো আবেদন দাখিল করা হয়নি।' : 'No applications submitted yet.'}</p>
                  <Link to="/mutation" className="btn btn-primary-sm">
                    <PlusCircle size={14} /> {isBn ? 'নতুন আবেদন শুরু করুন' : 'Start New Application'}
                  </Link>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="portal-table">
                    <thead>
                      <tr>
                        <th>{isBn ? 'আবেদন আইডি' : 'Application ID'}</th>
                        <th>{isBn ? 'আবেদনের ধরন' : 'Type'}</th>
                        <th>{isBn ? 'জমার তারিখ' : 'Date'}</th>
                        <th>{isBn ? 'অবস্থা' : 'Status'}</th>
                        <th style={{ textAlign: 'right' }}>{isBn ? 'পদক্ষেপ' : 'Action'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {myApps.slice(0, 4).map(app => (
                        <tr key={app.id}>
                          <td>
                            <strong className="table-code">{app.id}</strong>
                          </td>
                          <td>
                            <span className="table-tag">
                              {app.type === 'inheritance' ? (isBn ? 'উত্তরাধিকার' : 'Inheritance') : (isBn ? 'নামজারি' : 'Mutation')}
                            </span>
                          </td>
                          <td>
                            <span className="text-muted" style={{ fontSize: '0.85rem' }}>
                              {app.submittedAt ? formatDate(app.submittedAt, language) : '—'}
                            </span>
                          </td>
                          <td>{getStatusBadge(app.status)}</td>
                          <td style={{ textAlign: 'right' }}>
                            <Link to={`/track/${app.id}`} className="btn-table-action">
                              {isBn ? 'অবস্থা দেখুন' : 'Track'} <ChevronRight size={14} />
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Two-Column Grid: 4. Compact “আমার জমি” & 5. Small “উত্তরাধিকার” */}
            <div className="overview-dual-grid">
              {/* 4. Compact “আমার জমি” section */}
              <div className="content-card">
                <div className="card-header-row">
                  <div className="card-header-title">
                    <MapPin size={18} className="text-primary" />
                    <h3>{isBn ? 'আমার জমি (সংক্ষেপ)' : 'My Land (Summary)'}</h3>
                  </div>
                  {myParcels.length > 0 && (
                    <button className="link-action" onClick={() => setActiveTab('land')}>
                      {isBn ? `সকল জমি দেখুন (${myParcels.length}টি)` : `View All (${myParcels.length})`} ›
                    </button>
                  )}
                </div>

                {myParcels.length === 0 ? (
                  <div className="table-empty-state">
                    <MapPin size={32} className="text-muted" />
                    <p>{isBn ? 'আপনার নামে কোনো জমি রেকর্ড পাওয়া যায়নি।' : 'No land records found under your name.'}</p>
                    <Link to="/search" className="btn btn-outline-sm">{t('home.searchLand')}</Link>
                  </div>
                ) : (
                  <div className="compact-parcel-list">
                    {myParcels.slice(0, 3).map(p => {
                      const share = p.owners.find(o => o.ownerId === currentUser.id);
                      return (
                        <div key={p.id} className="compact-item-card">
                          <div className="compact-item-main">
                            <span className="item-title">{p.id}</span>
                            <span className="item-location">
                              {isBn ? `${p.mouza}, ${p.upazila}` : `${p.mouzaEn}, ${p.upazilaEn}`}
                            </span>
                            <div className="item-details-row">
                              <span>{t('search.dagNumber')}: <strong>{p.dagNumber}</strong></span>
                              <span className="detail-sep">•</span>
                              <span>{t('search.khatianNumber')}: <strong>{p.khatianNumber}</strong></span>
                            </div>
                          </div>
                          <div className="compact-item-side">
                            <span className="item-share-val">
                              {isBn ? toBanglaDigits(share ? share.shareDecimal : p.totalAreaDecimal) : (share ? share.shareDecimal : p.totalAreaDecimal)} {t('land.decimal')}
                            </span>
                            <Link to={`/land/${p.id}`} className="item-link">
                              {isBn ? 'বিস্তারিত' : 'Details'} ›
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 5. Small “উত্তরাধিকার” section */}
              <div className="content-card">
                <div className="card-header-row">
                  <div className="card-header-title">
                    <Landmark size={18} className="text-primary" />
                    <h3>{isBn ? 'সম্ভাব্য উত্তরাধিকার দাবি' : 'Inheritance Shares'}</h3>
                  </div>
                  {myClaims.length > 0 && (
                    <button className="link-action" onClick={() => setActiveTab('inheritance')}>
                      {isBn ? `সকল দাবি দেখুন (${myClaims.length}টি)` : `View All (${myClaims.length})`} ›
                    </button>
                  )}
                </div>

                {myClaims.length === 0 ? (
                  <div className="table-empty-state">
                    <Landmark size={32} className="text-muted" />
                    <p>{isBn ? 'কোনো সম্ভাব্য উত্তরাধিকার দাবি নথিভুক্ত নেই।' : 'No potential claims listed.'}</p>
                    <Link to="/mutation" className="btn btn-outline-sm">
                      <PlusCircle size={14} /> {isBn ? 'উত্তরাধিকার আবেদন করুন' : 'Apply for Inheritance'}
                    </Link>
                  </div>
                ) : (
                  <div className="compact-claim-list">
                    {myClaims.slice(0, 3).map(claim => (
                      <div key={claim.id} className="compact-item-card">
                        <div className="compact-item-main">
                          <span className="item-title">{isBn ? claim.deceasedName : claim.deceasedNameEn}</span>
                          <span className="item-location">{isBn ? 'মৃত উত্তরাধিকারী সম্পর্ক' : 'Deceased Owner'}</span>
                          <div className="item-details-row">
                            <span>{isBn ? 'দাবিকৃত অংশ' : 'Claimed'}: <strong>{isBn ? toBanglaDigits(claim.claimedShareDecimal) : claim.claimedShareDecimal} {t('land.decimal')}</strong></span>
                          </div>
                        </div>
                        <div className="compact-item-side">
                          <span className="badge badge-warning">
                            {claim.status === 'potential' ? (isBn ? 'সম্ভাব্য' : 'Potential') : claim.status}
                          </span>
                          <button className="item-link" onClick={() => setActiveTab('inheritance')}>
                            {isBn ? 'যাচাই করুন' : 'Verify'} ›
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 6. Recent Notifications Summary */}
            <div className="content-card">
              <div className="card-header-row">
                <div className="card-header-title">
                  <Bell size={18} className="text-primary" />
                  <h3>{isBn ? 'সাম্প্রতিক বিজ্ঞপ্তি' : 'Recent Notifications'}</h3>
                </div>
                {myNotifs.length > 0 && (
                  <button className="link-action" onClick={() => setActiveTab('notifications')}>
                    {isBn ? `সকল বিজ্ঞপ্তি (${myNotifs.length}টি)` : `View All (${myNotifs.length})`} ›
                  </button>
                )}
              </div>

              {myNotifs.length === 0 ? (
                <div className="table-empty-state">
                  <CheckCircle2 size={32} className="text-muted" />
                  <p>{isBn ? 'কোনো নতুন বিজ্ঞপ্তি নেই।' : 'No new notifications.'}</p>
                </div>
              ) : (
                <div className="compact-notif-list">
                  {myNotifs.slice(0, 3).map(n => (
                    <div
                      key={n.id}
                      className={`compact-notif-item ${!n.read ? 'unread' : ''}`}
                      onClick={() => {
                        dispatch({ type: 'MARK_NOTIFICATION_READ', payload: n.id });
                        if (n.link) navigate(n.link);
                      }}
                    >
                      <div className={`notif-indicator notif-type-${n.type}`} />
                      <div className="notif-body">
                        <strong>{isBn ? n.title : n.titleEn}</strong>
                        <p>{isBn ? n.message : n.messageEn}</p>
                        <small className="text-muted">{formatDate(n.createdAt, language)}</small>
                      </div>
                      {n.link && <ChevronRight size={16} className="text-muted" />}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═════════ 2. MY LAND TAB ═════════ */}
        {activeTab === 'land' && (
          <div className="portal-content">
            <div className="section-title-bar">
              <div>
                <h2>{t('dashboard.myLand')}</h2>
                <p className="text-muted">{isBn ? 'আপনার এনআইডি সংশ্লিষ্ট রেকর্ডভুক্ত সকল জমির তালিকা' : 'Land parcels recorded under your NID'}</p>
              </div>
              <Link to="/search" className="btn btn-outline-sm">
                <Search size={14} /> {t('home.searchLand')}
              </Link>
            </div>

            {myParcels.length === 0 ? (
              <div className="content-card text-center p-4">
                <MapPin size={48} style={{ color: 'var(--color-primary)', margin: '0 auto 1rem' }} />
                <h3>{isBn ? 'কোনো জমি রেকর্ড পাওয়া যায়নি' : 'No Land Records Found'}</h3>
                <p className="text-muted">{isBn ? 'আপনার নামে বর্তমানে কোনো রেকর্ডভুক্ত জমি নেই।' : 'No recorded parcels under your profile.'}</p>
                <Link to="/search" className="btn btn-primary-sm mt-2">{t('home.searchLand')}</Link>
              </div>
            ) : (
              <div className="parcels-grid">
                {myParcels.map(parcel => {
                  const myShare = parcel.owners.find(o => o.ownerId === currentUser.id);
                  const hasUnpaidTax = parcel.taxRecords.some(t => t.status === 'unpaid');
                  const hasActiveMortgage = parcel.mortgages.some(m => m.status === 'active');
                  const hasLegalNotice = parcel.legalNotices.some(l => l.status === 'active');

                  return (
                    <div key={parcel.id} className="parcel-profile-card">
                      <div className="parcel-card-top">
                        <div className="parcel-id-group">
                          <span className="parcel-id-pill">{parcel.id}</span>
                          <span className="parcel-survey-pill">{parcel.surveyType}</span>
                        </div>
                        {myShare && getVerifBadge(myShare.verificationState)}
                      </div>

                      <div className="parcel-location-block">
                        <MapPin size={15} className="text-primary" />
                        <span>
                          {isBn
                            ? `${parcel.division} › ${parcel.district} › ${parcel.upazila} › ${parcel.mouza}`
                            : `${parcel.divisionEn} › ${parcel.districtEn} › ${parcel.upazilaEn} › ${parcel.mouzaEn}`
                          }
                        </span>
                      </div>

                      <div className="parcel-metrics-grid">
                        <div className="metric-cell">
                          <span className="metric-label">{t('search.dagNumber')}</span>
                          <span className="metric-val">{parcel.dagNumber}</span>
                        </div>
                        <div className="metric-cell">
                          <span className="metric-label">{t('search.khatianNumber')}</span>
                          <span className="metric-val">{parcel.khatianNumber}</span>
                        </div>
                        <div className="metric-cell">
                          <span className="metric-label">{t('land.area')}</span>
                          <span className="metric-val">
                            {isBn ? toBanglaDigits(parcel.totalAreaDecimal) : parcel.totalAreaDecimal} {t('land.decimal')}
                          </span>
                        </div>
                        {myShare && (
                          <div className="metric-cell metric-highlight">
                            <span className="metric-label">{isBn ? 'আমার অংশ' : 'My Share'}</span>
                            <span className="metric-val font-bold">
                              {isBn ? toBanglaDigits(myShare.shareDecimal) : myShare.shareDecimal} {t('land.decimal')}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Status Tags */}
                      <div className="parcel-status-tags">
                        {hasUnpaidTax && <span className="badge badge-danger">{t('dashboard.unpaidTax')}</span>}
                        {hasActiveMortgage && <span className="badge badge-warning">{t('dashboard.activeMortgage')}</span>}
                        {hasLegalNotice && <span className="badge badge-danger">{isBn ? 'আইনি নোটিশ' : 'Legal Notice'}</span>}
                        {!hasUnpaidTax && !hasActiveMortgage && !hasLegalNotice && (
                          <span className="badge badge-success">{isBn ? 'ক্লিন রেকর্ড' : 'Clean Record'}</span>
                        )}
                      </div>

                      <div className="parcel-card-footer">
                        <Link to={`/land/${parcel.id}`} className="btn btn-primary-sm btn-block">
                          {isBn ? 'জমির সম্পূর্ণ প্রোফাইল দেখুন' : 'View Full Land Profile'} <ChevronRight size={14} />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ═════════ 3. MY HEIRS TAB ═════════ */}
        {activeTab === 'heirs' && (
          <div className="portal-content">
            <div className="section-title-bar">
              <div>
                <h2>{t('heir.title')}</h2>
                <p className="text-muted">{isBn ? 'পারিবারিক সম্পর্ক ও বৈধ উত্তরাধিকারীদের তালিকা' : 'Registered family heirs and relationship status'}</p>
              </div>
            </div>

            {myFamilyMembers.length === 0 ? (
              <div className="content-card text-center p-4">
                <Users size={48} style={{ color: 'var(--color-primary)', margin: '0 auto 1rem' }} />
                <h3>{t('heir.noHeirs')}</h3>
                <p className="text-muted">{t('heir.addHint')}</p>
              </div>
            ) : (
              <div className="heirs-grid">
                {myFamilyMembers.map(fm => (
                  <div key={fm.id} className="heir-card">
                    <div className="heir-avatar-circle">
                      <span>{fm.name.charAt(0)}</span>
                    </div>
                    <div className="heir-details">
                      <div className="heir-name-row">
                        <h3>{isBn ? fm.name : fm.nameEn}</h3>
                        <span className="badge badge-muted">
                          {isBn ? fm.relationLabel : fm.relationLabelEn}
                        </span>
                      </div>
                      <div className="heir-tags-row">
                        {fm.isDeceased ? (
                          <span className="badge badge-danger">{t('heir.deceased')}</span>
                        ) : (
                          <span className="badge badge-success">{t('heir.living')}</span>
                        )}
                        {getVerifBadge(fm.verificationStatus)}
                      </div>
                      {fm.nid && (
                        <p className="heir-meta">NID: ****{fm.nid.slice(-4)}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═════════ 4. MY INHERITANCE TAB ═════════ */}
        {activeTab === 'inheritance' && (
          <div className="portal-content">
            <div className="section-title-bar">
              <div>
                <h2>{t('inheritance.title')}</h2>
                <p className="text-muted">{isBn ? 'পৈতৃক ও পারিবারিক সূত্রে সম্ভাব্য অংশ ও আবেদনের সুযোগ' : 'Potential inheritance shares and application pathways'}</p>
              </div>
              <Link to="/mutation" className="btn btn-primary-sm">
                <PlusCircle size={14} /> {isBn ? 'নতুন আবেদন' : 'Apply Now'}
              </Link>
            </div>

            {myClaims.length === 0 ? (
              <div className="content-card text-center p-4">
                <Landmark size={48} style={{ color: 'var(--color-primary)', margin: '0 auto 1rem' }} />
                <h3>{t('inheritance.noInheritance')}</h3>
                <p className="text-muted">{isBn ? 'কোনো সম্ভাব্য উত্তরাধিকার দাবি রেকর্ডভুক্ত নেই।' : 'No inheritance claims listed.'}</p>
                <Link to="/mutation" className="btn btn-primary-sm mt-2">
                  <PlusCircle size={14} /> {isBn ? 'উত্তরাধিকার নামজারি আবেদন করুন' : 'Start Inheritance Application'}
                </Link>
              </div>
            ) : (
              <div className="claims-list">
                {myClaims.map(claim => {
                  const parcel = parcels.find(p => p.id === claim.parcelId);
                  const relApp = claim.applicationId ? applications.find(a => a.id === claim.applicationId) : null;

                  return (
                    <div key={claim.id} className="claim-item-card">
                      <div className="claim-header">
                        <div>
                          <h3 className="claim-deceased-name">{isBn ? claim.deceasedName : claim.deceasedNameEn}</h3>
                          <span className="claim-deceased-subtext">{isBn ? 'মৃত মূল মালিকের রেকর্ড' : 'Deceased Owner Record'}</span>
                        </div>
                        <span className="badge badge-warning">
                          {claim.status === 'potential' ? (isBn ? 'সম্ভাব্য দাবি' : 'Potential Claim') : claim.status}
                        </span>
                      </div>

                      {parcel && (
                        <div className="claim-parcel-info">
                          <MapPin size={14} className="text-primary" />
                          <span>
                            {isBn
                              ? `${parcel.mouza}, ${parcel.upazila}, ${parcel.district} (দাগ: ${parcel.dagNumber}, খতিয়ান: ${parcel.khatianNumber})`
                              : `${parcel.mouzaEn}, ${parcel.upazilaEn}, ${parcel.districtEn} (Dag: ${parcel.dagNumber}, Khatian: ${parcel.khatianNumber})`}
                          </span>
                        </div>
                      )}

                      <div className="claim-shares-info">
                        <span className="share-text-label">{isBn ? 'দাবিকৃত হিস্যা / পরিমাণ' : 'Claimed Share'}:</span>
                        <strong className="share-text-val">
                          {isBn ? toBanglaDigits(claim.claimedShareDecimal) : claim.claimedShareDecimal} {t('land.decimal')}
                        </strong>
                      </div>

                      {claim.requiredDocuments.length > 0 && (
                        <div className="claim-docs-checklist">
                          <span className="checklist-heading">{isBn ? 'প্রয়োজনীয় কাগজপত্রের চেকলিস্ট' : 'Required Documents Checklist'}:</span>
                          <div className="checklist-tags">
                            {claim.requiredDocuments.map((doc, idx) => (
                              <span key={idx} className="doc-check-tag">
                                <FileText size={12} /> {doc}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="claim-actions-row">
                        {parcel && (
                          <Link to={`/land/${parcel.id}`} className="btn btn-outline-sm">
                            {isBn ? 'জমি রেকর্ড দেখুন' : 'View Parcel'}
                          </Link>
                        )}
                        {relApp ? (
                          <Link to={`/track/${relApp.id}`} className="btn btn-primary-sm">
                            {isBn ? 'আবেদন অবস্থা ট্র্যাক করুন' : 'Track Application'} ({relApp.id})
                          </Link>
                        ) : (
                          <Link to="/mutation" className="btn btn-primary-sm">
                            <PlusCircle size={14} /> {isBn ? 'নামজারি আবেদন দাখিল করুন' : 'Apply for Mutation'}
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ═════════ 5. MY APPLICATIONS TAB ═════════ */}
        {activeTab === 'applications' && (
          <div className="portal-content">
            <div className="section-title-bar">
              <div>
                <h2>{t('dashboard.myApps')}</h2>
                <p className="text-muted">{isBn ? 'দাখিলকৃত নামজারি ও উত্তরাধিকার আবেদনের অগ্রগতি' : 'Track the progress of your submitted applications'}</p>
              </div>
              <Link to="/mutation" className="btn btn-primary-sm">
                <PlusCircle size={14} /> {isBn ? 'নতুন আবেদন' : 'New Application'}
              </Link>
            </div>

            {myApps.length === 0 ? (
              <div className="content-card text-center p-4">
                <ClipboardList size={48} style={{ color: 'var(--color-primary)', margin: '0 auto 1rem' }} />
                <h3>{isBn ? 'কোনো আবেদন পাওয়া যায়নি' : 'No Applications Found'}</h3>
                <p className="text-muted">{isBn ? 'আপনি এখনো কোনো নামজারি বা উত্তরাধিকার আবেদন জমা দেননি।' : 'You have not submitted any applications yet.'}</p>
                <Link to="/mutation" className="btn btn-primary-sm mt-2">
                  <PlusCircle size={14} /> {isBn ? 'আবেদন করুন' : 'Apply Now'}
                </Link>
              </div>
            ) : (
              <div className="applications-full-list">
                {myApps.map(app => {
                  const parcel = parcels.find(p => p.id === app.parcelId);
                  return (
                    <div key={app.id} className="app-detail-card">
                      <div className="app-detail-header">
                        <div>
                          <div className="app-id-title-row">
                            <h3 className="app-code">{app.id}</h3>
                            <span className="badge badge-muted">
                              {app.type === 'inheritance' ? (isBn ? 'উত্তরাধিকার নামজারি' : 'Inheritance') : (isBn ? 'সাধারণ নামজারি' : 'Mutation')}
                            </span>
                          </div>
                          {parcel && (
                            <p className="app-parcel-sub">
                              <MapPin size={13} /> {isBn ? `${parcel.mouza}, ${parcel.upazila} (পার্সেল: ${parcel.id})` : `${parcel.mouzaEn}, ${parcel.upazilaEn} (${parcel.id})`}
                            </p>
                          )}
                        </div>
                        {getStatusBadge(app.status)}
                      </div>

                      <div className="app-meta-grid">
                        <div>
                          <span className="text-muted">{isBn ? 'জমার তারিখ' : 'Submitted'}:</span>{' '}
                          <strong>{app.submittedAt ? formatDate(app.submittedAt, language) : '—'}</strong>
                        </div>
                        <div>
                          <span className="text-muted">{isBn ? 'দাবিকৃত অংশ' : 'Claimed Share'}:</span>{' '}
                          <strong>{isBn ? toBanglaDigits(app.claimedShareDecimal) : app.claimedShareDecimal} {t('land.decimal')}</strong>
                        </div>
                        <div>
                          <span className="text-muted">{isBn ? 'সংযুক্ত কাগজপত্র' : 'Documents'}:</span>{' '}
                          <strong>{app.uploadedDocuments.length} {isBn ? 'টি' : 'files'}</strong>
                        </div>
                        <div>
                          <span className="text-muted">{isBn ? 'সর্বশেষ পর্যালোচনা' : 'Last Updated'}:</span>{' '}
                          <strong>{formatDate(app.updatedAt, language)}</strong>
                        </div>
                      </div>

                      {app.status === 'more_documents_required' && (
                        <div className="app-action-callout alert-warning">
                          <AlertTriangle size={16} />
                          <div>
                            <strong>{isBn ? 'কর্মকর্তার মন্তব্য / অতিরিক্ত নথি প্রয়োজন:' : 'Officer Remarks:'}</strong>
                            <p>{app.statusHistory.filter(h => h.status === 'more_documents_required').pop()?.reason || (isBn ? 'অনুগ্রহ করে প্রয়োজনীয় কাগজপত্র সংযোজন করুন।' : 'Additional documents required.')}</p>
                          </div>
                        </div>
                      )}

                      <div className="app-detail-actions">
                        <Link to={`/track/${app.id}`} className="btn btn-primary-sm">
                          {isBn ? 'সম্পূর্ণ স্ট্যাটাস টাইমলাইন দেখুন' : 'View Full Status Timeline'} <ChevronRight size={14} />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ═════════ 6. DEED VERIFICATION TAB ═════════ */}
        {activeTab === 'deed' && (
          <div className="portal-content">
            <div className="section-title-bar">
              <div>
                <h2>{t('dashboard.myVerifications')}</h2>
                <p className="text-muted">{isBn ? 'আপনার ডিজিটাল দলিলের সত্যতা ও হ্যাশ মিল পরীক্ষা করুন' : 'Verify authenticity of digital deeds and registered records'}</p>
              </div>
              <Link to="/deed-verify" className="btn btn-outline-sm" target="_blank">
                <ExternalLink size={14} /> {isBn ? 'পূর্ণ ভেরিফিকেশন পেজ' : 'Full Verification Tool'}
              </Link>
            </div>

            <div className="content-card">
              <h3 style={{ marginBottom: '1rem' }}>{isBn ? 'দলিল নম্বর বা রেকর্ড আইডি দিয়ে অনুসন্ধান' : 'Search by Deed Number or Record ID'}</h3>
              <form onSubmit={handleDeedSearch} className="deed-search-inline">
                <input
                  type="text"
                  placeholder={isBn ? 'যেমন: REG-DOC-2022-1190 বা 1190' : 'e.g. REG-DOC-2022-1190'}
                  value={searchDeedId}
                  onChange={e => { setSearchDeedId(e.target.value); setDeedSearched(false); }}
                  className="input-field"
                />
                <button type="submit" className="btn btn-primary">
                  <Search size={16} /> {isBn ? 'যাচাই করুন' : 'Verify'}
                </button>
              </form>

              {deedSearched && deedSearchResult && (
                <div className="deed-verify-result success-card mt-3">
                  <div className="result-header">
                    <CheckCircle2 size={24} className="text-success" />
                    <div>
                      <h4>{isBn ? 'রেকর্ড মিল পাওয়া গেছে' : 'Record Matched'}</h4>
                      <p className="text-muted">{isBn ? 'সংরক্ষিত ডিজিটাল দলিল রেকর্ডের সাথে তথ্য সম্পূর্ণ মিলেছে।' : 'Record matched with registered reference.'}</p>
                    </div>
                  </div>
                  <div className="result-details mt-2">
                    <p><strong>{isBn ? 'দলিল নম্বর' : 'Deed No'}:</strong> {deedSearchResult.deedNumber}</p>
                    <p><strong>{isBn ? 'দলিলের ধরন' : 'Deed Type'}:</strong> {isBn ? deedSearchResult.deedType : deedSearchResult.deedTypeEn}</p>
                    <p><strong>{isBn ? 'নিবন্ধন তারিখ' : 'Registration Date'}:</strong> {deedSearchResult.registrationDate}</p>
                    <p><strong>{isBn ? 'সংশ্লিষ্ট পার্সেল' : 'Parcel ID'}:</strong> {deedSearchResult.parcelId}</p>
                    <p className="hash-display"><strong>SHA-256:</strong> <code>{deedSearchResult.fileHash}</code></p>
                  </div>
                </div>
              )}

              {deedSearched && !deedSearchResult && (
                <div className="deed-verify-result notfound-card mt-3">
                  <div className="result-header">
                    <AlertTriangle size={24} className="text-warning" />
                    <div>
                      <h4>{isBn ? 'কোনো রেকর্ড পাওয়া যায়নি' : 'No Record Found'}</h4>
                      <p className="text-muted">{isBn ? 'এই দলিল নম্বর বা আইডির কোনো নিবন্ধিত রেকর্ড পাওয়া যায়নি।' : 'No registered deed record found with this ID.'}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Quick list of sample verified deeds */}
            <div className="content-card">
              <h3>{isBn ? 'নিবন্ধিত নমুনা রেফারেন্স দলিল' : 'Registered Reference Deeds'}</h3>
              <div className="table-responsive mt-2">
                <table className="portal-table">
                  <thead>
                    <tr>
                      <th>{isBn ? 'আইডি' : 'ID'}</th>
                      <th>{isBn ? 'দলিল নম্বর' : 'Deed Number'}</th>
                      <th>{isBn ? 'ধরন' : 'Type'}</th>
                      <th>{isBn ? 'পার্সেল' : 'Parcel'}</th>
                      <th>{isBn ? 'নিবন্ধন তারিখ' : 'Date'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {registeredDocuments.slice(0, 4).map(doc => (
                      <tr key={doc.id}>
                        <td><code>{doc.id}</code></td>
                        <td><strong>{doc.deedNumber}</strong></td>
                        <td>{isBn ? doc.deedType : doc.deedTypeEn}</td>
                        <td><Link to={`/land/${doc.parcelId}`}>{doc.parcelId}</Link></td>
                        <td>{doc.registrationDate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ═════════ 7. NOTIFICATIONS TAB ═════════ */}
        {activeTab === 'notifications' && (
          <div className="portal-content">
            <div className="section-title-bar">
              <div>
                <h2>{t('dashboard.notifications')}</h2>
                <p className="text-muted">{isBn ? 'আবেদন ও জমির রেকর্ড সংক্রান্ত নোটিফিকেশন' : 'Application and land record notices'}</p>
              </div>
              {unreadNotifs.length > 0 && (
                <button className="btn btn-outline-sm" onClick={markAllNotificationsRead}>
                  <Check size={14} /> {isBn ? 'সব পড়া হয়েছে হিসেবে চিহ্নিত করুন' : 'Mark all as read'}
                </button>
              )}
            </div>

            {myNotifs.length === 0 ? (
              <div className="content-card text-center p-4">
                <Bell size={48} style={{ color: 'var(--color-primary)', margin: '0 auto 1rem' }} />
                <h3>{isBn ? 'কোনো বিজ্ঞপ্তি নেই' : 'No Notifications'}</h3>
                <p className="text-muted">{isBn ? 'আপনার জন্য এই মুহূর্তে কোনো বিজ্ঞপ্তি নেই।' : 'You have no notices at this time.'}</p>
              </div>
            ) : (
              <div className="notifications-full-list">
                {myNotifs.map(n => (
                  <div
                    key={n.id}
                    className={`notification-full-card ${!n.read ? 'unread-card' : ''}`}
                    onClick={() => {
                      dispatch({ type: 'MARK_NOTIFICATION_READ', payload: n.id });
                      if (n.link) navigate(n.link);
                    }}
                  >
                    <div className={`notif-icon-circle notif-bg-${n.type}`}>
                      <Bell size={18} />
                    </div>
                    <div className="notif-full-body">
                      <div className="notif-full-top">
                        <h4>{isBn ? n.title : n.titleEn}</h4>
                        <span className="notif-time">{formatDateTime(n.createdAt, language)}</span>
                      </div>
                      <p>{isBn ? n.message : n.messageEn}</p>
                      {n.link && (
                        <span className="notif-link-hint">
                          {isBn ? 'বিস্তারিত দেখুন' : 'View Details'} <ChevronRight size={13} />
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═════════ 8. PROFILE & SETTINGS TAB ═════════ */}
        {activeTab === 'profile' && (
          <div className="portal-content">
            <div className="section-title-bar">
              <div>
                <h2>{t('dashboard.profile')}</h2>
                <p className="text-muted">{isBn ? 'ব্যক্তিগত তথ্য, অ্যাকাউন্টের নিরাপত্তা ও পছন্দসমূহ' : 'Personal info, security and portal preferences'}</p>
              </div>
            </div>

            <div className="profile-layout-grid">
              <div className="content-card">
                <h3>{isBn ? 'নাগরিক প্রোফাইল তথ্য' : 'Citizen Profile Details'}</h3>
                <div className="profile-info-grid mt-3">
                  <div className="profile-item">
                    <span className="profile-label">{isBn ? 'পূর্ণ নাম (বাংলা)' : 'Full Name (Bengali)'}</span>
                    <strong className="profile-val">{currentUser.name}</strong>
                  </div>
                  <div className="profile-item">
                    <span className="profile-label">{isBn ? 'পূর্ণ নাম (ইংরেজি)' : 'Full Name (English)'}</span>
                    <strong className="profile-val">{currentUser.nameEn}</strong>
                  </div>
                  <div className="profile-item">
                    <span className="profile-label">{isBn ? 'জাতীয় পরিচয়পত্র নম্বর (NID)' : 'National ID'}</span>
                    <strong className="profile-val">{currentUser.nid || '1990123456789'}</strong>
                  </div>
                  <div className="profile-item">
                    <span className="profile-label">{isBn ? 'মোবাইল নম্বর' : 'Mobile Phone'}</span>
                    <strong className="profile-val">{currentUser.phone || '01712345678'}</strong>
                  </div>
                  <div className="profile-item">
                    <span className="profile-label">{isBn ? 'ইমেইল ঠিকানা' : 'Email Address'}</span>
                    <strong className="profile-val">{currentUser.email || 'karim@demo.test'}</strong>
                  </div>
                  <div className="profile-item">
                    <span className="profile-label">{isBn ? 'ভূমিকা' : 'Role'}</span>
                    <span className="badge badge-info">{isBn ? 'নাগরিক' : 'Citizen'}</span>
                  </div>
                </div>
              </div>

              <div className="content-card">
                <h3>{isBn ? 'ভাষা ও সেটিংস' : 'Language & Portal Settings'}</h3>
                <div className="settings-rows mt-3">
                  <div className="setting-row">
                    <div>
                      <strong>{isBn ? 'ইন্টারফেস ভাষা' : 'Interface Language'}</strong>
                      <p className="text-muted" style={{ fontSize: '0.85rem' }}>{isBn ? 'বাংলা অথবা ইংরেজিতে প্রদর্শন' : 'Display in Bengali or English'}</p>
                    </div>
                    <button
                      className="btn btn-outline-sm"
                      onClick={() => dispatch({ type: 'SET_LANGUAGE', payload: language === 'bn' ? 'en' : 'bn' })}
                    >
                      {language === 'bn' ? 'English এ পরিবর্তন' : 'বাংলায় পরিবর্তন'}
                    </button>
                  </div>
                  <div className="setting-row">
                    <div>
                      <strong>{isBn ? 'এসএমএস বিজ্ঞপ্তি' : 'SMS Notifications'}</strong>
                      <p className="text-muted" style={{ fontSize: '0.85rem' }}>{isBn ? 'আবেদনের অগ্রগতির তথ্য মোবাইল নম্বরে পাঠানো হবে' : 'Receive status alerts via SMS'}</p>
                    </div>
                    <span className="badge badge-success">{isBn ? 'সক্রিয়' : 'Enabled'}</span>
                  </div>
                  <div className="setting-row">
                    <div>
                      <strong>{isBn ? 'লগইন সেশন' : 'Login Session'}</strong>
                      <p className="text-muted" style={{ fontSize: '0.85rem' }}>{isBn ? 'বর্তমান অধিবেশন সুরক্ষিত' : 'Secure local session'}</p>
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
    </div>
  );
}
