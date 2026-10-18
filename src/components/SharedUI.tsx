// ============================================================
// Shared UI Components
// ============================================================
import React, { type ReactNode } from 'react';
import { useApp } from '../context/AppContext';
import type { ApplicationStatus, VerificationState, MortgageStatus, TaxStatus } from '../types';
import {
  CheckCircle, XCircle, AlertTriangle, Clock, FileText,
  Info, ChevronRight, AlertCircle
} from 'lucide-react';

// ── Status Badge ────────────────────────────────────
interface StatusBadgeProps {
  status: ApplicationStatus | VerificationState | MortgageStatus | TaxStatus | string;
  size?: 'sm' | 'md';
}

const statusConfig: Record<string, { className: string; icon: typeof CheckCircle }> = {
  verified: { className: 'badge-success', icon: CheckCircle },
  approved: { className: 'badge-success', icon: CheckCircle },
  paid: { className: 'badge-success', icon: CheckCircle },
  released: { className: 'badge-success', icon: CheckCircle },
  active: { className: 'badge-warning', icon: AlertCircle },
  unverified: { className: 'badge-neutral', icon: Clock },
  pending: { className: 'badge-warning', icon: Clock },
  draft: { className: 'badge-neutral', icon: FileText },
  submitted: { className: 'badge-info', icon: Info },
  under_review: { className: 'badge-info', icon: Clock },
  more_documents_required: { className: 'badge-warning', icon: AlertTriangle },
  rejected: { className: 'badge-danger', icon: XCircle },
  disputed: { className: 'badge-danger', icon: AlertTriangle },
  unpaid: { className: 'badge-danger', icon: XCircle },
  partial: { className: 'badge-warning', icon: AlertTriangle },
  waived: { className: 'badge-neutral', icon: CheckCircle },
  unknown: { className: 'badge-neutral', icon: AlertTriangle },
  resolved: { className: 'badge-success', icon: CheckCircle },
};

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const { t } = useApp();
  const config = statusConfig[status] || { className: 'badge-neutral', icon: Info };
  const Icon = config.icon;
  const label = t(`status.${status}`) !== `status.${status}`
    ? t(`status.${status}`)
    : t(`vs.${status}`) !== `vs.${status}`
    ? t(`vs.${status}`)
    : status;

  return (
    <span className={`status-badge ${config.className} ${size === 'sm' ? 'badge-sm' : ''}`}>
      <Icon size={size === 'sm' ? 12 : 14} />
      <span>{label}</span>
    </span>
  );
}

// ── Card Component ──────────────────────────────────
export interface CardProps {
  title?: string;
  children: ReactNode;
  className?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  style?: React.CSSProperties;
}


export function Card({ title, children, className = '', icon, actions, style }: CardProps) {
  return (
    <div className={`card ${className}`} style={style}>
      {(title || actions) && (
        <div className="card-header">
          <div className="card-title-row">
            {icon && <span className="card-icon">{icon}</span>}
            {title && <h3 className="card-title">{title}</h3>}
          </div>
          {actions && <div className="card-actions">{actions}</div>}
        </div>
      )}
      <div className="card-body">{children}</div>
    </div>
  );
}

// ── Empty State ─────────────────────────────────────
interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="empty-state">
      {icon && <div className="empty-icon">{icon}</div>}
      <h4 className="empty-title">{title}</h4>
      {description && <p className="empty-desc">{description}</p>}
      {action && <div className="empty-action">{action}</div>}
    </div>
  );
}

// ── Disclaimer Banner ───────────────────────────────
interface DisclaimerProps {
  text: string;
  type?: 'warning' | 'info' | 'danger';
}

export function Disclaimer({ text, type = 'warning' }: DisclaimerProps) {
  const Icon = type === 'danger' ? AlertTriangle : type === 'info' ? Info : AlertCircle;
  return (
    <div className={`disclaimer disclaimer-${type}`}>
      <Icon size={16} />
      <span>{text}</span>
    </div>
  );
}

// ── Breadcrumb ──────────────────────────────────────
interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav className="breadcrumb" aria-label="breadcrumb">
      {items.map((item, idx) => (
        <span key={idx} className="breadcrumb-item">
          {item.path ? (
            <a href={item.path}>{item.label}</a>
          ) : (
            <span className="breadcrumb-current">{item.label}</span>
          )}
          {idx < items.length - 1 && <ChevronRight size={14} className="breadcrumb-sep" />}
        </span>
      ))}
    </nav>
  );
}

// ── Confirm Dialog ──────────────────────────────────
interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'danger' | 'warning' | 'default';
  children?: ReactNode;
}

export function ConfirmDialog({
  open, title, message, confirmLabel, cancelLabel,
  onConfirm, onCancel, variant = 'default', children
}: ConfirmDialogProps) {
  const { t } = useApp();
  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h3 className="modal-title">{title}</h3>
        <div className="modal-message">{message}</div>
        {children}
        <div className="modal-actions">
          <button className="btn btn-outline" onClick={onCancel}>
            {cancelLabel || t('officer.cancel')}
          </button>
          <button
            className={`btn ${variant === 'danger' ? 'btn-danger' : 'btn-primary'}`}
            onClick={onConfirm}
          >
            {confirmLabel || t('common.confirm')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Loading Spinner ─────────────────────────────────
export function LoadingSpinner({ text }: { text?: string }) {
  const { t } = useApp();
  return (
    <div className="loading-spinner">
      <div className="spinner" />
      <span>{text || t('common.loading')}</span>
    </div>
  );
}

// ── Progress Steps ──────────────────────────────────
interface ProgressStepsProps {
  steps: string[];
  currentStep: number;
}

export function ProgressSteps({ steps, currentStep }: ProgressStepsProps) {
  return (
    <div className="progress-steps">
      {steps.map((step, idx) => (
        <div
          key={idx}
          className={`progress-step ${idx < currentStep ? 'completed' : idx === currentStep ? 'active' : ''}`}
        >
          <div className="step-indicator">
            {idx < currentStep ? <CheckCircle size={18} /> : <span>{idx + 1}</span>}
          </div>
          <span className="step-label">{step}</span>
          {idx < steps.length - 1 && <div className="step-connector" />}
        </div>
      ))}
    </div>
  );
}
