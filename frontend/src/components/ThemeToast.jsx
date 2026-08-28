'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export default function ThemeToastContainer({ toasts, onRemove }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="fixed top-6 right-4 sm:right-6 z-[99998] flex flex-col gap-3 max-w-sm w-full px-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={() => onRemove(toast.id)} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function ToastItem({ toast, onRemove }) {
  const { type, message, title } = toast;

  const renderIcon = () => {
    switch (type) {
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />;
      case 'info':
        return <Info className="w-5 h-5 text-[#A08C75] dark:text-[#D4C3B3] shrink-0 mt-0.5" />;
      case 'success':
      default:
        return <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />;
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="pointer-events-auto bg-[#FDFBF7]/95 dark:bg-[#121212]/95 border border-[#A08C75]/35 dark:border-white/20 rounded-2xl p-4 shadow-xl flex items-start gap-3 backdrop-blur-md relative overflow-hidden"
    >
      {/* Accent side pill */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-1 ${
          type === 'error'
            ? 'bg-red-500'
            : type === 'warning'
            ? 'bg-amber-500'
            : type === 'info'
            ? 'bg-[#A08C75]'
            : 'bg-emerald-500'
        }`}
      />

      <div className="pl-1.5">{renderIcon()}</div>

      <div className="flex-1 min-w-0 pr-2">
        {title && (
          <h4 className="font-serif font-bold text-sm text-primary dark:text-white mb-0.5">
            {title}
          </h4>
        )}
        <p className="text-xs text-primary/80 dark:text-white/80 leading-snug break-words">
          {message}
        </p>
      </div>

      <button
        onClick={onRemove}
        className="text-primary/40 hover:text-primary dark:text-white/40 dark:hover:text-white transition-colors p-1 rounded-full hover:bg-sand-200/50 dark:hover:bg-white/10 shrink-0"
        aria-label="Close notification"
      >
        <X size={14} />
      </button>
    </motion.div>
  );
}
