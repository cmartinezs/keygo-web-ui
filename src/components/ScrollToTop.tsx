import { useEffect, useState } from 'react'
import { IconArrowUp } from '@/components/icons'

export function ScrollToTop() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > 200)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (!visible) return null

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Volver al inicio de la página"
      className="fixed bottom-8 right-8 z-50 w-11 h-11 rounded-full bg-indigo-600 text-white shadow-lg hover:bg-indigo-500 transition-colors focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 flex items-center justify-center"
    >
      <IconArrowUp aria-hidden="true" />
    </button>
  )
}
