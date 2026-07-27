// src/context/ThemeContext.jsx
// Site-wide dark / light theme switch for the public marketing site.
// Applies a `light` class to <html> which flips the CSS custom properties
// defined in index.css (--chalk, --paper, --charcoal, ...). Every Tailwind
// color in tailwind.config.js reads from those variables, so the whole
// public site re-themes instantly — no per-component changes needed.

import { createContext, useContext, useEffect, useState, useCallback } from 'react'

const ThemeContext = createContext(null)
const STORAGE_KEY = 'aks-theme'

function getInitialTheme() {
    if (typeof window === 'undefined') return 'light'
    try {
        const saved = window.localStorage.getItem(STORAGE_KEY)
        if (saved === 'dark' || saved === 'light') return saved
    } catch {
        /* localStorage unavailable — fall through to default */
    }
    return 'light'
}

export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState(getInitialTheme)

    useEffect(() => {
        const root = document.documentElement
        root.classList.toggle('dark', theme === 'dark')
        root.style.colorScheme = theme
        try {
            window.localStorage.setItem(STORAGE_KEY, theme)
        } catch {
            /* ignore persistence errors (private browsing, etc.) */
        }
    }, [theme])

    const toggleTheme = useCallback(() => {
        setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
    }, [])

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    )
}

export function useTheme() {
    const ctx = useContext(ThemeContext)
    if (!ctx) throw new Error('useTheme must be used within a ThemeProvider')
    return ctx
}
