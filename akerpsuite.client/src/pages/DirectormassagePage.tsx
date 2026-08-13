import Reveal from '../components/Reveal'
import directorPhoto from '../assets/director_1.jpg'

export default function DirectorMessage() {
    return (
        <section
            id="director-message"
            className="relative overflow-hidden border-y border-line bg-paper py-16 sm:py-20 md:py-[104px]"
        >
            {/* faint solar-grid backdrop */}
            <div
                className="pointer-events-none absolute inset-0 opacity-[0.05]"
                style={{
                    backgroundImage:
                        'repeating-linear-gradient(0deg, #A8752E 0 1px, transparent 1px 64px), repeating-linear-gradient(90deg, #A8752E 0 1px, transparent 1px 64px)',
                    maskImage: 'radial-gradient(ellipse 80% 60% at 50% 20%, black 10%, transparent 70%)',
                }}
            />

            {/* soft glow accent behind portrait side */}
            <div
                className="pointer-events-none absolute -left-24 top-1/2 hidden h-[420px] w-[420px] -translate-y-1/2 rounded-full opacity-[0.12] blur-3xl md:block"
                style={{ background: 'radial-gradient(circle, #A8752E, transparent 70%)' }}
            />

            <div className="container relative mx-auto max-w-[1240px] px-5 sm:px-7">
                <Reveal className="mx-auto mb-10 max-w-[600px] text-center sm:mb-16">
                    <p className="mb-3 flex items-center justify-center gap-2.5 font-mono text-[0.68rem] font-medium uppercase tracking-[0.14em] text-gold-deep sm:mb-[18px] sm:text-[0.74rem]">
                        <span className="h-px w-5 bg-gold-deep/50" />
                        Director's Message
                        <span className="h-px w-5 bg-gold-deep/50" />
                    </p>
                    <h2 className="font-display text-[clamp(1.7rem,6vw,3.1rem)] font-bold leading-[1.1] tracking-[-0.01em] text-charcoal">
                        Built on trust,<br /><em className="not-italic text-gold-deep">powered</em> by people.
                    </h2>
                </Reveal>

                <div className="mt-10 grid grid-cols-1 items-center gap-10 sm:mt-16 sm:gap-14 md:grid-cols-[0.85fr,1.15fr] md:gap-16">
                    {/* Portrait */}
                    <Reveal delay={1} className="order-1 md:order-1">
                        <div className="relative mx-auto w-fit">
                            <div className="relative h-[190px] w-[190px] sm:h-[240px] sm:w-[240px] md:h-[280px] md:w-[280px]">
                                {/* rotating dashed ring accent */}
                                <svg
                                    className="pointer-events-none absolute -inset-3 animate-[spin_30s_linear_infinite] text-gold-deep/25"
                                    viewBox="0 0 100 100"
                                    fill="none"
                                >
                                    <circle cx="50" cy="50" r="48" stroke="currentColor" strokeWidth="1" strokeDasharray="3 7" />
                                </svg>

                                <div className="group relative flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-chalk shadow-[0_18px_40px_-20px_rgba(33,29,23,0.4)]">
                                    <img
                                        className="h-full w-full object-cover [filter:grayscale(0.15)] transition-[filter,transform] duration-300 group-hover:[filter:grayscale(0)] group-hover:scale-[1.06]"
                                        src={directorPhoto}
                                        alt="Vivek Grovar, Director of AKS Solar Systems Private Limited"
                                        loading="lazy"
                                    />
                                </div>
                            </div>
                            <div className="mt-5 text-center">
                                <div className="mb-1 font-display text-[0.95rem] font-bold text-charcoal sm:text-[1.05rem]">Vivek Grovar</div>
                                <div className="inline-flex items-center gap-1.5 rounded-full border border-gold-deep/30 bg-gold-deep/[0.06] px-3 py-1 font-mono text-[0.62rem] uppercase tracking-wide text-gold-deep sm:text-[0.68rem]">
                                    Director
                                </div>
                            </div>
                        </div>
                    </Reveal>

                    {/* Quote column */}
                    <Reveal delay={2} className="relative order-2 text-center md:order-2 md:text-left">
                        <span
                            aria-hidden="true"
                            className="pointer-events-none absolute -left-2 -top-10 hidden select-none font-display text-[6rem] leading-none text-gold-deep/15 sm:-left-4 sm:-top-14 sm:text-[8rem] md:block"
                        >
                            "
                        </span>
                        <p className="relative font-display text-[1.3rem] italic leading-[1.4] text-charcoal sm:text-[1.6rem] md:text-[1.9rem]">
                            No two homes have the same roof, the same load, or the same needs — and no two of our
                            installations look the same either.
                        </p>
                        <p className="mx-auto mt-5 max-w-[480px] font-sans text-[0.92rem] leading-[1.8] text-slate sm:mt-6 sm:text-base sm:leading-[1.85] md:mx-0">
                            As Director, I work closely with our field teams to make sure every survey, design, and
                            installation is treated as its own project, not a copy-paste job. We take the time to
                            understand shading patterns, roof strength, and daily power usage before a single panel
                            goes up, because a system that isn't planned properly ends up costing our clients more in
                            the long run. That attention to detail, at every single site, is what I hold our team to.
                        </p>
                        <div className="mt-6 flex items-center justify-center gap-4 sm:mt-7 md:justify-start">
                            <span className="font-display text-[1rem] italic text-gold-deep sm:text-[1.1rem]">
                                Vivek Grovar
                            </span>
                            <span className="h-px flex-1 max-w-[120px] bg-line" />
                        </div>
                    </Reveal>
                </div>
            </div>
        </section>
    )
}