import Reveal from './Reveal'
import TiltCard from './TiltCard'

interface LeadershipMessageProps {
    /** 1-indexed position in the leadership series, e.g. 1 of 3 */
    index: number
    total: number
    name: string
    role: string
    photoSrc: string
    photoAlt: string
    quote: string
    paragraphs: string[]
    /** Which side the ambient glow sits on — alternate per page so the set feels designed, not templated */
    glow?: 'left' | 'right'
    /** Put the portrait on the right instead of the left on desktop */
    reverse?: boolean
}

export default function LeadershipMessage({
    index,
    total,
    name,
    role,
    photoSrc,
    photoAlt,
    quote,
    paragraphs,
    glow = 'left',
    reverse = false,
}: LeadershipMessageProps) {
    return (
        <section
            id={`${role.toLowerCase().replace(/\s+/g, '-')}-message`}
            className="relative overflow-hidden bg-paper py-16 sm:py-20 md:py-[104px]"
        >
            {/* faint solar-grid backdrop, shared with the rest of the interior pages */}
            <div
                className="pointer-events-none absolute inset-0 opacity-[0.05]"
                style={{
                    backgroundImage:
                        'repeating-linear-gradient(0deg, #A8752E 0 1px, transparent 1px 64px), repeating-linear-gradient(90deg, #A8752E 0 1px, transparent 1px 64px)',
                    maskImage: 'radial-gradient(ellipse 80% 60% at 50% 20%, black 10%, transparent 70%)',
                }}
            />

            {/* ambient glow, alternated per page so the three don't feel copy-pasted */}
            <div
                className={`pointer-events-none absolute top-1/2 hidden h-[420px] w-[420px] -translate-y-1/2 rounded-full opacity-[0.12] blur-3xl md:block ${glow === 'left' ? '-left-24' : '-right-24'}`}
                style={{ background: 'radial-gradient(circle, #A8752E, transparent 70%)' }}
            />

            <div className="container relative mx-auto max-w-[1240px] px-5 sm:px-7">
                {/* series marker — ties the three leadership voices together as a set */}
                <Reveal className="mb-10 flex items-center justify-center gap-3 sm:mb-14">
                    <span className="h-px w-8 bg-line-strong" />
                    <span className="font-mono text-[0.68rem] uppercase tracking-[0.18em] text-slate">
                        Leadership Voice {String(index).padStart(2, '0')} / {String(total).padStart(2, '0')}
                    </span>
                    <span className="h-px w-8 bg-line-strong" />
                </Reveal>

                <div
                    className={`grid grid-cols-1 items-center gap-12 sm:gap-16 md:gap-[4.5rem] ${
                        reverse ? 'md:grid-cols-[1.15fr,0.85fr]' : 'md:grid-cols-[0.85fr,1.15fr]'
                    }`}
                >
                    {/* Portrait — chamfered frame matches the site's card language */}
                    <Reveal delay={1} className={reverse ? 'order-1 md:order-2' : 'order-1'}>
                        <div className="relative mx-auto w-fit max-w-[320px]">
                            <TiltCard maxTilt={6} className="group relative">
                                <div
                                    className="relative overflow-hidden border border-line-strong bg-charcoal shadow-card"
                                    style={{ clipPath: 'polygon(0 0, calc(100% - 26px) 0, 100% 26px, 100% 100%, 0 100%)' }}
                                >
                                    <span
                                        className="absolute right-0 top-0 z-10 border-b-[26px] border-l-[26px] border-b-transparent border-l-gold/40 transition-colors duration-300 group-hover:border-l-gold"
                                        aria-hidden="true"
                                    ></span>
                                    <img
                                        className="aspect-[3/4] h-auto w-full object-cover [filter:grayscale(0.15)] transition-[filter,transform] duration-500 group-hover:[filter:grayscale(0)] group-hover:scale-[1.04]"
                                        src={photoSrc}
                                        alt={photoAlt}
                                        loading="lazy"
                                    />
                                    <div
                                        className="absolute inset-0"
                                        style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0) 55%, rgba(0,0,0,0.55) 100%)' }}
                                    ></div>
                                    {/* nameplate overlaid on the portrait itself, like the site's other photo captions */}
                                    <div className="absolute inset-x-0 bottom-0 p-5">
                                        <div className="font-display text-[1.05rem] font-bold text-white">{name}</div>
                                        <div className="mt-1.5 inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-black/30 px-3 py-1 font-mono text-[0.64rem] uppercase tracking-wide text-gold backdrop-blur-sm">
                                            {role}
                                        </div>
                                    </div>
                                </div>
                            </TiltCard>
                        </div>
                    </Reveal>

                    {/* Quote + message column */}
                    <Reveal delay={2} className={`relative text-center md:text-left ${reverse ? 'order-2 md:order-1' : 'order-2'}`}>
                        <span
                            aria-hidden="true"
                            className="pointer-events-none absolute -left-2 -top-12 hidden select-none font-display text-[7rem] leading-none text-gold-deep/15 md:block md:text-[8.5rem]"
                        >
                            "
                        </span>

                        <p className="relative font-display text-[1.35rem] italic leading-[1.35] text-charcoal sm:text-[1.6rem] md:text-[1.85rem]">
                            {quote}
                        </p>

                        <div className="mx-auto mt-6 max-w-[520px] space-y-4 font-sans text-[0.94rem] leading-[1.85] text-slate sm:text-base md:mx-0">
                            {paragraphs.map((p, i) => (
                                <p key={i}>{p}</p>
                            ))}
                        </div>

                        <div className="mt-8 flex items-center justify-center gap-4 border-t border-dashed border-line pt-6 md:justify-start">
                            <span className="font-display text-[1.05rem] italic text-gold-deep sm:text-[1.15rem]">{name}</span>
                            <span className="h-px max-w-[120px] flex-1 bg-line" />
                            <span className="font-mono text-[0.68rem] uppercase tracking-[0.1em] text-slate">{role}</span>
                        </div>
                    </Reveal>
                </div>
            </div>
        </section>
    )
}