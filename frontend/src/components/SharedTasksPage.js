import React, { useState, useEffect, useCallback } from 'react';
import { taskService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import TaskCard from './TaskCard';
import TaskDetail from './TaskDetail';
import TaskForm from './TaskForm';
import { ToastContainer, toast } from './Toast';

export default function SharedTasksPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailTask, setDetailTask] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchShared = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await taskService.getShared();
      setTasks(data.tasks || []);
    } catch {
      toast.error('Failed to load shared tasks');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchShared(); }, [fetchShared]);

  const handleFormSubmit = async ({ file, ...formData }) => {
    setSubmitting(true);
    try {
      await taskService.update(editingTask._id, formData);
      if (file) {
        try { await taskService.uploadAttachment(editingTask._id, file); } catch {}
      }
      toast.success('Task updated');
      setShowForm(false);
      setEditingTask(null);
      fetchShared();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <ToastContainer />
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>Shared with Me</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Tasks that other users have shared with you
        </p>
      </div>

      {loading ? (
        <div className="loader-wrap"><div className="loader" /></div>
      ) : tasks.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🤝</div>
          <div className="empty-state-title">No shared tasks yet</div>
          <div className="empty-state-desc">When someone shares a task with you, it will appear here</div>
        </div>
      ) : (
        <>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem', fontFamily: 'var(--font-mono)' }}>
            {tasks.length} task{tasks.length !== 1 ? 's' : ''} shared with you
          </p>
          <div className="task-grid">
            {tasks.map(task => (
              <TaskCard
                key={task._id}
                task={task}
                currentUserId={user?.id}
                onClick={setDetailTask}
                onEdit={t => { setEditingTask(t); setShowForm(true); }}
                onDelete={() => toast.error('Only the task owner can delete it')}
              />
            ))}
          </div>
        </>
      )}

      {detailTask && (
        <TaskDetail
          task={detailTask}
          currentUserId={user?.id}
          onClose={() => setDetailTask(null)}
          onEdit={t => { setDetailTask(null); setEditingTask(t); setShowForm(true); }}
          onDelete={() => { setDetailTask(null); toast.error('Only the task owner can delete it'); }}
          onShared={fetchShared}
        />
      )}

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Edit Shared Task</h2>
              <button className="modal-close" onClick={() => setShowForm(false)}>×</button>
            </div>
            <TaskForm task={editingTask} onSubmit={handleFormSubmit} onCancel={() => setShowForm(false)} loading={submitting} />
          </div>
        </div>
      )}
    </>
  );
}
