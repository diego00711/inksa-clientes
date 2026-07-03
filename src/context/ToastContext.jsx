// src/context/ToastContext.jsx

import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext();

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  // Ajustado para receber (type, message) para mais clareza na chamada
  const addToast = useCallback((type = 'info', message) => {
    const id = Date.now();
    setToasts(prevToasts => [...prevToasts, { id, message, type }]);
    
    setTimeout(() => {
      removeToast(id);
    }, 5000);
  }, []);

  const removeToast = (id) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
  };

  const icons = {
    success: <CheckCircle className="h-6 w-6 text-green-500" />,
    error: <XCircle className="h-6 w-6 text-red-500" />,
    warning: <AlertTriangle className="h-6 w-6 text-yellow-500" />,
    info: <Info className="h-6 w-6 text-blue-500" />,
  };

  return (
    // Passamos o valor como um objeto, que é um padrão mais seguro
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div
        className="fixed z-[9999] left-4 right-4 sm:left-auto sm:right-5 flex flex-col items-stretch sm:items-end gap-3"
        style={{ top: 'calc(1.25rem + env(safe-area-inset-top))' }}
      >
        {toasts.map(toast => (
          <div
            key={toast.id}
            className="w-full sm:w-auto sm:max-w-sm p-4 bg-white rounded-lg shadow-lg flex items-start gap-4 animate-fade-in-right"
          >
            <div className="flex-shrink-0">{icons[toast.type]}</div>
            <div className="flex-grow min-w-0">
              <p className="font-semibold text-gray-800">{toast.type.charAt(0).toUpperCase() + toast.type.slice(1)}</p>
              <p className="text-sm text-gray-600 break-words">{toast.message}</p>
            </div>
            <button onClick={() => removeToast(toast.id)} className="shrink-0 text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// O hook agora retorna o contexto completo
export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast deve ser usado dentro de um ToastProvider');
  }
  return context;
}