import { tickerItems } from '../data/siteData'

export default function Ticker() {
    const doubled = [...tickerItems, ...tickerItems]
    return (
        <div className="relative z-50 overflow-hidden bg-gradient-to-r from-gold via-green to-gold-deep py-[13px]">
            <div className="flex w-max animate-ticker-scroll whitespace-nowrap font-mono text-[0.74rem] font-bold tracking-wide text-chalk hover:[animation-play-state:paused]">
                {doubled.map((item, i) => (
                    <span key={i} className="flex items-center">
                        <span>{item}</span>
                        <span className="mx-[26px] opacity-45">◆</span>
                    </span>
                ))}
            </div>
        </div>
    )
}
