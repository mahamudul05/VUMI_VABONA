// ============================================================
// Public View Page — Privacy-safe view for QR/sharing
// ============================================================
import { useParams, Link } from 'react-router-dom';
import { MapPin, Shield, AlertCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Card, StatusBadge, Disclaimer, EmptyState } from '../components/SharedUI';

export default function PublicViewPage() {
  const { id } = useParams<{ id: string }>();
  const { t, language, parcels } = useApp();

  const parcel = parcels.find(p => p.id === id);

  if (!parcel) {
    return (
      <div className="container page-content">
        <EmptyState
          icon={<MapPin size={48} />}
          title={t('search.noResult')}
          action={<Link to="/" className="btn btn-primary">{t('nav.home')}</Link>}
        />
      </div>
    );
  }

  return (
    <div className="page-public-view">
      <div className="container">
        <div className="public-view-header">
          <Shield size={24} />
          <h1>{t('land.publicView')}</h1>
        </div>

        <Disclaimer text={t('land.disclaimer')} type="info" />
        <Disclaimer
          text={language === 'bn'
            ? 'এই পাবলিক ভিউতে ব্যক্তিগত তথ্য (NID, ফোন, ঠিকানা) প্রদর্শিত হয় না।'
            : 'This public view does not display personal information (NID, phone, address).'
          }
          type="info"
        />

        <Card title={language === 'bn' ? 'জমির সনাক্তকরণ তথ্য' : 'Parcel Identification'} icon={<MapPin size={18} />}>
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
              <span className="info-value">{parcel.totalAreaDecimal} {t('land.decimal')}</span>
            </div>
            <div className="info-item">
              <span className="info-label">{t('land.landType')}</span>
              <span className="info-value">{language === 'bn' ? parcel.landType : parcel.landTypeEn}</span>
            </div>
          </div>
        </Card>

        <Card title={t('land.owners')} icon={<AlertCircle size={18} />} className="mt-4">
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t('land.ownerName')}</th>
                  <th>{t('land.share')}</th>
                  <th>{t('land.verification')}</th>
                </tr>
              </thead>
              <tbody>
                {parcel.owners.map((o, idx) => (
                  <tr key={idx}>
                    <td>{language === 'bn' ? o.ownerName : o.ownerNameEn}</td>
                    <td>{o.shareDecimal} {t('land.decimal')}</td>
                    <td><StatusBadge status={o.verificationState} size="sm" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="public-view-footer">
          <p className="demo-label">ডেমো / DEMO</p>
        </div>
      </div>
    </div>
  );
}
