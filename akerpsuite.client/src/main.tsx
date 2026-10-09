import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import './index.css'
import App from '../app/route'
import { ThemeProvider } from './context/ThemeContext'
import { startAutoRefresh } from "./services/tokenService";

// Public visitor ke liye token refresh timer bekar hai
if (localStorage.getItem("token")) {
    startAutoRefresh();
}

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <HelmetProvider>
            <ThemeProvider>
                <App />
            </ThemeProvider>
        </HelmetProvider>
    </StrictMode>
)