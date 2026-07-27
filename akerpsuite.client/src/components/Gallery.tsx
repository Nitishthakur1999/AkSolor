import Reveal from './Reveal'
import { galleryItems } from '../data/siteData'

function hideOnError(e) {
    e.currentTarget.parentElement.style.background = 'var(--color-line-strong)'
    e.currentTarget.remove()
}

export default function Gallery() {
    return (
        <section
            id="gallery"
            className="relative overflow-hidden border-y border-line bg-mist py-24 md:py-[104px]"
            style={{ backgroundImage: 'radial-gradient(circle, var(--color-line) 1.2px, transparent 1.2px)', backgroundSize: '26px 26px' }}
        >
            {/* faint watermark, same family as CTA / Footer / PageHeader */}
            {/* <span
                aria-hidden="true"
                className="pointer-events-none absolute -left-10 -top-16 select-none font-display text-[11rem] font-bold leading-none text-gold/[0.07] md:text-[15rem]"
            >
                ☀
            </span> */}

            <div className="container relative mx-auto max-w-[1240px] px-7">
                <Reveal className="mb-14 flex flex-wrap items-end justify-between gap-6 border-b border-line pb-7">
                    <div>
                        <p className="mb-[18px] flex items-center gap-2.5 font-mono text-[0.74rem] font-medium uppercase tracking-[0.14em] text-gold-deep">
                            <span aria-hidden="true" className="h-px w-[22px]" />
                            Real Installs
                        </p>
                        <h2 className="font-display text-[clamp(2rem,4vw,3.1rem)] font-bold leading-[1.08] tracking-[-0.01em] text-charcoal">
                            Before &amp;{' '}
                            <span className="relative inline-block">
                                <span
                                    className="absolute inset-x-0 bottom-[0.08em] top-[0.42em] -z-10 -rotate-1 rounded-sm bg-gold/45"
                                    aria-hidden="true"
                                ></span>
                                after
                            </span>
                        </h2>
                    </div>
                    <div className="flex items-center gap-2.5 border border-line-strong bg-paper px-4 py-2.5 font-mono text-[0.74rem] uppercase tracking-[0.1em] text-slate">
                        <strong className="text-[1rem] text-gold-deep">{String(galleryItems.length).padStart(2, '0')}</strong>
                        project types shown
                    </div>
                </Reveal>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {galleryItems.map((item, i) => (
                        <Reveal
                            key={item.title}
                            className="group relative overflow-hidden border border-line border-l-[3px] border-l-gold bg-paper transition-all duration-300 hover:-translate-y-1.5 hover:border-l-gold-deep hover:shadow-card"
                            delay={i + 1}
                            style={{ clipPath: 'polygon(0 0, calc(100% - 22px) 0, 100% 22px, 100% 100%, 0 100%)' }}
                        >
                            {/* folded-corner accent, same trick as testimonial cards */}
                            <span
                                className="pointer-events-none absolute right-0 top-0 z-[4] border-b-[22px] border-l-[22px] border-b-transparent border-l-gold/25 transition-colors duration-300 group-hover:border-l-gold"
                                aria-hidden="true"
                            ></span>

                            <div className="relative grid h-[200px] grid-cols-2 overflow-hidden">
                                <div className="relative overflow-hidden">
                                    <img
                                        className="h-full w-full object-cover [filter:saturate(0.8)] transition-transform duration-500 group-hover:scale-[1.06]"
                                        src={item.before}
                                        alt={`Before: ${item.title}`}
                                        loading="lazy"
                                        onError={hideOnError}
                                    />
                                    <div className="pointer-events-none absolute inset-0 bg-charcoal/15"></div>
                                    <span className="absolute left-2.5 top-2.5 z-[2] border border-white/20 bg-charcoal/70 px-2.5 py-1 font-mono text-[0.62rem] uppercase tracking-[0.08em] text-chalk backdrop-blur-sm">
                                        Before
                                    </span>
                                </div>
                                <div className="relative overflow-hidden">
                                    <img
                                        className="h-full w-full object-cover [filter:saturate(1.1)] transition-transform duration-500 group-hover:scale-[1.06]"
                                        src={item.after}
                                        alt={`After: ${item.title}`}
                                        loading="lazy"
                                        onError={hideOnError}
                                    />
                                    <span className="absolute right-2.5 top-2.5 z-[2] bg-gold px-2.5 py-1 font-mono text-[0.62rem] font-bold uppercase tracking-[0.08em] text-chalk">
                                        After
                                    </span>
                                </div>

                                {/* center divider with a draggable-looking handle */}
                                <div className="absolute inset-y-0 left-1/2 z-[3] w-0.5 -translate-x-px bg-gold shadow-[0_0_0_3px_rgba(0,0,0,0.15)]"></div>
                                <div className="absolute left-1/2 top-1/2 z-[4] flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-gold bg-paper text-gold-deep opacity-0 shadow-soft transition-opacity duration-300 group-hover:opacity-100">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                        <path d="M8 7l-5 5 5 5M16 7l5 5-5 5" />
                                    </svg>
                                </div>
                            </div>

                            <div className="flex items-center justify-between gap-3 border-t border-dashed border-line px-6 pb-[26px] pt-5">
                                <div>
                                    <div className="mb-1 font-display text-base font-bold text-charcoal">{item.title}</div>
                                    <div className="font-mono text-[0.72rem] text-slate">{item.loc}</div>
                                </div>
                                <span className="flex h-8 w-8 shrink-0 items-center justify-center border border-line-strong text-charcoal-soft transition-colors duration-300 group-hover:border-gold-deep group-hover:text-gold-deep">
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M7 17L17 7M17 7H8M17 7v9" />
                                    </svg>
                                </span>
                            </div>
                        </Reveal>
                    ))}
                </div>
            </div>
        </section>
    )
}