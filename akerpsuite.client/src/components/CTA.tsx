import Reveal from './Reveal'

export default function CTA() {
    return (
        <section
            id="cta"
            className="border-y border-line bg-paper py-24 md:py-[104px]"
            style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.07) 1.2px, transparent 1.2px)', backgroundSize: '24px 24px' }}
        >
            <Reveal className="container mx-auto max-w-[1240px] px-7">
                <div
                    className="relative overflow-hidden border border-line border-l-[3px] border-l-gold bg-chalk px-6 py-14 text-center md:px-16 md:py-[76px]"
                    style={{ clipPath: 'polygon(0 0, calc(100% - 34px) 0, 100% 34px, 100% 100%, 0 100%)' }}
                >
                    {/* folded corner accent, same trick as the testimonial cards */}
                    <span
                        className="absolute right-0 top-0 border-b-[34px] border-l-[34px] border-b-transparent border-l-gold/25"
                        aria-hidden="true"
                    ></span>

                    {/* faint oversized sun glyph watermark, echoes the “ mark in Testimonials */}
                    <span
                        aria-hidden="true"
                        className="pointer-events-none absolute -left-4 -top-10 select-none font-display text-[9rem] font-bold leading-none text-gold/10 md:text-[12rem]"
                    >
                        ☀
                    </span>

                    <div className="relative">
                        <p className="mb-[18px] flex items-center justify-center gap-2.5 font-mono text-[0.74rem] font-medium uppercase tracking-[0.14em] text-gold-deep">
                            <span aria-hidden="true" className="h-px w-[22px] bg-gold-deep" />
                            Get Started
                            <span aria-hidden="true" className="h-px w-[22px] bg-gold-deep" />
                        </p>

                        <h2 className="mb-4 font-display text-[clamp(2rem,4vw,3.1rem)] font-bold leading-[1.1] tracking-[-0.01em] text-charcoal">
                            Ready to switch{' '}
                            <span className="relative inline-block whitespace-nowrap">
                                <span
                                    className="absolute inset-x-0 bottom-[0.08em] top-[0.42em] -z-10 -rotate-1 rounded-sm bg-gold/45"
                                    aria-hidden="true"
                                ></span>
                                to solar
                            </span>{' '}
                            energy?
                        </h2>

                        <p className="mx-auto mb-10 max-w-[480px] text-[0.95rem] leading-[1.75] text-charcoal-soft">
                            Contact AKS Solar Systems for a consultation. We'll assess your site and recommend the right
                            system — rooftop or ground-mounted, on-grid or off-grid, geysers or street lights.
                        </p>

                        <div className="mb-10 flex flex-wrap items-center justify-center gap-3.5">
                            <a
                                href="#contact"
                                className="group inline-flex items-center gap-2.5 border border-charcoal bg-charcoal px-8 py-[17px] font-sans text-[0.9rem] font-bold text-chalk transition-colors duration-300 hover:border-gold-deep hover:bg-gold-deep"
                                style={{ clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 0 100%)' }}
                            >
                                Send Enquiry
                                <i className="fas fa-arrow-right text-[0.8rem] transition-transform duration-300 group-hover:translate-x-1"></i>
                            </a>

                            <a
                                href="tel:+919805763000"
                                className="inline-flex items-center gap-2.5 border-[1.5px] border-line-strong px-[30px] py-4 font-sans text-[0.9rem] font-bold text-charcoal transition-colors hover:border-gold-deep hover:bg-gold/10"
                            >
                                <i className="fas fa-phone text-[0.8rem]"></i> +91-9805763000
                            </a>
                        </div>

                        {/* thin dashed strip, mirrors the divider under each testimonial card */}
                        <div className="mx-auto flex max-w-[420px] items-center justify-center gap-2 border-t border-dashed border-line pt-6 font-mono text-[0.72rem] uppercase tracking-[0.12em] text-slate">
                            <i className="fas fa-star text-gold-deep"></i>
                            Trusted across Himachal &amp; beyond
                            <i className="fas fa-star text-gold-deep"></i>
                        </div>
                    </div>
                </div>
                
            </Reveal>
        </section>
    )
}