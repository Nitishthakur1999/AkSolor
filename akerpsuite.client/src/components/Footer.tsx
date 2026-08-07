import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, ArrowUp } from 'lucide-react'
import logo from '../assets/logo.png'
import { CONTACT, footerLinks } from '../data/siteData'

export default function Footer() {
    const [newsletterSent, setNewsletterSent] = useState(false)

    function handleNewsletter(e) {
        e.preventDefault()
        setNewsletterSent(true)
        setTimeout(() => setNewsletterSent(false), 2500)
    }

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
                ☀
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
                                href={CONTACT.facebook}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex h-[38px] w-[38px] items-center justify-center border border-line-strong text-charcoal-soft transition-colors duration-300 hover:border-gold hover:bg-gold hover:text-chalk"
                                style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
                                aria-label="Facebook"
                            >
                                <i className="fab fa-facebook-f text-[0.85rem]"></i>
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
                        </div>
                    </div>

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
                                            <span className="h-px w-0 bg-gold-deep transition-all duration-300 group-hover:w-3"></span>
                                            {item.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}

                    <div>
                        <div className="mb-[18px] flex items-center gap-2.5 font-mono text-[0.72rem] uppercase tracking-[0.14em] text-gold-deep">
                            <span aria-hidden="true" className="h-px w-[14px] bg-gold-deep" />
                            Newsletter
                        </div>
                        <p className="mb-4 text-[0.85rem] leading-[1.65] text-slate">
                            Get solar tips, subsidy updates, and exclusive offers.
                        </p>
                        <form onSubmit={handleNewsletter} className="flex border border-line-strong bg-charcoal/[0.03] transition-colors focus-within:border-gold">
                            <input
                                type="email"
                                required
                                placeholder="Enter email"
                                className="w-full flex-1 bg-transparent px-4 py-[13px] font-sans text-[0.88rem] text-charcoal placeholder:text-slate-light focus:outline-none"
                            />
                            <button
                                type="submit"
                                className="whitespace-nowrap bg-gold px-6 py-[13px] font-sans text-[0.88rem] font-bold text-chalk transition-colors hover:bg-gold-deep"
                            >
                                {newsletterSent ? '✓' : 'Go'}
                            </button>
                        </form>
                        <Link
                            to="/contact"
                            className="mt-5 inline-flex items-center gap-1.5 text-[0.85rem] font-semibold text-charcoal transition-colors hover:text-gold-deep"
                        >
                            Request a free site survey <ArrowUpRight size={15} />
                        </Link>
                    </div>
                </div>

                <div className="flex flex-col items-center gap-4 border-t border-dashed border-line pt-7 text-center text-[0.78rem] text-slate sm:flex-row sm:justify-between sm:text-left">
                    <span>© {new Date().getFullYear()} AKS Solar Systems Private Limited. All rights reserved.</span>
                    <span className="flex items-center gap-5">
                        <span>Designed in Himachal Pradesh, India · CIN U35105HP2023PTC010123</span>
                        <a
                            href="#top"
                            aria-label="Back to top"
                            className="flex h-8 w-8 shrink-0 items-center justify-center border border-line-strong text-charcoal-soft transition-colors hover:border-gold hover:bg-gold hover:text-chalk"
                        >
                            <ArrowUp size={14} />
                        </a>
                    </span>
                </div>
            </div>
        </footer>
    )
}