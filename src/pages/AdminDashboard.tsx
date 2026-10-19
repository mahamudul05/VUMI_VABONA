// ============================================================
// Admin Dashboard — Complete Centralized System Administration
// Unified CRUD, Reference Deed Library, Verifications Review,
// Integrity-safe operations, and Full Prototype Control
// ============================================================
import React, { useState, useRef, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Database, Users, FileText, Shield, RotateCcw, Plus,
  AlertCircle, Upload, Clock, Eye, Trash2, Download,
  ClipboardList, Heart, Landmark, DollarSign, Edit, UserPlus,
  Check, X, Search, MapPin, Settings, CheckCircle2,
  FileCheck, AlertTriangle, ArrowRight, RefreshCw, Layers,
  KeyRound, UserCheck, UserX, Split, Printer, CheckSquare,
  FileSearch, ExternalLink, HelpCircle
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  Card, StatusBadge, EmptyState, Breadcrumb, ConfirmDialog
} from '../components/SharedUI';
import { 
  formatDateTime, formatDate, generateId, computeSHA256, 
  readFileAsArrayBuffer, toBanglaDigits, toEnglishDigits 
} from '../utils';
import { storeFileBlob, getFileBlob, downloadBlob, previewBlob, getStoredDocumentBlob } from '../utils/fileStorage';
import { bangladeshLocations, getDivisions, getDistricts, getUpazilas } from '../data/locations';
import type { 
  RegisteredDocument, User, FamilyMember, InheritanceClaim, 
  MutationApplication, LandParcel, VerificationSubmission, 
  DetailedVerificationStatus, TaxRecord, MortgageRecord, OwnerShare
} from '../types';

type AdminTab =
  | 'overview'
  | 'users'
  | 'parcels'
  | 'family'
  | 'applications'
  | 'deeds'
  | 'verifications'
  | 'tax'
  | 'locations'
  | 'tools'
  | 'audit'
  | 'settings';

export default function AdminDashboard() {
  const {
    t, language, currentUser, parcels, applications,
    registeredDocuments, auditLog, users, familyMembers,
    inheritanceClaims, notifications, verificationSubmissions,
    dispatch, addAudit
  } = useApp();
  const navigate = useNavigate();

  const isBn = language === 'bn';

  // Navigation tab state
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');

  // Modals state
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [showCreateParcel, setShowCreateParcel] = useState(false);
  const [showAddFamily, setShowAddFamily] = useState(false);
  const [showAddInheritance, setShowAddInheritance] = useState(false);
  const [showRegisterDoc, setShowRegisterDoc] = useState(false);
  const [showAddTaxModal, setShowAddTaxModal] = useState(false);
  const [showAddMortgageModal, setShowAddMortgageModal] = useState(false);
  const [showSubdivideModal, setShowSubdivideModal] = useState<LandParcel | null>(null);

  // Detail / View / Edit Modals
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [viewingParcel, setViewingParcel] = useState<LandParcel | null>(null);
  const [editingParcel, setEditingParcel] = useState<LandParcel | null>(null);
  const [viewingDoc, setViewingDoc] = useState<RegisteredDocument | null>(null);
  const [editingDoc, setEditingDoc] = useState<RegisteredDocument | null>(null);
  const [reviewingSubmission, setReviewingSubmission] = useState<VerificationSubmission | null>(null);
  const [reviewingApp, setReviewingApp] = useState<MutationApplication | null>(null);

  // Safe Deletion Confirmation Dialogs
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    type: 'user' | 'parcel' | 'family' | 'claim' | 'doc' | 'submission';
    id: string;
    name: string;
    warningMessage?: string;
  }>({ open: false, type: 'user', id: '', name: '' });

  // Form states
  const [newUserForm, setNewUserForm] = useState({
    name: '', nameEn: '', role: 'citizen' as User['role'], phone: '', nid: '', email: '', password: ''
  });

  const [newParcelForm, setNewParcelForm] = useState({
    division: 'ঢাকা', divisionEn: 'Dhaka', district: 'ঢাকা', districtEn: 'Dhaka',
    upazila: 'সাভার', upazilaEn: 'Savar', mouza: 'আমিনবাজার', mouzaEn: 'Aminbazar',
    jlNumber: '১০৫', dagNumber: '', khatianNumber: '', totalAreaDecimal: 20, 
    surveyType: 'RS' as LandParcel['surveyType'], landType: 'আবাসিক', landTypeEn: 'Residential',
    ownerName: 'আবদুল করিম', ownerNameEn: 'Abdul Karim', ownerShare: 20
  });

  const [newFamilyForm, setNewFamilyForm] = useState({
    userId: '', name: '', nameEn: '', relation: 'son' as FamilyMember['relation'],
    relationLabel: 'পুত্র', relationLabelEn: 'Son', isDeceased: false
  });

  const [newInhForm, setNewInhForm] = useState({
    heirUserId: '', deceasedMemberId: '', parcelId: '', claimedShare: 5, notes: ''
  });

  const [regDocForm, setRegDocForm] = useState({
    deedNumber: '', deedType: 'বিক্রয় দলিল', deedTypeEn: 'Sale Deed', registrationDate: '',
    parties: '', partiesEn: '', parcelId: '', district: 'ঢাকা', districtEn: 'Dhaka',
    upazila: 'সাভার', upazilaEn: 'Savar', mouza: 'আমিনবাজার', mouzaEn: 'Aminbazar',
    jlNumber: '১০৫', dagNumber: '২৩৪', khatianNumber: '৫৬৭', landAreaDecimal: 10,
    sourceType: 'authorized_sample' as RegisteredDocument['sourceType'],
    status: 'active' as RegisteredDocument['status'], notes: ''
  });

  const [regFile, setRegFile] = useState<File | null>(null);
  const [regHash, setRegHash] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  // Tax and Mortgage form state
  const [newTaxForm, setNewTaxForm] = useState({
    parcelId: '', fiscalYear: '২০২৪-২০২৫', amountDue: 1500, amountPaid: 1500,
    status: 'paid' as TaxRecord['status'], receiptNumber: `TAX-RCP-${Date.now().toString().slice(-4)}`
  });

  const [newMortgageForm, setNewMortgageForm] = useState({
    parcelId: '', institution: 'সোনালী ব্যাংক লিমিটেড', institutionEn: 'Sonali Bank Limited',
    referenceNumber: `MORT-${Date.now().toString().slice(-5)}`, amount: 500000,
    startDate: new Date().toISOString().split('T')[0], status: 'active' as MortgageRecord['status']
  });

  // Subdivision Form State
  const [subdivideForm, setSubdivideForm] = useState({
    part1Dag: '', part1Area: 10, part1Owner: '',
    part2Dag: '', part2Area: 10, part2Owner: ''
  });

  // Location search and import
  const [locationSearch, setLocationSearch] = useState('');
  const [newCustomLocation, setNewCustomLocation] = useState({
    division: 'ঢাকা', district: 'ঢাকা', upazila: 'সাভার', mouza: '', jlNumber: ''
  });

  // Search & Filter States
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | 'citizen' | 'officer' | 'admin' | 'super_admin'>('all');
  const [parcelSearch, setParcelSearch] = useState('');
  const [docSearch, setDocSearch] = useState('');
  const [docStatusFilter, setDocStatusFilter] = useState('all');
  const [appStatusFilter, setAppStatusFilter] = useState('all');
  const [verificationFilter, setVerificationFilter] = useState('all');
  const [auditCategoryFilter, setAuditCategoryFilter] = useState('all');

  // Authorization Guard: Super Admin or Admin required
  if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'super_admin')) {
    return (
      <div className="container section">
        <div className="card text-center p-4">
          <Shield size={48} style={{ color: 'var(--color-primary)', margin: '0 auto 1rem' }} />
          <h2>{t('nav.login')}</h2>
          <p className="text-muted" style={{ marginBottom: '1.5rem' }}>
            {isBn 
              ? 'অ্যাডমিন ড্যাশবোর্ড দেখতে প্রশাসক বা সুপার অ্যাডমিন হিসেবে প্রবেশ করুন।' 
              : 'Please login as an administrator or super admin.'}
          </p>
          <Link to="/login" className="btn btn-primary">{t('nav.login')}</Link>
        </div>
      </div>
    );
  }

  // ── Derived Counts ─────────────────────────────────
  const totalUsersCount = users.length;
  const totalParcelsCount = parcels.length;
  const activeAppsCount = applications.filter(a => a.status !== 'rejected').length;
  const pendingReviewsCount = applications.filter(a => a.status === 'submitted' || a.status === 'under_review').length;
  const totalVerificationsCount = verificationSubmissions.length;
  const citizenUsers = users.filter(u => u.role === 'citizen');
  const deceasedMembers = familyMembers.filter(f => f.isDeceased);

  // Navigation Items
  const navItems: { key: AdminTab; label: string; icon: any; count?: number }[] = [
    { key: 'overview', label: isBn ? 'ওভারভিউ' : 'Overview', icon: Landmark },
    { key: 'users', label: isBn ? 'ব্যবহারকারী ব্যবস্থাপনা' : 'User Management', icon: Users, count: totalUsersCount },
    { key: 'parcels', label: isBn ? 'জমি/প্লট ব্যবস্থাপনা' : 'Land/Parcel Management', icon: Database, count: totalParcelsCount },
    { key: 'family', label: isBn ? 'পারিবারিক ও উত্তরাধিকার' : 'Family & Inheritance', icon: Heart, count: familyMembers.length },
    { key: 'deeds', label: isBn ? 'রেফারেন্স দলিল লাইব্রেরি' : 'Reference Deed Library', icon: FileText, count: registeredDocuments.length },
    { key: 'verifications', label: isBn ? 'দলিল যাচাই পর্যবেক্ষণ' : 'Deed Verifications Review', icon: FileCheck, count: totalVerificationsCount },
    { key: 'applications', label: isBn ? 'আবেদন ব্যবস্থাপনা' : 'Application Management', icon: ClipboardList, count: applications.length },
    { key: 'tax', label: isBn ? 'কর ও বন্ধক রেকর্ড' : 'Tax & Mortgage', icon: DollarSign },
    { key: 'locations', label: isBn ? 'অবস্থান ডাটা' : 'Location Data', icon: MapPin },
    { key: 'tools', label: isBn ? 'ডাটা টুলস ও ব্যাকআপ' : 'Data Tools & Backup', icon: RotateCcw },
    { key: 'audit', label: isBn ? 'অডিট লগ' : 'Audit Log', icon: Shield, count: auditLog.length },
    { key: 'settings', label: isBn ? 'সিস্টেম সেটিংস' : 'System Settings', icon: Settings },
  ];

  // ════════════════════════════════════════════════════════════
  // ── CRUD HANDLERS ──────────────────────────────────────────
  // ════════════════════════════════════════════════════════════

  // A. USER MANAGEMENT HANDLERS
  const handleCreateUser = () => {
    if (!newUserForm.name.trim()) return;
    const newUser: User = {
      id: `user-${newUserForm.role}-${generateId()}`,
      name: newUserForm.name,
      nameEn: newUserForm.nameEn || newUserForm.name,
      role: newUserForm.role,
      phone: newUserForm.phone || '01700000000',
      nid: newUserForm.nid || `${Date.now()}`,
      email: newUserForm.email || `${newUserForm.role}${Date.now().toString().slice(-4)}@demo.test`,
      isActive: true,
      createdAt: new Date().toISOString()
    };
    dispatch({ type: 'ADD_USER', payload: newUser });
    addAudit('ব্যবহারকারী তৈরি', 'User Created', 'user', newUser.id, `${newUser.name} (${newUser.role})`);
    setShowCreateUser(false);
    setNewUserForm({ name: '', nameEn: '', role: 'citizen', phone: '', nid: '', email: '', password: '' });
  };

  const handleUpdateUser = () => {
    if (!editingUser) return;
    dispatch({ type: 'UPDATE_USER', payload: editingUser });
    addAudit('ব্যবহারকারী হালনাগাদ', 'User Updated', 'user', editingUser.id, `${editingUser.name} তথ্য পরিবর্তিত হয়েছে`);
    setEditingUser(null);
  };

  const handleToggleUserActive = (user: User) => {
    const updated: User = { ...user, isActive: !user.isActive };
    dispatch({ type: 'UPDATE_USER', payload: updated });
    const actionText = updated.isActive ? 'অ্যাকাউন্ট সক্রিয়' : 'অ্যাকাউন্ট নিষ্ক্রিয়';
    addAudit(actionText, 'User Status Toggle', 'user', user.id, `${user.name} অবস্থা: ${updated.isActive ? 'Active' : 'Deactivated'}`);
  };

  const handleResetPassword = (user: User) => {
    alert(isBn 
      ? `${user.name} এর জন্য নিরাপদ পাসওয়ার্ড রিসেট লিঙ্ক নিবন্ধিত ইমেইলে (${user.email || user.phone}) পাঠানো হয়েছে।`
      : `Secure password reset link dispatched to user (${user.email || user.phone}).`);
    addAudit('পাসওয়ার্ড রিসেট অনুরোধ', 'Password Reset Initiated', 'user', user.id, `রিসেট লিঙ্ক প্রেরিত: ${user.name}`);
  };

  const initiateDeleteUser = (user: User) => {
    // Relationship integrity checks
    const linkedParcels = parcels.filter(p => p.owners.some(o => o.ownerId === user.id));
    const linkedApps = applications.filter(a => a.applicantId === user.id);
    const linkedClaims = inheritanceClaims.filter(c => c.heirUserId === user.id);

    let warning = '';
    if (linkedParcels.length > 0 || linkedApps.length > 0 || linkedClaims.length > 0) {
      warning = isBn 
        ? `সতর্কতা: এই ব্যবহারকারীর নামে ${linkedParcels.length}টি জমি, ${linkedApps.length}টি আবেদন ও ${linkedClaims.length}টি উত্তরাধিকার দাবি বিদ্যমান। স্থায়ী মুছে ফেলার পরিবর্তে অ্যাকাউন্টটি 'নিষ্ক্রিয়' করার পরামর্শ দেওয়া হচ্ছে।`
        : `Warning: This user is associated with ${linkedParcels.length} parcels, ${linkedApps.length} applications and ${linkedClaims.length} claims. Deactivating the account is strongly recommended instead of deleting.`;
    }

    setDeleteConfirm({
      open: true,
      type: 'user',
      id: user.id,
      name: user.name,
      warningMessage: warning
    });
  };

  // B. PARCEL MANAGEMENT HANDLERS
  const handleCreateParcel = () => {
    if (!newParcelForm.dagNumber || !newParcelForm.khatianNumber) return;
    const newId = `PARCEL-${String(parcels.length + 1).padStart(3, '0')}`;
    const newParcel: LandParcel = {
      id: newId,
      division: newParcelForm.division,
      divisionEn: newParcelForm.divisionEn,
      district: newParcelForm.district,
      districtEn: newParcelForm.districtEn,
      upazila: newParcelForm.upazila,
      upazilaEn: newParcelForm.upazilaEn,
      mouza: newParcelForm.mouza,
      mouzaEn: newParcelForm.mouzaEn,
      jlNumber: newParcelForm.jlNumber || '১০৫',
      dagNumber: newParcelForm.dagNumber,
      khatianNumber: newParcelForm.khatianNumber,
      totalAreaDecimal: Number(newParcelForm.totalAreaDecimal) || 20,
      landType: newParcelForm.landType,
      landTypeEn: newParcelForm.landTypeEn,
      surveyType: newParcelForm.surveyType,
      owners: [
        {
          ownerId: citizenUsers[0]?.id || 'user-citizen-1',
          ownerName: newParcelForm.ownerName || citizenUsers[0]?.name || 'আবদুল করিম',
          ownerNameEn: newParcelForm.ownerNameEn || citizenUsers[0]?.nameEn || 'Abdul Karim',
          shareDecimal: Number(newParcelForm.ownerShare) || Number(newParcelForm.totalAreaDecimal) || 20,
          verificationState: 'verified',
        }
      ],
      transactions: [],
      taxRecords: [
        { 
          id: `tax-${generateId()}`, 
          fiscalYear: '২০২৪-২০২৫', 
          amountDue: 600, 
          amountPaid: 600, 
          status: 'paid', 
          receiptNumber: `DCR-${generateId()}` 
        }
      ],
      mortgages: [],
      legalNotices: [],
    };
    dispatch({ type: 'ADD_PARCEL', payload: newParcel });
    addAudit('জমি রেকর্ড তৈরি', 'Parcel Created', 'parcel', newParcel.id, `দাগ: ${newParcel.dagNumber}, মৌজা: ${newParcel.mouza}`);
    setShowCreateParcel(false);
  };

  const handleUpdateParcel = () => {
    if (!editingParcel) return;
    dispatch({ type: 'UPDATE_PARCEL', payload: editingParcel });
    addAudit('জমি রেকর্ড হালনাগাদ', 'Parcel Updated', 'parcel', editingParcel.id, `দাগ: ${editingParcel.dagNumber}, মৌজা: ${editingParcel.mouza}`);
    setEditingParcel(null);
  };

  const handleSubdivideParcel = () => {
    if (!showSubdivideModal) return;
    const p = showSubdivideModal;
    
    // Create parcel A
    const parcelA: LandParcel = {
      ...p,
      id: `${p.id}-A`,
      dagNumber: subdivideForm.part1Dag || `${p.dagNumber}/১`,
      totalAreaDecimal: Number(subdivideForm.part1Area) || (p.totalAreaDecimal / 2),
      owners: [{
        ownerId: p.owners[0]?.ownerId || 'user-citizen-1',
        ownerName: subdivideForm.part1Owner || p.owners[0]?.ownerName || 'অংশীদার ১',
        ownerNameEn: p.owners[0]?.ownerNameEn || 'Partner 1',
        shareDecimal: Number(subdivideForm.part1Area) || (p.totalAreaDecimal / 2),
        verificationState: 'verified'
      }],
      transactions: [
        ...p.transactions,
        {
          id: `txn-${Date.now()}-1`,
          date: new Date().toISOString().split('T')[0],
          transferType: 'other',
          previousParty: p.owners[0]?.ownerName || 'মূল খতিয়ান',
          previousPartyEn: 'Original Parcel',
          receivingParty: subdivideForm.part1Owner || 'উপ-প্লট ১',
          receivingPartyEn: 'Subdivided Plot A',
          transferredAreaDecimal: Number(subdivideForm.part1Area),
          deedReference: `SUBDIV-${p.id}-A`,
          verificationState: 'verified',
          notes: 'সরকারি নামজারি ও সীমানা বিভাজন'
        }
      ]
    };

    // Create parcel B
    const parcelB: LandParcel = {
      ...p,
      id: `${p.id}-B`,
      dagNumber: subdivideForm.part2Dag || `${p.dagNumber}/২`,
      totalAreaDecimal: Number(subdivideForm.part2Area) || (p.totalAreaDecimal / 2),
      owners: [{
        ownerId: p.owners[1]?.ownerId || citizenUsers[1]?.id || 'user-citizen-1',
        ownerName: subdivideForm.part2Owner || p.owners[1]?.ownerName || 'অংশীদার ২',
        ownerNameEn: p.owners[1]?.ownerNameEn || 'Partner 2',
        shareDecimal: Number(subdivideForm.part2Area) || (p.totalAreaDecimal / 2),
        verificationState: 'verified'
      }],
      transactions: [
        ...p.transactions,
        {
          id: `txn-${Date.now()}-2`,
          date: new Date().toISOString().split('T')[0],
          transferType: 'other',
          previousParty: p.owners[0]?.ownerName || 'মূল খতিয়ান',
          previousPartyEn: 'Original Parcel',
          receivingParty: subdivideForm.part2Owner || 'উপ-প্লট ২',
          receivingPartyEn: 'Subdivided Plot B',
          transferredAreaDecimal: Number(subdivideForm.part2Area),
          deedReference: `SUBDIV-${p.id}-B`,
          verificationState: 'verified',
          notes: 'সরকারি নামজারি ও সীমানা বিভাজন'
        }
      ]
    };

    dispatch({ type: 'DELETE_PARCEL', payload: p.id });
    dispatch({ type: 'ADD_PARCEL', payload: parcelA });
    dispatch({ type: 'ADD_PARCEL', payload: parcelB });

    addAudit('প্লট বিভাজন (Subdivision)', 'Parcel Subdivided', 'parcel', p.id, `মূল প্লট ${p.id} বিভাজিত হয়ে ${parcelA.id} ও ${parcelB.id} তৈরি হয়েছে`);
    setShowSubdivideModal(null);
  };

  const initiateDeleteParcel = (parcel: LandParcel) => {
    const linkedApps = applications.filter(a => a.parcelId === parcel.id);
    const linkedClaims = inheritanceClaims.filter(c => c.parcelId === parcel.id);

    let warning = '';
    if (linkedApps.length > 0 || linkedClaims.length > 0) {
      warning = isBn 
        ? `সতর্কতা: এই পার্সেলের সাথে ${linkedApps.length}টি সক্রিয় আবেদন ও ${linkedClaims.length}টি উত্তরাধিকার দাবি যুক্ত রয়েছে। এটি মুছে ফেললে আবেদনের লিংক ক্ষতিগ্রস্ত হবে।`
        : `Warning: This parcel is linked to ${linkedApps.length} applications and ${linkedClaims.length} claims.`;
    }

    setDeleteConfirm({
      open: true,
      type: 'parcel',
      id: parcel.id,
      name: `${parcel.mouza} (দাগ: ${parcel.dagNumber})`,
      warningMessage: warning
    });
  };

  // C. REFERENCE DEED LIBRARY HANDLERS
  const handleRegFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setRegFile(f);
    try {
      const buffer = await readFileAsArrayBuffer(f);
      const hash = await computeSHA256(buffer);
      setRegHash(hash);
      await storeFileBlob(hash, f);
    } catch {
      setRegHash('');
    }
  };

  const handleRegisterDoc = async () => {
    if (!regDocForm.deedNumber.trim()) return;
    const docHash = regHash || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
    const newDocId = `REG-DOC-${generateId()}`;

    if (regFile) {
      await storeFileBlob(newDocId, regFile);
      await storeFileBlob(docHash, regFile);
    }

    const newDoc: RegisteredDocument = {
      id: newDocId,
      deedNumber: regDocForm.deedNumber,
      deedType: regDocForm.deedType || 'বিক্রয় দলিল',
      deedTypeEn: regDocForm.deedTypeEn || 'Sale Deed',
      registrationDate: regDocForm.registrationDate || new Date().toISOString().split('T')[0],
      parties: regDocForm.parties || 'আবদুল করিম ও অন্যান্য',
      partiesEn: regDocForm.partiesEn || 'Abdul Karim and others',
      parcelId: regDocForm.parcelId || parcels[0]?.id || 'PARCEL-001',
      district: regDocForm.district,
      districtEn: regDocForm.districtEn,
      upazila: regDocForm.upazila,
      upazilaEn: regDocForm.upazilaEn,
      mouza: regDocForm.mouza,
      mouzaEn: regDocForm.mouzaEn,
      jlNumber: regDocForm.jlNumber,
      dagNumber: regDocForm.dagNumber,
      khatianNumber: regDocForm.khatianNumber,
      landAreaDecimal: Number(regDocForm.landAreaDecimal) || 10,
      sourceType: regDocForm.sourceType || 'authorized_sample',
      status: regDocForm.status || 'active',
      notes: regDocForm.notes,
      fileHash: docHash,
      fileName: regFile?.name || `${regDocForm.deedNumber.toLowerCase()}-sample.pdf`,
      registeredBy: currentUser.id,
      registeredAt: new Date().toISOString(),
      extractedText: `গণপ্রজাতন্ত্রী বাংলাদেশ সরকার\nসাব-রেজিস্ট্রি অফিস ${regDocForm.upazila}, ${regDocForm.district}\nদলিল নম্বর: ${regDocForm.deedNumber}\nরেজিস্ট্রেশন তারিখ: ${regDocForm.registrationDate}\nমৌজা: ${regDocForm.mouza}, জেএল নং: ${regDocForm.jlNumber}\nখতিয়ান নং: ${regDocForm.khatianNumber}, দাগ নং: ${regDocForm.dagNumber}\nজমির পরিমাণ: ${regDocForm.landAreaDecimal} শতাংশ\nপক্ষসমূহ: ${regDocForm.parties}`
    };

    dispatch({ type: 'REGISTER_DOCUMENT', payload: newDoc });
    addAudit('রেফারেন্স দলিল নিবন্ধন', 'Reference Deed Added', 'document', newDoc.id, `দলিল নম্বর: ${newDoc.deedNumber}, হ্যাশ: ${docHash.slice(0, 16)}...`);
    setShowRegisterDoc(false);
    setRegFile(null);
    setRegHash('');
  };

  const handleUpdateDoc = () => {
    if (!editingDoc) return;
    dispatch({ type: 'UPDATE_DOCUMENT', payload: editingDoc });
    addAudit('রেফারেন্স দলিল হালনাগাদ', 'Reference Deed Updated', 'document', editingDoc.id, `দলিল নম্বর: ${editingDoc.deedNumber}`);
    setEditingDoc(null);
  };

  const handlePreviewStoredDoc = async (doc: RegisteredDocument) => {
    const blob = await getFileBlob(doc.id) || await getFileBlob(doc.fileHash);
    if (blob) {
      previewBlob(blob);
    } else {
      // Create synthetic preview text blob if actual binary not in IndexedDB
      const synthText = doc.extractedText || `ভূমি ভাবনা — সরকারি রেফারেন্স দলিল\n\nদলিল নম্বর: ${doc.deedNumber}\nতারিখ: ${doc.registrationDate}\nমৌজা: ${doc.mouza || ''}\nদাগ: ${doc.dagNumber || ''}\nখতিয়ান: ${doc.khatianNumber || ''}\nমালিক/পক্ষসমূহ: ${doc.parties}\nSHA-256 Hash: ${doc.fileHash}`;
      const synthBlob = new Blob([synthText], { type: 'text/plain' });
      previewBlob(synthBlob);
    }
  };

  const handleDownloadStoredDoc = async (doc: RegisteredDocument) => {
    const blob = await getFileBlob(doc.id) || await getFileBlob(doc.fileHash);
    if (blob) {
      downloadBlob(blob, doc.fileName);
    } else {
      const synthText = doc.extractedText || `ভূমি ভাবনা — সরকারি রেফারেন্স দলিল\nদলিল নং: ${doc.deedNumber}\nSHA-256: ${doc.fileHash}`;
      const synthBlob = new Blob([synthText], { type: 'text/plain' });
      downloadBlob(synthBlob, doc.fileName.endsWith('.txt') ? doc.fileName : `${doc.fileName}.txt`);
    }
    addAudit('রেফারেন্স দলিল ডাউনলোড', 'Reference Deed Downloaded', 'document', doc.id, doc.fileName);
  };

  // D. FAMILY & INHERITANCE HANDLERS
  const handleAddFamily = () => {
    if (!newFamilyForm.userId || !newFamilyForm.name.trim()) return;

    // Check duplicate or circular validation
    const existing = familyMembers.find(
      f => f.userId === newFamilyForm.userId && f.name.toLowerCase() === newFamilyForm.name.toLowerCase()
    );
    if (existing) {
      alert(isBn ? 'এই সদস্য ইতিমধ্যে এই ব্যবহারকারীর পরিবারে বিদ্যমান!' : 'This member is already registered for this user.');
      return;
    }

    const fm: FamilyMember = {
      id: `fm-${generateId()}`,
      userId: newFamilyForm.userId,
      name: newFamilyForm.name,
      nameEn: newFamilyForm.nameEn || newFamilyForm.name,
      relation: newFamilyForm.relation,
      relationLabel: newFamilyForm.relationLabel,
      relationLabelEn: newFamilyForm.relationLabelEn,
      isDeceased: newFamilyForm.isDeceased,
      verificationStatus: 'verified_demo',
    };
    dispatch({ type: 'ADD_FAMILY_MEMBER', payload: fm });
    addAudit('পারিবারিক সদস্য যোগ', 'Family Member Added', 'family', fm.id, `${fm.name} (${fm.relationLabel}) → ${fm.userId}`);
    setShowAddFamily(false);
  };

  const handleAddInheritance = () => {
    if (!newInhForm.heirUserId || !newInhForm.deceasedMemberId || !newInhForm.parcelId) return;
    const dm = familyMembers.find(f => f.id === newInhForm.deceasedMemberId);
    const claim: InheritanceClaim = {
      id: `inh-${generateId()}`,
      heirUserId: newInhForm.heirUserId,
      deceasedMemberId: newInhForm.deceasedMemberId,
      deceasedName: dm?.name || '',
      deceasedNameEn: dm?.nameEn || '',
      parcelId: newInhForm.parcelId,
      claimedShareDecimal: Number(newInhForm.claimedShare) || 5,
      status: 'potential',
      requiredDocuments: ['মৃত্যু সনদ', 'ওয়ারিশ সনদ', 'NID কপি'],
      verificationStatus: 'verified_demo',
      notes: newInhForm.notes || 'প্রোটোটাইপ উত্তরাধিকার দাবি'
    };
    dispatch({ type: 'ADD_INHERITANCE_CLAIM', payload: claim });
    addAudit('উত্তরাধিকার দাবি যোগ', 'Inheritance Claim Linked', 'inheritance', claim.id, `${claim.deceasedName} সূত্রে ${claim.parcelId}`);
    setShowAddInheritance(false);
  };

  // E. VERIFICATION SUBMISSION REVIEW HANDLERS
  const handleSaveSubmissionReview = (status: 'reviewed' | 'unable_to_conclude', notes: string) => {
    if (!reviewingSubmission) return;
    const updated: VerificationSubmission = {
      ...reviewingSubmission,
      adminReviewStatus: status,
      adminReviewNotes: notes,
      reviewedBy: currentUser.name,
      reviewedAt: new Date().toISOString()
    };
    dispatch({ type: 'UPDATE_VERIFICATION_SUBMISSION', payload: updated });
    addAudit('দলিল যাচাই পর্যালোচনা', 'Verification Reviewed', 'document', updated.id, `অবস্থা: ${status}, মন্তব্য: ${notes}`);
    setReviewingSubmission(null);
  };

  // F. APPLICATION WORKFLOW HANDLERS
  const handleAppDecision = (status: MutationApplication['status'], reason: string) => {
    if (!reviewingApp) return;
    dispatch({
      type: 'UPDATE_APPLICATION_STATUS',
      payload: {
        id: reviewingApp.id,
        status,
        changedBy: currentUser.name,
        reason: reason || 'প্রশাসনিক পর্যালোচনা ও সিদ্ধান্ত'
      }
    });
    addAudit('আবেদন পর্যালোচনা সিদ্ধান্ত', 'Application Reviewed', 'application', reviewingApp.id, `অবস্থা পরিবর্তিত: ${status}`);
    setReviewingApp(null);
  };

  // G. SAFE DELETION EXECUTION
  const handleConfirmDelete = () => {
    const { type, id } = deleteConfirm;
    if (type === 'user') {
      dispatch({ type: 'DELETE_USER', payload: id });
      addAudit('ব্যবহারকারী অপসারণ', 'User Deleted', 'user', id, `ব্যবহারকারী আইডি ${id} সরানো হয়েছে`);
    } else if (type === 'parcel') {
      dispatch({ type: 'DELETE_PARCEL', payload: id });
      addAudit('জমি রেকর্ড অপসারণ', 'Parcel Deleted', 'parcel', id, `জমি পার্সেল ${id} সরানো হয়েছে`);
    } else if (type === 'doc') {
      dispatch({ type: 'REMOVE_DOCUMENT', payload: id });
      addAudit('রেফারেন্স দলিল অপসারণ', 'Deed Deleted', 'document', id, `দলিল রেকর্ড ${id} সরানো হয়েছে`);
    } else if (type === 'family') {
      dispatch({ type: 'REMOVE_FAMILY_MEMBER', payload: id });
      addAudit('পারিবারিক সদস্য অপসারণ', 'Family Member Removed', 'family', id, `সদস্য ${id} সরানো হয়েছে`);
    } else if (type === 'claim') {
      dispatch({ type: 'REMOVE_INHERITANCE_CLAIM', payload: id });
      addAudit('উত্তরাধিকার দাবি অপসারণ', 'Claim Removed', 'inheritance', id, `দাবি ${id} সরানো হয়েছে`);
    } else if (type === 'submission') {
      dispatch({ type: 'DELETE_VERIFICATION_SUBMISSION', payload: id });
      addAudit('যাচাই রেকর্ড অপসারণ', 'Submission Deleted', 'document', id, `যাচাই ${id} মুছে ফেলা হয়েছে`);
    }
    setDeleteConfirm({ open: false, type: 'user', id: '', name: '' });
  };

  // H. EXPORT & RESET HANDLERS
  const handleReset = () => {
    dispatch({ type: 'RESET_DATA' });
    addAudit('সিস্টেম রিসেট', 'System Reset', 'system', 'all', 'সকল তথ্য মূল সিড ডাটায় পুনরায় সেট করা হয়েছে');
    setShowResetConfirm(false);
    window.location.reload();
  };

  const handleExportData = () => {
    const data = {
      users, parcels, applications, registeredDocuments,
      familyMembers, inheritanceClaims, verificationSubmissions,
      auditLog, notifications, exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    downloadBlob(blob, `vumi-vabona-full-backup-${Date.now()}.json`);
    addAudit('ডাটা ব্যাকআপ', 'Data Backup', 'system', 'all', 'JSON পূর্ণ ব্যাকআপ ডাউনলোড সম্পন্ন');
  };

  // Recent Admin activities
  const recentAdminActivities = auditLog.slice(-8).reverse();

  return (
    <div className="portal-container">
      {/* ── Admin Sidebar ─────────────────────────────── */}
      <aside className="portal-sidebar">
        <div className="portal-sidebar-header">
          <div className="portal-user-badge">
            <span className="user-avatar-sm avatar-admin"><Shield size={20} /></span>
            <div className="portal-user-meta">
              <span className="portal-user-name">{currentUser.name}</span>
              <span className="portal-role-tag badge-role-admin">
                {currentUser.role === 'super_admin' 
                  ? (isBn ? 'সুপার অ্যাডমিন' : 'Super Admin') 
                  : (isBn ? 'সিস্টেম প্রশাসক' : 'System Administrator')}
              </span>
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
                  <span className="portal-nav-count">
                    {isBn ? toBanglaDigits(item.count) : item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="portal-sidebar-footer">
          <div className="portal-sidebar-help">
            <span className="text-muted" style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span className="pulse-indicator"></span>
              {isBn ? 'সিস্টেম স্ট্যাটাস: সক্রিয়' : 'System Status: Active'}
            </span>
          </div>
        </div>
      </aside>

      {/* ── Main Content Area ─────────────────────────── */}
      <main className="portal-main">
        {/* ═════════ 1. OVERVIEW TAB ═════════ */}
        {activeTab === 'overview' && (
          <div className="portal-content">
            <div className="welcome-banner welcome-banner-admin">
              <div className="welcome-content">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.35rem' }}>
                  <h1 className="welcome-title" style={{ margin: 0 }}>
                    {isBn ? 'প্রশাসনিক কেন্দ্রীয় নিয়ন্ত্রণ কেন্দ্র' : 'Central Administrative Dashboard'}
                  </h1>
                  <span className="badge badge-primary font-mono">
                    {currentUser.role === 'super_admin' ? 'SUPER ADMIN ACCESS' : 'ADMIN CONTROL'}
                  </span>
                </div>
                <p className="welcome-subtitle">
                  {isBn
                    ? 'ভূমি ভাবনা প্রোটোটাইপের সকল ডাটাবেজ সত্তা, দলিল লাইব্রেরি ও ব্যবহারকারী রেকর্ড নিয়ন্ত্রণ করুন।'
                    : 'Manage all database entities, reference deed library and user records across Vumi Vabona.'}
                </p>
                <div className="welcome-meta-chips">
                  <span className="meta-chip">
                    <Shield size={13} /> {currentUser.name} ({currentUser.role === 'super_admin' ? (isBn ? 'সুপার অ্যাডমিন' : 'Super Admin') : (isBn ? 'সিস্টেম প্রশাসক' : 'System Administrator')})
                  </span>
                  <span className="meta-chip">
                    <Database size={13} /> {isBn ? 'জাতীয় ক্যাডাস্ট্রাল প্রোটোটাইপ' : 'National Cadastral Prototype'}
                  </span>
                  <span className="meta-chip">
                    <Clock size={13} /> {formatDate(new Date().toISOString(), language)}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Stat Cards */}
            <div className="summary-cards-grid">
              <div className="summary-stat-card card-hover-click" onClick={() => setActiveTab('users')}>
                <div className="stat-card-icon stat-icon-blue"><Users size={22} /></div>
                <div className="stat-card-data">
                  <span className="stat-card-value font-mono">
                    {isBn ? toBanglaDigits(totalUsersCount) : totalUsersCount}
                  </span>
                  <span className="stat-card-title">{isBn ? 'মোট ব্যবহারকারী' : 'Total Users'}</span>
                </div>
              </div>

              <div className="summary-stat-card card-hover-click" onClick={() => setActiveTab('parcels')}>
                <div className="stat-card-icon stat-icon-green"><Database size={22} /></div>
                <div className="stat-card-data">
                  <span className="stat-card-value font-mono">
                    {isBn ? toBanglaDigits(totalParcelsCount) : totalParcelsCount}
                  </span>
                  <span className="stat-card-title">{isBn ? 'জমি/প্লট রেকর্ড' : 'Cadastral Parcels'}</span>
                </div>
              </div>

              <div className="summary-stat-card card-hover-click" onClick={() => setActiveTab('deeds')}>
                <div className="stat-card-icon stat-icon-navy"><FileText size={22} /></div>
                <div className="stat-card-data">
                  <span className="stat-card-value font-mono">
                    {isBn ? toBanglaDigits(registeredDocuments.length) : registeredDocuments.length}
                  </span>
                  <span className="stat-card-title">{isBn ? 'রেফারেন্স দলিল' : 'Reference Deeds'}</span>
                </div>
              </div>

              <div className="summary-stat-card card-hover-click" onClick={() => setActiveTab('verifications')}>
                <div className="stat-card-icon stat-icon-amber"><FileCheck size={22} /></div>
                <div className="stat-card-data">
                  <span className="stat-card-value font-mono">
                    {isBn ? toBanglaDigits(totalVerificationsCount) : totalVerificationsCount}
                  </span>
                  <span className="stat-card-title">{isBn ? 'নাগরিক দলিল যাচাই' : 'Deed Verifications'}</span>
                </div>
              </div>
            </div>

            {/* Primary Action Row */}
            <div className="content-card">
              <div className="card-header-row mb-2">
                <div className="card-header-title">
                  <Layers size={18} className="text-primary" />
                  <h3>{isBn ? 'প্রশাসনিক দ্রুত কার্যক্রম' : 'Primary Administrative Actions'}</h3>
                </div>
              </div>
              <div className="primary-actions-row">
                <button className="primary-action-card-btn" onClick={() => setShowCreateUser(true)}>
                  <div className="action-btn-icon bg-blue"><UserPlus size={18} /></div>
                  <div className="action-btn-text">
                    <strong>{isBn ? 'নতুন ব্যবহারকারী তৈরি' : 'Create User'}</strong>
                    <small>{isBn ? 'নাগরিক বা কর্মকর্তা প্রোফাইল' : 'Citizen or officer profile'}</small>
                  </div>
                </button>

                <button className="primary-action-card-btn" onClick={() => setShowCreateParcel(true)}>
                  <div className="action-btn-icon bg-green"><Plus size={18} /></div>
                  <div className="action-btn-text">
                    <strong>{isBn ? 'নতুন জমি রেকর্ড যোগ' : 'Add Parcel'}</strong>
                    <small>{isBn ? 'দাগ ও খতিয়ান সহ নতুন প্লট' : 'Add land parcel record'}</small>
                  </div>
                </button>

                <button className="primary-action-card-btn" onClick={() => setShowRegisterDoc(true)}>
                  <div className="action-btn-icon bg-navy"><FileText size={18} /></div>
                  <div className="action-btn-text">
                    <strong>{isBn ? 'রেফারেন্স দলিল আপলোড' : 'Add Reference Deed'}</strong>
                    <small>{isBn ? 'যাচাই লাইব্রেরিতে দলিল যুক্ত করুন' : 'Add to verification library'}</small>
                  </div>
                </button>

                <button className="primary-action-card-btn" onClick={() => setActiveTab('verifications')}>
                  <div className="action-btn-icon bg-amber"><FileCheck size={18} /></div>
                  <div className="action-btn-text">
                    <strong>{isBn ? 'যাচাই কেস পর্যবেক্ষণ' : 'Review Verifications'}</strong>
                    <small>{isBn ? 'নাগরিক আপলোড ও রিপোর্ট অডিট' : 'Review citizen submissions'}</small>
                  </div>
                </button>
              </div>
            </div>

            {/* Recent Admin Activity */}
            <div className="content-card">
              <div className="card-header-row">
                <div className="card-header-title">
                  <Shield size={18} className="text-primary" />
                  <h3>{isBn ? 'সাম্প্রতিক সিস্টেম অডিট লগ ও কার্যকলাপ' : 'Recent System Audit & Operations'}</h3>
                </div>
                <button className="link-action" onClick={() => setActiveTab('audit')}>
                  {isBn ? 'সম্পূর্ণ অডিট লগ দেখুন' : 'View Complete Log'} ›
                </button>
              </div>

              <div className="table-responsive mt-2">
                <table className="portal-table">
                  <thead>
                    <tr>
                      <th>{isBn ? 'সময়' : 'Time'}</th>
                      <th>{isBn ? 'কার্যক্রম' : 'Action'}</th>
                      <th>{isBn ? 'বিভাগ' : 'Entity'}</th>
                      <th>{isBn ? 'টার্গেট আইডি' : 'Target'}</th>
                      <th>{isBn ? 'বিবরণ' : 'Details'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentAdminActivities.map(act => (
                      <tr key={act.id}>
                        <td className="text-muted" style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                          {formatDateTime(act.timestamp, language)}
                        </td>
                        <td><strong>{isBn ? act.action : act.actionEn}</strong></td>
                        <td><span className="badge badge-muted">{act.targetType}</span></td>
                        <td><code>{act.targetId}</code></td>
                        <td>{act.details}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ═════════ 2. USER MANAGEMENT TAB ═════════ */}
        {activeTab === 'users' && (
          <div className="portal-content">
            <div className="section-title-bar">
              <div>
                <h2>{t('admin.users')}</h2>
                <p className="text-muted">
                  {isBn 
                    ? 'নাগরিক, কর্মকর্তা ও প্রশাসকদের পূর্ণ প্রোফাইল, অনুমতি ও সংযুক্ত রেকর্ড নিয়ন্ত্রণ' 
                    : 'Manage citizen, officer & administrator accounts with linked data overview'}
                </p>
              </div>
              <button className="btn btn-primary-sm" onClick={() => setShowCreateUser(true)}>
                <UserPlus size={15} /> {isBn ? 'নতুন ব্যবহারকারী তৈরি' : 'Create User'}
              </button>
            </div>

            <div className="content-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                <div className="filter-chips-cluster">
                  <span className="filter-label">{isBn ? 'ভূমিকা:' : 'Role:'}</span>
                  {(['all', 'citizen', 'officer', 'admin', 'super_admin'] as const).map(role => (
                    <button
                      key={role}
                      className={`filter-pill-btn ${userRoleFilter === role ? 'active' : ''}`}
                      onClick={() => setUserRoleFilter(role)}
                    >
                      {role === 'all' 
                        ? t('common.all') 
                        : role === 'super_admin' 
                          ? (isBn ? 'সুপার অ্যাডমিন' : 'Super Admin')
                          : role === 'citizen' ? (isBn ? 'নাগরিক' : 'Citizen') 
                          : role === 'officer' ? (isBn ? 'কর্মকর্তা' : 'Officer') 
                          : (isBn ? 'অ্যাডমিন' : 'Admin')}
                    </button>
                  ))}
                </div>

                <div className="queue-search-input-wrapper" style={{ width: '280px' }}>
                  <Search size={16} className="search-icon" />
                  <input
                    type="text"
                    className="queue-search-input"
                    placeholder={isBn ? 'নাম, ফোন বা ইমেইল খুঁজুন...' : 'Search name, phone, email...'}
                    value={userSearch}
                    onChange={e => setUserSearch(e.target.value)}
                  />
                </div>
              </div>

              <div className="table-responsive">
                <table className="portal-table">
                  <thead>
                    <tr>
                      <th>{isBn ? 'আইডি' : 'ID'}</th>
                      <th>{isBn ? 'নাম ও ইমেইল' : 'Name & Email'}</th>
                      <th>{isBn ? 'ভূমিকা' : 'Role'}</th>
                      <th>{isBn ? 'ফোন' : 'Phone'}</th>
                      <th>{isBn ? 'এনআইডি' : 'NID'}</th>
                      <th>{isBn ? 'অবস্থা' : 'Status'}</th>
                      <th style={{ textAlign: 'right' }}>{isBn ? 'কার্যক্রম' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users
                      .filter(u => userRoleFilter === 'all' || u.role === userRoleFilter)
                      .filter(u => 
                        !userSearch.trim() || 
                        u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
                        u.nameEn?.toLowerCase().includes(userSearch.toLowerCase()) ||
                        u.phone.includes(userSearch) ||
                        u.email?.toLowerCase().includes(userSearch.toLowerCase())
                      )
                      .map(u => (
                        <tr key={u.id}>
                          <td><code>{u.id}</code></td>
                          <td>
                            <strong>{isBn ? u.name : u.nameEn}</strong>
                            {u.email && <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{u.email}</span>}
                          </td>
                          <td>
                            <span className={`badge badge-role-${u.role}`}>
                              {u.role === 'super_admin' ? (isBn ? 'সুপার অ্যাডমিন' : 'Super Admin')
                               : u.role === 'citizen' ? (isBn ? 'নাগরিক' : 'Citizen') 
                               : u.role === 'officer' ? (isBn ? 'কর্মকর্তা' : 'Officer') 
                               : (isBn ? 'অ্যাডমিন' : 'Admin')}
                            </span>
                          </td>
                          <td>{u.phone}</td>
                          <td>{u.nid || '—'}</td>
                          <td>
                            {u.isActive !== false ? (
                              <span className="badge badge-success">{isBn ? 'সক্রিয়' : 'Active'}</span>
                            ) : (
                              <span className="badge badge-danger">{isBn ? 'নিষ্ক্রিয়' : 'Deactivated'}</span>
                            )}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'flex-end' }}>
                              <button 
                                className="btn-table-action" 
                                title={isBn ? 'সম্পূর্ণ প্রোফাইল ও লিংকড রেকর্ড দেখুন' : 'View Details'}
                                onClick={() => setViewingUser(u)}
                              >
                                <Eye size={14} />
                              </button>
                              <button 
                                className="btn-table-action" 
                                title={isBn ? 'তথ্য সম্পাদন' : 'Edit User'}
                                onClick={() => setEditingUser(u)}
                              >
                                <Edit size={14} />
                              </button>
                              <button 
                                className="btn-table-action" 
                                title={u.isActive !== false ? (isBn ? 'অ্যাকাউন্ট নিষ্ক্রিয় করুন' : 'Deactivate') : (isBn ? 'পুনরায় সক্রিয় করুন' : 'Activate')}
                                onClick={() => handleToggleUserActive(u)}
                              >
                                {u.isActive !== false ? <UserX size={14} color="#f59e0b" /> : <UserCheck size={14} color="#10b981" />}
                              </button>
                              <button 
                                className="btn-table-action" 
                                title={isBn ? 'পাসওয়ার্ড রিসেট লিংক পাঠান' : 'Reset Password'}
                                onClick={() => handleResetPassword(u)}
                              >
                                <KeyRound size={14} />
                              </button>
                              {u.role !== 'super_admin' && (
                                <button 
                                  className="btn-table-action" 
                                  title={isBn ? 'মুছে ফেলুন' : 'Delete'}
                                  onClick={() => initiateDeleteUser(u)}
                                  style={{ color: 'var(--color-danger)' }}
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ═════════ 3. LAND/PARCEL MANAGEMENT TAB ═════════ */}
        {activeTab === 'parcels' && (
          <div className="portal-content">
            <div className="section-title-bar">
              <div>
                <h2>{t('admin.parcels')}</h2>
                <p className="text-muted">
                  {isBn 
                    ? 'ক্যাডাস্ট্রাল প্লট, মৌজা, খতিয়ান, দাগ ও মালিকানা হিস্যা ব্যবস্থাপনা' 
                    : 'Manage cadastral parcels, dag, khatian, survey types and ownership shares'}
                </p>
              </div>
              <button className="btn btn-primary-sm" onClick={() => setShowCreateParcel(true)}>
                <Plus size={15} /> {isBn ? 'নতুন জমি রেকর্ড যোগ' : 'Add Parcel'}
              </button>
            </div>

            <div className="content-card">
              <div className="queue-search-input-wrapper mb-3" style={{ maxWidth: '400px' }}>
                <Search size={16} className="search-icon" />
                <input
                  type="text"
                  className="queue-search-input"
                  placeholder={isBn ? 'দাগ নম্বর, মৌজা বা পার্সেল খুঁজুন...' : 'Search parcel, mouza or dag...'}
                  value={parcelSearch}
                  onChange={e => setParcelSearch(e.target.value)}
                />
              </div>

              <div className="table-responsive">
                <table className="portal-table">
                  <thead>
                    <tr>
                      <th>{isBn ? 'পার্সেল আইডি' : 'Parcel ID'}</th>
                      <th>{isBn ? 'অবস্থান (মৌজা, উপজেলা)' : 'Location'}</th>
                      <th>{isBn ? 'সার্ভে' : 'Survey'}</th>
                      <th>{isBn ? 'দাগ নং' : 'Dag No'}</th>
                      <th>{isBn ? 'খতিয়ান' : 'Khatian'}</th>
                      <th>{isBn ? 'মোট জমি' : 'Area'}</th>
                      <th>{isBn ? 'মালিকানা হিস্যা' : 'Owners'}</th>
                      <th style={{ textAlign: 'right' }}>{isBn ? 'কার্যক্রম' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parcels
                      .filter(p => 
                        !parcelSearch.trim() || 
                        p.id.toLowerCase().includes(parcelSearch.toLowerCase()) || 
                        p.mouza.includes(parcelSearch) || 
                        p.dagNumber.includes(parcelSearch) ||
                        p.khatianNumber.includes(parcelSearch)
                      )
                      .map(p => (
                        <tr key={p.id}>
                          <td><strong>{p.id}</strong></td>
                          <td>{isBn ? `${p.mouza}, ${p.upazila}` : `${p.mouzaEn}, ${p.upazilaEn}`}</td>
                          <td><span className="badge badge-muted">{p.surveyType}</span></td>
                          <td><strong>{p.dagNumber}</strong></td>
                          <td>{p.khatianNumber}</td>
                          <td>{isBn ? toBanglaDigits(p.totalAreaDecimal) : p.totalAreaDecimal} {t('land.decimal')}</td>
                          <td>
                            {p.owners.map(o => `${isBn ? o.ownerName : o.ownerNameEn} (${o.shareDecimal} শতক)`).join(', ')}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'flex-end' }}>
                              <Link to={`/land/${p.id}`} className="btn-table-action" title={isBn ? 'প্রোফাইল দেখুন' : 'View Profile'}>
                                <Eye size={14} />
                              </Link>
                              <button 
                                className="btn-table-action" 
                                title={isBn ? 'সম্পাদন' : 'Edit Parcel'}
                                onClick={() => setEditingParcel(p)}
                              >
                                <Edit size={14} />
                              </button>
                              <button 
                                className="btn-table-action" 
                                title={isBn ? 'প্লট বিভাজন (Subdivide)' : 'Subdivide'}
                                onClick={() => {
                                  setSubdivideForm({
                                    part1Dag: `${p.dagNumber}/১`,
                                    part1Area: p.totalAreaDecimal / 2,
                                    part1Owner: p.owners[0]?.ownerName || '',
                                    part2Dag: `${p.dagNumber}/২`,
                                    part2Area: p.totalAreaDecimal / 2,
                                    part2Owner: p.owners[1]?.ownerName || ''
                                  });
                                  setShowSubdivideModal(p);
                                }}
                              >
                                <Split size={14} color="var(--color-primary)" />
                              </button>
                              <button 
                                className="btn-table-action" 
                                title={isBn ? 'মুছে ফেলুন' : 'Delete'}
                                onClick={() => initiateDeleteParcel(p)}
                                style={{ color: 'var(--color-danger)' }}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ═════════ 4. FAMILY & INHERITANCE LINKS TAB ═════════ */}
        {activeTab === 'family' && (
          <div className="portal-content">
            <div className="section-title-bar">
              <div>
                <h2>{t('admin.familyMembers')} &amp; {t('admin.inheritanceClaims')}</h2>
                <p className="text-muted">
                  {isBn 
                    ? 'পারিবারিক সম্পর্ক (ওয়ারিশ) এবং উত্তরাধিকার দাবি ব্যবস্থাপনা (হিস্যা ও শর্তাবলি)' 
                    : 'Family tree mappings and inheritance claim allocations with legal notices'}
                </p>
              </div>
              <div className="d-flex gap-2">
                <button className="btn btn-outline-sm" onClick={() => setShowAddFamily(true)}>
                  <Heart size={14} /> {isBn ? 'পারিবারিক সদস্য যোগ' : 'Add Family Member'}
                </button>
                <button className="btn btn-primary-sm" onClick={() => setShowAddInheritance(true)}>
                  <Landmark size={14} /> {isBn ? 'উত্তরাধিকার দাবি লিংক' : 'Link Claim'}
                </button>
              </div>
            </div>

            {/* Notice distinguishing heirs from inheritance */}
            <div style={{ background: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '8px', borderLeft: '4px solid var(--color-primary)', marginBottom: '1.25rem' }}>
              <strong style={{ fontSize: '0.9rem' }}>
                {isBn ? '💡 গুরুত্বপূর্ণ নীতিমালা:' : '💡 Important Policy:'}
              </strong>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                {isBn
                  ? '"আমার ওয়ারিশগণ (My Heirs)" এবং "আমার উত্তরাধিকার (My Inheritance)" পৃথকভাবে সংরক্ষিত। ব্যবহারকারীর সন্তান তার ওয়ারিশ, কিন্তু সে তার পূর্বপুরুষ/পিতা-মাতার থেকে উত্তরাধিকার পায়। হিসাবসমূহ তথ্যগত উদ্দেশ্যে প্রদর্শিত।'
                  : '"My Heirs" is strictly distinct from "My Inheritance". A user\'s children are their heirs, while they inherit from deceased ancestors.'}
              </p>
            </div>

            {/* Inheritance claims list */}
            <div className="content-card mb-4">
              <h3 className="mb-2">{isBn ? 'কনফিগারকৃত উত্তরাধিকার দাবি ও বণ্টন (My Inheritance Claims)' : 'Configured Inheritance Claims'}</h3>
              <div className="table-responsive">
                <table className="portal-table">
                  <thead>
                    <tr>
                      <th>{isBn ? 'দাবি আইডি' : 'Claim ID'}</th>
                      <th>{isBn ? 'উত্তরাধিকারী (নাগরিক)' : 'Heir'}</th>
                      <th>{isBn ? 'মৃত ব্যক্তি' : 'Deceased'}</th>
                      <th>{isBn ? 'পার্সেল' : 'Parcel'}</th>
                      <th>{isBn ? 'দাবিকৃত অংশ' : 'Claimed Share'}</th>
                      <th>{isBn ? 'অবস্থা' : 'Status'}</th>
                      <th style={{ textAlign: 'right' }}>{isBn ? 'মুছে ফেলুন' : 'Delete'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inheritanceClaims.map(c => {
                      const heir = users.find(u => u.id === c.heirUserId);
                      return (
                        <tr key={c.id}>
                          <td><strong>{c.id}</strong></td>
                          <td>{heir ? (isBn ? heir.name : heir.nameEn) : c.heirUserId}</td>
                          <td><strong>{isBn ? c.deceasedName : c.deceasedNameEn}</strong></td>
                          <td><Link to={`/land/${c.parcelId}`}>{c.parcelId}</Link></td>
                          <td>{isBn ? toBanglaDigits(c.claimedShareDecimal) : c.claimedShareDecimal} {t('land.decimal')}</td>
                          <td><span className="badge badge-warning">{c.status}</span></td>
                          <td style={{ textAlign: 'right' }}>
                            <button 
                              className="btn-table-action"
                              style={{ color: 'var(--color-danger)' }}
                              onClick={() => setDeleteConfirm({
                                open: true,
                                type: 'claim',
                                id: c.id,
                                name: `দাবি: ${c.deceasedName} সূত্রে`
                              })}
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Family members list */}
            <div className="content-card">
              <h3 className="mb-2">{isBn ? 'নিবন্ধিত পারিবারিক সম্পর্ক ও ওয়ারিশ তালিকা (My Family & Heirs)' : 'Family Relationships Archive'}</h3>
              <div className="table-responsive">
                <table className="portal-table">
                  <thead>
                    <tr>
                      <th>{isBn ? 'আইডি' : 'ID'}</th>
                      <th>{isBn ? 'নাগরিক' : 'Citizen'}</th>
                      <th>{isBn ? 'সদস্যের নাম' : 'Member Name'}</th>
                      <th>{isBn ? 'সম্পর্ক' : 'Relation'}</th>
                      <th>{isBn ? 'অবস্থা' : 'Status'}</th>
                      <th style={{ textAlign: 'right' }}>{isBn ? 'মুছে ফেলুন' : 'Delete'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {familyMembers.map(fm => {
                      const u = users.find(x => x.id === fm.userId);
                      return (
                        <tr key={fm.id}>
                          <td><code>{fm.id}</code></td>
                          <td>{u ? (isBn ? u.name : u.nameEn) : fm.userId}</td>
                          <td><strong>{isBn ? fm.name : fm.nameEn}</strong></td>
                          <td>{isBn ? fm.relationLabel : fm.relationLabelEn}</td>
                          <td>
                            {fm.isDeceased ? (
                              <span className="badge badge-danger">{t('heir.deceased')}</span>
                            ) : (
                              <span className="badge badge-success">{t('heir.living')}</span>
                            )}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <button 
                              className="btn-table-action"
                              style={{ color: 'var(--color-danger)' }}
                              onClick={() => setDeleteConfirm({
                                open: true,
                                type: 'family',
                                id: fm.id,
                                name: fm.name
                              })}
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ═════════ 5. REFERENCE DEED LIBRARY TAB ═════════ */}
        {activeTab === 'deeds' && (
          <div className="portal-content">
            <div className="section-title-bar">
              <div>
                <h2>{isBn ? 'রেফারেন্স দলিল লাইব্রেরি' : 'Reference Deed Library'}</h2>
                <p className="text-muted">
                  {isBn 
                    ? 'সরকারি অনুমোদিত রেফারেন্স দলিল সংরক্ষণ, মেটাডাটা ও ক্রিপ্টোগ্রাফিক হ্যাশ ব্যবস্থাপনা' 
                    : 'Manage authorized reference deeds, metadata fields and cryptographic SHA-256 integrity'}
                </p>
              </div>
              <button className="btn btn-primary-sm" onClick={() => setShowRegisterDoc(true)}>
                <Plus size={15} /> {isBn ? 'নতুন রেফারেন্স দলিল আপলোড' : 'Add Reference Deed'}
              </button>
            </div>

            <div className="content-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                <div className="filter-chips-cluster">
                  <span className="filter-label">{isBn ? 'স্ট্যাটাস:' : 'Status:'}</span>
                  {(['all', 'active', 'inactive'] as const).map(st => (
                    <button
                      key={st}
                      className={`filter-pill-btn ${docStatusFilter === st ? 'active' : ''}`}
                      onClick={() => setDocStatusFilter(st)}
                    >
                      {st === 'all' ? t('common.all') : st === 'active' ? (isBn ? 'সক্রিয়' : 'Active') : (isBn ? 'নিষ্ক্রিয়' : 'Inactive')}
                    </button>
                  ))}
                </div>

                <div className="queue-search-input-wrapper" style={{ width: '280px' }}>
                  <Search size={16} className="search-icon" />
                  <input
                    type="text"
                    className="queue-search-input"
                    placeholder={isBn ? 'দলিল নং, দাগ বা মৌজা খুঁজুন...' : 'Search deed no, dag or mouza...'}
                    value={docSearch}
                    onChange={e => setDocSearch(e.target.value)}
                  />
                </div>
              </div>

              <div className="table-responsive">
                <table className="portal-table">
                  <thead>
                    <tr>
                      <th>{isBn ? 'দলিল আইডি' : 'Deed ID'}</th>
                      <th>{isBn ? 'দলিল নম্বর' : 'Deed No'}</th>
                      <th>{isBn ? 'ধরন' : 'Type'}</th>
                      <th>{isBn ? 'মৌজা ও দাগ' : 'Mouza & Dag'}</th>
                      <th>{isBn ? 'তারিখ' : 'Date'}</th>
                      <th>{isBn ? 'উৎস' : 'Source'}</th>
                      <th>{isBn ? 'SHA-256 হ্যাশ' : 'SHA-256'}</th>
                      <th style={{ textAlign: 'right' }}>{isBn ? 'কার্যক্রম' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {registeredDocuments
                      .filter(d => docStatusFilter === 'all' || (d.status || 'active') === docStatusFilter)
                      .filter(d => 
                        !docSearch.trim() || 
                        d.deedNumber.toLowerCase().includes(docSearch.toLowerCase()) ||
                        (d.mouza && d.mouza.includes(docSearch)) ||
                        (d.dagNumber && d.dagNumber.includes(docSearch)) ||
                        d.id.toLowerCase().includes(docSearch.toLowerCase())
                      )
                      .map(d => (
                        <tr key={d.id}>
                          <td><strong>{d.id}</strong></td>
                          <td><strong>{d.deedNumber}</strong></td>
                          <td>{isBn ? d.deedType : d.deedTypeEn}</td>
                          <td>{d.mouza || 'আমিনবাজার'} (দাগ: {d.dagNumber || '২৩৪'})</td>
                          <td>{d.registrationDate}</td>
                          <td>
                            <span className="badge badge-muted">
                              {d.sourceType || 'authorized_sample'}
                            </span>
                          </td>
                          <td><code style={{ fontSize: '0.75rem' }}>{d.fileHash.slice(0, 16)}...</code></td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'flex-end' }}>
                              <button 
                                className="btn-table-action" 
                                title={isBn ? 'নথি প্রিভিউ দেখুন' : 'Preview Document'}
                                onClick={() => handlePreviewStoredDoc(d)}
                              >
                                <Eye size={14} />
                              </button>
                              <button 
                                className="btn-table-action" 
                                title={isBn ? 'ডাউনলোড' : 'Download Document'}
                                onClick={() => handleDownloadStoredDoc(d)}
                              >
                                <Download size={14} />
                              </button>
                              <button 
                                className="btn-table-action" 
                                title={isBn ? 'মেটাডাটা সম্পাদন' : 'Edit Metadata'}
                                onClick={() => setEditingDoc(d)}
                              >
                                <Edit size={14} />
                              </button>
                              <button 
                                className="btn-table-action" 
                                title={isBn ? 'মুছে ফেলুন' : 'Delete'}
                                onClick={() => setDeleteConfirm({
                                  open: true,
                                  type: 'doc',
                                  id: d.id,
                                  name: `দলিল: ${d.deedNumber}`
                                })}
                                style={{ color: 'var(--color-danger)' }}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ═════════ 6. DEED VERIFICATIONS REVIEW TAB ═════════ */}
        {activeTab === 'verifications' && (
          <div className="portal-content">
            <div className="section-title-bar">
              <div>
                <h2>{isBn ? 'নাগরিক দলিল যাচাই পর্যবেক্ষণ' : 'Deed Verifications Review Dashboard'}</h2>
                <p className="text-muted">
                  {isBn 
                    ? 'নাগরিকদের দাখিলকৃত দলিলের ওসিআর ফলাফল, অসঙ্গতি বিশ্লেষণ ও প্রশাসনিক সিদ্ধান্ত' 
                    : 'Review citizen deed verification submissions, OCR extractions and audit discrepancy reports'}
                </p>
              </div>
            </div>

            <div className="content-card">
              <div className="filter-chips-cluster mb-3">
                <span className="filter-label">{isBn ? 'ফলাফল ফিল্টার:' : 'Filter Status:'}</span>
                {(['all', 'EXACT_MATCH', 'REFERENCE_MATCH', 'PARTIAL_MATCH', 'MISMATCH', 'NO_REFERENCE', 'UNABLE_TO_VERIFY'] as const).map(st => (
                  <button
                    key={st}
                    className={`filter-pill-btn ${verificationFilter === st ? 'active' : ''}`}
                    onClick={() => setVerificationFilter(st)}
                  >
                    {st === 'all' ? t('common.all') : st}
                  </button>
                ))}
              </div>

              <div className="table-responsive">
                <table className="portal-table">
                  <thead>
                    <tr>
                      <th>{isBn ? 'যাচাই আইডি' : 'Submission ID'}</th>
                      <th>{isBn ? 'নাগরিক / ব্যবহারকারী' : 'Citizen'}</th>
                      <th>{isBn ? 'মূল ফাইল' : 'Original File'}</th>
                      <th>{isBn ? 'তারিখ ও সময়' : 'Date'}</th>
                      <th>{isBn ? 'যাচাই অবস্থা' : 'Result Status'}</th>
                      <th>{isBn ? 'পর্যালোচনা অবস্থা' : 'Review Status'}</th>
                      <th style={{ textAlign: 'right' }}>{isBn ? 'রিভিউ ও রিপোর্ট' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {verificationSubmissions
                      .filter(s => verificationFilter === 'all' || s.status === verificationFilter)
                      .map(sub => (
                        <tr key={sub.id}>
                          <td><strong>{sub.id}</strong></td>
                          <td>{sub.userName || 'আবদুল করিম'}</td>
                          <td>{sub.originalFileName}</td>
                          <td>{formatDateTime(sub.createdAt, language)}</td>
                          <td>
                            <span 
                              className="badge" 
                              style={{ 
                                background: sub.status === 'EXACT_MATCH' ? '#10b981' : sub.status === 'REFERENCE_MATCH' ? '#059669' : sub.status === 'PARTIAL_MATCH' ? '#f59e0b' : sub.status === 'MISMATCH' ? '#ef4444' : '#64748b',
                                color: 'white'
                              }}
                            >
                              {sub.status}
                            </span>
                          </td>
                          <td>
                            <span className={`badge ${sub.adminReviewStatus === 'reviewed' ? 'badge-success' : 'badge-warning'}`}>
                              {sub.adminReviewStatus || 'pending'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'flex-end' }}>
                              <button 
                                className="btn btn-primary-sm"
                                onClick={() => setReviewingSubmission(sub)}
                              >
                                <FileSearch size={14} /> {isBn ? 'রিভিউ' : 'Review'}
                              </button>
                              <button 
                                className="btn-table-action"
                                style={{ color: 'var(--color-danger)' }}
                                onClick={() => setDeleteConfirm({
                                  open: true,
                                  type: 'submission',
                                  id: sub.id,
                                  name: sub.originalFileName
                                })}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ═════════ 7. APPLICATION MANAGEMENT TAB ═════════ */}
        {activeTab === 'applications' && (
          <div className="portal-content">
            <div className="section-title-bar">
              <div>
                <h2>{t('admin.applications')}</h2>
                <p className="text-muted">
                  {isBn 
                    ? 'নামজারি ও উত্তরাধিকার আবেদনের স্ট্যাটাস ওভাররাইড, কর্মকর্তা নিয়োগ ও নথি পর্যালোচনা' 
                    : 'Manage all mutation and inheritance application workflows and decision trails'}
                </p>
              </div>
            </div>

            <div className="content-card">
              <div className="filter-chips-cluster mb-3">
                <span className="filter-label">{isBn ? 'অবস্থা:' : 'Filter:'}</span>
                {(['all', 'submitted', 'under_review', 'more_documents_required', 'approved', 'rejected'] as const).map(st => (
                  <button
                    key={st}
                    className={`filter-pill-btn ${appStatusFilter === st ? 'active' : ''}`}
                    onClick={() => setAppStatusFilter(st)}
                  >
                    {st === 'all' ? t('common.all') : t(`status.${st}`)}
                  </button>
                ))}
              </div>

              <div className="table-responsive">
                <table className="portal-table">
                  <thead>
                    <tr>
                      <th>{isBn ? 'আবেদন আইডি' : 'App ID'}</th>
                      <th>{isBn ? 'আবেদনকারী' : 'Applicant'}</th>
                      <th>{isBn ? 'ধরন' : 'Type'}</th>
                      <th>{isBn ? 'পার্সেল' : 'Parcel'}</th>
                      <th>{isBn ? 'জমার তারিখ' : 'Submitted'}</th>
                      <th>{isBn ? 'অবস্থা' : 'Status'}</th>
                      <th style={{ textAlign: 'right' }}>{isBn ? 'পর্যালোচনা' : 'Review'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applications
                      .filter(a => appStatusFilter === 'all' || a.status === appStatusFilter)
                      .map(app => (
                        <tr key={app.id}>
                          <td><strong>{app.id}</strong></td>
                          <td>{isBn ? app.applicantName : app.applicantNameEn}</td>
                          <td><span className="badge badge-muted">{app.type}</span></td>
                          <td><Link to={`/land/${app.parcelId}`}>{app.parcelId}</Link></td>
                          <td>{app.submittedAt ? formatDate(app.submittedAt, language) : '—'}</td>
                          <td><StatusBadge status={app.status} /></td>
                          <td style={{ textAlign: 'right' }}>
                            <button
                              className="btn btn-outline-sm"
                              onClick={() => setReviewingApp(app)}
                            >
                              <Edit size={13} /> {isBn ? 'রিভিউ ও ওভাররাইড' : 'Review'}
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

        {/* ═════════ 8. TAX & MORTGAGE RECORDS TAB ═════════ */}
        {activeTab === 'tax' && (
          <div className="portal-content">
            <div className="section-title-bar">
              <div>
                <h2>{t('admin.taxMortgage')}</h2>
                <p className="text-muted">
                  {isBn 
                    ? 'ভূমি উন্নয়ন কর আদায় ও ব্যাংক বন্ধক সম্পর্কিত আর্থিক দায় নিরীক্ষা' 
                    : 'Manage land development tax entries, receipts and active bank liens'}
                </p>
              </div>
              <div className="d-flex gap-2">
                <button className="btn btn-outline-sm" onClick={() => setShowAddTaxModal(true)}>
                  <Plus size={14} /> {isBn ? 'কর রেকর্ড যোগ' : 'Add Tax Record'}
                </button>
                <button className="btn btn-primary-sm" onClick={() => setShowAddMortgageModal(true)}>
                  <Plus size={14} /> {isBn ? 'বন্ধক রেকর্ড যোগ' : 'Add Mortgage'}
                </button>
              </div>
            </div>

            <div className="content-card mb-4">
              <h3 className="mb-2">{isBn ? 'বকেয়া কর ও কর পরিশোধ রেকর্ড (Land Tax Registry)' : 'Land Development Tax Registry'}</h3>
              <div className="table-responsive">
                <table className="portal-table">
                  <thead>
                    <tr>
                      <th>{isBn ? 'পার্সেল' : 'Parcel'}</th>
                      <th>{isBn ? 'অর্থবছর' : 'Year'}</th>
                      <th>{isBn ? 'দেয় কর' : 'Due'}</th>
                      <th>{isBn ? 'পরিশোধিত' : 'Paid'}</th>
                      <th>{isBn ? 'অবস্থা' : 'Status'}</th>
                      <th>{isBn ? 'দাখিলা/রসিদ' : 'Receipt'}</th>
                      <th style={{ textAlign: 'right' }}>{isBn ? 'হালনাগাদ' : 'Action'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parcels.flatMap(p => p.taxRecords.map((tr, i) => (
                      <tr key={`${p.id}-${tr.id || i}`}>
                        <td><Link to={`/land/${p.id}`}><strong>{p.id}</strong></Link></td>
                        <td>{tr.fiscalYear}</td>
                        <td>৳{tr.amountDue}</td>
                        <td>৳{tr.amountPaid}</td>
                        <td>
                          <span className={`badge ${tr.status === 'paid' ? 'badge-success' : tr.status === 'unpaid' ? 'badge-danger' : 'badge-warning'}`}>
                            {t(`tax.${tr.status}`)}
                          </span>
                        </td>
                        <td>{tr.receiptNumber || '—'}</td>
                        <td style={{ textAlign: 'right' }}>
                          <button 
                            className="btn-table-action"
                            title={isBn ? 'পরিশোধিত হিসেবে চিহ্নিত করুন' : 'Mark Paid'}
                            onClick={() => {
                              const updatedParcels = parcels.map(item => {
                                if (item.id === p.id) {
                                  return {
                                    ...item,
                                    taxRecords: item.taxRecords.map(r => r.id === tr.id ? { ...r, status: 'paid' as const, amountPaid: r.amountDue, receiptNumber: `TAX-MANUAL-${Date.now().toString().slice(-4)}` } : r)
                                  };
                                }
                                return item;
                              });
                              dispatch({ type: 'UPDATE_PARCEL', payload: updatedParcels.find(x => x.id === p.id)! });
                              addAudit('কর রেকর্ড হালনাগাদ', 'Tax Record Paid', 'parcel', p.id, `${tr.fiscalYear} কর পরিশোধিত`);
                            }}
                          >
                            <CheckSquare size={14} color="#10b981" />
                          </button>
                        </td>
                      </tr>
                    )))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="content-card">
              <h3 className="mb-2">{isBn ? 'ব্যাংক বন্ধক ও আর্থিক দাবি রেকর্ড' : 'Active & Released Mortgage Liens'}</h3>
              <div className="table-responsive">
                <table className="portal-table">
                  <thead>
                    <tr>
                      <th>{isBn ? 'পার্সেল' : 'Parcel'}</th>
                      <th>{isBn ? 'ব্যাংক / প্রতিষ্ঠান' : 'Institution'}</th>
                      <th>{isBn ? 'ঋণ পরিমাণ' : 'Amount'}</th>
                      <th>{isBn ? 'তারিখ' : 'Date'}</th>
                      <th>{isBn ? 'অবস্থা' : 'Status'}</th>
                      <th style={{ textAlign: 'right' }}>{isBn ? 'রিলিজ করুন' : 'Release'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parcels.flatMap(p => p.mortgages.map((m, i) => (
                      <tr key={`${p.id}-${m.id || i}`}>
                        <td><Link to={`/land/${p.id}`}><strong>{p.id}</strong></Link></td>
                        <td>{isBn ? m.institution : m.institutionEn}</td>
                        <td>৳{m.amount ? m.amount.toLocaleString() : '—'}</td>
                        <td>{m.startDate}</td>
                        <td>
                          <span className={`badge ${m.status === 'active' ? 'badge-danger' : 'badge-success'}`}>
                            {t(`mortgage.${m.status}`)}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          {m.status === 'active' && (
                            <button 
                              className="btn btn-outline-sm"
                              onClick={() => {
                                const updated = {
                                  ...p,
                                  mortgages: p.mortgages.map(item => item.id === m.id ? { ...item, status: 'released' as const, releaseDate: new Date().toISOString().split('T')[0] } : item)
                                };
                                dispatch({ type: 'UPDATE_PARCEL', payload: updated });
                                addAudit('বন্ধক দায়মুক্তি', 'Mortgage Released', 'parcel', p.id, `${m.institution} বন্ধক রিলিজ করা হয়েছে`);
                              }}
                            >
                              {isBn ? 'দায়মুক্তি' : 'Release'}
                            </button>
                          )}
                        </td>
                      </tr>
                    )))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ═════════ 9. LOCATION DATA MANAGEMENT TAB ═════════ */}
        {activeTab === 'locations' && (
          <div className="portal-content">
            <div className="section-title-bar">
              <div>
                <h2>{t('admin.locations')}</h2>
                <p className="text-muted">
                  {isBn 
                    ? 'বাংলাদেশ জাতীয় তথ্য বাতায়নের পূর্ণ ৮ বিভাগ, ৬৪ জেলা, ৫০০ উপজেলা ও মৌজা ডাটাবেজ' 
                    : 'Official administrative hierarchy: 8 Divisions, 64 Districts, 500 Upazilas & Mouzas'}
                </p>
              </div>
              <div className="d-flex gap-2">
                <button 
                  className="btn btn-outline-sm"
                  onClick={() => {
                    const csvContent = "data:text/csv;charset=utf-8,Division,District,Upazila\n" +
                      bangladeshLocations.flatMap(div => 
                        div.districts.flatMap(dist => 
                          dist.upazilas.map(upz => `${div.bn},${dist.bn},${upz.bn}`)
                        )
                      ).join("\n");
                    const encodedUri = encodeURI(csvContent);
                    const link = document.createElement("a");
                    link.setAttribute("href", encodedUri);
                    link.setAttribute("download", "bangladesh_locations.csv");
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                >
                  <Download size={14} /> {isBn ? 'CSV এক্সপোর্ট' : 'Export CSV'}
                </button>
              </div>
            </div>

            <div className="content-card">
              <div className="queue-search-input-wrapper mb-3" style={{ maxWidth: '400px' }}>
                <Search size={16} className="search-icon" />
                <input
                  type="text"
                  className="queue-search-input"
                  placeholder={isBn ? 'বিভাগ, জেলা বা উপজেলা খুঁজুন...' : 'Search division, district, upazila...'}
                  value={locationSearch}
                  onChange={e => setLocationSearch(e.target.value)}
                />
              </div>

              <div className="table-responsive" style={{ maxHeight: '550px', overflowY: 'auto' }}>
                <table className="portal-table">
                  <thead>
                    <tr>
                      <th>{isBn ? 'বিভাগ' : 'Division'}</th>
                      <th>{isBn ? 'জেলা' : 'District'}</th>
                      <th>{isBn ? 'উপজেলা' : 'Upazila'}</th>
                      <th>{isBn ? 'নমুনা মৌজা ও জেএল' : 'Sample Mouza & JL'}</th>
                      <th>{isBn ? 'সংযুক্ত প্লট' : 'Linked Parcels'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bangladeshLocations
                      .flatMap(div => 
                        div.districts.flatMap(dist => 
                          dist.upazilas.map(upz => ({ div, dist, upz }))
                        )
                      )
                      .filter(item => 
                        !locationSearch.trim() ||
                        item.div.bn.includes(locationSearch) ||
                        item.div.en.toLowerCase().includes(locationSearch.toLowerCase()) ||
                        item.dist.bn.includes(locationSearch) ||
                        item.dist.en.toLowerCase().includes(locationSearch.toLowerCase()) ||
                        item.upz.bn.includes(locationSearch) ||
                        item.upz.en.toLowerCase().includes(locationSearch.toLowerCase())
                      )
                      .slice(0, 50)
                      .map((loc, idx) => {
                        const linkedParcels = parcels.filter(p => p.upazila === loc.upz.bn || p.district === loc.dist.bn);
                        return (
                          <tr key={idx}>
                            <td><strong>{isBn ? loc.div.bn : loc.div.en}</strong></td>
                            <td>{isBn ? loc.dist.bn : loc.dist.en}</td>
                            <td>{isBn ? loc.upz.bn : loc.upz.en}</td>
                            <td>
                              {loc.upz.mouzas && loc.upz.mouzas.length > 0 
                                ? `${loc.upz.mouzas[0].bn} (JL: ${loc.upz.mouzas[0].jlNumber || '১০১'})` 
                                : `${loc.upz.bn} সদর`}
                            </td>
                            <td>
                              {linkedParcels.length > 0 ? (
                                <span className="badge badge-success">{linkedParcels.length} টি পার্সেল</span>
                              ) : (
                                <span className="text-muted" style={{ fontSize: '0.8rem' }}>—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ═════════ 10. DEMO DATA TOOLS & BACKUP TAB ═════════ */}
        {activeTab === 'tools' && (
          <div className="portal-content">
            <div className="section-title-bar">
              <div>
                <h2>{t('admin.demoControl')}</h2>
                <p className="text-muted">{isBn ? 'ডাটাবেজ রপ্তানি, আমদানি এবং নিরাপদ সিস্টেম ডাটা রিসেট' : 'Export, backup and safe reset controls'}</p>
              </div>
            </div>

            <div className="tools-cards-grid">
              <div className="content-card">
                <Download size={32} className="text-primary mb-2" />
                <h3>{t('admin.exportData')}</h3>
                <p className="text-muted mt-1 mb-3">
                  {isBn 
                    ? 'সকল ব্যবহারকারী, জমি, আবেদন, দলিল ও ভেরিফিকেশন রেকর্ড JSON ফরম্যাটে ডাউনলোড করুন।' 
                    : 'Export all current system state and documents as a JSON file.'}
                </p>
                <button className="btn btn-primary" onClick={handleExportData}>
                  <Download size={16} /> {t('admin.exportData')}
                </button>
              </div>

              <div className="content-card">
                <RotateCcw size={32} className="text-danger mb-2" />
                <h3>{t('admin.resetData')}</h3>
                <p className="text-muted mt-1 mb-3">
                  {isBn 
                    ? 'সংরক্ষিত সকল ডাটা মুছে প্রাথমিক সিড ডাটায় ফিরিয়ে আনুন (Super Admin অ্যাকাউন্ট অপরিবর্তিত থাকবে)।' 
                    : 'Reset records back to clean initial state while preserving Super Admin.'}
                </p>
                <button className="btn btn-outline text-danger" onClick={() => setShowResetConfirm(true)}>
                  <RotateCcw size={16} /> {t('admin.resetData')}
                </button>
              </div>

              <div className="content-card">
                <Database size={32} className="text-navy mb-2" />
                <h3>{isBn ? 'ব্রাউজার পারসিস্টেন্স স্টোরেজ' : 'Browser Persistence Storage'}</h3>
                <p className="text-muted mt-1 mb-3">
                  {t('common.browserStorage')}
                </p>
                <span className="badge badge-muted">
                  {isBn 
                    ? `ব্যবহৃত মেমরি: ~${toBanglaDigits(Math.round((localStorage.getItem('vumi-state')?.length || 0) / 1024))} KB + IndexedDB` 
                    : `Storage: ~${Math.round((localStorage.getItem('vumi-state')?.length || 0) / 1024)} KB + IndexedDB`}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ═════════ 11. AUDIT LOG TAB ═════════ */}
        {activeTab === 'audit' && (
          <div className="portal-content">
            <div className="section-title-bar">
              <div>
                <h2>{t('admin.auditLog')}</h2>
                <p className="text-muted">{isBn ? 'সিস্টেমের সকল প্রশাসনিক ও ব্যবহারকারী কার্যক্রমের অপরিবর্তনীয় অডিট ট্রেইল' : 'Immutable audit trail of all platform operations'}</p>
              </div>
            </div>

            <div className="content-card">
              <div className="filter-chips-cluster mb-3">
                <span className="filter-label">{isBn ? 'ক্যাটাগরি:' : 'Category:'}</span>
                {(['all', 'user', 'parcel', 'document', 'application', 'inheritance', 'system'] as const).map(cat => (
                  <button
                    key={cat}
                    className={`filter-pill-btn ${auditCategoryFilter === cat ? 'active' : ''}`}
                    onClick={() => setAuditCategoryFilter(cat)}
                  >
                    {cat === 'all' ? t('common.all') : cat}
                  </button>
                ))}
              </div>

              <div className="table-responsive">
                <table className="portal-table">
                  <thead>
                    <tr>
                      <th>{isBn ? 'সময়' : 'Timestamp'}</th>
                      <th>{isBn ? 'অপারেশন' : 'Operation'}</th>
                      <th>{isBn ? 'ক্যাটাগরি' : 'Category'}</th>
                      <th>{isBn ? 'টার্গেট আইডি' : 'Target ID'}</th>
                      <th>{isBn ? 'সম্পাদনকারী' : 'Actor'}</th>
                      <th>{isBn ? 'বিস্তারিত' : 'Details'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLog
                      .filter(a => auditCategoryFilter === 'all' || a.targetType === auditCategoryFilter)
                      .slice()
                      .reverse()
                      .map(act => (
                        <tr key={act.id}>
                          <td className="text-muted" style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                            {formatDateTime(act.timestamp, language)}
                          </td>
                          <td><strong>{isBn ? act.action : act.actionEn}</strong></td>
                          <td><span className="badge badge-muted">{act.targetType}</span></td>
                          <td><code>{act.targetId}</code></td>
                          <td>{act.userName}</td>
                          <td>{act.details}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ═════════ 12. SYSTEM SETTINGS TAB ═════════ */}
        {activeTab === 'settings' && (
          <div className="portal-content">
            <div className="section-title-bar">
              <div>
                <h2>{t('admin.settings')}</h2>
                <p className="text-muted">{isBn ? 'সুপার অ্যাডমিন সুরক্ষা ও প্ল্যাটফর্ম কনফিগারেশন' : 'System security, role policies and configuration'}</p>
              </div>
            </div>

            <div className="profile-layout-grid">
              <div className="content-card">
                <h3>{isBn ? 'প্ল্যাটফর্ম কনফিগারেশন' : 'Platform Configuration'}</h3>
                <div className="settings-rows mt-3">
                  <div className="setting-row">
                    <div>
                      <strong>{isBn ? 'প্রোটোটাইপ সংস্করণ' : 'Prototype Edition'}</strong>
                      <p className="text-muted" style={{ fontSize: '0.85rem' }}>LandTech 2026 Bangladesh Land Prototype</p>
                    </div>
                    <span className="badge badge-success">{isBn ? 'সক্রিয়' : 'Active'}</span>
                  </div>
                  <div className="setting-row">
                    <div>
                      <strong>{isBn ? 'ক্রিপ্টোগ্রাফিক হ্যাশ অ্যালগরিদম' : 'Hashing Engine'}</strong>
                      <p className="text-muted" style={{ fontSize: '0.85rem' }}>SHA-256 WebCrypto Client-Side & Server API</p>
                    </div>
                    <span className="badge badge-muted">SHA-256</span>
                  </div>
                  <div className="setting-row">
                    <div>
                      <strong>{isBn ? 'ওসিআর ইঞ্জিন (OCR)' : 'OCR Engine'}</strong>
                      <p className="text-muted" style={{ fontSize: '0.85rem' }}>Tesseract.js OCR (Bangla + English Cadastral Models)</p>
                    </div>
                    <span className="badge badge-success">Tesseract OCR</span>
                  </div>
                  <div className="setting-row">
                    <div>
                      <strong>{isBn ? 'দ্বিভাষিক সমর্থন' : 'Bilingual Support'}</strong>
                      <p className="text-muted" style={{ fontSize: '0.85rem' }}>বাংলা ও English</p>
                    </div>
                    <button
                      className="btn btn-outline-sm"
                      onClick={() => dispatch({ type: 'SET_LANGUAGE', payload: language === 'bn' ? 'en' : 'bn' })}
                    >
                      {language === 'bn' ? 'Switch to English' : 'বাংলায় পরিবর্তন'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="content-card">
                <h3>{isBn ? 'প্রশাসক নিরাপত্তা ও অ্যাকাউন্ট' : 'Administrator Credentials & Security'}</h3>
                <div className="settings-rows mt-3">
                  <div className="setting-row">
                    <div>
                      <strong>{isBn ? 'সক্রিয় অ্যাকাউন্ট ইমেইল' : 'Active Account Email'}</strong>
                      <p className="text-muted" style={{ fontSize: '0.85rem' }}>{currentUser.email || (currentUser.role === 'super_admin' ? 'superadmin@vumi.gov.bd' : 'admin@vumi.gov.bd')}</p>
                    </div>
                    <span className="badge badge-success">Protected</span>
                  </div>
                  <div className="setting-row">
                    <div>
                      <strong>{isBn ? 'সেশন স্টেটাস' : 'Session Status'}</strong>
                      <p className="text-muted" style={{ fontSize: '0.85rem' }}>{currentUser.name} ({currentUser.role})</p>
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

      {/* ════════════════════════════════════════════════════════════
          ── MODALS SECTION ──────────────────────────────────────────
          ════════════════════════════════════════════════════════════ */}

      {/* 1. Create User Modal */}
      {showCreateUser && (
        <div className="review-modal-overlay" onClick={() => setShowCreateUser(false)}>
          <div className="review-modal-box" onClick={e => e.stopPropagation()}>
            <div className="review-modal-header">
              <h3>{isBn ? 'নতুন ব্যবহারকারী অ্যাকাউন্ট তৈরি করুন' : 'Create New User Account'}</h3>
              <button className="modal-close-btn" onClick={() => setShowCreateUser(false)}>×</button>
            </div>
            <div className="review-modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label>{isBn ? 'পূর্ণ নাম (বাংলা) *' : 'Name (Bengali) *'}</label>
                  <input
                    type="text"
                    className="input-field"
                    value={newUserForm.name}
                    onChange={e => setNewUserForm({ ...newUserForm, name: e.target.value })}
                    placeholder={isBn ? 'যেমন: মোহাম্মদ হাসান' : 'Name in Bengali'}
                  />
                </div>
                <div className="form-group">
                  <label>{isBn ? 'পূর্ণ নাম (ইংরেজি)' : 'Name (English)'}</label>
                  <input
                    type="text"
                    className="input-field"
                    value={newUserForm.nameEn}
                    onChange={e => setNewUserForm({ ...newUserForm, nameEn: e.target.value })}
                    placeholder="e.g. Md. Hasan"
                  />
                </div>
                <div className="form-group">
                  <label>{isBn ? 'ইমেইল অ্যাড্রেস' : 'Email Address'}</label>
                  <input
                    type="email"
                    className="input-field"
                    value={newUserForm.email}
                    onChange={e => setNewUserForm({ ...newUserForm, email: e.target.value })}
                    placeholder="user@example.com"
                  />
                </div>
                <div className="form-group">
                  <label>{isBn ? 'ভূমিকা (Role)' : 'Role'}</label>
                  <select
                    className="input-field"
                    value={newUserForm.role}
                    onChange={e => setNewUserForm({ ...newUserForm, role: e.target.value as User['role'] })}
                  >
                    <option value="citizen">{isBn ? 'নাগরিক (Citizen)' : 'Citizen'}</option>
                    <option value="officer">{isBn ? 'ভূমি কর্মকর্তা (Land Officer)' : 'Land Officer'}</option>
                    <option value="admin">{isBn ? 'অ্যাডমিন (Admin)' : 'Admin'}</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>{isBn ? 'মোবাইল নম্বর' : 'Phone Number'}</label>
                  <input
                    type="text"
                    className="input-field"
                    value={newUserForm.phone}
                    onChange={e => setNewUserForm({ ...newUserForm, phone: e.target.value })}
                    placeholder="01712345678"
                  />
                </div>
                <div className="form-group">
                  <label>{isBn ? 'জাতীয় পরিচয়পত্র নম্বর (NID)' : 'NID Number'}</label>
                  <input
                    type="text"
                    className="input-field"
                    value={newUserForm.nid}
                    onChange={e => setNewUserForm({ ...newUserForm, nid: e.target.value })}
                    placeholder="1990123456789"
                  />
                </div>
              </div>
              <div className="modal-actions-row mt-3">
                <button className="btn btn-outline" onClick={() => setShowCreateUser(false)}>
                  {t('common.cancel')}
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleCreateUser}
                  disabled={!newUserForm.name.trim()}
                >
                  {isBn ? 'অ্যাকাউন্ট তৈরি করুন' : 'Create User'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. User Details Modal (Showing Linked Data) */}
      {viewingUser && (
        <div className="review-modal-overlay" onClick={() => setViewingUser(null)}>
          <div className="review-modal-box" style={{ maxWidth: '650px' }} onClick={e => e.stopPropagation()}>
            <div className="review-modal-header">
              <h3>{isBn ? 'ব্যবহারকারীর বিস্তারিত প্রোফাইল ও সংযুক্ত রেকর্ড' : 'User Profile & Linked Cadastral Data'}</h3>
              <button className="modal-close-btn" onClick={() => setViewingUser(null)}>×</button>
            </div>
            <div className="review-modal-body">
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', paddingBottom: '1rem', borderBottom: '1px solid #e2e8f0', marginBottom: '1rem' }}>
                <div style={{ background: 'var(--color-primary)', color: 'white', padding: '0.75rem', borderRadius: '50%' }}>
                  <Users size={28} />
                </div>
                <div>
                  <h3 style={{ margin: 0 }}>{isBn ? viewingUser.name : viewingUser.nameEn}</h3>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                    ID: {viewingUser.id} • {viewingUser.email || viewingUser.phone}
                  </p>
                </div>
              </div>

              {/* Linked Parcels */}
              <div style={{ marginBottom: '1rem' }}>
                <h4 style={{ fontSize: '0.95rem', marginBottom: '0.4rem' }}>
                  {isBn ? 'স্বত্বাধিকারী জমি/প্লটসমূহ' : 'Owned Land Parcels'}
                </h4>
                {parcels.filter(p => p.owners.some(o => o.ownerId === viewingUser.id)).length === 0 ? (
                  <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{isBn ? 'কোনো জমি রেকর্ড পাওয়া যায়নি।' : 'No parcels owned.'}</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {parcels.filter(p => p.owners.some(o => o.ownerId === viewingUser.id)).map(p => (
                      <div key={p.id} style={{ background: '#f8fafc', padding: '0.5rem 0.75rem', borderRadius: '6px', fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between' }}>
                        <span><strong>{p.id}</strong> — {p.mouza} (দাগ: {p.dagNumber}, খতিয়ান: {p.khatianNumber})</span>
                        <Link to={`/land/${p.id}`} onClick={() => setViewingUser(null)} style={{ color: 'var(--color-primary)' }}>{isBn ? 'দেখুন' : 'View'}</Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Linked Applications */}
              <div style={{ marginBottom: '1rem' }}>
                <h4 style={{ fontSize: '0.95rem', marginBottom: '0.4rem' }}>
                  {isBn ? 'দাখিলকৃত আবেদনসমূহ' : 'Submitted Applications'}
                </h4>
                {applications.filter(a => a.applicantId === viewingUser.id).length === 0 ? (
                  <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{isBn ? 'কোনো আবেদন পাওয়া যায়নি।' : 'No applications found.'}</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {applications.filter(a => a.applicantId === viewingUser.id).map(a => (
                      <div key={a.id} style={{ background: '#f8fafc', padding: '0.5rem 0.75rem', borderRadius: '6px', fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between' }}>
                        <span><strong>{a.id}</strong> ({a.type}) — {a.parcelId}</span>
                        <StatusBadge status={a.status} />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Linked Family Members */}
              <div>
                <h4 style={{ fontSize: '0.95rem', marginBottom: '0.4rem' }}>
                  {isBn ? 'পারিবারিক সদস্য ও ওয়ারিশ' : 'Family Members & Heirs'}
                </h4>
                {familyMembers.filter(f => f.userId === viewingUser.id).length === 0 ? (
                  <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{isBn ? 'কোনো সদস্য রেকর্ড পাওয়া যায়নি।' : 'No family members recorded.'}</p>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                    {familyMembers.filter(f => f.userId === viewingUser.id).map(f => (
                      <span key={f.id} className="badge badge-muted" style={{ padding: '4px 8px' }}>
                        {f.name} ({f.relationLabel})
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="modal-actions-row mt-3">
                <button className="btn btn-primary" onClick={() => setViewingUser(null)}>
                  {isBn ? 'বন্ধ করুন' : 'Close'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Edit User Modal */}
      {editingUser && (
        <div className="review-modal-overlay" onClick={() => setEditingUser(null)}>
          <div className="review-modal-box" onClick={e => e.stopPropagation()}>
            <div className="review-modal-header">
              <h3>{isBn ? 'ব্যবহারকারী তথ্য সম্পাদন' : 'Edit User Profile'}: {editingUser.name}</h3>
              <button className="modal-close-btn" onClick={() => setEditingUser(null)}>×</button>
            </div>
            <div className="review-modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label>{isBn ? 'নাম (বাংলা)' : 'Name (Bangla)'}</label>
                  <input
                    type="text"
                    className="input-field"
                    value={editingUser.name}
                    onChange={e => setEditingUser({ ...editingUser, name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>{isBn ? 'নাম (ইংরেজি)' : 'Name (English)'}</label>
                  <input
                    type="text"
                    className="input-field"
                    value={editingUser.nameEn || ''}
                    onChange={e => setEditingUser({ ...editingUser, nameEn: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>{isBn ? 'ফোন নম্বর' : 'Phone'}</label>
                  <input
                    type="text"
                    className="input-field"
                    value={editingUser.phone}
                    onChange={e => setEditingUser({ ...editingUser, phone: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>{isBn ? 'ইমেইল' : 'Email'}</label>
                  <input
                    type="email"
                    className="input-field"
                    value={editingUser.email || ''}
                    onChange={e => setEditingUser({ ...editingUser, email: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>{isBn ? 'ভূমিকা (Role)' : 'Role'}</label>
                  <select
                    className="input-field"
                    value={editingUser.role}
                    onChange={e => setEditingUser({ ...editingUser, role: e.target.value as User['role'] })}
                  >
                    <option value="citizen">{isBn ? 'নাগরিক (Citizen)' : 'Citizen'}</option>
                    <option value="officer">{isBn ? 'কর্মকর্তা (Officer)' : 'Officer'}</option>
                    <option value="admin">{isBn ? 'অ্যাডমিন (Admin)' : 'Admin'}</option>
                    {currentUser.role === 'super_admin' && (
                      <option value="super_admin">{isBn ? 'সুপার অ্যাডমিন (Super Admin)' : 'Super Admin'}</option>
                    )}
                  </select>
                </div>
              </div>
              <div className="modal-actions-row mt-3">
                <button className="btn btn-outline" onClick={() => setEditingUser(null)}>
                  {t('common.cancel')}
                </button>
                <button className="btn btn-primary" onClick={handleUpdateUser}>
                  {isBn ? 'পরিবর্তন সংরক্ষণ করুন' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Create Parcel Modal */}
      {showCreateParcel && (
        <div className="review-modal-overlay" onClick={() => setShowCreateParcel(false)}>
          <div className="review-modal-box" onClick={e => e.stopPropagation()}>
            <div className="review-modal-header">
              <h3>{isBn ? 'নতুন জমি/প্লট রেকর্ড যোগ করুন' : 'Add New Land Parcel Record'}</h3>
              <button className="modal-close-btn" onClick={() => setShowCreateParcel(false)}>×</button>
            </div>
            <div className="review-modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label>{isBn ? 'বিভাগ' : 'Division'}</label>
                  <input
                    type="text"
                    className="input-field"
                    value={newParcelForm.division}
                    onChange={e => setNewParcelForm({ ...newParcelForm, division: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>{isBn ? 'জেলা' : 'District'}</label>
                  <input
                    type="text"
                    className="input-field"
                    value={newParcelForm.district}
                    onChange={e => setNewParcelForm({ ...newParcelForm, district: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>{isBn ? 'উপজেলা' : 'Upazila'}</label>
                  <input
                    type="text"
                    className="input-field"
                    value={newParcelForm.upazila}
                    onChange={e => setNewParcelForm({ ...newParcelForm, upazila: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>{isBn ? 'মৌজা' : 'Mouza'}</label>
                  <input
                    type="text"
                    className="input-field"
                    value={newParcelForm.mouza}
                    onChange={e => setNewParcelForm({ ...newParcelForm, mouza: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>{isBn ? 'সার্ভে ধরন' : 'Survey Type'}</label>
                  <select
                    className="input-field"
                    value={newParcelForm.surveyType}
                    onChange={e => setNewParcelForm({ ...newParcelForm, surveyType: e.target.value as LandParcel['surveyType'] })}
                  >
                    <option value="CS">CS</option>
                    <option value="SA">SA</option>
                    <option value="RS">RS</option>
                    <option value="BS">BS</option>
                    <option value="BRS">BRS</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>{t('search.dagNumber')} *</label>
                  <input
                    type="text"
                    className="input-field"
                    value={newParcelForm.dagNumber}
                    onChange={e => setNewParcelForm({ ...newParcelForm, dagNumber: e.target.value })}
                    placeholder="যেমন: ৪৫০"
                  />
                </div>
                <div className="form-group">
                  <label>{t('search.khatianNumber')} *</label>
                  <input
                    type="text"
                    className="input-field"
                    value={newParcelForm.khatianNumber}
                    onChange={e => setNewParcelForm({ ...newParcelForm, khatianNumber: e.target.value })}
                    placeholder="যেমন: ৭৮৯"
                  />
                </div>
                <div className="form-group">
                  <label>{t('land.area')} (শতক) *</label>
                  <input
                    type="number"
                    className="input-field"
                    value={newParcelForm.totalAreaDecimal}
                    onChange={e => setNewParcelForm({ ...newParcelForm, totalAreaDecimal: Number(e.target.value), ownerShare: Number(e.target.value) })}
                    min={1}
                  />
                </div>
                <div className="form-group">
                  <label>{isBn ? 'প্রধান মালিকের নাম' : 'Owner Name'}</label>
                  <input
                    type="text"
                    className="input-field"
                    value={newParcelForm.ownerName}
                    onChange={e => setNewParcelForm({ ...newParcelForm, ownerName: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-actions-row mt-3">
                <button className="btn btn-outline" onClick={() => setShowCreateParcel(false)}>
                  {t('common.cancel')}
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleCreateParcel}
                  disabled={!newParcelForm.dagNumber.trim() || !newParcelForm.khatianNumber.trim()}
                >
                  {isBn ? 'সংরক্ষণ করুন' : 'Add Parcel'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Edit Parcel Modal */}
      {editingParcel && (
        <div className="review-modal-overlay" onClick={() => setEditingParcel(null)}>
          <div className="review-modal-box" onClick={e => e.stopPropagation()}>
            <div className="review-modal-header">
              <h3>{isBn ? 'জমি রেকর্ড সম্পাদন' : 'Edit Parcel'}: {editingParcel.id}</h3>
              <button className="modal-close-btn" onClick={() => setEditingParcel(null)}>×</button>
            </div>
            <div className="review-modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label>{isBn ? 'মৌজা' : 'Mouza'}</label>
                  <input
                    type="text"
                    className="input-field"
                    value={editingParcel.mouza}
                    onChange={e => setEditingParcel({ ...editingParcel, mouza: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>{isBn ? 'উপজেলা' : 'Upazila'}</label>
                  <input
                    type="text"
                    className="input-field"
                    value={editingParcel.upazila}
                    onChange={e => setEditingParcel({ ...editingParcel, upazila: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>{t('search.dagNumber')}</label>
                  <input
                    type="text"
                    className="input-field"
                    value={editingParcel.dagNumber}
                    onChange={e => setEditingParcel({ ...editingParcel, dagNumber: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>{t('search.khatianNumber')}</label>
                  <input
                    type="text"
                    className="input-field"
                    value={editingParcel.khatianNumber}
                    onChange={e => setEditingParcel({ ...editingParcel, khatianNumber: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>{t('land.area')} (শতক)</label>
                  <input
                    type="number"
                    className="input-field"
                    value={editingParcel.totalAreaDecimal}
                    onChange={e => setEditingParcel({ ...editingParcel, totalAreaDecimal: Number(e.target.value) })}
                  />
                </div>
                <div className="form-group">
                  <label>{isBn ? 'জমির শ্রেণি' : 'Land Type'}</label>
                  <input
                    type="text"
                    className="input-field"
                    value={editingParcel.landType}
                    onChange={e => setEditingParcel({ ...editingParcel, landType: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-actions-row mt-3">
                <button className="btn btn-outline" onClick={() => setEditingParcel(null)}>
                  {t('common.cancel')}
                </button>
                <button className="btn btn-primary" onClick={handleUpdateParcel}>
                  {isBn ? 'সংরক্ষণ করুন' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. Subdivide Parcel Modal */}
      {showSubdivideModal && (
        <div className="review-modal-overlay" onClick={() => setShowSubdivideModal(null)}>
          <div className="review-modal-box" onClick={e => e.stopPropagation()}>
            <div className="review-modal-header">
              <h3>{isBn ? 'প্লট সীমানা বিভাজন (Subdivision)' : 'Cadastral Plot Subdivision'}</h3>
              <button className="modal-close-btn" onClick={() => setShowSubdivideModal(null)}>×</button>
            </div>
            <div className="review-modal-body">
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
                {isBn
                  ? `মূল পার্সেল ${showSubdivideModal.id} (দাগ: ${showSubdivideModal.dagNumber}, মোট জমি: ${showSubdivideModal.totalAreaDecimal} শতক) কে দুটি উপ-প্লটে বিভক্ত করা হচ্ছে।`
                  : `Splitting parcel ${showSubdivideModal.id} (${showSubdivideModal.totalAreaDecimal} decimal) into two child plots.`}
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: '#f8fafc', padding: '1rem', borderRadius: '8px' }}>
                <div>
                  <h4 style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>উপ-প্লট ১ (Plot A)</h4>
                  <div className="form-group mb-2">
                    <label style={{ fontSize: '0.75rem' }}>দাগ নং</label>
                    <input
                      type="text"
                      className="input-field"
                      value={subdivideForm.part1Dag}
                      onChange={e => setSubdivideForm({ ...subdivideForm, part1Dag: e.target.value })}
                    />
                  </div>
                  <div className="form-group mb-2">
                    <label style={{ fontSize: '0.75rem' }}>জমির পরিমাণ (শতক)</label>
                    <input
                      type="number"
                      className="input-field"
                      value={subdivideForm.part1Area}
                      onChange={e => setSubdivideForm({ ...subdivideForm, part1Area: Number(e.target.value) })}
                    />
                  </div>
                  <div className="form-group">
                    <label style={{ fontSize: '0.75rem' }}>মালিকের নাম</label>
                    <input
                      type="text"
                      className="input-field"
                      value={subdivideForm.part1Owner}
                      onChange={e => setSubdivideForm({ ...subdivideForm, part1Owner: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <h4 style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>উপ-প্লট ২ (Plot B)</h4>
                  <div className="form-group mb-2">
                    <label style={{ fontSize: '0.75rem' }}>দাগ নং</label>
                    <input
                      type="text"
                      className="input-field"
                      value={subdivideForm.part2Dag}
                      onChange={e => setSubdivideForm({ ...subdivideForm, part2Dag: e.target.value })}
                    />
                  </div>
                  <div className="form-group mb-2">
                    <label style={{ fontSize: '0.75rem' }}>জমির পরিমাণ (শতক)</label>
                    <input
                      type="number"
                      className="input-field"
                      value={subdivideForm.part2Area}
                      onChange={e => setSubdivideForm({ ...subdivideForm, part2Area: Number(e.target.value) })}
                    />
                  </div>
                  <div className="form-group">
                    <label style={{ fontSize: '0.75rem' }}>মালিকের নাম</label>
                    <input
                      type="text"
                      className="input-field"
                      value={subdivideForm.part2Owner}
                      onChange={e => setSubdivideForm({ ...subdivideForm, part2Owner: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-actions-row mt-3">
                <button className="btn btn-outline" onClick={() => setShowSubdivideModal(null)}>
                  {t('common.cancel')}
                </button>
                <button className="btn btn-primary" onClick={handleSubdivideParcel}>
                  {isBn ? 'বিভাজন সম্পন্ন করুন' : 'Confirm Subdivision'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. Register / Add Reference Deed Modal */}
      {showRegisterDoc && (
        <div className="review-modal-overlay" onClick={() => setShowRegisterDoc(false)}>
          <div className="review-modal-box" style={{ maxWidth: '680px' }} onClick={e => e.stopPropagation()}>
            <div className="review-modal-header">
              <h3>{isBn ? 'রেফারেন্স দলিল লাইব্রেরিতে নথি যুক্ত করুন' : 'Add Document to Reference Deed Library'}</h3>
              <button className="modal-close-btn" onClick={() => setShowRegisterDoc(false)}>×</button>
            </div>
            <div className="review-modal-body">
              {/* File Upload Box */}
              <div className="form-group mb-3">
                <label>{isBn ? 'রেফারেন্স দলিল ফাইল আপলোড (PDF, JPG, PNG) *' : 'Upload Reference File (PDF/Image) *'}</label>
                <div className="upload-area-sm" onClick={() => fileRef.current?.click()} style={{ padding: '1rem', cursor: 'pointer', textAlign: 'center', border: '2px dashed var(--color-primary)', borderRadius: '8px' }}>
                  <Upload size={24} style={{ color: 'var(--color-primary)', margin: '0 auto 0.25rem' }} />
                  <span style={{ display: 'block', fontWeight: 600 }}>
                    {regFile ? regFile.name : (isBn ? 'ফাইল নির্বাচন করুন (স্বয়ংক্রিয় SHA-256 গণনা হবে)' : 'Select file to compute SHA-256')}
                  </span>
                  <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.txt" onChange={handleRegFileSelect} hidden />
                </div>
                {regHash && (
                  <div className="hash-display mt-2" style={{ background: '#f1f5f9', padding: '0.5rem', borderRadius: '6px', fontSize: '0.8rem' }}>
                    <span className="hash-label">SHA-256 Hash: </span>
                    <code style={{ wordBreak: 'break-all', color: 'var(--color-primary)' }}>{regHash}</code>
                  </div>
                )}
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>{isBn ? 'দলিল নম্বর *' : 'Deed Number *'}</label>
                  <input
                    type="text"
                    className="input-field"
                    value={regDocForm.deedNumber}
                    onChange={e => setRegDocForm({ ...regDocForm, deedNumber: e.target.value })}
                    placeholder="DEED-2025-001"
                  />
                </div>
                <div className="form-group">
                  <label>{isBn ? 'রেজিস্ট্রেশনের তারিখ' : 'Registration Date'}</label>
                  <input
                    type="date"
                    className="input-field"
                    value={regDocForm.registrationDate}
                    onChange={e => setRegDocForm({ ...regDocForm, registrationDate: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>{isBn ? 'মৌজা' : 'Mouza'}</label>
                  <input
                    type="text"
                    className="input-field"
                    value={regDocForm.mouza}
                    onChange={e => setRegDocForm({ ...regDocForm, mouza: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>{isBn ? 'উপজেলা' : 'Upazila'}</label>
                  <input
                    type="text"
                    className="input-field"
                    value={regDocForm.upazila}
                    onChange={e => setRegDocForm({ ...regDocForm, upazila: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>{isBn ? 'দাগ নম্বর' : 'Dag No'}</label>
                  <input
                    type="text"
                    className="input-field"
                    value={regDocForm.dagNumber}
                    onChange={e => setRegDocForm({ ...regDocForm, dagNumber: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>{isBn ? 'খতিয়ান নম্বর' : 'Khatian No'}</label>
                  <input
                    type="text"
                    className="input-field"
                    value={regDocForm.khatianNumber}
                    onChange={e => setRegDocForm({ ...regDocForm, khatianNumber: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>{isBn ? 'জমির পরিমাণ (শতক)' : 'Land Area'}</label>
                  <input
                    type="number"
                    className="input-field"
                    value={regDocForm.landAreaDecimal}
                    onChange={e => setRegDocForm({ ...regDocForm, landAreaDecimal: Number(e.target.value) })}
                  />
                </div>
                <div className="form-group">
                  <label>{isBn ? 'রেফারেন্সের ধরন' : 'Source Type'}</label>
                  <select
                    className="input-field"
                    value={regDocForm.sourceType}
                    onChange={e => setRegDocForm({ ...regDocForm, sourceType: e.target.value as RegisteredDocument['sourceType'] })}
                  >
                    <option value="authorized_sample">{isBn ? 'অনুমোদিত নমুনা দলিল' : 'Authorized Sample'}</option>
                    <option value="synthetic_demo">{isBn ? 'সিন্থেটিক ডেমো দলিল' : 'Synthetic Demo'}</option>
                    <option value="public_reference">{isBn ? 'পাবলিক রেফারেন্স' : 'Public Reference'}</option>
                  </select>
                </div>
              </div>

              <div className="form-group mt-2">
                <label>{isBn ? 'সংশ্লিষ্ট পক্ষসমূহ (দাতার নাম → গ্রহীতার নাম)' : 'Parties'}</label>
                <input
                  type="text"
                  className="input-field"
                  value={regDocForm.parties}
                  onChange={e => setRegDocForm({ ...regDocForm, parties: e.target.value })}
                  placeholder="আবদুল করিম → জহির উদ্দিন"
                />
              </div>

              <div className="modal-actions-row mt-3">
                <button className="btn btn-outline" onClick={() => setShowRegisterDoc(false)}>
                  {t('common.cancel')}
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleRegisterDoc}
                  disabled={!regDocForm.deedNumber.trim()}
                >
                  {isBn ? 'সংরক্ষণ ও লাইব্রেরিতে যুক্ত করুন' : 'Save Reference Deed'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 8. Verification Submission Review Modal */}
      {reviewingSubmission && (
        <div className="review-modal-overlay" onClick={() => setReviewingSubmission(null)}>
          <div className="review-modal-box" style={{ maxWidth: '750px' }} onClick={e => e.stopPropagation()}>
            <div className="review-modal-header">
              <h3>{isBn ? 'দলিল যাচাই ফলাফল অডিট ও প্রশাসনিক রিভিউ' : 'Deed Verification Review & Audit'}: {reviewingSubmission.id}</h3>
              <button className="modal-close-btn" onClick={() => setReviewingSubmission(null)}>×</button>
            </div>
            <div className="review-modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', background: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem' }}>
                <div><strong>{isBn ? 'নাগরিক:' : 'Citizen:'}</strong> {reviewingSubmission.userName || 'আবদুল করিম'}</div>
                <div>
                  <strong>{isBn ? 'মূল ফাইল:' : 'File:'}</strong> {reviewingSubmission.originalFileName}
                  <span style={{ marginLeft: '0.4rem', display: 'inline-flex', gap: '0.25rem' }}>
                    <button
                      className="btn-table-action"
                      title={isBn ? 'সংরক্ষিত মূল দলিল ডাউনলোড' : 'Download Document'}
                      onClick={async () => {
                        const blob = await getStoredDocumentBlob(reviewingSubmission.id, reviewingSubmission.fileHash);
                        if (blob) downloadBlob(blob, reviewingSubmission.originalFileName);
                        else alert(isBn ? 'সংরক্ষিত ফাইল পাওয়া যায়নি' : 'Stored document file not found');
                      }}
                      style={{ padding: '2px 6px', fontSize: '0.72rem' }}
                    >
                      <Download size={12} />
                    </button>
                    <button
                      className="btn-table-action"
                      title={isBn ? 'মূল দলিল প্রিভিউ' : 'Preview Document'}
                      onClick={async () => {
                        const blob = await getStoredDocumentBlob(reviewingSubmission.id, reviewingSubmission.fileHash);
                        if (blob) previewBlob(blob);
                        else alert(isBn ? 'সংরক্ষিত ফাইল পাওয়া যায়নি' : 'Stored document file not found');
                      }}
                      style={{ padding: '2px 6px', fontSize: '0.72rem' }}
                    >
                      <Eye size={12} />
                    </button>
                  </span>
                </div>
                <div><strong>{isBn ? 'যাচাই অবস্থা:' : 'Status:'}</strong> <span className="badge badge-success">{reviewingSubmission.status}</span></div>
                <div><strong>{isBn ? 'ওসিআর অবস্থা:' : 'OCR:'}</strong> {reviewingSubmission.ocrStatus}</div>
              </div>

              {/* Hash comparison */}
              <div style={{ background: '#f1f5f9', padding: '0.5rem 0.75rem', borderRadius: '6px', fontSize: '0.78rem', marginBottom: '1rem' }}>
                <div><strong>আপলোডকৃত SHA-256:</strong> <code>{reviewingSubmission.fileHash || '—'}</code></div>
              </div>

              {/* Field comparison table */}
              <div style={{ marginBottom: '1rem', overflowX: 'auto' }}>
                <h4 style={{ fontSize: '0.9rem', marginBottom: '0.4rem' }}>{isBn ? 'তথ্যগত ফিল্ড তুলনা:' : 'Field Comparisons:'}</h4>
                <table className="portal-table" style={{ fontSize: '0.85rem' }}>
                  <thead>
                    <tr>
                      <th>ফিল্ড</th>
                      <th>আপলোড হতে প্রাপ্ত</th>
                      <th>রেফারেন্সে রক্ষিত</th>
                      <th>ফলাফল</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reviewingSubmission.fieldComparisons?.map((fc, i) => (
                      <tr key={i}>
                        <td><strong>{fc.fieldLabelBn}</strong></td>
                        <td>{fc.uploadedValue}</td>
                        <td>{fc.referenceValue}</td>
                        <td>
                          <span className={`badge ${fc.status === 'match' ? 'badge-success' : fc.status === 'mismatch' ? 'badge-danger' : 'badge-warning'}`}>
                            {fc.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Review decisions */}
              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
                <h4 style={{ fontSize: '0.9rem', marginBottom: '0.4rem' }}>{isBn ? 'প্রশাসনিক সিদ্ধান্ত ও মন্তব্য:' : 'Admin Decision:'}</h4>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button 
                    className="btn btn-primary-sm"
                    onClick={() => handleSaveSubmissionReview('reviewed', 'যাচাই তথ্য সঠিক পাওয়া গেছে')}
                  >
                    <CheckCircle2 size={14} /> {isBn ? 'অনুমোদিত ও পর্যালোচিত (Reviewed)' : 'Mark Reviewed'}
                  </button>
                  <button 
                    className="btn btn-outline-sm text-danger"
                    onClick={() => handleSaveSubmissionReview('unable_to_conclude', 'অস্পষ্ট বা গরমিল তথ্যের কারণে অসম্পূর্ণ')}
                  >
                    <AlertTriangle size={14} /> {isBn ? 'অমীমাংসিত (Unable to Conclude)' : 'Unable to Conclude'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 9. Application Review & Status Override Modal */}
      {reviewingApp && (
        <div className="review-modal-overlay" onClick={() => setReviewingApp(null)}>
          <div className="review-modal-box" onClick={e => e.stopPropagation()}>
            <div className="review-modal-header">
              <h3>{isBn ? 'আবেদন পর্যালোচনা ও সিদ্ধান্ত' : 'Application Review'}: {reviewingApp.id}</h3>
              <button className="modal-close-btn" onClick={() => setReviewingApp(null)}>×</button>
            </div>
            <div className="review-modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', background: '#f8fafc', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem' }}>
                <div><strong>আবেদনকারী:</strong> {reviewingApp.applicantName}</div>
                <div><strong>পার্সেল:</strong> {reviewingApp.parcelId}</div>
                <div><strong>ধরন:</strong> {reviewingApp.type}</div>
                <div><strong>বর্তমান অবস্থা:</strong> <StatusBadge status={reviewingApp.status} /></div>
              </div>

              <div className="modal-actions-row">
                <button 
                  className="btn btn-primary"
                  style={{ background: '#10b981', borderColor: '#10b981' }}
                  onClick={() => handleAppDecision('approved', 'প্রশাসনিকভাবে অনুমোদিত')}
                >
                  {isBn ? 'অনুমোদন করুন (Approve)' : 'Approve'}
                </button>
                <button 
                  className="btn btn-outline"
                  onClick={() => handleAppDecision('more_documents_required', 'অতিরিক্ত নথি তলব করা হয়েছে')}
                >
                  {isBn ? 'কাগজপত্র ফেরত তলব' : 'More Docs'}
                </button>
                <button 
                  className="btn btn-outline text-danger"
                  onClick={() => handleAppDecision('rejected', 'প্রশাসনিকভাবে প্রত্যাখ্যাত')}
                >
                  {isBn ? 'প্রত্যাখ্যান (Reject)' : 'Reject'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 10. Add Family Member Modal */}
      {showAddFamily && (
        <div className="review-modal-overlay" onClick={() => setShowAddFamily(false)}>
          <div className="review-modal-box" onClick={e => e.stopPropagation()}>
            <div className="review-modal-header">
              <h3>{isBn ? 'পারিবারিক সদস্য যোগ করুন' : 'Add Family Relationship'}</h3>
              <button className="modal-close-btn" onClick={() => setShowAddFamily(false)}>×</button>
            </div>
            <div className="review-modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label>{isBn ? 'প্রধান ব্যবহারকারী' : 'User'} *</label>
                  <select
                    className="input-field"
                    value={newFamilyForm.userId}
                    onChange={e => setNewFamilyForm({ ...newFamilyForm, userId: e.target.value })}
                  >
                    <option value="">{isBn ? 'ব্যবহারকারী নির্বাচন করুন' : 'Select User'}</option>
                    {citizenUsers.map(u => (
                      <option key={u.id} value={u.id}>{isBn ? u.name : u.nameEn} ({u.phone})</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>{isBn ? 'সদস্যের নাম' : 'Family Member Name'} *</label>
                  <input
                    type="text"
                    className="input-field"
                    value={newFamilyForm.name}
                    onChange={e => setNewFamilyForm({ ...newFamilyForm, name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>{isBn ? 'সম্পর্ক' : 'Relationship'}</label>
                  <select
                    className="input-field"
                    value={newFamilyForm.relation}
                    onChange={e => {
                      const rel = e.target.value as FamilyMember['relation'];
                      const labels: Record<string, string> = { son: 'পুত্র', daughter: 'কন্যা', spouse: 'স্ত্রী/স্বামী', father: 'পিতা', mother: 'মাতা' };
                      setNewFamilyForm({ ...newFamilyForm, relation: rel, relationLabel: labels[rel] || rel });
                    }}
                  >
                    <option value="son">{isBn ? 'পুত্র' : 'Son'}</option>
                    <option value="daughter">{isBn ? 'কন্যা' : 'Daughter'}</option>
                    <option value="spouse">{isBn ? 'স্ত্রী/স্বামী' : 'Spouse'}</option>
                    <option value="father">{isBn ? 'পিতা' : 'Father'}</option>
                    <option value="mother">{isBn ? 'মাতা' : 'Mother'}</option>
                  </select>
                </div>
                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1.8rem' }}>
                    <input
                      type="checkbox"
                      checked={newFamilyForm.isDeceased}
                      onChange={e => setNewFamilyForm({ ...newFamilyForm, isDeceased: e.target.checked })}
                    />
                    <span>{isBn ? 'সদস্য মৃত (উত্তরাধিকার দাবির জন্য)' : 'Deceased (for inheritance)'}</span>
                  </label>
                </div>
              </div>
              <div className="modal-actions-row mt-3">
                <button className="btn btn-outline" onClick={() => setShowAddFamily(false)}>
                  {t('common.cancel')}
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleAddFamily}
                  disabled={!newFamilyForm.userId || !newFamilyForm.name.trim()}
                >
                  {isBn ? 'সংরক্ষণ' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 11. Add Inheritance Claim Modal */}
      {showAddInheritance && (
        <div className="review-modal-overlay" onClick={() => setShowAddInheritance(false)}>
          <div className="review-modal-box" onClick={e => e.stopPropagation()}>
            <div className="review-modal-header">
              <h3>{isBn ? 'উত্তরাধিকার দাবি ও অংশ লিঙ্ক করুন' : 'Link Inheritance Claim'}</h3>
              <button className="modal-close-btn" onClick={() => setShowAddInheritance(false)}>×</button>
            </div>
            <div className="review-modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label>{isBn ? 'দাবিদার ওয়ারিশ (নাগরিক)' : 'Heir User'} *</label>
                  <select
                    className="input-field"
                    value={newInhForm.heirUserId}
                    onChange={e => setNewInhForm({ ...newInhForm, heirUserId: e.target.value })}
                  >
                    <option value="">{isBn ? 'নাগরিক নির্বাচন করুন' : 'Select Citizen'}</option>
                    {citizenUsers.map(u => (
                      <option key={u.id} value={u.id}>{isBn ? u.name : u.nameEn}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>{isBn ? 'মৃত ব্যক্তি (যার সূত্রে প্রাপ্য)' : 'Deceased Person'} *</label>
                  <select
                    className="input-field"
                    value={newInhForm.deceasedMemberId}
                    onChange={e => setNewInhForm({ ...newInhForm, deceasedMemberId: e.target.value })}
                  >
                    <option value="">{isBn ? 'মৃত ব্যক্তি নির্বাচন করুন' : 'Select Deceased'}</option>
                    {deceasedMembers.map(dm => (
                      <option key={dm.id} value={dm.id}>{dm.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>{isBn ? 'সংশ্লিষ্ট জমি রেকর্ড' : 'Parcel'} *</label>
                  <select
                    className="input-field"
                    value={newInhForm.parcelId}
                    onChange={e => setNewInhForm({ ...newInhForm, parcelId: e.target.value })}
                  >
                    <option value="">{isBn ? 'জমি নির্বাচন করুন' : 'Select Parcel'}</option>
                    {parcels.map(p => (
                      <option key={p.id} value={p.id}>{p.id} — {p.mouza} (দাগ: {p.dagNumber})</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>{isBn ? 'দাবিকৃত অংশ (শতক)' : 'Claimed Share (Decimal)'}</label>
                  <input
                    type="number"
                    className="input-field"
                    value={newInhForm.claimedShare}
                    onChange={e => setNewInhForm({ ...newInhForm, claimedShare: Number(e.target.value) })}
                    min={0.5}
                    step={0.5}
                  />
                </div>
              </div>
              <div className="modal-actions-row mt-3">
                <button className="btn btn-outline" onClick={() => setShowAddInheritance(false)}>
                  {t('common.cancel')}
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleAddInheritance}
                  disabled={!newInhForm.heirUserId || !newInhForm.deceasedMemberId || !newInhForm.parcelId}
                >
                  {isBn ? 'লিঙ্ক সম্পন্ন করুন' : 'Link Claim'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 12. Safe Deletion Confirmation Dialog */}
      <ConfirmDialog
        open={deleteConfirm.open}
        title={isBn ? 'রেকর্ড মুছে ফেলা নিশ্চিতকরণ' : 'Confirm Record Deletion'}
        message={
          <div>
            <p>{isBn ? `আপনি কি নিশ্চিতভাবে "${deleteConfirm.name}" রেকর্ডটি মুছে ফেলতে চান?` : `Are you sure you want to delete "${deleteConfirm.name}"?`}</p>
            {deleteConfirm.warningMessage && (
              <div style={{ marginTop: '0.75rem', padding: '0.5rem 0.75rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', color: '#b91c1c', fontSize: '0.85rem' }}>
                <AlertCircle size={16} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                {deleteConfirm.warningMessage}
              </div>
            )}
          </div>
        }
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteConfirm({ open: false, type: 'user', id: '', name: '' })}
      />

      {/* 13. System Reset Confirmation Dialog */}
      <ConfirmDialog
        open={showResetConfirm}
        title={t('admin.resetData')}
        message={t('admin.resetConfirm')}
        variant="danger"
        onConfirm={handleReset}
        onCancel={() => setShowResetConfirm(false)}
      />
    </div>
  );
}
