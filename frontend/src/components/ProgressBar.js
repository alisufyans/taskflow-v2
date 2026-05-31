import React from 'react';

export default function ProgressBar({ progress }) {
  const { total = 0, completed = 0, percent = 0 } = progress || {};
  return (
    <div className="progress-container card" style={{ marginBottom: '1.5rem' }}>
      <div className="progress-header">
        <span className="progress-label">Overall Progress</span>
        <span className="progress-percent">{percent}%</span>
      </div>
      <div className="progress-bar-track">
        <div className="progress-bar-fill" style={{ width: `${percent}%` }} />
      </div>
      <div className="progress-stats">
        <span className="progress-stat"><strong>{total}</strong> total</span>
        <span className="progress-stat"><strong style={{ color: 'var(--success)' }}>{completed}</strong> completed</span>
        <span className="progress-stat"><strong style={{ color: 'var(--accent)' }}>{total - completed}</strong> remaining</span>
      </div>
    </div>
  );
}
