import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

const THEME_STORAGE_KEY = 'bycodez_theme';
const AVAILABLE_THEMES = {
  TAILWIND: 'tailwind',
  BOOTSTRAP: 'bootstrap'
};

/**
 * Theme Provider Component
 * Manages theme switching between Tailwind CSS and Bootstrap 5
 */
export const ThemeProvider = ({ children }) => {
  // Get initial theme from localStorage or default to tailwind
  const [currentTheme, setCurrentTheme] = useState(() => {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    // Clear the reload flag on initial load
    localStorage.removeItem('theme_just_switched');
    return savedTheme || AVAILABLE_THEMES.TAILWIND;
  });

  // Track if this is the first render
  const [isInitialRender, setIsInitialRender] = useState(true);

  // Update localStorage when theme changes
  useEffect(() => {
    // Skip reload on initial render
    if (isInitialRender) {
      setIsInitialRender(false);
      document.body.setAttribute('data-theme', currentTheme);
      console.log(`🎨 Initial theme loaded: ${currentTheme}`);
      return;
    }

    // Theme was changed by user - save and reload
    localStorage.setItem(THEME_STORAGE_KEY, currentTheme);
    document.body.setAttribute('data-theme', currentTheme);
    console.log(`🎨 Theme switched to: ${currentTheme} - Reloading...`);

    // Reload page to apply new CSS
    window.location.reload();
  }, [currentTheme]);

  /**
   * Switch to a specific theme
   */
  const switchTheme = (themeName) => {
    if (Object.values(AVAILABLE_THEMES).includes(themeName)) {
      setCurrentTheme(themeName);
      return true;
    }
    console.error(`Invalid theme: ${themeName}`);
    return false;
  };

  /**
   * Toggle between available themes
   */
  const toggleTheme = () => {
    const newTheme = currentTheme === AVAILABLE_THEMES.TAILWIND 
      ? AVAILABLE_THEMES.BOOTSTRAP 
      : AVAILABLE_THEMES.TAILWIND;
    setCurrentTheme(newTheme);
  };

  /**
   * Check if a specific theme is active
   */
  const isThemeActive = (themeName) => {
    return currentTheme === themeName;
  };

  /**
   * Get theme-specific class names
   */
  const getThemeClass = (tailwindClass, bootstrapClass) => {
    return currentTheme === AVAILABLE_THEMES.TAILWIND ? tailwindClass : bootstrapClass;
  };

  const value = {
    currentTheme,
    switchTheme,
    toggleTheme,
    isThemeActive,
    getThemeClass,
    themes: AVAILABLE_THEMES,
    isTailwind: currentTheme === AVAILABLE_THEMES.TAILWIND,
    isBootstrap: currentTheme === AVAILABLE_THEMES.BOOTSTRAP
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

/**
 * Hook to use theme context
 */
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

/**
 * Theme Switcher Button Component
 */
export const ThemeSwitcher = () => {
  const { currentTheme, toggleTheme, isTailwind, isBootstrap } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={
        isTailwind
          ? 'px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors'
          : 'btn btn-primary'
      }
      title="Switch Theme"
    >
      <span className="flex items-center gap-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 2v6m0 8v6M2 12h6m8 0h6M4.93 4.93l4.24 4.24m5.66 5.66l4.24 4.24M4.93 19.07l4.24-4.24m5.66-5.66l4.24-4.24" />
        </svg>
        <span className="hidden sm:inline">
          {isTailwind ? 'Switch to Bootstrap' : 'Switch to Tailwind'}
        </span>
        <span className="sm:hidden">Theme</span>
      </span>
    </button>
  );
};

export default ThemeContext;

