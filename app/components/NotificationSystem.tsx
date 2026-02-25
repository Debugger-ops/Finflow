import React, { useState } from 'react';
import { Bell, X, CheckCircle, AlertCircle, Info, Clock } from 'lucide-react';
import './NotificationSystem.css';

const NotificationSystem = () => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'success',
      title: 'Order Confirmed',
      message: 'Your order #12345 has been confirmed and is being processed.',
      time: '2 min ago',
      read: false
    },
    {
      id: 2,
      type: 'warning',
      title: 'Payment Pending',
      message: 'Your payment for invoice #INV-001 is pending verification.',
      time: '1 hour ago',
      read: false
    },
    {
      id: 3,
      type: 'info',
      title: 'New Feature Available',
      message: 'Check out our new dark mode feature in settings!',
      time: '3 hours ago',
      read: false
    },
    {
      id: 4,
      type: 'success',
      title: 'Profile Updated',
      message: 'Your profile information has been successfully updated.',
      time: '1 day ago',
      read: true
    },
    {
      id: 5,
      type: 'warning',
      title: 'Subscription Expiring',
      message: 'Your premium subscription will expire in 3 days.',
      time: '2 days ago',
      read: true
    }
  ]);

  // Count unread notifications
  const unreadCount = notifications.filter(n => !n.read).length;

  // Toggle notification panel
  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
  };

  // Mark single notification as read
  const markAsRead = (id) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  // Mark all notifications as read
  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  // Delete single notification
  const deleteNotification = (id) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  // Clear all notifications
  const clearAll = () => {
    setNotifications([]);
  };

  // Get icon based on notification type
  const getIcon = (type) => {
    switch(type) {
      case 'success':
        return <CheckCircle size={20} className="icon-success" />;
      case 'warning':
        return <AlertCircle size={20} className="icon-warning" />;
      case 'info':
        return <Info size={20} className="icon-info" />;
      default:
        return <Clock size={20} className="icon-default" />;
    }
  };

  return (
    <div className="notification-wrapper">
      {/* Bell Button - Your original button structure */}
      <button 
        className="notification-btn" 
        aria-label="Notifications"
        onClick={toggleNotifications}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="notification-dot">{unreadCount}</span>
        )}
      </button>

      {/* Notification Panel - Shows when bell is clicked */}
      {showNotifications && (
        <>
          {/* Backdrop to close panel when clicking outside */}
          <div 
            className="notification-backdrop" 
            onClick={toggleNotifications}
          />
          
          {/* Notification Dropdown Panel */}
          <div className="notification-dropdown">
            {/* Header */}
            <div className="notification-header">
              <h3>Notifications</h3>
              <div className="header-actions">
                {unreadCount > 0 && (
                  <button 
                    className="mark-all-read"
                    onClick={markAllAsRead}
                  >
                    Mark all as read
                  </button>
                )}
              </div>
            </div>

            {/* Notification List */}
            <div className="notification-list">
              {notifications.length === 0 ? (
                <div className="no-notifications">
                  <Bell size={48} />
                  <p>No notifications yet</p>
                  <span>You're all caught up!</span>
                </div>
              ) : (
                notifications.map(notification => (
                  <div 
                    key={notification.id}
                    className={`notification-card ${!notification.read ? 'unread' : ''}`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    {/* Icon */}
                    <div className="notification-icon">
                      {getIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="notification-content">
                      <div className="notification-title">
                        {notification.title}
                        {!notification.read && <span className="unread-indicator"></span>}
                      </div>
                      <div className="notification-message">
                        {notification.message}
                      </div>
                      <div className="notification-time">
                        {notification.time}
                      </div>
                    </div>

                    {/* Delete Button */}
                    <button 
                      className="delete-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notification.id);
                      }}
                      aria-label="Delete notification"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="notification-footer">
                <button 
                  className="clear-all-btn"
                  onClick={clearAll}
                >
                  Clear all notifications
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationSystem;