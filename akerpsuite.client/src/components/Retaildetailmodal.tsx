import { X } from 'lucide-react'

export default function RetailDetailModal({ open, onClose, retail }) {
    if (!open || !retail) return null

    return (
        <div
            className="fixed inset-0 z-[2000] flex items-center justify-center bg-charcoal/70 p-4"
            onClick={onClose}
        >
            <div
                className="relative w-full max-w-[480px] overflow-hidden rounded-2xl border border-line-strong bg-chalk shadow-[0_25px_60px_-10px_rgba(0,0,0,0.5)]"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close"
                    className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-chalk/90 text-charcoal shadow-md transition-colors hover:text-gold-deep"
                >
                    <X size={18} />
                </button>

                {retail.detailImg && (
                    <img
                        src={retail.detailImg}
                        alt={`${retail.title} details`}
                        loading="lazy"
                        className="h-[200px] w-full object-cover"
                    />
                )}

                <div className="p-7">
                    <span className="mb-2 block font-mono text-[0.68rem] uppercase tracking-[0.08em] text-slate">
                        {retail.tag}
                    </span>
                    <h3 className="mb-4 font-display text-[1.3rem] font-bold text-charcoal">
                        {retail.title}
                    </h3>
                    <ul className="space-y-2">
                        {retail.subItems.map((item) => (
                            <li key={item} className="text-[0.92rem] leading-[1.6] text-slate">
                                {item}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    )
}