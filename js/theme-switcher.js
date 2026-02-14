/**
 * Theme Switcher
 * Handles dark/light mode toggle with localStorage persistence
 */

(function() {
    'use strict';

    const THEME_KEY = 'resource-nest-theme';
    const THEME_DARK = 'dark';
    const THEME_LIGHT = 'light';

    /**
     * Get the current theme from localStorage or system preference
     * @returns {string} The current theme ('dark' or 'light')
     */
    function getCurrentTheme() {
        const savedTheme = localStorage.getItem(THEME_KEY);

        if (savedTheme) {
            return savedTheme;
        }

        // Check system preference
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
            return THEME_LIGHT;
        }

        return THEME_DARK; // Default to dark
    }

    /**
     * Apply theme to the document
     * @param {string} theme - The theme to apply
     */
    function applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem(THEME_KEY, theme);
    }

    /**
     * Toggle between dark and light themes
     */
    function toggleTheme() {
        const currentTheme = getCurrentTheme();
        const newTheme = currentTheme === THEME_DARK ? THEME_LIGHT : THEME_DARK;
        applyTheme(newTheme);

        // Dispatch custom event for analytics or other listeners
        window.dispatchEvent(new CustomEvent('themechange', {
            detail: { theme: newTheme }
        }));
    }

    /**
     * Initialize theme on page load
     */
    function initTheme() {
        const currentTheme = getCurrentTheme();
        applyTheme(currentTheme);
    }

    /**
     * Set up event listeners
     */
    function setupEventListeners() {
        const themeToggle = document.getElementById('theme-toggle');
        const floatingToggle = document.getElementById('floating-theme-toggle');

        // Attach to both toggle buttons
        [themeToggle, floatingToggle].forEach(toggle => {
            if (toggle) {
                toggle.addEventListener('click', toggleTheme);

                // Keyboard accessibility
                toggle.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        toggleTheme();
                    }
                });
            }
        });

        // Listen for system theme changes
        if (window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

            // Modern browsers
            if (mediaQuery.addEventListener) {
                mediaQuery.addEventListener('change', (e) => {
                    // Only auto-switch if user hasn't manually set a preference
                    if (!localStorage.getItem(THEME_KEY)) {
                        applyTheme(e.matches ? THEME_DARK : THEME_LIGHT);
                    }
                });
            }
            // Older browsers
            else if (mediaQuery.addListener) {
                mediaQuery.addListener((e) => {
                    if (!localStorage.getItem(THEME_KEY)) {
                        applyTheme(e.matches ? THEME_DARK : THEME_LIGHT);
                    }
                });
            }
        }
    }

    // Initialize immediately to prevent flash of wrong theme
    initTheme();

    // Set up listeners when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupEventListeners);
    } else {
        setupEventListeners();
    }

    // Export functions for testing or external use
    window.ThemeSwitcher = {
        getCurrentTheme,
        applyTheme,
        toggleTheme
    };

})();
