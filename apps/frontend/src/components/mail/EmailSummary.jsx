import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2, 
  AlertCircle,
  FileText,
  RefreshCw,
  X 
} from 'lucide-react';
import { useEmailSummarize } from '../../hooks/useSmartCompose';

/**
 * EmailSummaryCard - Shows AI-generated summary of email/thread
 */
const EmailSummaryCard = ({ 
  emailContent, 
  autoGenerate = false,
  onClose,
  className = '',
}) => {
  const { summary, loading, error, isAvailable, summarize, clearSummary } = useEmailSummarize();
  const [isExpanded, setIsExpanded] = useState(true);
  const [hasGenerated, setHasGenerated] = useState(false);

  // Generate summary
  const handleGenerate = async () => {
    if (!hasGenerated || summary === null) {
      await summarize(emailContent, { includeActionItems: true });
      setHasGenerated(true);
    }
  };

  // Refresh summary
  const handleRefresh = async () => {
    await summarize(emailContent, { includeActionItems: true });
  };

  // Auto-generate if enabled
  React.useEffect(() => {
    if (autoGenerate && isAvailable && !hasGenerated && emailContent) {
      handleGenerate();
    }
  }, [autoGenerate, isAvailable, hasGenerated, emailContent]);

  if (!isAvailable) return null;

  // Compact button to trigger summary
  if (!summary && !loading && !error) {
    return (
      <button
        onClick={handleGenerate}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm
          bg-purple-50 dark:bg-purple-900/20 
          text-purple-700 dark:text-purple-300
          hover:bg-purple-100 dark:hover:bg-purple-800/30
          border border-purple-200 dark:border-purple-700
          transition-colors ${className}`}
      >
        <Sparkles className="w-4 h-4" />
        Summarize
      </button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 
        rounded-xl border border-purple-100 dark:border-purple-800 overflow-hidden ${className}`}
    >
      {/* Header */}
      <div 
        className="flex items-center justify-between px-4 py-3 cursor-pointer
          hover:bg-purple-100/50 dark:hover:bg-purple-800/30 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
            AI Summary
          </span>
          {loading && (
            <span className="text-xs text-purple-500 italic">Generating...</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleRefresh();
            }}
            disabled={loading}
            className="p-1.5 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-700
              text-purple-600 dark:text-purple-400 transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          {onClose && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                clearSummary();
                onClose();
              }}
              className="p-1.5 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-700
                text-purple-600 dark:text-purple-400 transition-colors"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-purple-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-purple-400" />
          )}
        </div>
      </div>

      {/* Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4">
              {loading ? (
                <div className="flex items-center justify-center py-6">
                  <div className="flex items-center gap-2 text-sm text-purple-600 dark:text-purple-400">
                    <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                    Analyzing email...
                  </div>
                </div>
              ) : error ? (
                <div className="flex items-center gap-2 text-sm text-red-500 py-2">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              ) : summary ? (
                <div className="space-y-4">
                  {/* Summary */}
                  <div>
                    <div className="flex items-center gap-2 text-xs font-medium text-purple-600 dark:text-purple-400 mb-2">
                      <FileText className="w-3.5 h-3.5" />
                      Summary
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                      {summary.summary}
                    </p>
                  </div>

                  {/* Key Points */}
                  {summary.keyPoints && summary.keyPoints.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 text-xs font-medium text-purple-600 dark:text-purple-400 mb-2">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Key Points
                      </div>
                      <ul className="space-y-1">
                        {summary.keyPoints.map((point, idx) => (
                          <li 
                            key={idx}
                            className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400"
                          >
                            <span className="text-purple-400 mt-1">•</span>
                            {point}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Action Items */}
                  {summary.actionItems && summary.actionItems.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 text-xs font-medium text-orange-600 dark:text-orange-400 mb-2">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Action Items
                      </div>
                      <ul className="space-y-1">
                        {summary.actionItems.map((action, idx) => (
                          <li 
                            key={idx}
                            className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300"
                          >
                            <input
                              type="checkbox"
                              className="mt-0.5 rounded border-orange-300 text-orange-500 
                                focus:ring-orange-500 focus:ring-offset-0"
                            />
                            {action}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

/**
 * SummaryButton - Compact button to trigger summarization
 */
export const SummaryButton = ({ onClick, loading = false, className = '' }) => {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg
        bg-purple-50 dark:bg-purple-900/20 
        text-purple-700 dark:text-purple-300
        hover:bg-purple-100 dark:hover:bg-purple-800/30
        transition-colors disabled:opacity-50 ${className}`}
    >
      {loading ? (
        <div className="w-3.5 h-3.5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      ) : (
        <Sparkles className="w-3.5 h-3.5" />
      )}
      {loading ? 'Summarizing...' : 'Summarize'}
    </button>
  );
};

export default EmailSummaryCard;
