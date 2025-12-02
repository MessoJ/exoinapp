import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, 
  Calendar, 
  Edit2, 
  Trash2, 
  Send,
  X,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { mailApi } from '../../lib/api';

/**
 * ScheduledEmailItem - Single scheduled email item
 */
const ScheduledEmailItem = ({ email, onEdit, onCancel, onSendNow }) => {
  const sendAtDate = new Date(email.sendAt);
  const now = new Date();
  const timeUntilSend = sendAtDate - now;
  
  // Format the send time
  const formatSendTime = () => {
    const options = { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    };
    return sendAtDate.toLocaleDateString('en-US', options);
  };

  // Format time remaining
  const formatTimeRemaining = () => {
    if (timeUntilSend < 0) return 'Sending...';
    
    const days = Math.floor(timeUntilSend / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeUntilSend % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeUntilSend % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `in ${days}d ${hours}h`;
    if (hours > 0) return `in ${hours}h ${minutes}m`;
    return `in ${minutes}m`;
  };

  const recipients = [...(email.to || [])];
  const recipientText = recipients.length > 1 
    ? `${recipients[0]} +${recipients.length - 1} more` 
    : recipients[0];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="group flex items-start gap-4 p-4 border-b border-gray-100 dark:border-gray-700
        hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
    >
      {/* Icon */}
      <div className="flex-shrink-0 p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
        <Clock className="w-5 h-5" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {email.subject || '(no subject)'}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            email.status === 'PENDING'
              ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
              : email.status === 'SENDING'
              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
              : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
          }`}>
            {email.status}
          </span>
        </div>
        
        <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
          To: {recipientText}
        </div>

        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1 text-gray-600 dark:text-gray-300">
            <Calendar className="w-3 h-3" />
            {formatSendTime()}
          </span>
          <span className="flex items-center gap-1 text-orange-600 dark:text-orange-400 font-medium">
            <Clock className="w-3 h-3" />
            {formatTimeRemaining()}
          </span>
        </div>

        {email.snippet && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 line-clamp-1">
            {email.snippet}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {onSendNow && (
          <button
            onClick={() => onSendNow(email.id)}
            title="Send now"
            className="p-2 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30
              text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        )}
        <button
          onClick={() => onEdit(email)}
          title="Edit"
          className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600
            text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => onCancel(email.id)}
          title="Cancel"
          className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30
            text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
};

/**
 * ScheduledEmailsList - Full list of scheduled emails
 */
const ScheduledEmailsList = ({ onEdit, onCompose }) => {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);

  // Fetch scheduled emails
  const fetchScheduled = async () => {
    try {
      setLoading(true);
      const res = await mailApi.getScheduled();
      setEmails(res.data.emails || []);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch scheduled emails:', err);
      setError('Failed to load scheduled emails');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScheduled();
    
    // Refresh every minute to update time remaining
    const interval = setInterval(fetchScheduled, 60000);
    return () => clearInterval(interval);
  }, []);

  // Cancel scheduled email
  const handleCancel = async (id) => {
    if (!confirm('Are you sure you want to cancel this scheduled email?')) return;
    
    setCancellingId(id);
    try {
      await mailApi.cancelScheduled(id);
      setEmails(emails.filter(e => e.id !== id));
    } catch (err) {
      console.error('Failed to cancel:', err);
      alert('Failed to cancel scheduled email');
    } finally {
      setCancellingId(null);
    }
  };

  // Edit scheduled email
  const handleEdit = (email) => {
    if (onEdit) {
      onEdit(email);
    }
  };

  // Send now (update scheduledAt to now)
  const handleSendNow = async (id) => {
    if (!confirm('Send this email now?')) return;
    
    try {
      await mailApi.updateScheduled(id, { scheduledAt: new Date().toISOString() });
      fetchScheduled();
    } catch (err) {
      console.error('Failed to send now:', err);
      alert('Failed to send email');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-orange-500 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-red-500">
        <AlertCircle className="w-8 h-8 mb-2" />
        <p>{error}</p>
        <button
          onClick={fetchScheduled}
          className="mt-4 px-4 py-2 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600"
        >
          Try again
        </button>
      </div>
    );
  }

  if (emails.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400">
        <Clock className="w-12 h-12 mb-4" />
        <p className="font-medium">No scheduled emails</p>
        <p className="text-sm mt-1">Schedule an email to send it later</p>
        {onCompose && (
          <button
            onClick={() => onCompose({ scheduled: true })}
            className="mt-4 flex items-center gap-2 px-4 py-2 text-sm 
              bg-orange-500 text-white rounded-lg hover:bg-orange-600"
          >
            <Calendar className="w-4 h-4" />
            Schedule an email
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100 dark:divide-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800/50">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-orange-500" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Scheduled
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-900/30 
            text-orange-700 dark:text-orange-400">
            {emails.length}
          </span>
        </div>
        <button
          onClick={fetchScheduled}
          className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 
            dark:hover:text-gray-200"
        >
          Refresh
        </button>
      </div>

      {/* Email List */}
      <AnimatePresence>
        {emails.map((email) => (
          <ScheduledEmailItem
            key={email.id}
            email={email}
            onEdit={handleEdit}
            onCancel={handleCancel}
            onSendNow={handleSendNow}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

export default ScheduledEmailsList;
