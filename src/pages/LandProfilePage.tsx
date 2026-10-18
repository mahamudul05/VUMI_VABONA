// ============================================================
// Land Profile Page — Detailed view of a single parcel
// ============================================================
import { useParams, Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import {
  MapPin, Users, History, Receipt, Landmark, Scale,
  Share2, AlertTriangle, FileText, ExternalLink, Printer
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Card, StatusBadge, Breadcrumb, Disclaimer, EmptyState } from '../components/SharedUI';
import { formatDate, formatAmount, triggerPrint } from '../utils';
import { useState } from 'react';

export default function LandProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { t, language, parcels } = useApp();
  const [showQR, setShowQR] = useState(false);

  const parcel = parcels.find(p => p.id === id);

  if (!parcel) {
    return (
      <div className="container page-content">
        <EmptyState
          icon={<MapPin size={48} />}
          title={t('search.noResult')}
          description={t('search.noResultHint')}
          action={<Link to="/search" className="btn btn-primary">{t('nav.landSearch')}</Link>}
        />
      </div>
    );
  }

  const totalShares = parcel.owners.reduce((s, o) => s + o.shareDecimal, 0);
  const hasInconsistency = Math.abs(totalShares - parcel.totalAreaDecimal) > 0.01;

  const transferTypeLabel = (type: string) => {
    const key = `transfer.${type}`;
    const val = t(key);
    return val !== key ? val : type;
  };

  const publicViewUrl = `${window.location.origin}/land/${parcel.id}/public`;

  return (
    <div className="page-land-profile">
      <div className="container">
        <Breadcrumb items={[
          { label: t('nav.home'), path: '/' },
          { label: t('nav.landSearch'), path: '/search' },
          { label: parcel.id },
        ]} />

        <div className="land-profile-header">
          <div>
            <h1 className="page-title">{t('land.title')}</h1>
            <span className="parcel-id-badge">{parcel.id}</span>
          </div>
          <div className="land-profile-actions">
            <button className="btn btn-outline" onClick={() => setShowQR(!showQR)}>
              <Share2 size={16} />
              <span>{t('land.shareQR')}</span>
            </button>
            <button className="btn btn-primary" onClick={triggerPrint}>
              <Printer size={16} />
              <span>{language === 'bn' ? 'খতিয়ান প্রিন্ট / সংরক্ষণ' : 'Print / Export Khatian'}</span>
            </button>
          </div>
        </div>

        {showQR && (
          <Card className="qr-card">
            <div className="qr-content">
              <QRCodeSVG
                value={publicViewUrl}
                size={180}
                level="M"
                includeMargin
              />
              <p className="qr-url">{publicViewUrl}</p>
              <p className="qr-note">
                {language === 'bn'
                  ? 'এই QR কোড স্ক্যান করে গোপনীয়তা-সুরক্ষিত পাবলিক ভিউ দেখা যাবে'
                  : 'Scan this QR code to view the privacy-safe public view'
                }
              </p>
            </div>
          </Card>
        )}

        <Disclaimer text={t('land.disclaimer')} type="info" />

        {/* Parcel Identifiers */}
        <Card title={t('land.currentStatus')} icon={<MapPin size={18} />} className="mb-4">
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">{t('land.parcelId')}</span>
              <span className="info-value">{parcel.id}</span>
            </div>
            <div className="info-item">
              <span className="info-label">{t('search.district')}</span>
              <span className="info-value">{language === 'bn' ? parcel.district : parcel.districtEn}</span>
            </div>
            <div className="info-item">
              <span className="info-label">{t('search.upazila')}</span>
              <span className="info-value">{language === 'bn' ? parcel.upazila : parcel.upazilaEn}</span>
            </div>
            <div className="info-item">
              <span className="info-label">{t('search.mouza')}</span>
              <span className="info-value">{language === 'bn' ? parcel.mouza : parcel.mouzaEn}</span>
            </div>
            <div className="info-item">
              <span className="info-label">{t('search.jlNumber')}</span>
              <span className="info-value">{parcel.jlNumber}</span>
            </div>
            <div className="info-item">
              <span className="info-label">{t('search.surveyType')}</span>
              <span className="info-value">{parcel.surveyType}</span>
            </div>
            <div className="info-item">
              <span className="info-label">{t('search.dagNumber')}</span>
              <span className="info-value">{parcel.dagNumber}</span>
            </div>
            <div className="info-item">
              <span className="info-label">{t('search.khatianNumber')}</span>
              <span className="info-value">{parcel.khatianNumber}</span>
            </div>
            <div className="info-item">
              <span className="info-label">{t('land.area')}</span>
              <span className="info-value info-value-highlight">{parcel.totalAreaDecimal} {t('land.decimal')}</span>
            </div>
            <div className="info-item">
              <span className="info-label">{t('land.landType')}</span>
              <span className="info-value">{language === 'bn' ? parcel.landType : parcel.landTypeEn}</span>
            </div>
          </div>
        </Card>

        {/* Owners */}
        <Card title={t('land.owners')} icon={<Users size={18} />} className="mb-4">
          {hasInconsistency && (
            <Disclaimer text={t('land.inconsistency')} type="danger" />
          )}
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t('land.ownerName')}</th>
                  <th>{t('land.share')}</th>
                  <th>{t('land.verification')}</th>
                  <th>{language === 'bn' ? 'টীকা' : 'Note'}</th>
                </tr>
              </thead>
              <tbody>
                {parcel.owners.map((owner, idx) => (
                  <tr key={idx}>
                    <td className="owner-name-cell">
                      {language === 'bn' ? owner.ownerName : owner.ownerNameEn}
                    </td>
                    <td>{owner.shareDecimal} {t('land.decimal')}</td>
                    <td><StatusBadge status={owner.verificationState} size="sm" /></td>
                    <td>{owner.shareNote || '—'}</td>
                  </tr>
                ))}
                <tr className="total-row">
                  <td><strong>{language === 'bn' ? 'মোট' : 'Total'}</strong></td>
                  <td><strong>{totalShares} {t('land.decimal')}</strong></td>
                  <td colSpan={2}></td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>

        {/* Transaction History */}
        <Card title={t('land.transactionHistory')} icon={<History size={18} />} className="mb-4">
          {parcel.transactions.length === 0 ? (
            <EmptyState icon={<History size={36} />} title={t('common.noData')} />
          ) : (
            <div className="timeline">
              {parcel.transactions.map((txn, idx) => (
                <div key={idx} className="timeline-item">
                  <div className="timeline-marker" />
                  <div className="timeline-content">
                    <div className="timeline-header">
                      <span className="timeline-date">{formatDate(txn.date, language)}</span>
                      <span className="timeline-type">{transferTypeLabel(txn.transferType)}</span>
                      <StatusBadge status={txn.verificationState} size="sm" />
                    </div>
                    <div className="timeline-body">
                      <div className="txn-parties">
                        <span className="txn-party">{language === 'bn' ? txn.previousParty : txn.previousPartyEn}</span>
                        <span className="txn-arrow">→</span>
                        <span className="txn-party">{language === 'bn' ? txn.receivingParty : txn.receivingPartyEn}</span>
                      </div>
                      <div className="txn-details">
                        <span>{t('land.transferArea')}: {txn.transferredAreaDecimal} {t('land.decimal')}</span>
                        <span>{t('land.deedRef')}: {txn.deedReference}</span>
                      </div>
                      {txn.relatedApplicationId && (
                        <Link to={`/track/${txn.relatedApplicationId}`} className="txn-link">
                          <FileText size={14} />
                          <span>{txn.relatedApplicationId}</span>
                        </Link>
                      )}
                      {txn.notes && <p className="txn-notes">{txn.notes}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Tax Records */}
        <Card title={t('land.taxRecords')} icon={<Receipt size={18} />} className="mb-4">
          {parcel.taxRecords.length === 0 ? (
            <>
              <EmptyState icon={<Receipt size={36} />} title={t('land.noTax')} />
              <Disclaimer text={t('land.noTaxDisclaimer')} type="warning" />
            </>
          ) : (
            <>
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>{t('land.taxYear')}</th>
                      <th>{t('land.taxDue')}</th>
                      <th>{t('land.taxPaid')}</th>
                      <th>{t('land.taxStatus')}</th>
                      <th>{t('land.receipt')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parcel.taxRecords.map(tax => (
                      <tr key={tax.id}>
                        <td>{tax.fiscalYear}</td>
                        <td>{formatAmount(tax.amountDue, language)}</td>
                        <td>{formatAmount(tax.amountPaid, language)}</td>
                        <td><StatusBadge status={tax.status} size="sm" /></td>
                        <td>{tax.receiptNumber || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {parcel.taxRecords.some(t => t.noticeIssued) && (
                <div className="tax-notices mt-3">
                  <h4 className="subsection-title">
                    <AlertTriangle size={16} />
                    <span>{language === 'bn' ? 'নোটিশ / প্রক্রিয়া' : 'Notices / Proceedings'}</span>
                  </h4>
                  {parcel.taxRecords.filter(t => t.noticeIssued).map(tax => (
                    <div key={tax.id} className="notice-item">
                      <p>{tax.noticeDetails}</p>
                      {tax.auctionProceeding && (
                        <div className="auction-alert">
                          <AlertTriangle size={14} />
                          <span>{tax.auctionDetails}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </Card>

        {/* Mortgage / Bank Claims */}
        <Card title={t('land.mortgages')} icon={<Landmark size={18} />} className="mb-4">
          {parcel.mortgages.length === 0 ? (
            <>
              <EmptyState icon={<Landmark size={36} />} title={t('land.noMortgage')} />
              <Disclaimer text={t('land.noMortgageDisclaimer')} type="warning" />
            </>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{t('land.institution')}</th>
                    <th>{t('land.refNumber')}</th>
                    <th>{t('land.date')}</th>
                    <th>{t('land.amount')}</th>
                    <th>{t('land.mortgageStatus')}</th>
                  </tr>
                </thead>
                <tbody>
                  {parcel.mortgages.map(m => (
                    <tr key={m.id}>
                      <td>{language === 'bn' ? m.institution : m.institutionEn}</td>
                      <td>{m.referenceNumber}</td>
                      <td>{formatDate(m.startDate, language)}</td>
                      <td>{m.amount ? formatAmount(m.amount, language) : '—'}</td>
                      <td><StatusBadge status={m.status} size="sm" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Legal Notices */}
        <Card title={t('land.legalNotices')} icon={<Scale size={18} />} className="mb-4">
          {parcel.legalNotices.length === 0 ? (
            <>
              <EmptyState icon={<Scale size={36} />} title={t('land.noLegal')} />
              <Disclaimer text={t('land.noLegalDisclaimer')} type="warning" />
            </>
          ) : (
            <div className="legal-notices-list">
              {parcel.legalNotices.map(notice => (
                <div key={notice.id} className="legal-notice-card">
                  <div className="legal-notice-header">
                    <span className="legal-type">{language === 'bn' ? notice.type : notice.typeEn}</span>
                    <StatusBadge status={notice.status} size="sm" />
                  </div>
                  <p className="legal-date">{formatDate(notice.date, language)}</p>
                  <p className="legal-desc">{language === 'bn' ? notice.description : notice.descriptionEn}</p>
                  {notice.caseReference && (
                    <span className="legal-ref">{notice.caseReference}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
