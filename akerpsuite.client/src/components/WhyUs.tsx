import Reveal from './Reveal'
import TiltCard from './TiltCard'
import { whyCards } from '../data/siteData'

export default function WhyUs() {
    return (
        <section
            id="why"
            className="relative overflow-hidden bg-chalk py-16 sm:py-24 md:py-[112px]"
            style={{
                backgroundImage:
                    'repeating-linear-gradient(0deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 1px, transparent 1px, transparent 56px), repeating-linear-gradient(90deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 1px, transparent 1px, transparent 56px), repeating-linear-gradient(0deg, rgba(228,255,78,0.06) 0px, rgba(228,255,78,0.06) 1px, transparent 1px, transparent 14px)',
                backgroundPosition: '-1px -1px',
            }}
        >
            {/* ambient panel-glint glow, upper right */}
            <div
                className="pointer-events-none absolute -right-[10%] -top-[20%] z-0 h-[520px] w-[520px] rounded-full opacity-60 blur-[90px]"
                style={{ background: 'radial-gradient(circle, rgba(228,255,78,0.22), transparent 70%)' }}
            ></div>

            <div className="container relative z-[1] mx-auto max-w-[1240px] px-5 sm:px-7">
                {/* ── Header ── */}
                <Reveal className="mb-10 grid grid-cols-1 items-end gap-8 sm:mb-14 sm:gap-10 md:mb-16 md:grid-cols-[1.15fr_auto_1fr]">
                    <div>
                        <p className="mb-[18px] flex items-center gap-2.5 font-mono text-[0.74rem] font-medium uppercase tracking-[0.14em] text-gold-deep before:inline-block before:h-px before:w-[22px] before:bg-gold-deep">
                            Vision &amp; Mission
                        </p>
                        <h2 className="font-display text-[clamp(2.1rem,4.4vw,3.3rem)] font-bold leading-[1.06] tracking-[-0.015em] text-charcoal">
                            Enhancing ideas
                            <br />
                            with{' '}
                            <span className="relative inline-block whitespace-nowrap">
                                <span
                                    className="absolute inset-x-0 bottom-[0.08em] top-[0.42em] -z-10 -rotate-1 rounded-sm bg-gold/45"
                                    aria-hidden="true"
                                ></span>
                                solar energy
                            </span>
                        </h2>
                    </div>

                    <div className="hidden -rotate-2 md:block">
                        <div className="relative h-[136px] w-[224px] shrink-0 overflow-hidden rounded-2xl border-[3px] border-paper bg-charcoal shadow-card">
                            <img
                                className="h-full w-full object-cover"
                                src="https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=440&q=75&auto=format&fit=crop"
                                alt="Technician inspecting solar panels in the mountains"
                                loading="lazy"
                                onError={(e) => {
                                    e.currentTarget.parentElement!.style.background = 'linear-gradient(135deg,#E4FF4E,#08090D)'
                                    e.currentTarget.remove()
                                }}
                            />
                            <span className="absolute bottom-2 left-2 rounded-full bg-charcoal/80 px-2.5 py-1 font-mono text-[0.58rem] uppercase tracking-[0.1em] text-chalk backdrop-blur-sm">
                                Sunder Nagar, HP
                            </span>
                        </div>
                    </div>

                    <p className="max-w-[520px] font-sans text-base leading-[1.75] text-slate md:justify-self-end md:text-[1.05rem]">
                        Incorporated in 2023, AKS Solar Systems Private Limited designs, manufactures, installs, and
                        maintains solar energy systems — with a mission to empower lives through sustainable, affordable,
                        and innovative energy solutions.
                    </p>
                </Reveal>

                {/* ── Bus-bar: a wired string, echoing how PV cells connect in series ── */}
                <div className="mb-0 hidden items-center px-2 sm:flex" aria-hidden="true">
                    {whyCards.map((card, i) => (
                        <div key={card.title} className="flex flex-1 items-center last:flex-none last:w-0">
                            <span className="h-2.5 w-2.5 shrink-0 rotate-45 border-[1.5px] border-gold-deep bg-chalk"></span>
                            {i < whyCards.length - 1 && (
                                <span className="mx-1.5 h-px flex-1 bg-gradient-to-r from-gold-deep/70 via-gold/40 to-gold-deep/70"></span>
                            )}
                        </div>
                    ))}
                </div>

                {/* ── Cards ── */}
                <div className="grid grid-cols-1 gap-px overflow-hidden rounded-b-2xl bg-line-strong sm:grid-cols-2 sm:rounded-2xl lg:grid-cols-4">
                    {whyCards.map((card, i) => (
                        <Reveal key={card.title} delay={(i % 4) + 1}>
                            <TiltCard maxTilt={8} className="group relative h-full bg-paper p-[28px_22px] transition-colors duration-300 hover:bg-charcoal sm:p-[38px_28px]"
                                style={{ clipPath: 'polygon(0 0, calc(100% - 22px) 0, 100% 22px, 100% 100%, 0 100%)' }}
                            >
                                <span
                                    className="absolute right-0 top-0 border-b-[22px] border-l-[22px] border-b-transparent border-l-gold/25 transition-colors duration-300 group-hover:border-l-gold"
                                    aria-hidden="true"
                                ></span>

                                <div
                                    className="mb-6 flex h-[50px] w-[50px] items-center justify-center bg-gold/10 text-[1.2rem] text-gold-deep transition-colors duration-300 group-hover:bg-gold/15 group-hover:text-gold"
                                    style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
                                >
                                    <i className={`fas ${card.icon}`}></i>
                                </div>

                                <div className="mb-3 font-display text-[1.1rem] font-bold text-charcoal transition-colors duration-300 group-hover:text-chalk">
                                    {card.title}
                                </div>
                                <p className="text-[0.92rem] leading-[1.7] text-slate transition-colors duration-300 group-hover:text-chalk/70">
                                    {card.text}
                                </p>
                            </TiltCard>
                        </Reveal>
                    ))}
                </div>
            </div>
        </section>
    )
}