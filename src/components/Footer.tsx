// ============================================================
// Footer Component
// ============================================================
import { useApp } from '../context/AppContext';

export default function Footer() {
  const { t, language } = useApp();
  const isBn = language === 'bn';

  return (
    <footer className="footer">
      <div className="footer-inner">
        {/* Left Side: Technical Support / Team & Varsity Logos */}
        <div className="footer-left">
          <span className="footer-support-label">
            {isBn ? 'কারিগরি সহায়তায়' : 'Technical Support By'}
          </span>
          <div className="footer-partners">
            <div className="footer-partner-item" title="Daffodil International University">
              <img
                src="/assets/diu-logo.png"
                alt="Daffodil International University"
                className="partner-logo diu-logo"
              />
              <span className="partner-name">Daffodil International University</span>
            </div>
            <div className="footer-partner-item" title="Team Elysium">
              <img
                src="/assets/elysium-logo.svg"
                alt="Team Elysium"
                className="partner-logo elysium-logo"
              />
              <span className="partner-name">Team Elysium</span>
            </div>
          </div>
        </div>

        {/* Middle: Government Logo */}
        <div className="footer-center">
          <div className="footer-gov-seal" title="গণপ্রজাতন্ত্রী বাংলাদেশ সরকার">
            <img
              src="/assets/bd-gov-logo.png"
              alt="Government of the People's Republic of Bangladesh"
              className="footer-gov-logo"
            />
          </div>
        </div>

        {/* Right Side: Prototype Quote & System Info */}
        <div className="footer-right">
          <p className="footer-main">{t('footer.text')}</p>
          <p className="footer-disclaimer">{t('footer.disclaimer')}</p>
          <p className="footer-ai-disclosure">
            {/* AI tool disclosure as required */}
            Built with AI-assisted development tools (Antigravity IDE)
          </p>
        </div>
      </div>
    </footer>
  );
}
