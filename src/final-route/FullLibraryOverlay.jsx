import { handleImageError } from '../assets/imageFallback.js'
import { ArchiveDialog } from './ArchiveDialog'

export function FullLibraryOverlay({ books, onBookSelect, onClose }) {
  return (
    <ArchiveDialog
      className="full-library-dialog"
      descriptionId="full-library-description"
      kicker="Collection complète"
      onClose={onClose}
      title="La bibliothèque"
      titleId="full-library-title"
    >
      <div className="full-library-content">
        <p id="full-library-description">
          Parcourez l’ensemble des ouvrages disponibles dans les archives.
        </p>
        <ul className="full-library-grid">
          {books.map((book) => (
            <li key={book.id}>
              <button
                type="button"
                data-library-book-id={book.id}
                onClick={(event) =>
                  onBookSelect(book.id, event.currentTarget)
                }
              >
                <span className="full-library-cover">
                  <img
                    src={book.cover.src}
                    alt={book.cover.alt}
                    decoding="async"
                    loading="lazy"
                    onError={handleImageError}
                  />
                </span>
                <span className="full-library-book-copy">
                  <strong>{book.title}</strong>
                  <small>{book.author}</small>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </ArchiveDialog>
  )
}
