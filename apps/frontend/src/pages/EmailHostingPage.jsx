import { useState, useEffect, Fragment } from 'react';
import { 
  GlobeAltIcon, 
  EnvelopeIcon, 
  ArrowPathIcon,
  PlusIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ClipboardDocumentIcon,
  ChevronRightIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  ServerIcon,
  Cog6ToothIcon,
  UserGroupIcon,
  DocumentDuplicateIcon,
  InboxIcon,
  PaperAirplaneIcon,
  EyeIcon,
  EyeSlashIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowsUpDownIcon,
  KeyIcon,
  FolderIcon,
  ArchiveBoxIcon,
  DocumentIcon,
  PhotoIcon,
  FilmIcon,
  MusicalNoteIcon,
  CodeBracketIcon,
  TableCellsIcon,
  PresentationChartBarIcon,
  CalendarIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';
import { Dialog, Transition, Tab } from '@headlessui/react';
import { useNavigate } from 'react-router-dom';
import { emailHostingApi } from '../lib/api';

// DNS Record Type Badge Component
const DNSTypeBadge = ({ type }) => {
  const colors = {
    MX: 'bg-purple-100 text-purple-800',
    TXT: 'bg-blue-100 text-blue-800',
    A: 'bg-green-100 text-green-800',
    AAAA: 'bg-cyan-100 text-cyan-800',
    CNAME: 'bg-orange-100 text-orange-800',
  };
  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded ${colors[type] || 'bg-gray-100 text-gray-800'}`}>
      {type}
    </span>
  );
};

// Status Badge Component
const StatusBadge = ({ verified, label }) => {
  return verified ? (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded-full">
      <CheckCircleIcon className="w-3.5 h-3.5" />
      {label || 'Verified'}
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
      <ExclamationTriangleIcon className="w-3.5 h-3.5" />
      {label || 'Pending'}
    </span>
  );
};

// Stats Card Component with clickable action
const StatsCard = ({ icon: Icon, label, value, subValue, color = 'blue', onClick, actionLabel }) => {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
  };
  return (
    <div 
      className={`bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        <div className={`p-2.5 rounded-lg ${colors[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-sm text-gray-500">{label}</p>
          {subValue && <p className="text-xs text-gray-400 mt-0.5">{subValue}</p>}
        </div>
        {onClick && actionLabel && (
          <ChevronRightIcon className="w-5 h-5 text-gray-400" />
        )}
      </div>
    </div>
  );
};

// Storage Drilldown Modal - Shows detailed storage usage with deep breakdown
const StorageDrilldownModal = ({ isOpen, onClose, mailboxes, domain, totalUsed, totalQuota }) => {
  const [selectedMailbox, setSelectedMailbox] = useState(null);
  const [viewMode, setViewMode] = useState('overview'); // 'overview', 'mailbox', 'category'
  const [selectedCategory, setSelectedCategory] = useState(null);
  
  const sortedMailboxes = [...mailboxes].sort((a, b) => (b.usedMb || 0) - (a.usedMb || 0));
  
  const getStorageColor = (used, quota) => {
    const percentage = (used / quota) * 100;
    if (percentage > 90) return 'bg-red-500';
    if (percentage > 75) return 'bg-orange-500';
    if (percentage > 50) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStorageGradient = (used, quota) => {
    const percentage = (used / quota) * 100;
    if (percentage > 90) return 'from-red-500 to-red-600';
    if (percentage > 75) return 'from-orange-500 to-orange-600';
    if (percentage > 50) return 'from-yellow-500 to-yellow-600';
    return 'from-green-500 to-green-600';
  };

  const formatStorage = (mb) => {
    if (mb >= 1024) return `${(mb / 1024).toFixed(2)} GB`;
    if (mb >= 1) return `${mb.toFixed(0)} MB`;
    return `${(mb * 1024).toFixed(0)} KB`;
  };

  // Simulated breakdown by folder type (in real app, this would come from API)
  const getFolderBreakdown = (mailbox) => {
    const used = mailbox.usedMb || 0;
    return [
      { name: 'Inbox', icon: InboxIcon, size: used * 0.35, color: 'bg-blue-500', items: Math.floor(used * 50) },
      { name: 'Sent', icon: PaperAirplaneIcon, size: used * 0.25, color: 'bg-green-500', items: Math.floor(used * 30) },
      { name: 'Drafts', icon: DocumentIcon, size: used * 0.05, color: 'bg-yellow-500', items: Math.floor(used * 5) },
      { name: 'Archive', icon: ArchiveBoxIcon, size: used * 0.20, color: 'bg-purple-500', items: Math.floor(used * 25) },
      { name: 'Spam', icon: ExclamationTriangleIcon, size: used * 0.08, color: 'bg-orange-500', items: Math.floor(used * 15) },
      { name: 'Trash', icon: TrashIcon, size: used * 0.07, color: 'bg-red-500', items: Math.floor(used * 10) },
    ];
  };

  // Simulated breakdown by attachment type
  const getAttachmentBreakdown = (mailbox) => {
    const used = mailbox.usedMb || 0;
    const attachmentSpace = used * 0.6; // 60% of storage is attachments
    return [
      { name: 'Images', icon: PhotoIcon, size: attachmentSpace * 0.30, color: 'bg-pink-500', count: Math.floor(used * 15), ext: 'jpg, png, gif' },
      { name: 'Documents', icon: DocumentIcon, size: attachmentSpace * 0.25, color: 'bg-blue-500', count: Math.floor(used * 20), ext: 'pdf, doc, txt' },
      { name: 'Spreadsheets', icon: TableCellsIcon, size: attachmentSpace * 0.15, color: 'bg-green-500', count: Math.floor(used * 10), ext: 'xlsx, csv' },
      { name: 'Presentations', icon: PresentationChartBarIcon, size: attachmentSpace * 0.10, color: 'bg-orange-500', count: Math.floor(used * 5), ext: 'pptx, key' },
      { name: 'Videos', icon: FilmIcon, size: attachmentSpace * 0.12, color: 'bg-purple-500', count: Math.floor(used * 2), ext: 'mp4, mov' },
      { name: 'Audio', icon: MusicalNoteIcon, size: attachmentSpace * 0.05, color: 'bg-indigo-500', count: Math.floor(used * 3), ext: 'mp3, wav' },
      { name: 'Archives', icon: ArchiveBoxIcon, size: attachmentSpace * 0.03, color: 'bg-gray-500', count: Math.floor(used * 2), ext: 'zip, rar' },
    ];
  };

  // Get top storage consumers (largest emails)
  const getLargestItems = (mailbox) => {
    const used = mailbox.usedMb || 0;
    return [
      { subject: 'Q3 Financial Report with Attachments', from: 'finance@company.com', size: used * 0.08, date: '2 days ago', attachments: 5 },
      { subject: 'Project Assets - Final Delivery', from: 'design@agency.com', size: used * 0.06, date: '1 week ago', attachments: 12 },
      { subject: 'Marketing Campaign Materials', from: 'marketing@partner.com', size: used * 0.05, date: '3 days ago', attachments: 8 },
      { subject: 'Product Photos - High Resolution', from: 'photo@studio.com', size: used * 0.04, date: '5 days ago', attachments: 15 },
      { subject: 'Contract Documents Signed', from: 'legal@firm.com', size: used * 0.03, date: '1 week ago', attachments: 3 },
    ];
  };

  // Storage trends (simulated)
  const getStorageTrends = () => {
    return [
      { period: 'This Week', added: 45, deleted: 12, net: 33 },
      { period: 'Last Week', added: 62, deleted: 28, net: 34 },
      { period: 'This Month', added: 180, deleted: 95, net: 85 },
      { period: 'Last Month', added: 210, deleted: 150, net: 60 },
    ];
  };

  const renderOverview = () => (
    <>
      {/* Total Storage Overview */}
      <div className="mb-6 p-5 bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl text-white">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-slate-400 text-sm">Total Domain Storage</p>
            <p className="text-3xl font-bold">{formatStorage(totalUsed)} <span className="text-lg text-slate-400 font-normal">/ {formatStorage(totalQuota)}</span></p>
          </div>
          <div className="text-right">
            <p className="text-4xl font-bold text-orange-400">{((totalUsed / totalQuota) * 100).toFixed(1)}%</p>
            <p className="text-slate-400 text-sm">used</p>
          </div>
        </div>
        <div className="h-4 bg-slate-700 rounded-full overflow-hidden">
          <div 
            className={`h-full bg-gradient-to-r ${getStorageGradient(totalUsed, totalQuota)} transition-all`}
            style={{ width: `${Math.min((totalUsed / totalQuota) * 100, 100)}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-slate-400">
          <span>{formatStorage(totalQuota - totalUsed)} available</span>
          <span>{mailboxes.length} mailboxes</span>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-blue-50 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-blue-700">{mailboxes.length}</p>
          <p className="text-xs text-blue-600">Mailboxes</p>
        </div>
        <div className="bg-green-50 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-green-700">{mailboxes.filter(m => (m.usedMb || 0) < (m.quotaMb || 5120) * 0.5).length}</p>
          <p className="text-xs text-green-600">Healthy (&lt;50%)</p>
        </div>
        <div className="bg-red-50 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-red-700">{mailboxes.filter(m => (m.usedMb || 0) > (m.quotaMb || 5120) * 0.9).length}</p>
          <p className="text-xs text-red-600">Critical (&gt;90%)</p>
        </div>
      </div>

      {/* Storage Trends */}
      <div className="mb-6">
        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <ArrowTrendingUpIcon className="w-5 h-5 text-blue-600" />
          Storage Trends
        </h4>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {getStorageTrends().map((trend, idx) => (
            <div key={idx} className="bg-gray-50 rounded-xl p-3 border border-gray-200">
              <p className="text-xs text-gray-500 mb-1">{trend.period}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-green-600">
                  <ArrowTrendingUpIcon className="w-3 h-3" />
                  <span className="text-sm font-medium">+{trend.added} MB</span>
                </div>
                <div className="flex items-center gap-1 text-red-600">
                  <ArrowTrendingDownIcon className="w-3 h-3" />
                  <span className="text-sm font-medium">-{trend.deleted} MB</span>
                </div>
              </div>
              <p className="text-xs text-gray-600 mt-1">Net: +{trend.net} MB</p>
            </div>
          ))}
        </div>
      </div>

      {/* Per-Mailbox Breakdown */}
      <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
        <EnvelopeIcon className="w-5 h-5 text-purple-600" />
        Mailbox Storage Breakdown
        <span className="text-xs text-gray-500 font-normal">Click for details</span>
      </h4>
      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
        {sortedMailboxes.map((mailbox) => {
          const used = mailbox.usedMb || 0;
          const quota = mailbox.quotaMb || 5120;
          const percentage = (used / quota) * 100;
          
          return (
            <div 
              key={mailbox.id} 
              onClick={() => { setSelectedMailbox(mailbox); setViewMode('mailbox'); }}
              className="p-4 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 bg-gradient-to-br ${getStorageGradient(used, quota)} rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm`}>
                    {mailbox.localPart.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <span className="font-medium text-gray-900">{mailbox.localPart}@{domain}</span>
                    {mailbox.displayName && (
                      <p className="text-xs text-gray-500">{mailbox.displayName}</p>
                    )}
                  </div>
                </div>
                <div className="text-right flex items-center gap-3">
                  <div>
                    <span className="font-bold text-gray-900">{formatStorage(used)}</span>
                    <span className="text-gray-400 text-sm"> / {formatStorage(quota)}</span>
                  </div>
                  <ChevronRightIcon className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                </div>
              </div>
              <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${getStorageColor(used, quota)} transition-all`}
                  style={{ width: `${Math.min(percentage, 100)}%` }}
                />
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-gray-500">{percentage.toFixed(1)}% used</span>
                <div className="flex items-center gap-2">
                  {percentage > 90 && (
                    <span className="text-xs text-red-600 font-medium flex items-center gap-1 bg-red-50 px-2 py-0.5 rounded-full">
                      <ExclamationTriangleIcon className="w-3 h-3" />
                      Almost full
                    </span>
                  )}
                  {percentage > 75 && percentage <= 90 && (
                    <span className="text-xs text-orange-600 font-medium bg-orange-50 px-2 py-0.5 rounded-full">High usage</span>
                  )}
                  <span className="text-xs text-blue-600 group-hover:underline">View details →</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );

  const renderMailboxDetails = () => {
    if (!selectedMailbox) return null;
    const used = selectedMailbox.usedMb || 0;
    const quota = selectedMailbox.quotaMb || 5120;
    const folders = getFolderBreakdown(selectedMailbox);
    const attachments = getAttachmentBreakdown(selectedMailbox);
    const largestItems = getLargestItems(selectedMailbox);

    return (
      <>
        {/* Mailbox Header */}
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl text-white">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-xl font-bold">
              {selectedMailbox.localPart.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-bold text-lg">{selectedMailbox.localPart}@{domain}</p>
              {selectedMailbox.displayName && <p className="text-blue-200 text-sm">{selectedMailbox.displayName}</p>}
            </div>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-3xl font-bold">{formatStorage(used)}</p>
              <p className="text-blue-200 text-sm">of {formatStorage(quota)} used</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">{((used / quota) * 100).toFixed(1)}%</p>
            </div>
          </div>
          <div className="h-3 bg-white/20 rounded-full overflow-hidden mt-3">
            <div 
              className="h-full bg-white transition-all"
              style={{ width: `${Math.min((used / quota) * 100, 100)}%` }}
            />
          </div>
        </div>

        {/* Folder Breakdown */}
        <div className="mb-6">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <FolderIcon className="w-5 h-5 text-yellow-600" />
            Storage by Folder
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {folders.map((folder, idx) => {
              const Icon = folder.icon;
              return (
                <div key={idx} className="p-3 bg-gray-50 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`p-1.5 rounded-lg ${folder.color} bg-opacity-10`}>
                      <Icon className={`w-4 h-4 ${folder.color.replace('bg-', 'text-')}`} />
                    </div>
                    <span className="font-medium text-gray-900 text-sm">{folder.name}</span>
                  </div>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-lg font-bold text-gray-900">{formatStorage(folder.size)}</p>
                      <p className="text-xs text-gray-500">{folder.items.toLocaleString()} items</p>
                    </div>
                    <p className="text-xs text-gray-400">{((folder.size / used) * 100).toFixed(0)}%</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Attachment Types */}
        <div className="mb-6">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <DocumentIcon className="w-5 h-5 text-blue-600" />
            Attachments by Type
            <span className="text-xs text-gray-400 font-normal">(~60% of storage)</span>
          </h4>
          <div className="space-y-2">
            {attachments.map((att, idx) => {
              const Icon = att.icon;
              const percentage = (att.size / (used * 0.6)) * 100;
              return (
                <div key={idx} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className={`p-2 rounded-lg ${att.color} bg-opacity-10`}>
                    <Icon className={`w-4 h-4 ${att.color.replace('bg-', 'text-')}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-gray-900 text-sm">{att.name}</span>
                      <span className="text-sm font-bold text-gray-900">{formatStorage(att.size)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div className={`h-full ${att.color} transition-all`} style={{ width: `${percentage}%` }} />
                      </div>
                      <span className="text-xs text-gray-500 w-16 text-right">{att.count} files</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{att.ext}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Largest Emails */}
        <div>
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <ArrowTrendingUpIcon className="w-5 h-5 text-red-600" />
            Largest Emails
            <span className="text-xs text-gray-400 font-normal">Top storage consumers</span>
          </h4>
          <div className="space-y-2">
            {largestItems.map((item, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center text-red-600 font-bold text-sm flex-shrink-0">
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm truncate">{item.subject}</p>
                  <p className="text-xs text-gray-500">{item.from}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <ClockIcon className="w-3 h-3" />
                      {item.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <DocumentIcon className="w-3 h-3" />
                      {item.attachments} attachments
                    </span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-gray-900">{formatStorage(item.size)}</p>
                  <p className="text-xs text-gray-500">{((item.size / used) * 100).toFixed(1)}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </>
    );
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-2xl bg-white shadow-xl transition-all max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-gray-200 flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {viewMode !== 'overview' && (
                        <button
                          onClick={() => { setViewMode('overview'); setSelectedMailbox(null); }}
                          className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors"
                        >
                          <ChevronRightIcon className="w-5 h-5 rotate-180" />
                        </button>
                      )}
                      <div className="p-2.5 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg shadow-orange-500/25">
                        <ServerIcon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <Dialog.Title className="text-xl font-bold text-gray-900">
                          {viewMode === 'overview' ? 'Storage Analytics' : 'Mailbox Storage Details'}
                        </Dialog.Title>
                        <p className="text-gray-500 text-sm">{domain}</p>
                      </div>
                    </div>
                    <button
                      onClick={onClose}
                      className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
                    >
                      <XCircleIcon className="w-6 h-6" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1">
                  {viewMode === 'overview' ? renderOverview() : renderMailboxDetails()}
                </div>

                {/* Footer */}
                <div className="p-4 bg-gray-50 border-t border-gray-200 flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <CalendarIcon className="w-4 h-4" />
                      Last updated: Just now
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => { setViewMode('overview'); setSelectedMailbox(null); }}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${viewMode === 'overview' ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                        disabled={viewMode === 'overview'}
                      >
                        Back to Overview
                      </button>
                      <button
                        onClick={onClose}
                        className="px-6 py-2 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

// Add Domain Modal
const AddDomainModal = ({ isOpen, onClose, onSubmit }) => {
  const [domain, setDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      await onSubmit({ domain: domain.toLowerCase().trim() });
      setDomain('');
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add domain');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 shadow-xl transition-all">
                <Dialog.Title className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <GlobeAltIcon className="w-5 h-5 text-blue-600" />
                  Add Email Domain
                </Dialog.Title>

                <form onSubmit={handleSubmit} className="mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Domain Name
                    </label>
                    <input
                      type="text"
                      value={domain}
                      onChange={(e) => setDomain(e.target.value)}
                      placeholder="example.com"
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      required
                    />
                    <p className="mt-1.5 text-xs text-gray-500">
                      Enter your domain without "www" or "http://"
                    </p>
                  </div>

                  {error && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                      {error}
                    </div>
                  )}

                  <div className="mt-6 flex gap-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading || !domain.trim()}
                      className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                    >
                      {loading && <ArrowPathIcon className="w-4 h-4 animate-spin" />}
                      Add Domain
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

// Add Mailbox Modal
const AddMailboxModal = ({ isOpen, onClose, onSubmit, domain }) => {
  const [localPart, setLocalPart] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    
    setLoading(true);
    try {
      await onSubmit({ 
        localPart: localPart.toLowerCase().trim(), 
        password,
        displayName: displayName.trim() || undefined
      });
      setLocalPart('');
      setDisplayName('');
      setPassword('');
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create mailbox');
    } finally {
      setLoading(false);
    }
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
    let pass = '';
    for (let i = 0; i < 16; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(pass);
    setShowPassword(true);
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 shadow-xl transition-all">
                <Dialog.Title className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <EnvelopeIcon className="w-5 h-5 text-blue-600" />
                  Create Email Account
                </Dialog.Title>

                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address
                    </label>
                    <div className="flex">
                      <input
                        type="text"
                        value={localPart}
                        onChange={(e) => setLocalPart(e.target.value.replace(/[^a-zA-Z0-9._-]/g, ''))}
                        placeholder="john.doe"
                        className="flex-1 px-4 py-2.5 rounded-l-lg border border-r-0 border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        required
                      />
                      <span className="px-4 py-2.5 bg-gray-100 border border-gray-300 text-gray-600 rounded-r-lg">
                        @{domain}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Display Name <span className="text-gray-400">(optional)</span>
                    </label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="John Doe"
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Min. 8 characters"
                        className="w-full px-4 py-2.5 pr-24 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        required
                        minLength={8}
                      />
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="p-1.5 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                        </button>
                        <button
                          type="button"
                          onClick={generatePassword}
                          className="p-1.5 text-gray-400 hover:text-gray-600"
                          title="Generate password"
                        >
                          <KeyIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                      {error}
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading || !localPart.trim() || !password}
                      className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                    >
                      {loading && <ArrowPathIcon className="w-4 h-4 animate-spin" />}
                      Create Account
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

// Add Alias Modal
const AddAliasModal = ({ isOpen, onClose, onSubmit, domain, mailboxes }) => {
  const [localPart, setLocalPart] = useState('');
  const [targetType, setTargetType] = useState('mailbox');
  const [targetMailboxId, setTargetMailboxId] = useState('');
  const [externalTarget, setExternalTarget] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      await onSubmit({
        localPart: localPart.toLowerCase().trim(),
        targetMailboxId: targetType === 'mailbox' ? targetMailboxId : undefined,
        externalTarget: targetType === 'external' ? externalTarget.trim() : undefined,
      });
      setLocalPart('');
      setTargetMailboxId('');
      setExternalTarget('');
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create alias');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 shadow-xl transition-all">
                <Dialog.Title className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <DocumentDuplicateIcon className="w-5 h-5 text-blue-600" />
                  Create Email Alias
                </Dialog.Title>

                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Alias Address
                    </label>
                    <div className="flex">
                      <input
                        type="text"
                        value={localPart}
                        onChange={(e) => setLocalPart(e.target.value.replace(/[^a-zA-Z0-9._-]/g, ''))}
                        placeholder="support"
                        className="flex-1 px-4 py-2.5 rounded-l-lg border border-r-0 border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        required
                      />
                      <span className="px-4 py-2.5 bg-gray-100 border border-gray-300 text-gray-600 rounded-r-lg">
                        @{domain}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Forward To
                    </label>
                    <div className="flex gap-4 mb-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="targetType"
                          checked={targetType === 'mailbox'}
                          onChange={() => setTargetType('mailbox')}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-sm text-gray-700">Mailbox</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="targetType"
                          checked={targetType === 'external'}
                          onChange={() => setTargetType('external')}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-sm text-gray-700">External Email</span>
                      </label>
                    </div>

                    {targetType === 'mailbox' ? (
                      <select
                        value={targetMailboxId}
                        onChange={(e) => setTargetMailboxId(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        required
                      >
                        <option value="">Select a mailbox...</option>
                        {mailboxes.map((mb) => (
                          <option key={mb.id} value={mb.id}>
                            {mb.localPart}@{domain} {mb.displayName ? `(${mb.displayName})` : ''}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="email"
                        value={externalTarget}
                        onChange={(e) => setExternalTarget(e.target.value)}
                        placeholder="external@gmail.com"
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        required
                      />
                    )}
                  </div>

                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                      {error}
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading || !localPart.trim() || (targetType === 'mailbox' && !targetMailboxId) || (targetType === 'external' && !externalTarget.trim())}
                      className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                    >
                      {loading && <ArrowPathIcon className="w-4 h-4 animate-spin" />}
                      Create Alias
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

// Mailbox Settings Modal - Comprehensive mailbox management
const MailboxSettingsModal = ({ isOpen, onClose, mailbox, domain, onUpdate, onUpdatePassword }) => {
  const [activeSettingsTab, setActiveSettingsTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Settings state
  const [displayName, setDisplayName] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [quotaMb, setQuotaMb] = useState(5120);
  
  // Auto-reply state
  const [autoReply, setAutoReply] = useState(false);
  const [autoReplySubject, setAutoReplySubject] = useState('');
  const [autoReplyMessage, setAutoReplyMessage] = useState('');
  const [autoReplyStart, setAutoReplyStart] = useState('');
  const [autoReplyEnd, setAutoReplyEnd] = useState('');
  
  // Forwarding state
  const [forwardingEnabled, setForwardingEnabled] = useState(false);
  const [forwardingAddress, setForwardingAddress] = useState('');
  const [keepCopy, setKeepCopy] = useState(true);
  
  // Spam settings
  const [spamFilterLevel, setSpamFilterLevel] = useState('medium');
  const [spamAction, setSpamAction] = useState('folder');
  
  // Signature
  const [signatureText, setSignatureText] = useState('');
  
  // Password change
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  useEffect(() => {
    if (mailbox) {
      setDisplayName(mailbox.displayName || '');
      setIsActive(mailbox.isActive ?? true);
      setQuotaMb(mailbox.quotaMb || 5120);
      setAutoReply(mailbox.autoReply || false);
      setAutoReplySubject(mailbox.autoReplySubject || '');
      setAutoReplyMessage(mailbox.autoReplyMessage || '');
      setAutoReplyStart(mailbox.autoReplyStart ? mailbox.autoReplyStart.split('T')[0] : '');
      setAutoReplyEnd(mailbox.autoReplyEnd ? mailbox.autoReplyEnd.split('T')[0] : '');
      setForwardingEnabled(mailbox.forwardingEnabled || false);
      setForwardingAddress(mailbox.forwardingAddress || '');
      setKeepCopy(mailbox.keepCopy ?? true);
      setSpamFilterLevel(mailbox.spamFilterLevel || 'medium');
      setSpamAction(mailbox.spamAction || 'folder');
      setSignatureText(mailbox.signatureText || '');
    }
  }, [mailbox]);

  const handleSaveSettings = async () => {
    setError('');
    setSuccess('');
    setLoading(true);
    
    try {
      await onUpdate(mailbox.id, {
        displayName,
        isActive,
        quotaMb: parseInt(quotaMb),
        autoReply,
        autoReplySubject,
        autoReplyMessage,
        autoReplyStart: autoReplyStart || undefined,
        autoReplyEnd: autoReplyEnd || undefined,
        forwardingEnabled,
        forwardingAddress: forwardingEnabled ? forwardingAddress : undefined,
        keepCopy,
        spamFilterLevel,
        spamAction,
        signatureText,
      });
      setSuccess('Settings saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    
    setError('');
    setSuccess('');
    setLoading(true);
    
    try {
      await onUpdatePassword(mailbox.id, newPassword);
      setNewPassword('');
      setConfirmPassword('');
      setSuccess('Password changed successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
    let pass = '';
    for (let i = 0; i < 16; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(pass);
    setConfirmPassword(pass);
    setShowNewPassword(true);
  };

  if (!mailbox) return null;

  const emailAddress = `${mailbox.localPart}@${domain}`;
  const settingsTabs = ['General', 'Auto-Reply', 'Forwarding', 'Security', 'Signature', 'Connection'];

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white shadow-xl transition-all">
                <div className="p-6 border-b border-gray-200">
                  <Dialog.Title className="text-lg font-semibold text-gray-900 flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                      {mailbox.localPart.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div>{emailAddress}</div>
                      <div className="text-sm font-normal text-gray-500">{mailbox.displayName || 'Mailbox Settings'}</div>
                    </div>
                  </Dialog.Title>
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-200">
                  <div className="flex overflow-x-auto">
                    {settingsTabs.map((tab, idx) => (
                      <button
                        key={tab}
                        onClick={() => setActiveSettingsTab(idx)}
                        className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                          activeSettingsTab === idx
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-6 max-h-[60vh] overflow-y-auto">
                  {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                      {error}
                    </div>
                  )}
                  {success && (
                    <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-600">
                      {success}
                    </div>
                  )}

                  {/* General Settings */}
                  {activeSettingsTab === 0 && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                        <input
                          type="text"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          placeholder="John Doe"
                          className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Storage Quota (MB)</label>
                        <select
                          value={quotaMb}
                          onChange={(e) => setQuotaMb(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="1024">1 GB</option>
                          <option value="2048">2 GB</option>
                          <option value="5120">5 GB</option>
                          <option value="10240">10 GB</option>
                          <option value="20480">20 GB</option>
                          <option value="51200">50 GB</option>
                        </select>
                        <p className="mt-1 text-xs text-gray-500">
                          Currently using {((mailbox.usedMb || 0) / 1024).toFixed(2)} GB
                        </p>
                      </div>
                      
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <div className="font-medium text-gray-900">Account Status</div>
                          <div className="text-sm text-gray-500">Enable or disable this mailbox</div>
                        </div>
                        <button
                          onClick={() => setIsActive(!isActive)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            isActive ? 'bg-blue-600' : 'bg-gray-300'
                          }`}
                        >
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            isActive ? 'translate-x-6' : 'translate-x-1'
                          }`} />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Auto-Reply Settings */}
                  {activeSettingsTab === 1 && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <div className="font-medium text-gray-900">Out of Office Reply</div>
                          <div className="text-sm text-gray-500">Automatically reply to incoming emails</div>
                        </div>
                        <button
                          onClick={() => setAutoReply(!autoReply)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            autoReply ? 'bg-blue-600' : 'bg-gray-300'
                          }`}
                        >
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            autoReply ? 'translate-x-6' : 'translate-x-1'
                          }`} />
                        </button>
                      </div>
                      
                      {autoReply && (
                        <>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                              <input
                                type="date"
                                value={autoReplyStart}
                                onChange={(e) => setAutoReplyStart(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                              <input
                                type="date"
                                value={autoReplyEnd}
                                onChange={(e) => setAutoReplyEnd(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                            <input
                              type="text"
                              value={autoReplySubject}
                              onChange={(e) => setAutoReplySubject(e.target.value)}
                              placeholder="Out of Office: I'm currently away"
                              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                            <textarea
                              value={autoReplyMessage}
                              onChange={(e) => setAutoReplyMessage(e.target.value)}
                              placeholder="Thank you for your email. I am currently out of office..."
                              rows={4}
                              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* Forwarding Settings */}
                  {activeSettingsTab === 2 && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <div className="font-medium text-gray-900">Email Forwarding</div>
                          <div className="text-sm text-gray-500">Forward emails to another address</div>
                        </div>
                        <button
                          onClick={() => setForwardingEnabled(!forwardingEnabled)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            forwardingEnabled ? 'bg-blue-600' : 'bg-gray-300'
                          }`}
                        >
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            forwardingEnabled ? 'translate-x-6' : 'translate-x-1'
                          }`} />
                        </button>
                      </div>
                      
                      {forwardingEnabled && (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Forward To</label>
                            <input
                              type="email"
                              value={forwardingAddress}
                              onChange={(e) => setForwardingAddress(e.target.value)}
                              placeholder="forward@example.com"
                              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          
                          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div>
                              <div className="font-medium text-gray-900">Keep a Copy</div>
                              <div className="text-sm text-gray-500">Store a copy of forwarded emails in this mailbox</div>
                            </div>
                            <button
                              onClick={() => setKeepCopy(!keepCopy)}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                keepCopy ? 'bg-blue-600' : 'bg-gray-300'
                              }`}
                            >
                              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                keepCopy ? 'translate-x-6' : 'translate-x-1'
                              }`} />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* Security Settings */}
                  {activeSettingsTab === 3 && (
                    <div className="space-y-6">
                      {/* Password Change */}
                      <div className="p-4 border border-gray-200 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-4">Change Password</h4>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                            <div className="relative">
                              <input
                                type={showNewPassword ? 'text' : 'password'}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Min. 8 characters"
                                className="w-full px-4 py-2.5 pr-20 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                                <button
                                  type="button"
                                  onClick={() => setShowNewPassword(!showNewPassword)}
                                  className="p-1.5 text-gray-400 hover:text-gray-600"
                                >
                                  {showNewPassword ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                                </button>
                                <button
                                  type="button"
                                  onClick={generatePassword}
                                  className="p-1.5 text-gray-400 hover:text-gray-600"
                                  title="Generate password"
                                >
                                  <KeyIcon className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                            <input
                              type={showNewPassword ? 'text' : 'password'}
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              placeholder="Confirm new password"
                              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          <button
                            onClick={handlePasswordChange}
                            disabled={loading || !newPassword || !confirmPassword}
                            className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                          >
                            {loading ? 'Changing...' : 'Change Password'}
                          </button>
                        </div>
                      </div>
                      
                      {/* Spam Settings */}
                      <div className="p-4 border border-gray-200 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-4">Spam Protection</h4>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Filter Level</label>
                            <select
                              value={spamFilterLevel}
                              onChange={(e) => setSpamFilterLevel(e.target.value)}
                              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="low">Low - Only obvious spam</option>
                              <option value="medium">Medium - Balanced (recommended)</option>
                              <option value="high">High - Aggressive filtering</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Action for Spam</label>
                            <select
                              value={spamAction}
                              onChange={(e) => setSpamAction(e.target.value)}
                              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="folder">Move to Spam folder</option>
                              <option value="tag">Tag as spam but deliver</option>
                              <option value="delete">Delete immediately</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Signature Settings */}
                  {activeSettingsTab === 4 && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email Signature</label>
                        <textarea
                          value={signatureText}
                          onChange={(e) => setSignatureText(e.target.value)}
                          placeholder="Best regards,&#10;John Doe&#10;Exoin Africa&#10;+254 700 000 000"
                          rows={6}
                          className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          This signature will be appended to outgoing emails
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Connection Settings */}
                  {activeSettingsTab === 5 && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="font-medium text-blue-900 mb-2">Email Client Configuration</h4>
                        <p className="text-sm text-blue-700">Use these settings to configure your email client (Outlook, Apple Mail, Thunderbird, etc.)</p>
                      </div>
                      
                      {/* Incoming Mail */}
                      <div className="p-4 border border-gray-200 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                          <InboxIcon className="w-5 h-5 text-green-600" />
                          Incoming Mail (IMAP)
                        </h4>
                        <dl className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <dt className="text-gray-500">Server:</dt>
                            <dd className="font-mono text-gray-900">mail.{domain}</dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-gray-500">Port:</dt>
                            <dd className="font-mono text-gray-900">993 (SSL/TLS)</dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-gray-500">Username:</dt>
                            <dd className="font-mono text-gray-900">{emailAddress}</dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-gray-500">Security:</dt>
                            <dd className="text-gray-900">SSL/TLS</dd>
                          </div>
                        </dl>
                      </div>
                      
                      {/* Outgoing Mail */}
                      <div className="p-4 border border-gray-200 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                          <PaperAirplaneIcon className="w-5 h-5 text-blue-600" />
                          Outgoing Mail (SMTP)
                        </h4>
                        <dl className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <dt className="text-gray-500">Server:</dt>
                            <dd className="font-mono text-gray-900">mail.{domain}</dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-gray-500">Port:</dt>
                            <dd className="font-mono text-gray-900">587 (STARTTLS) or 465 (SSL)</dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-gray-500">Username:</dt>
                            <dd className="font-mono text-gray-900">{emailAddress}</dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-gray-500">Authentication:</dt>
                            <dd className="text-gray-900">Password</dd>
                          </div>
                        </dl>
                      </div>
                      
                      {/* Webmail */}
                      <div className="p-4 border border-gray-200 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                          <GlobeAltIcon className="w-5 h-5 text-purple-600" />
                          Webmail Access
                        </h4>
                        <p className="text-sm text-gray-600 mb-2">Access your email from any browser:</p>
                        <a 
                          href={`https://mail.${domain}/webmail`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline font-mono text-sm"
                        >
                          https://mail.{domain}/webmail
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-6 border-t border-gray-200 flex justify-between">
                  <button
                    onClick={onClose}
                    className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                  >
                    Close
                  </button>
                  {activeSettingsTab !== 5 && activeSettingsTab !== 3 && (
                    <button
                      onClick={handleSaveSettings}
                      disabled={loading}
                      className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                    >
                      {loading && <ArrowPathIcon className="w-4 h-4 animate-spin" />}
                      Save Changes
                    </button>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

// Gmail Deliverability Panel - Check if emails will be accepted by Gmail
const GmailDeliverabilityPanel = ({ domainId }) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const checkDeliverability = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await emailHostingApi.checkGmailDeliverability(domainId);
      setResult(res.data);
    } catch (err) {
      console.error('Failed to check deliverability:', err);
      setError(err.response?.data?.error || 'Failed to check deliverability');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    if (score >= 50) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreBg = (score) => {
    if (score >= 90) return 'bg-green-50 border-green-200';
    if (score >= 70) return 'bg-yellow-50 border-yellow-200';
    if (score >= 50) return 'bg-orange-50 border-orange-200';
    return 'bg-red-50 border-red-200';
  };

  const getScoreLabel = (status) => {
    switch (status) {
      case 'excellent': return 'Excellent';
      case 'good': return 'Good';
      case 'fair': return 'Needs Improvement';
      case 'poor': return 'Poor';
      default: return 'Unknown';
    }
  };

  const CheckItem = ({ check }) => (
    <div className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-0">
      <div className="flex-shrink-0 mt-0.5">
        {check.passed ? (
          <CheckCircleIcon className="w-5 h-5 text-green-600" />
        ) : (
          <XCircleIcon className="w-5 h-5 text-red-500" />
        )}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <p className={`text-sm font-medium ${check.passed ? 'text-gray-900' : 'text-red-800'}`}>
            {check.name}
          </p>
          {check.critical && (
            <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded">Critical</span>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-0.5">{check.message}</p>
        {!check.passed && check.howToFix && (
          <div className="mt-2 p-2 bg-amber-50 rounded-lg">
            <p className="text-xs text-amber-800">
              <span className="font-medium">How to fix: </span>
              {check.howToFix}
            </p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <ShieldCheckIcon className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Gmail Deliverability</h3>
            <p className="text-sm text-gray-500">Check if your emails will be accepted by Gmail</p>
          </div>
        </div>
        <button
          onClick={checkDeliverability}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {loading ? (
            <>
              <ArrowPathIcon className="w-4 h-4 animate-spin" />
              Checking...
            </>
          ) : (
            <>
              <ShieldCheckIcon className="w-4 h-4" />
              Run Check
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {result && (
        <div className="space-y-4">
          {/* Score Display */}
          <div className={`p-4 rounded-xl border ${getScoreBg(result.score)}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Deliverability Score</p>
                <p className={`text-4xl font-bold ${getScoreColor(result.score)}`}>{result.score}/100</p>
              </div>
              <div className="text-right">
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                  result.status === 'excellent' ? 'bg-green-100 text-green-800' :
                  result.status === 'good' ? 'bg-yellow-100 text-yellow-800' :
                  result.status === 'fair' ? 'bg-orange-100 text-orange-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {getScoreLabel(result.status)}
                </span>
                <p className="text-xs text-gray-500 mt-2">
                  {result.checks?.filter(c => c.passed).length || 0}/{result.checks?.length || 0} checks passed
                </p>
              </div>
            </div>
          </div>

          {/* Check Details */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h4 className="font-medium text-gray-900 mb-3">Security Checks</h4>
            <div className="bg-white rounded-lg divide-y divide-gray-100">
              {result.checks?.map((check, idx) => (
                <CheckItem key={idx} check={check} />
              ))}
            </div>
          </div>

          {/* Recommendations */}
          {result.recommendations && result.recommendations.length > 0 && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <h4 className="font-medium text-amber-800 mb-2 flex items-center gap-2">
                <ExclamationTriangleIcon className="w-5 h-5" />
                Recommendations
              </h4>
              <ul className="space-y-2">
                {result.recommendations.map((rec, idx) => (
                  <li key={idx} className="text-sm text-amber-700 flex items-start gap-2">
                    <span className="text-amber-500 mt-0.5">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.status === 'excellent' && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
              <div className="flex items-center gap-2 text-green-800">
                <CheckCircleIcon className="w-5 h-5" />
                <p className="font-medium">Excellent! Your domain is well-configured for Gmail delivery.</p>
              </div>
              <p className="text-sm text-green-700 mt-1">
                Emails from this domain should be accepted by Gmail without issues.
              </p>
            </div>
          )}
        </div>
      )}

      {!result && !loading && (
        <div className="text-center py-8 text-gray-500">
          <ShieldCheckIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-sm">Click "Run Check" to verify your domain's email deliverability to Gmail</p>
          <p className="text-xs mt-1">This checks SPF, DKIM, DMARC, PTR records, and more</p>
        </div>
      )}
    </div>
  );
};

// DNS Records Panel - Enhanced with clear instructions
const DNSRecordsPanel = ({ domainId, domainName, onVerify }) => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [verificationResults, setVerificationResults] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [expandedRecord, setExpandedRecord] = useState(null);

  useEffect(() => {
    loadRecords();
  }, [domainId]);

  const loadRecords = async () => {
    try {
      const res = await emailHostingApi.getDomainDNS(domainId);
      setRecords(res.data.records);
    } catch (error) {
      console.error('Failed to load DNS records:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setVerifying(true);
    try {
      const res = await emailHostingApi.verifyDomain(domainId);
      setVerificationResults(res.data.results);
      await loadRecords();
      if (onVerify) onVerify();
    } catch (error) {
      console.error('Failed to verify DNS:', error);
    } finally {
      setVerifying(false);
    }
  };

  const handleRegenerate = async () => {
    if (!confirm('This will regenerate all DNS records including new DKIM keys. Continue?')) {
      return;
    }
    setRegenerating(true);
    try {
      const res = await emailHostingApi.regenerateDNS(domainId);
      setRecords(res.data.records);
      setVerificationResults(null);
    } catch (error) {
      console.error('Failed to regenerate DNS records:', error);
    } finally {
      setRegenerating(false);
    }
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getRecordDescription = (recordType, name) => {
    if (recordType === 'MX') return 'Routes incoming email to your mail server';
    if (recordType === 'TXT' && name === '@' && !name.includes('verify')) return 'SPF - Authorizes your server to send email';
    if (recordType === 'TXT' && name.includes('_domainkey')) return 'DKIM - Digital signature for email authentication';
    if (recordType === 'TXT' && name === '_dmarc') return 'DMARC - Policy for handling failed authentication';
    if (recordType === 'TXT' && name === '@') return 'Domain verification code';
    if (recordType === 'A' && name === 'mail') return 'Points mail subdomain to your server IP';
    return '';
  };

  const getRecordPurpose = (recordType, name, value) => {
    if (recordType === 'MX') return { icon: '📬', label: 'Receive Email', color: 'purple' };
    if (value?.includes('spf1')) return { icon: '✉️', label: 'SPF Record', color: 'blue' };
    if (name?.includes('_domainkey')) return { icon: '🔐', label: 'DKIM Signing', color: 'green' };
    if (name === '_dmarc') return { icon: '🛡️', label: 'DMARC Policy', color: 'orange' };
    if (value?.includes('verify')) return { icon: '✓', label: 'Verification', color: 'gray' };
    if (recordType === 'A') return { icon: '🌐', label: 'Server IP', color: 'cyan' };
    return { icon: '📄', label: 'DNS Record', color: 'gray' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <ArrowPathIcon className="w-8 h-8 text-gray-400 animate-spin" />
      </div>
    );
  }

  const requiredRecords = records.filter(r => r.isRequired);
  const optionalRecords = records.filter(r => !r.isRequired);
  const verifiedRequiredCount = requiredRecords.filter(r => r.isVerified).length;
  const verifiedOptionalCount = optionalRecords.filter(r => r.isVerified).length;
  const totalRequired = requiredRecords.length;
  const totalOptional = optionalRecords.length;

  return (
    <div className="space-y-6">
      {/* Header with Progress */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-900">🔧 DNS Configuration Required</h3>
          <p className="text-gray-600 mt-1">
            Add these records to your DNS provider to enable email for <strong>{domainName}</strong>
          </p>
        </div>
        <div className="flex gap-2">
          {records.length === 0 && (
            <button
              onClick={handleRegenerate}
              disabled={regenerating}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 disabled:opacity-50 transition-all shadow-sm hover:shadow"
              title="Generate DNS records for this domain"
            >
              {regenerating ? (
                <ArrowPathIcon className="w-5 h-5 animate-spin" />
              ) : (
                <ArrowPathIcon className="w-5 h-5" />
              )}
              Generate DNS
            </button>
          )}
          <button
            onClick={handleVerify}
            disabled={verifying || records.length === 0}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-all shadow-sm hover:shadow"
          >
            {verifying ? (
              <ArrowPathIcon className="w-5 h-5 animate-spin" />
            ) : (
              <ShieldCheckIcon className="w-5 h-5" />
            )}
            Verify All Records
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-gray-100 rounded-full h-3 overflow-hidden">
        <div 
          className={`h-full transition-all duration-500 ${verifiedRequiredCount === totalRequired ? 'bg-green-500' : 'bg-blue-500'}`}
          style={{ width: `${(verifiedRequiredCount / Math.max(totalRequired, 1)) * 100}%` }}
        />
      </div>
      <div className="flex justify-between text-sm text-gray-600 -mt-4">
        <span>
          <strong>{verifiedRequiredCount}</strong> of <strong>{totalRequired}</strong> required records verified
          {verifiedRequiredCount === totalRequired && <span className="text-green-600 font-medium ml-2">✓ All set!</span>}
        </span>
        {totalOptional > 0 && (
          <span className="text-gray-500">
            + {verifiedOptionalCount}/{totalOptional} optional
          </span>
        )}
      </div>

      {/* Verification Results Alert */}
      {verificationResults && (
        <div className={`p-4 rounded-xl ${verificationResults.every(r => r.verified) ? 'bg-green-50 border-2 border-green-200' : 'bg-amber-50 border-2 border-amber-200'}`}>
          <div className="flex items-center gap-3">
            {verificationResults.every(r => r.verified) ? (
              <>
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircleIcon className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <span className="font-semibold text-green-800 text-lg">All DNS records verified!</span>
                  <p className="text-green-700 text-sm">Your email domain is fully configured and ready to use.</p>
                </div>
              </>
            ) : (
              <>
                <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                  <ExclamationTriangleIcon className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <span className="font-semibold text-amber-800 text-lg">Some records need to be added</span>
                  <p className="text-amber-700 text-sm">Please add the missing DNS records below, then verify again.</p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Important Notice */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-5 text-white">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <ServerIcon className="w-7 h-7" />
          </div>
          <div>
            <h4 className="font-bold text-lg mb-1">⚠️ Important: Add A Record for Mail Server</h4>
            <p className="text-blue-100 text-sm">
              You need to add an <strong>A record</strong> for <code className="bg-white/20 px-1.5 py-0.5 rounded">mail.{domainName}</code> pointing to your mail server's IP address. 
              Check your email hosting provider's control panel for the correct IP.
            </p>
          </div>
        </div>
      </div>

      {/* Required DNS Records */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-2">
          <span className="text-red-500">*</span> Required Records ({requiredRecords.length})
        </h4>
        {requiredRecords.map((record, index) => {
          const purpose = getRecordPurpose(record.recordType, record.name, record.value);
          const description = record.description || getRecordDescription(record.recordType, record.name);
          const isExpanded = expandedRecord === record.id;
          
          return (
            <div 
              key={record.id} 
              className={`bg-white border-2 rounded-xl overflow-hidden transition-all ${
                record.isVerified ? 'border-green-200 bg-green-50/30' : 'border-gray-200 hover:border-blue-300'
              }`}
            >
              {/* Record Header */}
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{purpose.icon}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <DNSTypeBadge type={record.recordType} />
                        <span className="font-semibold text-gray-900">{purpose.label}</span>
                        {record.isVerified ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                            <CheckCircleIcon className="w-3.5 h-3.5" /> Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                            <ExclamationTriangleIcon className="w-3.5 h-3.5" /> Pending
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-0.5">{description}</p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setExpandedRecord(isExpanded ? null : record.id)}
                  className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg font-medium text-sm transition-colors"
                >
                  {isExpanded ? 'Hide Details' : 'Show Details'}
                </button>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="border-t border-gray-200 bg-gray-50 p-4 space-y-4">
                  {/* Name/Host Field */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                      Name / Host
                    </label>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 px-4 py-3 bg-white border border-gray-300 rounded-lg font-mono text-sm">
                        {record.name === '@' ? `@ (or ${domainName})` : `${record.name}.${domainName}`}
                      </code>
                      <button
                        onClick={() => copyToClipboard(record.name === '@' ? '@' : record.name, `name-${record.id}`)}
                        className="p-3 bg-white border border-gray-300 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Copy name"
                      >
                        {copiedId === `name-${record.id}` ? (
                          <CheckCircleIcon className="w-5 h-5 text-green-500" />
                        ) : (
                          <ClipboardDocumentIcon className="w-5 h-5 text-gray-500" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Value Field */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                      Value / Target {record.priority && <span className="text-gray-400">(Priority: {record.priority})</span>}
                    </label>
                    <div className="flex items-start gap-2">
                      <code className="flex-1 px-4 py-3 bg-white border border-gray-300 rounded-lg font-mono text-sm break-all whitespace-pre-wrap max-h-32 overflow-y-auto">
                        {record.value}
                      </code>
                      <button
                        onClick={() => copyToClipboard(record.value, `value-${record.id}`)}
                        className="p-3 bg-white border border-gray-300 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                        title="Copy value"
                      >
                        {copiedId === `value-${record.id}` ? (
                          <CheckCircleIcon className="w-5 h-5 text-green-500" />
                        ) : (
                          <ClipboardDocumentIcon className="w-5 h-5 text-gray-500" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Quick Copy All */}
                  <button
                    onClick={() => {
                      const text = `Type: ${record.recordType}\nName: ${record.name}\nValue: ${record.value}${record.priority ? `\nPriority: ${record.priority}` : ''}`;
                      copyToClipboard(text, `all-${record.id}`);
                    }}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2"
                  >
                    {copiedId === `all-${record.id}` ? (
                      <>
                        <CheckCircleIcon className="w-4 h-4" /> Copied!
                      </>
                    ) : (
                      <>
                        <ClipboardDocumentIcon className="w-4 h-4" /> Copy All Details
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Optional DNS Records */}
      {optionalRecords.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            Optional Records ({optionalRecords.length}) - For email client auto-configuration
          </h4>
          {optionalRecords.map((record, index) => {
            const purpose = getRecordPurpose(record.recordType, record.name, record.value);
            const description = record.description || getRecordDescription(record.recordType, record.name);
            const isExpanded = expandedRecord === record.id;
            
            return (
              <div 
                key={record.id} 
                className={`bg-white border rounded-xl overflow-hidden transition-all ${
                  record.isVerified ? 'border-green-200 bg-green-50/30' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{purpose.icon}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <DNSTypeBadge type={record.recordType} />
                        <span className="font-medium text-gray-700 text-sm">{purpose.label}</span>
                        {record.isVerified && (
                          <CheckCircleIcon className="w-4 h-4 text-green-500" />
                        )}
                      </div>
                      <p className="text-xs text-gray-500">{description}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setExpandedRecord(isExpanded ? null : record.id)}
                    className="px-3 py-1.5 text-blue-600 hover:bg-blue-50 rounded-lg font-medium text-xs transition-colors"
                  >
                    {isExpanded ? 'Hide' : 'Show'}
                  </button>
                </div>
                {isExpanded && (
                  <div className="border-t border-gray-100 bg-gray-50 p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <code className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded text-xs font-mono">
                        {record.name === '@' ? '@' : `${record.name}.${domainName}`}
                      </code>
                      <button onClick={() => copyToClipboard(record.name, `name-${record.id}`)} className="p-2 hover:bg-gray-200 rounded">
                        <ClipboardDocumentIcon className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded text-xs font-mono break-all">
                        {record.value}
                      </code>
                      <button onClick={() => copyToClipboard(record.value, `value-${record.id}`)} className="p-2 hover:bg-gray-200 rounded">
                        <ClipboardDocumentIcon className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Step by Step Instructions */}
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-xl p-6">
        <h4 className="font-bold text-gray-900 text-lg mb-4 flex items-center gap-2">
          📋 How to Add DNS Records
        </h4>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">1</div>
              <div>
                <p className="font-medium text-gray-900">Login to Your DNS Provider</p>
                <p className="text-sm text-gray-600">Go to where you registered {domainName} (e.g., GoDaddy, Namecheap, Cloudflare, etc.)</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">2</div>
              <div>
                <p className="font-medium text-gray-900">Navigate to DNS Settings</p>
                <p className="text-sm text-gray-600">Find "DNS Management", "DNS Records", or "Zone Editor"</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">3</div>
              <div>
                <p className="font-medium text-gray-900">Add Each Record</p>
                <p className="text-sm text-gray-600">Click "Add Record", select the type, paste the name and value</p>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">4</div>
              <div>
                <p className="font-medium text-gray-900">Wait for Propagation</p>
                <p className="text-sm text-gray-600">DNS changes can take 5 minutes to 48 hours to propagate globally</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">5</div>
              <div>
                <p className="font-medium text-gray-900">Verify Your Records</p>
                <p className="text-sm text-gray-600">Click "Verify All Records" above to check if everything is configured correctly</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">✓</div>
              <div>
                <p className="font-medium text-gray-900">Start Using Email!</p>
                <p className="text-sm text-gray-600">Once verified, you can send and receive emails from your domain</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Common DNS Providers Quick Links */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <h5 className="font-medium text-gray-700 mb-3">Quick Links to Popular DNS Providers:</h5>
        <div className="flex flex-wrap gap-2">
          {[
            { name: 'Cloudflare', url: 'https://dash.cloudflare.com' },
            { name: 'GoDaddy', url: 'https://dcc.godaddy.com/manage-dns' },
            { name: 'Namecheap', url: 'https://ap.www.namecheap.com' },
            { name: 'Google Domains', url: 'https://domains.google.com' },
            { name: 'AWS Route 53', url: 'https://console.aws.amazon.com/route53' },
          ].map(provider => (
            <a
              key={provider.name}
              href={provider.url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
            >
              {provider.name} ↗
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};

// Mailbox Detail Modal - Comprehensive drill-down for a single mailbox
const MailboxDetailModal = ({ isOpen, onClose, mailbox, domain, onOpenWebmail, onOpenSettings }) => {
  const [activeSection, setActiveSection] = useState('overview');
  
  if (!mailbox) return null;
  
  const used = mailbox.usedMb || 0;
  const quota = mailbox.quotaMb || 5120;
  const percentage = (used / quota) * 100;

  const formatStorage = (mb) => {
    if (mb >= 1024) return `${(mb / 1024).toFixed(2)} GB`;
    if (mb >= 1) return `${mb.toFixed(0)} MB`;
    return `${(mb * 1024).toFixed(0)} KB`;
  };

  // Simulated folder data
  const folders = [
    { name: 'Inbox', count: Math.floor(used * 50), size: used * 0.35, unread: Math.floor(used * 5) },
    { name: 'Sent', count: Math.floor(used * 30), size: used * 0.25, unread: 0 },
    { name: 'Drafts', count: Math.floor(used * 5), size: used * 0.05, unread: 0 },
    { name: 'Archive', count: Math.floor(used * 25), size: used * 0.20, unread: 0 },
    { name: 'Spam', count: Math.floor(used * 15), size: used * 0.08, unread: Math.floor(used * 15) },
    { name: 'Trash', count: Math.floor(used * 10), size: used * 0.07, unread: 0 },
  ];

  // Simulated activity
  const recentActivity = [
    { type: 'received', subject: 'Weekly Report Summary', from: 'reports@company.com', time: '10 minutes ago' },
    { type: 'sent', subject: 'Re: Project Update', to: 'team@partner.com', time: '1 hour ago' },
    { type: 'received', subject: 'Meeting Invitation', from: 'calendar@office.com', time: '2 hours ago' },
    { type: 'sent', subject: 'Document Review', to: 'legal@firm.com', time: '3 hours ago' },
    { type: 'received', subject: 'Invoice #12345', from: 'billing@vendor.com', time: '5 hours ago' },
  ];

  // Simulated stats
  const emailStats = {
    receivedToday: Math.floor(used * 2),
    sentToday: Math.floor(used * 0.8),
    receivedThisWeek: Math.floor(used * 12),
    sentThisWeek: Math.floor(used * 5),
    avgEmailSize: 0.15, // MB
    largestEmail: used * 0.08,
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white shadow-xl transition-all max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-2xl font-bold">
                        {mailbox.localPart.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <Dialog.Title className="text-2xl font-bold">
                          {mailbox.localPart}@{domain}
                        </Dialog.Title>
                        {mailbox.displayName && <p className="text-blue-200">{mailbox.displayName}</p>}
                        <div className="flex items-center gap-2 mt-1">
                          {mailbox.isActive ? (
                            <span className="bg-green-500/20 text-green-100 px-2 py-0.5 rounded-full text-xs">Active</span>
                          ) : (
                            <span className="bg-red-500/20 text-red-100 px-2 py-0.5 rounded-full text-xs">Inactive</span>
                          )}
                          {mailbox.isAdmin && (
                            <span className="bg-purple-500/20 text-purple-100 px-2 py-0.5 rounded-full text-xs">Admin</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={onOpenWebmail} className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors" title="Open Webmail">
                        <InboxIcon className="w-5 h-5" />
                      </button>
                      <button onClick={onOpenSettings} className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors" title="Settings">
                        <Cog6ToothIcon className="w-5 h-5" />
                      </button>
                      <button onClick={onClose} className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors">
                        <XCircleIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Storage bar in header */}
                  <div className="mt-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Storage: {formatStorage(used)} of {formatStorage(quota)}</span>
                      <span>{percentage.toFixed(1)}% used</span>
                    </div>
                    <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                      <div className="h-full bg-white transition-all" style={{ width: `${Math.min(percentage, 100)}%` }} />
                    </div>
                  </div>
                </div>

                {/* Section Tabs */}
                <div className="border-b border-gray-200 px-6 flex-shrink-0">
                  <div className="flex gap-1 -mb-px">
                    {[
                      { id: 'overview', label: 'Overview', icon: ChartBarIcon },
                      { id: 'folders', label: 'Folders', icon: FolderIcon },
                      { id: 'activity', label: 'Activity', icon: ClockIcon },
                      { id: 'storage', label: 'Storage', icon: ServerIcon },
                    ].map((section) => {
                      const Icon = section.icon;
                      return (
                        <button
                          key={section.id}
                          onClick={() => setActiveSection(section.id)}
                          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                            activeSection === section.id
                              ? 'border-blue-600 text-blue-600'
                              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          {section.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1">
                  {activeSection === 'overview' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Quick Stats */}
                      <div className="space-y-4">
                        <h4 className="font-semibold text-gray-900">Email Statistics</h4>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-blue-50 rounded-xl p-4">
                            <p className="text-2xl font-bold text-blue-700">{emailStats.receivedToday}</p>
                            <p className="text-xs text-blue-600">Received Today</p>
                          </div>
                          <div className="bg-green-50 rounded-xl p-4">
                            <p className="text-2xl font-bold text-green-700">{emailStats.sentToday}</p>
                            <p className="text-xs text-green-600">Sent Today</p>
                          </div>
                          <div className="bg-purple-50 rounded-xl p-4">
                            <p className="text-2xl font-bold text-purple-700">{emailStats.receivedThisWeek}</p>
                            <p className="text-xs text-purple-600">Received This Week</p>
                          </div>
                          <div className="bg-orange-50 rounded-xl p-4">
                            <p className="text-2xl font-bold text-orange-700">{emailStats.sentThisWeek}</p>
                            <p className="text-xs text-orange-600">Sent This Week</p>
                          </div>
                        </div>
                      </div>

                      {/* Recent Activity */}
                      <div className="space-y-4">
                        <h4 className="font-semibold text-gray-900">Recent Activity</h4>
                        <div className="space-y-2">
                          {recentActivity.slice(0, 4).map((activity, idx) => (
                            <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                              <div className={`p-2 rounded-lg ${activity.type === 'received' ? 'bg-blue-100' : 'bg-green-100'}`}>
                                {activity.type === 'received' ? (
                                  <InboxIcon className="w-4 h-4 text-blue-600" />
                                ) : (
                                  <PaperAirplaneIcon className="w-4 h-4 text-green-600" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">{activity.subject}</p>
                                <p className="text-xs text-gray-500">
                                  {activity.type === 'received' ? `From: ${activity.from}` : `To: ${activity.to}`}
                                </p>
                              </div>
                              <span className="text-xs text-gray-400 flex-shrink-0">{activity.time}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {activeSection === 'folders' && (
                    <div className="space-y-4">
                      <h4 className="font-semibold text-gray-900">Folder Breakdown</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {folders.map((folder, idx) => (
                          <div key={idx} className="p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-blue-300 transition-colors cursor-pointer">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <FolderIcon className="w-5 h-5 text-yellow-600" />
                                <span className="font-medium text-gray-900">{folder.name}</span>
                                {folder.unread > 0 && (
                                  <span className="bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded-full">{folder.unread}</span>
                                )}
                              </div>
                              <ChevronRightIcon className="w-4 h-4 text-gray-400" />
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">{folder.count.toLocaleString()} emails</span>
                              <span className="text-gray-500">{formatStorage(folder.size)}</span>
                            </div>
                            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden mt-2">
                              <div 
                                className="h-full bg-blue-500 transition-all"
                                style={{ width: `${(folder.size / used) * 100}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeSection === 'activity' && (
                    <div className="space-y-4">
                      <h4 className="font-semibold text-gray-900">Full Activity Log</h4>
                      <div className="space-y-2">
                        {recentActivity.map((activity, idx) => (
                          <div key={idx} className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
                            <div className={`p-2 rounded-lg ${activity.type === 'received' ? 'bg-blue-100' : 'bg-green-100'}`}>
                              {activity.type === 'received' ? (
                                <InboxIcon className="w-5 h-5 text-blue-600" />
                              ) : (
                                <PaperAirplaneIcon className="w-5 h-5 text-green-600" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900">{activity.subject}</p>
                              <p className="text-sm text-gray-500">
                                {activity.type === 'received' ? `From: ${activity.from}` : `To: ${activity.to}`}
                              </p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <span className={`text-xs px-2 py-1 rounded-full ${activity.type === 'received' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                                {activity.type === 'received' ? 'Received' : 'Sent'}
                              </span>
                              <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeSection === 'storage' && (
                    <div className="space-y-6">
                      {/* Storage Overview */}
                      <div className="p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl border border-orange-200">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="text-sm text-gray-600">Total Storage Used</p>
                            <p className="text-3xl font-bold text-gray-900">{formatStorage(used)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-600">Quota</p>
                            <p className="text-xl font-semibold text-gray-700">{formatStorage(quota)}</p>
                          </div>
                        </div>
                        <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all ${
                              percentage > 90 ? 'bg-red-500' :
                              percentage > 75 ? 'bg-orange-500' :
                              percentage > 50 ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                          />
                        </div>
                        <p className="text-sm text-gray-600 mt-2">
                          {formatStorage(quota - used)} available ({(100 - percentage).toFixed(1)}%)
                        </p>
                      </div>

                      {/* Storage by Folder */}
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">Storage by Folder</h4>
                        <div className="space-y-2">
                          {folders.map((folder, idx) => (
                            <div key={idx} className="flex items-center gap-3">
                              <div className="w-24 text-sm text-gray-600">{folder.name}</div>
                              <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-blue-500 rounded-full flex items-center justify-end pr-2 text-xs text-white font-medium"
                                  style={{ width: `${Math.max((folder.size / used) * 100, 10)}%` }}
                                >
                                  {((folder.size / used) * 100).toFixed(0)}%
                                </div>
                              </div>
                              <div className="w-20 text-sm text-gray-600 text-right">{formatStorage(folder.size)}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Storage Tips */}
                      <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                        <h5 className="font-medium text-blue-900 mb-2">💡 Storage Optimization Tips</h5>
                        <ul className="text-sm text-blue-800 space-y-1">
                          <li>• Empty trash to recover {formatStorage(folders.find(f => f.name === 'Trash')?.size || 0)}</li>
                          <li>• Clear spam folder to free up {formatStorage(folders.find(f => f.name === 'Spam')?.size || 0)}</li>
                          <li>• Average email size: {formatStorage(emailStats.avgEmailSize)}</li>
                          <li>• Largest email: {formatStorage(emailStats.largestEmail)}</li>
                        </ul>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center flex-shrink-0">
                  <p className="text-xs text-gray-500">
                    Created: {new Date(mailbox.createdAt || Date.now()).toLocaleDateString()}
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={onOpenWebmail}
                      className="px-4 py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition-colors flex items-center gap-2"
                    >
                      <InboxIcon className="w-4 h-4" />
                      Open Webmail
                    </button>
                    <button
                      onClick={onClose}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

// Main Email Hosting Page
export default function EmailHostingPage() {
  const navigate = useNavigate();
  const [domains, setDomains] = useState([]);
  const [selectedDomain, setSelectedDomain] = useState(null);
  const [mailboxes, setMailboxes] = useState([]);
  const [aliases, setAliases] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);

  // Modals
  const [showAddDomain, setShowAddDomain] = useState(false);
  const [showAddMailbox, setShowAddMailbox] = useState(false);
  const [showAddAlias, setShowAddAlias] = useState(false);
  const [showMailboxSettings, setShowMailboxSettings] = useState(false);
  const [showMailboxDetail, setShowMailboxDetail] = useState(false);
  const [showStorageDrilldown, setShowStorageDrilldown] = useState(false);
  const [selectedMailbox, setSelectedMailbox] = useState(null);

  const handleOpenMailboxSettings = (mailbox) => {
    setSelectedMailbox(mailbox);
    setShowMailboxSettings(true);
  };

  const handleUpdateMailbox = async (mailboxId, data) => {
    await emailHostingApi.updateMailbox(mailboxId, data);
    await loadDomainData(selectedDomain.id);
  };

  const handleUpdateMailboxPassword = async (mailboxId, password) => {
    await emailHostingApi.updateMailboxPassword(mailboxId, password);
  };

  useEffect(() => {
    loadDomains();
  }, []);

  useEffect(() => {
    if (selectedDomain) {
      loadDomainData(selectedDomain.id);
    }
  }, [selectedDomain?.id]);

  const loadDomains = async () => {
    try {
      const res = await emailHostingApi.getDomains();
      setDomains(res.data.domains);
      if (res.data.domains.length > 0 && !selectedDomain) {
        setSelectedDomain(res.data.domains[0]);
      }
    } catch (error) {
      console.error('Failed to load domains:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDomainData = async (domainId) => {
    try {
      const [mailboxRes, aliasRes, statsRes] = await Promise.all([
        emailHostingApi.getMailboxes(domainId),
        emailHostingApi.getAliases(domainId),
        emailHostingApi.getDomainStats(domainId).catch(() => ({ data: { stats: null } })),
      ]);
      setMailboxes(mailboxRes.data.mailboxes);
      setAliases(aliasRes.data.aliases);
      setStats(statsRes.data.stats);
    } catch (error) {
      console.error('Failed to load domain data:', error);
    }
  };

  const handleAddDomain = async (data) => {
    await emailHostingApi.createDomain(data);
    await loadDomains();
  };

  const handleAddMailbox = async (data) => {
    await emailHostingApi.createMailbox(selectedDomain.id, data);
    await loadDomainData(selectedDomain.id);
  };

  const handleAddAlias = async (data) => {
    await emailHostingApi.createAlias(selectedDomain.id, data);
    await loadDomainData(selectedDomain.id);
  };

  const handleDeleteMailbox = async (mailboxId) => {
    if (!confirm('Are you sure you want to delete this mailbox? This cannot be undone.')) return;
    await emailHostingApi.deleteMailbox(mailboxId);
    await loadDomainData(selectedDomain.id);
  };

  const handleDeleteAlias = async (aliasId) => {
    if (!confirm('Are you sure you want to delete this alias?')) return;
    await emailHostingApi.deleteAlias(aliasId);
    await loadDomainData(selectedDomain.id);
  };

  const handleDeleteDomain = async (domainId) => {
    if (!confirm('Are you sure you want to delete this domain and ALL its mailboxes and aliases? This cannot be undone.')) return;
    await emailHostingApi.deleteDomain(domainId);
    setSelectedDomain(null);
    await loadDomains();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <ArrowPathIcon className="w-10 h-10 text-blue-600 animate-spin" />
      </div>
    );
  }

  // Empty state - no domains
  if (domains.length === 0) {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <div className="text-center bg-white rounded-2xl border border-gray-200 p-12">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <EnvelopeIcon className="w-10 h-10 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Email Hosting</h2>
          <p className="text-gray-500 mb-8 max-w-md mx-auto">
            Host professional email addresses on your own domain. Create mailboxes, aliases, 
            and manage your email infrastructure with ease.
          </p>
          <button
            onClick={() => setShowAddDomain(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            <PlusIcon className="w-5 h-5" />
            Add Your First Domain
          </button>
        </div>

        <AddDomainModal
          isOpen={showAddDomain}
          onClose={() => setShowAddDomain(false)}
          onSubmit={handleAddDomain}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Email Hosting</h1>
          <p className="text-gray-500 mt-0.5">Manage your email domains, mailboxes, and aliases</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/mail')}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-medium hover:from-orange-600 hover:to-orange-700 transition-all shadow-sm hover:shadow"
          >
            <InboxIcon className="w-5 h-5" />
            Open Webmail
          </button>
          <button
            onClick={() => setShowAddDomain(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            <PlusIcon className="w-5 h-5" />
            Add Domain
          </button>
        </div>
      </div>

      {/* Domain Selector */}
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
        {domains.map((domain) => (
          <button
            key={domain.id}
            onClick={() => setSelectedDomain(domain)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all whitespace-nowrap flex-shrink-0 ${
              selectedDomain?.id === domain.id
                ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-200'
                : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
            }`}
          >
            <div className={`p-2 rounded-lg ${selectedDomain?.id === domain.id ? 'bg-blue-100' : 'bg-gray-100'}`}>
              <GlobeAltIcon className={`w-5 h-5 ${selectedDomain?.id === domain.id ? 'text-blue-600' : 'text-gray-500'}`} />
            </div>
            <div className="text-left">
              <div className="font-medium text-gray-900">{domain.domain}</div>
              <div className="text-xs text-gray-500 flex items-center gap-2">
                <span>{domain._count?.mailboxes || 0} mailboxes</span>
                <StatusBadge verified={domain.isVerified} label={domain.isVerified ? 'Active' : 'Setup Required'} />
              </div>
            </div>
          </button>
        ))}
      </div>

      {selectedDomain && (
        <>
          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatsCard
                icon={InboxIcon}
                label="Mailboxes"
                value={stats.totalMailboxes}
                subValue={`${stats.activeMailboxes} active`}
                color="blue"
              />
              <StatsCard
                icon={DocumentDuplicateIcon}
                label="Aliases"
                value={stats.totalAliases}
                subValue={`${stats.activeAliases} active`}
                color="purple"
              />
              <StatsCard
                icon={PaperAirplaneIcon}
                label="Sent Today"
                value={stats.emailsSentToday}
                color="green"
              />
              <StatsCard
                icon={ServerIcon}
                label="Storage Used"
                value={`${((stats.usedStorageMb || 0) / 1024).toFixed(1)} GB`}
                subValue={`of ${((stats.totalStorageQuotaMb || 0) / 1024).toFixed(0)} GB • Click for details`}
                color="orange"
                onClick={() => setShowStorageDrilldown(true)}
                actionLabel="View Details"
              />
            </div>
          )}

          {/* Tabs */}
          <Tab.Group selectedIndex={activeTab} onChange={setActiveTab}>
            <Tab.List className="flex gap-1 p-1 bg-gray-100 rounded-xl overflow-x-auto">
              {['Mailboxes', 'Aliases', 'Activity', 'DNS Setup', 'Settings'].map((tab, idx) => (
                <Tab
                  key={tab}
                  className={({ selected }) =>
                    `flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                      selected
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                    }`
                  }
                >
                  {tab}
                </Tab>
              ))}
            </Tab.List>

            <Tab.Panels className="mt-4">
              {/* Mailboxes Tab */}
              <Tab.Panel>
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">Email Accounts</h3>
                    <button
                      onClick={() => setShowAddMailbox(true)}
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                    >
                      <PlusIcon className="w-4 h-4" />
                      New Mailbox
                    </button>
                  </div>

                  {mailboxes.length === 0 ? (
                    <div className="p-12 text-center">
                      <EnvelopeIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No mailboxes yet. Create your first email account.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {mailboxes.map((mailbox) => (
                        <div 
                          key={mailbox.id} 
                          className="p-4 hover:bg-gray-50 transition-colors cursor-pointer group"
                          onClick={() => { setSelectedMailbox(mailbox); setShowMailboxDetail(true); }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0 group-hover:scale-105 transition-transform">
                                {mailbox.localPart.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="font-medium text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                                  {mailbox.localPart}@{selectedDomain.domain}
                                </div>
                                <div className="text-sm text-gray-500 flex items-center gap-2 flex-wrap">
                                  {mailbox.displayName && <span className="truncate">{mailbox.displayName}</span>}
                                  {mailbox.isAdmin && (
                                    <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded flex-shrink-0">Admin</span>
                                  )}
                                  {mailbox.linkedUser && (
                                    <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded flex-shrink-0">
                                      Linked to user
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                              <span className={`px-2 py-1 text-xs rounded-full ${mailbox.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                {mailbox.isActive ? 'Active' : 'Inactive'}
                              </span>
                              <button
                                onClick={(e) => { e.stopPropagation(); navigate('/mail'); }}
                                className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors hidden sm:block"
                                title="Open in Webmail"
                              >
                                <InboxIcon className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleOpenMailboxSettings(mailbox); }}
                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Mailbox Settings"
                              >
                                <Cog6ToothIcon className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDeleteMailbox(mailbox.id); }}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete Mailbox"
                              >
                                <TrashIcon className="w-4 h-4" />
                              </button>
                              <ChevronRightIcon className="w-5 h-5 text-gray-300 group-hover:text-blue-500 transition-colors" />
                            </div>
                          </div>
                          {/* Storage Progress Bar */}
                          <div className="mt-3 ml-14">
                            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                              <span>Storage: {((mailbox.usedMb || 0) / 1024).toFixed(2)} GB of {((mailbox.quotaMb || 5120) / 1024).toFixed(0)} GB</span>
                              <span className="flex items-center gap-2">
                                <span>{(((mailbox.usedMb || 0) / (mailbox.quotaMb || 5120)) * 100).toFixed(1)}%</span>
                                <span className="text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">Click for details →</span>
                              </span>
                            </div>
                            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className={`h-full transition-all ${
                                  ((mailbox.usedMb || 0) / (mailbox.quotaMb || 5120)) > 0.9 ? 'bg-red-500' :
                                  ((mailbox.usedMb || 0) / (mailbox.quotaMb || 5120)) > 0.75 ? 'bg-orange-500' :
                                  ((mailbox.usedMb || 0) / (mailbox.quotaMb || 5120)) > 0.5 ? 'bg-yellow-500' :
                                  'bg-green-500'
                                }`}
                                style={{ width: `${Math.min(((mailbox.usedMb || 0) / (mailbox.quotaMb || 5120)) * 100, 100)}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Tab.Panel>

              {/* Aliases Tab */}
              <Tab.Panel>
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <h3 className="font-semibold text-gray-900">Email Aliases</h3>
                    <button
                      onClick={() => setShowAddAlias(true)}
                      className="inline-flex items-center justify-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                    >
                      <PlusIcon className="w-4 h-4" />
                      New Alias
                    </button>
                  </div>

                  {aliases.length === 0 ? (
                    <div className="p-12 text-center">
                      <DocumentDuplicateIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No aliases yet. Create an alias to forward emails.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {aliases.map((alias) => (
                        <div key={alias.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white">
                              <DocumentDuplicateIcon className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">
                                {alias.localPart}@{selectedDomain.domain}
                              </div>
                              <div className="text-sm text-gray-500 flex items-center gap-1">
                                <ChevronRightIcon className="w-4 h-4" />
                                {alias.targetMailbox ? (
                                  <span>{alias.targetMailbox.localPart}@{selectedDomain.domain}</span>
                                ) : (
                                  <span>{alias.externalTarget}</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 text-xs rounded-full ${alias.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                              {alias.isActive ? 'Active' : 'Inactive'}
                            </span>
                            <button
                              onClick={() => handleDeleteAlias(alias.id)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Tab.Panel>

              {/* Activity Log Tab */}
              <Tab.Panel>
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">Email Activity</h3>
                    <div className="flex items-center gap-2">
                      <select className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        <option value="all">All Activity</option>
                        <option value="sent">Sent</option>
                        <option value="received">Received</option>
                        <option value="bounced">Bounced</option>
                        <option value="spam">Spam</option>
                      </select>
                    </div>
                  </div>

                  <div className="p-12 text-center">
                    <ChartBarIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 mb-2">Email activity logs will appear here</p>
                    <p className="text-sm text-gray-400">Once your mail server is connected, you'll see real-time email activity</p>
                  </div>

                  {/* Activity logs will be populated from real data */}
                </div>
              </Tab.Panel>

              {/* DNS Setup Tab */}
              <Tab.Panel>
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <DNSRecordsPanel 
                    domainId={selectedDomain.id} 
                    domainName={selectedDomain.domain}
                    onVerify={() => loadDomains()}
                  />
                </div>
              </Tab.Panel>

              {/* Settings Tab */}
              <Tab.Panel>
                <div className="space-y-6">
                  {/* Domain Info */}
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Domain Information</h3>
                    <dl className="grid grid-cols-2 gap-4">
                      <div>
                        <dt className="text-sm text-gray-500">Domain</dt>
                        <dd className="font-medium text-gray-900">{selectedDomain.domain}</dd>
                      </div>
                      <div>
                        <dt className="text-sm text-gray-500">Status</dt>
                        <dd>
                          <StatusBadge verified={selectedDomain.isVerified} />
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm text-gray-500">Created</dt>
                        <dd className="font-medium text-gray-900">
                          {new Date(selectedDomain.createdAt).toLocaleDateString()}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm text-gray-500">Max Mailboxes</dt>
                        <dd className="font-medium text-gray-900">{selectedDomain.maxMailboxes}</dd>
                      </div>
                    </dl>
                  </div>

                  {/* Verification Status */}
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Verification Status</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="flex items-center gap-3">
                        <StatusBadge verified={selectedDomain.mxVerified} />
                        <span className="text-sm text-gray-700">MX Record</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <StatusBadge verified={selectedDomain.spfVerified} />
                        <span className="text-sm text-gray-700">SPF Record</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <StatusBadge verified={selectedDomain.dkimVerified} />
                        <span className="text-sm text-gray-700">DKIM Record</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <StatusBadge verified={selectedDomain.dmarcVerified} />
                        <span className="text-sm text-gray-700">DMARC Record</span>
                      </div>
                    </div>
                  </div>

                  {/* Gmail Deliverability Check */}
                  <GmailDeliverabilityPanel domainId={selectedDomain.id} />

                  {/* Danger Zone */}
                  <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-red-800 mb-2">Danger Zone</h3>
                    <p className="text-sm text-red-700 mb-4">
                      Deleting this domain will permanently remove all mailboxes, aliases, and email data. This action cannot be undone.
                    </p>
                    <button
                      onClick={() => handleDeleteDomain(selectedDomain.id)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                    >
                      <TrashIcon className="w-4 h-4" />
                      Delete Domain
                    </button>
                  </div>
                </div>
              </Tab.Panel>
            </Tab.Panels>
          </Tab.Group>
        </>
      )}

      {/* Modals */}
      <AddDomainModal
        isOpen={showAddDomain}
        onClose={() => setShowAddDomain(false)}
        onSubmit={handleAddDomain}
      />
      
      {selectedDomain && (
        <>
          <AddMailboxModal
            isOpen={showAddMailbox}
            onClose={() => setShowAddMailbox(false)}
            onSubmit={handleAddMailbox}
            domain={selectedDomain.domain}
          />
          <AddAliasModal
            isOpen={showAddAlias}
            onClose={() => setShowAddAlias(false)}
            onSubmit={handleAddAlias}
            domain={selectedDomain.domain}
            mailboxes={mailboxes}
          />
          <StorageDrilldownModal
            isOpen={showStorageDrilldown}
            onClose={() => setShowStorageDrilldown(false)}
            mailboxes={mailboxes}
            domain={selectedDomain.domain}
            totalUsed={stats?.usedStorageMb || 0}
            totalQuota={stats?.totalStorageQuotaMb || 0}
          />
          {selectedMailbox && (
            <>
              <MailboxSettingsModal
                isOpen={showMailboxSettings}
                onClose={() => {
                  setShowMailboxSettings(false);
                  setSelectedMailbox(null);
                }}
                mailbox={selectedMailbox}
                domain={selectedDomain.domain}
                onUpdate={handleUpdateMailbox}
                onUpdatePassword={handleUpdateMailboxPassword}
              />
              <MailboxDetailModal
                isOpen={showMailboxDetail}
                onClose={() => {
                  setShowMailboxDetail(false);
                  setSelectedMailbox(null);
                }}
                mailbox={selectedMailbox}
                domain={selectedDomain.domain}
                onOpenWebmail={() => navigate('/mail')}
                onOpenSettings={() => {
                  setShowMailboxDetail(false);
                  setShowMailboxSettings(true);
                }}
              />
            </>
          )}
        </>
      )}
    </div>
  );
}
