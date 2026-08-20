import Reveal from './Reveal'
import SolarScene from './three/SolarScene'

interface PageHeaderProps {
    eyebrow: string
    title: string
    highlight?: string
    desc?: string
    /** Shorter header for lighter interior pages (e.g. leadership messages) — same visual language, less height. */
    compact?: boolean
}

export default function PageHeader({ eyebrow, title, highlight, desc, compact = false }: PageHeaderProps) {
    return (
        <section
            className={
                compact
                    ? 'relative overflow-hidden border-b border-line pb-5 pt-10 sm:pb-6 sm:pt-16 md:pt-[72px]'
                    : 'relative min-h-[280px] overflow-hidden border-b border-line pb-6 pt-12 sm:min-h-[340px] sm:pb-10 sm:pt-20'
            }
            style={{ background: 'var(--color-chalk)' }}
        >
            {/* compact 3D scene: same solar-panel field / sun / particles as the hero, theme-aware and low-key */}
            <div className="absolute inset-0 z-0">
                <SolarScene variant="banner" />
            </div>

            {/* wash so copy stays readable over the 3D layer — built from the theme's own chalk token,
                so it's a light professional wash in light mode and a dark one in dark mode, automatically. */}
            <div
                className="absolute inset-0 z-[1]"
                style={{
                    background:
                        'linear-gradient(180deg, color-mix(in srgb, var(--color-chalk) 60%, transparent) 0%, color-mix(in srgb, var(--color-chalk) 80%, transparent) 60%, var(--color-chalk) 100%)',
                }}
            ></div>

            {/* top gold hairline, seam under the fixed navbar */}
            <div className="absolute inset-x-0 top-0 z-[2] h-px bg-gradient-to-r from-transparent via-gold to-transparent" aria-hidden="true"></div>

            {/* oversized watermark glyph, same motif as CTA / Footer */}
            <span
                aria-hidden="true"
                className={
                    compact
                        ? 'pointer-events-none absolute -right-8 -top-10 z-[2] select-none font-display text-[7rem] font-bold leading-none text-gold/[0.07] md:text-[9rem]'
                        : 'pointer-events-none absolute -right-10 -top-16 z-[2] select-none font-display text-[11rem] font-bold leading-none text-gold/[0.07] md:text-[15rem]'
                }
            >
                ☀
            </span>

            {/* corner brackets, viewfinder-style frame */}
            <span
                aria-hidden="true"
                className="pointer-events-none absolute left-6 top-8 z-[2] hidden h-9 w-9 border-l-[1.5px] border-t-[1.5px] border-gold/40 sm:block md:left-8"
            ></span>
            <span
                aria-hidden="true"
                className="pointer-events-none absolute bottom-8 right-6 z-[2] hidden h-9 w-9 border-b-[1.5px] border-r-[1.5px] border-gold/40 sm:block md:right-8"
            ></span>

            <div className="container relative z-[2] mx-auto max-w-[1240px] px-5 sm:px-7">
                <Reveal>
                    <p className={`flex items-center gap-2.5 font-mono font-medium uppercase tracking-[0.16em] text-gold-deep ${compact ? 'mb-3 text-[0.68rem] sm:text-[0.72rem]' : 'mb-5 text-[0.72rem]'}`}>
                        <span aria-hidden="true" className="h-px w-[22px] bg-gold-deep" />
                        {eyebrow}
                    </p>

                    <h1
                        className={
                            compact
                                ? 'max-w-[720px] font-display text-[clamp(1.6rem,4vw,2.4rem)] font-bold leading-[1.1] tracking-[-0.015em] text-charcoal'
                                : 'max-w-[720px] font-display text-[clamp(2rem,5vw,3.4rem)] font-bold leading-[1.08] tracking-[-0.02em] text-charcoal'
                        }
                    >
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
                        <p className={`max-w-[560px] leading-[1.75] text-charcoal-soft ${compact ? 'mt-3 text-[0.92rem]' : 'mt-5 text-[1rem]'}`}>
                            {desc}
                        </p>
                    )}

                    {/* dashed accent line, mirrors the divider pattern from cards elsewhere */}
                    <div className={`flex max-w-[200px] items-center gap-2 ${compact ? 'mt-5' : 'mt-8'}`} aria-hidden="true">
                        <span className="h-1.5 w-1.5 rounded-full bg-gold-deep" />
                        <span className="h-px flex-1 border-t border-dashed border-line-strong" />
                    </div>
                </Reveal>
            </div>
        </section>
    )
}