import Reveal from './Reveal'

export default function PageHeader({ eyebrow, title, highlight, desc }) {
    return (
        <section
            className="relative overflow-hidden border-b border-line bg-mist pb-6 pt-12 text-charcoal sm:pb-10 sm:pt-20"
            style={{ backgroundImage: 'radial-gradient(circle, var(--color-line) 1.2px, transparent 1.2px)', backgroundSize: '24px 24px' }}
        >
            {/* top gold hairline, seam under the fixed navbar */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold to-transparent" aria-hidden="true"></div>

            {/* oversized watermark glyph, same motif as CTA / Footer */}
            <span
                aria-hidden="true"
                className="pointer-events-none absolute -right-10 -top-16 select-none font-display text-[11rem] font-bold leading-none text-gold/[0.07] md:text-[15rem]"
            >
                ☀
            </span>

            {/* corner brackets, viewfinder-style frame */}
            <span
                aria-hidden="true"
                className="pointer-events-none absolute left-6 top-8 hidden h-9 w-9 border-l-[1.5px] border-t-[1.5px] border-gold/40 sm:block md:left-8"
            ></span>
            <span
                aria-hidden="true"
                className="pointer-events-none absolute bottom-8 right-6 hidden h-9 w-9 border-b-[1.5px] border-r-[1.5px] border-gold/40 sm:block md:right-8"
            ></span>

            <div className="container relative z-[2] mx-auto max-w-[1240px] px-6 sm:px-7">
                <Reveal>
                    <p className="mb-5 flex items-center gap-2.5 font-mono text-[0.72rem] font-medium uppercase tracking-[0.16em] text-gold-deep">
                        <span aria-hidden="true" className="h-px w-[22px] bg-gold-deep" />
                        {eyebrow}
                    </p>

                    <h1 className="max-w-[720px] font-display text-[clamp(2rem,5vw,3.4rem)] font-bold leading-[1.08] tracking-[-0.02em] text-charcoal">
                        {title}{' '}
                        {highlight && (
                            <span className="relative inline-block">
                                <span
                                    className="absolute inset-x-0 bottom-[0.1em] top-[0.48em] -z-10 -rotate-1 rounded-sm bg-gold/45"
                                    aria-hidden="true"
                                ></span>
                                {highlight}
                            </span>
                        )}
                    </h1>

                    {desc && (
                        <p className="mt-5 max-w-[560px] text-[1rem] leading-[1.75] text-charcoal-soft">
                            {desc}
                        </p>
                    )}

                    {/* dashed accent line, mirrors the divider pattern from cards elsewhere */}
                    <div className="mt-8 flex max-w-[200px] items-center gap-2" aria-hidden="true">
                        <span className="h-1.5 w-1.5 rounded-full bg-gold-deep" />
                        <span className="h-px flex-1 border-t border-dashed border-line-strong" />
                    </div>
                </Reveal>
            </div>
        </section>
    )
}