import React, { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Monitor, ChevronDown } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

// Simple toggle button (just toggles between light/dark)
export const ThemeToggleButton = ({ className = '' }) => {
  const { isDark, setTheme, theme } = useTheme();
  
  const handleToggle = () => {
    // If currently using system, detect current state and toggle opposite
    if (theme === 'system') {
      setTheme(isDark ? 'light' : 'dark');
    } else {
      setTheme(isDark ? 'light' : 'dark');
    }
  };
  
  return (
    <button
      onClick={handleToggle}
      className={`p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors ${className}`}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? (
        <Sun size={20} className="text-amber-400" />
      ) : (
        <Moon size={20} className="text-slate-500" />
      )}
    </button>
  );
};

// Dropdown selector with light/dark/system options
export const ThemeDropdown = ({ collapsed = false }) => {
  const { isDark, setTheme, theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const options = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ];
  
  const currentOption = options.find(o => o.value === theme) || options[2];
  const CurrentIcon = currentOption.icon;
  
  if (collapsed) {
    // When sidebar is collapsed, just show a toggle button
    return (
      <button
        onClick={() => setTheme(isDark ? 'light' : 'dark')}
        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors mx-auto"
        title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {isDark ? (
          <Sun size={18} className="text-amber-400" />
        ) : (
          <Moon size={18} className="text-slate-500" />
        )}
      </button>
    );
  }
  
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-3 py-2.5 w-full text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
      >
        <CurrentIcon size={18} className={isDark ? 'text-amber-400' : 'text-slate-500'} />
        <span className="text-sm flex-1 text-left">Theme</span>
        <span className="text-xs text-slate-400 dark:text-slate-500 capitalize">{currentOption.label}</span>
        <ChevronDown 
          size={14} 
          className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>
      
      {isOpen && (
        <div className="absolute bottom-full left-0 right-0 mb-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg py-1 z-50">
          {options.map((option) => {
            const Icon = option.icon;
            const isSelected = theme === option.value;
            return (
              <button
                key={option.value}
                onClick={() => {
                  setTheme(option.value);
                  setIsOpen(false);
                }}
                className={`flex items-center gap-3 px-3 py-2 w-full text-left transition-colors ${
                  isSelected 
                    ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400' 
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                <Icon size={16} className={isSelected ? '' : 'text-slate-400'} />
                <span className="text-sm">{option.label}</span>
                {isSelected && (
                  <span className="ml-auto text-orange-600 dark:text-orange-400">✓</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

// Compact theme toggle with dropdown for header
export const ThemeToggleCompact = () => {
  const { isDark, setTheme, theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const options = [
    { value: 'light', label: 'Light', icon: Sun, description: 'Always use light mode' },
    { value: 'dark', label: 'Dark', icon: Moon, description: 'Always use dark mode' },
    { value: 'system', label: 'System', icon: Monitor, description: 'Match system setting' },
  ];
  
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
        title="Change theme"
        aria-label="Change theme"
      >
        {isDark ? (
          <Moon size={20} className="text-slate-400 dark:text-slate-300" />
        ) : (
          <Sun size={20} className="text-amber-500" />
        )}
      </button>
      
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg py-2 w-56 z-50">
            <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-700">
              <p className="text-sm font-medium text-slate-900 dark:text-white">Appearance</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Choose your theme preference</p>
            </div>
            {options.map((option) => {
              const Icon = option.icon;
              const isSelected = theme === option.value;
              return (
                <button
                  key={option.value}
                  onClick={() => {
                    setTheme(option.value);
                    setIsOpen(false);
                  }}
                  className={`flex items-center gap-3 px-3 py-2.5 w-full text-left transition-colors ${
                    isSelected 
                      ? 'bg-orange-50 dark:bg-orange-900/20' 
                      : 'hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  <div className={`p-1.5 rounded-lg ${
                    isSelected 
                      ? 'bg-orange-100 dark:bg-orange-900/40' 
                      : 'bg-slate-100 dark:bg-slate-700'
                  }`}>
                    <Icon size={16} className={
                      isSelected 
                        ? 'text-orange-600 dark:text-orange-400' 
                        : 'text-slate-500 dark:text-slate-400'
                    } />
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${
                      isSelected 
                        ? 'text-orange-600 dark:text-orange-400' 
                        : 'text-slate-700 dark:text-slate-200'
                    }`}>{option.label}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{option.description}</p>
                  </div>
                  {isSelected && (
                    <span className="text-orange-600 dark:text-orange-400">✓</span>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default ThemeToggleButton;
