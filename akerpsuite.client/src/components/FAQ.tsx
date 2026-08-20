import { useState } from 'react'
import Reveal from './Reveal'
import { faqItems } from '../data/siteData'

function FaqItem({ index, q, a, isOpen, onToggle }) {
    return (
        <div
            className={`overflow-hidden border bg-chalk transition-colors duration-300 ${isOpen ? 'border-l-[3px] border-l-gold border-line-strong' : 'border-line'}`}
        >
            <button
                className="flex w-full items-center gap-3 px-4 py-4 text-left sm:gap-4 sm:px-6 sm:py-5"
                onClick={onToggle}
                aria-expanded={isOpen}
            >
                <span
                    className={`shrink-0 font-mono text-[0.72rem] tabular-nums transition-colors duration-300 ${isOpen ? 'text-gold-deep' : 'text-slate-light'}`}
                >
                    {String(index + 1).padStart(2, '0')}
                </span>
                <span className="flex-1 font-display text-[0.96rem] font-semibold text-charcoal">{q}</span>
                <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center border text-[0.78rem] transition-all duration-300 ${
                        isOpen ? 'rotate-45 border-gold-deep bg-gold-deep text-chalk' : 'border-line-strong bg-paper text-gold-deep'
                    }`}
                >
                    +
                </span>
            </button>

            {/* grid-rows trick instead of JS-measured max-height — no scrollHeight
                reads on render, no forced reflow, GPU-friendly */}
            <div className={`grid transition-[grid-template-rows] duration-300 ease-out ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                <div className="overflow-hidden">
                    <div className="border-t border-dashed border-line px-4 pb-5 pt-4 pl-[38px] text-[0.88rem] leading-[1.7] text-slate sm:px-6 sm:pb-[22px] sm:pl-[46px]">
                        {a}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function FAQ() {
    const [openIndex, setOpenIndex] = useState(0)

    return (
        <section
            id="faq"
            className="border-y border-line bg-paper py-16 sm:py-24 md:py-[104px]"
            style={{ backgroundImage: 'radial-gradient(circle, var(--color-line) 1.2px, transparent 1.2px)', backgroundSize: '26px 26px' }}
        >
            <div className="container mx-auto max-w-[1240px] px-5 sm:px-7">
                <div className="grid grid-cols-1 gap-10 sm:gap-16 lg:grid-cols-[0.8fr_1.2fr]">
                    <Reveal>
                        <div className="lg:sticky lg:top-32">
                            <p className="mb-[18px] flex items-center gap-2.5 font-mono text-[0.74rem] font-medium uppercase tracking-[0.14em] text-gold-deep">
                                <span aria-hidden="true" className="h-px w-[22px] bg-gold-deep" />
                                Common Questions
                            </p>
                            <h2 className="font-display text-[clamp(2rem,4vw,3.1rem)] font-bold leading-[1.08] tracking-[-0.01em] text-charcoal">
                                Before you{' '}
                                <span className="relative inline-block">
                                    <span
                                        className="absolute inset-x-0 bottom-[0.08em] top-[0.42em] -z-10 -rotate-1 rounded-sm bg-gold/45"
                                        aria-hidden="true"
                                    ></span>
                                    switch on
                                </span>
                            </h2>
                            <p className="mt-[18px] max-w-[420px] font-sans text-base leading-[1.75] text-slate md:text-[1.05rem]">
                                Answers to what most people ask before booking a survey. Can't find yours? Just call us.
                            </p>

                            <a
                                href="tel:+919805763000"
                                className="mt-7 inline-flex items-center gap-2.5 border border-line-strong bg-mist px-5 py-3 font-sans text-[0.85rem] font-bold text-charcoal transition-colors duration-300 hover:border-gold-deep hover:text-gold-deep"
                            >
                                <i className="fas fa-phone-alt text-[0.8rem]"></i>
                                +91-9805763000
                            </a>
                        </div>
                    </Reveal>

                    <Reveal className="flex flex-col gap-3.5" delay={2}>
                        {faqItems.map((item, i) => (
                            <FaqItem
                                key={item.q}
                                index={i}
                                q={item.q}
                                a={item.a}
                                isOpen={openIndex === i}
                                onToggle={() => setOpenIndex((cur) => (cur === i ? null : i))}
                            />
                        ))}
                    </Reveal>
                </div>
            </div>
        </section>
    )
}