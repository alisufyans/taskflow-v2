import React from 'react';

const statusClass = { 'Pending': 'status-pending', 'In Progress': 'status-in-progress', 'Completed': 'status-completed' };
const badgeClass = { 'Pending': 'badge-pending', 'In Progress': 'badge-in-progress', 'Completed': 'badge-completed' };
const prioClass = { High: 'badge-high', Medium: 'badge-medium', Low: 'badge-low' };

function formatDue(dateStr) {
  if (!dateStr) return { text: '', overdue: false };
  const date = new Date(dateStr);
  const diff = Math.ceil((date - Date.now()) / 86400000);
  const fmt = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  if (diff < 0) return { text: `Overdue · ${fmt}`, overdue: true };
  if (diff === 0) return { text: 'Due today', overdue: true };
  if (diff === 1) return { text: 'Due tomorrow', overdue: false };
  return { text: `Due ${fmt}`, overdue: false };
}

export default function TaskCard({ task, onClick, onEdit, onDelete, currentUserId }) {
  const due = formatDue(task.dueDate);
  const isShared = task.user?._id !== currentUserId && task.user?.id !== currentUserId;
  const sharedWithOthers = task.sharedWith?.length > 0;

  return (
    <div className={`task-card ${statusClass[task.status] || ''}`} onClick={() => onClick(task)}>
      <div className="task-card-header">
        <h3 className="task-card-title">{task.title}</h3>
        <div className="task-card-badges">
          {sharedWithOthers && <span className="badge badge-shared">shared</span>}
          <span className={`badge ${prioClass[task.priority]}`}>{task.priority}</span>
          <span className={`badge ${badgeClass[task.status]}`}>{task.status}</span>
        </div>
      </div>
      {task.description && <p className="task-card-desc">{task.description}</p>}
      {isShared && (
        <p className="task-card-shared-by">Shared by {task.user?.name}</p>
      )}
      {task.attachments?.length > 0 && (
        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
          📎 {task.attachments.length} attachment{task.attachments.length > 1 ? 's' : ''}
        </p>
      )}
      <div className="task-card-footer">
        <span className={`task-card-due ${due.overdue ? 'overdue' : ''}`}>{due.text}</span>
        <div className="task-card-actions" onClick={(e) => e.stopPropagation()}>
          <button className="btn btn-secondary btn-sm" onClick={() => onEdit(task)}>Edit</button>
          {!isShared && <button className="btn btn-danger btn-sm" onClick={() => onDelete(task._id)}>Delete</button>}
        </div>
      </div>
    </div>
  );
}
