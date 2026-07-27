import { useEffect } from 'react'

// Single shared rAF loop driving every parallax layer on the page — ported
// directly from the original vanilla implementation. Two position models:
//  - "scroll": offset = scrollY * speed. Used for the hero layers, which
//    always start at the top of the page.
//  - "view": offset is relative to the element's own position in the
//    viewport, so sections deep in the page parallax correctly as they
//    scroll into view rather than jumping based on total page scroll.
export function useParallax() {
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) return

    const layers: Array<{ el: HTMLElement; speed: number; model: string; mode: string; varName?: string }> = []
    function register(selector: string, speed: number, model: string, mode?: string, varName?: string) {
      const el = document.querySelector<HTMLElement>(selector)
      if (el) layers.push({ el, speed, model, mode: mode || 'transform', varName })
    }

    register('.hero-grid', 0.08, 'scroll', 'transform')
    register('.hero-split-gold', 0.14, 'scroll', 'transform')
    register('.hero-sun-stage', 0.24, 'scroll', 'transform')
    register('#impact', 0.10, 'view', 'css-var', '--parallax-y')
    register('#impact', 0.05, 'view', 'css-var', '--parallax-y-slow')
    register('#partners', 0.08, 'view', 'css-var', '--parallax-y')

    let ticking = false
    let rafId: number | null = null

    function updateParallax() {
      const vh = window.innerHeight
      const sy = window.scrollY
      layers.forEach((layer) => {
        let offset
        if (layer.model === 'scroll') {
          if (sy > vh * 1.3) return
          offset = Math.round(sy * layer.speed)
        } else {
          const rect = layer.el.getBoundingClientRect()
          if (rect.bottom < -200 || rect.top > vh + 200) return
          const centerOffset = rect.top + rect.height / 2 - vh / 2
          offset = Math.round(centerOffset * layer.speed * -1)
        }
        if (layer.mode === 'transform') {
          layer.el.style.transform = `translateY(${offset}px)`
        } else {
          layer.el.style.setProperty(layer.varName, `${offset}px`)
        }
      })
      ticking = false
    }

    function onScroll() {
      if (!ticking) {
        rafId = requestAnimationFrame(updateParallax)
        ticking = true
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    updateParallax()

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [])
}
