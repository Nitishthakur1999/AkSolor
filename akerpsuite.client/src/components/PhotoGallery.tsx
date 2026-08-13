import { useState, useCallback, useEffect } from 'react'
import Reveal from './Reveal'
import Lightbox from './Lightbox'
import { publicSiteService } from '../services/publicService' // adjust path as needed

//const API_ORIGIN = "https://localhost:7272"; 
const API_ORIGIN = import.meta.env.VITE_API_BASE_URL; 
function resolveImage(raw) {
    if (!raw) return "";
    if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
    const cleanPath = raw.replace(/^\/+/, "");
    return `${API_ORIGIN}/${cleanPath}`;
}

const FALLBACK_COLORS = ['#E8D9B5', '#D9C79A', '#C9B784', '#EAD9B0']

export default function PhotoGallery() {
    const [photoGalleryItems, setPhotoGalleryItems] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const [brokenSet, setBrokenSet] = useState(() => new Set())
    const [lightboxIndex, setLightboxIndex] = useState(null)
    const [open, setOpen] = useState(false)
    const [show, setShow] = useState(false)

    useEffect(() => {
        let cancelled = false
            ; (async () => {
                try {
                    setLoading(true)
                    const res = await publicSiteService.getProjects()
                    const raw = Array.isArray(res?.data) ? res.data : []

                    console.log("Projects API raw response (for photo gallery):", raw) // remove once confirmed

                    // flatten every project's ImagePaths into one photo grid
                    const list = raw.flatMap((p, pi) =>
                        (p.imagePaths ?? []).map((path, ii) => ({
                            img: resolveImage(path),
                            alt: p.title ?? '',
                            caption: [p.title, p.location].filter(Boolean).join(' — '),
                            wide: (pi + ii) % 5 === 0, // occasional wide tile, same visual rhythm as before
                            fallback: FALLBACK_COLORS[(pi + ii) % FALLBACK_COLORS.length],
                        }))
                    )

                    if (!cancelled) {
                        setPhotoGalleryItems(list)
                        setError(null)
                    }
                } catch (err) {
                    if (!cancelled) setError(err?.message || "Failed to load photos")
                } finally {
                    if (!cancelled) setLoading(false)
                }
            })()
        return () => { cancelled = true }
    }, [])

    const markBroken = useCallback((i) => {
        setBrokenSet((prev) => new Set(prev).add(i))
    }, [])

    function openLightbox(i) {
        if (brokenSet.has(i)) return
        setLightboxIndex(i)
        setOpen(true)
        requestAnimationFrame(() => setShow(true))
    }

    function closeLightbox() {
        setShow(false)
        setTimeout(() => setOpen(false), 300)
    }

    function advance(direction) {
        const len = photoGalleryItems.length
        for (let step = 1; step <= len; step++) {
            const next = (lightboxIndex + direction * step + len * len) % len
            if (!brokenSet.has(next)) {
                setLightboxIndex(next)
                return
            }
        }
        closeLightbox()
    }

    return (
        <section
            id="photo-gallery"
            className="border-y border-line bg-paper py-24 md:py-[104px]"
            style={{ backgroundImage: 'radial-gradient(circle, var(--color-line) 1.2px, transparent 1.2px)', backgroundSize: '26px 26px' }}
        >
            <div className="container mx-auto max-w-[1240px] px-7">
                <Reveal className="mx-auto mb-14 max-w-[600px] text-center">
                    <p className="mb-[18px] flex items-center justify-center gap-2.5 font-mono text-[0.74rem] font-medium uppercase tracking-[0.14em] text-gold-deep">
                        <span aria-hidden="true" className="h-px w-[22px] bg-gold-deep" />
                        In The Field
                        <span aria-hidden="true" className="h-px w-[22px] bg-gold-deep" />
                    </p>
                    <h2 className="font-display text-[clamp(2rem,4vw,3.1rem)] font-bold leading-[1.08] tracking-[-0.01em] text-charcoal">
                        A look at our{' '}
                        <span className="relative inline-block">
                            <span
                                className="absolute inset-x-0 bottom-[0.08em] top-[0.42em] -z-10 -rotate-1 rounded-sm bg-gold/45"
                                aria-hidden="true"
                            ></span>
                            work
                        </span>
                    </h2>
                    <p className="mx-auto mt-[18px] max-w-[520px] font-sans text-base leading-[1.75] text-slate md:text-[1.05rem]">
                        Rooftops, panels, and crews across Himachal Pradesh. Click any photo to view it larger.
                    </p>
                </Reveal>

                {loading ? (
                    <div className="text-center font-mono text-sm text-slate">Loading photos...</div>
                ) : error || photoGalleryItems.length === 0 ? (
                    <div className="text-center font-mono text-sm text-slate">{error || "No photos to show right now."}</div>
                ) : (
                    <div className="grid auto-rows-fr grid-cols-2 gap-2.5 [grid-auto-flow:dense] sm:gap-4 lg:grid-cols-4">
                        {photoGalleryItems.map((item, i) => (
                            <div
                                key={`${item.caption}-${i}`}
                                className={`group relative aspect-square cursor-pointer overflow-hidden border border-line bg-mist transition-all duration-300 hover:border-gold ${item.wide ? 'col-span-2' : ''}`}
                                style={{ clipPath: 'polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 0 100%)' }}
                                onClick={() => openLightbox(i)}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault()
                                        openLightbox(i)
                                    }
                                }}
                                aria-label={`View larger: ${item.caption}`}
                            >
                                <span
                                    className="pointer-events-none absolute right-0 top-0 z-[2] border-b-[16px] border-l-[16px] border-b-transparent border-l-gold/30 transition-colors duration-300 group-hover:border-l-gold"
                                    aria-hidden="true"
                                ></span>

                                {!brokenSet.has(i) && (
                                    <img
                                        src={item.img}
                                        alt={item.alt}
                                        loading="lazy"
                                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.07]"
                                        onError={(e) => { e.currentTarget.parentElement.style.background = item.fallback; markBroken(i) }}
                                    />
                                )}

                                <div
                                    className="absolute inset-0 flex items-end p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                                    style={{ background: 'linear-gradient(180deg, transparent 45%, rgb(from var(--color-charcoal) r g b / 0.82) 100%)' }}
                                >
                                    <span className="font-display text-[0.85rem] font-semibold text-chalk">{item.caption}</span>
                                </div>

                                <div className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center border border-white/25 bg-charcoal/70 text-[0.78rem] text-chalk opacity-0 backdrop-blur-sm transition-all duration-300 group-hover:opacity-100">
                                    <i className="fas fa-expand"></i>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <Lightbox
                items={photoGalleryItems}
                index={lightboxIndex}
                open={open}
                show={show}
                onClose={closeLightbox}
                onPrev={() => advance(-1)}
                onNext={() => advance(1)}
            />
        </section>
    )
}