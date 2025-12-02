import { useEffect, useCallback, useRef } from 'react';

/**
 * Keyboard Shortcuts Hook for Mail Application
 * 
 * Handles Gmail-style keyboard shortcuts with modifier key support.
 * Ignores shortcuts when typing in input/textarea elements.
 */

// Default keyboard shortcuts map
export const KEYBOARD_SHORTCUTS = {
  // Navigation
  'j': { action: 'nextEmail', description: 'Next email in list' },
  'k': { action: 'previousEmail', description: 'Previous email in list' },
  'o': { action: 'openEmail', description: 'Open email' },
  'Enter': { action: 'openEmail', description: 'Open email' },
  'u': { action: 'backToList', description: 'Back to email list' },
  'Escape': { action: 'closeOrCancel', description: 'Close current view' },
  
  // Compose & Reply
  'c': { action: 'compose', description: 'Compose new email' },
  'r': { action: 'reply', description: 'Reply to email' },
  'a': { action: 'replyAll', description: 'Reply all' },
  'f': { action: 'forward', description: 'Forward email' },
  
  // Actions
  'e': { action: 'archive', description: 'Archive email' },
  '#': { action: 'delete', description: 'Delete email' },
  'Delete': { action: 'delete', description: 'Delete email' },
  's': { action: 'toggleStar', description: 'Star/unstar email' },
  'Shift+u': { action: 'markUnread', description: 'Mark as unread' },
  'Shift+i': { action: 'markRead', description: 'Mark as read' },
  'l': { action: 'label', description: 'Apply label' },
  'v': { action: 'move', description: 'Move to folder' },
  'm': { action: 'mute', description: 'Mute conversation' },
  '!': { action: 'spam', description: 'Mark as spam' },
  
  // Search & Navigation
  '/': { action: 'focusSearch', description: 'Focus search box' },
  'g+i': { action: 'goToInbox', description: 'Go to Inbox' },
  'g+s': { action: 'goToStarred', description: 'Go to Starred' },
  'g+t': { action: 'goToSent', description: 'Go to Sent' },
  'g+d': { action: 'goToDrafts', description: 'Go to Drafts' },
  'g+a': { action: 'goToArchive', description: 'Go to Archive' },
  
  // Selection
  'x': { action: 'toggleSelect', description: 'Select/deselect email' },
  '*+a': { action: 'selectAll', description: 'Select all' },
  '*+n': { action: 'selectNone', description: 'Deselect all' },
  '*+r': { action: 'selectRead', description: 'Select read' },
  '*+u': { action: 'selectUnread', description: 'Select unread' },
  '*+s': { action: 'selectStarred', description: 'Select starred' },
  
  // Misc
  '?': { action: 'showHelp', description: 'Show keyboard shortcuts' },
  'Ctrl+Enter': { action: 'sendEmail', description: 'Send email' },
  'Ctrl+Shift+c': { action: 'addCC', description: 'Add Cc recipients' },
  'Ctrl+Shift+b': { action: 'addBCC', description: 'Add Bcc recipients' },
  'Ctrl+k': { action: 'insertLink', description: 'Insert link' },
  'Ctrl+b': { action: 'bold', description: 'Bold text' },
  'Ctrl+i': { action: 'italic', description: 'Italic text' },
  'Ctrl+u': { action: 'underline', description: 'Underline text' },
};

// Shortcut categories for help modal
export const SHORTCUT_CATEGORIES = {
  'Navigation': ['j', 'k', 'o', 'u', 'Escape'],
  'Compose': ['c', 'r', 'a', 'f', 'Ctrl+Enter'],
  'Actions': ['e', '#', 's', 'Shift+u', 'Shift+i', 'l', 'v', '!'],
  'Selection': ['x', '*+a', '*+n'],
  'Go to': ['g+i', 'g+s', 'g+t', 'g+d', 'g+a'],
  'Search': ['/'],
  'Help': ['?'],
};

/**
 * Check if an element is an input field
 */
const isInputElement = (element) => {
  if (!element) return false;
  const tagName = element.tagName?.toLowerCase();
  const isEditable = element.isContentEditable;
  const isInput = ['input', 'textarea', 'select'].includes(tagName);
  return isInput || isEditable;
};

/**
 * Parse a key event into a normalized shortcut string
 */
const parseKeyEvent = (event) => {
  const parts = [];
  
  if (event.ctrlKey || event.metaKey) parts.push('Ctrl');
  if (event.shiftKey) parts.push('Shift');
  if (event.altKey) parts.push('Alt');
  
  let key = event.key;
  
  // Normalize special keys
  if (key === ' ') key = 'Space';
  if (key.length === 1) key = key.toLowerCase();
  
  // Handle Shift+key for symbols
  if (event.shiftKey && key.length === 1) {
    // Map shifted characters
    const shiftMap = {
      '3': '#',
      '1': '!',
      '8': '*',
      '/': '?',
    };
    if (shiftMap[event.code?.replace('Digit', '')]) {
      key = shiftMap[event.code.replace('Digit', '')];
      // Remove Shift from parts since it's already in the key
      const shiftIndex = parts.indexOf('Shift');
      if (shiftIndex > -1) parts.splice(shiftIndex, 1);
    }
  }
  
  parts.push(key);
  return parts.join('+');
};

/**
 * Main keyboard shortcuts hook
 */
export const useKeyboardShortcuts = (handlers = {}, options = {}) => {
  const {
    enabled = true,
    enableInInputs = false,
    preventDefault = true,
  } = options;
  
  // Track multi-key sequences (like g+i, *+a)
  const sequenceRef = useRef('');
  const sequenceTimeoutRef = useRef(null);
  
  const handleKeyDown = useCallback((event) => {
    // Check if shortcuts are enabled
    if (!enabled) return;
    
    // Skip if in input field (unless explicitly enabled)
    if (!enableInInputs && isInputElement(event.target)) {
      // Allow Escape and some Ctrl shortcuts in inputs
      if (event.key !== 'Escape' && !(event.ctrlKey && ['Enter', 'k', 'b', 'i', 'u'].includes(event.key))) {
        return;
      }
    }
    
    const shortcut = parseKeyEvent(event);
    
    // Handle sequence shortcuts (g+i, *+a, etc.)
    if (['g', '*'].includes(event.key.toLowerCase()) && !event.ctrlKey && !event.altKey) {
      sequenceRef.current = event.key.toLowerCase();
      
      // Clear sequence after 1 second
      if (sequenceTimeoutRef.current) clearTimeout(sequenceTimeoutRef.current);
      sequenceTimeoutRef.current = setTimeout(() => {
        sequenceRef.current = '';
      }, 1000);
      
      if (preventDefault) event.preventDefault();
      return;
    }
    
    // Check for sequence completion
    let finalShortcut = shortcut;
    if (sequenceRef.current) {
      finalShortcut = `${sequenceRef.current}+${event.key.toLowerCase()}`;
      sequenceRef.current = '';
      if (sequenceTimeoutRef.current) clearTimeout(sequenceTimeoutRef.current);
    }
    
    // Look up the shortcut
    const shortcutConfig = KEYBOARD_SHORTCUTS[finalShortcut];
    if (shortcutConfig && handlers[shortcutConfig.action]) {
      if (preventDefault) event.preventDefault();
      handlers[shortcutConfig.action](event);
    }
  }, [enabled, enableInInputs, preventDefault, handlers]);
  
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (sequenceTimeoutRef.current) clearTimeout(sequenceTimeoutRef.current);
    };
  }, [handleKeyDown]);
  
  return {
    shortcuts: KEYBOARD_SHORTCUTS,
    categories: SHORTCUT_CATEGORIES,
  };
};

/**
 * Hook for compose-specific shortcuts
 */
export const useComposeShortcuts = (handlers = {}, options = {}) => {
  const { enabled = true } = options;
  
  const handleKeyDown = useCallback((event) => {
    if (!enabled) return;
    
    // Ctrl+Enter to send
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      handlers.sendEmail?.();
      return;
    }
    
    // Escape to close/discard
    if (event.key === 'Escape') {
      handlers.closeOrCancel?.();
      return;
    }
    
    // Ctrl+Shift+C for Cc
    if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === 'c') {
      event.preventDefault();
      handlers.addCC?.();
      return;
    }
    
    // Ctrl+Shift+B for Bcc
    if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === 'b') {
      event.preventDefault();
      handlers.addBCC?.();
      return;
    }
    
    // Formatting shortcuts (let the editor handle these if we're in the editor)
    // Ctrl+K for links
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      if (handlers.insertLink) {
        event.preventDefault();
        handlers.insertLink();
      }
    }
  }, [enabled, handlers]);
  
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
};

/**
 * Hook for email list navigation with arrow keys
 */
export const useListNavigation = (items = [], selectedIndex, onSelect, options = {}) => {
  const { enabled = true, wrap = false } = options;
  
  const handleKeyDown = useCallback((event) => {
    if (!enabled || isInputElement(event.target)) return;
    if (items.length === 0) return;
    
    let newIndex = selectedIndex;
    
    switch (event.key) {
      case 'ArrowDown':
      case 'j':
        event.preventDefault();
        newIndex = selectedIndex + 1;
        if (newIndex >= items.length) {
          newIndex = wrap ? 0 : items.length - 1;
        }
        break;
        
      case 'ArrowUp':
      case 'k':
        event.preventDefault();
        newIndex = selectedIndex - 1;
        if (newIndex < 0) {
          newIndex = wrap ? items.length - 1 : 0;
        }
        break;
        
      case 'Home':
        event.preventDefault();
        newIndex = 0;
        break;
        
      case 'End':
        event.preventDefault();
        newIndex = items.length - 1;
        break;
        
      default:
        return;
    }
    
    if (newIndex !== selectedIndex && items[newIndex]) {
      onSelect(items[newIndex], newIndex);
    }
  }, [enabled, items, selectedIndex, onSelect, wrap]);
  
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
  
  return {
    selectedIndex,
    selectedItem: items[selectedIndex],
  };
};

export default useKeyboardShortcuts;
