import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Undo2, Send, Clock, CheckCircle } from 'lucide-react';

/**
 * UndoSendToast - Shows countdown and undo button after sending an email
 */
const UndoSendToast = ({ 
  outboxId,
  subject,
  sendAt,
  undoDelaySeconds = 10,
  onUndo,
  onDismiss,
  onSent,
}) => {
  const [timeRemaining, setTimeRemaining] = useState(undoDelaySeconds);
  const [status, setStatus] = useState('pending'); // pending, undoing, undone, sent

  // Calculate time remaining
  useEffect(() => {
    const targetTime = new Date(sendAt).getTime();
    
    const updateTime = () => {
      const now = Date.now();
      const remaining = Math.max(0, Math.ceil((targetTime - now) / 1000));
      setTimeRemaining(remaining);
      
      if (remaining <= 0 && status === 'pending') {
        setStatus('sent');
        onSent?.();
        // Auto-dismiss after showing "sent" for 2 seconds
        setTimeout(() => onDismiss?.(), 2000);
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 100);
    return () => clearInterval(interval);
  }, [sendAt, status, onSent, onDismiss]);

  const handleUndo = useCallback(async () => {
    if (status !== 'pending') return;
    
    setStatus('undoing');
    try {
      await onUndo(outboxId);
      setStatus('undone');
      setTimeout(() => onDismiss?.(), 2000);
    } catch (error) {
      console.error('Failed to undo:', error);
      setStatus('pending'); // Reset to allow retry
    }
  }, [outboxId, status, onUndo, onDismiss]);

  // Progress bar percentage
  const progress = (timeRemaining / undoDelaySeconds) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.9 }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
    >
      <div className="bg-slate-900 dark:bg-slate-800 text-white rounded-xl shadow-2xl overflow-hidden min-w-[320px] max-w-md">
        {/* Progress bar */}
        {status === 'pending' && (
          <div className="h-1 bg-slate-700">
            <motion.div 
              className="h-full bg-orange-500"
              initial={{ width: '100%' }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.1 }}
            />
          </div>
        )}

        <div className="px-4 py-3 flex items-center gap-3">
          {/* Icon */}
          <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
            status === 'sent' ? 'bg-green-500/20' :
            status === 'undone' ? 'bg-blue-500/20' :
            'bg-orange-500/20'
          }`}>
            {status === 'sent' && <CheckCircle size={20} className="text-green-400" />}
            {status === 'undone' && <Undo2 size={20} className="text-blue-400" />}
            {status === 'pending' && <Send size={20} className="text-orange-400" />}
            {status === 'undoing' && (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <Clock size={20} className="text-orange-400" />
              </motion.div>
            )}
          </div>

          {/* Message */}
          <div className="flex-1 min-w-0">
            {status === 'pending' && (
              <>
                <p className="text-sm font-medium">
                  Sending in {timeRemaining}s...
                </p>
                <p className="text-xs text-slate-400 truncate">{subject}</p>
              </>
            )}
            {status === 'undoing' && (
              <p className="text-sm font-medium">Cancelling...</p>
            )}
            {status === 'undone' && (
              <p className="text-sm font-medium text-blue-400">Message cancelled</p>
            )}
            {status === 'sent' && (
              <p className="text-sm font-medium text-green-400">Message sent!</p>
            )}
          </div>

          {/* Actions */}
          {status === 'pending' && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleUndo}
                className="px-4 py-1.5 bg-white text-slate-900 text-sm font-medium rounded-lg hover:bg-slate-100 transition-colors"
              >
                Undo
              </button>
              <button
                onClick={onDismiss}
                className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors"
                title="View in Outbox"
              >
                <X size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

/**
 * UndoSendProvider - Manages multiple undo toasts
 */
export const UndoSendManager = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((toast) => {
    setToasts(prev => [...prev, { ...toast, id: toast.outboxId }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <>
      {children}
      <AnimatePresence>
        {toasts.map((toast, index) => (
          <UndoSendToast
            key={toast.id}
            {...toast}
            onDismiss={() => removeToast(toast.id)}
            style={{ 
              bottom: `${24 + index * 80}px` 
            }}
          />
        ))}
      </AnimatePresence>
    </>
  );
};

export default UndoSendToast;
