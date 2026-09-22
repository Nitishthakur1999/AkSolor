import { useEffect, useState } from 'react'
import Reveal from './Reveal'
import { publicSiteService } from '../services/publicService'

function extractYouTubeId(url) {
    if (!url) return ""
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/)
    return match ? match[1] : ""
}

export default function Videos() {
    const [videoItems, setVideoItems] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        let cancelled = false
            ; (async () => {
                try {
                    setLoading(true)
                    const res = await publicSiteService.getVideos()
                    console.log("videos raw:", res)
                    const raw = Array.isArray(res?.data) ? res.data : []

                    const list = raw.map((v) => ({
                        title: v.title ?? '',
                        description: v.description ?? '',
                        videoId: extractYouTubeId(v.youTubeVideoUrl ?? v.youTubeVideoId),
                    })).filter((v) => v.videoId)

                    if (!cancelled) {
                        setVideoItems(list)
                        setError(null)
                    }
                } catch (err) {
                    if (!cancelled) setError(err?.message || "Failed to load videos")
                } finally {
                    if (!cancelled) setLoading(false)
                }
            })()
        return () => { cancelled = true }
    }, [])

    if (loading) {
        return (
            <section id="videos" className="relative bg-chalk py-16 sm:py-24 md:py-[104px]">
                <div className="container mx-auto max-w-[1240px] px-5 sm:px-7 text-center font-mono text-sm text-slate">
                    Loading videos...
                </div>
            </section>
        )
    }

    if (error || videoItems.length === 0) {
        return (
            <section id="videos" className="relative bg-chalk py-16 sm:py-24 md:py-[104px]">
                <div className="container mx-auto max-w-[1240px] px-5 sm:px-7 text-center font-mono text-sm text-slate">
                    {error || "No videos to show right now."}
                </div>
            </section>
        )
    }

    return (
        <section
            id="videos"
            className="relative overflow-hidden border-y border-line bg-chalk py-16 sm:py-24 md:py-[104px]"
            style={{ backgroundImage: 'radial-gradient(circle, var(--color-line) 1.2px, transparent 1.2px)', backgroundSize: '26px 26px' }}
        >
            <div className="container relative mx-auto max-w-[1240px] px-5 sm:px-7">
                <Reveal className="mb-10 flex flex-wrap items-end justify-between gap-6 border-b border-line pb-7 sm:mb-14">
                    <div>
                        <p className="mb-[18px] flex items-center gap-2.5 font-mono text-[0.74rem] font-medium uppercase tracking-[0.14em] text-gold-deep">
                            <span aria-hidden="true" className="h-px w-[22px]" />
                            Watch & Learn
                        </p>
                        <h2 className="font-display text-[clamp(2rem,4vw,3.1rem)] font-bold leading-[1.08] tracking-[-0.01em] text-charcoal">
                            Our{' '}
                            <span className="relative inline-block">
                                <span
                                    className="absolute inset-x-0 bottom-[0.08em] top-[0.42em] -z-10 -rotate-1 rounded-sm bg-gold/45"
                                    aria-hidden="true"
                                ></span>
                                videos
                            </span>
                        </h2>
                    </div>
                    <div className="flex items-center gap-2.5 border border-line-strong bg-paper px-4 py-2.5 font-mono text-[0.74rem] uppercase tracking-[0.1em] text-slate">
                        <strong className="text-[1rem] text-gold-deep">{String(videoItems.length).padStart(2, '0')}</strong>
                        videos shown
                    </div>
                </Reveal>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {videoItems.map((item, i) => (
                        <Reveal
                            key={`${item.title}-${i}`}
                            className="group relative overflow-hidden border border-line border-l-[3px] border-l-gold bg-paper transition-all duration-300 hover:-translate-y-1.5 hover:border-l-gold-deep hover:shadow-card"
                            delay={i + 1}
                            style={{ clipPath: 'polygon(0 0, calc(100% - 22px) 0, 100% 22px, 100% 100%, 0 100%)' }}
                        >
                            <div className="relative aspect-video overflow-hidden">
                                <iframe
                                    className="h-full w-full"
                                    src={`https://www.youtube.com/embed/${item.videoId}`}
                                    title={item.title}
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                    loading="lazy"
                                />
                            </div>

                            <div className="flex items-center justify-between gap-3 border-t border-dashed border-line px-6 pb-[26px] pt-5">
                                <div>
                                    <div className="mb-1 font-display text-base font-bold text-charcoal">{item.title}</div>
                                    {item.description && (
                                        <div className="font-mono text-[0.72rem] text-slate">{item.description}</div>
                                    )}
                                </div>
                            </div>
                        </Reveal>
                    ))}
                </div>
            </div>
        </section>
    )
}