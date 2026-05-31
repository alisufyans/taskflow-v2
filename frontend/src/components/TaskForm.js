import React, { useState, useEffect, useRef } from 'react';

const emptyForm = { title: '', description: '', status: 'Pending', priority: 'Medium', dueDate: '' };

export default function TaskForm({ task, onSubmit, onCancel, loading }) {
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [file, setFile] = useState(null);
  const fileRef = useRef();

  useEffect(() => {
    if (task) {
      setForm({
        title: task.title || '',
        description: task.description || '',
        status: task.status || 'Pending',
        priority: task.priority || 'Medium',
        dueDate: task.dueDate ? task.dueDate.slice(0, 10) : '',
      });
    } else {
      setForm(emptyForm);
    }
  }, [task]);

  const handle = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    if (errors[name]) setErrors((p) => ({ ...p, [name]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!form.title.trim()) errs.title = 'Title is required';
    if (!form.dueDate) errs.dueDate = 'Due date is required';
    return errs;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onSubmit({ ...form, dueDate: new Date(form.dueDate).toISOString(), file });
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove('dragover');
    const f = e.dataTransfer.files[0];
    if (f) setFile(f);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label className="form-label">Title *</label>
        <input type="text" name="title" className="form-control" placeholder="What needs to be done?" value={form.title} onChange={handle} autoFocus maxLength={100} />
        {errors.title && <p className="form-error">{errors.title}</p>}
      </div>

      <div className="form-group">
        <label className="form-label">Description</label>
        <textarea name="description" className="form-control" placeholder="Add more details…" value={form.description} onChange={handle} maxLength={500} />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Status</label>
          <select name="status" className="form-control" value={form.status} onChange={handle}>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Priority</label>
          <select name="priority" className="form-control" value={form.priority} onChange={handle}>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Due Date *</label>
        <input type="date" name="dueDate" className="form-control" value={form.dueDate} onChange={handle} />
        {errors.dueDate && <p className="form-error">{errors.dueDate}</p>}
      </div>

      {/* Attachment upload (Week 6) */}
      <div className="form-group">
        <label className="form-label">Attachment (optional)</label>
        <div
          className="attachment-zone"
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('dragover'); }}
          onDragLeave={(e) => e.currentTarget.classList.remove('dragover')}
          onDrop={handleDrop}
        >
          <p>{file ? `📎 ${file.name}` : 'Click or drag a file here (images, PDF, DOC, TXT · max 5MB)'}</p>
          <input ref={fileRef} type="file" style={{ display: 'none' }} accept="image/*,.pdf,.doc,.docx,.txt" onChange={(e) => setFile(e.target.files[0])} />
        </div>
        {file && (
          <button type="button" className="btn btn-sm btn-danger" style={{ marginTop: '0.5rem' }} onClick={() => setFile(null)}>
            Remove file
          </button>
        )}
      </div>

      <div className="modal-footer">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Saving…' : task ? 'Save Changes' : 'Create Task'}
        </button>
      </div>
    </form>
  );
}
