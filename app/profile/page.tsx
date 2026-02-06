// app/profile/page.tsx or pages/profile.tsx
'use client'; // Remove this if using Pages Router

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { User, Mail, Camera, Save, Shield, Bell, Palette, ArrowLeft} from 'lucide-react';
import './profile.css';
import { useRouter } from "next/navigation";

interface UserProfile {
  name: string;
  email: string;
  bio: string;
  image: string;
}

const ProfilePage: React.FC = () => {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile>({
    name: session?.user?.name || '',
    email: session?.user?.email || '',
    bio: '',
    image: session?.user?.image || '',
  });

  const [activeTab, setActiveTab] = useState<'general' | 'security' | 'notifications' | 'appearance'>('general');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile(prev => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Update session if needed
    // await update({ ...session, user: { ...session?.user, ...profile } });
    
    setIsSaving(false);
    setIsEditing(false);
  };

  return (
    <div className="profile-container">
      
      <div className="profile-wrapper">
        
        {/* Header */}
        <div className="profile-header">
          
          <h1>Profile Settings</h1>
          <p>Manage your account settings and preferences</p>
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
              className={`tab-button ${activeTab === 'appearance' ? 'active' : ''}`}
              onClick={() => setActiveTab('appearance')}
            >
              <Palette size={20} />
              <span>Appearance</span>
            </button>
          </div>

          {/* Main Content */}
          <div className="profile-main">
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
                        <Save size={16} />
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
                  </div>
                </div>

                {/* Form Fields */}
                <div className="form-section">
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
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="tab-content">
                <div className="section-header">
                  <h2>Security Settings</h2>
                </div>
                <div className="form-section">
                  <div className="form-group">
                    <label htmlFor="current-password">Current Password</label>
                    <input
                      type="password"
                      id="current-password"
                      placeholder="Enter current password"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="new-password">New Password</label>
                    <input
                      type="password"
                      id="new-password"
                      placeholder="Enter new password"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="confirm-password">Confirm Password</label>
                    <input
                      type="password"
                      id="confirm-password"
                      placeholder="Confirm new password"
                    />
                  </div>
                  <button className="save-button">Update Password</button>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="tab-content">
                <div className="section-header">
                  <h2>Notification Preferences</h2>
                </div>
                <div className="settings-list">
                  <div className="setting-item">
                    <div className="setting-info">
                      <h4>Email Notifications</h4>
                      <p>Receive notifications via email</p>
                    </div>
                    <label className="toggle-switch">
                      <input type="checkbox" defaultChecked />
                      <span className="slider"></span>
                    </label>
                  </div>
                  <div className="setting-item">
                    <div className="setting-info">
                      <h4>Push Notifications</h4>
                      <p>Receive push notifications</p>
                    </div>
                    <label className="toggle-switch">
                      <input type="checkbox" />
                      <span className="slider"></span>
                    </label>
                  </div>
                  <div className="setting-item">
                    <div className="setting-info">
                      <h4>Marketing Emails</h4>
                      <p>Receive updates about new features</p>
                    </div>
                    <label className="toggle-switch">
                      <input type="checkbox" defaultChecked />
                      <span className="slider"></span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'appearance' && (
              <div className="tab-content">
                <div className="section-header">
                  <h2>Appearance Settings</h2>
                </div>
                <div className="settings-list">
                  <div className="setting-item">
                    <div className="setting-info">
                      <h4>Dark Mode</h4>
                      <p>Use dark theme</p>
                    </div>
                    <label className="toggle-switch">
                      <input type="checkbox" defaultChecked />
                      <span className="slider"></span>
                    </label>
                  </div>
                  <div className="setting-item">
                    <div className="setting-info">
                      <h4>Compact View</h4>
                      <p>Reduce spacing and padding</p>
                    </div>
                    <label className="toggle-switch">
                      <input type="checkbox" />
                      <span className="slider"></span>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;