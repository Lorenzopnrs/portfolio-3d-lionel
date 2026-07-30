import { useEffect, useRef } from 'react'

const FOCUSABLE_SELECTOR = [
  'button:not([disabled])',
  'a[href]',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

export function AboutDetailOverlay({ about, onClose }) {
  const dialogRef = useRef(null)
  const closeButtonRef = useRef(null)

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
      className="project-focus-backdrop"
      data-travel-lock
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <section
        ref={dialogRef}
        className="about-focus-view"
        role="dialog"
        aria-modal="true"
        aria-labelledby="about-focus-title"
        aria-describedby="about-focus-summary"
      >
        <header className="project-focus-header">
          <div>
            <p className="project-focus-kicker">About archive</p>
            <h2 id="about-focus-title">{about.title}</h2>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            className="project-focus-close"
            onClick={onClose}
            aria-label="Close About me view"
            title="Close About me view"
          >
            X
          </button>
        </header>

        <div className="about-focus-body">
          <p id="about-focus-summary">{about.summary}</p>
        </div>
      </section>
    </div>
  )
}
