import { motion, AnimatePresence } from 'framer-motion';
import type { ToastData } from './ToastProvider';
import styles from './Toast.module.css';

interface ToastProps {
  toasts: ToastData[];
  removeToast: (id: number) => void;
}

export default function Toast({ toasts, removeToast }: ToastProps) {
  return (
    <div className={styles['toast-container']} role="status" aria-live="polite">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            className={`${styles['toast']} ${styles['toast-']} ${toast.type}`}
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          >
            <div className={styles['toast-icon']} aria-hidden="true">
              {toast.type === 'success' && (
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                </svg>
              )}
              {toast.type === 'error' && (
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                </svg>
              )}
              {toast.type === 'info' && (
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
                </svg>
              )}
            </div>
            <span className={styles['toast-message']}>{toast.message}</span>
            <button
              className={styles['toast-close']}
              onClick={() => removeToast(toast.id)}
              aria-label="Dismiss notification"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
              </svg>
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
