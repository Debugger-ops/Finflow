// app/profile/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { 
  User, Mail, Camera, Save, Shield, Bell, Palette, ArrowLeft, 
  Phone, MapPin, Briefcase, Calendar, Globe, Github, Linkedin, 
  Twitter, Instagram, Lock, Trash2, Download, Upload, Eye, EyeOff,
  Check, X, AlertCircle, Settings, LogOut, CreditCard, Activity,
  Loader2
} from 'lucide-react';
import './profile.css';
import { useRouter } from "next/navigation";

interface UserProfile {
  name: string;
  email: string;
  bio: string;
  image: string;
  phone: string;
  location: string;
  occupation: string;
  dateOfBirth: string;
  website: string;
  github: string;
  linkedin: string;
  twitter: string;
  instagram: string;
}

interface ActivityLog {
  id: string;
  action: string;
  timestamp: string;
  device: string;
  location: string;
}

interface SessionData {
  id: string;
  device: string;
  location: string;
  createdAt: string;
  isCurrent: boolean;
}

const ProfilePage: React.FC = () => {
  const { data: session, update } = useSession();
  const router = useRouter();
  
  const [profile, setProfile] = useState<UserProfile>({
    name: session?.user?.name || '',
    email: session?.user?.email || '',
    bio: '',
    image: session?.user?.image || '',
    phone: '',
    location: '',
    occupation: '',
    dateOfBirth: '',
    website: '',
    github: '',
    linkedin: '',
    twitter: '',
    instagram: '',
  });

  const [activeTab, setActiveTab] = useState<'general' | 'security' | 'notifications' | 'appearance' | 'privacy' | 'activity'>('general');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState({
    current: false,
    new: false,
    confirm: false
  });
// Format YYYY-MM-DD → DD/MM/YYYY
const formatDateForDisplay = (isoDate: string) => {
  if (!isoDate) return '';
  const date = new Date(isoDate);
  if (isNaN(date.getTime())) return '';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const parseDateFromDisplay = (displayDate: string) => {
  const parts = displayDate.split('/');
  if (parts.length !== 3) return ''; // invalid
  const [day, month, year] = parts;
  // basic validation
  if (+day < 1 || +day > 31 || +month < 1 || +month > 12) return '';
  return `${year}-${month.padStart(2,'0')}-${day.padStart(2,'0')}`;
};


  // Password fields
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Password validation state
  const [passwordRequirements, setPasswordRequirements] = useState({
    minLength: false,
    hasUppercase: false,
    hasNumber: false,
    hasSpecial: false
  });

  // Notification preferences
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    marketing: true,
    security: true,
    updates: false,
    mentions: true,
    comments: true
  });

  // Privacy settings
  const [privacy, setPrivacy] = useState({
    profileVisibility: 'public',
    showEmail: false,
    showPhone: false,
    showLocation: true,
    allowMessages: true,
    showActivity: false,
    searchable: true
  });

  // Appearance settings
  const [appearance, setAppearance] = useState({
    darkMode: true,
    compactView: false,
    fontSize: 'medium',
    language: 'en',
    theme: 'default'
  });

  // Activity logs
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [sessions, setSessions] = useState<SessionData[]>([]);

  // Delete account state
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deletePassword, setDeletePassword] = useState('');

  // Load user data on mount
  useEffect(() => {
    if (session?.user) {
      loadUserData();
    }
  }, [session]);

  // Validate password in real-time
  useEffect(() => {
    if (passwords.newPassword) {
      setPasswordRequirements({
        minLength: passwords.newPassword.length >= 8,
        hasUppercase: /[A-Z]/.test(passwords.newPassword),
        hasNumber: /[0-9]/.test(passwords.newPassword),
        hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(passwords.newPassword)
      });
    }
  }, [passwords.newPassword]);

  const loadUserData = async () => {
    try {
      setLoading(true);
      
      // Load all settings in parallel
      const [notificationsRes, privacyRes, appearanceRes, activityRes, sessionsRes] = await Promise.all([
        fetch('/api/profile/notifications'),
        fetch('/api/profile/privacy'),
        fetch('/api/profile/appearance'),
        fetch('/api/profile/activity'),
        fetch('/api/profile/sessions')
      ]);

      if (notificationsRes.ok) {
        const data = await notificationsRes.json();
        if (data.success) {
          setNotifications({
            email: data.data.emailNotifications,
            push: data.data.pushNotifications,
            marketing: data.data.marketingNotifications,
            security: data.data.securityNotifications,
            updates: data.data.updateNotifications,
            mentions: data.data.mentionNotifications,
            comments: data.data.commentNotifications,
          });
        }
      }

      if (privacyRes.ok) {
        const data = await privacyRes.json();
        if (data.success) {
          setPrivacy(data.data);
        }
      }

      if (appearanceRes.ok) {
        const data = await appearanceRes.json();
        if (data.success) {
          setAppearance(data.data);
        }
      }

      if (activityRes.ok) {
        const data = await activityRes.json();
        if (data.success) {
          setActivityLogs(data.data.activities);
        }
      }

      if (sessionsRes.ok) {
        const data = await sessionsRes.json();
        if (data.success) {
          setSessions(data.data);
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
  e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
) => {
  const { name, value } = e.target;

  setProfile((prev) => ({
    ...prev,
    [name]: value,
  }));
};


  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswords(prev => ({ ...prev, [name]: value }));
  };

 const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  // Check file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    alert('Image size must be less than 5MB');
    return;
  }

  // Preview locally
  const reader = new FileReader();
  reader.onloadend = () => {
    setProfile(prev => ({ ...prev, image: reader.result as string }));
  };
  reader.readAsDataURL(file);

  // Upload to server
  try {
    const formData = new FormData();
    formData.append('image', file);

    const res = await fetch('/api/profile/upload-image', {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      throw new Error('Upload failed');
    }

    const data = await res.json();
    if (data.success) {
      console.log('Image uploaded successfully');
    }
  } catch (error) {
    console.error('Image upload error:', error);
    alert('Failed to upload image');
  }
};

  const handleNotificationToggle = async (key: string) => {
    const newNotifications = { ...notifications, [key]: !notifications[key as keyof typeof notifications] };
    setNotifications(newNotifications);

    // Save to backend
    try {
      const res = await fetch('/api/profile/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailNotifications: newNotifications.email,
          pushNotifications: newNotifications.push,
          marketingNotifications: newNotifications.marketing,
          securityNotifications: newNotifications.security,
          updateNotifications: newNotifications.updates,
          mentionNotifications: newNotifications.mentions,
          commentNotifications: newNotifications.comments,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to update notifications');
      }
    } catch (error) {
      console.error('Error updating notifications:', error);
      // Revert on error
      setNotifications(notifications);
      alert('Failed to update notification settings');
    }
  };

  const handlePrivacyToggle = async (key: string) => {
    const newPrivacy = { ...privacy, [key]: !privacy[key as keyof typeof privacy] };
    setPrivacy(newPrivacy);

    // Save to backend
    try {
      const res = await fetch('/api/profile/privacy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPrivacy),
      });

      if (!res.ok) {
        throw new Error('Failed to update privacy settings');
      }
    } catch (error) {
      console.error('Error updating privacy:', error);
      setPrivacy(privacy);
      alert('Failed to update privacy settings');
    }
  };

  const handlePrivacySelectChange = async (key: string, value: string) => {
    const newPrivacy = { ...privacy, [key]: value };
    setPrivacy(newPrivacy);

    try {
      const res = await fetch('/api/profile/privacy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPrivacy),
      });

      if (!res.ok) {
        throw new Error('Failed to update privacy settings');
      }
    } catch (error) {
      console.error('Error updating privacy:', error);
      setPrivacy(privacy);
      alert('Failed to update privacy settings');
    }
  };

  const handleAppearanceChange = async (key: string, value: any) => {
    const newAppearance = { ...appearance, [key]: value };
    setAppearance(newAppearance);

    // Save to backend
    try {
      const res = await fetch('/api/profile/appearance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAppearance),
      });

      if (!res.ok) {
        throw new Error('Failed to update appearance settings');
      }
    } catch (error) {
      console.error('Error updating appearance:', error);
      setAppearance(appearance);
      alert('Failed to update appearance settings');
    }
  };

 const handleSave = async () => {
  setIsSaving(true);
  try {
    const dob = profile.dateOfBirth ? new Date(profile.dateOfBirth) : null;
    if (dob && isNaN(dob.getTime())) {
      alert('Invalid date of birth');
      setIsSaving(false);
      return;
    }

    const payload = {
      ...profile,
      dateOfBirth: dob ? dob.toISOString() : null,
      // Don't send base64 images to backend - requires file upload endpoint
      image: profile.image && profile.image.startsWith('data:') ? null : profile.image,
    };

    const res = await fetch('/api/profile/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (data.success) {
      alert('Profile updated successfully!');
      setIsEditing(false);
    } else {
      console.error('Update failed:', data);
      const errorMsg = data.error || 'Failed to update profile';
      const detailsMsg = data.details ? JSON.stringify(data.details, null, 2) : '';
      alert(`${errorMsg}${detailsMsg ? '\n\nDetails:\n' + detailsMsg : ''}`);
    }
  } catch (err) {
    console.error('Save error:', err);
    alert('Error updating profile');
  } finally {
    setIsSaving(false);
  }
};



  const handlePasswordUpdate = async () => {
    // Validate passwords
    if (!passwords.currentPassword || !passwords.newPassword || !passwords.confirmPassword) {
      alert('Please fill in all password fields');
      return;
    }

    if (passwords.newPassword !== passwords.confirmPassword) {
      alert('New passwords do not match');
      return;
    }

    // Check all requirements are met
    if (!Object.values(passwordRequirements).every(req => req)) {
      alert('Password does not meet all requirements');
      return;
    }

    try {
      const res = await fetch('/api/profile/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(passwords),
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to change password');
      }

      alert('Password updated successfully!');
      setShowPasswordFields(false);
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleExportData = async () => {
    try {
      const res = await fetch('/api/profile/export');
      
      if (!res.ok) {
        throw new Error('Failed to export data');
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `profile-data-${new Date().toISOString()}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Failed to export data');
    }
  };

  const handleTerminateSession = async (sessionId: string) => {
    if (!confirm('Are you sure you want to terminate this session?')) {
      return;
    }

    try {
      const res = await fetch(`/api/profile/sessions?sessionId=${sessionId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Failed to terminate session');
      }

      // Reload sessions
      const sessionsRes = await fetch('/api/profile/sessions');
      if (sessionsRes.ok) {
        const data = await sessionsRes.json();
        if (data.success) {
          setSessions(data.data);
        }
      }

      alert('Session terminated successfully');
    } catch (error) {
      console.error('Error terminating session:', error);
      alert('Failed to terminate session');
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'DELETE') {
      alert('Please type DELETE to confirm');
      return;
    }

    if (!deletePassword) {
      alert('Please enter your password');
      return;
    }

    try {
      const res = await fetch('/api/profile/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: deletePassword,
          confirmation: deleteConfirmation,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete account');
      }

      alert('Account deleted successfully. You will be logged out.');
      // Redirect to sign out
      window.location.href = '/api/auth/signout';
    } catch (error: any) {
      alert(error.message);
    }
  };

  if (loading) {
    return (
      <div className="profile-container">
        <div className="loading-container">
          <Loader2 className="spinner" size={48} />
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-wrapper">
        {/* Header */}
        <div className="profile-header">
          <div className="header-content">
            <button className="back-button" onClick={() => router.back()}>
              <ArrowLeft size={20} />
              Back
            </button>
            <div className="header-text">
              <h1>Profile Settings</h1>
              <p>Manage your account settings and preferences</p>
            </div>
          </div>
          <div className="header-actions">
            <button className="icon-button" title="Export Data" onClick={handleExportData}>
              <Download size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="profile-content">
          {/* Sidebar */}
          <div className="profile-sidebar">
            <button 
              className={`tab-button ${activeTab === 'general' ? 'active' : ''}`}
              onClick={() => setActiveTab('general')}
            >
              <User size={20} />
              <span>General</span>
            </button>
            <button 
              className={`tab-button ${activeTab === 'security' ? 'active' : ''}`}
              onClick={() => setActiveTab('security')}
            >
              <Shield size={20} />
              <span>Security</span>
            </button>
            <button 
              className={`tab-button ${activeTab === 'notifications' ? 'active' : ''}`}
              onClick={() => setActiveTab('notifications')}
            >
              <Bell size={20} />
              <span>Notifications</span>
            </button>
            <button 
              className={`tab-button ${activeTab === 'privacy' ? 'active' : ''}`}
              onClick={() => setActiveTab('privacy')}
            >
              <Lock size={20} />
              <span>Privacy</span>
            </button>
            <button 
              className={`tab-button ${activeTab === 'appearance' ? 'active' : ''}`}
              onClick={() => setActiveTab('appearance')}
            >
              <Palette size={20} />
              <span>Appearance</span>
            </button>
            <button 
              className={`tab-button ${activeTab === 'activity' ? 'active' : ''}`}
              onClick={() => setActiveTab('activity')}
            >
              <Activity size={20} />
              <span>Activity</span>
            </button>
          </div>

          {/* Main Content */}
          <div className="profile-main">
            {/* General Tab */}
            {activeTab === 'general' && (
              <div className="tab-content">
                <div className="section-header">
                  <h2>General Information</h2>
                  {!isEditing ? (
                    <button className="edit-button" onClick={() => setIsEditing(true)}>
                      Edit Profile
                    </button>
                  ) : (
                    <div className="button-group">
                      <button className="cancel-button" onClick={() => setIsEditing(false)}>
                        Cancel
                      </button>
                      <button 
                        className="save-button" 
                        onClick={handleSave}
                        disabled={isSaving}
                      >
                        {isSaving ? <Loader2 className="spinner" size={16} /> : <Save size={16} />}
                        {isSaving ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  )}
                </div>

                {/* Profile Picture */}
                <div className="profile-picture-section">
                  <div className="avatar-container">
                    {profile.image ? (
                      <img src={profile.image} alt="Profile" className="profile-avatar" />
                    ) : (
                      <div className="profile-avatar-placeholder">
                        <User size={48} />
                      </div>
                    )}
                    {isEditing && (
                      <label className="avatar-upload">
                        <Camera size={20} />
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={handleImageChange}
                          hidden
                        />
                      </label>
                    )}
                  </div>
                  <div className="avatar-info">
                    <h3>{profile.name || 'User'}</h3>
                    <p className="premium-badge">Premium Member</p>
                    <p className="member-since">Member since {new Date(session?.user?.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</p>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="form-section">
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="name">
                        <User size={16} />
                        Full Name
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={profile.name}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        placeholder="Enter your name"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="email">
                        <Mail size={16} />
                        Email Address
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={profile.email}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        placeholder="Enter your email"
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="phone">
                        <Phone size={16} />
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={profile.phone}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="dateOfBirth">
                        <Calendar size={16} />
                        Date of Birth
                      </label>
                      <input
  type="text"
  id="dateOfBirth"
  name="dateOfBirth"
  value={formatDateForDisplay(profile.dateOfBirth)}
  onChange={(e) =>
    setProfile(prev => ({
      ...prev,
      dateOfBirth: parseDateFromDisplay(e.target.value)
    }))
  }
  disabled={!isEditing}
  placeholder="dd/mm/yyyy"
/>


                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="location">
                        <MapPin size={16} />
                        Location
                      </label>
                      <input
                        type="text"
                        id="location"
                        name="location"
                        value={profile.location}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        placeholder="City, Country"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="occupation">
                        <Briefcase size={16} />
                        Occupation
                      </label>
                      <input
                        type="text"
                        id="occupation"
                        name="occupation"
                        value={profile.occupation}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        placeholder="Your job title"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="bio">Bio</label>
                    <textarea
                      id="bio"
                      name="bio"
                      value={profile.bio}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      placeholder="Tell us about yourself"
                      rows={4}
                    />
                  </div>

                  {/* Social Links */}
                  <div className="section-divider">
                    <h3>Social Links</h3>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="website">
                        <Globe size={16} />
                        Website
                      </label>
                      <input
                        type="url"
                        id="website"
                        name="website"
                        value={profile.website}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        placeholder="https://yourwebsite.com"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="github">
                        <Github size={16} />
                        GitHub
                      </label>
                      <input
                        type="text"
                        id="github"
                        name="github"
                        value={profile.github}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        placeholder="username"
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="linkedin">
                        <Linkedin size={16} />
                        LinkedIn
                      </label>
                      <input
                        type="text"
                        id="linkedin"
                        name="linkedin"
                        value={profile.linkedin}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        placeholder="username"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="twitter">
                        <Twitter size={16} />
                        Twitter
                      </label>
                      <input
                        type="text"
                        id="twitter"
                        name="twitter"
                        value={profile.twitter}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        placeholder="@username"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="tab-content">
                <div className="section-header">
                  <h2>Security Settings</h2>
                </div>

                {/* Password Section */}
                <div className="security-section">
                  <div className="security-card">
                    <div className="security-card-header">
                      <div>
                        <h3>Password</h3>
                        <p>Change your password to keep your account secure</p>
                      </div>
                      {!showPasswordFields && (
                        <button 
                          className="secondary-button"
                          onClick={() => setShowPasswordFields(true)}
                        >
                          Change Password
                        </button>
                      )}
                    </div>

                    {showPasswordFields && (
                      <div className="form-section">
                        <div className="form-group">
                          <label htmlFor="current-password">Current Password</label>
                          <div className="password-input-wrapper">
                            <input
                              type={passwordVisible.current ? "text" : "password"}
                              id="current-password"
                              name="currentPassword"
                              value={passwords.currentPassword}
                              onChange={handlePasswordChange}
                              placeholder="Enter current password"
                            />
                            <button 
                              type="button"
                              className="password-toggle"
                              onClick={() => setPasswordVisible(prev => ({...prev, current: !prev.current}))}
                            >
                              {passwordVisible.current ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                          </div>
                        </div>
                        <div className="form-group">
                          <label htmlFor="new-password">New Password</label>
                          <div className="password-input-wrapper">
                            <input
                              type={passwordVisible.new ? "text" : "password"}
                              id="new-password"
                              name="newPassword"
                              value={passwords.newPassword}
                              onChange={handlePasswordChange}
                              placeholder="Enter new password"
                            />
                            <button 
                              type="button"
                              className="password-toggle"
                              onClick={() => setPasswordVisible(prev => ({...prev, new: !prev.new}))}
                            >
                              {passwordVisible.new ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                          </div>
                          <div className="password-requirements">
                            <p className={`requirement ${passwordRequirements.minLength ? '' : 'inactive'}`}>
                              {passwordRequirements.minLength ? <Check size={14} /> : <X size={14} />} At least 8 characters
                            </p>
                            <p className={`requirement ${passwordRequirements.hasUppercase ? '' : 'inactive'}`}>
                              {passwordRequirements.hasUppercase ? <Check size={14} /> : <X size={14} />} Contains uppercase letter
                            </p>
                            <p className={`requirement ${passwordRequirements.hasNumber ? '' : 'inactive'}`}>
                              {passwordRequirements.hasNumber ? <Check size={14} /> : <X size={14} />} Contains number
                            </p>
                            <p className={`requirement ${passwordRequirements.hasSpecial ? '' : 'inactive'}`}>
                              {passwordRequirements.hasSpecial ? <Check size={14} /> : <X size={14} />} Contains special character
                            </p>
                          </div>
                        </div>
                        <div className="form-group">
                          <label htmlFor="confirm-password">Confirm Password</label>
                          <div className="password-input-wrapper">
                            <input
                              type={passwordVisible.confirm ? "text" : "password"}
                              id="confirm-password"
                              name="confirmPassword"
                              value={passwords.confirmPassword}
                              onChange={handlePasswordChange}
                              placeholder="Confirm new password"
                            />
                            <button 
                              type="button"
                              className="password-toggle"
                              onClick={() => setPasswordVisible(prev => ({...prev, confirm: !prev.confirm}))}
                            >
                              {passwordVisible.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                          </div>
                        </div>
                        <div className="button-group">
                          <button 
                            className="cancel-button"
                            onClick={() => {
                              setShowPasswordFields(false);
                              setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
                            }}
                          >
                            Cancel
                          </button>
                          <button className="save-button" onClick={handlePasswordUpdate}>
                            Update Password
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Two-Factor Authentication */}
                  <div className="security-card">
                    <div className="security-card-header">
                      <div>
                        <h3>Two-Factor Authentication</h3>
                        <p>Add an extra layer of security to your account</p>
                      </div>
                      <button className="secondary-button" disabled>
                        Enable 2FA (Coming Soon)
                      </button>
                    </div>
                  </div>

                  {/* Active Sessions */}
                  <div className="security-card">
                    <div className="security-card-header">
                      <div>
                        <h3>Active Sessions</h3>
                        <p>Manage your active sessions across devices</p>
                      </div>
                    </div>
                    <div className="sessions-list">
                      {sessions.map(session => (
                        <div key={session.id} className={`session-item ${session.isCurrent ? 'current' : ''}`}>
                          <div className="session-info">
                            <h4>{session.isCurrent ? 'Current Session' : session.device}</h4>
                            <p>{session.device} • {session.location}</p>
                            <span className="session-time">
                              {session.isCurrent ? 'Active now' : new Date(session.createdAt).toLocaleString()}
                            </span>
                          </div>
                          {session.isCurrent ? (
                            <span className="current-badge">Current</span>
                          ) : (
                            <button 
                              className="logout-session-button"
                              onClick={() => handleTerminateSession(session.id)}
                            >
                              Logout
                            </button>
                          )}
                        </div>
                      ))}
                      {sessions.length === 0 && (
                        <p className="no-data">No active sessions found</p>
                      )}
                    </div>
                  </div>

                  {/* Danger Zone */}
                  <div className="danger-zone">
                    <h3>Danger Zone</h3>
                    <div className="danger-actions">
                      <div className="danger-item">
                        <div>
                          <h4>Export Account Data</h4>
                          <p>Download all your account data</p>
                        </div>
                        <button className="secondary-button" onClick={handleExportData}>
                          <Download size={16} />
                          Export Data
                        </button>
                      </div>
                      <div className="danger-item">
                        <div>
                          <h4>Delete Account</h4>
                          <p>Permanently delete your account and all data</p>
                        </div>
                        <button 
                          className="danger-button"
                          onClick={() => setShowDeleteModal(true)}
                        >
                          <Trash2 size={16} />
                          Delete Account
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="tab-content">
                <div className="section-header">
                  <h2>Notification Preferences</h2>
                  <p className="section-description">Choose what notifications you want to receive</p>
                </div>
                <div className="settings-list">
                  <div className="settings-category">
                    <h3>Email Notifications</h3>
                    <div className="setting-item">
                      <div className="setting-info">
                        <h4>Email Notifications</h4>
                        <p>Receive important updates via email</p>
                      </div>
                      <label className="toggle-switch">
                        <input 
                          type="checkbox" 
                          checked={notifications.email}
                          onChange={() => handleNotificationToggle('email')}
                        />
                        <span className="slider"></span>
                      </label>
                    </div>
                    <div className="setting-item">
                      <div className="setting-info">
                        <h4>Marketing Emails</h4>
                        <p>Receive updates about new features and offers</p>
                      </div>
                      <label className="toggle-switch">
                        <input 
                          type="checkbox" 
                          checked={notifications.marketing}
                          onChange={() => handleNotificationToggle('marketing')}
                        />
                        <span className="slider"></span>
                      </label>
                    </div>
                  </div>

                  <div className="settings-category">
                    <h3>Push Notifications</h3>
                    <div className="setting-item">
                      <div className="setting-info">
                        <h4>Push Notifications</h4>
                        <p>Receive push notifications on your devices</p>
                      </div>
                      <label className="toggle-switch">
                        <input 
                          type="checkbox" 
                          checked={notifications.push}
                          onChange={() => handleNotificationToggle('push')}
                        />
                        <span className="slider"></span>
                      </label>
                    </div>
                    <div className="setting-item">
                      <div className="setting-info">
                        <h4>Security Alerts</h4>
                        <p>Get notified about security-related activities</p>
                      </div>
                      <label className="toggle-switch">
                        <input 
                          type="checkbox" 
                          checked={notifications.security}
                          onChange={() => handleNotificationToggle('security')}
                        />
                        <span className="slider"></span>
                      </label>
                    </div>
                  </div>

                  <div className="settings-category">
                    <h3>Activity Notifications</h3>
                    <div className="setting-item">
                      <div className="setting-info">
                        <h4>Comments</h4>
                        <p>When someone comments on your posts</p>
                      </div>
                      <label className="toggle-switch">
                        <input 
                          type="checkbox" 
                          checked={notifications.comments}
                          onChange={() => handleNotificationToggle('comments')}
                        />
                        <span className="slider"></span>
                      </label>
                    </div>
                    <div className="setting-item">
                      <div className="setting-info">
                        <h4>Mentions</h4>
                        <p>When someone mentions you</p>
                      </div>
                      <label className="toggle-switch">
                        <input 
                          type="checkbox" 
                          checked={notifications.mentions}
                          onChange={() => handleNotificationToggle('mentions')}
                        />
                        <span className="slider"></span>
                      </label>
                    </div>
                    <div className="setting-item">
                      <div className="setting-info">
                        <h4>Product Updates</h4>
                        <p>News about product updates and improvements</p>
                      </div>
                      <label className="toggle-switch">
                        <input 
                          type="checkbox" 
                          checked={notifications.updates}
                          onChange={() => handleNotificationToggle('updates')}
                        />
                        <span className="slider"></span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Privacy Tab */}
            {activeTab === 'privacy' && (
              <div className="tab-content">
                <div className="section-header">
                  <h2>Privacy Settings</h2>
                  <p className="section-description">Control who can see your information</p>
                </div>
                <div className="settings-list">
                  <div className="settings-category">
                    <h3>Profile Visibility</h3>
                    <div className="setting-item">
                      <div className="setting-info">
                        <h4>Profile Visibility</h4>
                        <p>Control who can see your profile</p>
                      </div>
                      <select 
                        className="select-input"
                        value={privacy.profileVisibility}
                        onChange={(e) => handlePrivacySelectChange('profileVisibility', e.target.value)}
                      >
                        <option value="public">Public</option>
                        <option value="private">Private</option>
                        <option value="friends">Friends Only</option>
                      </select>
                    </div>
                    <div className="setting-item">
                      <div className="setting-info">
                        <h4>Show Email Address</h4>
                        <p>Make your email visible to others</p>
                      </div>
                      <label className="toggle-switch">
                        <input 
                          type="checkbox" 
                          checked={privacy.showEmail}
                          onChange={() => handlePrivacyToggle('showEmail')}
                        />
                        <span className="slider"></span>
                      </label>
                    </div>
                    <div className="setting-item">
                      <div className="setting-info">
                        <h4>Show Phone Number</h4>
                        <p>Make your phone number visible to others</p>
                      </div>
                      <label className="toggle-switch">
                        <input 
                          type="checkbox" 
                          checked={privacy.showPhone}
                          onChange={() => handlePrivacyToggle('showPhone')}
                        />
                        <span className="slider"></span>
                      </label>
                    </div>
                    <div className="setting-item">
                      <div className="setting-info">
                        <h4>Show Location</h4>
                        <p>Display your location on your profile</p>
                      </div>
                      <label className="toggle-switch">
                        <input 
                          type="checkbox" 
                          checked={privacy.showLocation}
                          onChange={() => handlePrivacyToggle('showLocation')}
                        />
                        <span className="slider"></span>
                      </label>
                    </div>
                  </div>

                  <div className="settings-category">
                    <h3>Interactions</h3>
                    <div className="setting-item">
                      <div className="setting-info">
                        <h4>Allow Direct Messages</h4>
                        <p>Let others send you direct messages</p>
                      </div>
                      <label className="toggle-switch">
                        <input 
                          type="checkbox" 
                          checked={privacy.allowMessages}
                          onChange={() => handlePrivacyToggle('allowMessages')}
                        />
                        <span className="slider"></span>
                      </label>
                    </div>
                    <div className="setting-item">
                      <div className="setting-info">
                        <h4>Show Activity Status</h4>
                        <p>Show when you're online or active</p>
                      </div>
                      <label className="toggle-switch">
                        <input 
                          type="checkbox" 
                          checked={privacy.showActivity}
                          onChange={() => handlePrivacyToggle('showActivity')}
                        />
                        <span className="slider"></span>
                      </label>
                    </div>
                    <div className="setting-item">
                      <div className="setting-info">
                        <h4>Searchable Profile</h4>
                        <p>Allow others to find you via search</p>
                      </div>
                      <label className="toggle-switch">
                        <input 
                          type="checkbox" 
                          checked={privacy.searchable}
                          onChange={() => handlePrivacyToggle('searchable')}
                        />
                        <span className="slider"></span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Appearance Tab */}
            {activeTab === 'appearance' && (
              <div className="tab-content">
                <div className="section-header">
                  <h2>Appearance Settings</h2>
                  <p className="section-description">Customize how the app looks and feels</p>
                </div>
                <div className="settings-list">
                  <div className="settings-category">
                    <h3>Theme</h3>
                    <div className="setting-item">
                      <div className="setting-info">
                        <h4>Dark Mode</h4>
                        <p>Use dark theme for better visibility in low light</p>
                      </div>
                      <label className="toggle-switch">
                        <input 
                          type="checkbox" 
                          checked={appearance.darkMode}
                          onChange={() => handleAppearanceChange('darkMode', !appearance.darkMode)}
                        />
                        <span className="slider"></span>
                      </label>
                    </div>
                    <div className="setting-item">
                      <div className="setting-info">
                        <h4>Theme Color</h4>
                        <p>Choose your preferred color scheme</p>
                      </div>
                      <div className="theme-options">
                        <button className={`theme-option default ${appearance.theme === 'default' ? 'active' : ''}`}
                          onClick={() => handleAppearanceChange('theme', 'default')}>
                          Default
                        </button>
                        <button className={`theme-option blue ${appearance.theme === 'blue' ? 'active' : ''}`}
                          onClick={() => handleAppearanceChange('theme', 'blue')}>
                          Blue
                        </button>
                        <button className={`theme-option green ${appearance.theme === 'green' ? 'active' : ''}`}
                          onClick={() => handleAppearanceChange('theme', 'green')}>
                          Green
                        </button>
                        <button className={`theme-option purple ${appearance.theme === 'purple' ? 'active' : ''}`}
                          onClick={() => handleAppearanceChange('theme', 'purple')}>
                          Purple
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="settings-category">
                    <h3>Display</h3>
                    <div className="setting-item">
                      <div className="setting-info">
                        <h4>Compact View</h4>
                        <p>Reduce spacing and padding for more content</p>
                      </div>
                      <label className="toggle-switch">
                        <input 
                          type="checkbox" 
                          checked={appearance.compactView}
                          onChange={() => handleAppearanceChange('compactView', !appearance.compactView)}
                        />
                        <span className="slider"></span>
                      </label>
                    </div>
                    <div className="setting-item">
                      <div className="setting-info">
                        <h4>Font Size</h4>
                        <p>Adjust text size for better readability</p>
                      </div>
                      <select 
                        className="select-input"
                        value={appearance.fontSize}
                        onChange={(e) => handleAppearanceChange('fontSize', e.target.value)}
                      >
                        <option value="small">Small</option>
                        <option value="medium">Medium</option>
                        <option value="large">Large</option>
                        <option value="xlarge">Extra Large</option>
                      </select>
                    </div>
                    <div className="setting-item">
                      <div className="setting-info">
                        <h4>Language</h4>
                        <p>Choose your preferred language</p>
                      </div>
                      <select 
                        className="select-input"
                        value={appearance.language}
                        onChange={(e) => handleAppearanceChange('language', e.target.value)}
                      >
                        <option value="en">English</option>
                        <option value="es">Español</option>
                        <option value="fr">Français</option>
                        <option value="de">Deutsch</option>
                        <option value="ja">日本語</option>
                        <option value="zh">中文</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Activity Tab */}
            {activeTab === 'activity' && (
              <div className="tab-content">
                <div className="section-header">
                  <h2>Account Activity</h2>
                  <p className="section-description">View your recent account activities</p>
                </div>
                <div className="activity-list">
                  {activityLogs.map(log => (
                    <div key={log.id} className="activity-item">
                      <div className="activity-icon">
                        <Activity size={20} />
                      </div>
                      <div className="activity-details">
                        <h4>{log.action}</h4>
                        <p>{log.device}</p>
                        <div className="activity-meta">
                          <span><MapPin size={14} /> {log.location}</span>
                          <span>•</span>
                          <span>{log.timestamp}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {activityLogs.length === 0 && (
                    <p className="no-data">No recent activity</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <AlertCircle size={48} className="warning-icon" />
              <h2>Delete Account</h2>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete your account? This action cannot be undone.</p>
              <ul className="warning-list">
                <li>All your data will be permanently deleted</li>
                <li>You will lose access to all your content</li>
                <li>Your subscriptions will be cancelled</li>
                <li>This action is irreversible</li>
              </ul>
              
              <div className="form-group" style={{ marginTop: '1.5rem' }}>
                <label htmlFor="delete-password">Enter your password to confirm</label>
                <input
                  type="password"
                  id="delete-password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="Enter your password"
                  style={{ width: '100%' }}
                />
              </div>

              <div className="form-group">
                <label htmlFor="delete-confirmation">Type "DELETE" to confirm</label>
                <input
                  type="text"
                  id="delete-confirmation"
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  placeholder="Type DELETE"
                  style={{ width: '100%' }}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="cancel-button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletePassword('');
                  setDeleteConfirmation('');
                }}
              >
                Cancel
              </button>
              <button 
                className="danger-button"
                onClick={handleDeleteAccount}
                disabled={deleteConfirmation !== 'DELETE' || !deletePassword}
              >
                Yes, Delete My Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;