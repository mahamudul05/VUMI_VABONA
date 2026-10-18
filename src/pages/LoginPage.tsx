import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserCircle, Shield, Briefcase, AlertCircle, ArrowRight, Lock, Mail, KeyRound } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Card, Disclaimer } from '../components/SharedUI';

export default function LoginPage() {
  const { t, language, currentUser, users, dispatch, addAudit } = useApp();
  const navigate = useNavigate();

  const [emailInput, setEmailInput] = useState('mahamudul.diu.cse@gmail.com');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');

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

  const handlePasswordLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    const trimmedEmail = emailInput.trim().toLowerCase();
    const user = users.find(u => 
      u.email?.toLowerCase() === trimmedEmail ||
      (trimmedEmail === 'mahamudul.diu.cse@gmail.com' && u.email?.toLowerCase() === 'mahamudu.diu.cse@gmail.com') ||
      (trimmedEmail === 'mahamudu.diu.cse@gmail.com' && u.email?.toLowerCase() === 'mahamudul.diu.cse@gmail.com')
    );

    if (!user) {
      setLoginError(language === 'bn' ? 'ব্যবহারকারী পাওয়া যায়নি' : 'User account not found');
      return;
    }

    if (user.isActive === false) {
      setLoginError(language === 'bn' ? 'অ্যাকাউন্টটি নিষ্ক্রিয় করা হয়েছে' : 'This account is currently deactivated');
      return;
    }

    dispatch({ type: 'LOGIN', payload: user });
    addAudit('লগইন (পাসওয়ার্ড)', 'Login (Password)', 'user', user.id, `${user.name} (${user.email}) সিস্টেমে প্রবেশ করেছেন`);

    if (user.role === 'citizen') navigate('/dashboard');
    else if (user.role === 'officer') navigate('/officer');
    else navigate('/admin');
  };

  const superAdminUser = users.find(
    u => u.email === 'mahamudul.diu.cse@gmail.com' || u.email === 'mahamudu.diu.cse@gmail.com' || u.role === 'super_admin'
  ) || users[0];
  const citizenUser = users.find(u => u.role === 'citizen') || users[1];
  const officerUser = users.find(u => u.role === 'officer') || users[2];
  const adminUser = users.find(u => u.role === 'admin') || users[3];

  const roleCards = [
    {
      id: superAdminUser?.id || 'user-super-admin-1',
      icon: Shield,
      role: language === 'bn' ? 'সুপার অ্যাডমিন' : 'Super Admin',
      user: superAdminUser,
      color: '#9333ea', // Royal Purple
      desc: language === 'bn'
        ? 'কেন্দ্রীয় পূর্ণ নিয়ন্ত্রণ (সম্পূর্ণ ডাটা CRUD, রেফারেন্স দলিল ও ভেরিফিকেশন)'
        : 'Full Central Control (All data CRUD, Reference Deeds, Verifications)',
    },
    {
      id: citizenUser?.id || 'user-citizen-1',
      icon: UserCircle,
      role: t('login.citizen'),
      user: citizenUser,
      color: 'var(--color-primary)',
      desc: language === 'bn'
        ? 'জমির তথ্য দেখুন, দলিল যাচাই করুন, আবেদন করুন'
        : 'View land info, verify deeds, submit applications',
    },
    {
      id: officerUser?.id || 'user-officer-1',
      icon: Briefcase,
      role: t('login.officer'),
      user: officerUser,
      color: 'var(--color-accent)',
      desc: language === 'bn'
        ? 'আবেদন পর্যালোচনা, কাগজপত্র যাচাই, সিদ্ধান্ত প্রদান'
        : 'Review applications, verify documents, make decisions',
    },
    {
      id: adminUser?.id || 'user-admin-1',
      icon: Shield,
      role: t('login.admin'),
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

          <Disclaimer text={t('login.disclaimer')} type="info" />

          {/* Super Admin & Direct Secure Credentials Login Box */}
          <Card className="login-card" style={{ marginBottom: '2rem', border: '2px solid #9333ea20' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div style={{ background: '#9333ea', padding: '0.5rem', borderRadius: '8px', color: 'white' }}>
                <KeyRound size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>
                  {language === 'bn' ? 'ইমেইল দিয়ে প্রবেশ করুন' : 'Sign In with Email'}
                </h3>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                  {language === 'bn'
                    ? 'প্রোটোটাইপ ডেমো — পাসওয়ার্ড যাচাই সার্ভার-সাইডে নেই'
                    : 'Prototype demo — server-side password verification not implemented'}
                </p>
              </div>
            </div>

            <form onSubmit={handlePasswordLogin}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                    {language === 'bn' ? 'ইমেইল অ্যাড্রেস' : 'Email Address'}
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                    <input
                      type="email"
                      required
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      placeholder="admin@example.com"
                      className="form-control"
                      style={{ paddingLeft: '2.25rem', width: '100%' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                    {language === 'bn' ? 'পাসওয়ার্ড (ডেমোতে যাচাই হয় না)' : 'Password (not validated in demo)'}
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                    <input
                      type="password"
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      placeholder="(ডেমোতে যেকোনো মান গ্রহণযোগ্য)"
                      className="form-control"
                      style={{ paddingLeft: '2.25rem', width: '100%' }}
                    />
                  </div>
                </div>
              </div>

              {loginError && (
                <div style={{ color: 'var(--color-danger)', fontSize: '0.85rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <AlertCircle size={14} /> {loginError}
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', background: '#9333ea', borderColor: '#9333ea' }}
              >
                {language === 'bn' ? 'প্রবেশ করুন' : 'Sign In'} <ArrowRight size={16} style={{ marginLeft: '0.5rem' }} />
              </button>
            </form>
          </Card>

          <h2 style={{ fontSize: '1rem', color: 'var(--color-text-muted)', textAlign: 'center', marginBottom: '1.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {language === 'bn' ? 'বা ডেমো রোল নির্বাচন করুন' : 'Or Select Demo Role'}
          </h2>

          <div className="login-cards" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
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
