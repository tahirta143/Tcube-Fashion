'use client';

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import ThemeToastContainer from '@/components/ThemeToast';
import ThemePopupModal from '@/components/ThemePopupModal';

const PopupContext = createContext();

export function PopupProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [confirmConfig, setConfirmConfig] = useState(null);
  const resolverRef = useRef(null);

  // Toast Function
  const showToast = useCallback((message, type = 'success', title = null) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 7);
    const newToast = { id, message, type, title };

    setToasts((prev) => [...prev, newToast]);

    // Auto remove after 3.5 seconds
    setTimeout(() => {
      removeToast(id);
    }, 3800);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Confirmation Modal Function (Promise-based)
  const showConfirm = useCallback(({
    title = 'Are you sure?',
    message = 'This action cannot be undone.',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'danger', // 'danger' | 'warning' | 'info'
  } = {}) => {
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setConfirmConfig({
        title,
        message,
        confirmText,
        cancelText,
        variant,
      });
    });
  }, []);

  const handleConfirmResponse = (accepted) => {
    if (resolverRef.current) {
      resolverRef.current(accepted);
      resolverRef.current = null;
    }
    setConfirmConfig(null);
  };

  return (
    <PopupContext.Provider value={{ showToast, showConfirm, removeToast }}>
      {children}
      {/* Global Theme Toast Container */}
      <ThemeToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Global Theme Confirmation Modal */}
      {confirmConfig && (
        <ThemePopupModal
          config={confirmConfig}
          onConfirm={() => handleConfirmResponse(true)}
          onCancel={() => handleConfirmResponse(false)}
        />
      )}
    </PopupContext.Provider>
  );
}

export function usePopup() {
  const context = useContext(PopupContext);
  if (!context) {
    throw new Error('usePopup must be used within a PopupProvider');
  }
  return context;
}
