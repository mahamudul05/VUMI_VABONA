// ============================================================
// Footer Component
// ============================================================
import { useApp } from '../context/AppContext';

export default function Footer() {
  const { t } = useApp();

  return (
    <footer className="footer">
      <div className="container footer-inner">
        <p className="footer-main">{t('footer.text')}</p>
        <p className="footer-disclaimer">{t('footer.disclaimer')}</p>
        <p className="footer-ai-disclosure">
          {/* AI tool disclosure as required */}
          Built with AI-assisted development tools (Antigravity IDE)
        </p>
      </div>
    </footer>
  );
}
