// ============================================================
// Land Search Page — With Division cascading & guidance
// ============================================================
import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, MapPin, ChevronRight, HelpCircle, X, Filter, RotateCcw } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getDivisions, getDistricts, getUpazilas, getMouzas } from '../data/locations';
import { toBanglaDigits, matchesDigits, toEnglishDigits } from '../utils';
import type { SurveyType } from '../types';

const surveyTypes: SurveyType[] = ['CS', 'SA', 'RS', 'BS', 'BRS'];

export default function LandSearchPage() {
  const { language, parcels, t } = useApp();
  const isBn = language === 'bn';
  const lang = language;

  const [division, setDivision] = useState('');
  const [district, setDistrict] = useState('');
  const [upazila, setUpazila] = useState('');
  const [mouza, setMouza] = useState('');
  const [surveyType, setSurveyType] = useState('');
  const [dagNumber, setDagNumber] = useState('');
  const [khatianNumber, setKhatianNumber] = useState('');
  const [textSearch, setTextSearch] = useState('');
  const [showHelp, setShowHelp] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Cascading options
  const divisions = getDivisions(lang);
  const districts = division ? getDistricts(division, lang) : [];
  const upazilas = division && district ? getUpazilas(division, district, lang) : [];
  const mouzas = division && district && upazila ? getMouzas(division, district, upazila, lang) : [];

  // Handle cascading resets
  const handleDivisionChange = (val: string) => {
    setDivision(val);
    setDistrict('');
    setUpazila('');
    setMouza('');
  };
  const handleDistrictChange = (val: string) => {
    setDistrict(val);
    setUpazila('');
    setMouza('');
  };
  const handleUpazilaChange = (val: string) => {
    setUpazila(val);
    setMouza('');
  };

  const handleReset = () => {
    setDivision('');
    setDistrict('');
    setUpazila('');
    setMouza('');
    setSurveyType('');
    setDagNumber('');
    setKhatianNumber('');
    setTextSearch('');
    setHasSearched(false);
  };

  // Filter parcels with bilingual digit support
  const results = useMemo(() => {
    let filtered = [...parcels];

    if (division) filtered = filtered.filter(p => p.division === division);
    if (district) filtered = filtered.filter(p => p.district === district);
    if (upazila) filtered = filtered.filter(p => p.upazila === upazila);
    if (mouza) filtered = filtered.filter(p => p.mouza === mouza);
    if (surveyType) filtered = filtered.filter(p => p.surveyType === surveyType);
    if (dagNumber.trim()) {
      filtered = filtered.filter(p => matchesDigits(p.dagNumber, dagNumber.trim()));
    }
    if (khatianNumber.trim()) {
      filtered = filtered.filter(p => matchesDigits(p.khatianNumber, khatianNumber.trim()));
    }
    if (textSearch.trim()) {
      const q = textSearch.trim().toLowerCase();
      filtered = filtered.filter(p =>
        p.id.toLowerCase().includes(q) ||
        p.mouza.toLowerCase().includes(q) ||
        p.mouzaEn.toLowerCase().includes(q) ||
        p.district.includes(q) ||
        p.districtEn.toLowerCase().includes(q) ||
        matchesDigits(p.dagNumber, q) ||
        matchesDigits(p.khatianNumber, q) ||
        p.owners.some(o => o.ownerName.includes(q) || o.ownerNameEn.toLowerCase().includes(q))
      );
    }

    return filtered;
  }, [parcels, division, district, upazila, mouza, surveyType, dagNumber, khatianNumber, textSearch]);

  const handleSearch = () => {
    setHasSearched(true);
  };

  return (
    <div className="container section">
      <div className="page-header">
        <h1>{t('search.title')}</h1>
        <p>{isBn ? 'বিভাগ, জেলা, উপজেলা, মৌজা, সার্ভে ধরন, দাগ ও খতিয়ান নম্বর দিয়ে জমি অনুসন্ধান করুন' : 'Search by division, district, upazila, mouza, survey type, dag & khatian number'}</p>
      </div>

      {/* Text search bar */}
      <div className="search-text-bar">
        <Search size={18} />
        <input
          type="text"
          placeholder={t('search.textSearch')}
          value={textSearch}
          onChange={e => { setTextSearch(e.target.value); setHasSearched(true); }}
          className="search-text-input"
        />
        {textSearch && <button className="btn-icon" onClick={() => setTextSearch('')}><X size={16} /></button>}
      </div>

      {/* Filter form */}
      <div className="card search-filter-card">
        <div className="search-filter-header">
          <h3><Filter size={18} /> {isBn ? 'অবস্থান ও পরিচিতি দিয়ে খুঁজুন' : 'Search by Location & Identifiers'}</h3>
          <button className="btn btn-outline-sm" onClick={() => setShowHelp(!showHelp)}>
            <HelpCircle size={14} />
            <span>{t('search.dontKnow')}</span>
          </button>
        </div>

        {showHelp && (
          <div className="alert alert-info" style={{ marginBottom: '1rem' }}>
            <HelpCircle size={18} />
            <div>
              <strong>{t('search.dontKnow')}</strong>
              <p style={{ margin: '0.25rem 0 0' }}>{t('search.dontKnowHelp')}</p>
            </div>
          </div>
        )}

        <div className="search-grid">
          {/* Division */}
          <div className="form-group">
            <label>{t('search.division')}</label>
            <select value={division} onChange={e => handleDivisionChange(e.target.value)}>
              <option value="">{t('search.selectDivision')}</option>
              {divisions.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
          </div>

          {/* District */}
          <div className="form-group">
            <label>{t('search.district')}</label>
            <select value={district} onChange={e => handleDistrictChange(e.target.value)} disabled={!division}>
              <option value="">{t('search.selectDistrict')}</option>
              {districts.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
          </div>

          {/* Upazila */}
          <div className="form-group">
            <label>{t('search.upazila')}</label>
            <select value={upazila} onChange={e => handleUpazilaChange(e.target.value)} disabled={!district}>
              <option value="">{t('search.selectUpazila')}</option>
              {upazilas.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
            </select>
          </div>

          {/* Mouza */}
          <div className="form-group">
            <label>{t('search.mouza')}</label>
            <select value={mouza} onChange={e => setMouza(e.target.value)} disabled={!upazila}>
              <option value="">{t('search.selectMouza')}</option>
              {mouzas.map(m => <option key={m.value} value={m.value}>{m.label}{m.jlNumber ? ` (JL: ${m.jlNumber})` : ''}</option>)}
            </select>
          </div>

          {/* Survey Type */}
          <div className="form-group">
            <label>{t('search.surveyType')}</label>
            <select value={surveyType} onChange={e => setSurveyType(e.target.value)}>
              <option value="">{isBn ? 'সকল সার্ভে' : 'All Surveys'}</option>
              {surveyTypes.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Dag Number */}
          <div className="form-group">
            <label>{t('search.dagNumber')}</label>
            <input type="text" value={dagNumber} onChange={e => setDagNumber(e.target.value)} placeholder={isBn ? 'যেমন: ২৩৪' : 'e.g. 234'} />
          </div>

          {/* Khatian Number */}
          <div className="form-group">
            <label>{t('search.khatianNumber')}</label>
            <input type="text" value={khatianNumber} onChange={e => setKhatianNumber(e.target.value)} placeholder={isBn ? 'যেমন: ৫৬৭' : 'e.g. 567'} />
          </div>
        </div>

        <div className="search-actions">
          <button className="btn btn-primary" onClick={handleSearch}>
            <Search size={16} /> {t('search.btn')}
          </button>
          <button className="btn btn-outline" onClick={handleReset}>
            <RotateCcw size={16} /> {t('search.reset')}
          </button>
        </div>
      </div>

      {/* Sample search suggestions */}
      {!hasSearched && (
        <div className="card" style={{ marginTop: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>{t('search.sampleSearches')}</h3>
          <div className="sample-search-grid">
            {parcels.slice(0, 4).map(p => (
              <button
                key={p.id}
                className="sample-search-btn"
                onClick={() => {
                  setDivision(p.division);
                  setDistrict(p.district);
                  setUpazila(p.upazila);
                  setMouza(p.mouza);
                  setHasSearched(true);
                }}
              >
                <MapPin size={14} />
                <span>{isBn ? `${p.mouza}, ${p.upazila}, ${p.district}` : `${p.mouzaEn}, ${p.upazilaEn}, ${p.districtEn}`}</span>
                <ChevronRight size={14} />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {hasSearched && (
        <div className="search-results" style={{ marginTop: '1.5rem' }}>
          <h2>{t('search.results')} ({isBn ? toBanglaDigits(results.length) : results.length})</h2>

          {results.length === 0 ? (
            <div className="empty-state">
              <Search size={48} />
              <h3>{t('search.noResult')}</h3>
              <p>{t('search.noResultHint')}</p>
            </div>
          ) : (
            <div className="search-result-grid">
              {results.map(p => (
                <Link to={`/land/${p.id}`} key={p.id} className="search-result-card">
                  <div className="search-result-header">
                    <span className="parcel-id-badge">{p.id}</span>
                    <span className="badge badge-info">{p.surveyType}</span>
                  </div>
                  <div className="search-result-location">
                    <MapPin size={14} />
                    <span>{isBn ? `${p.division} › ${p.district} › ${p.upazila} › ${p.mouza}` : `${p.divisionEn} › ${p.districtEn} › ${p.upazilaEn} › ${p.mouzaEn}`}</span>
                  </div>
                  <div className="search-result-details">
                    <span>{t('search.dagNumber')}: {p.dagNumber}</span>
                    <span>{t('search.khatianNumber')}: {p.khatianNumber}</span>
                    <span>{isBn ? toBanglaDigits(p.totalAreaDecimal) : p.totalAreaDecimal} {t('land.decimal')}</span>
                    <span>{isBn ? p.landType : p.landTypeEn}</span>
                  </div>
                  <div className="search-result-owners">
                    {p.owners.slice(0, 2).map((o, i) => (
                      <span key={i} className="owner-tag">{isBn ? o.ownerName : o.ownerNameEn}</span>
                    ))}
                    {p.owners.length > 2 && <span className="owner-tag">+{p.owners.length - 2}</span>}
                  </div>
                  <div className="search-result-action">
                    <span>{t('search.viewDetails')}</span>
                    <ChevronRight size={16} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
