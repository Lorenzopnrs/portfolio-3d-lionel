import { useEffect, useRef } from 'react'

const FOCUSABLE_SELECTOR = [
  'button:not([disabled])',
  'a[href]',
  'iframe',
  'audio[controls]',
  'video[controls]',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

export function ArchiveDialog({
  children,
  className = '',
  descriptionId,
  kicker,
  onClose,
  title,
  titleId,
  variant = 'default',
}) {
  const dialogRef = useRef(null)
  const closeButtonRef = useRef(null)
  const variantClassName =
    variant === 'manuscript' ? 'is-manuscript' : 'is-default'

  useEffect(() => {
    closeButtonRef.current?.focus()

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }

      if (event.key !== 'Tab' || !dialogRef.current) {
        return
      }

      const focusableElements = [
        ...dialogRef.current.querySelectorAll(FOCUSABLE_SELECTOR),
      ]

      if (focusableElements.length === 0) {
        event.preventDefault()
        return
      }

      const firstElement = focusableElements[0]
      const lastElement = focusableElements.at(-1)

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault()
        lastElement.focus()
      } else if (
        !event.shiftKey &&
        document.activeElement === lastElement
      ) {
        event.preventDefault()
        firstElement.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div
      className="archive-dialog-backdrop"
      data-travel-lock
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <section
        ref={dialogRef}
        className={`archive-dialog ${variantClassName} ${className}`.trim()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
      >
        <header className="archive-dialog-header">
          <div>
            <p className="archive-dialog-kicker">{kicker}</p>
            <h2 id={titleId}>{title}</h2>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            className="archive-dialog-close"
            onClick={onClose}
            aria-label={`Fermer ${title}`}
            title={`Fermer ${title}`}
          >
            X
          </button>
        </header>

        {children}
      </section>
    </div>
  )
}
