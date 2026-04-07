import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { IconX, IconCheckmark } from '@/shared/ui/icons'

interface PolicyModalProps {
  isOpen: boolean
  title: string
  children: React.ReactNode
  onClose: () => void
  onAccept: () => void
}

export function PolicyModal({ isOpen, title, children, onClose, onAccept }: PolicyModalProps) {
  const { t } = useTranslation()
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return
    const frame = requestAnimationFrame(() => {
      setHasScrolledToBottom(false)

      // After render, check if content is short enough that scrolling isn't needed
      const el = scrollRef.current
      if (el && el.scrollHeight - el.scrollTop <= el.clientHeight + 4) {
        setHasScrolledToBottom(true)
      }
    })
    return () => cancelAnimationFrame(frame)
  }, [isOpen])

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  function handleScroll() {
    const el = scrollRef.current
    if (!el || hasScrolledToBottom) return
    if (el.scrollHeight - el.scrollTop <= el.clientHeight + 4) {
      setHasScrolledToBottom(true)
    }
  }

  function handleAccept() {
    onAccept()
    onClose()
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="policy-modal-title"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 flex-shrink-0">
          <h2 id="policy-modal-title" className="text-lg font-bold text-slate-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-indigo-500 outline-none"
            aria-label={t('policyModal.close')}
          >
            <IconX className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Scrollable content */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="overflow-y-auto flex-1 px-6 py-4 text-sm text-slate-700 leading-relaxed"
        >
          {children}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 flex-shrink-0">
          {!hasScrolledToBottom && (
            <p className="text-xs text-slate-400 text-center mb-3 flex items-center justify-center gap-1.5">
              <svg className="w-3.5 h-3.5 animate-bounce" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              {t('policyModal.scrollHint')}
            </p>
          )}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 border border-slate-300 text-slate-600 font-semibold px-5 py-2.5 rounded-xl hover:bg-slate-50 transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 outline-none text-sm"
            >
              <IconX className="h-4 w-4 shrink-0" aria-hidden="true" />
              {t('policyModal.close')}
            </button>
            <button
              type="button"
              onClick={handleAccept}
              disabled={!hasScrolledToBottom}
              className="flex-1 inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-semibold px-6 py-2.5 rounded-xl transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 outline-none text-sm"
            >
              <IconCheckmark className="h-4 w-4 shrink-0" aria-hidden="true" />
              {t('policyModal.accept')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
