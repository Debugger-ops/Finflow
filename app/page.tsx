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
        <span>Start Free Trial</span>
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
          <span className="btn btn-teriary">
            Get Started Free
            <ArrowRight size={20} />
          </span>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        
      </footer>
    </div>
  );
};

export default Home;
