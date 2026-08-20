import { useEffect } from 'react'

export default function Lightbox({ items, index, open, show, onClose, onPrev, onNext }) {
    useEffect(() => {
        if (!open) return
        document.body.style.overflow = 'hidden'
        function onKeyDown(e) {
            if (e.key === 'Escape') onClose()
            else if (e.key === 'ArrowRight') onNext()
            else if (e.key === 'ArrowLeft') onPrev()
        }
        document.addEventListener('keydown', onKeyDown)
        return () => {
            document.body.style.overflow = ''
            document.removeEventListener('keydown', onKeyDown)
        }
    }, [open, onClose, onPrev, onNext])

    if (index === null || index === undefined) return null
    const item = items[index]

    return (
        <div
            id="lightbox"
            className={`fixed inset-0 z-[5000] items-center justify-center p-4 transition-opacity duration-300 md:p-10 ${open ? 'flex' : 'hidden'} ${show ? 'opacity-100' : 'opacity-0'}`}
            style={{ background: 'rgba(18, 19, 28,0.92)' }}
            role="dialog"
            aria-modal="true"
            aria-label="Photo viewer"
            onClick={(e) => { if ((e.target as HTMLElement).id === 'lightbox') onClose() }}
        >
            <button
                className="absolute right-3.5 top-3.5 flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.14] bg-white/[0.06] text-[1.1rem] text-white transition-colors hover:bg-white/10 md:right-7 md:top-6 md:h-11 md:w-11"
                aria-label="Close" onClick={onClose}
            >
                <i className="fas fa-times"></i>
            </button>
            <button
                className="absolute left-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/[0.14] bg-white/[0.06] text-base text-white transition-colors hover:bg-white/10 md:left-5 md:h-12 md:w-12 md:text-[1.2rem]"
                aria-label="Previous photo" onClick={onPrev}
            >
                <i className="fas fa-chevron-left"></i>
            </button>
            <button
                className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/[0.14] bg-white/[0.06] text-base text-white transition-colors hover:bg-white/10 md:right-5 md:h-12 md:w-12 md:text-[1.2rem]"
                aria-label="Next photo" onClick={onNext}
            >
                <i className="fas fa-chevron-right"></i>
            </button>
            <div className={`flex w-full max-w-[1000px] flex-col items-center px-10 transition-transform duration-300 sm:px-0 ${show ? 'scale-100' : 'scale-[0.94]'}`} style={{ maxHeight: '84vh' }}>
                {item && (
                    <img
                        src={item.img}
                        alt={item.alt}
                        className="max-h-[74vh] max-w-full rounded-[10px] object-contain shadow-[0_30px_70px_rgba(0,0,0,0.5)]"
                    />
                )}
                <div className="mt-4 text-center font-display text-[0.95rem] font-semibold text-white">{item?.caption}</div>
                <div className="mt-1 font-mono text-[0.72rem] tracking-wide text-slate-light">{index + 1} / {items.length}</div>
            </div>
        </div>
    )
}