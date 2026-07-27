import { useEffect, useRef, useState, type RefObject } from 'react'

// Animates a number counting up to `target` the first time the element
// scrolls into view. Mirrors the original animCount() + IntersectionObserver
// pairing used for the hero stats and impact counters.
export function useCountUp(target: number, duration: number = 1700): [RefObject<any>, number] {
  const ref = useRef<any>(null)
  const [value, setValue] = useState(0)
  const startedRef = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !startedRef.current) {
            startedRef.current = true
            const start = performance.now()
            function step(now: number) {
              const t = Math.min((now - start) / duration, 1)
              const eased = 1 - Math.pow(1 - t, 3)
              setValue(Math.round(eased * target))
              if (t < 1) requestAnimationFrame(step)
            }
            requestAnimationFrame(step)
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.3 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [target, duration])

  return [ref, value]
}
