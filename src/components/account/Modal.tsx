'use client'
import { useEffect } from 'react'
import { createPortal } from 'react-dom'

// Shared modal shell for all /account modals. Portaled to <body> so the fixed
// overlay is always viewport-relative and above the page (page cards live in an
// `animate-fade-up` transformed ancestor that would otherwise clip a nested
// fixed element). Header + footer are pinned; only the middle scrolls, so the
// modal never exceeds the viewport and action buttons stay visible.
export default function Modal({
  title, subtitle, onClose, children, footer, closeLabel,
}: {
  title:      string
  subtitle?:  string
  onClose:    () => void
  children:   React.ReactNode
  footer?:    React.ReactNode
  closeLabel?: string
}) {
  // Lock page scroll while the modal is open.
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  if (typeof document === 'undefined') return null

  return createPortal(
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 p-3 sm:p-4" onClick={onClose}>
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl sm:max-h-[85vh]"
        onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex flex-shrink-0 items-start justify-between gap-4 border-b border-gray-100 px-6 pt-6 pb-4">
          <div className="min-w-0">
            <h3 className="text-xl font-semibold text-[#412618]">{title}</h3>
            {subtitle && <p className="mt-1 text-sm text-gray-600">{subtitle}</p>}
          </div>
          <button type="button" onClick={onClose} aria-label={closeLabel || 'Close'}
            className="-mr-2 -mt-1 shrink-0 rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </div>
        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">{children}</div>
        {/* Footer (optional) */}
        {footer && <div className="flex-shrink-0 border-t border-gray-100 bg-white px-6 pb-6 pt-4">{footer}</div>}
      </div>
    </div>,
    document.body,
  )
}
