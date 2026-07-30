import { useEffect, useState } from 'react'
import Reveal from './Reveal'
import founderPhoto from '../assets/founder.png'
import directorPhoto from '../assets/director.png'
import { publicSiteService } from '../services/publicService' // adjust path as needed

const API_ORIGIN = "https://localhost:7272"; // same host as PUBLIC_API_BASE, no /api/public
//const API_ORIGIN = import.meta.env.VITE_API_BASE_URL; // production/dev dono me sahi URL milega
function resolveImage(raw) {
    if (!raw) return "";
    if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
    const cleanPath = raw.replace(/^\/+/, "");
    return `${API_ORIGIN}/${cleanPath}`;
}

const FALLBACK_COLORS = ['#E8D9B5', '#D9C79A', '#C9B784', '#EAD9B0']

const HEX = '[clip-path:polygon(50%_0%,100%_25%,100%_75%,50%_100%,0%_75%,0%_25%)]'

function RayIcon() {
    return (
        <svg className="pointer-events-none absolute -top-1.5 right-1.5 h-6 w-6 opacity-0 transition-[opacity,transform] duration-300 -translate-y-1 group-hover:translate-y-0 group-hover:opacity-100" viewBox="0 0 24 24" fill="none">
            <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1" stroke="currentColor" className="text-gold-deep" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    )
}

export default function Team() {
    const [teamMembers, setTeamMembers] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        let cancelled = false
            ; (async () => {
                try {
                    setLoading(true)
                    const res = await publicSiteService.getTeam()
                    const raw = Array.isArray(res?.data) ? res.data : []

                    console.log("Team API raw response:", raw) // remove once field names confirmed

                    const list = raw
                        .map((t, i) => ({
                            name: t.name ?? '',
                            role: t.designation ?? '',
                            bio: t.bio ?? '',
                            linkedInUrl: t.linkedInUrl ?? '',
                            img: resolveImage(t.imagePath ?? t.image ?? t.imageUrl),
                            displayOrder: t.displayOrder ?? 0,
                            fallback: FALLBACK_COLORS[i % FALLBACK_COLORS.length],
                        }))
                        .sort((a, b) => a.displayOrder - b.displayOrder)

                    if (!cancelled) {
                        setTeamMembers(list)
                        setError(null)
                    }
                } catch (err) {
                    if (!cancelled) setError(err?.message || "Failed to load team")
                } finally {
                    if (!cancelled) setLoading(false)
                }
            })()
        return () => { cancelled = true }
    }, [])

    return (
        <section id="team" className="relative overflow-hidden border-y border-line bg-paper py-24 md:py-[104px]">
            {/* faint solar-grid backdrop */}
            <div
                className="pointer-events-none absolute inset-0 opacity-[0.05]"
                style={{
                    backgroundImage:
                        'repeating-linear-gradient(0deg, #A8752E 0 1px, transparent 1px 64px), repeating-linear-gradient(90deg, #A8752E 0 1px, transparent 1px 64px)',
                    maskImage: 'radial-gradient(ellipse 80% 60% at 50% 20%, black 10%, transparent 70%)',
                }}
            />

            <div className="container relative mx-auto max-w-[1240px] px-7">
                <Reveal className="mx-auto mb-16 max-w-[600px] text-center">
                    <p className="mb-[18px] flex items-center justify-center gap-2.5 font-mono text-[0.74rem] font-medium uppercase tracking-[0.14em] text-gold-deep">Founder's &amp; Director's Message</p>
                    <h2 className="font-display text-[clamp(2rem,4vw,3.1rem)] font-bold leading-[1.08] tracking-[-0.01em] text-charcoal">"Focus on being<br /><em className="not-italic text-gold-deep">productive</em>, not busy."</h2>
                </Reveal>

                <div className="mt-16 grid grid-cols-1 items-center gap-14 md:grid-cols-[1.15fr,0.85fr] md:gap-16">
                    {/* Quote column */}
                    <Reveal delay={1} className="relative">
                        <span aria-hidden="true" className="pointer-events-none absolute -left-4 -top-14 select-none font-display text-[8rem] leading-none text-gold-deep/15">"</span>
                        <p className="relative font-display text-[1.6rem] italic leading-[1.4] text-charcoal md:text-[1.9rem]">
                            We're not here to sell panels. We're here to bring dependable power to homes that have waited long enough for it.
                        </p>
                        <p className="mt-6 max-w-[480px] font-sans text-base leading-[1.85] text-slate">
                            We take this opportunity to thank our valued customers, whose continued patronage and confidence in
                            our products inspires us to extend the best of services. Being dedicated to taking AKS Solar Systems
                            Private Limited to rural areas, we focus on addressing customer needs through rugged, efficient,
                            reliable, and economic renewable energy solutions.
                        </p>
                        <span className="mt-7 inline-block border-t border-line pt-[18px] font-display text-[1.1rem] italic text-gold-deep">
                            Asha &amp; Kapil Sharma
                        </span>
                    </Reveal>

                    {/* Portrait stage */}
                    <Reveal delay={2}>
                        <div className="relative mx-auto h-[320px] w-full max-w-[380px] md:h-[380px]">
                            <div className={`group absolute left-0 top-0 h-[170px] w-[170px] overflow-hidden bg-chalk shadow-[0_18px_40px_-20px_rgba(33,29,23,0.4)] md:h-[196px] md:w-[196px] rounded-full`}>
                                <img className="h-full w-full object-contain [filter:grayscale(0.15)] transition-[filter,transform] duration-300 group-hover:[filter:grayscale(0)] group-hover:scale-[1.06]" src={founderPhoto} alt="Mrs. Asha Sharma, Founder of AKS Solar Systems Private Limited" loading="lazy" />
                            </div>
                            <div className={`group absolute bottom-0 right-0 h-[170px] w-[170px] overflow-hidden bg-chalk shadow-[0_18px_40px_-20px_rgba(33,29,23,0.4)] md:h-[196px] md:w-[196px] rounded-full`}>
                                <img className="h-full w-full object-contain [filter:grayscale(0.15)] transition-[filter,transform] duration-300 group-hover:[filter:grayscale(0)] group-hover:scale-[1.06]" src={directorPhoto} alt="Mr. Kapil Sharma, Director of AKS Solar Systems Private Limited" loading="lazy" />
                            </div>
                            <svg className="pointer-events-none absolute inset-0" viewBox="0 0 380 380">
                                <line x1="140" y1="140" x2="240" y2="240" stroke="#A8752E" strokeWidth="1.5" strokeDasharray="2 6" opacity="0.6" />
                            </svg>
                            <div className="absolute -top-1.5 right-0 text-right md:left-[216px] md:right-auto md:top-5 md:text-left">
                                <div className="mb-1 font-display text-[0.95rem] font-bold text-charcoal">Asha Sharma</div>
                                <div className="font-mono text-[0.68rem] uppercase tracking-wide text-gold-deep">Founder</div>
                            </div>
                            <div className="absolute -bottom-1.5 left-0 text-left md:bottom-5 md:left-auto md:right-[216px] md:text-right">
                                <div className="mb-1 font-display text-[0.95rem] font-bold text-charcoal">Kapil Sharma</div>
                                <div className="font-mono text-[0.68rem] uppercase tracking-wide text-gold-deep">Director</div>
                            </div>
                        </div>
                    </Reveal>
                </div>

                <Reveal className="mx-auto mb-16 mt-24 max-w-[600px] text-center">
                    <p className="mb-[18px] flex items-center justify-center gap-2.5 font-mono text-[0.74rem] font-medium uppercase tracking-[0.14em] text-gold-deep">Our Team</p>
                    <h2 className="font-display text-[clamp(2rem,4vw,3.1rem)] font-bold leading-[1.08] tracking-[-0.01em] text-charcoal">When talent meets<br /><em className="not-italic text-gold-deep">passion</em>, success happens</h2>
                    <p className="mx-auto mt-[18px] max-w-[520px] font-sans text-base leading-[1.75] text-slate md:text-[1.05rem]">
                        Great things are rarely achieved by just one person — providing energy wouldn't be possible without
                        our fully licensed and professionally qualified solar experts. Meet the team behind every install.
                    </p>
                </Reveal>

                {loading ? (
                    <div className="text-center font-mono text-sm text-slate">Loading team...</div>
                ) : error || teamMembers.length === 0 ? (
                    <div className="text-center font-mono text-sm text-slate">{error || "No team members to show right now."}</div>
                ) : (
                    <div className="grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-4 lg:gap-x-8">
                        {teamMembers.map((member, i) => (
                            <Reveal key={`${member.name}-${i}`} as="div" className={`group text-center ${i % 2 === 1 ? 'lg:mt-10' : ''}`} delay={(i % 4) + 1}>
                                <div className={`relative mx-auto mb-[22px] aspect-[1/1.12] w-full max-w-[180px] overflow-hidden bg-chalk shadow-[0_14px_30px_-18px_rgba(33,29,23,0.35)] rounded-full`}>
                                    <img
                                        className="h-full w-full object-cover [filter:grayscale(0.15)] transition-[filter,transform] duration-300 group-hover:[filter:grayscale(0)] group-hover:scale-[1.06]"
                                        src={member.img}
                                        alt={member.name}
                                        loading="lazy"
                                        onError={(e) => { e.currentTarget.parentElement.style.background = member.fallback; e.currentTarget.remove() }}
                                    />
                                    <RayIcon />
                                </div>
                                <div className="mb-1 font-display text-[1.02rem] font-bold text-charcoal">{member.name}</div>
                                <div className="mb-2.5 font-mono text-[0.72rem] uppercase tracking-wide text-gold-deep">{member.role}</div>
                                <p className="mx-auto max-w-[210px] text-[0.85rem] leading-[1.6] text-slate">{member.bio}</p>
                            </Reveal>
                        ))}
                    </div>
                )}
            </div>
        </section>
    )
}