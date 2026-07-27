import Reveal from './Reveal'
import founderPhoto from '../assets/founder.jpg'
import directorPhoto from '../assets/director.jpg'
import { teamMembers } from '../data/siteData'

export default function Team() {
    return (
        <section id="team" className="border-y border-line bg-paper py-24 md:py-[104px]">
            <div className="container mx-auto max-w-[1240px] px-7">
                <Reveal className="mx-auto mb-16 max-w-[600px] text-center">
                    <p className="mb-[18px] flex items-center justify-center gap-2.5 font-mono text-[0.74rem] font-medium uppercase tracking-[0.14em] text-gold-deep">Founder's &amp; Director's Message</p>
                    <h2 className="font-display text-[clamp(2rem,4vw,3.1rem)] font-bold leading-[1.08] tracking-[-0.01em] text-charcoal">"Focus on being<br /><em className="not-italic text-gold-deep">productive</em>, not busy."</h2>
                </Reveal>

                <Reveal delay={1} className="mx-auto max-w-[760px] text-center">
                    <p className="mx-auto max-w-full font-sans text-base leading-[1.75] text-slate md:text-[1.05rem]">
                        We take this opportunity to thank our valued customers, whose continued patronage and confidence in
                        our products inspires us to extend the best of services. Being dedicated to taking AKS Solar Systems
                        Private Limited to rural areas, we focus on addressing customer needs through rugged, efficient,
                        reliable, and economic renewable energy solutions. We are committed to total customer satisfaction —
                        identifying specific needs, translating them into quality products, and providing dependable
                        after-sales service.
                    </p>
                </Reveal>

                <div className="mx-auto mt-12 grid max-w-[680px] grid-cols-1 justify-center gap-6 sm:grid-cols-2">
                    <Reveal as="div" className="text-center" delay={1}>
                        <div className="mb-[18px] aspect-square overflow-hidden rounded-2xl bg-chalk">
                            <img className="h-full w-full object-cover [filter:grayscale(0.15)] transition-[filter,transform] duration-300 hover:[filter:grayscale(0)] hover:scale-[1.04]" src={founderPhoto} alt="Mrs. Asha Sharma, Founder of AKS Solar Systems Private Limited" loading="lazy" />
                        </div>
                        <div className="mb-1 font-display text-[1.02rem] font-bold text-charcoal">Mrs. Asha Sharma</div>
                        <div className="font-mono text-[0.72rem] tracking-wide text-gold-deep">Founder</div>
                    </Reveal>
                    <Reveal as="div" className="text-center" delay={2}>
                        <div className="mb-[18px] aspect-square overflow-hidden rounded-2xl bg-chalk">
                            <img className="h-full w-full object-cover [filter:grayscale(0.15)] transition-[filter,transform] duration-300 hover:[filter:grayscale(0)] hover:scale-[1.04]" src={directorPhoto} alt="Mr. Kapil Sharma, Director of AKS Solar Systems Private Limited" loading="lazy" />
                        </div>
                        <div className="mb-1 font-display text-[1.02rem] font-bold text-charcoal">Mr. Kapil Sharma</div>
                        <div className="font-mono text-[0.72rem] tracking-wide text-gold-deep">Director</div>
                    </Reveal>
                </div>

                <Reveal className="mx-auto mb-16 mt-[88px] max-w-[600px] text-center">
                    <p className="mb-[18px] flex items-center justify-center gap-2.5 font-mono text-[0.74rem] font-medium uppercase tracking-[0.14em] text-gold-deep">Our Team</p>
                    <h2 className="font-display text-[clamp(2rem,4vw,3.1rem)] font-bold leading-[1.08] tracking-[-0.01em] text-charcoal">When talent meets<br /><em className="not-italic text-gold-deep">passion</em>, success happens</h2>
                    <p className="mx-auto mt-[18px] max-w-[520px] font-sans text-base leading-[1.75] text-slate md:text-[1.05rem]">
                        Great things are rarely achieved by just one person — providing energy wouldn't be possible without
                        our fully licensed and professionally qualified solar experts. Meet the team behind every install.
                    </p>
                </Reveal>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {teamMembers.map((member, i) => (
                        <Reveal key={member.name} as="div" className="text-center" delay={(i % 4) + 1}>
                            <div className="mb-[18px] aspect-square overflow-hidden rounded-2xl bg-chalk">
                                <img
                                    className="h-full w-full object-cover [filter:grayscale(0.15)] transition-[filter,transform] duration-300 hover:[filter:grayscale(0)] hover:scale-[1.04]"
                                    src={member.img}
                                    alt={member.name}
                                    loading="lazy"
                                    onError={(e) => { e.currentTarget.parentElement.style.background = member.fallback; e.currentTarget.remove() }}
                                />
                            </div>
                            <div className="mb-1 font-display text-[1.02rem] font-bold text-charcoal">{member.name}</div>
                            <div className="mb-2.5 font-mono text-[0.72rem] tracking-wide text-gold-deep">{member.role}</div>
                            <p className="text-[0.85rem] leading-[1.6] text-slate">{member.bio}</p>
                        </Reveal>
                    ))}
                </div>
            </div>
        </section>
    )
}
