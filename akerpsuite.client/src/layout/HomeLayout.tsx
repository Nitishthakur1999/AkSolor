// src/layout/HomeLayout.jsx — shared chrome (navbar/footer) for every public page.
import { lazy, Suspense, useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useScrollChrome } from '../hooks/useScrollChrome';
import { useParallax } from '../hooks/useParallax';

import Navbar from '../components/Navbar';
import ScrollTopButton from '../components/ScrollTopButton';
import WhatsAppFloat from '../components/WhatsAppFloat';

// Footer fold ke neeche hai, cursor sirf desktop pe kaam ka
const Footer = lazy(() => import('../components/Footer'));
const CustomCursor = lazy(() => import('../components/CustomCursor'));

export default function HomeLayout() {
    const { progress, showScrollTop } = useScrollChrome();
    const location = useLocation();
    useParallax();

    // Custom cursor sirf mouse wale device pe (touch pe bekar JS)
    const [showCursor, setShowCursor] = useState(false);
    useEffect(() => {
        setShowCursor(window.matchMedia('(hover: hover) and (pointer: fine)').matches);
    }, []);

    // Smooth in-page anchor scrolling (href="#id")
    useEffect(() => {
        function onClick(e) {
            const a = e.target.closest('a[href^="#"]');
            if (!a) return;
            const id = a.getAttribute('href');
            if (id === '#' || id.length < 2) return;
            const target = document.querySelector(id);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
        document.addEventListener('click', onClick);
        return () => document.removeEventListener('click', onClick);
    }, []);

    // On route change: #hash target pe scroll, nahi to top.
    useEffect(() => {
        if (location.hash) {
            const id = location.hash.slice(1);
            const tryScroll = (attempts = 0) => {
                const target = document.getElementById(id);
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                } else if (attempts < 10) {
                    setTimeout(() => tryScroll(attempts + 1), 60);
                }
            };
            tryScroll();
        } else {
            window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
        }
    }, [location.pathname, location.hash]);

    return (
        <div className="sf-home">
            {/* Accessibility Skip Link */}
            <a href="#main" className="fixed left-4 top-[-100px] z-[10000] rounded-[10px] bg-gold px-5 py-3 font-sans text-sm font-bold text-chalk transition-[top] duration-200 focus:top-4">
                Skip to main content
            </a>

            {/* Scroll Progress Bar */}
            <div className="fixed left-0 top-0 z-[2000] h-[3px] bg-gradient-to-r from-gold via-green to-gold-deep transition-[width] duration-100 ease-linear" style={{ width: `${progress}%` }}></div>

            {showCursor && (
                <Suspense fallback={null}>
                    <CustomCursor />
                </Suspense>
            )}

            <Navbar />

            <main id="main" className="pt-[84px]">
                <Outlet />
            </main>

            <Suspense fallback={<div style={{ minHeight: 400 }} />}>
                <Footer />
            </Suspense>
            <ScrollTopButton show={showScrollTop} />
            <WhatsAppFloat />
        </div>
    );
}