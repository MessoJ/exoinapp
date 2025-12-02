import React, { useRef, useEffect, useCallback } from 'react';
import { 
  Star, Paperclip, Flag, Clock, Check, MoreHorizontal,
  Archive, Trash2, Mail, MailOpen, Tag, MessageSquare
} from 'lucide-react';
import { LabelBadge } from './FolderTree';

/**
 * Format date for email list display
 */
const formatDate = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now - date;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days === 0) {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit', 
      hour12: true 
    });
  }
  if (days === 1) return 'Yesterday';
  if (days < 7) {
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  }
  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
};

/**
 * Email Avatar Component
 */
const EmailAvatar = ({ name, email, size = 'md' }) => {
  const sizes = { 
    sm: 'w-8 h-8 text-xs', 
    md: 'w-10 h-10 text-sm', 
    lg: 'w-12 h-12 text-base' 
  };
  
  const initials = name 
    ? name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() 
    : email?.[0]?.toUpperCase() || '?';
  
  const colors = [
    'from-blue-500 to-blue-600', 
    'from-purple-500 to-purple-600', 
    'from-green-500 to-green-600',
    'from-orange-500 to-orange-600', 
    'from-pink-500 to-pink-600', 
    'from-teal-500 to-teal-600',
    'from-indigo-500 to-indigo-600',
    'from-rose-500 to-rose-600',
  ];
  
  const colorIndex = (name || email || '').split('').reduce(
    (acc, char) => acc + char.charCodeAt(0), 0
  ) % colors.length;
  
  return (
    <div className={`${sizes[size]} rounded-full bg-gradient-to-br ${colors[colorIndex]} flex items-center justify-center text-white font-semibold flex-shrink-0`}>
      {initials}
    </div>
  );
};

/**
 * Single Email List Item
 */
const EmailListItem = ({ 
  email, 
  selected, 
  highlighted,
  selectMode,
  isChecked,
  density = 'comfortable',
  onSelect, 
  onStar, 
  onCheck,
  onQuickAction,
  labels = [],
}) => {
  const densityClasses = {
    comfortable: 'px-4 py-3',
    cozy: 'px-3 py-2.5',
    compact: 'px-3 py-2',
  };

  const handleCheckboxClick = (e) => {
    e.stopPropagation();
    onCheck?.(email.id);
  };

  const handleStarClick = (e) => {
    e.stopPropagation();
    onStar?.(email.id, !email.isStarred);
  };

  const handleQuickAction = (action, e) => {
    e.stopPropagation();
    onQuickAction?.(action, email);
  };

  // Get labels for this email
  const emailLabels = labels.filter(l => email.labels?.includes(l.id));

  return (
    <div
      onClick={() => onSelect(email)}
      className={`
        flex items-center gap-3 cursor-pointer transition-all border-b border-slate-100 dark:border-slate-700 group
        ${densityClasses[density]}
        ${selected 
          ? 'bg-orange-50 dark:bg-orange-500/10 border-l-2 border-l-orange-500' 
          : highlighted 
            ? 'bg-blue-50/50 dark:bg-blue-500/10'
            : !email.isRead 
              ? 'bg-blue-50/30 dark:bg-blue-500/5 hover:bg-blue-50/50 dark:hover:bg-blue-500/10' 
              : 'hover:bg-slate-50 dark:hover:bg-slate-800'
        }
      `}
    >
      {/* Checkbox (in select mode or on hover) */}
      <div className={`${selectMode ? 'block' : 'hidden group-hover:block'} flex-shrink-0`}>
        <input
          type="checkbox"
          checked={isChecked}
          onChange={handleCheckboxClick}
          onClick={(e) => e.stopPropagation()}
          className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-orange-500 focus:ring-orange-500 cursor-pointer bg-white dark:bg-slate-700"
        />
      </div>

      {/* Star */}
      <button
        onClick={handleStarClick}
        className={`flex-shrink-0 transition-colors ${
          email.isStarred 
            ? 'text-yellow-500' 
            : 'text-slate-300 dark:text-slate-600 hover:text-yellow-500'
        }`}
      >
        <Star size={18} fill={email.isStarred ? 'currentColor' : 'none'} />
      </button>
      
      {/* Avatar (hidden in compact mode) */}
      {density !== 'compact' && (
        <EmailAvatar 
          name={email.from?.name} 
          email={email.from?.address} 
          size="sm" 
        />
      )}
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {/* Sender */}
          <span className={`truncate ${
            !email.isRead ? 'font-semibold text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'
          }`}>
            {email.from?.name || email.from?.address}
          </span>
          
          {/* Indicators */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {/* Thread count indicator */}
            {email.threadCount > 1 && (
              <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 text-[10px] font-semibold rounded">
                {email.threadCount}
              </span>
            )}
            {email.hasAttachments && (
              <Paperclip size={14} className="text-slate-400 dark:text-slate-500" />
            )}
            {email.priority === 'high' && (
              <Flag size={14} className="text-red-500" />
            )}
            {email.snoozedUntil && (
              <Clock size={14} className="text-purple-500" />
            )}
          </div>
        </div>
        
        {/* Subject and snippet */}
        <div className="flex items-baseline gap-2">
          <span className={`truncate text-sm ${
            !email.isRead ? 'font-medium text-slate-800 dark:text-slate-200' : 'text-slate-600 dark:text-slate-400'
          }`}>
            {email.subject || '(No subject)'}
          </span>
          {density !== 'compact' && (
            <span className="text-slate-400 dark:text-slate-500 text-xs truncate flex-1">
              — {email.snippet}
            </span>
          )}
        </div>

        {/* Labels */}
        {emailLabels.length > 0 && density !== 'compact' && (
          <div className="flex items-center gap-1 mt-1">
            {emailLabels.slice(0, 3).map(label => (
              <LabelBadge key={label.id} label={label} size="xs" />
            ))}
            {emailLabels.length > 3 && (
              <span className="text-xs text-slate-400">+{emailLabels.length - 3}</span>
            )}
          </div>
        )}
      </div>
      
      {/* Date and quick actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className={`text-xs ${
          !email.isRead ? 'font-medium text-slate-700 dark:text-slate-300' : 'text-slate-400 dark:text-slate-500'
        }`}>
          {formatDate(email.date)}
        </span>
        
        {/* Quick actions (visible on hover) */}
        <div className="hidden group-hover:flex items-center gap-0.5 ml-1">
          <button
            onClick={(e) => handleQuickAction('archive', e)}
            className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            title="Archive"
          >
            <Archive size={14} />
          </button>
          <button
            onClick={(e) => handleQuickAction('delete', e)}
            className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-slate-400 hover:text-red-500"
            title="Delete"
          >
            <Trash2 size={14} />
          </button>
          <button
            onClick={(e) => handleQuickAction(email.isRead ? 'markUnread' : 'markRead', e)}
            className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            title={email.isRead ? 'Mark unread' : 'Mark read'}
          >
            {email.isRead ? <Mail size={14} /> : <MailOpen size={14} />}
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Email List Component with Virtualization
 * 
 * For large email lists, this component can be enhanced with 
 * react-window or @tanstack/virtual for better performance.
 */
const EmailList = ({
  emails = [],
  selectedEmail,
  highlightedIndex = -1,
  selectMode = false,
  selectedIds = [],
  density = 'comfortable',
  labels = [],
  loading = false,
  emptyState = null,
  onSelectEmail,
  onStarEmail,
  onToggleSelect,
  onQuickAction,
  onLoadMore,
  hasMore = false,
}) => {
  const listRef = useRef(null);
  const loadMoreRef = useRef(null);

  // Intersection observer for infinite scroll
  useEffect(() => {
    if (!hasMore || !loadMoreRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onLoadMore?.();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [hasMore, onLoadMore]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const items = listRef.current.children;
      if (items[highlightedIndex]) {
        items[highlightedIndex].scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        });
      }
    }
  }, [highlightedIndex]);

  if (loading && emails.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-slate-500 dark:text-slate-400">Loading emails...</span>
        </div>
      </div>
    );
  }

  if (emails.length === 0) {
    return emptyState || (
      <div className="flex flex-col items-center justify-center h-64 text-slate-400 dark:text-slate-500 px-4">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center mb-4">
          <Mail size={32} className="text-slate-400 dark:text-slate-500" />
        </div>
        <p className="text-lg font-medium text-slate-600 dark:text-slate-300">No emails</p>
        <p className="text-sm text-slate-400 dark:text-slate-500 mt-1 text-center">
          Your inbox is empty
        </p>
      </div>
    );
  }

  return (
    <div ref={listRef} className="overflow-y-auto h-full">
      {emails.map((email, index) => (
        <EmailListItem
          key={email.id}
          email={email}
          selected={selectedEmail?.id === email.id}
          highlighted={highlightedIndex === index}
          selectMode={selectMode}
          isChecked={selectedIds.includes(email.id)}
          density={density}
          labels={labels}
          onSelect={onSelectEmail}
          onStar={onStarEmail}
          onCheck={onToggleSelect}
          onQuickAction={onQuickAction}
        />
      ))}
      
      {/* Load more trigger */}
      {hasMore && (
        <div 
          ref={loadMoreRef}
          className="flex items-center justify-center py-4"
        >
          {loading && (
            <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          )}
        </div>
      )}
    </div>
  );
};

export { EmailList, EmailListItem, EmailAvatar, formatDate };
export default EmailList;
