import React, { createContext, useContext, useEffect, useState } from 'react';
import { useMailStore } from '../stores/mailStore';

const ThemeContext = createContext({
  isDark: false,
  theme: 'system',
  setTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  const settings = useMailStore((state) => state.settings);
  const updateSettings = useMailStore((state) => state.updateSettings);
  const [isDark, setIsDark] = useState(false);
  
  // Get the current theme setting with fallback
  const currentTheme = settings?.darkMode || 'system';

  // Determine if we should use dark mode
  useEffect(() => {
    const updateDarkMode = () => {
      let shouldBeDark = false;
      
      if (currentTheme === 'dark') {
        shouldBeDark = true;
      } else if (currentTheme === 'light') {
        shouldBeDark = false;
      } else {
        // System preference
        shouldBeDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      }
      
      setIsDark(shouldBeDark);
      
      // Update document class
      if (shouldBeDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    updateDarkMode();

    // Listen for system preference changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (currentTheme === 'system') {
        updateDarkMode();
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [currentTheme]);

  const setTheme = (theme) => {
    updateSettings({ darkMode: theme });
    // Also save to localStorage directly for immediate effect
    localStorage.setItem('exoin-theme', theme);
  };

  return (
    <ThemeContext.Provider value={{ isDark, theme: currentTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;
