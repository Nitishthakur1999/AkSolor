import { tickerItems } from '../data/siteData'

export default function Ticker() {
    const doubled = [...tickerItems, ...tickerItems]
    return (
        <div
            className="relative z-50 overflow-hidden py-[13px]"
            style={{ background: 'color-mix(in srgb, var(--color-gold-deep) 75%, black)' }}
        >
            <div className="flex w-max animate-ticker-scroll whitespace-nowrap font-mono text-[0.66rem] font-bold tracking-wide text-chalk hover:[animation-play-state:paused] xs:text-[0.7rem] sm:text-[0.74rem]">
                {doubled.map((item, i) => (
                    <span key={i} className="flex items-center">
                        <span>{item}</span>
                        <span className="mx-4 opacity-45 xs:mx-5 sm:mx-[26px]">◆</span>
                    </span>
                ))}
            </div>
        </div>
    )
}