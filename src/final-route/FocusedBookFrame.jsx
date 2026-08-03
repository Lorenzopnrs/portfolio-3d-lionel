import { useEffect, useRef } from 'react'

const FOCUSABLE_SELECTOR = [
  'button:not([disabled])',
  'a[href]',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

export function FocusedBookFrame({
  book,
  onClose,
  onOpenDetails,
  reducedMotionEnabled,
}) {
  const dialogRef = useRef(null)
  const openButtonRef = useRef(null)

  useEffect(() => {
    openButtonRef.current?.focus()

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
      const firstElement = focusableElements[0]
      const lastElement = focusableElements.at(-1)

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault()
        lastElement?.focus()
      } else if (
        !event.shiftKey &&
        document.activeElement === lastElement
      ) {
        event.preventDefault()
        firstElement?.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div
      className={`book-focus-backdrop${reducedMotionEnabled ? ' is-reduced-motion' : ''}`}
      data-travel-lock
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <section
        ref={dialogRef}
        className="book-focus-presentation"
        role="dialog"
        aria-modal="true"
        aria-labelledby="book-focus-title"
        aria-describedby="book-focus-instruction"
      >
        <button
          type="button"
          className="book-focus-close"
          onClick={onClose}
          aria-label={`Fermer la présentation de ${book.title}`}
          title="Revenir au parcours"
        >
          X
        </button>

        <p className="book-focus-kicker">Galerie des livres</p>

        <button
          ref={openButtonRef}
          type="button"
          className="book-focus-cover-button"
          onClick={(event) => onOpenDetails(event.currentTarget)}
          aria-label={`Ouvrir les informations de ${book.title}`}
        >
          <span className="book-focus-frame" aria-hidden="true">
            <span className="book-focus-frame-inner">
              <img
                src={book.cover.src}
                alt=""
                decoding="async"
              />
            </span>
          </span>
        </button>

        <div className="book-focus-plaque">
          <h2 id="book-focus-title">{book.title}</h2>
          <p>{book.author}</p>
          <p id="book-focus-instruction">
            Activer la couverture pour consulter le manuscrit complet.
          </p>
        </div>
      </section>
    </div>
  )
}
