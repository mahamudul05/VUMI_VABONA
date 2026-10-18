// ============================================================
// Header Component — Role-aware, refined government aesthetic
// ============================================================
import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Menu, X, Globe, LogIn, LogOut, Home, Search, FileCheck,
  ClipboardList, LayoutDashboard, Shield, Bell, ChevronDown,
  User, CheckCircle2, AlertCircle
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Header() {
  const { language, currentUser, dispatch, t, notifications } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const isBn = language === 'bn';

  const userNotifications = notifications.filter(
    n => currentUser ? n.userId === currentUser.id : false
  );
  const unreadCount = userNotifications.filter(n => !n.read).length;

  const toggleLanguage = () => {
    dispatch({ type: 'SET_LANGUAGE', payload: language === 'bn' ? 'en' : 'bn' });
  };

  const handleLogout = () => {
    dispatch({ type: 'LOGOUT' });
    navigate('/');
    setMobileMenuOpen(false);
    setShowUserMenu(false);
  };

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  // Build role-specific navigation links
  const getNavLinks = () => {
    if (!currentUser) {
      // Public / Guest
      return [
        { path: '/', label: t('nav.home'), icon: Home },
        { path: '/search', label: t('nav.landSearch'), icon: Search },
        { path: '/deed-verify', label: t('nav.deedVerify'), icon: FileCheck },
        { path: '/track', label: t('nav.trackApp'), icon: ClipboardList },
      ];
    }

    if (currentUser.role === 'citizen') {
      return [
        { path: '/dashboard', label: isBn ? 'নাগরিক ড্যাশবোর্ড' : 'Citizen Dashboard', icon: LayoutDashboard },
        { path: '/search', label: t('nav.landSearch'), icon: Search },
        { path: '/deed-verify', label: t('nav.deedVerify'), icon: FileCheck },
        { path: '/track', label: t('nav.trackApp'), icon: ClipboardList },
      ];
    }

    if (currentUser.role === 'officer') {
      return [
        { path: '/officer', label: isBn ? 'কর্মকর্তা ড্যাশবোর্ড' : 'Officer Dashboard', icon: LayoutDashboard },
        { path: '/deed-verify', label: t('nav.deedVerify'), icon: FileCheck },
        { path: '/track', label: isBn ? 'আবেদন অনুসন্ধান' : 'Search Application', icon: Search },
      ];
    }

    if (currentUser.role === 'admin' || currentUser.role === 'super_admin') {
      return [
        { 
          path: '/admin', 
          label: isBn 
            ? (currentUser.role === 'super_admin' ? 'সুপার অ্যাডমিন ড্যাশবোর্ড' : 'অ্যাডমিন ড্যাশবোর্ড') 
            : (currentUser.role === 'super_admin' ? 'Super Admin Dashboard' : 'Admin Dashboard'), 
          icon: Shield 
        },
      ];
    }

    return [];
  };

  const navLinks = getNavLinks();

  const getRoleLabel = () => {
    if (!currentUser) return null;
    if (currentUser.role === 'citizen') return isBn ? 'নাগরিক পোর্টাল' : 'Citizen Portal';
    if (currentUser.role === 'officer') return isBn ? 'কর্মকর্তা পোর্টাল' : 'Officer Portal';
    if (currentUser.role === 'super_admin') return isBn ? 'সুপার অ্যাডমিন পোর্টাল' : 'Super Admin Portal';
    return isBn ? 'প্রশাসক পোর্টাল' : 'Admin Portal';
  };

  return (
    <>
      {/* Prototype notice banner - subtle and non-intrusive */}
      <div className="prototype-banner">
        <span>
          {isBn
            ? 'ভূমি ভাবনা — বিশ্ববিদ্যালয় হ্যাকাথন প্রোটোটাইপ সংস্করণ (LandTech 2026)'
            : 'Vumi Vabona — University Hackathon Prototype Edition (LandTech 2026)'}
        </span>
      </div>

      <header className="header">
        <div className="container header-inner">
          {/* Logo & Branding */}
          <Link to={currentUser ? (currentUser.role === 'citizen' ? '/dashboard' : currentUser.role === 'officer' ? '/officer' : '/admin') : '/'} className="header-brand">
            <div className="header-logo-wrapper">
              <img
                src="/assets/government-logo.png"
                alt="ভূমি ভাবনা লোগো"
                className="header-logo"
              />
            </div>
            <div className="header-brand-text">
              <div className="header-brand-top">
                <span className="header-gov-text">{t('app.gov')}</span>
                {currentUser && (
                  <span className={`header-role-badge badge-role-${currentUser.role}`}>
                    {getRoleLabel()}
                  </span>
                )}
              </div>
              <span className="header-app-name">{t('app.name')}</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="header-nav desktop-only">
            {navLinks.map(link => (
              <Link
                key={link.path}
                to={link.path}
                className={`nav-link ${isActive(link.path) ? 'active' : ''}`}
              >
                <link.icon size={16} />
                <span>{link.label}</span>
              </Link>
            ))}
          </nav>

          {/* Right side actions */}
          <div className="header-actions">
            {/* Language Toggle */}
            <button
              onClick={toggleLanguage}
              className="btn-icon language-toggle"
              title={t('nav.language')}
              aria-label="Toggle language"
            >
              <Globe size={18} />
              <span className="lang-label">{t('nav.language')}</span>
            </button>

            {/* Notifications */}
            {currentUser && (
              <div className="notification-wrapper" ref={notifRef}>
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className={`btn-icon notification-btn ${showNotifications ? 'active' : ''}`}
                  aria-label="Notifications"
                >
                  <Bell size={18} />
                  {unreadCount > 0 && (
                    <span className="notification-badge">{unreadCount}</span>
                  )}
                </button>
                {showNotifications && (
                  <div className="notification-dropdown">
                    <div className="notification-header">
                      <h4>{t('dashboard.notifications')}</h4>
                      {unreadCount > 0 && (
                        <span className="badge badge-info">{unreadCount} {isBn ? 'নতুন' : 'new'}</span>
                      )}
                    </div>
                    <div className="notification-list">
                      {userNotifications.length === 0 ? (
                        <div className="notification-empty">
                          <CheckCircle2 size={32} style={{ color: 'var(--color-primary)', margin: '0 auto 0.5rem' }} />
                          <p>{isBn ? 'কোনো নতুন বিজ্ঞপ্তি নেই' : 'No notifications'}</p>
                        </div>
                      ) : (
                        userNotifications.slice(0, 5).map(n => (
                          <div
                            key={n.id}
                            className={`notification-item ${!n.read ? 'unread' : ''}`}
                            onClick={() => {
                              dispatch({ type: 'MARK_NOTIFICATION_READ', payload: n.id });
                              if (n.link) navigate(n.link);
                              setShowNotifications(false);
                            }}
                          >
                            <div className={`notif-dot notif-${n.type}`} />
                            <div className="notif-content">
                              <strong>{isBn ? n.title : n.titleEn}</strong>
                              <p>{isBn ? n.message : n.messageEn}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* User Profile / Login */}
            {currentUser ? (
              <div className="user-menu-wrapper" ref={userMenuRef}>
                <button
                  className={`user-btn ${showUserMenu ? 'active' : ''}`}
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  title={currentUser.name}
                >
                  <span className="user-avatar">
                    {currentUser.name.charAt(0)}
                  </span>
                  <div className="user-btn-details desktop-only">
                    <span className="user-name">
                      {isBn ? currentUser.name : currentUser.nameEn}
                    </span>
                    <span className="user-role-subtext">
                      {currentUser.role === 'citizen' ? (isBn ? 'নাগরিক' : 'Citizen') :
                       currentUser.role === 'officer' ? (isBn ? 'ভূমি কর্মকর্তা' : 'Land Officer') :
                       (isBn ? 'প্রশাসক' : 'Admin')}
                    </span>
                  </div>
                  <ChevronDown size={14} className="user-chevron" />
                </button>

                {showUserMenu && (
                  <div className="user-dropdown">
                    <div className="user-dropdown-header">
                      <div className="user-avatar-lg">{currentUser.name.charAt(0)}</div>
                      <div className="user-dropdown-meta">
                        <strong>{isBn ? currentUser.name : currentUser.nameEn}</strong>
                        <span className="user-dropdown-role">{getRoleLabel()}</span>
                        {currentUser.nid && (
                          <small className="user-dropdown-nid">NID: ****{currentUser.nid.slice(-4)}</small>
                        )}
                      </div>
                    </div>
                    <div className="user-dropdown-menu">
                      <Link
                        to={currentUser.role === 'citizen' ? '/dashboard' : currentUser.role === 'officer' ? '/officer' : '/admin'}
                        className="user-dropdown-item"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <LayoutDashboard size={16} />
                        <span>{isBn ? 'আমার ড্যাশবোর্ড' : 'My Dashboard'}</span>
                      </Link>
                      <button onClick={handleLogout} className="user-dropdown-item logout-item">
                        <LogOut size={16} />
                        <span>{t('nav.logout')}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" className="btn btn-primary-sm header-login-btn">
                <LogIn size={15} />
                <span>{t('nav.login')}</span>
              </Link>
            )}

            {/* Mobile menu toggle */}
            <button
              className="btn-icon mobile-menu-btn mobile-only"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="mobile-nav">
            {navLinks.map(link => (
              <Link
                key={link.path}
                to={link.path}
                className={`mobile-nav-link ${isActive(link.path) ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <link.icon size={18} />
                <span>{link.label}</span>
              </Link>
            ))}

            {currentUser && (
              <div className="mobile-user-section">
                <div className="mobile-user-info">
                  <span className="user-avatar">{currentUser.name.charAt(0)}</span>
                  <div>
                    <strong>{isBn ? currentUser.name : currentUser.nameEn}</strong>
                    <span className="mobile-role-text">{getRoleLabel()}</span>
                  </div>
                </div>
                <button onClick={handleLogout} className="btn btn-outline-sm btn-block">
                  <LogOut size={14} />
                  <span>{t('nav.logout')}</span>
                </button>
              </div>
            )}
          </nav>
        )}
      </header>
    </>
  );
}
