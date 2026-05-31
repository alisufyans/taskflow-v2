import React, { useState, useCallback } from 'react';
import { authService, taskService } from '../services/api';
import { toast } from './Toast';

export default function ShareTaskModal({ task, onClose, onShared }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState([]);
  const [searching, setSearching] = useState(false);
  const [sharing, setSharing] = useState(false);

  const search = useCallback(async (q) => {
    if (!q.trim()) { setResults([]); return; }
    setSearching(true);
    try {
      const { data } = await authService.searchUsers(q);
      const alreadyShared = task.sharedWith?.map((u) => u._id || u) || [];
      setResults(data.users.filter((u) => !alreadyShared.includes(u._id)));
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, [task]);

  const handleSearch = (e) => {
    const q = e.target.value;
    setQuery(q);
    const t = setTimeout(() => search(q), 300);
    return () => clearTimeout(t);
  };

  const toggleSelect = (user) => {
    setSelected((p) =>
      p.find((u) => u._id === user._id)
        ? p.filter((u) => u._id !== user._id)
        : [...p, user]
    );
  };

  const handleShare = async () => {
    if (!selected.length) return;
    setSharing(true);
    try {
      await taskService.share(task._id, selected.map((u) => u._id));
      toast.success(`Task shared with ${selected.length} user${selected.length > 1 ? 's' : ''}`);
      onShared();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to share task');
    } finally {
      setSharing(false);
    }
  };

  const initials = (name) => name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Share Task</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
          Sharing: <strong style={{ color: 'var(--text-primary)' }}>"{task.title}"</strong>
        </p>

        {/* Already shared with */}
        {task.sharedWith?.length > 0 && (
          <div style={{ marginBottom: '1rem' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>Already shared with</p>
            <div className="shared-users-list">
              {task.sharedWith.map((u) => (
                <span key={u._id} className="shared-user-chip">
                  <span style={{ fontSize: '0.7rem' }}>{initials(u.name)}</span>
                  {u.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Search */}
        <div className="share-search">
          <input
            type="text"
            className="form-control"
            placeholder="Search by name or email…"
            value={query}
            onChange={handleSearch}
            autoFocus
          />
        </div>

        {/* Results */}
        {searching && <p style={{ fontSize: '0.83rem', color: 'var(--text-muted)', padding: '0.5rem 0' }}>Searching…</p>}
        {results.map((u) => {
          const isSelected = selected.find((s) => s._id === u._id);
          return (
            <div key={u._id} className="user-result" onClick={() => toggleSelect(u)}
              style={{ background: isSelected ? 'var(--accent-glow)' : undefined, border: isSelected ? '1px solid var(--accent)' : '1px solid transparent', borderRadius: 'var(--radius)' }}>
              <div className="user-avatar">{initials(u.name)}</div>
              <div style={{ flex: 1 }}>
                <div className="user-info-name">{u.name}</div>
                <div className="user-info-email">{u.email}</div>
              </div>
              {isSelected && <span style={{ color: 'var(--accent)', fontSize: '1.1rem' }}>✓</span>}
            </div>
          );
        })}

        {/* Selected chips */}
        {selected.length > 0 && (
          <div className="shared-users-list" style={{ marginTop: '0.75rem' }}>
            {selected.map((u) => (
              <span key={u._id} className="shared-user-chip" style={{ cursor: 'pointer' }} onClick={() => toggleSelect(u)}>
                {u.name} ×
              </span>
            ))}
          </div>
        )}

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleShare} disabled={!selected.length || sharing}>
            {sharing ? 'Sharing…' : `Share with ${selected.length || ''} user${selected.length !== 1 ? 's' : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
}
