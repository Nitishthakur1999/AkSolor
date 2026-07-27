import { useReveal } from '../hooks/useReveal'
import type { ElementType, ReactNode, CSSProperties } from 'react'

const DELAY_CLASS: Record<number, string> = { 1: 'delay-[80ms]', 2: 'delay-[160ms]', 3: 'delay-[240ms]', 4: 'delay-[320ms]' }

interface RevealProps {
    as?: ElementType;
    delay?: number;
    className?: string;
    style?: CSSProperties;
    children?: ReactNode;
    [key: string]: any;
}

// Wraps any block in the fade-up-on-scroll treatment used throughout the
// design. `as` lets the wrapper render as a semantic element (div by
// default) and `delay` maps to a staggered transition-delay, matching the
// original .d1–.d4 stagger classes.
export default function Reveal({ as: Tag = 'div', delay, className = '', style, children, ...rest }: RevealProps) {
    const [ref, visible] = useReveal()
    const delayClass = delay ? DELAY_CLASS[delay] : ''
    const classes = [
        'transition-all duration-700 ease-out',
        delayClass,
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-7',
        className,
    ].filter(Boolean).join(' ')
    return (
        <Tag ref={ref} className={classes} style={style} {...rest}>
            {children}
        </Tag>
    )
}
