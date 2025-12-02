import React, { useState, useEffect, useMemo } from 'react';
import { 
  ChevronLeft, Archive, AlertTriangle, Trash2, Reply, ReplyAll, Forward,
  Star, MoreHorizontal, Printer, Download, ExternalLink, Clock, Tag,
  Mail, MailOpen, Flag, Paperclip, FileText, Image, File,
  ChevronDown, ChevronUp, CornerUpLeft, X, Check
} from 'lucide-react';
import { EmailAvatar, formatDate } from './EmailList';
import { LabelBadge, LABEL_COLORS } from './FolderTree';
import AttachmentPreview, { AttachmentListItem } from './AttachmentPreview';

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
 * Attachment Component
 */
const Attachment = ({ attachment, onDownload, onPreview }) => {
  const Icon = getAttachmentIcon(attachment.filename, attachment.contentType);
  
  return (
    <div className="flex items-center gap-3 px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl hover:border-orange-300 dark:hover:border-orange-500 hover:shadow-sm transition-all group cursor-pointer">
      <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center">
        <Icon size={20} className="text-slate-500 dark:text-slate-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">
          {attachment.filename}
        </p>
        <p className="text-xs text-slate-400 dark:text-slate-500">
          {formatSize(attachment.size)}
        </p>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {onPreview && (
          <button
            onClick={() => onPreview(attachment)}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-500 dark:text-slate-400"
            title="Preview"
          >
            <ExternalLink size={14} />
          </button>
        )}
        <button
          onClick={() => onDownload?.(attachment)}
          className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-500 dark:text-slate-400"
          title="Download"
        >
          <Download size={14} />
        </button>
      </div>
    </div>
  );
};

/**
 * Smart Reply Suggestions (placeholder for AI integration)
 */
const SmartReplySuggestions = ({ email, onSelectReply }) => {
  // These would come from AI in the real implementation
  const suggestions = [
    "Thanks for the update!",
    "I'll look into this and get back to you.",
    "Sounds good, let's proceed.",
  ];

  return (
    <div className="flex flex-wrap gap-2 mt-4">
      {suggestions.map((text, i) => (
        <button
          key={i}
          onClick={() => onSelectReply(text)}
          className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-full hover:bg-orange-50 dark:hover:bg-orange-500/20 hover:border-orange-300 dark:hover:border-orange-500 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
        >
          {text}
        </button>
      ))}
    </div>
  );
};

/**
 * Email Preview/Reader Component
 * 
 * Displays the full email content with actions toolbar.
 */
const EmailPreview = ({
  email,
  labels = [],
  showSmartReply = false,
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
  onSmartReply,
  getAttachmentUrl,
}) => {
  const [showAllRecipients, setShowAllRecipients] = useState(false);
  const [showMoreActions, setShowMoreActions] = useState(false);
  const [showLabelPicker, setShowLabelPicker] = useState(false);
  const [previewAttachment, setPreviewAttachment] = useState(null);
  const [showAttachmentPreview, setShowAttachmentPreview] = useState(false);

  // Default attachment URL generator
  const defaultGetAttachmentUrl = (att) => {
    return `/api/mail/attachments/${att.id}`;
  };

  const handlePreviewAttachment = (attachment) => {
    setPreviewAttachment(attachment);
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

  if (!email) return null;

  // Get labels for this email
  const emailLabels = labels.filter(l => email.labels?.includes(l.id));
  
  // Format recipients
  const hasMultipleRecipients = (email.to?.length || 0) + (email.cc?.length || 0) > 3;

  const handlePrint = () => {
    window.print();
    onPrint?.();
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-900 flex-shrink-0">
        <div className="flex items-center gap-1">
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-400 transition-colors"
            title="Back to list"
          >
            <ChevronLeft size={18} />
          </button>
          
          <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-1" />
          
          <button 
            onClick={onArchive} 
            className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-400 transition-colors"
            title="Archive"
          >
            <Archive size={18} />
          </button>
          <button 
            onClick={() => onMove?.('SPAM')} 
            className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-400 transition-colors"
            title="Report spam"
          >
            <AlertTriangle size={18} />
          </button>
          <button 
            onClick={onDelete} 
            className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
            title="Delete"
          >
            <Trash2 size={18} />
          </button>
          
          <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-1" />
          
          <button 
            onClick={() => onMarkRead?.(!email.isRead)} 
            className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-400 transition-colors"
            title={email.isRead ? 'Mark as unread' : 'Mark as read'}
          >
            {email.isRead ? <Mail size={18} /> : <MailOpen size={18} />}
          </button>
          <button 
            onClick={onSnooze} 
            className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-400 transition-colors"
            title="Snooze"
          >
            <Clock size={18} />
          </button>
          <div className="relative">
            <button 
              onClick={() => setShowLabelPicker(!showLabelPicker)} 
              className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-400 transition-colors"
              title="Labels"
            >
              <Tag size={18} />
            </button>
            
            {/* Label Picker Dropdown */}
            {showLabelPicker && (
              <div className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-20 py-1">
                <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-700">
                  <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">Apply label</span>
                </div>
                {labels.map(label => {
                  const isApplied = email.labels?.includes(label.id);
                  return (
                    <button
                      key={label.id}
                      onClick={() => {
                        onLabel?.(label.id, isApplied ? 'remove' : 'add');
                        setShowLabelPicker(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm"
                    >
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: label.color }}
                      />
                      <span className="flex-1 text-left text-slate-700 dark:text-slate-200">{label.name}</span>
                      {isApplied && <Check size={14} className="text-green-500" />}
                    </button>
                  );
                })}
                {labels.length === 0 && (
                  <p className="px-3 py-2 text-sm text-slate-400 dark:text-slate-500 italic">No labels</p>
                )}
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <button 
            onClick={onReply} 
            className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-400 transition-colors"
            title="Reply (r)"
          >
            <Reply size={18} />
          </button>
          <button 
            onClick={onReplyAll} 
            className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-400 transition-colors"
            title="Reply all (a)"
          >
            <ReplyAll size={18} />
          </button>
          <button 
            onClick={onForward} 
            className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-400 transition-colors"
            title="Forward (f)"
          >
            <Forward size={18} />
          </button>
          
          <div className="relative">
            <button 
              onClick={() => setShowMoreActions(!showMoreActions)} 
              className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-400 transition-colors"
            >
              <MoreHorizontal size={18} />
            </button>
            
            {showMoreActions && (
              <div className="absolute top-full right-0 mt-1 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-20 py-1">
                <button
                  onClick={handlePrint}
                  className="w-full flex items-center gap-2 px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm text-slate-700 dark:text-slate-200"
                >
                  <Printer size={16} /> Print
                </button>
                <button
                  onClick={() => window.open(`mailto:${email.from?.address}`)}
                  className="w-full flex items-center gap-2 px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm text-slate-700 dark:text-slate-200"
                >
                  <ExternalLink size={16} /> Open in mail app
                </button>
                <hr className="my-1 border-slate-100 dark:border-slate-700" />
                <button
                  onClick={() => { onMove?.('SPAM'); setShowMoreActions(false); }}
                  className="w-full flex items-center gap-2 px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm text-slate-700 dark:text-slate-200"
                >
                  <AlertTriangle size={16} /> Report spam
                </button>
                <button
                  onClick={() => { /* Block sender */ setShowMoreActions(false); }}
                  className="w-full flex items-center gap-2 px-4 py-2 hover:bg-red-50 dark:hover:bg-red-900/30 text-sm text-red-600 dark:text-red-400"
                >
                  <X size={16} /> Block sender
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Email Header */}
      <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700 flex-shrink-0">
        <div className="flex items-start gap-4">
          <EmailAvatar 
            name={email.from?.name} 
            email={email.from?.address} 
            size="lg" 
          />
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h1 className="text-xl font-semibold text-slate-900 dark:text-white mb-1 leading-tight">
                  {email.subject || '(No subject)'}
                </h1>
                
                {/* Labels */}
                {emailLabels.length > 0 && (
                  <div className="flex items-center gap-1 mt-2 mb-2">
                    {emailLabels.map(label => (
                      <LabelBadge 
                        key={label.id} 
                        label={label} 
                        size="sm"
                        onRemove={() => onLabel?.(label.id, 'remove')}
                      />
                    ))}
                  </div>
                )}
                
                <div className="flex items-center gap-2 text-sm flex-wrap">
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {email.from?.name || email.from?.address}
                  </span>
                  <span className="text-slate-400 dark:text-slate-500">
                    &lt;{email.from?.address}&gt;
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-3 text-sm text-slate-400 dark:text-slate-500 flex-shrink-0">
                <span>{new Date(email.date).toLocaleString()}</span>
                <button
                  onClick={() => onStar?.(email.id, !email.isStarred)}
                  className={`p-1 transition-colors ${
                    email.isStarred ? 'text-yellow-500' : 'hover:text-yellow-500'
                  }`}
                >
                  <Star size={18} fill={email.isStarred ? 'currentColor' : 'none'} />
                </button>
              </div>
            </div>
            
            {/* Recipients */}
            <div className="mt-3 text-sm text-slate-500 dark:text-slate-400">
              <div className="flex items-start gap-2">
                <span className="text-slate-400 dark:text-slate-500 flex-shrink-0">To:</span>
                <div className="flex-1">
                  {showAllRecipients || !hasMultipleRecipients ? (
                    <>
                      {email.to?.map((t, i) => (
                        <span key={i}>
                          {t.name || t.address}
                          {i < email.to.length - 1 && ', '}
                        </span>
                      ))}
                    </>
                  ) : (
                    <button
                      onClick={() => setShowAllRecipients(true)}
                      className="text-orange-600 dark:text-orange-400 hover:underline"
                    >
                      {email.to?.length} recipients
                    </button>
                  )}
                </div>
              </div>
              
              {email.cc?.length > 0 && (showAllRecipients || !hasMultipleRecipients) && (
                <div className="flex items-start gap-2 mt-1">
                  <span className="text-slate-400 dark:text-slate-500 flex-shrink-0">Cc:</span>
                  <div className="flex-1">
                    {email.cc.map((t, i) => (
                      <span key={i}>
                        {t.name || t.address}
                        {i < email.cc.length - 1 && ', '}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {showAllRecipients && (
                <button
                  onClick={() => setShowAllRecipients(false)}
                  className="text-orange-600 dark:text-orange-400 hover:underline text-xs mt-1"
                >
                  Show less
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Email Body */}
      <div className="flex-1 overflow-y-auto bg-white dark:bg-slate-900">
        <div className="px-6 py-6">
          {email.html ? (
            <div 
              className="email-html-content prose prose-slate dark:prose-invert max-w-none 
                prose-headings:text-slate-900 dark:prose-headings:text-slate-100
                prose-p:text-slate-700 dark:prose-p:text-slate-300
                prose-a:text-orange-600 dark:prose-a:text-orange-400 
                prose-strong:text-slate-900 dark:prose-strong:text-slate-100
                prose-code:text-orange-600 dark:prose-code:text-orange-400
                prose-code:bg-slate-100 dark:prose-code:bg-slate-800
                prose-pre:bg-slate-100 dark:prose-pre:bg-slate-800
                prose-blockquote:border-l-slate-300 dark:prose-blockquote:border-l-slate-600
                prose-blockquote:text-slate-600 dark:prose-blockquote:text-slate-400
                prose-img:rounded-lg
                prose-table:border-slate-200 dark:prose-table:border-slate-700
                prose-th:bg-slate-100 dark:prose-th:bg-slate-800
                prose-td:border-slate-200 dark:prose-td:border-slate-700"
              dangerouslySetInnerHTML={{ __html: email.html }} 
            />
          ) : (
            <pre className="whitespace-pre-wrap font-sans text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
              {email.text}
            </pre>
          )}
          
          {/* Smart Reply Suggestions */}
          {showSmartReply && (
            <SmartReplySuggestions 
              email={email} 
              onSelectReply={onSmartReply}
            />
          )}
        </div>

        {/* Attachments */}
        {email.attachments?.length > 0 && (
          <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700">
            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-2">
              <Paperclip size={16} className="text-slate-400 dark:text-slate-500" />
              {email.attachments.length} Attachment{email.attachments.length > 1 ? 's' : ''}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {email.attachments.map((att, i) => (
                <AttachmentListItem 
                  key={att.id || i} 
                  attachment={att}
                  onClick={handlePreviewAttachment}
                  onDownload={handleDownloadAttachment}
                  getUrl={getAttachmentUrl || defaultGetAttachmentUrl}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Reply buttons footer */}
      <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-gradient-to-t from-slate-50 to-white dark:from-slate-800 dark:to-slate-900 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button 
            onClick={onReply}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 hover:border-slate-400 dark:hover:border-slate-500 transition-colors"
          >
            <Reply size={18} /> Reply
          </button>
          <button 
            onClick={onReplyAll}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 hover:border-slate-400 dark:hover:border-slate-500 transition-colors"
          >
            <ReplyAll size={18} /> Reply All
          </button>
          <button 
            onClick={onForward}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 hover:border-slate-400 dark:hover:border-slate-500 transition-colors"
          >
            <Forward size={18} /> Forward
          </button>
        </div>
      </div>

      {/* Close label picker on outside click */}
      {(showLabelPicker || showMoreActions) && (
        <div 
          className="fixed inset-0 z-10" 
          onClick={() => {
            setShowLabelPicker(false);
            setShowMoreActions(false);
          }}
        />
      )}

      {/* Attachment Preview Modal */}
      <AttachmentPreview
        attachment={previewAttachment}
        attachments={email.attachments || []}
        isOpen={showAttachmentPreview}
        onClose={() => setShowAttachmentPreview(false)}
        onDownload={handleDownloadAttachment}
        getAttachmentUrl={getAttachmentUrl || defaultGetAttachmentUrl}
      />
    </div>
  );
};

export default EmailPreview;
