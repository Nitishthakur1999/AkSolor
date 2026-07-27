import { useEffect, useState } from 'react'

// Tracks the three scroll-driven UI states that used to be three separate
// listeners in the vanilla version: the top progress bar's width, whether
// the pill nav has scrolled into its visible position, and whether the
// scroll-to-top button should show.
export function useScrollChrome() {
  const [progress, setProgress] = useState(0)
  const [navVisible, setNavVisible] = useState(false)
  const [showScrollTop, setShowScrollTop] = useState(false)

  useEffect(() => {
    const revealAt = window.innerHeight * 0.55

    function update() {
      const h = document.documentElement.scrollHeight - window.innerHeight
      setProgress(h > 0 ? (window.scrollY / h) * 100 : 0)
      setNavVisible(window.scrollY > revealAt)
      setShowScrollTop(window.scrollY > 480)
    }

    update()
    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [])

  return { progress, navVisible, showScrollTop }
}
