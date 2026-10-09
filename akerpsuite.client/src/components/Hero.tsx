import { lazy, Suspense, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { useCountUp } from '../hooks/useCountUp'

// 3D alag chunk, Hero ke baad load hoga
const SolarScene = lazy(() => import('./three/SolarScene'))

interface HeroStatProps {
    target: number
    label: string
    suffix?: string
}

function HeroStat({ target, label, suffix = '' }: HeroStatProps) {
    const [ref, value] = useCountUp(target)

    return (
        <div className="min-w-0 border-l-[3px] border-gold pl-2.5 xs:pl-3 sm:pl-4 md:pl-[18px]">
            <div
                ref={ref}
                className="font-display text-[1.3rem] xs:text-[1.5rem] sm:text-[1.8rem] md:text-[2rem] lg:text-[2.1rem] font-bold leading-none text-charcoal"
            >
                {value}
                {suffix}
            </div>
            <div className="mt-1.5 font-mono text-[0.6rem] xs:text-[0.66rem] sm:text-[0.7rem] md:text-[0.72rem] leading-tight tracking-wide text-charcoal-soft">
                {label}
            </div>
        </div>
    )
}

// 3D tab mount hoga jab: page load ho chuka + browser idle ho.
// Skip: mobile, reduced-motion, data-saver. Text pehle dikhta hai, scene baad me fade-in.
function useSceneReady() {
    const [ready, setReady] = useState(false)

    useEffect(() => {
        const nav = navigator as Navigator & { connection?: { saveData?: boolean } }
        const skip =
            window.matchMedia('(max-width: 768px)').matches ||
            window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
            nav.connection?.saveData === true
        if (skip) return

        const w = window as Window & {
            requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number
            cancelIdleCallback?: (id: number) => void
        }
        let idleId: number | undefined
        let timerId: number | undefined

        const start = () => {
            if (w.requestIdleCallback) {
                idleId = w.requestIdleCallback(() => setReady(true), { timeout: 3000 })
            } else {
                timerId = window.setTimeout(() => setReady(true), 2000)
            }
        }

        if (document.readyState === 'complete') start()
        else window.addEventListener('load', start, { once: true })

        return () => {
            window.removeEventListener('load', start)
            if (idleId !== undefined) w.cancelIdleCallback?.(idleId)
            if (timerId !== undefined) window.clearTimeout(timerId)
        }
    }, [])

    return ready
}

export default function Hero() {
    const sceneReady = useSceneReady()

    return (
        <section
            id="hero"
            className="relative flex min-h-screen min-h-[100svh] items-center overflow-hidden"
            style={{ background: 'var(--color-chalk)' }}
        >
            {/* 3D scene: lazy + idle. Pehle sirf background gradient dikhta hai. */}
            <div className="absolute inset-0 z-0">
                {sceneReady && (
                    <Suspense fallback={null}>
                        <div className="h-full w-full animate-[fadeIn_0.8s_ease-out_both]">
                            <SolarScene variant="hero" />
                        </div>
                    </Suspense>
                )}
            </div>

            <div
                className="absolute inset-0 z-[1]"
                style={{
                    background:
                        'radial-gradient(ellipse 620px 560px at 50% 40%, color-mix(in srgb, var(--color-chalk) 94%, transparent) 0%, color-mix(in srgb, var(--color-chalk) 84%, transparent) 45%, color-mix(in srgb, var(--color-chalk) 55%, transparent) 72%, color-mix(in srgb, var(--color-chalk) 22%, transparent) 100%), linear-gradient(180deg, color-mix(in srgb, var(--color-chalk) 45%, transparent) 0%, color-mix(in srgb, var(--color-chalk) 60%, transparent) 55%, color-mix(in srgb, var(--color-chalk) 85%, transparent) 100%)',
                }}
            ></div>

            <div
                className="pointer-events-none absolute left-1/2 top-0 z-[2] h-[90%] w-[90%] -translate-x-1/2"
                style={{ background: 'radial-gradient(circle at 50% 30%, rgba(255,77,46,0.18) 0%, rgba(228,255,78,0.1) 34%, transparent 65%)' }}
            ></div>

            <div className="container relative z-[5] mx-auto flex w-full max-w-[880px] flex-col items-center px-4 pt-24 pb-14 text-center xs:px-5 xs:pt-28 sm:px-7 sm:pt-24 sm:pb-16 md:px-8 md:pt-20">
                {/* LCP text: NO opacity-0 / animation. Turant dikhna chahiye. */}
                <div className="mb-5 flex items-center gap-2 font-mono text-[0.7rem] font-bold uppercase tracking-[0.14em] text-gold sm:mb-6 sm:gap-2.5 sm:text-[0.78rem] sm:tracking-[0.16em]">
                    <span className="h-0.5 w-5 bg-gold sm:w-[26px]"></span>
                    Future Energy Solutions
                    <span className="h-0.5 w-5 bg-gold sm:w-[26px]"></span>
                </div>

                <h1
                    className="mb-6 font-display text-[clamp(2.2rem,9vw,4.8rem)] font-bold leading-[1.02] tracking-[-0.02em] text-charcoal sm:mb-[26px] sm:leading-[1] sm:tracking-[-0.025em]"
                >
                    Today's resource<br />
                    for a <span className="text-transparent" style={{ WebkitTextStroke: '1.5px var(--color-gold)' }}>brighter</span> tomorrow.
                </h1>

                <p
                    className="mb-8 max-w-[560px] font-sans text-[0.94rem] leading-[1.7] text-charcoal-soft sm:mb-10 sm:text-base lg:text-[1.05rem] lg:leading-[1.75]"
                >
                    AKS Solar Systems Private Limited designs, installs, and maintains solar power plants, rooftop and
                    off-grid systems, solar geysers, and street lights — based in Sunder Nagar, Mandi, Himachal Pradesh.
                </p>

                {/* Buttons + stats: animation theek hai (LCP nahi hain) */}
                <div className="mb-12 flex flex-col gap-3 opacity-0 animate-hero-fade-up [animation-delay:0.15s] xs:flex-row xs:flex-wrap xs:justify-center sm:mb-14 sm:flex-row sm:gap-3.5">
                    <Link
                        to="/contact"
                        className="inline-flex items-center justify-center gap-2.5 rounded-full bg-gold-deep px-7 py-4 font-sans text-[0.88rem] font-extrabold uppercase tracking-wide text-white shadow-glow-ember transition-all hover:-translate-y-[3px] hover:shadow-[0_18px_42px_rgba(255,77,46,0.4)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold sm:w-auto sm:px-8 sm:py-[17px] sm:text-[0.92rem]"
                    >
                        Get Free Quote <ArrowRight size={16} aria-hidden="true" />
                    </Link>
                    <a
                        href="#services"
                        className="inline-flex items-center justify-center gap-2.5 rounded-full border-[1.5px] border-line-strong px-7 py-[15px] font-sans text-[0.88rem] font-extrabold uppercase tracking-wide text-charcoal transition-colors hover:border-gold hover:bg-gold/[0.08] hover:text-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold sm:w-auto sm:px-[30px] sm:py-4 sm:text-[0.92rem]"
                    >
                        Explore Services
                    </a>
                </div>

                <div className="grid grid-cols-3 gap-3.5 opacity-0 animate-hero-fade-up [animation-delay:0.3s] xs:gap-6 sm:gap-10 md:gap-14">
                    <HeroStat target={6} label="Solar Services" />
                    <HeroStat target={2023} label="Incorporated" />
                    <HeroStat target={6} label="+ States Served" />
                </div>
            </div>

            <div className="absolute bottom-6 left-1/2 z-[5] hidden -translate-x-1/2 items-center gap-2.5 font-mono text-[0.7rem] uppercase tracking-[0.1em] text-charcoal-soft sm:flex sm:bottom-9">
                <span className="h-9 w-px animate-scroll-pulse bg-gradient-to-b from-gold to-transparent motion-reduce:hidden"></span>
                Scroll
            </div>
        </section>
    )
}