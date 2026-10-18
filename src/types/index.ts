// ============================================================
// ভূমি ভাবনা | Vumi Vabona — Core Type Definitions
// ============================================================

export type UserRole = 'citizen' | 'officer' | 'admin' | 'super_admin';
export type Language = 'bn' | 'en';

export interface User {
  id: string;
  name: string;
  nameEn: string;
  role: UserRole;
  nid: string;
  phone: string;
  email?: string;
  password?: string;
  isActive?: boolean;
  isSuperAdmin?: boolean;
  createdAt?: string;
}

export type SurveyType = 'CS' | 'SA' | 'RS' | 'BS' | 'BRS';

export interface LandParcel {
  id: string;
  division: string;
  divisionEn: string;
  district: string;
  districtEn: string;
  upazila: string;
  upazilaEn: string;
  mouza: string;
  mouzaEn: string;
  jlNumber: string;
  surveyType: SurveyType;
  dagNumber: string;
  khatianNumber: string;
  totalAreaDecimal: number;
  landType: string;
  landTypeEn: string;
  owners: OwnerShare[];
  transactions: Transaction[];
  taxRecords: TaxRecord[];
  mortgages: MortgageRecord[];
  legalNotices: LegalNotice[];
}

export interface OwnerShare {
  ownerId: string;
  ownerName: string;
  ownerNameEn: string;
  shareDecimal: number;
  shareNote?: string;
  verificationState: VerificationState;
}

export type VerificationState = 'verified' | 'unverified' | 'disputed' | 'pending';
export type TransferType = 'sale' | 'gift' | 'inheritance' | 'court_order' | 'other';

export interface Transaction {
  id: string;
  date: string;
  transferType: TransferType;
  previousParty: string;
  previousPartyEn: string;
  receivingParty: string;
  receivingPartyEn: string;
  transferredAreaDecimal: number;
  deedReference: string;
  verificationState: VerificationState;
  relatedApplicationId?: string;
  notes?: string;
}

export type TaxStatus = 'paid' | 'unpaid' | 'partial' | 'waived';

export interface TaxRecord {
  id: string;
  fiscalYear: string;
  amountDue: number;
  amountPaid: number;
  status: TaxStatus;
  receiptNumber?: string;
  paymentDate?: string;
  noticeIssued?: boolean;
  noticeDetails?: string;
  auctionProceeding?: boolean;
  auctionDetails?: string;
}

export type MortgageStatus = 'active' | 'released' | 'unknown';

export interface MortgageRecord {
  id: string;
  institution: string;
  institutionEn: string;
  referenceNumber: string;
  startDate: string;
  status: MortgageStatus;
  releaseDate?: string;
  amount?: number;
  supportingDocRef?: string;
}

export interface LegalNotice {
  id: string;
  type: string;
  typeEn: string;
  date: string;
  description: string;
  descriptionEn: string;
  caseReference?: string;
  status: 'active' | 'resolved' | 'unknown';
}

export interface RegisteredDocument {
  id: string;
  deedNumber: string;
  deedType: string;
  deedTypeEn: string;
  registrationDate: string;
  parties: string;
  partiesEn: string;
  parcelId: string;
  fileHash: string;
  fileName: string;
  registeredBy: string;
  registeredAt: string;
  metadata?: string;
  // Extended reference fields
  district?: string;
  districtEn?: string;
  upazila?: string;
  upazilaEn?: string;
  mouza?: string;
  mouzaEn?: string;
  jlNumber?: string;
  dagNumber?: string;
  khatianNumber?: string;
  landAreaDecimal?: number;
  sourceType?: 'synthetic_demo' | 'authorized_sample' | 'public_reference';
  status?: 'active' | 'inactive' | 'archived';
  notes?: string;
  extractedText?: string;
}

export type VerificationResult = 'MATCH' | 'MISMATCH' | 'RECORD_NOT_FOUND' | 'UNABLE_TO_VERIFY';

export type DetailedVerificationStatus =
  | 'EXACT_MATCH'
  | 'REFERENCE_MATCH'
  | 'PARTIAL_MATCH'
  | 'MISMATCH'
  | 'NO_REFERENCE'
  | 'UNABLE_TO_VERIFY';

export interface FieldComparison {
  field: string;
  fieldLabelBn: string;
  fieldLabelEn: string;
  uploadedValue: string;
  referenceValue: string;
  status: 'match' | 'partial' | 'mismatch' | 'not_found' | 'unable';
}

export interface VerificationSubmission {
  id: string;
  userId?: string;
  userName?: string;
  createdAt: string;
  originalFileName: string;
  fileSize: number;
  fileHash: string;
  matchedReferenceId?: string;
  status: DetailedVerificationStatus;
  statusExplanationBn: string;
  statusExplanationEn: string;
  ocrExtractedText?: string;
  ocrStatus: 'completed' | 'partial' | 'failed' | 'not_needed';
  fieldComparisons: FieldComparison[];
  discrepancies: string[];
  manualReviewRecommended: boolean;
  adminReviewStatus?: 'pending' | 'reviewed' | 'unable_to_conclude';
  adminReviewNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

export type ApplicationStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'more_documents_required'
  | 'approved'
  | 'rejected';

export type ApplicationType = 'mutation' | 'inheritance' | 'correction';

export interface HeirInfo {
  name: string;
  nameEn: string;
  relationship: string;
  relationshipEn: string;
  nid: string;
  claimedShareDecimal: number;
}

export interface MutationApplication {
  id: string;
  type: ApplicationType;
  applicantId: string;
  applicantName: string;
  applicantNameEn: string;
  parcelId: string;
  deceasedName?: string;
  deceasedNameEn?: string;
  heirs: HeirInfo[];
  claimedShareDecimal: number;
  uploadedDocuments: UploadedDocument[];
  status: ApplicationStatus;
  statusHistory: StatusChange[];
  officerNotes: OfficerNote[];
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
}

export interface UploadedDocument {
  id: string;
  name: string;
  type: string;
  typeLabel: string;
  typeLabelEn: string;
  fileName: string;
  fileSize: number;
  uploadedAt: string;
  hash?: string;
}

export interface StatusChange {
  status: ApplicationStatus;
  changedBy: string;
  changedAt: string;
  reason?: string;
}

export interface OfficerNote {
  id: string;
  officerId: string;
  officerName: string;
  note: string;
  createdAt: string;
}

export interface AuditEntry {
  id: string;
  action: string;
  actionEn: string;
  userId: string;
  userName: string;
  targetType: string;
  targetId: string;
  details: string;
  timestamp: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  titleEn: string;
  message: string;
  messageEn: string;
  type: 'info' | 'success' | 'warning' | 'action_required';
  read: boolean;
  createdAt: string;
  link?: string;
}

// ── Family Relationships & Heirs ────────────────────
export type FamilyRelation = 'father' | 'mother' | 'son' | 'daughter' | 'spouse' | 'brother' | 'sister' | 'other';

export interface FamilyMember {
  id: string;
  userId: string;          // The user this relationship is defined for
  relatedUserId?: string;  // If the family member is also a demo user
  name: string;
  nameEn: string;
  relation: FamilyRelation;
  relationLabel: string;   // Bangla relation label
  relationLabelEn: string; // English relation label
  nid?: string;
  isDeceased: boolean;
  verificationStatus: 'verified_demo' | 'unverified' | 'pending';
}

export interface InheritanceClaim {
  id: string;
  heirUserId: string;        // The potential heir
  deceasedMemberId: string;  // FamilyMember.id of the deceased
  deceasedName: string;
  deceasedNameEn: string;
  parcelId: string;
  claimedShareDecimal: number;
  status: 'potential' | 'applied' | 'approved' | 'rejected';
  applicationId?: string;    // Linked MutationApplication if applied
  requiredDocuments: string[];
  verificationStatus: 'verified_demo' | 'unverified' | 'pending';
  notes?: string;
}

// ── Administrative Location Data ────────────────────
export interface LocationEntry {
  id: string;
  division: string;
  divisionEn: string;
  district: string;
  districtEn: string;
  upazila: string;
  upazilaEn: string;
  mouza: string;
  mouzaEn: string;
  jlNumber?: string;
  source?: string;
  sourceDate?: string;
  dataStatus?: 'active' | 'archived' | 'draft';
}
