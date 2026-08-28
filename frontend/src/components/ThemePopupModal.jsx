'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Trash2, HelpCircle, X, Info } from 'lucide-react';

export default function ThemePopupModal({ config, onConfirm, onCancel }) {
  if (!config) return null;

  const {
    title = 'Are you sure?',
    message = 'This action cannot be undone.',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'danger',
  } = config;

  const renderIcon = () => {
    switch (variant) {
      case 'danger':
        return (
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-400 flex items-center justify-center border border-red-500/20 shadow-inner">
            <Trash2 className="w-7 h-7" />
          </div>
        );
      case 'warning':
        return (
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20 shadow-inner">
            <AlertTriangle className="w-7 h-7" />
          </div>
        );
      case 'info':
      default:
        return (
          <div className="w-14 h-14 rounded-2xl bg-[#A08C75]/15 dark:bg-[#D4C3B3]/20 text-[#A08C75] dark:text-[#D4C3B3] flex items-center justify-center border border-[#A08C75]/30 shadow-inner">
            <HelpCircle className="w-7 h-7" />
          </div>
        );
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onCancel}
          className="absolute inset-0 bg-black/65 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 16 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="relative z-10 bg-[#FDFBF7] dark:bg-[#0F0F0F] border border-[#A08C75]/40 dark:border-white/15 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl text-center overflow-hidden"
        >
          {/* Close X Button */}
          <button
            onClick={onCancel}
            className="absolute top-4 right-4 text-primary/40 hover:text-primary dark:text-white/40 dark:hover:text-white transition-colors p-1.5 rounded-full hover:bg-sand-100 dark:hover:bg-white/10"
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>

          {/* Top Decorative Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-[#A08C75] to-transparent rounded-full opacity-60" />

          {/* Icon */}
          <div className="flex justify-center mb-5 mt-2">
            {renderIcon()}
          </div>

          {/* Title */}
          <h3 className="font-serif text-xl sm:text-2xl font-bold text-primary dark:text-white tracking-tight mb-2">
            {title}
          </h3>

          {/* Message */}
          <p className="text-xs sm:text-sm text-primary/70 dark:text-white/70 leading-relaxed mb-6">
            {message}
          </p>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
            <button
              onClick={onCancel}
              className="w-full sm:w-1/2 px-5 py-3 rounded-full border border-sand-300 dark:border-white/20 text-primary dark:text-white hover:bg-sand-100 dark:hover:bg-white/10 text-xs font-bold uppercase tracking-wider transition-all duration-200"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={`w-full sm:w-1/2 px-5 py-3 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-200 shadow-md ${
                variant === 'danger'
                  ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-600/20'
                  : 'bg-[#111111] dark:bg-white text-white dark:text-black hover:bg-[#A08C75] dark:hover:bg-[#D4C3B3]'
              }`}
            >
              {confirmText}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
