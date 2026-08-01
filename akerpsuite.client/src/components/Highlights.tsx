import { useEffect, useState } from 'react'
import Reveal from './Reveal'
import { publicSiteService } from '../services/publicService' // adjust path as needed

const API_ORIGIN = "https://localhost:7272"; // same host as PUBLIC_API_BASE, no /api/public
//const API_ORIGIN = import.meta.env.VITE_API_BASE_URL; 
function resolveImage(raw) {
    if (!raw) return "";
    if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
    const cleanPath = raw.replace(/^\/+/, "");
    return `${API_ORIGIN}/${cleanPath}`;
}

export default function Highlights() {
    const [highlights, setHighlights] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        let cancelled = false
            ; (async () => {
                try {
                    setLoading(true)
                    const res = await publicSiteService.getHighlights()
                    const raw = Array.isArray(res?.data) ? res.data : []

                    console.log("Highlights API raw response:", raw) // remove once field names confirmed

                    const list = raw
                        .map((h) => ({
                            title: h.title ?? h.Title ?? '',
                            description: h.description ?? h.Description ?? '',
                            image: resolveImage(h.imagePath ?? h.ImagePath),
                            displayOrder: h.displayOrder ?? h.DisplayOrder ?? 0,
                        }))
                        .sort((a, b) => a.displayOrder - b.displayOrder)

                    if (!cancelled) {
                        setHighlights(list)
                        setError(null)
                    }
                } catch (err) {
                    if (!cancelled) setError(err?.message || "Failed to load highlights")
                } finally {
                    if (!cancelled) setLoading(false)
                }
            })()
        return () => { cancelled = true }
    }, [])

    const featured = highlights[0]
    const rest = highlights.slice(1)

    return (
        <section
            id="highlights"
            className="relative overflow-hidden bg-gradient-to-b from-paper to-chalk py-24 md:py-[104px]"
            style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.10) 1.2px, transparent 1.2px)', backgroundSize: '24px 24px' }}
        >
            <div className="container relative z-[1] mx-auto max-w-[1240px] px-7">
                <Reveal>
                    <p className="mb-[18px] flex items-center gap-2.5 font-mono text-[0.74rem] font-medium uppercase tracking-[0.14em] text-gold before:inline-block before:h-px before:w-[22px] before:bg-gold">See It In Action</p>
                    <h2 className="font-display text-[clamp(2rem,4vw,3.1rem)] font-bold leading-[1.08] tracking-[-0.01em] text-charcoal">
                        Highlights <em className="not-italic text-gold">reel</em>
                    </h2>
                    <p className="mb-9 max-w-[520px] font-sans text-base leading-[1.75] text-charcoal-soft md:text-[1.05rem]">
                        A short look at our installs, our crew, and our work across Himachal Pradesh.
                    </p>

                    {loading ? (
                        <div className="font-mono text-sm text-slate">Loading highlights...</div>
                    ) : error || highlights.length === 0 ? (
                        <div className="font-mono text-sm text-slate">{error || "No highlights to show right now."}</div>
                    ) : (
                        <>
                            {/* Featured highlight */}
                            {featured && (
                                <div className="max-w-[900px] overflow-hidden rounded-[20px] border border-line-strong shadow-glow">
                                    <img
                                        src={featured.image}
                                        alt={featured.title}
                                        className="block w-full bg-black object-cover"
                                    />
                                    {(featured.title || featured.description) && (
                                        <div className="bg-paper px-6 py-5">
                                            {featured.title && (
                                                <div className="mb-1 font-display text-lg font-bold text-charcoal">{featured.title}</div>
                                            )}
                                            {featured.description && (
                                                <p className="text-sm leading-relaxed text-slate">{featured.description}</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Remaining highlights */}
                            {rest.length > 0 && (
                                <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                                    {rest.map((h, i) => (
                                        <div
                                            key={`${h.title}-${i}`}
                                            className="overflow-hidden rounded-2xl border border-line-strong"
                                        >
                                            <img
                                                src={h.image}
                                                alt={h.title}
                                                loading="lazy"
                                                className="block aspect-video w-full object-cover"
                                            />
                                            {h.title && (
                                                <div className="bg-paper px-3 py-2.5 text-sm font-semibold text-charcoal">
                                                    {h.title}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </Reveal>
            </div>
        </section>
    )
}