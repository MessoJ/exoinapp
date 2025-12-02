import React, { useState } from 'react';
import { 
  Inbox, Send, FileText, Trash2, AlertCircle, Archive, Star, 
  Mail, Tag, ChevronDown, ChevronRight, Plus, MoreHorizontal,
  Edit2, Palette, X, Check, FolderPlus, Clock, Calendar
} from 'lucide-react';

// Default folder icons
const FOLDER_ICONS = {
  INBOX: Inbox,
  SENT: Send,
  DRAFTS: FileText,
  TRASH: Trash2,
  SPAM: AlertCircle,
  ARCHIVE: Archive,
  STARRED: Star,
  SNOOZED: Clock,
  SCHEDULED: Calendar,
};

// Predefined label colors
const LABEL_COLORS = [
  { name: 'Red', value: '#ef4444', bg: 'bg-red-100', text: 'text-red-600' },
  { name: 'Orange', value: '#f97316', bg: 'bg-orange-100', text: 'text-orange-600' },
  { name: 'Yellow', value: '#eab308', bg: 'bg-yellow-100', text: 'text-yellow-600' },
  { name: 'Green', value: '#22c55e', bg: 'bg-green-100', text: 'text-green-600' },
  { name: 'Teal', value: '#14b8a6', bg: 'bg-teal-100', text: 'text-teal-600' },
  { name: 'Blue', value: '#3b82f6', bg: 'bg-blue-100', text: 'text-blue-600' },
  { name: 'Indigo', value: '#6366f1', bg: 'bg-indigo-100', text: 'text-indigo-600' },
  { name: 'Purple', value: '#a855f7', bg: 'bg-purple-100', text: 'text-purple-600' },
  { name: 'Pink', value: '#ec4899', bg: 'bg-pink-100', text: 'text-pink-600' },
  { name: 'Gray', value: '#6b7280', bg: 'bg-gray-100', text: 'text-gray-600' },
];

/**
 * Label Badge Component
 */
const LabelBadge = ({ label, size = 'sm', onRemove }) => {
  const colorConfig = LABEL_COLORS.find(c => c.value === label.color) || LABEL_COLORS[9];
  const sizes = {
    xs: 'text-[10px] px-1.5 py-0.5',
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
  };

  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-medium ${sizes[size]} ${colorConfig.bg} ${colorConfig.text}`}>
      {label.name}
      {onRemove && (
        <button onClick={onRemove} className="hover:bg-black/10 rounded-full p-0.5">
          <X size={10} />
        </button>
      )}
    </span>
  );
};

/**
 * Create/Edit Label Modal
 */
const LabelModal = ({ isOpen, onClose, label, onSave }) => {
  const [name, setName] = useState(label?.name || '');
  const [color, setColor] = useState(label?.color || LABEL_COLORS[0].value);

  if (!isOpen) return null;

  const handleSave = () => {
    if (name.trim()) {
      onSave({ id: label?.id, name: name.trim(), color });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 dark:bg-black/60" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-sm p-6">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
          {label ? 'Edit Label' : 'Create Label'}
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Label name"
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              autoFocus
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Color</label>
            <div className="flex flex-wrap gap-2">
              {LABEL_COLORS.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setColor(c.value)}
                  className={`w-8 h-8 rounded-full transition-all ${
                    color === c.value ? 'ring-2 ring-offset-2 ring-slate-400 dark:ring-slate-500 scale-110' : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: c.value }}
                  title={c.name}
                />
              ))}
            </div>
          </div>
        </div>
        
        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim()}
            className="px-4 py-2 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50"
          >
            {label ? 'Save' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Folder Tree Component
 * 
 * Displays folders and labels in a collapsible tree structure.
 */
const FolderTree = ({
  folders = [],
  labels = [],
  selectedFolder,
  selectedLabels = [],
  collapsed = false,
  onFolderSelect,
  onLabelSelect,
  onCreateLabel,
  onEditLabel,
  onDeleteLabel,
  userEmail,
}) => {
  const [labelsExpanded, setLabelsExpanded] = useState(true);
  const [labelModalOpen, setLabelModalOpen] = useState(false);
  const [editingLabel, setEditingLabel] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);

  const handleLabelContextMenu = (e, label) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      label,
    });
  };

  const handleEditLabel = () => {
    setEditingLabel(contextMenu.label);
    setLabelModalOpen(true);
    setContextMenu(null);
  };

  const handleDeleteLabel = () => {
    if (confirm(`Delete label "${contextMenu.label.name}"?`)) {
      onDeleteLabel?.(contextMenu.label.id);
    }
    setContextMenu(null);
  };

  const handleSaveLabel = (labelData) => {
    if (labelData.id) {
      onEditLabel?.(labelData.id, labelData);
    } else {
      onCreateLabel?.(labelData);
    }
    setEditingLabel(null);
  };

  // Close context menu on outside click
  React.useEffect(() => {
    const handleClick = () => setContextMenu(null);
    if (contextMenu) window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [contextMenu]);

  return (
    <nav className="flex flex-col h-full">
      {/* User info (when not collapsed) */}
      {!collapsed && userEmail && (
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-900 to-blue-800 rounded-lg flex items-center justify-center">
              <Mail size={16} className="text-white" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-bold text-slate-900 dark:text-white truncate">Exoin Mail</div>
              <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate">{userEmail}</div>
            </div>
          </div>
        </div>
      )}

      {/* Folders */}
      <div className="flex-1 overflow-y-auto px-2 py-2">
        <div className="space-y-0.5">
          {folders.map((folder) => {
            const Icon = FOLDER_ICONS[folder.path] || Mail;
            const isSelected = selectedFolder === folder.path;
            
            return (
              <button
                key={folder.path}
                onClick={() => onFolderSelect(folder.path)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                  isSelected
                    ? 'bg-white dark:bg-slate-700 text-orange-600 dark:text-orange-400 font-medium shadow-sm border border-slate-200 dark:border-slate-600'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-700/60'
                }`}
                title={collapsed ? folder.name : undefined}
              >
                <Icon 
                  size={18} 
                  className={isSelected ? 'text-orange-500 dark:text-orange-400' : 'text-slate-400 dark:text-slate-500'} 
                />
                {!collapsed && (
                  <>
                    <span className="flex-1 text-left truncate">{folder.name}</span>
                    {folder.unseen > 0 && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        isSelected 
                          ? 'bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400' 
                          : 'bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300'
                      }`}>
                        {folder.unseen > 99 ? '99+' : folder.unseen}
                      </span>
                    )}
                  </>
                )}
              </button>
            );
          })}
        </div>

        {/* Labels Section */}
        {!collapsed && labels.length >= 0 && (
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
            <div
              className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
            >
              <span onClick={() => setLabelsExpanded(!labelsExpanded)} className="flex-1">Labels</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingLabel(null);
                    setLabelModalOpen(true);
                  }}
                  className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"
                  title="Create label"
                >
                  <Plus size={14} />
                </button>
                <span onClick={() => setLabelsExpanded(!labelsExpanded)} className="cursor-pointer">
                  {labelsExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </span>
              </div>
            </div>
            
            {labelsExpanded && (
              <div className="space-y-0.5 mt-1">
                {labels.map((label) => {
                  const colorConfig = LABEL_COLORS.find(c => c.value === label.color) || LABEL_COLORS[9];
                  const isSelected = selectedLabels.includes(label.id);
                  
                  return (
                    <button
                      key={label.id}
                      onClick={() => onLabelSelect(label.id)}
                      onContextMenu={(e) => handleLabelContextMenu(e, label)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all group ${
                        isSelected
                          ? `${colorConfig.bg} ${colorConfig.text} font-medium`
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                      }`}
                    >
                      <div 
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: label.color }}
                      />
                      <span className="flex-1 text-left truncate">{label.name}</span>
                      {label.count > 0 && (
                        <span className="text-xs text-slate-400 dark:text-slate-500">{label.count}</span>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setContextMenu({ x: e.clientX, y: e.clientY, label });
                        }}
                        className="p-1 opacity-0 group-hover:opacity-100 hover:bg-slate-200 dark:hover:bg-slate-600 rounded"
                      >
                        <MoreHorizontal size={12} />
                      </button>
                    </button>
                  );
                })}
                
                {labels.length === 0 && (
                  <p className="px-3 py-2 text-xs text-slate-400 dark:text-slate-500 italic">
                    No labels yet
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div 
          className="fixed bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl py-1 z-50"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button
            onClick={handleEditLabel}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
          >
            <Edit2 size={14} /> Edit
          </button>
          <button
            onClick={handleDeleteLabel}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30"
          >
            <Trash2 size={14} /> Delete
          </button>
        </div>
      )}

      {/* Label Modal */}
      <LabelModal
        isOpen={labelModalOpen}
        onClose={() => {
          setLabelModalOpen(false);
          setEditingLabel(null);
        }}
        label={editingLabel}
        onSave={handleSaveLabel}
      />
    </nav>
  );
};

export { FolderTree, LabelBadge, LabelModal, LABEL_COLORS };
export default FolderTree;
