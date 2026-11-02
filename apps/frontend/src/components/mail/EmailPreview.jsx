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
 * Displays the full email content with mobile-first responsive layout.
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
      const response = await mailApi.getAttachment(attachment.id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', attachment.filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download attachment:', error);
      const url = (getAttachmentUrl || defaultGetAttachmentUrl)(attachment);
      window.open(url, '_blank');
    }
  };

  const handlePrint = () => {
    if (onPrint) {
      onPrint();
      return;
    }
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>${email.subject || 'Email'}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; line-height: 1.6; }
            .header { border-bottom: 2px solid #eee; padding-bottom: 15px; margin-bottom: 20px; }
            .subject { font-size: 20px; font-weight: bold; margin-bottom: 10px; }
            .meta { color: #666; font-size: 13px; margin: 3px 0; }
            .content { font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="subject">${email.subject || '(No subject)'}</div>
            <div class="meta"><strong>From:</strong> ${email.from?.name || ''} &lt;${email.from?.address || ''}&gt;</div>
            <div class="meta"><strong>To:</strong> ${email.to?.map(t => t.name || t.address).join(', ') || ''}</div>
            <div class="meta"><strong>Date:</strong> ${new Date(email.date).toLocaleString()}</div>
          </div>
          <div class="content">${email.html || email.text || ''}</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  // Resolve label objects
  const emailLabels = labels.filter(l => email.labels?.includes(l.id));
  const hasMultipleRecipients = email.to && email.to.length > 1;

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 overflow-hidden">
      {/* Mobile-Friendly Adaptive Toolbar */}
      <div className="flex items-center justify-between px-3 sm:px-4 py-2 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-900 flex-shrink-0">
        <div className="flex items-center gap-1">
          <button 
            onClick={onClose} 
            className="flex items-center gap-1 px-2.5 py-1.5 -ml-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-slate-700 dark:text-slate-300 font-semibold text-xs active:scale-95 transition-all"
            title="Back to list"
          >
            <ChevronLeft size={18} />
            <span>Back</span>
          </button>
          
          <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-1" />
          
          <button 
            onClick={onArchive} 
            className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-slate-600 dark:text-slate-400 active:scale-95 transition-all"
            title="Archive"
          >
            <Archive size={17} />
          </button>
          
          <button 
            onClick={onDelete} 
            className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-xl text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 active:scale-95 transition-all"
            title="Delete"
          >
            <Trash2 size={17} />
          </button>
          
          <button 
            onClick={() => onMarkRead?.(!email.isRead)} 
            className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-slate-600 dark:text-slate-400 active:scale-95 transition-all"
            title={email.isRead ? 'Mark as unread' : 'Mark as read'}
          >
            {email.isRead ? <Mail size={17} /> : <MailOpen size={17} />}
          </button>

          {/* Desktop-only secondary toolbar actions */}
          <div className="hidden sm:flex items-center gap-1">
            <button 
              onClick={() => onMove?.('SPAM')} 
              className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-slate-600 dark:text-slate-400 transition-colors"
              title="Report spam"
            >
              <AlertTriangle size={17} />
            </button>
            <button 
              onClick={onSnooze} 
              className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-slate-600 dark:text-slate-400 transition-colors"
              title="Snooze"
            >
              <Clock size={17} />
            </button>
            <div className="relative">
              <button 
                onClick={() => setShowLabelPicker(!showLabelPicker)} 
                className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-slate-600 dark:text-slate-400 transition-colors"
                title="Labels"
              >
                <Tag size={17} />
              </button>
              
              {showLabelPicker && (
                <div className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl z-20 py-1.5 animate-in zoom-in-95 duration-150">
                  <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-700">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Apply label</span>
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
                        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs text-left"
                      >
                        <div 
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: label.color }}
                        />
                        <span className="flex-1 text-slate-700 dark:text-slate-200">{label.name}</span>
                        {isApplied && <Check size={14} className="text-emerald-500" />}
                      </button>
                    );
                  })}
                  {labels.length === 0 && (
                    <p className="px-3 py-2 text-xs text-slate-400 dark:text-slate-500 italic">No labels</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <button 
            onClick={onReply} 
            className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-slate-600 dark:text-slate-400 active:scale-95 transition-all"
            title="Reply"
          >
            <Reply size={17} />
          </button>
          
          <div className="hidden sm:flex items-center gap-1">
            <button 
              onClick={onReplyAll} 
              className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-slate-600 dark:text-slate-400 transition-colors"
              title="Reply all"
            >
              <ReplyAll size={17} />
            </button>
            <button 
              onClick={onForward} 
              className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-slate-600 dark:text-slate-400 transition-colors"
              title="Forward"
            >
              <Forward size={17} />
            </button>
          </div>
          
          {/* More options dropdown (holds mobile + extra actions) */}
          <div className="relative">
            <button 
              onClick={() => setShowMoreActions(!showMoreActions)} 
              className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-slate-600 dark:text-slate-400 active:scale-95 transition-all"
              title="More"
            >
              <MoreHorizontal size={17} />
            </button>
            
            {showMoreActions && (
              <div className="absolute top-full right-0 mt-1.5 w-52 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl z-20 py-1.5 animate-in zoom-in-95 duration-150">
                <button
                  onClick={() => { onReplyAll?.(); setShowMoreActions(false); }}
                  className="sm:hidden w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs text-slate-700 dark:text-slate-200"
                >
                  <ReplyAll size={15} /> Reply All
                </button>
                <button
                  onClick={() => { onForward?.(); setShowMoreActions(false); }}
                  className="sm:hidden w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs text-slate-700 dark:text-slate-200"
                >
                  <Forward size={15} /> Forward
                </button>
                <button
                  onClick={() => { onSnooze?.(); setShowMoreActions(false); }}
                  className="sm:hidden w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs text-slate-700 dark:text-slate-200"
                >
                  <Clock size={15} /> Snooze
                </button>
                <button
                  onClick={handlePrint}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs text-slate-700 dark:text-slate-200"
                >
                  <Printer size={15} /> Print Email
                </button>
                <button
                  onClick={() => window.open(`mailto:${email.from?.address}`)}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs text-slate-700 dark:text-slate-200"
                >
                  <ExternalLink size={15} /> Open in Mail App
                </button>
                <hr className="my-1 border-slate-100 dark:border-slate-700" />
                <button
                  onClick={() => { onMove?.('SPAM'); setShowMoreActions(false); }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs text-slate-700 dark:text-slate-200"
                >
                  <AlertTriangle size={15} /> Report Spam
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Email Header - Full width Subject & clear responsive sender layout */}
      <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-100 dark:border-slate-800 flex-shrink-0 bg-slate-50/50 dark:bg-slate-900/40">
        {/* Full-width Subject */}
        <div className="mb-3 w-full">
          <h1 className="text-base sm:text-xl font-bold text-slate-900 dark:text-white leading-snug break-words">
            {email.subject || '(No subject)'}
          </h1>
          
          {/* Labels if any */}
          {emailLabels.length > 0 && (
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
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
        </div>

        {/* Sender details and Date row */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <EmailAvatar 
              name={email.from?.name} 
              email={email.from?.address} 
              size="md" 
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-slate-100 truncate">
                  {email.from?.name || email.from?.address}
                </span>
                <span className="text-[11px] text-slate-400 dark:text-slate-500 truncate hidden xs:inline">
                  &lt;{email.from?.address}&gt;
                </span>
              </div>
              
              {/* Recipients */}
              <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-1">
                <span className="text-slate-400">to</span>
                <span className="truncate">
                  {email.to?.map(t => t.name || t.address).join(', ') || 'me'}
                </span>
                {email.to?.length > 1 && (
                  <button
                    onClick={() => setShowAllRecipients(!showAllRecipients)}
                    className="text-orange-500 hover:underline text-[10px] ml-1 font-medium"
                  >
                    {showAllRecipients ? 'less' : `+${email.to.length - 1} more`}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Date & Star */}
          <div className="flex items-center gap-2 flex-shrink-0 text-xs text-slate-400 dark:text-slate-500">
            <span className="hidden sm:inline font-medium">{new Date(email.date).toLocaleString()}</span>
            <span className="sm:hidden font-medium text-[11px]">
              {new Date(email.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </span>
            <button
              onClick={() => onStar?.(email.id, !email.isStarred)}
              className={`p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
                email.isStarred ? 'text-yellow-500' : 'text-slate-400 hover:text-yellow-500'
              }`}
              title={email.isStarred ? 'Unstar' : 'Star'}
            >
              <Star size={18} fill={email.isStarred ? 'currentColor' : 'none'} />
            </button>
          </div>
        </div>

        {/* Expanded Recipient Details */}
        {showAllRecipients && email.to && (
          <div className="mt-2.5 p-2 bg-slate-100/70 dark:bg-slate-800/60 rounded-xl text-xs space-y-1 animate-in fade-in duration-150">
            <div>
              <span className="text-slate-400 font-medium">To: </span>
              <span className="text-slate-700 dark:text-slate-300 font-mono text-[11px]">
                {email.to.map(t => `${t.name ? `${t.name} ` : ''}<${t.address}>`).join(', ')}
              </span>
            </div>
            {email.cc?.length > 0 && (
              <div>
                <span className="text-slate-400 font-medium">Cc: </span>
                <span className="text-slate-700 dark:text-slate-300 font-mono text-[11px]">
                  {email.cc.map(t => `${t.name ? `${t.name} ` : ''}<${t.address}>`).join(', ')}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Email Body - With bottom padding for mobile safe area */}
      <div className="flex-1 overflow-y-auto bg-white dark:bg-slate-900">
        <div className="px-4 sm:px-6 py-5 pb-32 sm:pb-12">
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

          {/* Attachments */}
          {email.attachments?.length > 0 && (
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3 flex items-center gap-2">
                <Paperclip size={15} className="text-orange-500" />
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
      </div>

      {/* Reply buttons footer with mobile bottom clearance */}
      <div className="px-4 sm:px-6 py-3 border-t border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl flex-shrink-0 pb-20 md:pb-3">
        <div className="flex items-center gap-2 sm:gap-3">
          <button 
            onClick={onReply}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-3 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 transition-all active:scale-95 shadow-xs"
          >
            <Reply size={16} className="text-orange-500" /> 
            <span>Reply</span>
          </button>
          <button 
            onClick={onReplyAll}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-3 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 transition-all active:scale-95 shadow-xs"
          >
            <ReplyAll size={16} /> 
            <span>Reply All</span>
          </button>
          <button 
            onClick={onForward}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-3 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 transition-all active:scale-95 shadow-xs"
          >
            <Forward size={16} /> 
            <span>Forward</span>
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
