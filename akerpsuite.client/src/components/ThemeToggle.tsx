import { Sun, Moon } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

/**
 * Dark / light mode switch. `compact` renders a smaller icon-only pill for
 * tight spaces (mobile menu); default renders the desktop navbar version.
 */
export default function ThemeToggle({ compact = false, className = '' }) {
    const { theme, toggleTheme } = useTheme()
    const isLight = theme === 'light'

    const trackSize = compact ? 'h-9 w-[62px]' : 'h-10 w-[70px]'
    const knobSize = compact ? 'h-[28px] w-[28px]' : 'h-[32px] w-[32px]'
    const knobTravel = compact ? 'translate-x-[29px]' : 'translate-x-[33px]'
    const iconSize = compact ? 12 : 13
    const knobIconSize = compact ? 14 : 16

    return (
        <button
            type="button"
            role="switch"
            aria-checked={isLight}
            aria-label={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
            onClick={toggleTheme}
            className={`group relative shrink-0 rounded-full border border-line-strong bg-charcoal/[0.04] p-[3px] transition-colors duration-300 hover:border-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold ${trackSize} ${className}`}
        >
            {/* soft glow that follows the active side of the track */}
            <span
                aria-hidden="true"
                className={`pointer-events-none absolute inset-y-[3px] w-1/2 rounded-full bg-gold/[0.14] blur-[6px] transition-transform duration-300 ease-out ${
                    isLight ? 'translate-x-full' : 'translate-x-0'
                }`}
            />

            {/* track icons — the inactive one fades and shrinks slightly */}
            <Sun
                size={iconSize}
                strokeWidth={2.5}
                aria-hidden="true"
                className={`pointer-events-none absolute left-[9px] top-1/2 -translate-y-1/2 transition-all duration-300 ${
                    isLight ? 'scale-90 text-slate-light opacity-40' : 'text-gold opacity-100'
                }`}
            />
            <Moon
                size={iconSize}
                strokeWidth={2.5}
                aria-hidden="true"
                className={`pointer-events-none absolute right-[9px] top-1/2 -translate-y-1/2 transition-all duration-300 ${
                    isLight ? 'text-gold opacity-100' : 'scale-90 text-slate-light opacity-40'
                }`}
            />

            {/* sliding knob */}
            <span
                aria-hidden="true"
                className={`relative z-[1] flex items-center justify-center rounded-full bg-gradient-to-br from-gold-deep to-gold shadow-[0_2px_10px_rgba(224,66,31,0.4)] transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${knobSize} ${
                    isLight ? knobTravel : 'translate-x-0'
                }`}
            >
                <span
                    key={theme}
                    className="flex items-center justify-center text-chalk animate-[theme-pop_0.3s_ease-out]"
                >
                    {isLight ? (
                        <Sun size={knobIconSize} strokeWidth={2.75} />
                    ) : (
                        <Moon size={knobIconSize} strokeWidth={2.75} />
                    )}
                </span>
            </span>
        </button>
    )
}