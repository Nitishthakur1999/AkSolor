import { useRef, useState } from 'react'
import Reveal from './Reveal'
import { testimonials } from '../data/siteData'

function clamp(value: number, min: number, max: number) {
    return Math.min(max, Math.max(min, value))
}

function TestimonialCard({ t, index }: { t: typeof testimonials[number]; index: number }) {
    const cardRef = useRef<HTMLDivElement>(null)
    const [tilt, setTilt] = useState({ rx: 0, ry: 0 })
    const [glare, setGlare] = useState({ x: 50, y: 50 })
    const [hovered, setHovered] = useState(false)

    // gentle baseline fan-tilt so the deck reads as 3D even before any interaction
    const baseRy = ((index % 3) - 1) * 7

    function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
        const el = cardRef.current
        if (!el) return
        const rect = el.getBoundingClientRect()
        const px = clamp((e.clientX - rect.left) / rect.width, 0, 1)
        const py = clamp((e.clientY - rect.top) / rect.height, 0, 1)
        setTilt({
            rx: clamp((0.5 - py) * 26, -18, 18),
            ry: clamp((px - 0.5) * 26, -18, 18),
        })
        setGlare({ x: px * 100, y: py * 100 })
    }
    function handleMouseEnter() {
        setHovered(true)
    }
    function handleMouseLeave() {
        setHovered(false)
        setTilt({ rx: 0, ry: 0 })
    }

    const totalRy = baseRy + (hovered ? tilt.ry : 0)
    const totalRx = hovered ? tilt.rx : 0
    // shadow drifts opposite the tilt, as if a fixed light source were casting it
    const shadowX = clamp(-totalRy * 1.6, -30, 30)
    const shadowY = clamp(20 - totalRx * 1.6, 8, 46)

    return (
        <div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className="group relative w-[340px] shrink-0 border border-line border-l-[3px] border-l-gold bg-chalk px-[26px] pb-7 pt-8 transition-[border-color] duration-300 hover:border-l-gold-deep"
            style={{
                clipPath: 'polygon(0 0, calc(100% - 18px) 0, 100% 18px, 100% 100%, 0 100%)',
                transformStyle: 'preserve-3d',
                transform: `perspective(1000px) rotateX(${totalRx}deg) rotateY(${totalRy}deg) translateZ(${hovered ? 50 : 0}px) scale(${hovered ? 1.045 : 1})`,
                transition: 'transform 220ms ease-out',
                boxShadow: `${shadowX}px ${shadowY}px ${hovered ? 55 : 26}px ${hovered ? -10 : -14}px rgba(0,0,0,${hovered ? 0.5 : 0.28})`,
            }}
        >
            {/* glossy specular highlight that tracks the cursor, like light glancing off glass */}
            <div
                className="pointer-events-none absolute inset-0 z-20 transition-opacity duration-300"
                style={{
                    opacity: hovered ? 1 : 0,
                    background: `radial-gradient(circle 180px at ${glare.x}% ${glare.y}%, rgba(255,255,255,0.35), transparent 60%)`,
                    mixBlendMode: 'soft-light',
                }}
                aria-hidden="true"
            ></div>

            <span
                className="absolute right-0 top-0 border-b-[18px] border-l-[18px] border-b-transparent border-l-gold/25 transition-colors duration-300 group-hover:border-l-gold"
                style={{ transform: 'translateZ(40px)' }}
                aria-hidden="true"
            ></span>

            <span
                className="mb-3 block font-display text-[2.2rem] font-bold leading-none text-gold/40"
                style={{ transform: 'translateZ(56px)' }}
                aria-hidden="true"
            >
                “
            </span>

            <p
                className="mb-5 text-[0.88rem] leading-[1.75] text-charcoal-soft"
                style={{ transform: 'translateZ(34px)' }}
            >
                {t.text}
            </p>

            <div
                className="mb-5 tracking-[2px] text-gold-deep"
                style={{ transform: 'translateZ(34px)' }}
            >
                ★★★★★
            </div>

            <div
                className="flex items-center gap-3 border-t border-dashed border-line pt-5"
                style={{ transform: 'translateZ(48px)' }}
            >
                {/* extruded 3D avatar frame: a dark slab sits well behind the face for real carved depth */}
                <div className="relative h-[42px] w-[42px] shrink-0" style={{ transformStyle: 'preserve-3d' }}>
                    <span
                        aria-hidden="true"
                        className="absolute inset-0 bg-black/40"
                        style={{
                            clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                            transform: 'translate(0, 6px) translateZ(-10px)',
                        }}
                    ></span>
                    <div
                        className="relative h-full w-full overflow-hidden border border-line-strong bg-paper"
                        style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
                    >
                        <img
                            className="h-full w-full object-cover"
                            src={t.avatar}
                            alt={t.name}
                            loading="lazy"
                            onError={(e) => { (e.currentTarget.parentElement as HTMLElement).style.background = t.fallback; e.currentTarget.remove() }}
                        />
                    </div>
                </div>
                <div>
                    <div className="font-display text-[0.88rem] font-bold text-charcoal">{t.name}</div>
                    <div className="mt-0.5 font-mono text-[0.72rem] text-slate">{t.loc}</div>
                </div>
            </div>
        </div>
    )
}

export default function Testimonials() {
    const track = [...testimonials, ...testimonials, ...testimonials]

    return (
        <section
            id="testimonials"
            className="overflow-hidden border-y border-line bg-paper py-24 md:py-[104px]"
            style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.07) 1.2px, transparent 1.2px)', backgroundSize: '24px 24px' }}
        >
            <Reveal as="div" className="container mx-auto mb-14 max-w-[1240px] px-7 text-center">
                <p className="mb-[18px] flex items-center justify-center gap-2.5 font-mono text-[0.74rem] font-medium uppercase tracking-[0.14em] text-gold-deep">
                    <span aria-hidden="true" className="h-px w-[22px] bg-gold-deep" />
                    Client Reviews
                    <span aria-hidden="true" className="h-px w-[22px] bg-gold-deep" />
                </p>
                <h2 className="font-display text-[clamp(2rem,4vw,3.1rem)] font-bold leading-[1.08] tracking-[-0.01em] text-charcoal">
                    What our customers{' '}
                    <span className="relative inline-block whitespace-nowrap">
                        <span
                            className="absolute inset-x-0 bottom-[0.08em] top-[0.42em] -z-10 -rotate-1 rounded-sm bg-gold/45"
                            aria-hidden="true"
                        ></span>
                        say
                    </span>
                </h2>
            </Reveal>

            <div className="relative overflow-hidden">
                {/* edge fade so the marquee dissolves into the section rather than cutting off hard */}
                <div
                    className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-paper to-transparent sm:w-28"
                    aria-hidden="true"
                ></div>
                <div
                    className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-paper to-transparent sm:w-28"
                    aria-hidden="true"
                ></div>

                {/* deep perspective stage so each card's fan-tilt and hover-pop read with real foreshortening */}
                <div
                    className="flex w-max animate-slide-testi gap-[30px] px-2 hover:[animation-play-state:paused]"
                    style={{ perspective: '1000px' }}
                >
                    {track.map((t, i) => (
                        <TestimonialCard t={t} index={i} key={i} />
                    ))}
                </div>
            </div>
        </section>
    )
}
