import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import logo from '../assets/logo.png'
import { CONTACT, footerLinks } from '../data/siteData'

const FACEBOOK_URL = 'https://www.facebook.com/akssolarsystemsprivatelimited/'
const INSTAGRAM_URL = 'https://www.instagram.com/aks_solar_systems_pvt_ltd'
const LINKEDIN_URL = 'https://www.linkedin.com/in/aks-solar'

const FB_EMBED_SRC =
    'https://www.facebook.com/plugins/page.php?href=' +
    encodeURIComponent(FACEBOOK_URL) +
    '&tabs=timeline&width=280&height=350&small_header=true&adapt_container_width=true&hide_cover=false&show_facepile=false'

const socialLinkCls =
    'flex h-9 w-9 sm:h-[38px] sm:w-[38px] shrink-0 items-center justify-center border border-line-strong text-charcoal-soft transition-colors duration-300 hover:border-gold hover:bg-gold hover:text-chalk'
const socialClipStyle = { clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }

// Facebook feed: SDK nahi, sirf iframe, aur wo bhi user click karne par.
function FacebookFeed() {
    const [load, setLoad] = useState(false)

    return (
        <div className="w-full max-w-[280px] overflow-hidden" style={{ minHeight: 350 }}>
            {load ? (
                <iframe
                    title="AKS Solar Systems on Facebook"
                    src={FB_EMBED_SRC}
                    width="280"
                    height="350"
                    style={{ border: 'none', overflow: 'hidden' }}
                    loading="lazy"
                    allow="encrypted-media"
                />
            ) : (
                <button
                    type="button"
                    onClick={() => setLoad(true)}
                    className="flex h-[350px] w-full flex-col items-center justify-center gap-3 border border-line-strong bg-chalk px-4 text-center transition-colors hover:border-gold"
                >
                    <i className="fab fa-facebook-f text-2xl text-gold-deep" aria-hidden="true" />
                    <span className="font-sans text-sm font-semibold text-charcoal">Load our Facebook feed</span>
                    <span className="text-xs text-charcoal-soft">Click to load. Privacy-friendly.</span>
                </button>
            )}
        </div>
    )
}

export default function Footer() {
    const [visitorCount, setVisitorCount] = useState<number | null>(null)

    // Visit track + count: page paint ke baad idle me, ek ke baad ek.
    // track-visit session me sirf ek baar (har route pe count nahi badhega).
    useEffect(() => {
        let cancelled = false

        const run = async () => {
            try {
                let tracked = false
                try {
                    tracked = sessionStorage.getItem('aks-visit-tracked') === '1'
                } catch { /* private mode */ }

                if (!tracked) {
                    await fetch('/api/public/track-visit', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ pagePath: window.location.pathname }),
                        keepalive: true,
                    }).catch(() => { })
                    try {
                        sessionStorage.setItem('aks-visit-tracked', '1')
                    } catch { /* ignore */ }
                }

                const res = await fetch('/api/public/visitor-count')
                const data = await res.json()
                if (!cancelled) setVisitorCount(data.data ?? data.Data ?? null)
            } catch { /* footer count optional hai */ }
        }

        const w = window as Window & {
            requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number
            cancelIdleCallback?: (id: number) => void
        }
        let idleId: number | undefined
        let timerId: number | undefined

        if (w.requestIdleCallback) idleId = w.requestIdleCallback(run, { timeout: 5000 })
        else timerId = window.setTimeout(run, 3000)

        return () => {
            cancelled = true
            if (idleId !== undefined) w.cancelIdleCallback?.(idleId)
            if (timerId !== undefined) window.clearTimeout(timerId)
        }
    }, [])

    return (
        <footer className="relative overflow-hidden border-t border-line bg-paper text-charcoal">
            <div
                className="pointer-events-none absolute inset-0"
                style={{ backgroundImage: 'radial-gradient(circle, var(--color-line) 1.2px, transparent 1.2px)', backgroundSize: '24px 24px' }}
                aria-hidden="true"
            />
            {/* top gold hairline */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold to-transparent" aria-hidden="true" />

            <div className="container relative mx-auto max-w-[1240px] px-5 pb-7 pt-14 sm:px-7 sm:pt-20">
                <div className="mb-10 grid grid-cols-1 gap-10 sm:mb-14 sm:grid-cols-2 sm:gap-x-8 sm:gap-y-12 lg:grid-cols-[1.3fr_0.7fr_0.9fr_0.7fr_1.1fr] lg:gap-8">
                    {/* Brand + about + socials */}
                    <div className="sm:col-span-2 lg:col-span-1">
                        <Link to="/" className="mb-4 flex items-center">
                            <img
                                src={logo}
                                alt="AKS Solar Systems Private Limited"
                                width={96}
                                height={96}
                                loading="lazy"
                                decoding="async"
                                className="block h-24 w-auto sm:h-22 object-contain"
                            />
                        </Link>
                        <p className="max-w-[320px] text-[0.88rem] leading-[1.8] text-slate sm:max-w-[280px]">
                            Enhancing ideas with solar energy from Sunder Nagar, Mandi. Incorporated 2023, serving clients
                            across North India.
                        </p>
                        <div className="mt-4 flex flex-col gap-2.5 max-w-[320px] sm:max-w-[280px]">
                            <div className="flex items-start gap-2.5 text-[0.85rem] leading-[1.6] text-charcoal-soft">
                                <i className="fas fa-location-dot mt-1 shrink-0 text-gold-deep" />
                                <span>
                                    HOUSE NO. 67-A/4, NH-21, DISTT, near IDBI BANK, Bhojpur, Sundar Nagar,
                                    Himachal Pradesh 175002
                                </span>
                            </div>
                            <a
                                href="tel:+918988353500"
                                className="flex items-center gap-2.5 text-[0.85rem] text-charcoal-soft transition-colors hover:text-gold-deep"
                            >
                                <i className="fas fa-phone shrink-0 text-gold-deep" />
                                <span>+91 89883 53500</span>
                            </a>
                            <div className="flex items-start gap-2.5 text-[0.85rem] leading-[1.6] text-charcoal-soft">
                                <i className="fas fa-id-card mt-1 shrink-0 text-gold-deep" />
                                <span>MSME Reg. No.: UDYAM-HP-08-0011484</span>
                            </div>
                        </div>
                        <div className="mt-6 flex flex-wrap gap-2.5">
                            <a href={FACEBOOK_URL} target="_blank" rel="noopener noreferrer" className={socialLinkCls} style={socialClipStyle} aria-label="Facebook">
                                <i className="fab fa-facebook-f text-[0.8rem] sm:text-[0.85rem]" />
                            </a>
                            <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className={socialLinkCls} style={socialClipStyle} aria-label="Instagram">
                                <i className="fab fa-instagram text-[0.8rem] sm:text-[0.85rem]" />
                            </a>
                            <a href={LINKEDIN_URL} target="_blank" rel="noopener noreferrer" className={socialLinkCls} style={socialClipStyle} aria-label="LinkedIn">
                                <i className="fab fa-linkedin-in text-[0.8rem] sm:text-[0.85rem]" />
                            </a>
                            <a href={CONTACT.youtube} target="_blank" rel="noopener noreferrer" className={socialLinkCls} style={socialClipStyle} aria-label="YouTube">
                                <i className="fab fa-youtube text-[0.8rem] sm:text-[0.85rem]" />
                            </a>
                            <a href={CONTACT.whatsapp} target="_blank" rel="noopener noreferrer" className={socialLinkCls} style={socialClipStyle} aria-label="WhatsApp">
                                <i className="fab fa-whatsapp text-[0.8rem] sm:text-[0.85rem]" />
                            </a>
                        </div>
                    </div>

                    {/* Link groups */}
                    {Object.entries(footerLinks).map(([group, items]) => (
                        <div key={group}>
                            <div className="mb-[18px] flex items-center gap-2.5 font-mono text-[0.72rem] uppercase tracking-[0.14em] text-gold-deep">
                                <span aria-hidden="true" className="h-px w-[14px] bg-gold-deep" />
                                {group}
                            </div>
                            <ul className="flex list-none flex-col gap-3">
                                {items.map((item) => (
                                    <li key={item.label}>
                                        <Link
                                            to={item.href}
                                            className="group inline-flex items-center gap-1.5 text-[0.9rem] text-charcoal-soft transition-colors hover:text-gold-deep"
                                        >
                                            <span className="h-px w-0 bg-gold-deep transition-all duration-300 group-hover:w-3" />
                                            {item.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}

                    {/* Follow us */}
                    <div className="sm:col-span-2 lg:col-span-1">
                        <div className="mb-[18px] flex items-center gap-2.5 font-mono text-[0.72rem] uppercase tracking-[0.14em] text-gold-deep">
                            <span aria-hidden="true" className="h-px w-[14px] bg-gold-deep" />
                            Follow Us
                        </div>
                        <FacebookFeed />
                    </div>  
                </div>

                <div className="flex flex-col items-center gap-2 border-t border-dashed border-line pt-7 text-center text-[0.78rem] text-slate sm:flex-row sm:justify-center sm:gap-2">
                    <span>{'\u00A9'} 2026 AKS Solar Systems Private Limited. All rights reserved.</span>
                    <span className="hidden sm:inline">|</span>
                    <span>
                        Powered By{' '}
                        <a
                            href="https://www.appilogics.com/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-gold-deep transition-colors hover:underline"
                        >
                            Appilogics
                        </a>
                    </span>
                    {visitorCount !== null && (
                        <>
                            <span className="hidden sm:inline">|</span>
                            <span>
                                <i className="fas fa-eye mr-1 text-gold-deep" />
                                {visitorCount.toLocaleString('en-IN')} Visitors
                            </span>
                        </>
                    )}
                </div>
            </div>
        </footer>
    )
}