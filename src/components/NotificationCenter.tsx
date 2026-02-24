import { useEffect, useState } from 'react';
import { useNotificationStore } from '../store/notificationStore';

export function NotificationCenter() {
  const { notifications, markAsRead, deleteNotification, getUnreadCount } = useNotificationStore();
  const [isOpen, setIsOpen] = useState(false);
  const unreadCount = getUnreadCount();

  // Auto-close notifications after 5 seconds
  useEffect(() => {
    const unreadNotifications = notifications.filter(n => !n.read);
    if (unreadNotifications.length > 0) {
      const timer = setTimeout(() => {
        unreadNotifications.forEach(n => markAsRead(n.id));
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notifications, markAsRead]);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <>
      {/* Notification Bell Icon */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '1.5rem',
            padding: 'var(--spacing-xs)',
            position: 'relative',
          }}
        >
          🔔
          {unreadCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: '0',
                right: '0',
                backgroundColor: 'var(--color-coral)',
                color: 'white',
                borderRadius: '50%',
                width: '18px',
                height: '18px',
                fontSize: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '600',
              }}
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* Notification Dropdown */}
        {isOpen && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: 'var(--spacing-sm)',
              width: '360px',
              maxHeight: '500px',
              backgroundColor: 'var(--color-card)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-xl)',
              border: '1px solid var(--color-border)',
              zIndex: 1000,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: 'var(--spacing-md)',
                borderBottom: '1px solid var(--color-border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <h3 style={{ fontSize: '1rem', fontWeight: '600', margin: 0 }}>
                Notifications {unreadCount > 0 && `(${unreadCount})`}
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '1.25rem',
                }}
              >
                ×
              </button>
            </div>
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {notifications.length === 0 ? (
                <div style={{ padding: 'var(--spacing-xl)', textAlign: 'center', color: 'var(--color-text-light)' }}>
                  No notifications
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => {
                      if (!notification.read) {
                        markAsRead(notification.id);
                      }
                    }}
                    style={{
                      padding: 'var(--spacing-md)',
                      borderBottom: '1px solid var(--color-border)',
                      backgroundColor: notification.read ? 'var(--color-card)' : 'var(--color-primary-bg)',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--color-background)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = notification.read ? 'var(--color-card)' : 'var(--color-primary-bg)';
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--spacing-sm)' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', marginBottom: 'var(--spacing-xs)' }}>
                          {notification.type === 'deposit' && <span style={{ fontSize: '1.25rem' }}>💰</span>}
                          {notification.type === 'payment' && <span style={{ fontSize: '1.25rem' }}>💳</span>}
                          {notification.type === 'info' && <span style={{ fontSize: '1.25rem' }}>ℹ️</span>}
                          <h4 style={{ fontSize: '0.875rem', fontWeight: '600', margin: 0 }}>
                            {notification.title}
                          </h4>
                          {!notification.read && (
                            <div
                              style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                backgroundColor: 'var(--color-primary)',
                              }}
                            />
                          )}
                        </div>
                        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-light)', margin: 0, marginBottom: 'var(--spacing-xs)' }}>
                          {notification.message}
                        </p>
                        {notification.amount && (
                          <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--color-green)', marginBottom: 'var(--spacing-xs)' }}>
                            ${notification.amount.toFixed(2)}
                          </div>
                        )}
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                          {formatTime(notification.timestamp)}
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notification.id);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '1rem',
                          color: 'var(--color-text-muted)',
                          padding: 'var(--spacing-xs)',
                        }}
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Toast Notifications (for new deposits) */}
      {notifications
        .filter(n => !n.read && n.type === 'deposit')
        .slice(0, 1)
        .map((notification) => (
          <div
            key={notification.id}
            style={{
              position: 'fixed',
              top: 'var(--spacing-lg)',
              right: 'var(--spacing-lg)',
              backgroundColor: 'var(--color-card)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--spacing-md)',
              boxShadow: 'var(--shadow-xl)',
              border: '1px solid var(--color-border)',
              zIndex: 9999,
              minWidth: '320px',
              maxWidth: '400px',
              animation: 'slideInRight 0.3s ease-out',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--spacing-md)' }}>
              <div style={{ fontSize: '2rem' }}>💰</div>
              <div style={{ flex: 1 }}>
                <h4 style={{ fontSize: '1rem', fontWeight: '600', margin: '0 0 var(--spacing-xs) 0' }}>
                  {notification.title}
                </h4>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-light)', margin: '0 0 var(--spacing-xs) 0' }}>
                  {notification.message}
                </p>
                {notification.amount && (
                  <div style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--color-green)' }}>
                    ${notification.amount.toFixed(2)}
                  </div>
                )}
              </div>
              <button
                onClick={() => {
                  markAsRead(notification.id);
                  deleteNotification(notification.id);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '1.25rem',
                  color: 'var(--color-text-muted)',
                  padding: 'var(--spacing-xs)',
                }}
              >
                ×
              </button>
            </div>
          </div>
        ))}
      <style>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
}
