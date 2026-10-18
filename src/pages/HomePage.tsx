// ============================================================
// Home Page — Digital Land Service Platform Landing
// ============================================================
import { Link } from 'react-router-dom';
import {
  Search, FileCheck, Users, ClipboardList, ArrowRight,
  HelpCircle, ShieldCheck, QrCode, FileText, CheckCircle,
  Award, Sparkles, UserCheck, ChevronRight
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function HomePage() {
  const { t, language } = useApp();
  const isBn = language === 'bn';

  const serviceCards = [
    {
      icon: Search,
      title: t('home.searchLand'),
      desc: t('home.searchLandDesc'),
      path: '/search',
      color: 'var(--color-primary)',
      badge: isBn ? 'খতিয়ান ও দাগ' : 'Khatian & Dag',
    },
    {
      icon: FileCheck,
      title: t('home.verifyDeed'),
      desc: t('home.verifyDeedDesc'),
      path: '/deed-verify',
      color: 'var(--color-accent)',
      badge: isBn ? 'ক্রিপ্টোগ্রাফিক হ্যাশ' : 'SHA-256 Hash',
    },
    {
      icon: Users,
      title: t('home.mutation'),
      desc: t('home.mutationDesc'),
      path: '/mutation',
      color: 'var(--color-secondary)',
      badge: isBn ? 'ওয়ারিশান ও নামজারি' : 'Inheritance & Mutation',
    },
    {
      icon: ClipboardList,
      title: t('home.trackApp'),
      desc: t('home.trackAppDesc'),
      path: '/track',
      color: 'var(--color-info)',
      badge: isBn ? 'রিয়েল-টাইম ট্র্যাকিং' : 'Real-time Tracking',
    },
  ];

  const stats = [
    {
      value: '৪+',
      valueEn: '4+',
      label: isBn ? 'সিঙ্কড মৌজা ও খতিয়ান' : 'Synced Mouzas & Khatians',
      desc: isBn ? 'সাভার, পটিয়া ও গোদাগাড়ী' : 'Savar, Patiya & Godagari',
    },
    {
      value: '১০০%',
      valueEn: '100%',
      label: isBn ? 'ডিজিটাল হ্যাশ ভেরিফিকেশন' : 'Digital Hash Verification',
      desc: isBn ? 'SHA-256 ক্রিপ্টোগ্রাফি' : 'SHA-256 Cryptography',
    },
    {
      value: '৬',
      valueEn: '6',
      label: isBn ? 'ধাপের ডিজিটাল নামজারি' : 'Step Guided Mutation',
      desc: isBn ? 'ওয়ারিশ বণ্টন ও সংযুক্তি' : 'Heir Share & Attachments',
    },
    {
      value: '৩',
      valueEn: '3',
      label: isBn ? 'ভূমিকাভিত্তিক ড্যাশবোর্ড' : 'Role-based Dashboards',
      desc: isBn ? 'নাগরিক, অফিসার ও অ্যাডমিন' : 'Citizen, Officer & Admin',
    },
  ];

  const steps = [
    t('home.step1'),
    t('home.step2'),
    t('home.step3'),
    t('home.step4'),
    t('home.step5'),
  ];

  return (
    <div className="page-home">
      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'rgba(255, 255, 255, 0.15)',
              padding: '0.35rem 0.85rem',
              borderRadius: '9999px',
              fontSize: '0.85rem',
              fontWeight: 600,
              marginBottom: '1rem',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.25)'
            }}>
              <Award size={16} />
              <span>
                {isBn
                  ? 'ল্যান্ডটেক ২০২৬ হ্যাকাথন প্রোটোটাইপ — সমস্যা P2: দলিল ও মালিকানা যাচাই'
                  : 'LandTech 2026 Prototype — Problem P2: Deed & Ownership Verification'}
              </span>
            </div>

            <h1 className="hero-title">{t('home.welcome')}</h1>
            <p className="hero-subtitle">{t('home.subtitle')}</p>

            <div style={{
              display: 'flex',
              gap: '0.75rem',
              justifyContent: 'center',
              flexWrap: 'wrap',
              marginTop: '1.75rem'
            }}>
              <Link to="/deed-verify" className="btn btn-primary btn-lg" style={{
                background: '#ffffff',
                color: 'var(--color-primary-dark)',
                borderColor: '#ffffff',
                boxShadow: 'var(--shadow-md)'
              }}>
                <FileCheck size={20} />
                <span>{isBn ? 'দলিল যাচাই শুরু করুন' : 'Start Deed Verification'}</span>
              </Link>
              <Link to="/search" className="btn btn-outline btn-lg" style={{
                color: '#ffffff',
                borderColor: 'rgba(255,255,255,0.7)',
                background: 'rgba(255,255,255,0.08)'
              }}>
                <Search size={20} />
                <span>{isBn ? 'খতিয়ান খুঁজুন' : 'Search Land Record'}</span>
              </Link>
              <Link to="/login" className="btn btn-outline btn-lg" style={{
                color: '#ffffff',
                borderColor: 'rgba(255,255,255,0.7)',
                background: 'rgba(255,255,255,0.08)'
              }}>
                <UserCheck size={20} />
                <span>{isBn ? 'ডেমো পোর্টাল লগইন' : 'Demo Portals Login'}</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Service Cards */}
      <section className="section">
        <div className="container">
          <div className="service-cards-grid">
            {serviceCards.map((card, idx) => (
              <Link key={idx} to={card.path} className="service-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div className="service-card-icon" style={{ background: card.color }}>
                    <card.icon size={26} color="white" />
                  </div>
                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    padding: '0.2rem 0.5rem',
                    borderRadius: '9999px',
                    background: 'var(--color-bg-alt)',
                    color: 'var(--color-text-secondary)'
                  }}>
                    {card.badge}
                  </span>
                </div>
                <h3 className="service-card-title">{card.title}</h3>
                <p className="service-card-desc">{card.desc}</p>
                <span className="service-card-link">
                  <span>{isBn ? 'প্রবেশ করুন' : 'Explore'}</span>
                  <ArrowRight size={16} />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Counter Bar */}
      <section className="section" style={{ paddingTop: '0.5rem', paddingBottom: '2rem' }}>
        <div className="container">
          <div style={{
            background: 'var(--color-surface)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--color-border-light)',
            boxShadow: 'var(--shadow-sm)',
            padding: '1.5rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1.5rem',
            textAlign: 'center'
          }}>
            {stats.map((item, idx) => (
              <div key={idx} style={{
                borderRight: idx < stats.length - 1 ? '1px solid var(--color-border-light)' : 'none',
                padding: '0 0.5rem'
              }}>
                <div style={{
                  fontSize: '2rem',
                  fontWeight: 800,
                  color: 'var(--color-primary)',
                  lineHeight: 1.1
                }}>
                  {isBn ? item.value : item.valueEn}
                </div>
                <div style={{
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  color: 'var(--color-text)',
                  marginTop: '0.35rem'
                }}>
                  {item.label}
                </div>
                <div style={{
                  fontSize: '0.75rem',
                  color: 'var(--color-text-muted)',
                  marginTop: '0.2rem'
                }}>
                  {item.desc}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* P2 Core Capabilities Showcase */}
      <section className="section" style={{ background: 'var(--color-bg-alt)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '700px', margin: '0 auto 2.5rem' }}>
            <span style={{
              fontSize: '0.8rem',
              fontWeight: 700,
              color: 'var(--color-primary)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              {isBn ? 'মূল প্রযুক্তি ও সমাধান' : 'Core Innovations'}
            </span>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '0.35rem', color: 'var(--color-secondary)' }}>
              {isBn
                ? 'দলিল যাচাই ও ভূমিসেবায় আধুনিক উদ্ভাবন'
                : 'Advanced Deed Verification & Land Services'}
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem', marginTop: '0.5rem' }}>
              {isBn
                ? 'কৃত্রিম বুদ্ধিমত্তা ও ক্রিপ্টোগ্রাফিক সুরক্ষা সমন্বয়ে তৈরি স্বয়ংক্রিয় ভেরিফিকেশন ব্যবস্থা।'
                : 'Automated verification pipeline combining OCR optical extraction and cryptographic hashing.'}
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.25rem'
          }}>
            <div style={{
              background: 'var(--color-surface)',
              borderRadius: 'var(--radius-lg)',
              padding: '1.5rem',
              border: '1px solid var(--color-border-light)',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(13, 110, 63, 0.1)',
                color: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem'
              }}>
                <ShieldCheck size={24} />
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                {isBn ? 'SHA-256 ও OCR ডাবল ভেরিফিকেশন' : 'SHA-256 & OCR Verification'}
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                {isBn
                  ? 'দলিলের অরিজিনাল বাইনারি ফাইল থেকে ক্রিপ্টোগ্রাফিক হ্যাশ মেলানো ছাড়াও Tesseract OCR দ্বারা টেক্সট পড়ে দলিল নং, দাগ ও খতিয়ান ফিল্ড ভিত্তিক তুলনা করা হয়।'
                  : 'In addition to SHA-256 bit-level checking, multi-language Tesseract OCR extracts and compares deed number, dag, and khatian.'}
              </p>
            </div>

            <div style={{
              background: 'var(--color-surface)',
              borderRadius: 'var(--radius-lg)',
              padding: '1.5rem',
              border: '1px solid var(--color-border-light)',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(15, 118, 110, 0.1)',
                color: 'var(--color-accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem'
              }}>
                <QrCode size={24} />
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                {isBn ? 'লাইভ ক্যামেরা ও ফাইল QR স্ক্যানার' : 'Live Camera & File QR Scanner'}
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                {isBn
                  ? 'যেকোনো প্রিন্টকৃত বা ডিজিটাল দলিলে থাকা QR কোড সরাসরি ওয়েবক্যাম বা গ্যালারি থেকে স্ক্যান করে মুহূর্তের মধ্যে সিস্টেমের সরকারি রেকর্ডের সাথে যাচাই সম্ভব।'
                  : 'Scan QR codes directly with device camera or upload image files using html5-qrcode to fetch cadastral ownership records instantly.'}
              </p>
            </div>

            <div style={{
              background: 'var(--color-surface)',
              borderRadius: 'var(--radius-lg)',
              padding: '1.5rem',
              border: '1px solid var(--color-border-light)',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(37, 99, 235, 0.1)',
                color: 'var(--color-info)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem'
              }}>
                <FileText size={24} />
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                {isBn ? 'প্রিন্ট-রেডি অফিশিয়াল প্রত্যয়নপত্র' : 'Print-ready Certificates'}
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                {isBn
                  ? 'খতিয়ান বিবরণী, আবেদন প্রাপ্তি স্বীকার রশিদ এবং দলিল যাচাইয়ের চূড়ান্ত রিপোর্ট পরিচ্ছন্ন সরকারি লেআউটে সরাসরি প্রিন্ট বা PDF ডাউনলোড করা যায়।'
                  : 'Generate official khatian certificates, application receipt slips, and deed verification audit reports with dedicated print layouts.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How to use */}
      <section className="section">
        <div className="container">
          <div className="how-to-use">
            <div className="how-to-header">
              <HelpCircle size={24} />
              <h2>{t('home.howToUse')}</h2>
            </div>
            <ol className="how-to-steps">
              {steps.map((step, idx) => (
                <li key={idx} className="how-to-step">
                  <span className="step-num">{idx + 1}</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>
    </div>
  );
}

