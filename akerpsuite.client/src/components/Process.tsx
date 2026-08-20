import Reveal from './Reveal'
import { processSteps } from '../data/siteData'

export default function Process() {
    return (
        <section
            id="process"
            className="relative bg-chalk py-16 sm:py-24 md:py-[104px]"
            style={{ backgroundImage: 'repeating-linear-gradient(115deg, rgba(228,255,78,0.05) 0px, rgba(228,255,78,0.05) 1px, transparent 1px, transparent 38px)' }}
        >
            <div className="container mx-auto max-w-[1240px] px-5 sm:px-7">
                <Reveal className="mx-auto mb-10 max-w-[600px] text-center sm:mb-16">
                    <p className="mb-[18px] flex items-center justify-center gap-2.5 font-mono text-[0.74rem] font-medium uppercase tracking-[0.14em] text-gold-deep">How It Works</p>
                    <h2 className="font-display text-[clamp(2rem,4vw,3.1rem)] font-bold leading-[1.08] tracking-[-0.01em] text-charcoal">
                        From survey to <em className="not-italic text-gold-deep">sunshine</em>
                    </h2>
                </Reveal>
                <div className="relative before:absolute before:left-[6%] before:right-[6%] before:top-14 before:hidden before:h-px before:bg-[length:14px_1px] before:[background-image:linear-gradient(to_right,rgba(255,255,255,0.16)_50%,transparent_50%)] lg:before:block">
                    <div className="relative z-[1] grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        {processSteps.map((step, i) => (
                            <Reveal key={step.num} className="[perspective:700px] [transform-style:preserve-3d] rounded-2xl border border-line bg-paper transition-all duration-400 hover:[transform:translateY(-8px)_rotateX(3deg)] hover:shadow-card" delay={i + 1}>
                                <div className="flex items-center justify-between border-b border-line px-6 py-[18px]">
                                    <span className="font-display text-[0.78rem] font-bold tracking-[0.08em] text-slate">{step.num}</span>
                                    <span className="text-[1.3rem]">{step.icon}</span>
                                </div>
                                <div className="px-6 pb-7 pt-[22px]">
                                    <div className="mb-2.5 font-display text-[1.04rem] font-bold text-charcoal">{step.title}</div>
                                    <p className="text-[0.88rem] leading-[1.7] text-slate">{step.desc}</p>
                                </div>
                            </Reveal>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
}