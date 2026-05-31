import React, { useState, useEffect, useCallback } from 'react';
import { taskService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import TaskCard from './TaskCard';
import TaskForm from './TaskForm';
import TaskDetail from './TaskDetail';
import ProgressBar from './ProgressBar';
import { ToastContainer, toast } from './Toast';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

export default function Dashboard() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [progress, setProgress] = useState({ total: 0, completed: 0, percent: 0 });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Search & filter
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');

  // Modal state
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [detailTask, setDetailTask] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const params = { sortBy, order: 'desc' };
      if (search) params.search = search;
      if (statusFilter !== 'all') params.status = statusFilter;
      if (priorityFilter !== 'all') params.priority = priorityFilter;
      const { data } = await taskService.getAll(params);
      setTasks(data.tasks || []);
      setProgress(data.progress || { total: 0, completed: 0, percent: 0 });
    } catch {
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, priorityFilter, sortBy]);

  useEffect(() => {
    const t = setTimeout(fetchTasks, 300);
    return () => clearTimeout(t);
  }, [fetchTasks]);

  const handleFormSubmit = async ({ file, ...formData }) => {
    setSubmitting(true);
    try {
      let task;
      if (editingTask) {
        const { data } = await taskService.update(editingTask._id, formData);
        task = data.task;
        toast.success('Task updated');
      } else {
        const { data } = await taskService.create(formData);
        task = data.task;
        toast.success('Task created');
      }
      // Upload attachment if provided
      if (file && task?._id) {
        try {
          await taskService.uploadAttachment(task._id, file);
        } catch {
          toast.error('Task saved but file upload failed');
        }
      }
      setShowForm(false);
      setEditingTask(null);
      fetchTasks();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await taskService.delete(id);
      toast.success('Task deleted');
      setDeleteConfirm(null);
      fetchTasks();
    } catch {
      toast.error('Failed to delete task');
    }
  };

  const statCounts = tasks.reduce((acc, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <>
      <ToastContainer />

      {/* Page Header */}
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>
          Good {getGreeting()}, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Progress */}
      <ProgressBar progress={progress} />

      {/* Stats */}
      <div className="stats-row">
        <div className="stat-card"><div className="stat-card-label">Total</div><div className="stat-card-value white">{progress.total}</div></div>
        <div className="stat-card"><div className="stat-card-label">Pending</div><div className="stat-card-value yellow">{statCounts['Pending'] || 0}</div></div>
        <div className="stat-card"><div className="stat-card-label">In Progress</div><div className="stat-card-value blue">{statCounts['In Progress'] || 0}</div></div>
        <div className="stat-card"><div className="stat-card-label">Completed</div><div className="stat-card-value green">{statCounts['Completed'] || 0}</div></div>
      </div>

      {/* Tasks Header */}
      <div className="tasks-header">
        <div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>My Tasks</h2>
          {!loading && <span className="tasks-count">{tasks.length} task{tasks.length !== 1 ? 's' : ''} found</span>}
        </div>
        <button className="btn btn-primary" onClick={() => { setEditingTask(null); setShowForm(true); }}>
          + New Task
        </button>
      </div>

      {/* Search & Filter */}
      <div className="search-filter-bar">
        <div className="search-input-wrap">
          <span className="search-icon">🔍</span>
          <input type="text" className="form-control search-input" placeholder="Search tasks…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="form-control filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="all">All Status</option>
          <option value="Pending">Pending</option>
          <option value="In Progress">In Progress</option>
          <option value="Completed">Completed</option>
        </select>
        <select className="form-control filter-select" value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}>
          <option value="all">All Priority</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>
        <select className="form-control filter-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
          <option value="createdAt">Newest First</option>
          <option value="dueDate">Due Date</option>
          <option value="title">Title A–Z</option>
        </select>
      </div>

      {/* Task Grid */}
      {loading ? (
        <div className="loader-wrap"><div className="loader" /></div>
      ) : tasks.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <div className="empty-state-title">
            {search || statusFilter !== 'all' || priorityFilter !== 'all' ? 'No tasks match your filters' : 'No tasks yet'}
          </div>
          <div className="empty-state-desc">
            {search || statusFilter !== 'all' || priorityFilter !== 'all' ? 'Try adjusting your search or filters' : 'Click "+ New Task" to get started'}
          </div>
        </div>
      ) : (
        <div className="task-grid">
          {tasks.map(task => (
            <TaskCard
              key={task._id}
              task={task}
              currentUserId={user?.id}
              onClick={setDetailTask}
              onEdit={t => { setEditingTask(t); setShowForm(true); }}
              onDelete={id => setDeleteConfirm(id)}
            />
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editingTask ? 'Edit Task' : 'Create New Task'}</h2>
              <button className="modal-close" onClick={() => setShowForm(false)}>×</button>
            </div>
            <TaskForm task={editingTask} onSubmit={handleFormSubmit} onCancel={() => setShowForm(false)} loading={submitting} />
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {detailTask && (
        <TaskDetail
          task={detailTask}
          currentUserId={user?.id}
          onClose={() => setDetailTask(null)}
          onEdit={t => { setDetailTask(null); setEditingTask(t); setShowForm(true); }}
          onDelete={id => { setDetailTask(null); setDeleteConfirm(id); }}
          onShared={fetchTasks}
        />
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Delete Task?</h2>
              <button className="modal-close" onClick={() => setDeleteConfirm(null)}>×</button>
            </div>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              This action is permanent and cannot be undone.
            </p>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className="btn btn-primary" style={{ background: 'var(--danger)' }} onClick={() => handleDelete(deleteConfirm)}>
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
