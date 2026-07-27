import Reveal from './Reveal'
import { partners } from '../data/siteData'

export default function Partners() {
    return (
        <section id="partners" className="relative overflow-hidden bg-chalk py-16">
            <div
                className="pointer-events-none absolute -top-[8%] left-0 right-0 -bottom-[8%] z-0 opacity-5"
                style={{ background: "url('https://images.unsplash.com/photo-1497440001374-f26997328c1b?w=1400&q=60&auto=format&fit=crop') center 70%/cover", transform: 'translateY(var(--parallax-y, 0px))' }}
            ></div>
            <Reveal className="container relative z-[1] mx-auto max-w-[1240px] px-7">
                <p className="mb-9 text-center font-mono text-[0.7rem] uppercase tracking-[0.12em] text-slate">Our Valued Customers</p>
                <div className="flex flex-wrap items-center justify-between gap-8 opacity-70">
                    {partners.map((name) => (
                        <div className="flex items-center gap-2 font-display text-[1.15rem] font-bold tracking-[-0.01em] text-charcoal-soft transition-colors hover:text-gold hover:opacity-100" key={name}>
                            <i className="fas fa-building"></i> {name}
                        </div>
                    ))}
                </div>
            </Reveal>
        </section>
    )
}
