import { handleImageError } from '../assets/imageFallback.js'
import { ArchiveDialog } from './ArchiveDialog'

export function AboutDetailOverlay({ about, onClose }) {
  return (
    <ArchiveDialog
      className="about-detail-dialog"
      descriptionId="about-detail-introduction"
      kicker="Archive personnelle"
      onClose={onClose}
      title={about.title}
      titleId="about-detail-title"
      variant="manuscript"
    >
      <div className="about-detail-layout">
        <figure className="about-portrait-figure">
          <img
            src={about.portrait.src}
            alt={about.portrait.alt}
            decoding="async"
            onError={handleImageError}
          />
          <figcaption>Lionel Chiry</figcaption>
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
