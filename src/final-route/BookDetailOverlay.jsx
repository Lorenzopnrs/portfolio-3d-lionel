import { handleImageError } from '../assets/imageFallback.js'
import { ArchiveDialog } from './ArchiveDialog'
import { EmbeddedYouTubeMedia } from './EmbeddedYouTubeMedia'

export function BookDetailOverlay({ book, onClose }) {
  return (
    <ArchiveDialog
      className="book-detail-dialog"
      kicker="Archive littéraire"
      onClose={onClose}
      title={book.title}
      titleId="book-detail-title"
    >
      <div className="book-detail-layout">
        <figure className="book-cover-figure">
          <img
            src={book.cover.src}
            alt={book.cover.alt}
            decoding="async"
            onError={handleImageError}
          />
          <figcaption>{book.author}</figcaption>
        </figure>

        <article className="book-detail-copy">
          <dl className="archive-metadata">
            <div>
              <dt>Auteur</dt>
              <dd>{book.author}</dd>
            </div>
            <div>
              <dt>Catégorie</dt>
              <dd>{book.category}</dd>
            </div>
          </dl>

          {book.hook && <blockquote>{book.hook}</blockquote>}

          <section className="archive-reading-section">
            <h3>Quatrième de couverture</h3>
            {book.backCover.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </section>

          <section className="archive-media-section">
            <div className="archive-section-heading">
              <p>Image animée</p>
              <h3>Bande-annonce</h3>
            </div>
            {book.teaser ? (
              <EmbeddedYouTubeMedia
                media={book.teaser}
                linkLabel="Ouvrir la bande-annonce sur YouTube"
              />
            ) : (
              <p className="archive-media-unavailable" role="status">
                Aucun fichier de bande-annonce n’a été fourni pour ce livre.
              </p>
            )}
          </section>
        </article>
      </div>
    </ArchiveDialog>
  )
}
