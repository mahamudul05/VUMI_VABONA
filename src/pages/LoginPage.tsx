import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserCircle, Shield, Briefcase, AlertCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Card } from '../components/SharedUI';

export default function LoginPage() {
  const { t, language, currentUser, users, dispatch, addAudit } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === 'citizen') navigate('/dashboard', { replace: true });
      else if (currentUser.role === 'officer') navigate('/officer', { replace: true });
      else if (currentUser.role === 'admin' || currentUser.role === 'super_admin') navigate('/admin', { replace: true });
    }
  }, [currentUser, navigate]);

  const handleLogin = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    dispatch({ type: 'LOGIN', payload: user });
    addAudit('লগইন', 'Login', 'user', user.id, `${user.name} সিস্টেমে প্রবেশ করেছেন`);

    if (user.role === 'citizen') navigate('/dashboard');
    else if (user.role === 'officer') navigate('/officer');
    else navigate('/admin');
  };

  const citizenUser = users.find(u => u.role === 'citizen') || users[1];
  const officerUser = users.find(u => u.role === 'officer') || users[2];
  const adminUser = users.find(u => u.role === 'admin') || users[3];

  const roleCards = [
    {
      id: citizenUser?.id || 'user-citizen-1',
      icon: UserCircle,
      role: language === 'bn' ? 'নাগরিক লগইন' : 'Citizen Login',
      user: citizenUser,
      color: 'var(--color-primary)',
      desc: language === 'bn'
        ? 'জমির তথ্য দেখুন, দলিল যাচাই করুন, আবেদন করুন'
        : 'View land info, verify deeds, submit applications',
    },
    {
      id: officerUser?.id || 'user-officer-1',
      icon: Briefcase,
      role: language === 'bn' ? 'ভূমি কর্মকর্তা লগইন' : 'Land Officer Login',
      user: officerUser,
      color: 'var(--color-accent)',
      desc: language === 'bn'
        ? 'আবেদন পর্যালোচনা, কাগজপত্র যাচাই, সিদ্ধান্ত প্রদান'
        : 'Review applications, verify documents, make decisions',
    },
    {
      id: adminUser?.id || 'user-admin-1',
      icon: Shield,
      role: language === 'bn' ? 'সিস্টেম প্রশাসক' : 'System Administrator Login',
      user: adminUser,
      color: 'var(--color-secondary)',
      desc: language === 'bn'
        ? 'সিস্টেম প্রশাসন, ডাটা ব্যবস্থাপনা, ব্যবহারকারী ও জমি রেকর্ড নিয়ন্ত্রণ'
        : 'System administration, data management, user & land records control',
    },
  ];

  return (
    <div className="page-login">
      <div className="container">
        <div className="login-wrapper">
          <div className="login-logo">
            <img
              src="/assets/government-logo.png"
              alt={t('app.name')}
              style={{ width: 80, height: 80, objectFit: 'contain', aspectRatio: '1 / 1' }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          </div>
          <h1 className="page-title">{t('login.title')}</h1>
          <p className="page-subtitle">{t('login.subtitle')}</p>

          <div className="login-cards" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', marginTop: '1.5rem' }}>
            {roleCards.map(card => (
              <Card key={card.id} className="login-card">
                <div className="login-card-content">
                  <div className="login-card-icon" style={{ background: card.color }}>
                    <card.icon size={32} color="white" />
                  </div>
                  <h3>{card.role}</h3>
                  <p className="login-user-info">
                    {language === 'bn' ? card.user?.name : card.user?.nameEn}
                  </p>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.5rem' }}>
                    {card.user?.email}
                  </span>
                  <p className="login-card-desc">{card.desc}</p>
                  <button
                    className="btn btn-primary btn-lg btn-block"
                    style={{ background: card.color, borderColor: card.color }}
                    onClick={() => handleLogin(card.id)}
                  >
                    {card.role}
                  </button>
                </div>
              </Card>
            ))}
          </div>

          <div className="login-demo-info" style={{ marginTop: '2rem' }}>
            <AlertCircle size={16} />
            <span>{t('login.demoAccounts')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
