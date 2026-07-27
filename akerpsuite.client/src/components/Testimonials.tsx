import Reveal from './Reveal'
import { testimonials } from '../data/siteData'

export default function Testimonials() {
    const track = [...testimonials, ...testimonials, ...testimonials]

    return (
        <section
            id="testimonials"
            className="overflow-hidden border-y border-line bg-paper py-24 md:py-[104px]"
            style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.07) 1.2px, transparent 1.2px)', backgroundSize: '24px 24px' }}
        >
            <Reveal as="div" className="container mx-auto mb-14 max-w-[1240px] px-7 text-center">
                <p className="mb-[18px] flex items-center justify-center gap-2.5 font-mono text-[0.74rem] font-medium uppercase tracking-[0.14em] text-gold-deep">
                    <span aria-hidden="true" className="h-px w-[22px] bg-gold-deep" />
                    Client Reviews
                    <span aria-hidden="true" className="h-px w-[22px] bg-gold-deep" />
                </p>
                <h2 className="font-display text-[clamp(2rem,4vw,3.1rem)] font-bold leading-[1.08] tracking-[-0.01em] text-charcoal">
                    What our customers{' '}
                    <span className="relative inline-block whitespace-nowrap">
                        <span
                            className="absolute inset-x-0 bottom-[0.08em] top-[0.42em] -z-10 -rotate-1 rounded-sm bg-gold/45"
                            aria-hidden="true"
                        ></span>
                        say
                    </span>
                </h2>
            </Reveal>

            <div className="relative overflow-hidden">
                {/* edge fade so the marquee dissolves into the section rather than cutting off hard */}
                <div
                    className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-paper to-transparent sm:w-28"
                    aria-hidden="true"
                ></div>
                <div
                    className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-paper to-transparent sm:w-28"
                    aria-hidden="true"
                ></div>

                <div className="flex w-max animate-slide-testi gap-[22px] hover:[animation-play-state:paused]">
                    {track.map((t, i) => (
                        <div
                            className="group relative w-[340px] shrink-0 border border-line border-l-[3px] border-l-gold bg-chalk px-[26px] pb-7 pt-8 transition-colors duration-300 hover:border-l-gold-deep"
                            style={{ clipPath: 'polygon(0 0, calc(100% - 18px) 0, 100% 18px, 100% 100%, 0 100%)' }}
                            key={i}
                        >
                            <span
                                className="absolute right-0 top-0 border-b-[18px] border-l-[18px] border-b-transparent border-l-gold/25 transition-colors duration-300 group-hover:border-l-gold"
                                aria-hidden="true"
                            ></span>

                            <span
                                className="mb-3 block font-display text-[2.2rem] font-bold leading-none text-gold/40"
                                aria-hidden="true"
                            >
                                “
                            </span>

                            <p className="mb-5 text-[0.88rem] leading-[1.75] text-charcoal-soft">{t.text}</p>

                            <div className="mb-5 tracking-[2px] text-gold-deep">★★★★★</div>

                            <div className="flex items-center gap-3 border-t border-dashed border-line pt-5">
                                <div
                                    className="h-[42px] w-[42px] shrink-0 overflow-hidden border border-line-strong bg-paper"
                                    style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
                                >
                                    <img
                                        className="h-full w-full object-cover"
                                        src={t.avatar}
                                        alt={t.name}
                                        loading="lazy"
                                        onError={(e) => { (e.currentTarget.parentElement as HTMLElement).style.background = t.fallback; e.currentTarget.remove() }}
                                    />
                                </div>
                                <div>
                                    <div className="font-display text-[0.88rem] font-bold text-charcoal">{t.name}</div>
                                    <div className="mt-0.5 font-mono text-[0.72rem] text-slate">{t.loc}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}