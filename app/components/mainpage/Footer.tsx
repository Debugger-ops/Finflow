import { Github, Twitter, Linkedin, Mail } from "lucide-react";
import './footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-grid">
          {/* Brand */}
          <div className="footer-brand">
            <div className="brand-title">
              <span className="brand-gradient">
                FinFlow
              </span>
            </div>
            <p className="brand-description">
              Empowering businesses with next-generation financial technology solutions.
            </p>
            <div className="social-links">
              <Twitter className="social-icon" />
              <Linkedin className="social-icon" />
              <Github className="social-icon" />
              <Mail className="social-icon" />
            </div>
          </div>
          {/* Products */}
          <div className="footer-section">
            <h3 className="section-title">Products</h3>
            <ul className="section-links">
              <li><a href="#" className="footer-link">Payment Gateway</a></li>
              <li><a href="#" className="footer-link">Analytics Dashboard</a></li>
              <li><a href="#" className="footer-link">API Platform</a></li>
              <li><a href="#" className="footer-link">Mobile SDK</a></li>
            </ul>
          </div>
          {/* Company */}
          <div className="footer-section">
            <h3 className="section-title">Company</h3>
            <ul className="section-links">
              <li><a href="#" className="footer-link">About Us</a></li>
              <li><a href="#" className="footer-link">Careers</a></li>
              <li><a href="#" className="footer-link">Press</a></li>
              <li><a href="#" className="footer-link">Contact</a></li>
            </ul>
          </div>
          {/* Support */}
          <div className="footer-section">
            <h3 className="section-title">Support</h3>
            <ul className="section-links">
              <li><a href="#" className="footer-link">Documentation</a></li>
              <li><a href="#" className="footer-link">Help Center</a></li>
              <li><a href="#" className="footer-link">Status Page</a></li>
              <li><a href="#" className="footer-link">Security</a></li>
            </ul>
          </div>
        </div>
        {/* Bottom bar */}
        <div className="footer-bottom">
          <p className="copyright">
            © 2024 FinFlow. All rights reserved.
          </p>
          <div className="legal-links">
            <a href="#" className="legal-link">Privacy Policy</a>
            <a href="#" className="legal-link">Terms of Service</a>
            <a href="#" className="legal-link">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;