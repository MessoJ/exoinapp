import React, { useState, useRef, useEffect, useCallback, forwardRef } from 'react';
import { 
  Search, X, Clock, Star, Bookmark, ChevronDown, 
  Paperclip, Filter, Calendar, User, Tag, Mail, AtSign
} from 'lucide-react';

// Search operators for advanced search
const SEARCH_OPERATORS = [
  { operator: 'from:', description: 'Emails from a specific sender', example: 'from:john@example.com', icon: User },
  { operator: 'to:', description: 'Emails sent to someone', example: 'to:team@company.com', icon: AtSign },
  { operator: 'subject:', description: 'Search in subject line', example: 'subject:invoice', icon: Mail },
  { operator: 'has:attachment', description: 'Emails with attachments', example: 'has:attachment', icon: Paperclip },
  { operator: 'has:pdf', description: 'Emails with PDF files', example: 'has:pdf', icon: Paperclip },
  { operator: 'is:starred', description: 'Starred emails', example: 'is:starred', icon: Star },
  { operator: 'is:unread', description: 'Unread emails', example: 'is:unread', icon: Mail },
  { operator: 'is:read', description: 'Read emails', example: 'is:read', icon: Mail },
  { operator: 'label:', description: 'Emails with a label', example: 'label:work', icon: Tag },
  { operator: 'before:', description: 'Emails before a date', example: 'before:2024-01-01', icon: Calendar },
  { operator: 'after:', description: 'Emails after a date', example: 'after:2024-01-01', icon: Calendar },
  { operator: 'older_than:', description: 'Emails older than', example: 'older_than:7d', icon: Clock },
  { operator: 'newer_than:', description: 'Emails newer than', example: 'newer_than:7d', icon: Clock },
  { operator: 'in:', description: 'Emails in a folder', example: 'in:sent', icon: Mail },
];

// Quick filter presets
const QUICK_FILTERS = [
  { id: 'unread', label: 'Unread', query: 'is:unread', icon: Clock },
  { id: 'starred', label: 'Starred', query: 'is:starred', icon: Star },
  { id: 'attachments', label: 'Has attachment', query: 'has:attachment', icon: Paperclip },
  { id: 'today', label: 'Today', query: 'newer_than:1d', icon: Calendar },
  { id: 'this-week', label: 'This week', query: 'newer_than:7d', icon: Calendar },
];

/**
 * Advanced Search Bar Component
 * 
 * Features:
 * - Real-time search suggestions
 * - Operator autocomplete
 * - Recent searches
 * - Saved searches
 * - Quick filters
 * - API-driven suggestions
 */
const SearchBar = forwardRef(({ 
  value, 
  onChange, 
  onSearch, 
  onClear,
  recentSearches = [],
  savedSearches = [],
  onSaveSearch,
  onRemoveSavedSearch,
  onClearRecentSearches,
  onFetchSuggestions,
  apiSuggestions = [],
  className = '',
  placeholder = 'Search emails...',
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [activeOperator, setActiveOperator] = useState(null);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Debounce function for API suggestions
  const debounce = useCallback((fn, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn(...args), delay);
    };
  }, []);

  // Fetch suggestions with debounce
  const debouncedFetchSuggestions = useCallback(
    debounce((query) => {
      if (onFetchSuggestions && query.length >= 2) {
        onFetchSuggestions(query);
      }
    }, 300),
    [onFetchSuggestions]
  );

  // Parse the current query to detect operators being typed
  useEffect(() => {
    const lastWord = value.split(' ').pop() || '';
    
    // Check if user is typing an operator
    if (lastWord.endsWith(':') || SEARCH_OPERATORS.some(op => op.operator.startsWith(lastWord) && lastWord.length > 0)) {
      setActiveOperator(lastWord);
    } else {
      setActiveOperator(null);
      // Fetch API suggestions for plain text
      if (lastWord.length >= 2) {
        debouncedFetchSuggestions(lastWord);
      }
    }
    setSelectedSuggestionIndex(-1);
  }, [value, debouncedFetchSuggestions]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target) &&
          inputRef.current && !inputRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFocus = () => {
    setIsFocused(true);
    setShowDropdown(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
    // Delay hiding dropdown to allow clicks
    setTimeout(() => {
      if (!document.activeElement?.closest('.search-dropdown')) {
        setShowDropdown(false);
      }
    }, 200);
  };

  const handleKeyDown = (e) => {
    const allItems = [
      ...filteredOperators,
      ...apiSuggestions,
      ...recentSearches.slice(0, 5),
    ];
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedSuggestionIndex(prev => 
        prev < allItems.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedSuggestionIndex(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedSuggestionIndex >= 0 && selectedSuggestionIndex < allItems.length) {
        // Select the highlighted item
        const item = allItems[selectedSuggestionIndex];
        if (item.operator) {
          handleOperatorClick(item);
        } else if (item.query) {
          // API suggestion
          onChange(item.query);
          onSearch(item.query);
          setShowDropdown(false);
        } else if (typeof item === 'string') {
          // Recent search
          handleRecentSearch(item);
        }
      } else {
        onSearch(value);
        setShowDropdown(false);
      }
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
      setSelectedSuggestionIndex(-1);
      inputRef.current?.blur();
    } else if (e.key === 'Tab' && showDropdown && selectedSuggestionIndex >= 0) {
      e.preventDefault();
      const item = allItems[selectedSuggestionIndex];
      if (item?.operator) {
        handleOperatorClick(item);
      }
    }
  };

  const handleOperatorClick = (operator) => {
    // Replace the partial operator being typed with the full one
    const words = value.split(' ');
    words.pop();
    const newValue = [...words, operator.operator].join(' ');
    onChange(newValue);
    inputRef.current?.focus();
  };

  const handleQuickFilter = (filter) => {
    const newValue = value ? `${value} ${filter.query}` : filter.query;
    onChange(newValue);
    onSearch(newValue);
    setShowDropdown(false);
  };

  const handleRecentSearch = (query) => {
    onChange(query);
    onSearch(query);
    setShowDropdown(false);
  };

  const handleSaveCurrentSearch = () => {
    if (value.trim()) {
      const name = prompt('Name this search:');
      if (name) {
        onSaveSearch?.(name, value);
      }
    }
  };

  // Filter operators based on what user is typing
  const filteredOperators = activeOperator
    ? SEARCH_OPERATORS.filter(op => op.operator.startsWith(activeOperator))
    : [];

  return (
    <div className={`relative ${className}`}>
      {/* Search Input */}
      <div className={`relative flex items-center transition-all ${
        isFocused 
          ? 'ring-2 ring-orange-500/20 border-orange-400' 
          : 'border-transparent'
      } bg-slate-100 dark:bg-slate-800 border rounded-xl`}>
        <Search 
          className={`absolute left-4 transition-colors ${
            isFocused ? 'text-orange-500' : 'text-slate-400 dark:text-slate-500'
          }`} 
          size={18} 
        />
        
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full pl-11 pr-24 py-2.5 text-sm bg-transparent focus:outline-none text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
        />
        
        <div className="absolute right-2 flex items-center gap-1">
          {value && (
            <button
              onClick={() => { onChange(''); onClear?.(); }}
              className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            >
              <X size={16} />
            </button>
          )}
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors ${
              showFilters ? 'text-orange-500 bg-orange-50 dark:bg-orange-500/20' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
            title="Filters"
          >
            <Filter size={16} />
          </button>
        </div>
      </div>

      {/* Quick Filters Bar */}
      {showFilters && (
        <div className="absolute top-full left-0 right-0 mt-1 p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg z-40 flex flex-wrap gap-1">
          {QUICK_FILTERS.map(filter => {
            const Icon = filter.icon;
            return (
              <button
                key={filter.id}
                onClick={() => handleQuickFilter(filter)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-700 hover:bg-orange-50 dark:hover:bg-orange-500/20 hover:text-orange-600 dark:hover:text-orange-400 rounded-lg transition-colors"
              >
                <Icon size={14} />
                {filter.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Dropdown */}
      {showDropdown && (
        <div 
          ref={dropdownRef}
          className="search-dropdown absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden max-h-[400px] overflow-y-auto"
        >
          {/* Operator suggestions */}
          {filteredOperators.length > 0 && (
            <div className="p-2 border-b border-slate-100 dark:border-slate-700">
              <div className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2 mb-2">
                Search Operators
              </div>
              {filteredOperators.map((op, index) => {
                const Icon = op.icon || Search;
                const isSelected = selectedSuggestionIndex === index;
                return (
                  <button
                    key={op.operator}
                    onClick={() => handleOperatorClick(op)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors group ${
                      isSelected 
                        ? 'bg-orange-50 dark:bg-orange-500/20' 
                        : 'hover:bg-orange-50 dark:hover:bg-orange-500/20'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon size={14} className="text-slate-400" />
                      <span className="text-sm font-mono text-orange-600 dark:text-orange-400">{op.operator}</span>
                      <span className="text-sm text-slate-600 dark:text-slate-300">{op.description}</span>
                    </div>
                    <span className="text-xs text-slate-400 dark:text-slate-500">{op.example}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* API suggestions (from server) */}
          {apiSuggestions.length > 0 && !activeOperator && (
            <div className="p-2 border-b border-slate-100 dark:border-slate-700">
              <div className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2 mb-2">
                Suggestions
              </div>
              {apiSuggestions.map((suggestion, index) => {
                const globalIndex = filteredOperators.length + index;
                const isSelected = selectedSuggestionIndex === globalIndex;
                const Icon = suggestion.type === 'from' ? User : suggestion.type === 'label' ? Tag : Mail;
                return (
                  <button
                    key={`${suggestion.type}-${suggestion.value}`}
                    onClick={() => {
                      onChange(suggestion.query);
                      onSearch(suggestion.query);
                      setShowDropdown(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                      isSelected 
                        ? 'bg-orange-50 dark:bg-orange-500/20' 
                        : 'hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    <Icon size={14} className="text-slate-400" />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm text-slate-700 dark:text-slate-300 truncate block">{suggestion.display}</span>
                      <span className="text-xs text-slate-400">{suggestion.type}</span>
                    </div>
                    <span className="text-xs font-mono text-slate-400 dark:text-slate-500">{suggestion.query}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Recent searches */}
          {recentSearches.length > 0 && !activeOperator && (
            <div className="p-2 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center justify-between px-2 mb-2">
                <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Recent Searches
                </span>
                <button
                  onClick={onClearRecentSearches}
                  className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  Clear
                </button>
              </div>
              {recentSearches.slice(0, 5).map((query, i) => {
                const globalIndex = filteredOperators.length + apiSuggestions.length + i;
                const isSelected = selectedSuggestionIndex === globalIndex;
                return (
                  <button
                    key={i}
                    onClick={() => handleRecentSearch(query)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                      isSelected 
                        ? 'bg-orange-50 dark:bg-orange-500/20' 
                        : 'hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    <Clock size={14} className="text-slate-400" />
                    <span className="text-sm text-slate-700 dark:text-slate-300">{query}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Saved searches */}
          {savedSearches.length > 0 && !activeOperator && (
            <div className="p-2 border-b border-slate-100 dark:border-slate-700">
              <div className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2 mb-2">
                Saved Searches
              </div>
              {savedSearches.map((search, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors group"
                >
                  <Bookmark size={14} className="text-orange-500" />
                  <button
                    onClick={() => handleRecentSearch(search.query)}
                    className="flex-1 text-left"
                  >
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{search.name}</span>
                    <span className="text-xs text-slate-400 ml-2">{search.query}</span>
                  </button>
                  <button
                    onClick={() => onRemoveSavedSearch?.(search.query)}
                    className="p-1 opacity-0 group-hover:opacity-100 hover:bg-slate-200 dark:hover:bg-slate-600 rounded text-slate-400"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Search tips */}
          {!activeOperator && !value && (
            <div className="p-4 bg-slate-50 dark:bg-slate-700/50">
              <div className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                Search Tips
              </div>
              <div className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                <p>• Use <code className="bg-white dark:bg-slate-800 px-1 rounded">from:</code> or <code className="bg-white dark:bg-slate-800 px-1 rounded">to:</code> to filter by sender/recipient</p>
                <p>• Use <code className="bg-white dark:bg-slate-800 px-1 rounded">has:attachment</code> to find emails with files</p>
                <p>• Use <code className="bg-white dark:bg-slate-800 px-1 rounded">"exact phrase"</code> for exact matches</p>
                <p>• Use <code className="bg-white dark:bg-slate-800 px-1 rounded">-word</code> to exclude results</p>
              </div>
            </div>
          )}

          {/* Save search option */}
          {value && (
            <div className="p-2 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50">
              <button
                onClick={handleSaveCurrentSearch}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <Bookmark size={14} />
                Save this search
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

SearchBar.displayName = 'SearchBar';

export default SearchBar;
