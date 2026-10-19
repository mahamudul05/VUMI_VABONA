// ============================================================
// App Context — State management for ভূমি ভাবনা
// ============================================================
import React, { createContext, useContext, useReducer, useEffect, useCallback, type ReactNode } from 'react';
import type {
  User, Language, LandParcel, RegisteredDocument,
  MutationApplication, AuditEntry, Notification,
  ApplicationStatus, OfficerNote, StatusChange,
  FamilyMember, InheritanceClaim, VerificationSubmission,
} from '../types';
import {
  demoUsers, seedParcels, seedRegisteredDocuments,
  seedApplications, seedAuditLog, seedNotifications,
  seedFamilyMembers, seedInheritanceClaims, seedVerificationSubmissions,
} from '../data/seedData';
import translations from '../data/translations';
import { generateId } from '../utils';

// ── State Shape ─────────────────────────────────────
interface AppState {
  language: Language;
  currentUser: User | null;
  parcels: LandParcel[];
  registeredDocuments: RegisteredDocument[];
  applications: MutationApplication[];
  auditLog: AuditEntry[];
  notifications: Notification[];
  users: User[];
  familyMembers: FamilyMember[];
  inheritanceClaims: InheritanceClaim[];
  verificationSubmissions: VerificationSubmission[];
}

const initialState: AppState = {
  language: 'bn',
  currentUser: null,
  parcels: seedParcels,
  registeredDocuments: seedRegisteredDocuments,
  applications: seedApplications,
  auditLog: seedAuditLog,
  notifications: seedNotifications,
  users: demoUsers,
  familyMembers: seedFamilyMembers,
  inheritanceClaims: seedInheritanceClaims,
  verificationSubmissions: seedVerificationSubmissions,
};

// ── Actions ─────────────────────────────────────────
type Action =
  | { type: 'SET_LANGUAGE'; payload: Language }
  | { type: 'LOGIN'; payload: User }
  | { type: 'LOGOUT' }
  | { type: 'ADD_APPLICATION'; payload: MutationApplication }
  | { type: 'UPDATE_APPLICATION_STATUS'; payload: { id: string; status: ApplicationStatus; changedBy: string; reason?: string } }
  | { type: 'ADD_OFFICER_NOTE'; payload: { applicationId: string; note: OfficerNote } }
  | { type: 'ADD_DOCUMENT_TO_APP'; payload: { applicationId: string; doc: MutationApplication['uploadedDocuments'][0] } }
  | { type: 'REGISTER_DOCUMENT'; payload: RegisteredDocument }
  | { type: 'UPDATE_DOCUMENT'; payload: RegisteredDocument }
  | { type: 'REMOVE_DOCUMENT'; payload: string }
  | { type: 'ADD_AUDIT'; payload: AuditEntry }
  | { type: 'ADD_NOTIFICATION'; payload: Notification }
  | { type: 'MARK_NOTIFICATION_READ'; payload: string }
  | { type: 'ADD_PARCEL'; payload: LandParcel }
  | { type: 'UPDATE_PARCEL'; payload: LandParcel }
  | { type: 'DELETE_PARCEL'; payload: string }
  | { type: 'ADD_USER'; payload: User }
  | { type: 'UPDATE_USER'; payload: User }
  | { type: 'DELETE_USER'; payload: string }
  | { type: 'ADD_FAMILY_MEMBER'; payload: FamilyMember }
  | { type: 'UPDATE_FAMILY_MEMBER'; payload: FamilyMember }
  | { type: 'REMOVE_FAMILY_MEMBER'; payload: string }
  | { type: 'ADD_INHERITANCE_CLAIM'; payload: InheritanceClaim }
  | { type: 'UPDATE_INHERITANCE_CLAIM'; payload: InheritanceClaim }
  | { type: 'REMOVE_INHERITANCE_CLAIM'; payload: string }
  | { type: 'UPDATE_APPLICATION'; payload: MutationApplication }
  | { type: 'ADD_VERIFICATION_SUBMISSION'; payload: VerificationSubmission }
  | { type: 'UPDATE_VERIFICATION_SUBMISSION'; payload: VerificationSubmission }
  | { type: 'DELETE_VERIFICATION_SUBMISSION'; payload: string }
  | { type: 'RESET_DATA' }
  | { type: 'LOAD_STATE'; payload: Partial<AppState> };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_LANGUAGE':
      return { ...state, language: action.payload };
    case 'LOGIN':
      return { ...state, currentUser: action.payload };
    case 'LOGOUT':
      return { ...state, currentUser: null };
    case 'ADD_APPLICATION':
      return { ...state, applications: [...state.applications, action.payload] };
    case 'UPDATE_APPLICATION':
      return {
        ...state,
        applications: state.applications.map(a => a.id === action.payload.id ? action.payload : a),
      };
    case 'UPDATE_APPLICATION_STATUS': {
      const { id, status, changedBy, reason } = action.payload;
      const statusChange: StatusChange = {
        status,
        changedBy,
        changedAt: new Date().toISOString(),
        reason,
      };
      return {
        ...state,
        applications: state.applications.map(app =>
          app.id === id
            ? { ...app, status, statusHistory: [...app.statusHistory, statusChange], updatedAt: new Date().toISOString() }
            : app
        ),
      };
    }
    case 'ADD_OFFICER_NOTE': {
      const { applicationId, note } = action.payload;
      return {
        ...state,
        applications: state.applications.map(app =>
          app.id === applicationId
            ? { ...app, officerNotes: [...app.officerNotes, note], updatedAt: new Date().toISOString() }
            : app
        ),
      };
    }
    case 'ADD_DOCUMENT_TO_APP': {
      const { applicationId, doc } = action.payload;
      return {
        ...state,
        applications: state.applications.map(app =>
          app.id === applicationId
            ? { ...app, uploadedDocuments: [...app.uploadedDocuments, doc], updatedAt: new Date().toISOString() }
            : app
        ),
      };
    }
    case 'REGISTER_DOCUMENT':
      return { ...state, registeredDocuments: [...state.registeredDocuments, action.payload] };
    case 'UPDATE_DOCUMENT':
      return {
        ...state,
        registeredDocuments: state.registeredDocuments.map(d => d.id === action.payload.id ? action.payload : d),
      };
    case 'REMOVE_DOCUMENT':
      return { ...state, registeredDocuments: state.registeredDocuments.filter(d => d.id !== action.payload) };
    case 'ADD_AUDIT':
      return { ...state, auditLog: [...state.auditLog, action.payload] };
    case 'ADD_NOTIFICATION':
      return { ...state, notifications: [...state.notifications, action.payload] };
    case 'MARK_NOTIFICATION_READ':
      return {
        ...state,
        notifications: state.notifications.map(n =>
          n.id === action.payload ? { ...n, read: true } : n
        ),
      };
    case 'ADD_PARCEL':
      return { ...state, parcels: [...state.parcels, action.payload] };
    case 'UPDATE_PARCEL':
      return {
        ...state,
        parcels: state.parcels.map(p => p.id === action.payload.id ? action.payload : p),
      };
    case 'DELETE_PARCEL':
      return { ...state, parcels: state.parcels.filter(p => p.id !== action.payload) };
    case 'ADD_USER':
      return { ...state, users: [...state.users, action.payload] };
    case 'UPDATE_USER':
      return {
        ...state,
        users: state.users.map(u => u.id === action.payload.id ? action.payload : u),
      };
    case 'DELETE_USER':
      return {
        ...state,
        users: state.users.filter(u => u.id !== action.payload),
      };
    case 'ADD_FAMILY_MEMBER':
      return { ...state, familyMembers: [...state.familyMembers, action.payload] };
    case 'UPDATE_FAMILY_MEMBER':
      return {
        ...state,
        familyMembers: state.familyMembers.map(f => f.id === action.payload.id ? action.payload : f),
      };
    case 'REMOVE_FAMILY_MEMBER':
      return { ...state, familyMembers: state.familyMembers.filter(f => f.id !== action.payload) };
    case 'ADD_INHERITANCE_CLAIM':
      return { ...state, inheritanceClaims: [...state.inheritanceClaims, action.payload] };
    case 'UPDATE_INHERITANCE_CLAIM':
      return {
        ...state,
        inheritanceClaims: state.inheritanceClaims.map(c => c.id === action.payload.id ? action.payload : c),
      };
    case 'REMOVE_INHERITANCE_CLAIM':
      return { ...state, inheritanceClaims: state.inheritanceClaims.filter(c => c.id !== action.payload) };
    case 'ADD_VERIFICATION_SUBMISSION':
      return {
        ...state,
        verificationSubmissions: [action.payload, ...state.verificationSubmissions],
      };
    case 'UPDATE_VERIFICATION_SUBMISSION':
      return {
        ...state,
        verificationSubmissions: state.verificationSubmissions.map(s => s.id === action.payload.id ? action.payload : s),
      };
    case 'DELETE_VERIFICATION_SUBMISSION':
      return {
        ...state,
        verificationSubmissions: state.verificationSubmissions.filter(s => s.id !== action.payload),
      };
    case 'RESET_DATA':
      localStorage.removeItem('vumi-state');
      return { ...initialState };
    case 'LOAD_STATE':
      return { ...state, ...action.payload };
    default:
      return state;
  }
}

// ── Context ─────────────────────────────────────────
interface AppContextType extends AppState {
  dispatch: React.Dispatch<Action>;
  t: (key: string) => string;
  addAudit: (action: string, actionEn: string, targetType: string, targetId: string, details: string) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Load persisted state on mount and guarantee Super Admin presence
  useEffect(() => {
    try {
      const saved = localStorage.getItem('vumi-state');
      if (saved) {
        const parsed = JSON.parse(saved);

        // Ensure Super Admin mahamudul.diu.cse@gmail.com is present with protected super_admin role
        const usersList: User[] = parsed.users || [];
        const superAdminIndex = usersList.findIndex(
          u => u.email === 'mahamudul.diu.cse@gmail.com' || u.email === 'mahamudu.diu.cse@gmail.com' || u.id === 'user-super-admin-1'
        );

        if (superAdminIndex === -1) {
          usersList.unshift(demoUsers[0]);
        } else {
          usersList[superAdminIndex] = {
            ...usersList[superAdminIndex],
            email: 'mahamudul.diu.cse@gmail.com',
            role: 'super_admin',
            isSuperAdmin: true,
            isActive: true,
          };
        }
        parsed.users = usersList;

        // Ensure authoritative seed registeredDocuments are always present with correct hashes and data
        const userCustomDocs = (parsed.registeredDocuments || []).filter(
          (doc: RegisteredDocument) => !seedRegisteredDocuments.some(s => s.id === doc.id)
        );
        parsed.registeredDocuments = [...seedRegisteredDocuments, ...userCustomDocs];

        // Ensure current sample submission is available in verificationSubmissions
        if (!parsed.verificationSubmissions || parsed.verificationSubmissions.length === 0) {
          parsed.verificationSubmissions = seedVerificationSubmissions;
        } else {
          const subIdx = parsed.verificationSubmissions.findIndex((s: VerificationSubmission) => s.id === 'SUB-2026-001' || s.id === 'SUB-2025-001');
          if (subIdx !== -1) {
            parsed.verificationSubmissions[subIdx] = seedVerificationSubmissions[0];
          }
        }

        // Ensure familyMembers only contain valid relationships: father, mother, spouse (wife), son, daughter
        const allowedRelations = ['father', 'mother', 'spouse', 'son', 'daughter'];
        let cleanedMembers: FamilyMember[] = [];
        if (parsed.familyMembers && Array.isArray(parsed.familyMembers)) {
          cleanedMembers = parsed.familyMembers.filter(
            (fm: FamilyMember) =>
              allowedRelations.includes(fm.relation) &&
              !fm.relationLabel?.includes('শ্বশুর') &&
              !fm.relationLabelEn?.toLowerCase().includes('in-law') &&
              fm.relation !== 'sister' &&
              fm.relation !== 'brother'
          );
        }
        const nonCitizen1 = cleanedMembers.filter((m: FamilyMember) => m.userId !== 'user-citizen-1');
        parsed.familyMembers = [...seedFamilyMembers, ...nonCitizen1];

        // Ensure inheritanceClaims only contain valid claims (from father/mother, never from in-laws or other members)
        let cleanedClaims: InheritanceClaim[] = [];
        if (parsed.inheritanceClaims && Array.isArray(parsed.inheritanceClaims)) {
          cleanedClaims = parsed.inheritanceClaims.filter(
            (c: InheritanceClaim) =>
              c.deceasedMemberId !== 'fm-006-old' &&
              !c.deceasedName?.includes('আলী হোসেন') &&
              !c.deceasedNameEn?.toLowerCase().includes('ali hossain')
          );
        }
        if (cleanedClaims.length === 0) {
          cleanedClaims = seedInheritanceClaims;
        }
        parsed.inheritanceClaims = cleanedClaims;

        dispatch({ type: 'LOAD_STATE', payload: parsed });
      }
    } catch {
      // ignore
    }
  }, []);

  // Persist state changes
  useEffect(() => {
    try {
      const toSave = {
        language: state.language,
        currentUser: state.currentUser,
        parcels: state.parcels,
        registeredDocuments: state.registeredDocuments,
        applications: state.applications,
        auditLog: state.auditLog,
        notifications: state.notifications,
        users: state.users,
        familyMembers: state.familyMembers,
        inheritanceClaims: state.inheritanceClaims,
        verificationSubmissions: state.verificationSubmissions,
      };
      localStorage.setItem('vumi-state', JSON.stringify(toSave));
    } catch {
      // storage full, ignore
    }
  }, [state]);

  const t = useCallback((key: string): string => {
    const entry = translations[key];
    if (!entry) return key;
    return entry[state.language] || entry.bn || key;
  }, [state.language]);

  const addAudit = useCallback((action: string, actionEn: string, targetType: string, targetId: string, details: string) => {
    const entry: AuditEntry = {
      id: generateId('audit'),
      action,
      actionEn,
      userId: state.currentUser?.id || 'system',
      userName: state.currentUser?.name || 'সিস্টেম',
      targetType,
      targetId,
      details,
      timestamp: new Date().toISOString(),
    };
    dispatch({ type: 'ADD_AUDIT', payload: entry });
  }, [state.currentUser, dispatch]);

  const contextValue: AppContextType = {
    ...state,
    dispatch,
    t,
    addAudit,
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextType {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
