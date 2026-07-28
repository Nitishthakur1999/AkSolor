import Reveal from './Reveal'
import TiltCard from './TiltCard'
import { services } from '../data/siteData'

export default function Services() {
    return (
        <section
            id="services"
            className="border-y border-line bg-paper py-24 md:py-[104px]"
            style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.08) 1.2px, transparent 1.2px)', backgroundSize: '22px 22px' }}
        >
            <div className="container mx-auto max-w-[1240px] px-7">
                <Reveal className="relative mb-16 grid grid-cols-1 items-end gap-8 lg:grid-cols-[1.3fr_0.7fr]">
                    <div>
                        <p className="mb-[18px] flex items-center gap-2.5 font-mono text-[0.74rem] font-medium uppercase tracking-[0.14em] text-gold-deep before:inline-block before:h-px before:w-[22px] before:bg-gold-deep">
                            What We Do
                        </p>
                        <h2 className="font-display text-[clamp(2rem,4vw,3.1rem)] font-bold leading-[1.08] tracking-[-0.01em] text-charcoal">
                            Solar solutions for{' '}
                            <span className="relative inline-block whitespace-nowrap">
                                <span
                                    className="absolute inset-x-0 bottom-[0.08em] top-[0.42em] -z-10 rotate-1 rounded-sm bg-gold/45"
                                    aria-hidden="true"
                                ></span>
                                every need
                            </span>
                        </h2>
                        <p className="mt-[18px] max-w-[460px] font-sans text-base leading-[1.75] text-slate md:text-[1.05rem]">
                            From rooftop systems to ground-mounted power plants — six ways we put the sun to work.
                        </p>
                    </div>
                    <div
                        className="hidden text-right font-display text-[clamp(5rem,11vw,9rem)] font-bold leading-[0.8] text-transparent select-none lg:block"
                        style={{ WebkitTextStroke: '1.5px rgba(255,255,255,0.14)' }}
                    >
                        0<span style={{ WebkitTextStroke: '1.5px #E4FF4E' }}>6</span>
                    </div>
                </Reveal>

                {/* bus-bar: same wired-string motif used across the site, ties this grid back to the panel-cell system */}
                <div className="mb-8 hidden items-center sm:flex" aria-hidden="true">
                    {services.map((s, i) => (
                        <div key={s.title} className="flex flex-1 items-center last:flex-none last:w-0">
                            <span className="h-2 w-2 shrink-0 rotate-45 border-[1.5px] border-gold-deep bg-paper"></span>
                            {i < services.length - 1 && (
                                <span className="mx-1.5 h-px flex-1 bg-gradient-to-r from-gold-deep/60 via-line-strong to-gold-deep/60"></span>
                            )}
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {services.map((s, i) => (
                        <Reveal key={s.title} delay={(i % 3) + 1}>
                            <TiltCard
                                maxTilt={7}
                                className="group relative h-full overflow-hidden border border-line bg-chalk transition-all duration-300 hover:-translate-y-1.5 hover:border-line-strong hover:shadow-card"
                                style={{ clipPath: 'polygon(0 0, calc(100% - 24px) 0, 100% 24px, 100% 100%, 0 100%)' }}
                            >
                                <span
                                    className="absolute right-0 top-0 z-10 border-b-[24px] border-l-[24px] border-b-transparent border-l-gold/30 transition-colors duration-300 group-hover:border-l-gold"
                                    aria-hidden="true"
                                ></span>

                                <div className="relative h-[168px] overflow-hidden bg-charcoal">
                                    <img
                                        src={s.img}
                                        alt={s.title}
                                        loading="lazy"
                                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.06]"
                                        onError={(e) => { (e.currentTarget.parentElement as HTMLElement).style.background = s.fallback; e.currentTarget.remove() }}
                                    />
                                    <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.55) 100%)' }}></div>
                                    <div
                                        className="absolute -bottom-[23px] left-6 flex h-[52px] w-[52px] items-center justify-center border-[3px] border-chalk text-[1.2rem] text-paper shadow-[0_8px_20px_rgba(0,0,0,0.45)]"
                                        style={{ background: s.iconBg, clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
                                    >
                                        <i className={`fas ${s.icon}`}></i>
                                    </div>
                                </div>
                                <div className="border-t border-dashed border-line p-9 pt-9 pb-8">
                                    <span className="mb-3.5 block font-mono text-[0.68rem] uppercase tracking-[0.08em] text-slate">{s.tag}</span>
                                    <div className="mb-3 font-display text-[1.12rem] font-bold text-charcoal">{s.title}</div>
                                    <p className="text-[0.9rem] leading-[1.7] text-slate">{s.desc}</p>
                                </div>
                            </TiltCard>
                        </Reveal>
                    ))}
                </div>
            </div>
        </section>
    )
}