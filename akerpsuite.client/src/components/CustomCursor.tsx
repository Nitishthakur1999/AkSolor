import { useRef } from 'react'
import { useCustomCursor } from '../hooks/useCustomCursor'

export default function CustomCursor() {
    const ringRef = useRef(null)
    const dotRef = useRef(null)
    const ghostRef = useRef(null)
    useCustomCursor(ringRef, dotRef, ghostRef)

    return (
        <>
            <div id="cursor-ring" ref={ringRef}></div>
            <div id="cursor-dot" ref={dotRef}></div>
            <div id="cursor-ghost" ref={ghostRef}></div>
        </>
    )
}
