import Reveal from '../components/Reveal'
import cmdPhoto from '../assets/director.png'

export default function CMDMessage() {
    return (
        <section
            id="cmd-message"
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
                className="pointer-events-none absolute -right-24 top-1/2 hidden h-[420px] w-[420px] -translate-y-1/2 rounded-full opacity-[0.12] blur-3xl md:block"
                style={{ background: 'radial-gradient(circle, #A8752E, transparent 70%)' }}
            />

            <div className="container relative mx-auto max-w-[1240px] px-5 sm:px-7">
                <Reveal className="mx-auto mb-10 max-w-[600px] text-center sm:mb-16">
                    <p className="mb-3 flex items-center justify-center gap-2.5 font-mono text-[0.68rem] font-medium uppercase tracking-[0.14em] text-gold-deep sm:mb-[18px] sm:text-[0.74rem]">
                        <span className="h-px w-5 bg-gold-deep/50" />
                        CMD's Message
                        <span className="h-px w-5 bg-gold-deep/50" />
                    </p>
                    <h2 className="font-display text-[clamp(1.7rem,6vw,3.1rem)] font-bold leading-[1.1] tracking-[-0.01em] text-charcoal">
                        Growth means nothing<br /><em className="not-italic text-gold-deep">if it doesn't reach</em> the last home.
                    </h2>
                </Reveal>

                <div className="mt-10 grid grid-cols-1 items-center gap-10 sm:mt-16 sm:gap-14 md:grid-cols-[1.15fr,0.85fr] md:gap-16">
                    {/* Quote column */}
                    <Reveal delay={1} className="relative order-2 text-center md:order-1 md:text-left">
                        <span
                            aria-hidden="true"
                            className="pointer-events-none absolute -left-2 -top-10 hidden select-none font-display text-[6rem] leading-none text-gold-deep/15 sm:-left-4 sm:-top-14 sm:text-[8rem] md:block"
                        >
                            "
                        </span>
                        <p className="relative font-display text-[1.3rem] italic leading-[1.4] text-charcoal sm:text-[1.6rem] md:text-[1.9rem]">
                            Our vision has never been just about installing panels — it's about making renewable energy
                            reachable for every household, no matter how remote.
                        </p>
                        <p className="mx-auto mt-5 max-w-[480px] font-sans text-[0.92rem] leading-[1.8] text-slate sm:mt-6 sm:text-base sm:leading-[1.85] md:mx-0">
                            As we scale AKS Solar Systems across Himachal Pradesh and beyond, my focus stays on
                            building a company that grows responsibly — investing in our people, strengthening our
                            supply chain, and expanding into new districts without ever compromising on the quality
                            our clients trust us for. Every milestone we cross is measured not just in installations,
                            but in the number of homes and communities that now run on dependable, clean power.
                        </p>
                        <span className="mt-6 inline-block border-t border-line pt-4 font-display text-[1rem] italic text-gold-deep sm:mt-7 sm:pt-[18px] sm:text-[1.1rem]">
                            Kapil Sharma
                        </span>
                    </Reveal>

                    {/* Portrait */}
                    <Reveal delay={2} className="order-1 md:order-2">
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

                                {/* Portrait image */}
                                <div className="group relative h-full w-full overflow-hidden rounded-full bg-chalk shadow-[0_18px_40px_-20px_rgba(33,29,23,0.4)]">
                                    <img
                                        className="h-full w-full object-contain [filter:grayscale(0.15)] transition-[filter,transform] duration-300 group-hover:[filter:grayscale(0)] group-hover:scale-[1.06]"
                                        src={cmdPhoto}
                                        alt="Mr. Kapil Sharma, CMD of AKS Solar Systems Private Limited"
                                        loading="lazy"
                                    />
                                </div>
                            </div>
                            <div className="mt-5 text-center">
                                <div className="mb-1 font-display text-[0.95rem] font-bold text-charcoal sm:text-[1.05rem]">Kapil Sharma</div>
                                <div className="inline-flex items-center gap-1.5 rounded-full border border-gold-deep/30 bg-gold-deep/[0.06] px-3 py-1 font-mono text-[0.62rem] uppercase tracking-wide text-gold-deep sm:text-[0.68rem]">
                                    CMD
                                </div>
                            </div>
                        </div>
                    </Reveal>
                </div>
            </div>
        </section>
    )
}