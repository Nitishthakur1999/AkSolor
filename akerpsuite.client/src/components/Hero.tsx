import { useCountUp } from '../hooks/useCountUp'
import heroImg from '../assets/img.jpg'

interface HeroStatProps {
    target: number
    label: string
    suffix?: string
}

function HeroStat({ target, label, suffix = '' }: HeroStatProps) {
    const [ref, value] = useCountUp(target)

    return (
        <div className="border-l-[3px] border-gold pl-3 sm:pl-4 md:pl-[18px]">
            <div
                ref={ref}
                className="font-display text-[1.5rem] sm:text-[1.8rem] md:text-[2rem] lg:text-[2.1rem] font-bold leading-none text-white"
            >
                {value}
                {suffix}
            </div>
            <div className="mt-1.5 font-mono text-[0.66rem] sm:text-[0.7rem] md:text-[0.72rem] tracking-wide text-white/70">
                {label}
            </div>
        </div>
    )
}

export default function Hero() {
    return (
        <section
            id="hero"
            className="relative flex min-h-screen min-h-[100svh] items-center overflow-hidden bg-charcoal"
        >
            {/* background photo - solar installation (real <img>, not CSS background, so it always renders) */}
            <img
                src={heroImg}
                alt="AKS Solar rooftop panel installation"
                className="absolute inset-0 z-0 h-full w-full object-cover"
            />

            {/* dark gradient overlay for text contrast - lightened so the photo stays visible */}
            <div
                className="absolute inset-0 z-[1]"
                style={{ background: 'linear-gradient(180deg, rgba(15,14,18,0.55) 0%, rgba(15,14,18,0.65) 55%, rgba(15,14,18,0.8) 100%)' }}
            ></div>

            {/* faint graph-paper grid on top of overlay */}
            <div
                className="hero-grid absolute inset-0 z-[2]"
                style={{
                    backgroundImage:
                        'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
                    backgroundSize: '40px 40px',
                    maskImage: 'radial-gradient(circle at 50% 40%, black 0%, black 45%, transparent 85%)',
                    WebkitMaskImage: 'radial-gradient(circle at 50% 40%, black 0%, black 45%, transparent 85%)',
                }}
            ></div>

            {/* ember/gold ambient glow, centered behind headline */}
            <div
                className="pointer-events-none absolute left-1/2 top-0 z-[2] h-[90%] w-[90%] -translate-x-1/2"
                style={{ background: 'radial-gradient(circle at 50% 30%, rgba(255,77,46,0.22) 0%, rgba(228,255,78,0.12) 34%, transparent 65%)' }}
            ></div>

            <div className="container relative z-[5] mx-auto flex w-full max-w-[880px] flex-col items-center px-5 pt-28 pb-16 text-center sm:px-7 sm:pt-24 md:px-8 md:pt-20">
                <div className="mb-5 flex items-center gap-2 font-mono text-[0.7rem] font-bold uppercase tracking-[0.14em] text-gold opacity-0 animate-hero-fade-up [animation-delay:0.15s] sm:mb-6 sm:gap-2.5 sm:text-[0.78rem] sm:tracking-[0.16em]">
                    <span className="h-0.5 w-5 bg-gold sm:w-[26px]"></span>
                    Future Energy Solutions
                    <span className="h-0.5 w-5 bg-gold sm:w-[26px]"></span>
                </div>

                <h1
                    className="mb-6 font-display text-[clamp(2.2rem,9vw,4.8rem)] font-bold leading-[1.02] tracking-[-0.02em] text-white opacity-0 animate-hero-fade-up [animation-delay:0.3s] sm:mb-[26px] sm:leading-[1] sm:tracking-[-0.025em]"
                    style={{ textShadow: '0 2px 24px rgba(0,0,0,0.35)' }}
                >
                    Today's resource<br />
                    for a <span className="text-transparent" style={{ WebkitTextStroke: '1.5px var(--color-gold)' }}>brighter</span> tomorrow.
                </h1>

                <p
                    className="mb-8 max-w-[560px] font-sans text-[0.94rem] leading-[1.7] text-white/85 opacity-0 animate-hero-fade-up [animation-delay:0.45s] sm:mb-10 sm:text-base lg:text-[1.05rem] lg:leading-[1.75]"
                    style={{ textShadow: '0 1px 12px rgba(0,0,0,0.4)' }}
                >
                    AKS Solar Systems Private Limited designs, installs, and maintains solar power plants, rooftop and
                    off-grid systems, solar geysers, and street lights — based in Sunder Nagar, Mandi, Himachal Pradesh.
                </p>

                <div className="mb-12 flex flex-col gap-3 opacity-0 animate-hero-fade-up [animation-delay:0.6s] xs:flex-row xs:flex-wrap xs:justify-center sm:mb-14 sm:flex-row sm:gap-3.5">
                    <a
                        href="#contact"
                        className="inline-flex items-center justify-center gap-2.5 rounded-full bg-gold-deep px-7 py-4 font-sans text-[0.88rem] font-extrabold uppercase tracking-wide text-white shadow-glow-ember transition-all hover:-translate-y-[3px] hover:shadow-[0_18px_42px_rgba(255,77,46,0.4)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold sm:w-auto sm:px-8 sm:py-[17px] sm:text-[0.92rem]"
                    >
                        Get Free Quote <i className="fas fa-arrow-right"></i>
                    </a>
                    <a
                        href="#services"
                        className="inline-flex items-center justify-center gap-2.5 rounded-full border-[1.5px] border-white/40 px-7 py-[15px] font-sans text-[0.88rem] font-extrabold uppercase tracking-wide text-white transition-colors hover:border-gold hover:bg-gold/[0.08] hover:text-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:w-auto sm:px-[30px] sm:py-4 sm:text-[0.92rem]"
                    >
                        Explore Services
                    </a>
                </div>

                <div className="grid grid-cols-3 gap-6 opacity-0 animate-hero-fade-up [animation-delay:0.75s] sm:gap-10 md:gap-14">
                    <HeroStat target={6} label="Solar Services" />
                    <HeroStat target={2023} label="Incorporated" />
                    <HeroStat target={6} label="+ States Served" />
                </div>
            </div>

            <div className="absolute bottom-6 left-1/2 z-[5] hidden -translate-x-1/2 items-center gap-2.5 font-mono text-[0.7rem] uppercase tracking-[0.1em] text-white/70 sm:flex sm:bottom-9">
                <span className="h-9 w-px animate-scroll-pulse bg-gradient-to-b from-gold to-transparent motion-reduce:hidden"></span>
                Scroll
            </div>
        </section>
    )
}