import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { notificationService } from '../services/api';
import { useSocket } from '../hooks/useSocket';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [notifs, setNotifs] = useState([]);
  const [unread, setUnread] = useState(0);
  const [showPanel, setShowPanel] = useState(false);
  const panelRef = useRef();

  const fetchNotifs = async () => {
    try {
      const { data } = await notificationService.getAll();
      setNotifs(data.notifications || []);
      setUnread(data.unreadCount || 0);
    } catch {}
  };

  useEffect(() => {
    if (user) fetchNotifs();
  }, [user]);

  // Real-time socket notifications
  useSocket(user?.id, (newNotif) => {
    setNotifs((p) => [newNotif, ...p]);
    setUnread((c) => c + 1);
  });

  // Close panel on outside click
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setShowPanel(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleMarkAllRead = async () => {
    await notificationService.markAllRead();
    setUnread(0);
    setNotifs((p) => p.map((n) => ({ ...n, read: true })));
  };

  const formatTime = (d) => {
    const diff = Math.floor((Date.now() - new Date(d)) / 60000);
    if (diff < 1) return 'just now';
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return `${Math.floor(diff / 1440)}d ago`;
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">Task<span>Flow</span></Link>

      {user && (
        <div className="navbar-nav">
          <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>Dashboard</Link>
          <Link to="/analytics" className={`nav-link ${isActive('/analytics') ? 'active' : ''}`}>Analytics</Link>
          <Link to="/shared" className={`nav-link ${isActive('/shared') ? 'active' : ''}`}>Shared</Link>
        </div>
      )}

      <div className="navbar-right">
        {user && (
          <>
            <span className="navbar-user">@{user.name}</span>

            {/* Notifications Bell */}
            <div className="notif-btn-wrap" ref={panelRef}>
              <button
                className="btn btn-secondary btn-icon"
                onClick={() => setShowPanel((p) => !p)}
                title="Notifications"
              >
                🔔
                {unread > 0 && (
                  <span className="notif-badge">{unread > 9 ? '9+' : unread}</span>
                )}
              </button>

              {showPanel && (
                <div className="notif-panel">
                  <div className="notif-panel-header">
                    <span className="notif-panel-title">Notifications</span>
                    {unread > 0 && (
                      <button className="btn btn-sm btn-secondary" onClick={handleMarkAllRead}>
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="notif-list">
                    {notifs.length === 0 ? (
                      <div className="notif-empty">No notifications yet</div>
                    ) : (
                      notifs.map((n) => (
                        <div key={n._id} className={`notif-item ${!n.read ? 'unread' : ''}`}>
                          <div className="notif-item-msg">{n.message}</div>
                          <div className="notif-item-time">{formatTime(n.createdAt)}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Dark Mode Toggle */}
            <button className="theme-toggle" onClick={toggleTheme} title="Toggle theme">
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>

            <button className="btn btn-secondary btn-sm" onClick={logout}>Sign out</button>
          </>
        )}
      </div>
    </nav>
  );
}
