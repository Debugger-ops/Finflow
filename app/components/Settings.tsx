'use client';
import React, { useState } from 'react';
import {
  User,
  Bell,
  Shield,
  Palette,
  Globe,
  CreditCard,
  Smartphone,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Download,
  Upload,
  Trash2,
  HelpCircle,
  LogOut,
  Moon,
  Sun,
  Vibrate,
  DollarSign,
  Calendar,
  BarChart3,
  Target,
  Settings as SettingsIcon,
  ChevronRight,
  CheckCircle,
  AlertTriangle,
  Info
} from 'lucide-react';
import './settings.css';

import { SettingToggleProps, SettingSelectProps, SettingInputProps, SelectProps } from "../models/props";
// For the different sections of settings
type Section = "profile" | "notifications" | "security" | "preferences" | "privacy";


type SettingValue = string | number | boolean;


const Settings = () => {
  const [activeSection, setActiveSection] = useState('profile');
  const [settings, setSettings] = useState({
    profile: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@email.com',
      phone: '+1 (555) 123-4567',
      dateOfBirth: '1990-05-15',
      address: '123 Main St, San Francisco, CA 94105'
    },
    notifications: {
      pushNotifications: true,
      emailNotifications: true,
      transactionAlerts: true,
      budgetAlerts: true,
      goalReminders: true,
      marketingEmails: false,
      weeklyReports: true,
      monthlyStatements: true
    },
    security: {
      biometricAuth: true,
      twoFactorAuth: false,
      sessionTimeout: 15,
      autoLock: true,
      loginAlerts: true
    },
    preferences: {
      theme: 'system',
      currency: 'USD',
      language: 'English',
      dateFormat: 'MM/DD/YYYY',
      numberFormat: 'US',
      startOfWeek: 'Sunday'
    },
    privacy: {
      dataSharing: false,
      analytics: true,
      personalizedAds: false,
      locationTracking: false
    }
  });

  const [showChangePassword, setShowChangePassword] = useState(false);


  const updateSetting = (section: Section, key: string, value: SettingValue) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
  };



  const SettingToggle: React.FC<SettingToggleProps> = ({ enabled, onChange, label, description }) => (
    <div className="setting-item">
      <div className="setting-info">
        <h4 className="setting-label">{label}</h4>
        {description && <p className="setting-description">{description}</p>}
      </div>
      <button
        onClick={() => onChange(!enabled)}
        className={`toggle ${enabled ? "enabled" : "disabled"}`}
      >
        <div className="toggle-slider"></div>
      </button>
    </div>
  );

  const SettingSelect: React.FC<SettingSelectProps> = ({
    value,
    onChange,
    options,
    label,
    description
  }) => (
    <div className="setting-item">
      <div className="setting-info">
        <h4 className="setting-label">{label}</h4>
        {description && <p className="setting-description">{description}</p>}
      </div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="setting-select"
      >
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );

  const SettingInput: React.FC<SettingInputProps> = ({
    value,
    onChange,
    label,
    description,
    type = 'text',
    placeholder
  }) => (
    <div className="setting-item">
      <div className="setting-info">
        <h4 className="setting-label">{label}</h4>
        {description && <p className="setting-description">{description}</p>}
      </div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="setting-input"
      />
    </div>
  );


  const renderProfile = () => (
    <div className="settings-section">
      <div className="section-header">
        <h3>Profile Information</h3>
        <p>Update your personal details and contact information</p>
      </div>

      <div className="profile-avatar-section">
        <div className="avatar-container">
          <div className="current-avatar">
            <User className="avatar-icon" />
          </div>
          <button className="change-avatar-btn">
            <Upload className="small-icon" />
            Change Photo
          </button>
        </div>
      </div>

      <div className="settings-grid">
        <SettingInput
          value={settings.profile.firstName}
          onChange={(value) => updateSetting('profile', 'firstName', value)}
          label="First Name"
          placeholder="Enter your first name"
        />
        <SettingInput
          value={settings.profile.lastName}
          onChange={(value) => updateSetting('profile', 'lastName', value)}
          label="Last Name"
          placeholder="Enter your last name"
        />
        <SettingInput
          value={settings.profile.email}
          onChange={(value) => updateSetting('profile', 'email', value)}
          label="Email Address"
          type="email"
          placeholder="Enter your email"
        />
        <SettingInput
          value={settings.profile.phone}
          onChange={(value) => updateSetting('profile', 'phone', value)}
          label="Phone Number"
          type="tel"
          placeholder="Enter your phone number"
        />
        <SettingInput
          value={settings.profile.dateOfBirth}
          onChange={(value) => updateSetting('profile', 'dateOfBirth', value)}
          label="Date of Birth"
          type="date"
        />
        <SettingInput
          value={settings.profile.address}
          onChange={(value) => updateSetting('profile', 'address', value)}
          label="Address"
          placeholder="Enter your address"
        />
      </div>

      <div className="section-actions">
        <button className="save-btn">
          <CheckCircle className="small-icon" />
          Save Changes
        </button>
      </div>
    </div>
  );

  const renderNotifications = () => (
    <div className="settings-section">
      <div className="section-header">
        <h3>Notification Settings</h3>
        <p>Choose how you want to be notified about your account activity</p>
      </div>

      <div className="notification-categories">
        <div className="category-group">
          <h4 className="category-title">General Notifications</h4>
          <SettingToggle
            enabled={settings.notifications.pushNotifications}
            onChange={(value) => updateSetting('notifications', 'pushNotifications', value)}
            label="Push Notifications"
            description="Receive notifications on your device"
          />
          <SettingToggle
            enabled={settings.notifications.emailNotifications}
            onChange={(value) => updateSetting('notifications', 'emailNotifications', value)}
            label="Email Notifications"
            description="Receive notifications via email"
          />
        </div>

        <div className="category-group">
          <h4 className="category-title">Account Activity</h4>
          <SettingToggle
            enabled={settings.notifications.transactionAlerts}
            onChange={(value) => updateSetting('notifications', 'transactionAlerts', value)}
            label="Transaction Alerts"
            description="Get notified for all transactions"
          />
          <SettingToggle
            enabled={settings.notifications.budgetAlerts}
            onChange={(value) => updateSetting('notifications', 'budgetAlerts', value)}
            label="Budget Alerts"
            description="Alerts when you exceed budget limits"
          />
          <SettingToggle
            enabled={settings.notifications.goalReminders}
            onChange={(value) => updateSetting('notifications', 'goalReminders', value)}
            label="Goal Reminders"
            description="Reminders about your financial goals"
          />
        </div>

        <div className="category-group">
          <h4 className="category-title">Reports & Updates</h4>
          <SettingToggle
            enabled={settings.notifications.weeklyReports}
            onChange={(value) => updateSetting('notifications', 'weeklyReports', value)}
            label="Weekly Reports"
            description="Weekly summary of your finances"
          />
          <SettingToggle
            enabled={settings.notifications.monthlyStatements}
            onChange={(value) => updateSetting('notifications', 'monthlyStatements', value)}
            label="Monthly Statements"
            description="Monthly account statements"
          />
          <SettingToggle
            enabled={settings.notifications.marketingEmails}
            onChange={(value) => updateSetting('notifications', 'marketingEmails', value)}
            label="Marketing Emails"
            description="Promotional and marketing content"
          />
        </div>
      </div>
    </div>
  );

  const renderSecurity = () => (
    <div className="settings-section">
      <div className="section-header">
        <h3>Security & Privacy</h3>
        <p>Manage your account security and authentication methods</p>
      </div>

      <div className="security-categories">
        <div className="category-group">
          <h4 className="category-title">Authentication</h4>
          <SettingToggle
            enabled={settings.security.biometricAuth}
            onChange={(value) => updateSetting('security', 'biometricAuth', value)}
            label="Biometric Authentication"
            description="Use fingerprint or face recognition"
          />
          <SettingToggle
            enabled={settings.security.twoFactorAuth}
            onChange={(value) => updateSetting('security', 'twoFactorAuth', value)}
            label="Two-Factor Authentication"
            description="Extra security with SMS or authenticator app"
          />

          <div className="setting-item action-item">
            <div className="setting-info">
              <h4 className="setting-label">Change Password</h4>
              <p className="setting-description">Update your account password</p>
            </div>
            <button
              onClick={() => setShowChangePassword(true)}
              className="action-btn"
            >
              <Lock className="small-icon" />
              Change
            </button>
          </div>
        </div>

        <div className="category-group">
          <h4 className="category-title">Session Management</h4>
          <SettingSelect
            value={settings.security.sessionTimeout.toString()}
            onChange={(value) => updateSetting('security', 'sessionTimeout', parseInt(value))}
            label="Session Timeout"
            description="Automatically sign out after inactivity"
            options={[
              { value: '5', label: '5 minutes' },
              { value: '15', label: '15 minutes' },
              { value: '30', label: '30 minutes' },
              { value: '60', label: '1 hour' },
              { value: '0', label: 'Never' }
            ]}
          />


          <SettingToggle
            enabled={settings.security.autoLock}
            onChange={(value) => updateSetting('security', 'autoLock', value)}
            label="Auto-Lock"
            description="Lock app when switching to other apps"
          />
          <SettingToggle
            enabled={settings.security.loginAlerts}
            onChange={(value) => updateSetting('security', 'loginAlerts', value)}
            label="Login Alerts"
            description="Get notified of new login attempts"
          />
        </div>

        <div className="category-group">
          <h4 className="category-title">Data & Privacy</h4>
          <SettingToggle
            enabled={settings.privacy.dataSharing}
            onChange={(value) => updateSetting('privacy', 'dataSharing', value)}
            label="Data Sharing"
            description="Share anonymized data for service improvement"
          />
          <SettingToggle
            enabled={settings.privacy.analytics}
            onChange={(value) => updateSetting('privacy', 'analytics', value)}
            label="Analytics"
            description="Help improve the app with usage analytics"
          />
          <SettingToggle
            enabled={settings.privacy.personalizedAds}
            onChange={(value) => updateSetting('privacy', 'personalizedAds', value)}
            label="Personalized Ads"
            description="Show relevant ads based on your activity"
          />
        </div>
      </div>
    </div>
  );

  const renderPreferences = () => (
    <div className="settings-section">
      <div className="section-header">
        <h3>App Preferences</h3>
        <p>Customize how the app looks and behaves</p>
      </div>

      <div className="preferences-categories">
        <div className="category-group">
          <h4 className="category-title">Appearance</h4>
          <SettingSelect
            value={settings.preferences.theme}
            onChange={(value) => updateSetting('preferences', 'theme', value)}
            label="Theme"
            description="Choose your preferred app theme"
            options={[
              { value: 'light', label: 'Light' },
              { value: 'dark', label: 'Dark' },
              { value: 'system', label: 'Follow System' }
            ]}
          />
        </div>

        <div className="category-group">
          <h4 className="category-title">Localization</h4>
          <SettingSelect
            value={settings.preferences.currency}
            onChange={(value) => updateSetting('preferences', 'currency', value)}
            label="Currency"
            description="Default currency for displays"
            options={[
              { value: 'USD', label: 'US Dollar ($)' },
              { value: 'EUR', label: 'Euro (€)' },
              { value: 'GBP', label: 'British Pound (£)' },
              { value: 'JPY', label: 'Japanese Yen (¥)' },
              { value: 'CAD', label: 'Canadian Dollar (C$)' }
            ]}
          />
          <SettingSelect
            value={settings.preferences.language}
            onChange={(value) => updateSetting('preferences', 'language', value)}
            label="Language"
            description="App language"
            options={[
              { value: 'English', label: 'English' },
              { value: 'Spanish', label: 'Español' },
              { value: 'French', label: 'Français' },
              { value: 'German', label: 'Deutsch' },
              { value: 'Japanese', label: '日本語' }
            ]}
          />
          <SettingSelect
            value={settings.preferences.dateFormat}
            onChange={(value) => updateSetting('preferences', 'dateFormat', value)}
            label="Date Format"
            description="How dates are displayed"
            options={[
              { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
              { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
              { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' }
            ]}
          />
        </div>

        <div className="category-group">
          <h4 className="category-title">Other Preferences</h4>
          <SettingSelect
            value={settings.preferences.startOfWeek}
            onChange={(value) => updateSetting('preferences', 'startOfWeek', value)}
            label="Start of Week"
            description="First day of the week for calendar views"
            options={[
              { value: 'Sunday', label: 'Sunday' },
              { value: 'Monday', label: 'Monday' }
            ]}
          />
        </div>
      </div>
    </div>
  );

  const renderSupport = () => (
    <div className="settings-section">
      <div className="section-header">
        <h3>Help & Support</h3>
        <p>Get help and manage your account</p>
      </div>

      <div className="support-options">
        <div className="support-item">
          <div className="support-icon">
            <HelpCircle className="icon" />
          </div>
          <div className="support-content">
            <h4>Help Center</h4>
            <p>Browse our comprehensive help articles</p>
          </div>
          <ChevronRight className="chevron" />
        </div>

        <div className="support-item">
          <div className="support-icon">
            <Mail className="icon" />
          </div>
          <div className="support-content">
            <h4>Contact Support</h4>
            <p>Get in touch with our support team</p>
          </div>
          <ChevronRight className="chevron" />
        </div>

        <div className="support-item">
          <div className="support-icon">
            <Download className="icon" />
          </div>
          <div className="support-content">
            <h4>Export Data</h4>
            <p>Download your account data and transactions</p>
          </div>
          <ChevronRight className="chevron" />
        </div>

        <div className="support-item danger">
          <div className="support-icon">
            <Trash2 className="icon" />
          </div>
          <div className="support-content">
            <h4>Delete Account</h4>
            <p>Permanently delete your account and all data</p>
          </div>
          <ChevronRight className="chevron" />
        </div>

        <div className="support-item danger">
          <div className="support-icon">
            <LogOut className="icon" />
          </div>
          <div className="support-content">
            <h4>Sign Out</h4>
            <p>Sign out of your account</p>
          </div>
          <ChevronRight className="chevron" />
        </div>
      </div>

      <div className="app-info">
        <div className="info-item">
          <span className="info-label">App Version</span>
          <span className="info-value">2.1.0</span>
        </div>
        <div className="info-item">
          <span className="info-label">Build</span>
          <span className="info-value">2025.01.15</span>
        </div>
        <div className="info-item">
          <span className="info-label">Last Updated</span>
          <span className="info-value">January 15, 2025</span>
        </div>
      </div>
    </div>
  );

  const sidebarItems = [
    { id: 'profile', label: 'Profile', icon: <User className="icon" /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell className="icon" /> },
    { id: 'security', label: 'Security', icon: <Shield className="icon" /> },
    { id: 'preferences', label: 'Preferences', icon: <Palette className="icon" /> },
    { id: 'support', label: 'Support', icon: <HelpCircle className="icon" /> }
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'profile': return renderProfile();
      case 'notifications': return renderNotifications();
      case 'security': return renderSecurity();
      case 'preferences': return renderPreferences();
      case 'support': return renderSupport();
      default: return renderProfile();
    }
  };

  return (
    <div className="settings-container">
      <div className="settings-sidebar">
        <div className="sidebar-header">
          <h2>Settings</h2>
        </div>
        <nav className="sidebar-nav">
          {sidebarItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`sidebar-item ${activeSection === item.id ? 'active' : ''}`}
            >
              {item.icon}
              <span>{item.label}</span>
              <ChevronRight className="chevron" />
            </button>
          ))}
        </nav>
      </div>

      <div className="settings-content">
        {renderContent()}
      </div>
      {showChangePassword && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Change Password</h3>
              <button className="close-btn" onClick={() => setShowChangePassword(false)}>
                &times;
              </button>
            </div>
            <div className="modal-body">
              <SettingInput
                value=""
                onChange={() => { }}
                label="Current Password"
                type="password"
                placeholder="Enter current password"
              />
              <SettingInput
                value=""
                onChange={() => { }}
                label="New Password"
                type="password"
                placeholder="Enter new password"
              />
              <SettingInput
                value=""
                onChange={() => { }}
                label="Confirm New Password"
                type="password"
                placeholder="Re-enter new password"
              />
            </div>
            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setShowChangePassword(false)}>
                Cancel
              </button>
              <button className="save-btn">
                <CheckCircle className="small-icon" />
                Save Password
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default Settings;