import { useEffect, useRef } from 'react'

const HOVER_TARGETS =
  'a, button, input, select, textarea, .why-card, .service-card, .process-card, ' +
  '.testi-card, .nav-link, .gallery-card, .team-card, .faq-question, .partner-logo, .pgallery-item'

// Custom ring/dot/ghost cursor. Refs are passed in from the CustomCursor
// component so this hook owns only behavior, not markup.
//
// This carries forward three fixes made after the original vanilla build
// shipped with real, reproducible bugs:
//  1. "cursor-active" (the class controlling ring/dot visibility) was only
//     ever added on the *first* mousemove, gated behind a cursorStarted
//     check. Once removed for any reason, it could never come back —
//     the whole custom cursor would vanish permanently for the session.
//  2. The Google Map embed and video are separate documents/contexts, so
//     mousemove never reaches the parent page while hovering them —
//     combined with bug #1, hovering the map even once killed the cursor
//     site-wide. Fixed by treating `mouseout` with relatedTarget === null
//     (true both for leaving the window AND crossing into an iframe/video)
//     as "hide the cursor", and always re-showing it on the next mousemove.
//  3. Hovering nested elements inside a hoverable target (an icon inside a
//     button, a caret inside a nav-link) fired mouseout→mouseover in quick
//     succession even though the pointer never left the outer region,
//     visibly flickering the ring in and out of its hover state. Fixed by
//     checking whether relatedTarget is still contained in the matched
//     element before clearing cursor-hover.
export function useCustomCursor(ringRef, dotRef, ghostRef) {
  const stateRef = useRef({
    mx: -100, my: -100, rx: -100, ry: -100, gx: -100, gy: -100,
    prevRx: -100, prevRy: -100, cursorStarted: false,
  })

  useEffect(() => {
    const supportsFinePointer = window.matchMedia('(pointer: fine)').matches
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!supportsFinePointer || prefersReducedMotion) return

    document.body.classList.add('has-custom-cursor')
    const ring = ringRef.current
    const dot = dotRef.current
    const ghost = ghostRef.current
    const s = stateRef.current
    let idleTimer = null
    let rafId = null

    function markActive() {
      document.body.classList.remove('cursor-idle')
      clearTimeout(idleTimer)
      idleTimer = setTimeout(() => document.body.classList.add('cursor-idle'), 700)
    }

    function onMouseMove(e) {
      s.mx = e.clientX
      s.my = e.clientY
      dot.style.left = s.mx + 'px'
      dot.style.top = s.my + 'px'
      markActive()
      document.body.classList.add('cursor-active')
      if (!s.cursorStarted) {
        s.cursorStarted = true
        s.rx = s.mx; s.ry = s.my; s.gx = s.mx; s.gy = s.my
      }
    }

    function onMouseLeave() {
      document.body.classList.remove('cursor-active')
    }

    function onDocMouseOut(e) {
      if (!e.relatedTarget) {
        document.body.classList.remove('cursor-active')
      }
    }

    function onMouseDown() {
      document.body.classList.add('cursor-down')
    }
    function onMouseUp() {
      document.body.classList.remove('cursor-down')
    }

    function lerp(a, b, t) { return a + (b - a) * t }

    function animRing() {
      s.prevRx = s.rx; s.prevRy = s.ry
      s.rx = lerp(s.rx, s.mx, 0.16)
      s.ry = lerp(s.ry, s.my, 0.16)
      s.gx = lerp(s.gx, s.mx, 0.07)
      s.gy = lerp(s.gy, s.my, 0.07)

      const vx = s.rx - s.prevRx, vy = s.ry - s.prevRy
      const speed = Math.min(Math.sqrt(vx * vx + vy * vy), 26)
      const stretch = 1 + speed * 0.018
      const angle = speed > 0.4 ? Math.atan2(vy, vx) * (180 / Math.PI) : 0

      ring.style.left = s.rx + 'px'
      ring.style.top = s.ry + 'px'
      if (!document.body.classList.contains('cursor-hover') && !document.body.classList.contains('cursor-down')) {
        ring.style.transform = `translate(-50%, -50%) rotate(${angle}deg) scale(${stretch}, ${1 / Math.sqrt(stretch)})`
      } else {
        ring.style.transform = 'translate(-50%, -50%)'
      }

      ghost.style.left = s.gx + 'px'
      ghost.style.top = s.gy + 'px'

      rafId = requestAnimationFrame(animRing)
    }

    function onMouseOverHover(e) {
      if (e.target.closest(HOVER_TARGETS)) document.body.classList.add('cursor-hover')
    }
    function onMouseOutHover(e) {
      const left = e.target.closest(HOVER_TARGETS)
      if (!left) return
      if (e.relatedTarget && left.contains(e.relatedTarget)) return
      document.body.classList.remove('cursor-hover')
    }

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseleave', onMouseLeave)
    document.addEventListener('mouseout', onDocMouseOut)
    document.addEventListener('mousedown', onMouseDown)
    document.addEventListener('mouseup', onMouseUp)
    document.addEventListener('mouseover', onMouseOverHover)
    document.addEventListener('mouseout', onMouseOutHover)
    rafId = requestAnimationFrame(animRing)

    return () => {
      document.body.classList.remove('has-custom-cursor', 'cursor-active', 'cursor-hover', 'cursor-down', 'cursor-idle')
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseleave', onMouseLeave)
      document.removeEventListener('mouseout', onDocMouseOut)
      document.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('mouseup', onMouseUp)
      document.removeEventListener('mouseover', onMouseOverHover)
      document.removeEventListener('mouseout', onMouseOutHover)
      clearTimeout(idleTimer)
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [ringRef, dotRef, ghostRef])
}
