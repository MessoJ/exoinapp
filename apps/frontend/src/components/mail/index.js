// Mail Components Index
// Centralized exports for all mail-related components

export { default as SearchBar } from './SearchBar';
export { default as FolderTree, LabelBadge, LabelModal, LABEL_COLORS } from './FolderTree';
export { default as EmailList, EmailListItem, EmailAvatar, formatDate } from './EmailList';
export { default as EmailPreview } from './EmailPreview';
export { default as EmailThread } from './EmailThread';
export { default as AttachmentPreview, AttachmentCard, AttachmentListItem, AttachmentChip } from './AttachmentPreview';
export { default as KeyboardShortcutsModal } from './KeyboardShortcutsModal';
export { default as ThemeToggle } from './ThemeToggle';
export { default as ComposeModal } from './ComposeModal';
export { default as UndoSendToast } from './UndoSendToast';
export { default as SnoozeModal } from './SnoozeModal';

// New Components - Phases 3.3-7
export { default as PriorityInbox } from './PriorityInbox';
export { default as ScheduleSendModal } from './ScheduleSendModal';
export { default as ScheduledEmailsList } from './ScheduledEmailsList';
export { default as SmartReply } from './SmartReply';
export { default as EmailSummary } from './EmailSummary';
export { default as TemplatesPanel } from './TemplatesPanel';
export { default as VacationResponder } from './VacationResponder';

// Security & Tracking Components - Phases 6-7
export { default as SecurityBadge, SecurityAnalysisModal } from './SecurityBadge';
export { default as TrackingDashboard } from './TrackingDashboard';
export { default as MailMerge } from './MailMerge';
