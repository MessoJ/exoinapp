import React, { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Monitor, ChevronDown } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const ThemeToggle = ({ className = '' }) => {
  const { theme, setTheme, isDark } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const options = [
    { value: 'light', icon: Sun, label: 'Light', description: 'Always light mode' },
    { value: 'dark', icon: Moon, label: 'Dark', description: 'Always dark mode' },
    { value: 'system', icon: Monitor, label: 'System', description: 'Match system settings' },
  ];

  const currentOption = options.find(o => o.value === theme) || options[2];
  const CurrentIcon = currentOption.icon;

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

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all
          ${isDark 
            ? 'bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700' 
            : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
          }
        `}
        title="Change theme"
      >
        <CurrentIcon size={16} className={isDark ? 'text-orange-400' : 'text-orange-600'} />
        <span className="hidden sm:inline">{currentOption.label}</span>
        <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className={`
          absolute right-0 top-full mt-2 w-56 rounded-xl shadow-xl z-50 overflow-hidden
          ${isDark 
            ? 'bg-slate-800 border border-slate-700' 
            : 'bg-white border border-slate-200'
          }
        `}>
          <div className={`px-3 py-2 border-b ${isDark ? 'border-slate-700' : 'border-slate-100'}`}>
            <p className={`text-xs font-semibold uppercase tracking-wide ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Appearance
            </p>
          </div>
          {options.map(({ value, icon: Icon, label, description }) => (
            <button
              key={value}
              onClick={() => {
                setTheme(value);
                setIsOpen(false);
              }}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors
                ${theme === value 
                  ? isDark 
                    ? 'bg-orange-900/30 text-orange-400' 
                    : 'bg-orange-50 text-orange-600'
                  : isDark
                    ? 'text-slate-300 hover:bg-slate-700'
                    : 'text-slate-700 hover:bg-slate-50'
                }
              `}
            >
              <div className={`
                p-1.5 rounded-lg
                ${theme === value 
                  ? isDark ? 'bg-orange-900/50' : 'bg-orange-100'
                  : isDark ? 'bg-slate-700' : 'bg-slate-100'
                }
              `}>
                <Icon size={16} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{label}</p>
                <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  {description}
                </p>
              </div>
              {theme === value && (
                <div className={`w-2 h-2 rounded-full ${isDark ? 'bg-orange-400' : 'bg-orange-500'}`} />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ThemeToggle;
