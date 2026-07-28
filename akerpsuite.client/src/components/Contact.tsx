import { useRef, useState } from 'react'
import Reveal from './Reveal'
import { CONTACT } from '../data/siteData'
import { publicSiteService } from '../services/publicService'

const inputCls = 'w-full border border-line-strong bg-mist px-4 py-[13px] font-sans text-[0.9rem] text-charcoal transition-colors duration-200 placeholder:text-slate-light focus:border-gold-deep focus:bg-paper focus:outline-none'
const labelCls = 'mb-2 block font-mono text-[0.7rem] uppercase tracking-wide text-slate'

export default function Contact() {
    const formRef = useRef<HTMLFormElement | null>(null)
    const [submitLabel, setSubmitLabel] = useState("Send Enquiry — It's Free")
    const [sent, setSent] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState('')

    async function handleSubmit() {
        const form = formRef.current
        if (!form) return
        if (!form.checkValidity()) {
            form.reportValidity()
            return
        }

        setError('')
        setSubmitting(true)

        const fd = new FormData(form)
        const name = fd.get('name')?.toString().trim() || ''
        const phone = fd.get('phone')?.toString().trim() || ''
        const email = fd.get('email')?.toString().trim() || ''
        const location = fd.get('location')?.toString().trim() || ''
        const service = fd.get('service')?.toString().trim() || ''
        const budget = fd.get('budget')?.toString().trim() || ''
        const message = fd.get('message')?.toString().trim() || ''

        // Backend ContactQuery only has Name / Phone / Email / Subject / Message,
        // so fold the extra form fields (location, service, budget) into Subject/Message.
        const subject = service || 'General Enquiry'
        const fullMessage = [
            location && `Location: ${location}`,
            budget && `Monthly Bill: ${budget}`,
            message && `Message: ${message}`,
        ].filter(Boolean).join('\n')

        try {
            await publicSiteService.submitContactQuery({
                name,
                phone,
                email,
                subject,
                message: fullMessage || 'No additional message provided.',
            })

            setSubmitLabel("Enquiry sent — we'll call you soon")
            setSent(true)
            setTimeout(() => {
                setSubmitLabel("Send Enquiry — It's Free")
                setSent(false)
                form.reset()
            }, 4000)
        } catch (err: any) {
            setError(err?.message || 'Something went wrong. Please try again.')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <section
            id="contact"
            className="border-y border-line bg-paper py-24 md:py-[104px]"
            style={{ backgroundImage: 'radial-gradient(circle, var(--color-line) 1.2px, transparent 1.2px)', backgroundSize: '26px 26px' }}
        >
            <div className="container mx-auto max-w-[1240px] px-7">
                <Reveal>
                    <p className="mb-[18px] flex items-center gap-2.5 font-mono text-[0.74rem] font-medium uppercase tracking-[0.14em] text-gold-deep">
                        <span aria-hidden="true" className="h-px w-[22px] bg-gold-deep" />
                        Get In Touch
                    </p>
                    <h2 className="font-display text-[clamp(2rem,4vw,3.1rem)] font-bold leading-[1.08] tracking-[-0.01em] text-charcoal">
                        Request a{' '}
                        <span className="relative inline-block">
                            <span
                                className="absolute inset-x-0 bottom-[0.08em] top-[0.42em] -z-10 -rotate-1 rounded-sm bg-gold/45"
                                aria-hidden="true"
                            ></span>
                            free quote
                        </span>
                    </h2>
                </Reveal>

                <div className="mt-14 grid grid-cols-1 gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
                    {/* ---------- Info column ---------- */}
                    <Reveal delay={1}>
                        <div className="border border-line border-l-[3px] border-l-gold bg-chalk px-6 py-7">
                            <InfoRow icon="fa-map-marker-alt" label="Address">
                                {CONTACT.address1}<br />{CONTACT.address2}
                            </InfoRow>
                            <InfoRow icon="fa-phone-alt" label="Phone">
                                Tel: {CONTACT.tel}<br />Mobile: {CONTACT.mobiles}
                            </InfoRow>
                            <InfoRow icon="fa-envelope" label="Email">
                                {CONTACT.email}
                            </InfoRow>
                            <InfoRow icon="fa-clock" label="Working Hours">
                                {CONTACT.hours}
                            </InfoRow>
                            <InfoRow icon="fa-building" label="Sister Concern" last>
                                M/S Sharma Associates (Proprietorship Firm)<br />
                                Same address — Bhojpur, Sunder Nagar, Mandi, HP
                            </InfoRow>
                        </div>

                        <div className="mt-6 flex flex-wrap gap-2.5">
                            <Badge tone="gold">Incorporated 2023</Badge>
                            <Badge tone="green">CIN U35105HP2023PTC010123</Badge>
                            <Badge tone="slate">Pvt. Ltd. Company</Badge>
                        </div>

                        <div
                            className="relative mt-7 h-[220px] overflow-hidden border border-line-strong"
                            style={{ clipPath: 'polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 0 100%)' }}
                        >
                            <span
                                className="pointer-events-none absolute right-0 top-0 z-[2] border-b-[20px] border-l-[20px] border-b-transparent border-l-gold/30"
                                aria-hidden="true"
                            ></span>
                            <iframe
                                src={CONTACT.mapEmbed}
                                width="100%"
                                height="100%"
                                style={{ border: 0, display: 'block' }}
                                loading="lazy"
                                title="AKS Solar Systems location map"
                            />
                        </div>
                    </Reveal>

                    {/* ---------- Form column ---------- */}
                    <Reveal delay={2}>
                        <form
                            ref={formRef}
                            onSubmit={(e) => e.preventDefault()}
                            className="relative border border-line bg-chalk p-6 sm:p-8"
                            style={{ clipPath: 'polygon(0 0, calc(100% - 26px) 0, 100% 26px, 100% 100%, 0 100%)' }}
                        >
                            <span
                                className="pointer-events-none absolute right-0 top-0 z-[2] border-b-[26px] border-l-[26px] border-b-transparent border-l-gold/25"
                                aria-hidden="true"
                            ></span>

                            <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2">
                                <div>
                                    <label className={labelCls}>Your Name</label>
                                    <input name="name" type="text" className={inputCls} placeholder="Rajesh Thakur" required />
                                </div>
                                <div>
                                    <label className={labelCls}>Phone Number</label>
                                    <input name="phone" type="tel" className={inputCls} placeholder="+91-9805763000" required pattern="[0-9+\s-]{8,15}" />
                                </div>
                                <div>
                                    <label className={labelCls}>Email Address</label>
                                    <input name="email" type="email" className={inputCls} placeholder="you@example.com" />
                                </div>
                                <div>
                                    <label className={labelCls}>Location / State</label>
                                    <select name="location" className={inputCls} defaultValue="">
                                        <option value="">Select State</option>
                                        <option>Himachal Pradesh</option>
                                        <option>Uttar Pradesh</option>
                                        <option>Delhi / NCR</option>
                                        <option>Punjab</option>
                                        <option>Haryana</option>
                                        <option>Uttarakhand</option>
                                        <option>Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className={labelCls}>Service Required</label>
                                    <select name="service" className={inputCls} defaultValue="">
                                        <option value="">Select Service</option>
                                        <option>Solar Power Plant (On-Grid)</option>
                                        <option>Solar Power Plant (Off-Grid)</option>
                                        <option>Roof Top Solar Power Plant</option>
                                        <option>Ground Mounted Solar Power Project</option>
                                        <option>Solar Geyser</option>
                                        <option>Solar Street Light</option>
                                        <option>Construction / Civil Work</option>
                                        <option>Consultancy / Feasibility Study</option>
                                    </select>
                                </div>
                                <div>
                                    <label className={labelCls}>Monthly Bill (₹)</label>
                                    <select name="budget" className={inputCls} defaultValue="Under ₹1,000">
                                        <option>Under ₹1,000</option>
                                        <option>₹1,000 – ₹3,000</option>
                                        <option>₹3,000 – ₹7,000</option>
                                        <option>₹7,000 – ₹15,000</option>
                                        <option>Above ₹15,000</option>
                                    </select>
                                </div>
                                <div className="sm:col-span-2">
                                    <label className={labelCls}>Message</label>
                                    <textarea name="message" rows={4} className={inputCls} placeholder="Tell us about your property, current setup, or any questions…"></textarea>
                                </div>

                                {error && (
                                    <div className="sm:col-span-2 border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-600">
                                        {error}
                                    </div>
                                )}

                                <div className="sm:col-span-2">
                                    <button
                                        type="button"
                                        onClick={handleSubmit}
                                        disabled={submitting}
                                        className={`group flex w-full items-center justify-center gap-2.5 border py-[17px] font-sans text-[0.95rem] font-bold transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-70 ${sent
                                                ? 'border-green bg-green text-chalk'
                                                : 'border-charcoal bg-charcoal text-chalk hover:-translate-y-0.5 hover:border-gold-deep hover:bg-gold-deep'
                                            }`}
                                    >
                                        {sent && (
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M20 6L9 17l-5-5" />
                                            </svg>
                                        )}
                                        {submitting ? 'Sending…' : submitLabel}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </Reveal>
                </div>
            </div>
        </section>
    )
}

function InfoRow({
    icon,
    label,
    children,
    last = false,
}: {
    icon: string
    label: string
    children: React.ReactNode
    last?: boolean
}) {
    return (
        <div className={`flex items-start gap-4 ${last ? '' : 'mb-6 border-b border-dashed border-line pb-6'}`}>
            <div className="flex h-11 w-11 shrink-0 items-center justify-center border border-gold/25 bg-gold/10 text-base text-gold-deep">
                <i className={`fas ${icon}`}></i>
            </div>
            <div>
                <div className="mb-1 font-mono text-[0.7rem] uppercase tracking-wide text-slate">{label}</div>
                <div className="text-[0.96rem] font-medium leading-[1.5] text-charcoal">{children}</div>
            </div>
        </div>
    )
}

function Badge({ tone, children }: { tone: 'gold' | 'green' | 'slate'; children: React.ReactNode }) {
    const tones: Record<'gold' | 'green' | 'slate', string> = {
        gold: 'border-gold/35 bg-gold/10 text-gold-deep',
        green: 'border-green/35 bg-green/10 text-green',
        slate: 'border-slate/35 bg-slate/10 text-slate',
    }
    return (
        <span className={`border px-3.5 py-[7px] font-mono text-[0.68rem] tracking-wide ${tones[tone]}`}>
            {children}
        </span>
    )
}