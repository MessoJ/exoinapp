import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronDown, 
  ChevronUp, 
  Star, 
  AlertCircle,
  Inbox,
  Sparkles
} from 'lucide-react';
import { EmailListItem } from './EmailList';

/**
 * PriorityInboxSection - A collapsible section in the Priority Inbox view
 */
const PriorityInboxSection = ({ 
  title, 
  icon: Icon, 
  emails, 
  onEmailClick,
  selectedEmailId,
  onStar,
  onDelete,
  onArchive,
  defaultExpanded = true,
  emptyMessage = 'No emails',
  variant = 'default', // 'default' | 'important' | 'starred'
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  
  if (!emails || emails.length === 0) return null;

  const variantStyles = {
    default: 'border-gray-200 dark:border-gray-700',
    important: 'border-orange-200 dark:border-orange-800 bg-orange-50/30 dark:bg-orange-900/10',
    starred: 'border-yellow-200 dark:border-yellow-800 bg-yellow-50/30 dark:bg-yellow-900/10',
  };

  const headerStyles = {
    default: 'text-gray-700 dark:text-gray-300',
    important: 'text-orange-700 dark:text-orange-400',
    starred: 'text-yellow-700 dark:text-yellow-400',
  };

  return (
    <div className={`mb-4 rounded-lg border ${variantStyles[variant]} overflow-hidden`}>
      {/* Section Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-full flex items-center justify-between px-4 py-2.5 
          hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors
          ${headerStyles[variant]}`}
      >
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-4 h-4" />}
          <span className="font-medium text-sm">{title}</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 
            text-gray-600 dark:text-gray-400">
            {emails.length}
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        )}
      </button>

      {/* Email List */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {emails.map((email) => (
                <EmailListItem
                  key={email.id}
                  email={email}
                  isSelected={selectedEmailId === email.id}
                  onClick={() => onEmailClick(email)}
                  onStar={onStar}
                  onDelete={onDelete}
                  onArchive={onArchive}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/**
 * PriorityInboxView - Full priority inbox with all sections
 */
export const PriorityInboxView = ({
  sections,
  loading,
  selectedEmailId,
  onEmailClick,
  onStar,
  onDelete,
  onArchive,
  onRefresh,
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-orange-500 border-t-transparent" />
      </div>
    );
  }

  if (!sections) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400">
        <Inbox className="w-12 h-12 mb-4" />
        <p>No priority data available</p>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="mt-4 px-4 py-2 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600"
          >
            Load Priority Inbox
          </button>
        )}
      </div>
    );
  }

  const { importantAndUnread, starred, everythingElse } = sections;
  const hasEmails = 
    importantAndUnread?.emails?.length > 0 || 
    starred?.emails?.length > 0 || 
    everythingElse?.emails?.length > 0;

  if (!hasEmails) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400">
        <Sparkles className="w-12 h-12 mb-4" />
        <p className="font-medium">All caught up!</p>
        <p className="text-sm mt-1">Your inbox is empty</p>
      </div>
    );
  }

  return (
    <div className="p-2">
      {/* Important & Unread Section */}
      <PriorityInboxSection
        title={importantAndUnread?.title || 'Important and unread'}
        icon={AlertCircle}
        emails={importantAndUnread?.emails || []}
        selectedEmailId={selectedEmailId}
        onEmailClick={onEmailClick}
        onStar={onStar}
        onDelete={onDelete}
        onArchive={onArchive}
        defaultExpanded={true}
        variant="important"
      />

      {/* Starred Section */}
      <PriorityInboxSection
        title={starred?.title || 'Starred'}
        icon={Star}
        emails={starred?.emails || []}
        selectedEmailId={selectedEmailId}
        onEmailClick={onEmailClick}
        onStar={onStar}
        onDelete={onDelete}
        onArchive={onArchive}
        defaultExpanded={true}
        variant="starred"
      />

      {/* Everything Else Section */}
      <PriorityInboxSection
        title={everythingElse?.title || 'Everything else'}
        icon={Inbox}
        emails={everythingElse?.emails || []}
        selectedEmailId={selectedEmailId}
        onEmailClick={onEmailClick}
        onStar={onStar}
        onDelete={onDelete}
        onArchive={onArchive}
        defaultExpanded={true}
        variant="default"
      />
    </div>
  );
};

/**
 * PriorityBadge - Shows priority level on an email
 */
export const PriorityBadge = ({ level, score, reasons }) => {
  const badgeStyles = {
    high: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    medium: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    low: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
  };

  const icons = {
    high: <AlertCircle className="w-3 h-3" />,
    medium: <Sparkles className="w-3 h-3" />,
    low: null,
  };

  if (level === 'low' && !reasons?.length) return null;

  return (
    <div 
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium
        ${badgeStyles[level]}`}
      title={reasons?.join('\n')}
    >
      {icons[level]}
      <span className="capitalize">{level} priority</span>
    </div>
  );
};

/**
 * PriorityToggle - Toggle for enabling/disabling priority inbox
 */
export const PriorityToggle = ({ enabled, onChange }) => {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium
        transition-colors ${
          enabled 
            ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' 
            : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
        }`}
    >
      <Sparkles className="w-4 h-4" />
      <span>Priority Inbox</span>
      {enabled && (
        <span className="px-1.5 py-0.5 text-xs bg-orange-200 dark:bg-orange-800 rounded">
          ON
        </span>
      )}
    </button>
  );
};

export default PriorityInboxSection;
