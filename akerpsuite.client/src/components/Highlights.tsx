import Reveal from './Reveal'
import { CONTACT } from '../data/siteData'

export default function Highlights() {
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
                    <div className="max-w-[900px] overflow-hidden rounded-[20px] border border-line-strong shadow-glow">
                        <video
                            controls
                            preload="none"
                            poster="https://images.unsplash.com/photo-1509391366360-2e959784a276?w=1200&q=70&auto=format&fit=crop"
                            className="block w-full bg-black"
                        >
                            <source src={CONTACT.videoSrc} type="video/mp4" />
                        </video>
                    </div>
                </Reveal>
            </div>
        </section>
    )
}
