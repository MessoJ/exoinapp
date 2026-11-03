import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Minus,
  Maximize2,
  Minimize2,
  Send,
  Paperclip,
  Smile,
  Clock,
  ChevronDown,
  ChevronUp,
  Trash2,
  FileText,
  Star,
  Users,
  AlertCircle,
  Calendar,
  XCircle,
  File,
  FileImage,
  FileVideo,
  FileAudio,
  PenTool,
  FileCheck,
  Search,
  Receipt,
  Truck,
  Wrench,
  Layers,
} from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { EmailSignatureTemplate } from '../templates/ExoinEmailSignatures';
import { signatureApi, authApi, documentsApi } from '../../lib/api';
import { saveOfflineDraft } from '../../lib/offlineQueue';

// Email Templates
const EMAIL_TEMPLATES = [
  {
    id: 'blank',
    name: 'Blank Email',
    icon: FileText,
    subject: '',
    body: '',
  },
  {
    id: 'meeting-request',
    name: 'Meeting Request',
    icon: Calendar,
    subject: 'Meeting Request: [Topic]',
    body: `<p>Hi [Name],</p>
<p>I hope this email finds you well. I would like to schedule a meeting to discuss [topic].</p>
<p><strong>Proposed Details:</strong></p>
<ul>
<li><strong>Date:</strong> [Date]</li>
<li><strong>Time:</strong> [Time]</li>
<li><strong>Duration:</strong> [Duration]</li>
<li><strong>Location/Platform:</strong> [Location or Video Call Link]</li>
</ul>
<p>Please let me know if this works for you or suggest an alternative time.</p>
<p>Best regards</p>`,
  },
  {
    id: 'follow-up',
    name: 'Follow Up',
    icon: Clock,
    subject: 'Following Up: [Previous Topic]',
    body: `<p>Hi [Name],</p>
<p>I wanted to follow up on our previous conversation regarding [topic].</p>
<p>Have you had a chance to review [item/proposal/request]? I'd be happy to provide any additional information you might need.</p>
<p>Looking forward to hearing from you.</p>
<p>Best regards</p>`,
  },
  {
    id: 'thank-you',
    name: 'Thank You',
    icon: Star,
    subject: 'Thank You',
    body: `<p>Hi [Name],</p>
<p>Thank you so much for [reason]. I really appreciate your time and effort.</p>
<p>[Additional details or next steps]</p>
<p>Best regards</p>`,
  },
  {
    id: 'introduction',
    name: 'Introduction',
    icon: Users,
    subject: 'Introduction: [Your Name/Company]',
    body: `<p>Hi [Name],</p>
<p>I hope this email finds you well. My name is [Your Name], and I am [your role/title] at [Company].</p>
<p>I am reaching out because [reason for contact].</p>
<p>I would love the opportunity to [desired outcome]. Would you be available for a brief call or meeting?</p>
<p>Best regards</p>`,
  },
  {
    id: 'apology',
    name: 'Apology',
    icon: AlertCircle,
    subject: 'Apology Regarding [Issue]',
    body: `<p>Hi [Name],</p>
<p>I sincerely apologize for [issue/situation]. This was not the experience we intended for you.</p>
<p>[Explanation if appropriate, without making excuses]</p>
<p>To make things right, we are [corrective action]. Please don't hesitate to reach out if you have any concerns.</p>
<p>Best regards</p>`,
  },
  {
    id: 'invoice-notice',
    name: 'Official Invoice Notice',
    icon: Receipt,
    subject: 'Exoin Africa: Official Invoice [INV-XXXX]',
    body: `<p>Dear [Client Name],</p>
<p>I hope this message finds you well.</p>
<p>Please find attached our official tax invoice <strong>[INV-XXXX]</strong> for services and supplies delivered by Exoin Africa.</p>
<p><strong>Invoice Summary:</strong></p>
<ul>
<li><strong>Invoice Number:</strong> [INV-XXXX]</li>
<li><strong>Total Due:</strong> KES [Amount]</li>
<li><strong>Payment Terms:</strong> Net 14 Days</li>
</ul>
<p>Kindly arrange settlement per the bank details specified in the attached PDF. Should you require any statement reconciliation, please reach out to our finance team.</p>
<p>Thank you for your valued partnership.</p>
<p>Warm regards,</p>`,
  },
  {
    id: 'quotation-proposal',
    name: 'Proposal & Quotation',
    icon: FileText,
    subject: 'Exoin Africa: Quotation & Service Scope [QUO-XXXX]',
    body: `<p>Dear [Client Name],</p>
<p>Thank you for considering Exoin Africa for your technical infrastructure requirements.</p>
<p>Please find attached our comprehensive quotation <strong>[QUO-XXXX]</strong> covering the itemized scope of work, technical specifications, and proposed commercial terms.</p>
<p><strong>Proposal Overview:</strong></p>
<ul>
<li><strong>Quote Reference:</strong> [QUO-XXXX]</li>
<li><strong>Validity:</strong> 30 Days from date of issue</li>
<li><strong>Deployment Timeline:</strong> Immediate upon approval</li>
</ul>
<p>We are available to answer any questions or adapt the scope according to your operational priorities.</p>
<p>Kind regards,</p>`,
  },
  {
    id: 'delivery-handover',
    name: 'Delivery Note Confirmation',
    icon: Truck,
    subject: 'Exoin Africa: Delivery Note & Handover [DN-XXXX]',
    body: `<p>Dear [Client Name],</p>
<p>This is to confirm dispatch and on-site delivery of items per official Delivery Note <strong>[DN-XXXX]</strong>.</p>
<p>Please review the enclosed signed document certifying all equipment and consignments have been handed over in proper condition.</p>
<p>Thank you for choosing Exoin Africa Logistics.</p>
<p>Best regards,</p>`,
  },
  {
    id: 'job-card-report',
    name: 'Job Card Completion Report',
    icon: Wrench,
    subject: 'Exoin Africa: Service Job Card [JC-XXXX]',
    body: `<p>Dear [Client Name],</p>
<p>Our engineering service team has finalized the scheduled maintenance and diagnostics on your facility.</p>
<p>Attached is verified Service Job Card <strong>[JC-XXXX]</strong> detailing tests conducted, parts serviced, and technician sign-off.</p>
<p>Thank you for partnering with Exoin Africa Technical Services.</p>
<p>Kind regards,</p>`,
  },
];

// Quill modules configuration
const quillModules = {
  toolbar: [
    [{ 'header': [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'color': [] }, { 'background': [] }],
    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
    ['blockquote', 'code-block'],
    [{ 'align': [] }],
    ['link', 'image'],
    ['clean'],
  ],
  clipboard: {
    matchVisual: false,
  },
};

const quillFormats = [
  'header',
  'bold', 'italic', 'underline', 'strike',
  'color', 'background',
  'list', 'bullet',
  'blockquote', 'code-block',
  'align',
  'link', 'image',
];

// Template Picker Component - Responsive Bottom Sheet on mobile
const TemplatePicker = ({ isOpen, onClose, onSelect, anchorRef }) => {
  const [position, setPosition] = useState({ bottom: 0, right: 0 });
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 640);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isOpen && anchorRef?.current && !isMobile) {
      const rect = anchorRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const windowWidth = window.innerWidth;
      
      setPosition({
        bottom: windowHeight - rect.top + 8,
        right: Math.max(16, windowWidth - rect.right - 100),
      });
    }
  }, [isOpen, anchorRef, isMobile]);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-[75] bg-slate-950/50 backdrop-blur-xs animate-in fade-in" onClick={onClose} />
      <motion.div
        ref={menuRef}
        initial={isMobile ? { y: '100%' } : { opacity: 0, y: 10, scale: 0.95 }}
        animate={isMobile ? { y: 0 } : { opacity: 1, y: 0, scale: 1 }}
        exit={isMobile ? { y: '100%' } : { opacity: 0, y: 10, scale: 0.95 }}
        transition={{ type: 'spring', damping: 28, stiffness: 350 }}
        className={
          isMobile
            ? "fixed inset-x-0 bottom-0 z-[80] rounded-t-3xl max-h-[75vh] bg-white dark:bg-gray-800 shadow-2xl border-t border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden"
            : "fixed z-[80] w-72 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
        }
        style={!isMobile ? { bottom: position.bottom, right: position.right } : undefined}
      >
        {isMobile && (
          <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mt-2.5 mb-1" />
        )}
        <div className="p-3.5 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-900 flex items-center justify-between">
          <p className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FileText className="h-4 w-4 text-orange-500" />
            Corporate Templates
          </p>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-gray-400">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {EMAIL_TEMPLATES.map((template) => (
            <button
              key={template.id}
              onClick={() => {
                onSelect(template);
                onClose();
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-xl hover:bg-orange-50 dark:hover:bg-gray-700 transition-colors group active:scale-98"
            >
              <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0 group-hover:bg-orange-100 dark:group-hover:bg-orange-950/40">
                <template.icon className="h-4 w-4 text-gray-500 group-hover:text-orange-600 dark:text-gray-300" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-xs font-semibold text-gray-900 dark:text-gray-100 block truncate">
                  {template.name}
                </span>
                <span className="text-[10px] text-gray-400 truncate block">
                  {template.subject}
                </span>
              </div>
            </button>
          ))}
        </div>
      </motion.div>
    </>
  );
};

// Schedule Send Picker Component - Responsive (Bottom sheet on mobile)
const ScheduleSendPicker = ({ isOpen, onClose, onSchedule, anchorRef }) => {
  const [mode, setMode] = useState('quick');
  const [customDate, setCustomDate] = useState('');
  const [customTime, setCustomTime] = useState('');
  const [position, setPosition] = useState({ bottom: 0, left: 0 });
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 640);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isOpen && anchorRef?.current && !isMobile) {
      const rect = anchorRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      
      setPosition({
        bottom: windowHeight - rect.top + 8,
        left: Math.max(16, rect.left),
      });
    }
  }, [isOpen, anchorRef, isMobile]);

  const getQuickOptions = () => {
    const now = new Date();
    const options = [];

    const tomorrowMorning = new Date(now);
    tomorrowMorning.setDate(tomorrowMorning.getDate() + 1);
    tomorrowMorning.setHours(8, 0, 0, 0);
    options.push({
      label: 'Tomorrow morning',
      sublabel: tomorrowMorning.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) + ' at 8:00 AM',
      date: tomorrowMorning,
    });

    const tomorrowAfternoon = new Date(now);
    tomorrowAfternoon.setDate(tomorrowAfternoon.getDate() + 1);
    tomorrowAfternoon.setHours(13, 0, 0, 0);
    options.push({
      label: 'Tomorrow afternoon',
      sublabel: tomorrowAfternoon.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) + ' at 1:00 PM',
      date: tomorrowAfternoon,
    });

    const nextMonday = new Date(now);
    const dayOfWeek = now.getDay();
    const daysUntilMonday = dayOfWeek === 0 ? 1 : dayOfWeek === 6 ? 2 : 8 - dayOfWeek;
    nextMonday.setDate(nextMonday.getDate() + daysUntilMonday);
    nextMonday.setHours(8, 0, 0, 0);
    options.push({
      label: 'Monday morning',
      sublabel: nextMonday.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) + ' at 8:00 AM',
      date: nextMonday,
    });

    return options;
  };

  const handleCustomSchedule = () => {
    if (customDate && customTime) {
      const scheduledDate = new Date(`${customDate}T${customTime}`);
      if (scheduledDate > new Date()) {
        onSchedule(scheduledDate);
        onClose();
      }
    }
  };

  useEffect(() => {
    if (isOpen && !customDate) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setCustomDate(tomorrow.toISOString().split('T')[0]);
      setCustomTime('09:00');
    }
  }, [isOpen, customDate]);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-[75] bg-slate-950/50 backdrop-blur-xs animate-in fade-in" onClick={onClose} />
      <motion.div
        initial={isMobile ? { y: '100%' } : { opacity: 0, y: 10, scale: 0.95 }}
        animate={isMobile ? { y: 0 } : { opacity: 1, y: 0, scale: 1 }}
        exit={isMobile ? { y: '100%' } : { opacity: 0, y: 10, scale: 0.95 }}
        transition={{ type: 'spring', damping: 28, stiffness: 350 }}
        className={
          isMobile
            ? "fixed inset-x-0 bottom-0 z-[80] rounded-t-3xl max-h-[75vh] bg-white dark:bg-gray-800 shadow-2xl border-t border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden"
            : "fixed z-[80] w-72 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
        }
        style={!isMobile ? { bottom: position.bottom, left: position.left } : undefined}
      >
        {isMobile && (
          <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mt-2.5 mb-1" />
        )}
        <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-900">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-500" />
            <span className="font-medium text-gray-900 dark:text-white text-sm">Schedule Send</span>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded">
            <X className="h-4 w-4 text-gray-500" />
          </button>
        </div>

        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setMode('quick')}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
              mode === 'quick'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
            }`}
          >
            Quick Pick
          </button>
          <button
            onClick={() => setMode('custom')}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
              mode === 'custom'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
            }`}
          >
            Custom
          </button>
        </div>

        <div className="p-2">
          {mode === 'quick' ? (
            <div className="space-y-1">
              {getQuickOptions().map((option, index) => (
                <button
                  key={index}
                  onClick={() => {
                    onSchedule(option.date);
                    onClose();
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left group"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{option.label}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{option.sublabel}</p>
                  </div>
                  <Calendar className="h-4 w-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
                </button>
              ))}
            </div>
          ) : (
            <div className="p-2 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Date</label>
                <input
                  type="date"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Time</label>
                <input
                  type="time"
                  value={customTime}
                  onChange={(e) => setCustomTime(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <button
                onClick={handleCustomSchedule}
                disabled={!customDate || !customTime}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Clock className="h-4 w-4" />
                Schedule Send
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
};

// Emoji Picker Wrapper Component - Opens UPWARD
const EmojiPickerPopover = ({ isOpen, onClose, onSelect, anchorRef }) => {
  const [position, setPosition] = useState({ bottom: 0, right: 0 });
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 640);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isOpen && anchorRef?.current && !isMobile) {
      const rect = anchorRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const windowWidth = window.innerWidth;
      
      setPosition({
        bottom: windowHeight - rect.top + 8,
        right: Math.max(16, windowWidth - rect.right - 175),
      });
    }
  }, [isOpen, anchorRef, isMobile]);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-[75] bg-slate-950/50 backdrop-blur-xs animate-in fade-in" onClick={onClose} />
      <motion.div
        initial={isMobile ? { y: '100%' } : { opacity: 0, y: 10, scale: 0.95 }}
        animate={isMobile ? { y: 0 } : { opacity: 1, y: 0, scale: 1 }}
        exit={isMobile ? { y: '100%' } : { opacity: 0, y: 10, scale: 0.95 }}
        transition={{ type: 'spring', damping: 28, stiffness: 350 }}
        className={
          isMobile
            ? "fixed inset-x-0 bottom-0 z-[80] bg-white dark:bg-gray-800 rounded-t-3xl shadow-2xl border-t border-gray-200 dark:border-gray-700 flex flex-col items-center pt-2 pb-6"
            : "fixed z-[80]"
        }
        style={!isMobile ? { bottom: position.bottom, right: position.right } : undefined}
      >
        {isMobile && (
          <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mb-2" />
        )}
        <EmojiPicker
          onEmojiClick={(emojiData) => {
            onSelect(emojiData.emoji);
            onClose();
          }}
          theme="auto"
          width={isMobile ? Math.min(360, (typeof window !== 'undefined' ? window.innerWidth - 32 : 340)) : 350}
          height={380}
          previewConfig={{ showPreview: false }}
        />
      </motion.div>
    </>
  );
};

// File Attachment Item Component
const AttachmentItem = ({ file, onRemove }) => {
  const getFileIcon = (type) => {
    if (type?.startsWith('image/')) return FileImage;
    if (type?.startsWith('video/')) return FileVideo;
    if (type?.startsWith('audio/')) return FileAudio;
    return File;
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const FileIcon = getFileIcon(file.type);

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-full group">
      <FileIcon className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
      <span className="text-xs text-gray-700 dark:text-gray-300 max-w-[120px] truncate">{file.name}</span>
      <span className="text-xs text-gray-400">({formatFileSize(file.size)})</span>
      <button
        onClick={onRemove}
        className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors"
      >
        <X className="h-3 w-3 text-gray-500" />
      </button>
    </div>
  );
};

// Undo Send Toast Component
const UndoSendToast = ({ isVisible, countdown, maxCountdown = 5, onUndo, onComplete }) => {
  // Ensure countdown values are valid numbers
  const safeCountdown = typeof countdown === 'number' && !isNaN(countdown) ? countdown : 0;
  const safeMaxCountdown = typeof maxCountdown === 'number' && !isNaN(maxCountdown) && maxCountdown > 0 ? maxCountdown : 5;
  
  useEffect(() => {
    if (isVisible && safeCountdown > 0) {
      const timer = setTimeout(() => {
        if (safeCountdown === 1) {
          onComplete();
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, safeCountdown, onComplete]);

  if (!isVisible) return null;

  // Calculate progress percentage
  const progress = Math.max(0, Math.min(100, (safeCountdown / safeMaxCountdown) * 100));
  const circumference = 2 * Math.PI * 16; // radius = 16
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 50, scale: 0.9 }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-4 px-6 py-4 bg-gray-900 dark:bg-gray-800 text-white rounded-xl shadow-2xl"
    >
      <div className="flex items-center gap-3">
        <div className="relative w-10 h-10">
          <svg className="w-10 h-10 -rotate-90" viewBox="0 0 40 40">
            <circle cx="20" cy="20" r="16" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="3" />
            <circle
              cx="20" cy="20" r="16" fill="none" stroke="#f97316" strokeWidth="3"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-300 ease-linear"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">
            {Math.max(0, safeCountdown)}
          </span>
        </div>
        <span className="text-sm font-medium">Sending in {Math.max(0, safeCountdown)}s...</span>
      </div>
      <button
        onClick={onUndo}
        className="px-4 py-2 bg-orange-500 hover:bg-orange-600 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
      >
        <XCircle className="h-4 w-4" />
        Undo
      </button>
    </motion.div>
  );
};

// Document Attachment Picker Component - Opens UPWARD
const DocumentAttachmentPicker = ({ isOpen, onClose, onSelect, anchorRef }) => {
  const [position, setPosition] = useState({ bottom: 0, right: 0 });
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 640);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isOpen) {
      if (anchorRef?.current && !isMobile) {
        const rect = anchorRef.current.getBoundingClientRect();
        setPosition({
          bottom: window.innerHeight - rect.top + 8,
          right: Math.max(16, window.innerWidth - rect.right - 80),
        });
      }

      const fetchDocs = async () => {
        setLoading(true);
        try {
          const res = await documentsApi.getAll({ limit: 25 });
          setDocuments(res.data?.documents || []);
        } catch (err) {
          console.error('Failed to load documents for attachment:', err);
        } finally {
          setLoading(false);
        }
      };
      fetchDocs();
    }
  }, [isOpen, anchorRef, isMobile]);

  if (!isOpen) return null;

  const filteredDocs = documents.filter(doc => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      doc.documentNumber?.toLowerCase().includes(q) ||
      doc.client?.name?.toLowerCase().includes(q) ||
      doc.type?.toLowerCase().includes(q)
    );
  });

  const getTypeBadge = (type) => {
    switch (type) {
      case 'INVOICE':
        return <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300">INVOICE</span>;
      case 'QUOTATION':
        return <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">QUOTE</span>;
      case 'DELIVERY_NOTE':
        return <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">DELIVERY</span>;
      case 'JOB_CARD':
        return <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">JOB CARD</span>;
      default:
        return <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">{type}</span>;
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-[75] bg-slate-950/50 backdrop-blur-xs animate-in fade-in" onClick={onClose} />
      <motion.div
        ref={menuRef}
        initial={isMobile ? { y: '100%' } : { opacity: 0, y: 10, scale: 0.98 }}
        animate={isMobile ? { y: 0 } : { opacity: 1, y: 0, scale: 1 }}
        exit={isMobile ? { y: '100%' } : { opacity: 0, y: 10, scale: 0.98 }}
        transition={{ type: 'spring', damping: 28, stiffness: 350 }}
        className={
          isMobile
            ? "fixed inset-x-0 bottom-0 z-[80] rounded-t-3xl max-h-[80vh] bg-white dark:bg-gray-800 shadow-2xl border-t border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden"
            : "fixed z-[80] w-80 sm:w-96 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
        }
        style={!isMobile ? { bottom: position.bottom, right: position.right } : undefined}
      >
        {isMobile && (
          <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mt-2.5 mb-1" />
        )}
        <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-900 flex items-center justify-between">
          <p className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FileCheck className="h-4 w-4 text-orange-500" />
            Attach System Document (PDF)
          </p>
          <span className="text-[10px] text-gray-400">Exoin Africa</span>
        </div>

        {/* Search Input */}
        <div className="p-2 border-b border-gray-100 dark:border-gray-700">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by doc # or client..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-100 dark:bg-gray-700/60 border border-transparent focus:border-orange-500 focus:bg-white dark:focus:bg-gray-800 rounded-xl outline-none transition-colors"
            />
          </div>
        </div>

        {/* Document List */}
        <div className="max-h-64 overflow-y-auto p-1.5 divide-y divide-gray-50 dark:divide-gray-700/40">
          {loading ? (
            <div className="py-8 text-center text-xs text-gray-400 flex flex-col items-center gap-2">
              <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
              <span>Loading documents...</span>
            </div>
          ) : filteredDocs.length === 0 ? (
            <div className="py-8 text-center text-xs text-gray-400">
              No documents found
            </div>
          ) : (
            filteredDocs.map((doc) => (
              <button
                key={doc.id}
                onClick={() => {
                  onSelect(doc);
                  onClose();
                }}
                className="w-full flex items-center justify-between p-2.5 text-left rounded-xl hover:bg-orange-50/70 dark:hover:bg-gray-700/60 transition-colors group"
              >
                <div className="min-w-0 flex-1 pr-2">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-bold text-gray-900 dark:text-white group-hover:text-orange-600 transition-colors">
                      {doc.documentNumber}
                    </span>
                    {getTypeBadge(doc.type)}
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                    {doc.client?.name || 'Walk-in / General'}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  {doc.total > 0 && (
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-200 block">
                      KES {Number(doc.total).toLocaleString()}
                    </span>
                  )}
                  <p className="text-[10px] text-gray-400">
                    {new Date(doc.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </motion.div>
    </>
  );
};

// Main ComposeModal Component
const ComposeModal = ({
  isOpen,
  onClose,
  replyTo = null,
  forwardEmail = null,
  onSend,
  onSendWithUndo,
  onUndoSend,
  defaults = {},
  undoSendDelay: rawUndoDelay = 5,
}) => {
  const { user } = useAuth();
  const { isDark } = useTheme();
  // Ensure undoSendDelay is always a valid number
  const undoSendDelay = typeof rawUndoDelay === 'number' && !isNaN(rawUndoDelay) && rawUndoDelay > 0 ? rawUndoDelay : 5;
  // Form state
  const [to, setTo] = useState('');
  const [toChips, setToChips] = useState([]);
  const [cc, setCc] = useState('');
  const [ccChips, setCcChips] = useState([]);
  const [bcc, setBcc] = useState('');
  const [bccChips, setBccChips] = useState([]);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [showCcBcc, setShowCcBcc] = useState(false);
  
  // UI state
  const [isMinimized, setIsMinimized] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [scheduledTime, setScheduledTime] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [showUndoToast, setShowUndoToast] = useState(false);
  const [undoCountdown, setUndoCountdown] = useState(undoSendDelay);
  const [pendingEmail, setPendingEmail] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [attachDocumentId, setAttachDocumentId] = useState(null);
  const [showDocPicker, setShowDocPicker] = useState(false);
  const [attachedDoc, setAttachedDoc] = useState(null);
  const docPickerButtonRef = useRef(null);
  
  // Signature state
  const [userSignature, setUserSignature] = useState(null);
  const [includeSignature, setIncludeSignature] = useState(true);
  const [latestUser, setLatestUser] = useState(user); // Initialize with context user for immediate display
  
  // Drag state
  const [position, setPosition] = useState({ x: null, y: null });
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const [isFileDragging, setIsFileDragging] = useState(false);

  const handleSignatureStyleChange = async (style) => {
    setLatestUser(prev => ({ ...prev, signatureStyle: style }));
    try {
      await signatureApi.updateSettings({ signatureStyle: style, signatureEnabled: true });
      const res = await signatureApi.getHtml(false, true);
      if (res.data?.html) {
        setUserSignature(res.data.html);
      }
    } catch (err) {
      console.warn('Failed to switch signature style:', err);
    }
  };
  
  // Refs
  const templateButtonRef = useRef(null);
  const scheduleButtonRef = useRef(null);
  const emojiButtonRef = useRef(null);
  const fileInputRef = useRef(null);
  const quillRef = useRef(null);
  const undoTimerRef = useRef(null);
  const modalRef = useRef(null);
  
  // Drag handlers for making modal draggable
  const handleDragStart = useCallback((e) => {
    if (isMinimized || isFullscreen) return;
    
    const modal = modalRef.current;
    if (!modal) return;
    
    const rect = modal.getBoundingClientRect();
    dragOffset.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
    
    setIsDragging(true);
    e.preventDefault();
  }, [isMinimized, isFullscreen]);
  
  const handleDrag = useCallback((e) => {
    if (!isDragging) return;
    
    const newX = e.clientX - dragOffset.current.x;
    const newY = e.clientY - dragOffset.current.y;
    
    // Keep modal within viewport bounds
    const modal = modalRef.current;
    if (!modal) return;
    
    const maxX = window.innerWidth - modal.offsetWidth;
    const maxY = window.innerHeight - modal.offsetHeight;
    
    setPosition({
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY))
    });
  }, [isDragging]);
  
  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);
  
  // Add/remove drag event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleDrag);
      document.addEventListener('mouseup', handleDragEnd);
      document.body.style.cursor = 'grabbing';
      document.body.style.userSelect = 'none';
      
      return () => {
        document.removeEventListener('mousemove', handleDrag);
        document.removeEventListener('mouseup', handleDragEnd);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [isDragging, handleDrag, handleDragEnd]);
  
  // Reset position when modal state changes
  useEffect(() => {
    if (isFullscreen || isMinimized) {
      setPosition({ x: null, y: null });
    }
  }, [isFullscreen, isMinimized]);

  // Fetch user signature when modal opens
  useEffect(() => {
    if (isOpen) {
      console.log('ComposeModal: Opened. Theme isDark:', isDark);
      const fetchSignature = async () => {
        try {
          // Fetch latest user data to ensure signature details are up to date
          // Add timestamp to prevent caching
          const userResponse = await authApi.getMe({ t: Date.now() });
          if (userResponse.data) {
            console.log('ComposeModal: Fetched latest user data', userResponse.data);
            // Merge with existing user to preserve fields that might be missing in the response
            // (e.g. if backend is older version or doesn't return all fields)
            setLatestUser(prev => ({ ...prev, ...userResponse.data }));
          }

          // Force regenerate to ensure we get the backend-generated inline styles for sending
          const response = await signatureApi.getHtml(false, true);
          if (response.data?.html) {
            setUserSignature(response.data.html);
          }
        } catch (error) {
          console.error('Failed to fetch signature:', error);
          // Fallback to context user if fetch fails
          if (!latestUser) setLatestUser(user);
          setUserSignature(null);
        }
      };
      fetchSignature();
      setIncludeSignature(true);
    }
  }, [isOpen]);

  // Initialize from reply/forward/defaults
  useEffect(() => {
    if (replyTo) {
      setToChips([replyTo.from?.email || replyTo.from]);
      setSubject(replyTo.subject?.startsWith('Re:') ? replyTo.subject : `Re: ${replyTo.subject}`);
      setBody(`<br><br><blockquote style="border-left: 2px solid #ccc; padding-left: 1rem; margin-left: 0; color: #666;">
        <p><strong>On ${new Date(replyTo.date).toLocaleDateString()}, ${replyTo.from?.name || replyTo.from} wrote:</strong></p>
        ${replyTo.body || replyTo.html || ''}
      </blockquote>`);
    } else if (forwardEmail) {
      setSubject(`Fwd: ${forwardEmail.subject}`);
      setBody(`<br><br><p>---------- Forwarded message ---------</p>
        <p><strong>From:</strong> ${forwardEmail.from?.name || forwardEmail.from}</p>
        <p><strong>Date:</strong> ${new Date(forwardEmail.date).toLocaleDateString()}</p>
        <p><strong>Subject:</strong> ${forwardEmail.subject}</p>
        <p><strong>To:</strong> ${forwardEmail.to?.email || forwardEmail.to}</p>
        <br>
        ${forwardEmail.body || forwardEmail.html || ''}`);
    } else if (defaults) {
      if (defaults.to) setToChips([defaults.to]);
      if (defaults.subject) setSubject(defaults.subject);
      if (defaults.body) setBody(defaults.body);
      if (defaults.attachDocumentId) {
        setAttachDocumentId(defaults.attachDocumentId);
        documentsApi.getById(defaults.attachDocumentId)
          .then(res => { if (res.data) setAttachedDoc(res.data); })
          .catch(() => {});
      }
    }
  }, [replyTo, forwardEmail, defaults]);

  // Reset form when closed
  useEffect(() => {
    if (!isOpen) {
      setTo('');
      setToChips([]);
      setCc('');
      setCcChips([]);
      setBcc('');
      setBccChips([]);
      setSubject('');
      setBody('');
      setAttachments([]);
      setShowCcBcc(false);
      setScheduledTime(null);
      setShowUndoToast(false);
      setAttachDocumentId(null);
      setAttachedDoc(null);
      setShowDocPicker(false);
      setIncludeSignature(true); // Reset to include signature by default
    }
  }, [isOpen]);

  // Auto-save draft to IndexedDB every 4 seconds when composing
  useEffect(() => {
    if (!isOpen) return;
    const hasContent = Boolean(subject?.trim() || body?.trim() || toChips?.length > 0);
    if (!hasContent) return;

    const timer = setTimeout(() => {
      saveOfflineDraft({
        to: toChips.join(', '),
        toChips,
        subject,
        body,
        attachments,
        signatureStyle
      }).catch(err => console.warn('[ComposeModal] Offline draft auto-save error:', err));
    }, 4000);

    return () => clearTimeout(timer);
  }, [isOpen, subject, body, toChips, attachments, signatureStyle]);

  // Handle undo countdown
  useEffect(() => {
    if (showUndoToast && undoCountdown > 0) {
      undoTimerRef.current = setTimeout(() => {
        setUndoCountdown((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(undoTimerRef.current);
    } else if (showUndoToast && undoCountdown === 0) {
      handleSendComplete();
    }
  }, [showUndoToast, undoCountdown]);

  // Add email chip
  const addChip = (field, email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailRegex.test(email.trim())) {
      switch (field) {
        case 'to':
          if (!toChips.includes(email.trim())) {
            setToChips([...toChips, email.trim()]);
          }
          setTo('');
          break;
        case 'cc':
          if (!ccChips.includes(email.trim())) {
            setCcChips([...ccChips, email.trim()]);
          }
          setCc('');
          break;
        case 'bcc':
          if (!bccChips.includes(email.trim())) {
            setBccChips([...bccChips, email.trim()]);
          }
          setBcc('');
          break;
      }
    }
  };

  const handleKeyPress = (e, field, value) => {
    if ((e.key === 'Enter' || e.key === ',') && value.trim()) {
      e.preventDefault();
      addChip(field, value);
    }
  };

  const removeChip = (field, email) => {
    switch (field) {
      case 'to':
        setToChips(toChips.filter((e) => e !== email));
        break;
      case 'cc':
        setCcChips(ccChips.filter((e) => e !== email));
        break;
      case 'bcc':
        setBccChips(bccChips.filter((e) => e !== email));
        break;
    }
  };

  const handleDocSelect = (doc) => {
    setAttachDocumentId(doc.id);
    setAttachedDoc(doc);
    if (!subject) {
      const typeLabel = doc.type === 'INVOICE' ? 'Invoice' : doc.type === 'DELIVERY_NOTE' ? 'Delivery Note' : doc.type === 'JOB_CARD' ? 'Job Card' : 'Quotation';
      setSubject(`Exoin Africa: ${typeLabel} ${doc.documentNumber}`);
    }
  };

  const handleApplyDocTemplate = (doc) => {
    const typeLabel = doc.type === 'INVOICE' ? 'Invoice' : doc.type === 'DELIVERY_NOTE' ? 'Delivery Note' : doc.type === 'JOB_CARD' ? 'Job Card' : 'Quotation';
    const clientName = doc.client?.name || 'Valued Client';
    const docDate = new Date(doc.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    
    setSubject(`Exoin Africa: ${typeLabel} ${doc.documentNumber} - ${clientName}`);
    
    let templateBody = `<p>Dear ${clientName},</p>
<p>Please find attached official Exoin Africa <strong>${typeLabel} (${doc.documentNumber})</strong> issued on ${docDate}.</p>`;

    if (doc.type === 'INVOICE' && doc.total) {
      templateBody += `<p><strong>Invoice Summary:</strong></p>
<ul>
<li><strong>Invoice Number:</strong> ${doc.documentNumber}</li>
<li><strong>Total Amount:</strong> KES ${Number(doc.total).toLocaleString()}</li>
<li><strong>Status:</strong> ${doc.status || 'ISSUED'}</li>
</ul>
<p>Kindly arrange settlement at your earliest convenience per standard payment terms.</p>`;
    } else if (doc.type === 'DELIVERY_NOTE') {
      templateBody += `<p><strong>Handover Details:</strong></p>
<ul>
<li><strong>Delivery Note:</strong> ${doc.documentNumber}</li>
<li><strong>Destination:</strong> ${doc.client?.address || 'Client Premises'}</li>
</ul>
<p>Please review the enclosed signed delivery note verifying that all items have been inspected and accepted.</p>`;
    } else if (doc.type === 'JOB_CARD') {
      templateBody += `<p><strong>Service Summary:</strong></p>
<ul>
<li><strong>Job Card Ref:</strong> ${doc.documentNumber}</li>
<li><strong>Scope:</strong> Maintenance & Verification Service</li>
</ul>
<p>Our service technicians have finalized the service as outlined in the attached report.</p>`;
    } else {
      templateBody += `<p>Please review the proposal and let us know if you require any modifications or clarifications before approval.</p>`;
    }

    templateBody += `<p>Should you have any questions, feel free to reply directly to this email.</p>
<p>Kind regards,</p>`;

    setBody(templateBody);
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setAttachments([...attachments, ...files]);
    e.target.value = '';
  };

  const removeAttachment = (index) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const handleTemplateSelect = (template) => {
    setSubject(template.subject);
    setBody(template.body);
  };

  const handleEmojiSelect = (emoji) => {
    if (quillRef.current) {
      const quill = quillRef.current.getEditor();
      const range = quill.getSelection(true);
      quill.insertText(range.index, emoji);
      quill.setSelection(range.index + emoji.length);
    }
  };

  const handleSchedule = (date) => {
    setScheduledTime(date);
    setShowSchedule(false);
  };

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        // Remove data URL prefix (e.g., "data:image/png;base64,")
        const base64 = reader.result.split(',')[1];
        resolve({
          filename: file.name,
          content: base64,
          contentType: file.type,
          encoding: 'base64'
        });
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleSend = async () => {
    console.log('ComposeModal: handleSend clicked');
    console.log('Current state:', { to, toChips, subject, attachments: attachments.length });

    // Handle pending 'to' input
    let finalToChips = [...toChips];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (to.trim() && emailRegex.test(to.trim())) {
      console.log('Adding pending recipient:', to.trim());
      finalToChips.push(to.trim());
      setTo('');
    }

    if (finalToChips.length === 0) {
      console.log('Validation failed: No recipients');
      setErrorMessage('Please add at least one recipient');
      return;
    }
    if (!subject.trim()) {
      console.log('Validation failed: No subject');
      setErrorMessage('Please add a subject');
      return;
    }

    // Process attachments
    let processedAttachments = [];
    if (attachments.length > 0) {
      try {
        processedAttachments = await Promise.all(attachments.map(file => fileToBase64(file)));
      } catch (error) {
        console.error('Failed to process attachments:', error);
        return;
      }
    }

    // Prepare email body with signature if enabled
    let finalHtml = body;
    if (includeSignature && userSignature) {
      finalHtml = `${body}<br><br><div class="email-signature">${userSignature}</div>`;
    }

    const emailData = {
      to: finalToChips,
      cc: ccChips,
      bcc: bccChips,
      subject,
      html: finalHtml, // Backend expects 'html', not 'body'
      attachments: processedAttachments,
      scheduledTime,
      attachDocumentId,
      // Don't send includeSignature to backend - we already embedded the signature in finalHtml above
      // Sending includeSignature: true would cause the backend to add a duplicate signature
      includeSignature: false,
    };

    console.log('Proceeding to send with data:', emailData);

    // If there are attachments, force immediate send because backend doesn't support attachments in queue yet
    const hasAttachments = attachments.length > 0 || !!attachDocumentId;

    // If undo is enabled and not scheduled, use server-side undo
    // Otherwise, send immediately or schedule
    if (!hasAttachments && undoSendDelay > 0 && !scheduledTime && onSendWithUndo) {
      console.log('Using server-side undo');
      // Use server-side undo send
      sendWithServerUndo(emailData);
    } else if (!hasAttachments && scheduledTime) {
      console.log('Scheduling email');
      // Schedule for later
      sendEmail({ ...emailData, scheduledTime });
    } else {
      console.log('Sending immediately');
      // Send immediately (no undo)
      // Also used if there are attachments (to ensure they are sent)
      sendEmail(emailData);
    }
  };

  const sendWithServerUndo = async (emailData) => {
    setIsSending(true);
    try {
      if (onSendWithUndo) {
        const result = await onSendWithUndo(emailData);
        if (result?.success && result?.canUndo) {
          // Show undo toast with outbox ID
          setPendingEmail({
            outboxId: result.outboxId,
            sendAt: result.sendAt,
            subject: emailData.subject,
            undoDelaySeconds: result.undoDelaySeconds || undoSendDelay,
          });
          setShowUndoToast(true);
          onClose(); // Close the compose modal
        } else {
          // Already sent or scheduled
          onClose();
        }
      }
    } catch (error) {
      console.error('Failed to queue email:', error);
    } finally {
      setIsSending(false);
    }
  };

  const sendEmail = async (emailData) => {
    console.log('sendEmail: Starting...');
    console.log('sendEmail: onSend prop is:', typeof onSend, onSend ? 'defined' : 'UNDEFINED');
    setIsSending(true);
    setErrorMessage(null);
    try {
      if (onSend) {
        console.log('sendEmail: Calling onSend with data:', JSON.stringify(emailData, null, 2));
        const res = await onSend(emailData);
        console.log('sendEmail: Got response:', res);
        if (res && !res.success) {
          if (res.outboxId) {
            // Saved to outbox (failed to send)
            console.log('sendEmail: Email saved to outbox (failed to send)');
            alert(res.message || "Email saved to Outbox (delivery failed).");
            onClose();
          } else {
            // Failed and not saved
            console.log('sendEmail: Failed -', res.message || res.error);
            setErrorMessage(res.message || res.error || "Failed to send email.");
          }
        } else {
          console.log('sendEmail: Success! Closing modal.');
          onClose();
        }
      } else {
        console.log('sendEmail: onSend is not defined, closing modal');
        onClose();
      }
    } catch (error) {
      console.error('sendEmail: Exception caught:', error);
      setErrorMessage(error.response?.data?.error || error.message || "An error occurred while sending.");
    } finally {
      setIsSending(false);
    }
  };

  const handleUndo = async () => {
    if (pendingEmail?.outboxId && onUndoSend) {
      try {
        await onUndoSend(pendingEmail.outboxId);
        setShowUndoToast(false);
        setPendingEmail(null);
        // Re-open compose with the data (if we want to let them edit)
        // For now, just show a success message
      } catch (error) {
        console.error('Failed to undo:', error);
      }
    } else {
      // Legacy local undo
      clearTimeout(undoTimerRef.current);
      setShowUndoToast(false);
      setPendingEmail(null);
      setUndoCountdown(undoSendDelay);
    }
  };

  const handleSendComplete = () => {
    setShowUndoToast(false);
    if (pendingEmail) {
      sendEmail(pendingEmail);
    }
  };

  if (!isOpen) return null;

  // Gmail-like modal positioning
  const getModalClasses = () => {
    if (isFullscreen) {
      return 'fixed inset-2 sm:inset-4 z-50';
    }
    if (isMinimized) {
      return 'fixed bottom-0 right-2 sm:right-8 w-[260px] sm:w-[280px] z-50';
    }
    if (position.x !== null && position.y !== null) {
      return 'fixed w-full sm:w-[580px] max-w-[100vw] sm:max-w-[95vw] z-50';
    }
    return 'fixed bottom-0 inset-x-0 sm:inset-x-auto sm:right-8 w-full sm:w-[580px] sm:max-w-[95vw] z-50';
  };
  
  const getModalStyle = () => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
    const baseStyle = {
      maxHeight: isFullscreen ? 'calc(100vh - 1rem)' : isMinimized ? '48px' : isMobile ? '88vh' : '72vh',
      height: isFullscreen ? 'calc(100vh - 1rem)' : isMinimized ? '48px' : isMobile ? '88vh' : 'auto',
    };
    
    if (position.x !== null && position.y !== null && !isFullscreen && !isMinimized && !isMobile) {
      return {
        ...baseStyle,
        left: `${position.x}px`,
        top: `${position.y}px`,
      };
    }
    
    return baseStyle;
  };

  return (
    <>
      {/* Backdrop for mobile sheet & fullscreen */}
      {(isFullscreen || !isMinimized) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={`fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-40 transition-opacity ${isFullscreen ? 'block' : 'sm:hidden'}`}
          onClick={onClose}
        />
      )}

      <AnimatePresence>
        <motion.div
          ref={modalRef}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className={`${getModalClasses()} bg-white dark:bg-gray-900 rounded-t-2xl ${isFullscreen ? 'rounded-2xl' : ''} shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden`}
          style={getModalStyle()}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (e.dataTransfer && e.dataTransfer.types.includes('Files')) {
              setIsFileDragging(true);
            }
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (e.currentTarget.contains(e.relatedTarget)) return;
            setIsFileDragging(false);
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsFileDragging(false);
            if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
              setAttachments(prev => [...prev, ...Array.from(e.dataTransfer.files)]);
            }
          }}
        >
          {/* Drag & Drop Visual Dropzone Overlay */}
          {isFileDragging && (
            <div className="absolute inset-0 z-50 bg-orange-600/10 backdrop-blur-xs border-2 border-dashed border-orange-500 rounded-2xl flex flex-col items-center justify-center pointer-events-none animate-in fade-in">
              <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl shadow-xl flex flex-col items-center gap-2 border border-orange-200">
                <Paperclip className="h-8 w-8 text-orange-600 animate-bounce" />
                <p className="text-sm font-bold text-slate-800 dark:text-white">Drop files to attach to this email</p>
                <p className="text-xs text-slate-500">Supports documents, invoices, PDFs, and images</p>
              </div>
            </div>
          )}
          {/* Header - Gmail-like dark header, draggable */}
          <div 
            className={`flex items-center justify-between px-4 py-2.5 ${
              isMinimized 
                ? 'bg-gray-800 dark:bg-gray-800' 
                : 'bg-gray-800 dark:bg-gray-800'
            } ${!isMinimized && !isFullscreen ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'} select-none`}
            onClick={() => isMinimized && setIsMinimized(false)}
            onMouseDown={handleDragStart}
          >
            <h3 className="font-medium text-white text-sm truncate flex-1 mr-4">
              {isMinimized ? (subject || 'New Message') : 'New Message'}
            </h3>
            <div className="flex items-center gap-0.5">
              <button
                onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }}
                className="p-1.5 hover:bg-gray-700 rounded transition-colors"
                title={isMinimized ? 'Expand' : 'Minimize'}
              >
                <Minus className="h-4 w-4 text-gray-300" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setIsFullscreen(!isFullscreen); }}
                className="p-1.5 hover:bg-gray-700 rounded transition-colors"
                title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
              >
                {isFullscreen ? (
                  <Minimize2 className="h-4 w-4 text-gray-300" />
                ) : (
                  <Maximize2 className="h-4 w-4 text-gray-300" />
                )}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onClose(); }}
                className="p-1.5 hover:bg-gray-700 rounded transition-colors"
                title="Close"
              >
                <X className="h-4 w-4 text-gray-300" />
              </button>
            </div>
          </div>

          {/* Body - hidden when minimized */}
          {!isMinimized && (
            <>
              <div className="flex-1 overflow-y-auto flex flex-col">
                {/* Recipients */}
                <div className="border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
                  {/* To field */}
                  <div className="flex items-center px-4 py-2 gap-2">
                    <span className="text-sm text-gray-500 dark:text-gray-400 w-12 flex-shrink-0">To</span>
                    <div className="flex-1 flex flex-wrap items-center gap-1 min-h-[28px]">
                      {toChips.map((email) => (
                        <span
                          key={email}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium"
                        >
                          {email}
                          <button
                            onClick={() => removeChip('to', email)}
                            className="hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                      <input
                        type="email"
                        value={to}
                        onChange={(e) => setTo(e.target.value)}
                        onKeyPress={(e) => handleKeyPress(e, 'to', to)}
                        onBlur={() => to.trim() && addChip('to', to)}
                        placeholder={toChips.length === 0 ? 'Recipients' : ''}
                        className="flex-1 min-w-[120px] bg-transparent border-none outline-none text-sm text-gray-900 dark:text-white placeholder-gray-400"
                      />
                    </div>
                    <button
                      onClick={() => setShowCcBcc(!showCcBcc)}
                      className="text-xs text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 font-medium"
                    >
                      {showCcBcc ? 'Hide' : 'Cc Bcc'}
                    </button>
                  </div>

                  {/* Cc/Bcc fields */}
                  <AnimatePresence>
                    {showCcBcc && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                      >
                        <div className="flex items-center px-4 py-2 gap-2 border-t border-gray-50 dark:border-gray-800">
                          <span className="text-sm text-gray-500 dark:text-gray-400 w-12 flex-shrink-0">Cc</span>
                          <div className="flex-1 flex flex-wrap items-center gap-1 min-h-[28px]">
                            {ccChips.map((email) => (
                              <span
                                key={email}
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full text-xs font-medium"
                              >
                                {email}
                                <button onClick={() => removeChip('cc', email)} className="p-0.5">
                                  <X className="h-3 w-3" />
                                </button>
                              </span>
                            ))}
                            <input
                              type="email"
                              value={cc}
                              onChange={(e) => setCc(e.target.value)}
                              onKeyPress={(e) => handleKeyPress(e, 'cc', cc)}
                              onBlur={() => cc.trim() && addChip('cc', cc)}
                              className="flex-1 min-w-[120px] bg-transparent border-none outline-none text-sm text-gray-900 dark:text-white"
                            />
                          </div>
                        </div>
                        <div className="flex items-center px-4 py-2 gap-2 border-t border-gray-50 dark:border-gray-800">
                          <span className="text-sm text-gray-500 dark:text-gray-400 w-12 flex-shrink-0">Bcc</span>
                          <div className="flex-1 flex flex-wrap items-center gap-1 min-h-[28px]">
                            {bccChips.map((email) => (
                              <span
                                key={email}
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full text-xs font-medium"
                              >
                                {email}
                                <button onClick={() => removeChip('bcc', email)} className="p-0.5">
                                  <X className="h-3 w-3" />
                                </button>
                              </span>
                            ))}
                            <input
                              type="email"
                              value={bcc}
                              onChange={(e) => setBcc(e.target.value)}
                              onKeyPress={(e) => handleKeyPress(e, 'bcc', bcc)}
                              onBlur={() => bcc.trim() && addChip('bcc', bcc)}
                              className="flex-1 min-w-[120px] bg-transparent border-none outline-none text-sm text-gray-900 dark:text-white"
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Subject */}
                  <div className="flex items-center px-4 py-2 gap-2 border-t border-gray-50 dark:border-gray-800">
                    <span className="text-sm text-gray-500 dark:text-gray-400 w-12 flex-shrink-0">Subject</span>
                    <input
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Subject"
                      className="flex-1 bg-transparent border-none outline-none text-sm text-gray-900 dark:text-white placeholder-gray-400"
                    />
                  </div>
                </div>

                {/* Document Attachment Indicator */}
                {(attachDocumentId || attachedDoc) && (
                  <div className="px-4 py-2.5 bg-orange-50/90 dark:bg-orange-950/30 border-t border-b border-orange-100 dark:border-orange-800/60 flex-shrink-0 transition-all duration-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5 text-orange-700 dark:text-orange-400">
                        <div className="w-6 h-6 rounded-lg bg-orange-500 text-white flex items-center justify-center text-[10px] font-black shadow-xs">
                          PDF
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                            <span>{attachedDoc?.documentNumber || 'System Document Attached'}</span>
                            {attachedDoc?.type && (
                              <span className="text-[10px] px-1.5 py-0.2 bg-orange-100 text-orange-700 dark:bg-orange-900/60 dark:text-orange-300 rounded font-bold uppercase">
                                {attachedDoc.type.replace('_', ' ')}
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">
                            {attachedDoc?.client?.name ? `Client: ${attachedDoc.client.name}` : 'PDF will be attached and delivered with this message'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {attachedDoc && (
                          <button
                            type="button"
                            onClick={() => handleApplyDocTemplate(attachedDoc)}
                            className="text-xs font-semibold text-orange-600 dark:text-orange-400 hover:text-orange-700 underline"
                          >
                            Insert Cover Note
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setAttachDocumentId(null);
                            setAttachedDoc(null);
                          }}
                          className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                          title="Remove attachment"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Quill Editor */}
                <div className="flex-1 compose-editor min-h-[200px]">
                  <ReactQuill
                    ref={quillRef}
                    theme="snow"
                    value={body}
                    onChange={setBody}
                    modules={quillModules}
                    formats={quillFormats}
                    placeholder="Write your message..."
                    className="h-full"
                  />
                </div>

                {/* Attachments */}
                {attachments.length > 0 && (
                  <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-800 flex-shrink-0">
                    <div className="flex flex-wrap gap-2">
                      {attachments.map((file, index) => (
                        <AttachmentItem key={index} file={file} onRemove={() => removeAttachment(index)} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Signature Preview */}
                {includeSignature && latestUser && (
                  <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 flex-shrink-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <PenTool className="h-3.5 w-3.5 text-orange-500" />
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Signature</span>
                        <div className="flex items-center bg-slate-200 dark:bg-slate-700 rounded-lg p-0.5 text-[10px] font-semibold ml-2">
                          <button
                            type="button"
                            onClick={() => handleSignatureStyleChange('executive')}
                            className={`px-2 py-0.5 rounded-md transition-all ${
                              (latestUser?.signatureStyle || 'executive') === 'executive'
                                ? 'bg-white dark:bg-slate-900 text-orange-600 shadow-xs'
                                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
                            }`}
                          >
                            Executive
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSignatureStyleChange('minimal')}
                            className={`px-2 py-0.5 rounded-md transition-all ${
                              latestUser?.signatureStyle === 'minimal'
                                ? 'bg-white dark:bg-slate-900 text-orange-600 shadow-xs'
                                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
                            }`}
                          >
                            Compact
                          </button>
                        </div>
                      </div>
                      <button
                        onClick={() => setIncludeSignature(false)}
                        className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                      <EmailSignatureTemplate data={latestUser} darkMode={isDark} />
                    </div>
                  </div>
                )}

                {/* Scheduled indicator */}
                {scheduledTime && (
                  <div className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border-t border-blue-100 dark:border-blue-800 flex-shrink-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                        <Clock className="h-4 w-4" />
                        <span className="text-sm font-medium">
                          Scheduled for {scheduledTime.toLocaleString()}
                        </span>
                      </div>
                      <button
                        onClick={() => setScheduledTime(null)}
                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Error Message */}
              {errorMessage && (
                <div className="px-4 py-2 bg-red-50 dark:bg-red-900/20 border-t border-red-100 dark:border-red-800 text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  {errorMessage}
                </div>
              )}

              {/* Footer / Toolbar */}
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-850 flex-shrink-0">
                <div className="flex items-center gap-2">
                  {/* Send button with schedule dropdown */}
                  <div className="flex items-center">
                    <button
                      onClick={handleSend}
                      disabled={isSending}
                      className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-l-full text-sm font-medium transition-colors"
                    >
                      <Send className="h-4 w-4" />
                      {scheduledTime ? 'Schedule' : 'Send'}
                    </button>
                    <button
                      ref={scheduleButtonRef}
                      onClick={() => setShowSchedule(!showSchedule)}
                      className="px-2 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-r-full border-l border-blue-500/50 transition-colors"
                      title="Schedule send"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {/* Template button */}
                  <button
                    ref={templateButtonRef}
                    onClick={() => setShowTemplates(!showTemplates)}
                    className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors group"
                    title="Templates"
                  >
                    <FileText className="h-5 w-5 text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300" />
                  </button>

                  {/* Attach file button */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors group"
                    title="Attach files"
                  >
                    <Paperclip className="h-5 w-5 text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300" />
                  </button>

                  {/* Attach System Document (Invoice, Quotation, Delivery Note, Job Card) */}
                  <button
                    ref={docPickerButtonRef}
                    type="button"
                    onClick={() => setShowDocPicker(!showDocPicker)}
                    className={`p-2 rounded-full transition-all duration-150 active:scale-95 group ${
                      attachDocumentId 
                        ? 'bg-orange-100 dark:bg-orange-950/40 text-orange-600' 
                        : 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500'
                    }`}
                    title="Attach System Document (Invoice, Quotation, Delivery Note, Job Card)"
                  >
                    <FileCheck className="h-5 w-5 group-hover:text-orange-500" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                  />

                  {/* Emoji button */}
                  <button
                    ref={emojiButtonRef}
                    onClick={() => setShowEmoji(!showEmoji)}
                    className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors group"
                    title="Insert emoji"
                  >
                    <Smile className="h-5 w-5 text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300" />
                  </button>

                  {/* Signature toggle button */}
                  {user && (
                    <button
                      onClick={() => setIncludeSignature(!includeSignature)}
                      className={`p-2 rounded-full transition-colors group ${
                        includeSignature 
                          ? 'bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-800/40' 
                          : 'hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                      title={includeSignature ? 'Remove signature' : 'Add signature'}
                    >
                      <PenTool className={`h-5 w-5 ${
                        includeSignature 
                          ? 'text-blue-600 dark:text-blue-400' 
                          : 'text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300'
                      }`} />
                    </button>
                  )}

                  <div className="w-px h-5 bg-gray-300 dark:bg-gray-700 mx-1" />

                  {/* Delete button */}
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-full transition-colors group"
                    title="Discard"
                  >
                    <Trash2 className="h-5 w-5 text-gray-500 group-hover:text-red-500" />
                  </button>
                </div>
              </div>
            </>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Popovers - All open UPWARD */}
      <AnimatePresence>
        {showDocPicker && (
          <DocumentAttachmentPicker
            isOpen={showDocPicker}
            onClose={() => setShowDocPicker(false)}
            onSelect={handleDocSelect}
            anchorRef={docPickerButtonRef}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showTemplates && (
          <TemplatePicker
            isOpen={showTemplates}
            onClose={() => setShowTemplates(false)}
            onSelect={handleTemplateSelect}
            anchorRef={templateButtonRef}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSchedule && (
          <ScheduleSendPicker
            isOpen={showSchedule}
            onClose={() => setShowSchedule(false)}
            onSchedule={handleSchedule}
            anchorRef={scheduleButtonRef}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showEmoji && (
          <EmojiPickerPopover
            isOpen={showEmoji}
            onClose={() => setShowEmoji(false)}
            onSelect={handleEmojiSelect}
            anchorRef={emojiButtonRef}
          />
        )}
      </AnimatePresence>

      {/* Undo Send Toast */}
      <AnimatePresence>
        {showUndoToast && (
          <UndoSendToast
            isVisible={showUndoToast}
            countdown={undoCountdown}
            maxCountdown={undoSendDelay}
            onUndo={handleUndo}
            onComplete={handleSendComplete}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default ComposeModal;
