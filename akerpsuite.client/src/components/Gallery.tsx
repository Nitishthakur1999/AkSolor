import { useEffect, useState } from 'react'
import Reveal from './Reveal'
import { publicSiteService } from '../services/publicService' 

//const API_ORIGIN = "https://localhost:7272"; 
const API_ORIGIN = import.meta.env.VITE_API_BASE_URL; 
function resolveImage(raw) {
    if (!raw) return "";
    if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
    const cleanPath = raw.replace(/^\/+/, "");
    return `${API_ORIGIN}/${cleanPath}`;
}

function hideOnError(e) {
    e.currentTarget.parentElement.style.background = 'var(--color-line-strong)'
    e.currentTarget.remove()
}

export default function Gallery() {
    const [galleryItems, setGalleryItems] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        let cancelled = false
            ; (async () => {
                try {
                    setLoading(true)
                    const res = await publicSiteService.getGallery()
                    const raw = Array.isArray(res?.data) ? res.data : []

                    console.log("Gallery API raw response:", raw) // remove once field names confirmed

                    const list = raw.map((g) => ({
                        title: g.title ?? '',
                        category: g.category ?? '',
                        image: resolveImage(g.imagePath ?? g.image ?? g.imageUrl),
                    }))

                    if (!cancelled) {
                        setGalleryItems(list)
                        setError(null)
                    }
                } catch (err) {
                    if (!cancelled) setError(err?.message || "Failed to load gallery")
                } finally {
                    if (!cancelled) setLoading(false)
                }
            })()
        return () => { cancelled = true }
    }, [])

    if (loading) {
        return (
            <section id="gallery" className="relative bg-chalk py-24 md:py-[104px]">
                <div className="container mx-auto max-w-[1240px] px-7 text-center font-mono text-sm text-slate">
                    Loading gallery...
                </div>
            </section>
        )
    }

    if (error || galleryItems.length === 0) {
        return (
            <section id="gallery" className="relative bg-chalk py-24 md:py-[104px]">
                <div className="container mx-auto max-w-[1240px] px-7 text-center font-mono text-sm text-slate">
                    {error || "No gallery items to show right now."}
                </div>
            </section>
        )
    }

    return (
        <section
            id="gallery"
            className="relative overflow-hidden border-y border-line bg-chalk py-24 md:py-[104px]"
            style={{ backgroundImage: 'radial-gradient(circle, var(--color-line) 1.2px, transparent 1.2px)', backgroundSize: '26px 26px' }}
        >
            <div className="container relative mx-auto max-w-[1240px] px-7">
                <Reveal className="mb-14 flex flex-wrap items-end justify-between gap-6 border-b border-line pb-7">
                    <div>
                        <p className="mb-[18px] flex items-center gap-2.5 font-mono text-[0.74rem] font-medium uppercase tracking-[0.14em] text-gold-deep">
                            <span aria-hidden="true" className="h-px w-[22px]" />
                            Real Installs
                        </p>
                        <h2 className="font-display text-[clamp(2rem,4vw,3.1rem)] font-bold leading-[1.08] tracking-[-0.01em] text-charcoal">
                            Our{' '}
                            <span className="relative inline-block">
                                <span
                                    className="absolute inset-x-0 bottom-[0.08em] top-[0.42em] -z-10 -rotate-1 rounded-sm bg-gold/45"
                                    aria-hidden="true"
                                ></span>
                                gallery
                            </span>
                        </h2>
                    </div>
                    <div className="flex items-center gap-2.5 border border-line-strong bg-paper px-4 py-2.5 font-mono text-[0.74rem] uppercase tracking-[0.1em] text-slate">
                        <strong className="text-[1rem] text-gold-deep">{String(galleryItems.length).padStart(2, '0')}</strong>
                        project types shown
                    </div>
                </Reveal>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {galleryItems.map((item, i) => (
                        <Reveal
                            key={`${item.title}-${i}`}
                            className="group relative overflow-hidden border border-line border-l-[3px] border-l-gold bg-paper transition-all duration-300 hover:-translate-y-1.5 hover:border-l-gold-deep hover:shadow-card"
                            delay={i + 1}
                            style={{ clipPath: 'polygon(0 0, calc(100% - 22px) 0, 100% 22px, 100% 100%, 0 100%)' }}
                        >
                            <span
                                className="pointer-events-none absolute right-0 top-0 z-[4] border-b-[22px] border-l-[22px] border-b-transparent border-l-gold/25 transition-colors duration-300 group-hover:border-l-gold"
                                aria-hidden="true"
                            ></span>

                            <div className="relative h-[200px] overflow-hidden">
                                <img
                                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.06]"
                                    src={item.image}
                                    alt={item.title}
                                    loading="lazy"
                                    onError={hideOnError}
                                />
                                <div className="pointer-events-none absolute inset-0 bg-charcoal/10"></div>
                                {item.category && (
                                    <span className="absolute left-2.5 top-2.5 z-[2] bg-gold px-2.5 py-1 font-mono text-[0.62rem] font-bold uppercase tracking-[0.08em] text-chalk">
                                        {item.category}
                                    </span>
                                )}
                            </div>

                            <div className="flex items-center justify-between gap-3 border-t border-dashed border-line px-6 pb-[26px] pt-5">
                                <div>
                                    <div className="mb-1 font-display text-base font-bold text-charcoal">{item.title}</div>
                                </div>
                                <span className="flex h-8 w-8 shrink-0 items-center justify-center border border-line-strong text-charcoal-soft transition-colors duration-300 group-hover:border-gold-deep group-hover:text-gold-deep">
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M7 17L17 7M17 7H8M17 7v9" />
                                    </svg>
                                </span>
                            </div>
                        </Reveal>
                    ))}
                </div>
            </div>
        </section>
    )
}