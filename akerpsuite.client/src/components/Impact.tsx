import Reveal from './Reveal'
import { useCountUp } from '../hooks/useCountUp'
import { impactStats } from '../data/siteData'

function StatCell({ target, label }: { target: number; label: string }) {
    const [ref, value] = useCountUp(target)
    return (
        <div
            className="group relative bg-paper px-[18px] py-8 text-center transition-colors duration-300 hover:bg-gold/[0.08] dark:bg-[#12131C] dark:hover:bg-gold/[0.08]"
            style={{ clipPath: 'polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 0 100%)' }}
        >
            <span
                className="absolute right-0 top-0 border-b-[14px] border-l-[14px] border-b-transparent border-l-gold/25 transition-colors duration-300 group-hover:border-l-gold dark:border-l-[#00F0C8]/25 dark:group-hover:border-l-gold"
                aria-hidden="true"
            ></span>
            <div ref={ref} className="font-display text-[1.7rem] font-bold leading-none text-charcoal dark:text-white">{value}</div>
            <div className="mt-2 font-mono text-[0.64rem] uppercase leading-[1.5] tracking-wide text-slate dark:text-chalk/50">{label}</div>
        </div>
    )
}

function HeroCounter({ target }: { target: number }) {
    const [ref, value] = useCountUp(target)
    return <span ref={ref}>{value}</span>
}

export default function Impact() {
    return (
        <section
            id="impact"
            className="relative overflow-hidden border-y border-line py-24 md:py-[104px] bg-paper dark:border-white/10 dark:bg-[#0E0F16]"
        >
            {/* circuit pattern — charcoal strokes in light mode, teal in dark mode. Two layers, one shown at a time. */}
            <div
                className="pointer-events-none absolute inset-0 z-0 block dark:hidden"
                style={{
                    backgroundImage:
                        "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'%3E%3Cg fill='none' stroke='%231A1A1F' stroke-opacity='0.08' stroke-width='1.5'%3E%3Cpath d='M0 20H40V60H80V100H120'/%3E%3Cpath d='M0 90H30V50H70V10H120'/%3E%3Ccircle cx='40' cy='60' r='3'/%3E%3Ccircle cx='80' cy='100' r='3'/%3E%3Ccircle cx='30' cy='50' r='3'/%3E%3Ccircle cx='70' cy='10' r='3'/%3E%3C/g%3E%3C/svg%3E\")",
                    backgroundSize: '120px 120px',
                }}
            ></div>
            <div
                className="pointer-events-none absolute inset-0 z-0 hidden dark:block"
                style={{
                    backgroundImage:
                        "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'%3E%3Cg fill='none' stroke='%2300F0C8' stroke-opacity='0.10' stroke-width='1.5'%3E%3Cpath d='M0 20H40V60H80V100H120'/%3E%3Cpath d='M0 90H30V50H70V10H120'/%3E%3Ccircle cx='40' cy='60' r='3'/%3E%3Ccircle cx='80' cy='100' r='3'/%3E%3Ccircle cx='30' cy='50' r='3'/%3E%3Ccircle cx='70' cy='10' r='3'/%3E%3C/g%3E%3C/svg%3E\")",
                    backgroundSize: '120px 120px',
                }}
            ></div>

            {/* photo + glow parallax layers, targeted by useParallax() via #impact selector */}
            <div
                className="pointer-events-none absolute -top-[8%] left-0 right-0 -bottom-[8%] z-0 opacity-[0.05] dark:opacity-[0.07] [mix-blend-mode:luminosity]"
                style={{ background: "url('https://images.unsplash.com/photo-1509391366360-2e959784a276?w=1400&q=60&auto=format&fit=crop') center/cover", transform: 'translateY(var(--parallax-y, 0px))' }}
            ></div>
            <div
                className="pointer-events-none absolute -top-[180px] -right-[180px] z-[1] h-[480px] w-[480px] rounded-full"
                style={{ background: 'radial-gradient(circle, rgba(255,77,46,0.14), transparent 70%)', transform: 'translateY(var(--parallax-y-slow, 0px))' }}
            ></div>
            <div
                className="pointer-events-none absolute -bottom-[160px] -left-[160px] z-[1] h-[420px] w-[420px] rounded-full opacity-60 dark:opacity-100"
                style={{ background: 'radial-gradient(circle, rgba(0,240,200,0.12), transparent 70%)', transform: 'translateY(var(--parallax-y-slow, 0px))' }}
            ></div>

            <div className="container relative z-[2] mx-auto max-w-[1240px] px-7">
                <Reveal>
                    <p className="mb-[18px] flex items-center gap-2.5 font-mono text-[0.74rem] font-medium uppercase tracking-[0.14em] text-gold-deep before:inline-block before:h-px before:w-[22px] before:bg-gold-deep dark:text-gold dark:before:bg-gold">
                        Our Reach
                    </p>
                    <h2 className="font-display text-[clamp(2rem,4vw,3.1rem)] font-bold leading-[1.08] tracking-[-0.01em] text-charcoal dark:text-gold-deep">
                        Trusted across
                        <br />
                        <span className="relative inline-block whitespace-nowrap">
                            <span
                                className="absolute inset-x-0 bottom-[0.1em] top-[0.44em] -z-10 -rotate-1 rounded-sm bg-gold/35 dark:bg-gold/25"
                                aria-hidden="true"
                            ></span>
                            <span className="text-gold-deep dark:text-gold">North India</span>
                        </span>
                    </h2>
                </Reveal>

                <Reveal className="mb-10 grid grid-cols-1 items-end gap-10 border-b border-line pb-10 text-left md:grid-cols-[1fr_auto] dark:border-white/10" delay={1}>
                    <p className="max-w-[520px] font-sans text-base leading-[1.75] text-white md:mt-[18px] md:text-[1.05rem] dark:text-chalk/60">
                        Based in Sunder Nagar, Mandi, Himachal Pradesh, AKS Solar Systems has delivered solar power plants,
                        street lights, and geysers for clients across multiple states.
                    </p>
                    <div className="text-left md:text-right">
                        <div className="font-display text-[clamp(4.5rem,9vw,7.5rem)] font-bold leading-[0.85] text-gold-deep dark:text-gold">
                            <HeroCounter target={6} />
                        </div>
                        <div className="mt-2 font-mono text-[0.8rem] uppercase tracking-[0.08em] text-white dark:text-chalk/50">
                            Solar service categories
                        </div>
                    </div>
                </Reveal>

                {/* bus-bar: gold in light mode (matches the panel-cell wiring elsewhere), teal in dark mode (network/night-ops feel) */}
                <div className="mb-0 hidden items-center sm:flex" aria-hidden="true">
                    {impactStats.map((stat, i) => (
                        <div key={stat.label} className="flex flex-1 items-center last:flex-none last:w-0">
                            <span className="h-2 w-2 shrink-0 rotate-45 border-[1.5px] border-gold-deep/60 bg-paper dark:border-[#00F0C8]/60 dark:bg-[#0E0F16]"></span>
                            {i < impactStats.length - 1 && (
                                <span className="mx-1.5 h-px flex-1 bg-gradient-to-r from-gold-deep/40 via-line-strong to-gold-deep/40 dark:from-[#00F0C8]/40 dark:via-white dark:to-[#00F0C8]/40"></span>
                            )}
                        </div>
                    ))}
                </div>

                <Reveal as="div" className="grid grid-cols-2 gap-px overflow-hidden rounded-b-2xl bg-line-strong sm:grid-cols-3 sm:rounded-2xl lg:grid-cols-5 dark:bg-white/20" delay={2}>
                    {impactStats.map((stat) => (
                        <StatCell key={stat.label} target={stat.target} label={stat.label} />
                    ))}
                </Reveal>
            </div>
        </section>
    )
}