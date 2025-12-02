import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Archive,
  Trash2,
  Reply,
  ReplyAll,
  Forward,
  Star,
  MoreHorizontal,
  Printer,
  Clock,
  Tag,
  Mail,
  MailOpen,
  Paperclip,
  FileText,
  Image,
  File,
  Download,
  ExternalLink,
  Users,
  AlertTriangle,
  X,
  Check,
  CornerUpLeft,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { EmailAvatar, formatDate } from './EmailList';
import { LabelBadge, LABEL_COLORS } from './FolderTree';
import AttachmentPreview, { AttachmentChip } from './AttachmentPreview';

import { mailApi } from '../../lib/api';

/**
 * Format file size for display
 */
const formatSize = (bytes) => {
  if (!bytes) return '0 B';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

/**
 * Get icon for attachment based on type
 */
const getAttachmentIcon = (filename, contentType) => {
  if (contentType?.startsWith('image/')) return Image;
  if (filename?.match(/\.(pdf)$/i)) return FileText;
  if (filename?.match(/\.(doc|docx|txt|rtf)$/i)) return FileText;
  return File;
};

/**
 * Full Attachment List
 */
const AttachmentList = ({ attachments, onDownload, onPreview }) => {
  if (!attachments?.length) return null;

  return (
    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
        {attachments.length} Attachment{attachments.length > 1 ? 's' : ''}
      </p>
      <div className="grid grid-cols-2 gap-2">
        {attachments.map((attachment, index) => {
          const Icon = getAttachmentIcon(attachment.filename, attachment.contentType);
          return (
            <div
              key={attachment.id || index}
              className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-lg hover:border-orange-300 dark:hover:border-orange-500 transition-colors group cursor-pointer"
              onClick={() => onPreview?.(attachment, attachments)}
            >
              <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded flex items-center justify-center flex-shrink-0">
                <Icon size={16} className="text-slate-500 dark:text-slate-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">
                  {attachment.filename}
                </p>
                <p className="text-[10px] text-slate-400">{formatSize(attachment.size)}</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); onDownload?.(attachment); }}
                className="p-1 opacity-0 group-hover:opacity-100 hover:bg-slate-200 dark:hover:bg-slate-600 rounded transition-all"
              >
                <Download size={12} className="text-slate-500" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/**
 * Single message in a thread (collapsed view)
 */
const CollapsedMessage = ({ message, onClick, isFirst, isLast }) => {
  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors border-b border-slate-100 dark:border-slate-700 ${
        isFirst ? 'rounded-t-xl' : ''
      } ${isLast ? 'rounded-b-xl border-b-0' : ''}`}
    >
      <EmailAvatar name={message.from?.name} email={message.from?.address} size="sm" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm text-slate-900 dark:text-white truncate">
            {message.from?.name || message.from?.address}
          </span>
          {message.hasAttachments && (
            <Paperclip size={12} className="text-slate-400 flex-shrink-0" />
          )}
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
          {message.snippet || message.subject}
        </p>
      </div>
      <span className="text-xs text-slate-400 flex-shrink-0">
        {formatDate(message.date)}
      </span>
    </div>
  );
};

/**
 * Single message in a thread (expanded view)
 */
const ExpandedMessage = ({ 
  message, 
  onCollapse, 
  onReply, 
  onReplyAll, 
  onForward,
  onDownloadAttachment,
  onPreviewAttachment,
  isLast,
}) => {
  const [showFullHeaders, setShowFullHeaders] = useState(false);
  
  // Format recipients list
  const formatRecipients = (recipients) => {
    if (!recipients?.length) return null;
    if (recipients.length <= 2) {
      return recipients.map(r => r.name || r.address).join(', ');
    }
    return `${recipients[0].name || recipients[0].address} and ${recipients.length - 1} others`;
  };

  return (
    <div className={`bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-700 ${isLast ? 'border-b-0 rounded-b-xl' : ''}`}>
      {/* Message Header */}
      <div className="px-4 py-3 flex items-start gap-3">
        <EmailAvatar name={message.from?.name} email={message.from?.address} size="md" />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-semibold text-slate-900 dark:text-white truncate">
                {message.from?.name || message.from?.address}
              </span>
              <span className="text-xs text-slate-400 truncate hidden sm:inline">
                &lt;{message.from?.address}&gt;
              </span>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <span className="text-xs text-slate-500">
                {new Date(message.date).toLocaleString()}
              </span>
              <button
                onClick={onCollapse}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-400"
              >
                <ChevronUp size={16} />
              </button>
            </div>
          </div>
          
          {/* To/Cc line */}
          <button
            onClick={() => setShowFullHeaders(!showFullHeaders)}
            className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-1 mt-0.5"
          >
            <span>to {formatRecipients(message.to)}</span>
            <ChevronDown size={12} className={`transition-transform ${showFullHeaders ? 'rotate-180' : ''}`} />
          </button>
          
          {/* Full headers */}
          <AnimatePresence>
            {showFullHeaders && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden mt-2 p-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs space-y-1"
              >
                <div className="flex gap-2">
                  <span className="text-slate-500 w-12">From:</span>
                  <span className="text-slate-700 dark:text-slate-300">{message.from?.address}</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-slate-500 w-12">To:</span>
                  <span className="text-slate-700 dark:text-slate-300">
                    {message.to?.map(r => r.address).join(', ')}
                  </span>
                </div>
                {message.cc?.length > 0 && (
                  <div className="flex gap-2">
                    <span className="text-slate-500 w-12">Cc:</span>
                    <span className="text-slate-700 dark:text-slate-300">
                      {message.cc.map(r => r.address).join(', ')}
                    </span>
                  </div>
                )}
                <div className="flex gap-2">
                  <span className="text-slate-500 w-12">Date:</span>
                  <span className="text-slate-700 dark:text-slate-300">
                    {new Date(message.date).toLocaleString()}
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      
      {/* Message Body */}
      <div className="px-4 pb-4">
        <div 
          className="prose prose-sm dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 email-html-content"
          dangerouslySetInnerHTML={{ 
            __html: message.html || message.body || '<p>No content</p>' 
          }}
        />
        
        {/* Attachments */}
        <AttachmentList 
          attachments={message.attachments}
          onDownload={onDownloadAttachment}
          onPreview={onPreviewAttachment}
        />
      </div>
      
      {/* Quick reply actions */}
      <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-700 flex items-center gap-2">
        <button
          onClick={() => onReply?.(message)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
        >
          <Reply size={14} />
          Reply
        </button>
        <button
          onClick={() => onReplyAll?.(message)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
        >
          <ReplyAll size={14} />
          Reply All
        </button>
        <button
          onClick={() => onForward?.(message)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
        >
          <Forward size={14} />
          Forward
        </button>
      </div>
    </div>
  );
};

/**
 * Thread Participants Summary
 */
const ThreadParticipants = ({ messages }) => {
  const participants = useMemo(() => {
    const seen = new Set();
    return messages
      .map(m => m.from)
      .filter(from => {
        if (!from?.address || seen.has(from.address)) return false;
        seen.add(from.address);
        return true;
      });
  }, [messages]);

  if (participants.length <= 1) return null;

  return (
    <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
      <Users size={12} />
      <span>{participants.length} participants</span>
    </div>
  );
};

/**
 * Email Thread/Conversation View Component
 * 
 * Displays a conversation thread with all related messages
 */
const EmailThread = ({
  messages: inputMessages = [],  // Array of messages in the thread
  subject,          // Thread subject (optional, can be derived from messages)
  threadLabels = [],// Labels applied to thread
  labels = [],      // Available labels for picker
  loading = false,  // Loading state
  onClose,
  onReply,
  onReplyAll,
  onForward,
  onDelete,
  onArchive,
  onMove,
  onStar,
  onMarkRead,
  onLabel,
  onSnooze,
  onPrint,
  getAttachmentUrl,
}) => {
  const [expandedMessages, setExpandedMessages] = useState(new Set());
  const [showLabelPicker, setShowLabelPicker] = useState(false);
  const [showMoreActions, setShowMoreActions] = useState(false);
  const [previewAttachment, setPreviewAttachment] = useState(null);
  const [showAttachmentPreview, setShowAttachmentPreview] = useState(false);
  const [currentMessageAttachments, setCurrentMessageAttachments] = useState([]);
  const messagesEndRef = useRef(null);

  // Default attachment URL generator
  const defaultGetAttachmentUrl = (att) => {
    return `/api/mail/attachments/${att.id}`;
  };

  const handlePreviewAttachment = (attachment, messageAttachments = []) => {
    setPreviewAttachment(attachment);
    setCurrentMessageAttachments(messageAttachments);
    setShowAttachmentPreview(true);
  };

  const handleDownloadAttachment = async (attachment) => {
    try {
      // Use mailApi to fetch with auth headers
      const response = await mailApi.getAttachment(attachment.id);
      
      // Create blob URL
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', attachment.filename);
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download attachment:', error);
      // Fallback to direct URL if API fails (e.g. public URL)
      const url = (getAttachmentUrl || defaultGetAttachmentUrl)(attachment);
      const a = document.createElement('a');
      a.href = url;
      a.download = attachment.filename;
      a.click();
    }
  };

  // Get messages sorted by date
  const messages = useMemo(() => {
    return [...(inputMessages || [])].sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );
  }, [inputMessages]);

  // Derive subject from first message if not provided
  const threadSubject = subject || messages[0]?.subject || '(No subject)';

  // Auto-expand the last message on load
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      setExpandedMessages(new Set([lastMessage.id]));
    }
  }, [messages]);

  // Toggle message expansion
  const toggleExpanded = (messageId) => {
    setExpandedMessages(prev => {
      const next = new Set(prev);
      if (next.has(messageId)) {
        next.delete(messageId);
      } else {
        next.add(messageId);
      }
      return next;
    });
  };

  // Expand all messages
  const expandAll = () => {
    setExpandedMessages(new Set(messages.map(m => m.id)));
  };

  // Collapse all except last
  const collapseAll = () => {
    if (messages.length > 0) {
      setExpandedMessages(new Set([messages[messages.length - 1].id]));
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full" />
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Loading conversation...</p>
      </div>
    );
  }

  if (messages.length === 0) return null;

  const emailLabels = labels.filter(l => threadLabels?.includes(l.id));
  const isStarred = messages.some(m => m.isStarred);
  const totalAttachments = messages.reduce((acc, m) => acc + (m.attachments?.length || 0), 0);

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-hidden">
      {/* Thread Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex-shrink-0">
        <div className="flex items-center gap-1">
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-400 transition-colors"
            title="Back to list"
          >
            <ChevronLeft size={18} />
          </button>
          
          <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-1" />
          
          <button 
            onClick={onArchive} 
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-400 transition-colors"
            title="Archive"
          >
            <Archive size={18} />
          </button>
          <button 
            onClick={() => onMove?.('SPAM')} 
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-400 transition-colors"
            title="Report spam"
          >
            <AlertTriangle size={18} />
          </button>
          <button 
            onClick={onDelete} 
            className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg text-slate-600 dark:text-slate-400 hover:text-red-600 transition-colors"
            title="Delete"
          >
            <Trash2 size={18} />
          </button>
          
          <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-1" />
          
          <button 
            onClick={() => onMarkRead?.(true)} 
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-400 transition-colors"
            title="Mark all as read"
          >
            <MailOpen size={18} />
          </button>
          <button 
            onClick={onSnooze} 
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-400 transition-colors"
            title="Snooze"
          >
            <Clock size={18} />
          </button>
          
          <div className="relative">
            <button 
              onClick={() => setShowLabelPicker(!showLabelPicker)} 
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-400 transition-colors"
              title="Labels"
            >
              <Tag size={18} />
            </button>
            
            {/* Label Picker would go here */}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button 
            onClick={() => onStar?.(!isStarred)} 
            className={`p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors ${
              isStarred ? 'text-yellow-500' : 'text-slate-400'
            }`}
            title={isStarred ? 'Unstar' : 'Star'}
          >
            <Star size={18} fill={isStarred ? 'currentColor' : 'none'} />
          </button>
          
          <button 
            onClick={onPrint} 
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-400 transition-colors"
            title="Print"
          >
            <Printer size={18} />
          </button>
          
          <div className="relative">
            <button 
              onClick={() => setShowMoreActions(!showMoreActions)} 
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-400 transition-colors"
              title="More actions"
            >
              <MoreHorizontal size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Thread Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-4">
          {/* Thread Header */}
          <div className="mb-4">
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
                {threadSubject}
              </h1>
              
              {/* Thread Labels */}
              {emailLabels.length > 0 && (
                <div className="flex items-center gap-1 flex-shrink-0">
                  {emailLabels.map(label => (
                    <LabelBadge key={label.id} label={label} size="sm" />
                  ))}
                </div>
              )}
            </div>
            
            {/* Thread Meta */}
            <div className="flex items-center gap-3 mt-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1">
                <Mail size={12} />
                {messages.length} message{messages.length !== 1 ? 's' : ''}
              </span>
              
              <ThreadParticipants messages={messages} />
              
              {totalAttachments > 0 && (
                <span className="flex items-center gap-1">
                  <Paperclip size={12} />
                  {totalAttachments} attachment{totalAttachments !== 1 ? 's' : ''}
                </span>
              )}
              
              <div className="flex-1" />
              
              {/* Expand/Collapse buttons */}
              {messages.length > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={expandAll}
                    className="px-2 py-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-400"
                    title="Expand all"
                  >
                    <Maximize2 size={14} />
                  </button>
                  <button
                    onClick={collapseAll}
                    className="px-2 py-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-400"
                    title="Collapse all"
                  >
                    <Minimize2 size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Messages List */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            {messages.map((message, index) => {
              const isExpanded = expandedMessages.has(message.id);
              const isFirst = index === 0;
              const isLast = index === messages.length - 1;
              
              return (
                <div key={message.id}>
                  {isExpanded ? (
                    <ExpandedMessage
                      message={message}
                      onCollapse={() => toggleExpanded(message.id)}
                      onReply={onReply}
                      onReplyAll={onReplyAll}
                      onForward={onForward}
                      onDownloadAttachment={handleDownloadAttachment}
                      onPreviewAttachment={handlePreviewAttachment}
                      isLast={isLast}
                    />
                  ) : (
                    <CollapsedMessage
                      message={message}
                      onClick={() => toggleExpanded(message.id)}
                      isFirst={isFirst}
                      isLast={isLast}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Quick Reply Box */}
          <div className="mt-4">
            <button
              onClick={() => onReply?.(messages[messages.length - 1])}
              className="w-full flex items-center gap-3 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-orange-300 dark:hover:border-orange-500 hover:shadow-sm transition-all text-left group"
            >
              <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg group-hover:bg-orange-100 dark:group-hover:bg-orange-900/30 transition-colors">
                <Reply size={18} className="text-slate-500 dark:text-slate-400 group-hover:text-orange-600 dark:group-hover:text-orange-400" />
              </div>
              <span className="text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300">
                Click here to reply...
              </span>
            </button>
          </div>
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Attachment Preview Modal */}
      <AttachmentPreview
        attachment={previewAttachment}
        attachments={currentMessageAttachments}
        isOpen={showAttachmentPreview}
        onClose={() => setShowAttachmentPreview(false)}
        onDownload={handleDownloadAttachment}
        getAttachmentUrl={getAttachmentUrl || defaultGetAttachmentUrl}
      />
    </div>
  );
};

export default EmailThread;