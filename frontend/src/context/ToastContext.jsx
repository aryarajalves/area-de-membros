import React, { createContext, useContext, useState, useCallback, useMemo, useRef } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const activeMessagesRef = useRef(new Set());

  const removeToast = useCallback((id) => {
    setToasts((prev) => {
      const toastToRemove = prev.find((t) => t.id === id);
      if (toastToRemove?.key) {
        activeMessagesRef.current.delete(toastToRemove.key);
      }
      return prev.filter((t) => t.id !== id);
    });
  }, []);

  const addToast = useCallback((message, type = 'success', duration = 3500) => {
    const key = `${type}:${message}`;
    if (activeMessagesRef.current.has(key)) {
      return;
    }
    activeMessagesRef.current.add(key);

    const id = Date.now() + Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type, key }]);

    if (duration > 0) {
      setTimeout(() => {
        activeMessagesRef.current.delete(key);
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  const contextValue = useMemo(() => ({ addToast, removeToast }), [addToast, removeToast]);

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <div className="toast-container" data-testid="toast-container" aria-live="polite" style={{ zIndex: 999999 }}>
        {toasts.map((toast) => {
          let Icon = CheckCircle2;
          let typeClass = 'toast-success';
          if (toast.type === 'error') {
            Icon = AlertCircle;
            typeClass = 'toast-error';
          } else if (toast.type === 'info') {
            Icon = Info;
            typeClass = 'toast-info';
          }

          return (
            <div
              key={toast.id}
              className={`toast-item ${typeClass}`}
              data-testid={`toast-${toast.type}`}
            >
              <Icon size={20} className="toast-icon" />
              <span className="toast-message">{toast.message}</span>
              <button
                type="button"
                className="toast-close-btn"
                onClick={() => removeToast(toast.id)}
                aria-label="Fechar notificação"
              >
                <X size={15} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    return {
      addToast: () => {},
      removeToast: () => {},
    };
  }
  return context;
}
