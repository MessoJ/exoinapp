import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, MessageSquare, RefreshCw, X } from 'lucide-react';
import { useSmartReply } from '../../hooks/useSmartCompose';

/**
 * SmartReplyCard - Shows AI-generated quick reply suggestions
 */
const SmartReplyCard = ({ 
  emailContent, 
  senderName, 
  subject,
  onSelectReply,
  onClose,
  autoFetch = true,
}) => {
  const { replies, loading, error, isAvailable, generateReplies, clearReplies } = useSmartReply();
  const [hasGenerated, setHasGenerated] = useState(false);

  // Auto-generate replies when component mounts
  useEffect(() => {
    if (autoFetch && isAvailable && !hasGenerated && emailContent) {
      setHasGenerated(true);
      generateReplies(emailContent, { senderName, subject });
    }
  }, [autoFetch, isAvailable, hasGenerated, emailContent, senderName, subject, generateReplies]);

  // Handle reply selection
  const handleSelect = (reply) => {
    if (onSelectReply) {
      onSelectReply(reply);
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    generateReplies(emailContent, { senderName, subject });
  };

  // If AI is not available, don't render
  if (!isAvailable) return null;

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 
      rounded-xl p-4 border border-blue-100 dark:border-blue-800">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
            Quick replies
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="p-1.5 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-800/50
              text-blue-600 dark:text-blue-400 transition-colors disabled:opacity-50"
            title="Refresh suggestions"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-800/50
                text-blue-600 dark:text-blue-400 transition-colors"
              title="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-4">
          <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            Generating replies...
          </div>
        </div>
      ) : error ? (
        <div className="text-sm text-red-500 dark:text-red-400 py-2">
          {error}
        </div>
      ) : replies.length === 0 ? (
        <div className="text-sm text-gray-500 dark:text-gray-400 py-2">
          No suggestions available
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {replies.map((reply, index) => (
              <motion.button
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => handleSelect(reply)}
                className="w-full flex items-start gap-3 p-3 rounded-lg bg-white dark:bg-gray-800
                  border border-gray-200 dark:border-gray-700
                  hover:border-blue-300 dark:hover:border-blue-600
                  hover:shadow-sm transition-all text-left group"
              >
                <MessageSquare className="w-4 h-4 text-gray-400 group-hover:text-blue-500 
                  flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                  {reply}
                </span>
              </motion.button>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

/**
 * SmartReplyPills - Compact pill-style reply suggestions
 */
export const SmartReplyPills = ({ 
  emailContent, 
  senderName, 
  subject,
  onSelectReply,
  className = '',
}) => {
  const { replies, loading, isAvailable, generateReplies } = useSmartReply();
  const [hasGenerated, setHasGenerated] = useState(false);

  useEffect(() => {
    if (isAvailable && !hasGenerated && emailContent) {
      setHasGenerated(true);
      generateReplies(emailContent, { senderName, subject });
    }
  }, [isAvailable, hasGenerated, emailContent, senderName, subject, generateReplies]);

  if (!isAvailable || (replies.length === 0 && !loading)) return null;

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
        <Sparkles className="w-3 h-3" />
        Quick reply:
      </span>
      {loading ? (
        <span className="text-xs text-gray-400 italic">Generating...</span>
      ) : (
        replies.map((reply, index) => (
          <button
            key={index}
            onClick={() => onSelectReply(reply)}
            className="px-3 py-1.5 text-xs font-medium rounded-full 
              bg-blue-50 dark:bg-blue-900/30 
              text-blue-700 dark:text-blue-300
              hover:bg-blue-100 dark:hover:bg-blue-800/50
              border border-blue-200 dark:border-blue-700
              transition-colors truncate max-w-xs"
          >
            {reply.length > 50 ? reply.substring(0, 50) + '...' : reply}
          </button>
        ))
      )}
    </div>
  );
};

export default SmartReplyCard;
