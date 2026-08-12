import { useEffect, useState } from 'react'
import Reveal from './Reveal'
import { publicSiteService } from '../services/publicService'

const API_ORIGIN = "https://localhost:7272";
//const API_ORIGIN = import.meta.env.VITE_API_BASE_URL;

function resolveImage(raw?: string | null): string {
    if (!raw) return ""
    if (raw.startsWith("http://") || raw.startsWith("https://")) return raw
    const cleanPath = raw.replace(/^\/+/, "")
    return `${API_ORIGIN}/${cleanPath}`
}

const FALLBACK_COLORS = ['#E8D9B5', '#D9C79A', '#C9B784', '#EAD9B0']

interface TeamMemberApi {
    name?: string
    designation?: string
    bio?: string
    linkedInUrl?: string
    imagePath?: string
    image?: string
    imageUrl?: string
    displayOrder?: number
}

interface TeamMember {
    name: string
    role: string
    bio: string
    linkedInUrl: string
    img: string
    displayOrder: number
    fallback: string
}

function RayIcon() {
    return (
        <svg
            className="pointer-events-none absolute -top-1.5 right-1.5 h-6 w-6 opacity-0 transition-[opacity,transform] duration-300 -translate-y-1 group-hover:translate-y-0 group-hover:opacity-100"
            viewBox="0 0 24 24"
            fill="none"
        >
            <path
                d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1"
                stroke="currentColor"
                className="text-gold-deep"
                strokeWidth="1.5"
                strokeLinecap="round"
            />
        </svg>
    )
}

export default function Team() {
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        let cancelled = false
            ; (async () => {
                try {
                    setLoading(true)
                    const res = await publicSiteService.getTeam()
                    const raw: TeamMemberApi[] = Array.isArray(res?.data) ? res.data : []

                    const list: TeamMember[] = raw
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
                } catch (err: unknown) {
                    if (!cancelled) {
                        const message = err instanceof Error ? err.message : "Failed to load team"
                        setError(message)
                    }
                } finally {
                    if (!cancelled) setLoading(false)
                }
            })()
        return () => { cancelled = true }
    }, [])

    return (
        <section id="team" className="relative overflow-hidden border-y border-line bg-paper py-16 sm:py-20 md:py-[104px]">
            {/* faint solar-grid backdrop */}
            <div
                className="pointer-events-none absolute inset-0 opacity-[0.05]"
                style={{
                    backgroundImage:
                        'repeating-linear-gradient(0deg, #A8752E 0 1px, transparent 1px 64px), repeating-linear-gradient(90deg, #A8752E 0 1px, transparent 1px 64px)',
                    maskImage: 'radial-gradient(ellipse 80% 60% at 50% 20%, black 10%, transparent 70%)',
                }}
            />

            <div className="container relative mx-auto max-w-[1240px] px-5 sm:px-7">
                <Reveal className="mx-auto mb-10 max-w-[600px] text-center sm:mb-16">
                    <p className="mb-3 flex items-center justify-center gap-2.5 font-mono text-[0.68rem] font-medium uppercase tracking-[0.14em] text-gold-deep sm:mb-[18px] sm:text-[0.74rem]">
                        Our Team
                    </p>
                    <h2 className="font-display text-[clamp(1.7rem,6vw,3.1rem)] font-bold leading-[1.1] tracking-[-0.01em] text-charcoal">
                        When talent meets<br /><em className="not-italic text-gold-deep">passion</em>, success happens
                    </h2>
                    <p className="mx-auto mt-3 max-w-[520px] font-sans text-[0.92rem] leading-[1.7] text-slate sm:mt-[18px] sm:text-base md:text-[1.05rem]">
                        Great things are rarely achieved by just one person — providing energy wouldn't be possible without
                        our fully licensed and professionally qualified solar experts. Meet the team behind every install.
                    </p>
                </Reveal>

                {loading ? (
                    <div className="text-center font-mono text-sm text-slate">Loading team...</div>
                ) : error || teamMembers.length === 0 ? (
                    <div className="text-center font-mono text-sm text-slate">{error || "No team members to show right now."}</div>
                ) : (
                    <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 sm:gap-y-10 lg:grid-cols-4 lg:gap-x-8">
                        {teamMembers.map((member, i) => (
                            <Reveal
                                key={`${member.name}-${i}`}
                                as="div"
                                className={`group text-center ${i % 2 === 1 ? 'lg:mt-10' : ''}`}
                                delay={(i % 4) + 1}
                            >
                                <div className="relative mx-auto mb-4 aspect-[1/1.12] w-full max-w-[150px] overflow-hidden rounded-full bg-chalk shadow-[0_14px_30px_-18px_rgba(33,29,23,0.35)] sm:mb-[22px] sm:max-w-[180px]">
                                    <img
                                        className="h-full w-full object-cover [filter:grayscale(0.15)] transition-[filter,transform] duration-300 group-hover:[filter:grayscale(0)] group-hover:scale-[1.06]"
                                        src={member.img}
                                        alt={member.name}
                                        loading="lazy"
                                        onError={(e) => {
                                            const target = e.currentTarget
                                            if (target.parentElement) {
                                                target.parentElement.style.background = member.fallback
                                            }
                                            target.remove()
                                        }}
                                    />
                                    <RayIcon />
                                </div>
                                <div className="mb-1 font-display text-[0.92rem] font-bold text-charcoal sm:text-[1.02rem]">{member.name}</div>
                                <div className="mb-2 font-mono text-[0.66rem] uppercase tracking-wide text-gold-deep sm:mb-2.5 sm:text-[0.72rem]">{member.role}</div>
                                <p className="mx-auto max-w-[190px] text-[0.8rem] leading-[1.55] text-slate sm:max-w-[210px] sm:text-[0.85rem] sm:leading-[1.6]">{member.bio}</p>
                            </Reveal>
                        ))}
                    </div>
                )}
            </div>
        </section>
    )
}