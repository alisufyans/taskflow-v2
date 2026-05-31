import React, { useState } from 'react';
import ShareTaskModal from './ShareTaskModal';

const badgeClass = { 'Pending': 'badge-pending', 'In Progress': 'badge-in-progress', 'Completed': 'badge-completed' };
const prioClass = { High: 'badge-high', Medium: 'badge-medium', Low: 'badge-low' };

function formatBytes(b) {
  if (b < 1024) return `${b} B`;
  if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1048576).toFixed(1)} MB`;
}

export default function TaskDetail({ task, onClose, onEdit, onDelete, currentUserId, onShared }) {
  const [showShare, setShowShare] = useState(false);
  if (!task) return null;

  const isOwner = task.user?._id === currentUserId || task.user?.id === currentUserId || task.user === currentUserId;
  const dueDate = task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '—';
  const createdAt = task.createdAt ? new Date(task.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

  return (
    <>
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal" style={{ maxWidth: 580 }} onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2 className="modal-title">Task Details</h2>
            <button className="modal-close" onClick={onClose}>×</button>
          </div>

          <div className="detail-header">
            <h3 className="detail-title">{task.title}</h3>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              <span className={`badge ${prioClass[task.priority]}`}>{task.priority}</span>
              <span className={`badge ${badgeClass[task.status]}`}>{task.status}</span>
              {task.sharedWith?.length > 0 && <span className="badge badge-shared">shared</span>}
            </div>
          </div>

          <div className="detail-meta">
            <div className="detail-meta-item">
              <label>Due Date</label>
              <span style={{ fontSize: '0.88rem' }}>{dueDate}</span>
            </div>
            <div className="detail-meta-item">
              <label>Created</label>
              <span style={{ fontSize: '0.88rem' }}>{createdAt}</span>
            </div>
            <div className="detail-meta-item">
              <label>Owner</label>
              <span style={{ fontSize: '0.88rem' }}>{task.user?.name || 'You'}</span>
            </div>
          </div>

          <div className="detail-desc">
            {task.description || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No description provided.</span>}
          </div>

          {/* Shared with */}
          {task.sharedWith?.length > 0 && (
            <>
              <p className="detail-section-title">Shared with</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {task.sharedWith.map((u) => (
                  <span key={u._id} className="shared-user-chip">{u.name}</span>
                ))}
              </div>
            </>
          )}

          {/* Attachments */}
          {task.attachments?.length > 0 && (
            <>
              <p className="detail-section-title">Attachments</p>
              <div className="attachment-list">
                {task.attachments.map((a) => (
                  <div key={a._id} className="attachment-item">
                    <span>📎</span>
                    <span className="attachment-name">{a.originalName}</span>
                    <span className="attachment-size">{formatBytes(a.size)}</span>
                    <a
                      href={`${process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000'}/uploads/${a.filename}`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-sm btn-secondary"
                    >
                      Download
                    </a>
                  </div>
                ))}
              </div>
            </>
          )}

          <div className="modal-footer">
            {isOwner && (
              <>
                <button className="btn btn-danger" onClick={() => { onDelete(task._id); onClose(); }}>Delete</button>
                <button className="btn btn-secondary" onClick={() => setShowShare(true)}>Share</button>
              </>
            )}
            <button className="btn btn-secondary" onClick={onClose}>Close</button>
            <button className="btn btn-primary" onClick={() => { onEdit(task); onClose(); }}>Edit</button>
          </div>
        </div>
      </div>

      {showShare && (
        <ShareTaskModal
          task={task}
          onClose={() => setShowShare(false)}
          onShared={onShared}
        />
      )}
    </>
  );
}
