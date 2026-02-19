/**
 * themes.js — Chess Board Theme Manager
 *
 * Defines 5 preset board color themes.
 * Themes are applied by setting CSS custom properties on :root.
 * Preference persisted in localStorage.
 */

const ChessThemes = (() => {
    const STORAGE_KEY = 'chess_theme';

    const THEMES = [
        {
            id: 'classic',
            nameKey: 'theme_classic',
            light: '#e8dcc8',
            dark: '#b58863',
            highlightLight: '#f7ec7d',
            highlightDark: '#dbc34d',
            accent: '#7c6aef',
            preview: ['#e8dcc8', '#b58863'],
        },
        {
            id: 'ocean',
            nameKey: 'theme_ocean',
            light: '#d9eef8',
            dark: '#4d8fb8',
            highlightLight: '#a5d8f5',
            highlightDark: '#6ab5e0',
            accent: '#3b9cbd',
            preview: ['#d9eef8', '#4d8fb8'],
        },
        {
            id: 'forest',
            nameKey: 'theme_forest',
            light: '#dce8d4',
            dark: '#5b8a4a',
            highlightLight: '#bcdb9f',
            highlightDark: '#89c06a',
            accent: '#4e9e3a',
            preview: ['#dce8d4', '#5b8a4a'],
        },
        {
            id: 'midnight',
            nameKey: 'theme_midnight',
            light: '#9baacf',
            dark: '#374666',
            highlightLight: '#c2ccee',
            highlightDark: '#8fa3d8',
            accent: '#8b9fe8',
            preview: ['#9baacf', '#374666'],
        },
        {
            id: 'chessy',
            nameKey: 'theme_chessy',
            light: '#f0d9b5',
            dark: '#946f51',
            highlightLight: '#cdd16f',
            highlightDark: '#aaa23a',
            accent: '#d4a240',
            preview: ['#f0d9b5', '#946f51'],
        },
    ];

    function getAllThemes() {
        return THEMES;
    }

    function getThemeById(id) {
        return THEMES.find(t => t.id === id) || THEMES[0];
    }

    function getCurrentThemeId() {
        return localStorage.getItem(STORAGE_KEY) || 'classic';
    }

    function applyTheme(id) {
        const theme = getThemeById(id);
        const root = document.documentElement;

        root.style.setProperty('--sq-light', theme.light);
        root.style.setProperty('--sq-dark', theme.dark);
        root.style.setProperty('--sq-light-highlight', theme.highlightLight);
        root.style.setProperty('--sq-dark-highlight', theme.highlightDark);

        localStorage.setItem(STORAGE_KEY, id);

        // Mark active theme in DOM (for swatch UI)
        document.querySelectorAll('.theme-swatch').forEach(el => {
            el.classList.toggle('active', el.dataset.theme === id);
        });
    }

    function loadSavedTheme() {
        const saved = localStorage.getItem(STORAGE_KEY) || 'classic';
        applyTheme(saved);
    }

    return { getAllThemes, getThemeById, getCurrentThemeId, applyTheme, loadSavedTheme };
})();
