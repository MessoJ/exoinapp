import React from 'react';
import { X, Keyboard } from 'lucide-react';
import { KEYBOARD_SHORTCUTS, SHORTCUT_CATEGORIES } from '../../hooks/useKeyboardShortcuts';

/**
 * Keyboard Shortcuts Modal
 * 
 * Displays all available keyboard shortcuts organized by category.
 * Triggered by pressing '?'
 */
const KeyboardShortcutsModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const renderShortcut = (key) => {
    const config = KEYBOARD_SHORTCUTS[key];
    if (!config) return null;

    // Format the key for display
    const displayKey = key
      .replace('Ctrl+', '⌘/')
      .replace('Shift+', '⇧')
      .replace('Alt+', '⌥')
      .replace('Enter', '↵')
      .replace('Escape', 'Esc')
      .replace('Delete', 'Del')
      .replace('+', ' then ');

    return (
      <div key={key} className="flex items-center justify-between py-2">
        <span className="text-sm text-slate-600 dark:text-slate-300">{config.description}</span>
        <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-xs font-mono text-slate-700 dark:text-slate-300 min-w-[40px] text-center">
          {displayKey}
        </kbd>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm" 
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-white dark:from-slate-700 dark:to-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-900 to-blue-800 rounded-xl flex items-center justify-center">
              <Keyboard className="text-white" size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Keyboard Shortcuts</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Navigate your email faster with shortcuts</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-500 dark:text-slate-400 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-80px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(SHORTCUT_CATEGORIES).map(([category, shortcuts]) => (
              <div key={category} className="space-y-1">
                <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">
                  {category}
                </h3>
                <div className="space-y-0 divide-y divide-slate-100 dark:divide-slate-700">
                  {shortcuts.map(renderShortcut)}
                </div>
              </div>
            ))}
          </div>

          {/* Tips */}
          <div className="mt-8 p-4 bg-orange-50 dark:bg-orange-500/10 border border-orange-100 dark:border-orange-500/30 rounded-xl">
            <h4 className="text-sm font-semibold text-orange-800 dark:text-orange-400 mb-2">Pro Tips</h4>
            <ul className="text-sm text-orange-700 dark:text-orange-300 space-y-1">
              <li>• Use <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-orange-200 dark:border-orange-500/30 rounded text-xs">j</kbd> and <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-orange-200 dark:border-orange-500/30 rounded text-xs">k</kbd> to navigate emails like Vim</li>
              <li>• Press <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-orange-200 dark:border-orange-500/30 rounded text-xs">g</kbd> then a letter to go to specific folders</li>
              <li>• Use <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-orange-200 dark:border-orange-500/30 rounded text-xs">*</kbd> then a letter for selection shortcuts</li>
              <li>• Press <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-orange-200 dark:border-orange-500/30 rounded text-xs">/</kbd> to quickly search your emails</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50 text-center">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Press <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded text-xs">?</kbd> anytime to see these shortcuts
          </p>
        </div>
      </div>
    </div>
  );
};

export default KeyboardShortcutsModal;
