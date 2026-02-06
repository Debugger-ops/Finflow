'use client';

import { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, User, Building, ArrowRight, Github, Check } from 'lucide-react';
import './register.css';

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    company: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
    subscribeNewsletter: false
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();

  // Password match check
  if (formData.password !== formData.confirmPassword) {
    alert("Passwords do not match");
    return;
  }

  // Terms checkbox check
  if (!formData.agreeToTerms) {
    alert("You must agree to the Terms of Service");
    return;
  }

  try {
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        password: formData.password,
        company: formData.company
      }),
    });

    const data = await response.json();

    if (response.ok) {
      alert("Registration successful! Please login.");
      // Redirect to login page
      window.location.href = "/login";
    } else {
      alert(data.message || "Registration failed");
    }
  } catch (error) {
    console.error("Registration error:", error);
    alert("Something went wrong. Please try again later.");
  }
};


  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const { name, value, type, checked } = e.target;
  setFormData(prev => ({
    ...prev,
    [name]: type === 'checkbox' ? checked : value
  }));
};


  const passwordStrength = (password: string): number => {
  let strength = 0;
  if (password.length >= 8) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[a-z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[^A-Za-z0-9]/.test(password)) strength++;
  return strength;
};


  const getPasswordStrengthText = (strength: number) => {
    switch (strength) {
      case 0:
      case 1: return 'Weak';
      case 2:
      case 3: return 'Medium';
      case 4:
      case 5: return 'Strong';
      default: return '';
    }
  };

  const getPasswordStrengthColor = (strength: number) => {
    switch (strength) {
      case 0:
      case 1: return 'var(--danger)';
      case 2:
      case 3: return 'var(--accent)';
      case 4:
      case 5: return 'var(--success)';
      default: return 'var(--border)';
    }
  };

  return (
    <div className="register-container">
      {/* Background Elements */}
      <div className="register-background">
        <div className="bg-grid"></div>
        <div className="bg-gradient-1"></div>
        <div className="bg-gradient-2"></div>
        <div className="floating-elements">
          <div className="floating-element floating-1"></div>
          <div className="floating-element floating-2"></div>
          <div className="floating-element floating-3"></div>
          <div className="floating-element floating-4"></div>
        </div>
      </div>

      <div className="register-content">
        {/* Left Side - Form */}
        <div className="register-form-container">
          <div className="form-wrapper">
            <div className="form-header">
              <div className="brand-logo">
                <span className="brand-gradient">FinFlow</span>
              </div>
              <h1 className="form-title">Create Account</h1>
              <p className="form-subtitle">Start your journey with FinFlow today</p>
            </div>

            <form onSubmit={handleSubmit} className="register-form">
              {/* Name Fields */}
              <div className="name-fields">
                <div className="form-group">
                  <label htmlFor="firstName" className="form-label">First Name</label>
                  <div className="input-wrapper">
                    <User className="input-icon" />
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="John"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="lastName" className="form-label">Last Name</label>
                  <div className="input-wrapper">
                    <User className="input-icon" />
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="Doe"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Company Field */}
              <div className="form-group">
                <label htmlFor="company" className="form-label">Company</label>
                <div className="input-wrapper">
                  <Building className="input-icon" />
                  <input
                    type="text"
                    id="company"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Your Company Inc."
                  />
                </div>
              </div>

              {/* Email Field */}
              <div className="form-group">
                <label htmlFor="email" className="form-label">Email Address</label>
                <div className="input-wrapper">
                  <Mail className="input-icon" />
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="john@company.com"
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="form-group">
                <label htmlFor="password" className="form-label">Password</label>
                <div className="input-wrapper">
                  <Lock className="input-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Create a strong password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="password-toggle"
                  >
                    {showPassword ? <EyeOff className="toggle-icon" /> : <Eye className="toggle-icon" />}
                  </button>
                </div>
                {/* Password Strength */}
                {formData.password && (
                  <div className="password-strength">
                    <div className="strength-bar">
                      <div 
                        className="strength-fill"
                        style={{
                          width: `${(passwordStrength(formData.password) / 5) * 100}%`,
                          backgroundColor: getPasswordStrengthColor(passwordStrength(formData.password))
                        }}
                      ></div>
                    </div>
                    <span 
                      className="strength-text"
                      style={{ color: getPasswordStrengthColor(passwordStrength(formData.password)) }}
                    >
                      {getPasswordStrengthText(passwordStrength(formData.password))}
                    </span>
                  </div>
                )}
              </div>

              {/* Confirm Password Field */}
              <div className="form-group">
                <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
                <div className="input-wrapper">
                  <Lock className="input-icon" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Confirm your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="password-toggle"
                  >
                    {showConfirmPassword ? <EyeOff className="toggle-icon" /> : <Eye className="toggle-icon" />}
                  </button>
                </div>
                {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                  <div className="error-text">Passwords do not match</div>
                )}
              </div>

              {/* Checkboxes */}
              <div className="checkbox-group">
                <label className="checkbox-wrapper">
                  <input
                    type="checkbox"
                    name="agreeToTerms"
                    checked={formData.agreeToTerms}
                    onChange={handleChange}
                    className="checkbox-input"
                    required
                  />
                  <span className="checkbox-custom">
                    <Check className="check-icon" />
                  </span>
                  <span className="checkbox-label">
                    I agree to the <a href="#" className="terms-link">Terms of Service</a> and <a href="#" className="terms-link">Privacy Policy</a>
                  </span>
                </label>

                <label className="checkbox-wrapper">
                  <input
                    type="checkbox"
                    name="subscribeNewsletter"
                    checked={formData.subscribeNewsletter}
                    onChange={handleChange}
                    className="checkbox-input"
                  />
                  <span className="checkbox-custom">
                    <Check className="check-icon" />
                  </span>
                  <span className="checkbox-label">
                    Subscribe to our newsletter for updates and tips
                  </span>
                </label>
              </div>

              {/* Submit Button */}
              <button type="submit" className="submit-btn">
                Create Account
                <ArrowRight className="submit-icon" />
              </button>
            </form>

            {/* Divider */}
            <div className="form-divider">
              <span className="divider-text">or sign up with</span>
            </div>

            {/* Social Login */}
            <div className="social-login">
              <button className="social-btn">
                <Github className="social-icon" />
                <span>GitHub</span>
              </button>
              <button className="social-btn">
                <svg className="social-icon" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>Google</span>
              </button>
            </div>

            {/* Sign In Link */}
            <div className="form-footer">
              <p className="footer-text">
                Already have an account? 
                <a href="/login" className="signin-link">Login</a>
              </p>
            </div>
          </div>
        </div>

        {/* Right Side - Benefits */}
        <div className="register-benefits">
          <div className="benefits-content">
            <h2 className="benefits-title">Join thousands of businesses</h2>
            <p className="benefits-subtitle">
              Experience the power of modern financial technology
            </p>
            
            <div className="benefits-list">
              <div className="benefit-item">
                <div className="benefit-icon">
                  <svg viewBox="0 0 24 24" fill="none" className="icon">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="benefit-content">
                  <h3 className="benefit-title">Secure & Compliant</h3>
                  <p className="benefit-description">Bank-level security with SOC 2 compliance and end-to-end encryption</p>
                </div>
              </div>

              <div className="benefit-item">
                <div className="benefit-icon">
                  <svg viewBox="0 0 24 24" fill="none" className="icon">
                    <path d="M13 10V3L4 14h7v7l9-11h-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="benefit-content">
                  <h3 className="benefit-title">Lightning Fast</h3>
                  <p className="benefit-description">Process payments and get insights in real-time with our optimized infrastructure</p>
                </div>
              </div>

              <div className="benefit-item">
                <div className="benefit-icon">
                  <svg viewBox="0 0 24 24" fill="none" className="icon">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="benefit-content">
                  <h3 className="benefit-title">Powerful APIs</h3>
                  <p className="benefit-description">Integrate seamlessly with comprehensive APIs and extensive documentation</p>
                </div>
              </div>

              <div className="benefit-item">
                <div className="benefit-icon">
                  <svg viewBox="0 0 24 24" fill="none" className="icon">
                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75M13 7a4 4 0 11-8 0 4 4 0 018 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="benefit-content">
                  <h3 className="benefit-title">24/7 Support</h3>
                  <p className="benefit-description">Get help when you need it with our dedicated support team</p>
                </div>
              </div>
            </div>

            <div className="stats">
              <div className="stat-item">
                <div className="stat-number">10K+</div>
                <div className="stat-label">Active Users</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">$2B+</div>
                <div className="stat-label">Processed</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">99.9%</div>
                <div className="stat-label">Uptime</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;