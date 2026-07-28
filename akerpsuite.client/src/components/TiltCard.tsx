// TiltCard.tsx — wraps any card in a pointer-driven 3D tilt (rotateX/rotateY)
// with a soft glare sweep and lift-on-hover. Pure CSS transforms, no deps,
// so it drops into existing card grids without touching their markup much.
import { useRef, type ReactNode, type CSSProperties } from 'react'

interface TiltCardProps {
    children: ReactNode
    className?: string
    style?: CSSProperties
    maxTilt?: number
    glare?: boolean
}

export default function TiltCard({
    children,
    className = '',
    style,
    maxTilt = 10,
    glare = true,
}: TiltCardProps) {
    const wrapRef = useRef<HTMLDivElement>(null)
    const glareRef = useRef<HTMLDivElement>(null)

    function onMove(e: React.PointerEvent<HTMLDivElement>) {
        const el = wrapRef.current
        if (!el || e.pointerType === 'touch') return
        const rect = el.getBoundingClientRect()
        const px = (e.clientX - rect.left) / rect.width
        const py = (e.clientY - rect.top) / rect.height
        const rotateY = (px - 0.5) * maxTilt * 2
        const rotateX = (0.5 - py) * maxTilt * 2
        el.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(6px)`
        if (glareRef.current) {
            glareRef.current.style.background = `radial-gradient(circle at ${px * 100}% ${py * 100}%, rgba(255,255,255,0.16), transparent 55%)`
        }
    }

    function onLeave() {
        const el = wrapRef.current
        if (!el) return
        el.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg) translateZ(0px)'
        if (glareRef.current) glareRef.current.style.background = 'transparent'
    }

    return (
        <div
            ref={wrapRef}
            onPointerMove={onMove}
            onPointerLeave={onLeave}
            className={`relative will-change-transform transition-transform duration-300 ease-out [transform-style:preserve-3d] ${className}`}
            style={{ ...style }}
        >
            {children}
            {glare && (
                <div
                    ref={glareRef}
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 z-20 transition-[background] duration-150"
                />
            )}
        </div>
    )
}
