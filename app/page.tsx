import { Button} from "./components/ui/button";
import Link from "next/link";
import { 
  TrendingUp, 
  Shield, 
  Zap, 
  PieChart, 
  ArrowRight, 
  Sparkles,
  CreditCard,
  BarChart3
} from "lucide-react";
import "./page.css";

const Home= () => {
  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="nav-header">
        <div className="nav-container">
          <div className="nav-logo">
            <div className="nav-logo-icon">
              <TrendingUp size={18} />
            </div>
            Finflow
          </div>
          <div className="nav-links">
            
          <Link href="/login">Login</Link>
          <Link href="/register">Register</Link>
          </div>
          
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-badge">
            <Sparkles size={16} />
            <span>Trusted by 50,000+ users worldwide</span>
          </div>
          <h1 className="hero-title">
            Your finances, simplified and supercharged
          </h1>
          <p className="hero-description">
            Take control of your money with intelligent tracking, smart insights, 
            and seamless payments. The future of personal finance is here.
          </p>
          <div className="hero-buttons">
      <button className="btn btn-primary">
        <Link className="btn-link" href="/register">Start Free Trial</Link>
        <ArrowRight className="btn-icon" size={20} />
      </button>
      
      <button className="btn btn-secondary">
        <span className="btn-icon-left">Watch Demo</span>
      </button>
    </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="stats-grid">
          <div className="stat-item">
            <div className="stat-value">$4.2B+</div>
            <div className="stat-label">Transactions Processed</div>
          </div>
          <div className="stat-item" style={{ animationDelay: '0.1s' }}>
            <div className="stat-value">50K+</div>
            <div className="stat-label">Active Users</div>
          </div>
          <div className="stat-item" style={{ animationDelay: '0.2s' }}>
            <div className="stat-value">99.9%</div>
            <div className="stat-label">Uptime Guaranteed</div>
          </div>
          <div className="stat-item" style={{ animationDelay: '0.3s' }}>
            <div className="stat-value">4.9★</div>
            <div className="stat-label">User Rating</div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section" id="features">
        <div className="section-header">
          <p className="section-label">Features</p>
          <h2 className="section-title">Everything you need to grow</h2>
          <p className="section-description">
            Powerful tools designed to give you complete control over your financial life.
          </p>
        </div>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">
              <BarChart3 size={24} />
            </div>
            <h3 className="feature-title">Smart Analytics</h3>
            <p className="feature-description">
              Get real-time insights into your spending patterns with AI-powered 
              analytics that help you make smarter decisions.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <Shield size={24} />
            </div>
            <h3 className="feature-title">Bank-Level Security</h3>
            <p className="feature-description">
              256-bit encryption and biometric authentication keep your money 
              and data protected at all times.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <Zap size={24} />
            </div>
            <h3 className="feature-title">Instant Transfers</h3>
            <p className="feature-description">
              Send and receive money instantly with zero fees. Connect all your 
              accounts in one place.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <PieChart size={24} />
            </div>
            <h3 className="feature-title">Budget Tracking</h3>
            <p className="feature-description">
              Set custom budgets and get notified before you overspend. 
              Achieve your savings goals effortlessly.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <CreditCard size={24} />
            </div>
            <h3 className="feature-title">Virtual Cards</h3>
            <p className="feature-description">
              Create unlimited virtual cards for secure online shopping with 
              custom spending limits.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <TrendingUp size={24} />
            </div>
            <h3 className="feature-title">Investment Tools</h3>
            <p className="feature-description">
              Start investing with as little as $1. Diversify your portfolio 
              with stocks, ETFs, and crypto.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-content">
          <h2 className="cta-title">Ready to transform your finances?</h2>
          <p className="cta-description">
            Join thousands of users who have already taken control of their financial future.
          </p>
          <Link className="btn btn-teriary" href="/register"> Get Started Free.  <ArrowRight size={20} /></Link> 
            
       
        </div>
      </section>

      {/* Footer */}
  
    <footer className="footer">
      <div className="footer-container">
        {/* Company Info */}
        <div className="footer-section footer-brand">
          <div className="brand-logo">
            <div className="logo-icon">
              <span className="currency-symbol">$</span>
              <div className="flow-lines">
                <span className="line"></span>
                <span className="line"></span>
                <span className="line"></span>
              </div>
            </div>
            <h2>FinFlow</h2>
          </div>
          <p className="brand-tagline">
            Streamline your finances with intelligent flow management. 
            Track, analyze, and optimize your financial journey.
          </p>
          <div className="social-links">
            <a href="#" className="social-link" aria-label="Twitter">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"/>
              </svg>
            </a>
            <a href="#" className="social-link" aria-label="LinkedIn">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z"/>
                <circle cx="4" cy="4" r="2"/>
              </svg>
            </a>
            <a href="#" className="social-link" aria-label="GitHub">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2A10 10 0 002 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0012 2z"/>
              </svg>
            </a>
            <a href="#" className="social-link" aria-label="Facebook">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/>
              </svg>
            </a>
          </div>
        </div>

        {/* Quick Links */}
        <div className="footer-section">
          <h3 className="footer-title">Product</h3>
          <ul className="footer-links">
            <li><a href="#features">Features</a></li>
            <li><a href="#pricing">Pricing</a></li>
            <li><a href="#integrations">Integrations</a></li>
            <li><a href="#api">API</a></li>
            <li><a href="#changelog">Changelog</a></li>
            <li><a href="#roadmap">Roadmap</a></li>
          </ul>
        </div>

        {/* Company */}
        <div className="footer-section">
          <h3 className="footer-title">Company</h3>
          <ul className="footer-links">
            <li><a href="#about">About Us</a></li>
            <li><a href="#careers">Careers</a></li>
            <li><a href="#blog">Blog</a></li>
            <li><a href="#press">Press Kit</a></li>
            <li><a href="#partners">Partners</a></li>
            <li><a href="#contact">Contact</a></li>
          </ul>
        </div>

        {/* Resources */}
        <div className="footer-section">
          <h3 className="footer-title">Resources</h3>
          <ul className="footer-links">
            <li><a href="#docs">Documentation</a></li>
            <li><a href="#guides">Guides</a></li>
            <li><a href="#help">Help Center</a></li>
            <li><a href="#community">Community</a></li>
            <li><a href="#webinars">Webinars</a></li>
            <li><a href="#status">Status</a></li>
          </ul>
        </div>

        {/* Newsletter */}
        <div className="footer-section footer-newsletter">
          <h3 className="footer-title">Stay Updated</h3>
          <p className="newsletter-text">
            Get the latest financial insights and product updates delivered to your inbox.
          </p>
          <form className="newsletter-form">
            <div className="input-group">
              <input 
                type="email" 
                placeholder="Enter your email"
                className="newsletter-input"
                required
              />
              <button type="submit" className="newsletter-btn">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
                </svg>
              </button>
            </div>
          </form>
          <div className="trust-badges">
            <div className="badge">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
              </svg>
              <span>256-bit SSL</span>
            </div>
            <div className="badge">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
              <span>SOC 2 Certified</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="footer-bottom">
        <div className="footer-bottom-container">
          <div className="copyright">
            <p>&copy; 2025 FinFlow. All rights reserved.</p>
          </div>
          <div className="footer-bottom-links">
            <a href="#privacy">Privacy Policy</a>
            <span className="separator">•</span>
            <a href="#terms">Terms of Service</a>
            <span className="separator">•</span>
            <a href="#cookies">Cookie Policy</a>
            <span className="separator">•</span>
            <a href="#security">Security</a>
          </div>
        </div>
      </div>

      </footer>
    </div>
  );
};

export default Home;
