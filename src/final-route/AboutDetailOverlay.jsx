import { handleImageError } from '../assets/imageFallback.js'
import { ArchiveDialog } from './ArchiveDialog'

export function AboutDetailOverlay({ about, onClose }) {
  return (
    <ArchiveDialog
      className="about-detail-dialog"
      descriptionId="about-detail-introduction"
      kicker="Portrait d’auteur"
      onClose={onClose}
      title={about.title}
      titleId="about-detail-title"
    >
      <div className="about-detail-layout">
        <figure className="about-portrait-figure">
          <div className="about-portrait-matte">
            <img
              src={about.portrait.src}
              alt={about.portrait.alt}
              decoding="async"
              onError={handleImageError}
            />
          </div>
          <figcaption>
            <strong>Lionel Chiry</strong>
            <span>Auteur</span>
          </figcaption>
        </figure>

        <article className="about-detail-copy">
          {about.paragraphs.map((paragraph, index) => (
            <p
              key={paragraph}
              id={index === 0 ? 'about-detail-introduction' : undefined}
            >
              {paragraph}
            </p>
          ))}
        </article>
      </div>
    </ArchiveDialog>
  )
}
