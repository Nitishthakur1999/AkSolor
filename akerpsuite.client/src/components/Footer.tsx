import { Link } from 'react-router-dom'
import { ArrowUp } from 'lucide-react'
import logo from '../assets/logo.png'
import { CONTACT, footerLinks } from '../data/siteData'

const FACEBOOK_URL = 'https://www.facebook.com/share/1BPxRmiKBy/'
const INSTAGRAM_URL = 'https://www.instagram.com/aks_solar_systems_pvt_ltd'
const LINKEDIN_URL = 'https://www.linkedin.com/in/aks-solar'

export default function Footer() {
    return (
        <footer className="relative overflow-hidden border-t border-line bg-paper text-charcoal">
            {/* dotted texture — uses the --color-line var directly, so it re-tints itself in dark mode too */}
            <div
                className="pointer-events-none absolute inset-0"
                style={{ backgroundImage: 'radial-gradient(circle, var(--color-line) 1.2px, transparent 1.2px)', backgroundSize: '24px 24px' }}
                aria-hidden="true"
            ></div>
            {/* top gold hairline */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold to-transparent" aria-hidden="true"></div>
            {/* faint oversized glyph watermark, echoes CTA / Testimonials */}
            <span
                aria-hidden="true"
                className="pointer-events-none absolute -bottom-16 -right-6 select-none font-display text-[11rem] font-bold leading-none text-gold/[0.06] md:text-[15rem]"
            >
                {'\u2600'}
            </span>

            <div className="container relative mx-auto max-w-[1240px] px-6 pb-7 pt-20 sm:px-7">
                <div className="mb-14 grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_0.8fr_0.8fr_1.4fr] lg:gap-10">
                    <div>
                        <Link to="/" className="mb-4 flex items-center">
                            <img
                                src={logo}
                                alt="AKS Solar Systems Private Limited"
                                className="block h-[52px] w-auto dark:brightness-0 dark:invert"
                            />
                        </Link>
                        <p className="max-w-[280px] text-[0.88rem] leading-[1.8] text-slate">
                            Enhancing ideas with solar energy from Sunder Nagar, Mandi. Incorporated 2023, serving clients
                            across North India.
                        </p>
                        <div className="mt-6 flex gap-2.5">
                            <a
                            href={FACEBOOK_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex h-[38px] w-[38px] items-center justify-center border border-line-strong text-charcoal-soft transition-colors duration-300 hover:border-gold hover:bg-gold hover:text-chalk"
                            style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
                            aria-label="Facebook"
                            >
                            <i className="fab fa-facebook-f text-[0.85rem]"></i>
                        </a>
                        <a
                        href={INSTAGRAM_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex h-[38px] w-[38px] items-center justify-center border border-line-strong text-charcoal-soft transition-colors duration-300 hover:border-gold hover:bg-gold hover:text-chalk"
                        style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
                        aria-label="Instagram"
                            >
                        <i className="fab fa-instagram text-[0.85rem]"></i>
                    </a>
                        <a
                    href={LINKEDIN_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-[38px] w-[38px] items-center justify-center border border-line-strong text-charcoal-soft transition-colors duration-300 hover:border-gold hover:bg-gold hover:text-chalk"
                    style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
                    aria-label="LinkedIn"
                            >
                    <i className="fab fa-linkedin-in text-[0.85rem]"></i>
                </a>
                <a
                href={CONTACT.youtube}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-[38px] w-[38px] items-center justify-center border border-line-strong text-charcoal-soft transition-colors duration-300 hover:border-gold hover:bg-gold hover:text-chalk"
                style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
                aria-label="YouTube"
                            >
                <i className="fab fa-youtube text-[0.85rem]"></i>
            </a>
            <a
            href={CONTACT.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-[38px] w-[38px] items-center justify-center border border-line-strong text-charcoal-soft transition-colors duration-300 hover:border-gold hover:bg-gold hover:text-chalk"
            style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
            aria-label="WhatsApp"
                            >
            <i className="fab fa-whatsapp text-[0.85rem]"></i>
        </a>
                        </div >
                    </div >

    {
        Object.entries(footerLinks).map(([group, items]) => (
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
                                <span className="h-px w-0 bg-gold-deep transition-all duration-300 group-hover:w-3"></span>
                                {item.label}
                            </Link>
                        </li>
                    ))}
                </ul>
            </div>
        ))
    }

        < div >
                        <div className="mb-[18px] flex items-center gap-2.5 font-mono text-[0.72rem] uppercase tracking-[0.14em] text-gold-deep">
                            <span aria-hidden="true" className="h-px w-[14px] bg-gold-deep" />
                            Follow Us
                        </div>
                        <div
                            className="fb-page"
                            data-href={FACEBOOK_URL}
                            data-tabs="timeline"
                            data-width="280"
                            data-height="300"
                            data-small-header="true"
                            data-adapt-container-width="true"
                            data-hide-cover="false"
                            data-show-facepile="false"
                        >
                            <blockquote cite={FACEBOOK_URL} className="fb-xfbml-parse-ignore">
                                <a href={FACEBOOK_URL}>AKS Solar Systems</a>
                            </blockquote>
                        </div>
                    </div >
                </div >

        <div className="flex flex-col items-center gap-4 border-t border-dashed border-line pt-7 text-center text-[0.78rem] text-slate sm:flex-row sm:justify-between sm:text-left">
            <span>{'\u00A9'} {new Date().getFullYear()} AKS Solar Systems Private Limited. All rights reserved.</span>
            <span className="flex items-center gap-5">
                <span>Designed in Himachal Pradesh, India {'\u00B7'} CIN U35105HP2023PTC010123</span>
                <a
                href="#top"
                aria-label="Back to top"
                className="flex h-8 w-8 shrink-0 items-center justify-center border border-line-strong text-charcoal-soft transition-colors hover:border-gold hover:bg-gold hover:text-chalk"
                        >
                <ArrowUp size={14} />
            </a>
        </span>
                </div >
            </div >
        </footer >
    )
}