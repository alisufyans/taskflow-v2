import React, { useState, useCallback } from 'react';

let _addToast = null;

export const toast = {
  success: (msg) => _addToast && _addToast(msg, 'success'),
  error: (msg) => _addToast && _addToast(msg, 'error'),
};

export function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  _addToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((p) => [...p, { id, message, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3500);
  }, []);

  if (!toasts.length) return null;

  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.type}`}>
          <span>{t.type === 'success' ? '✓' : '✕'}</span>
          {t.message}
        </div>
      ))}
    </div>
  );
}
