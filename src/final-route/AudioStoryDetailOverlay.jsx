import { ArchiveDialog } from './ArchiveDialog'
import { EmbeddedYouTubeMedia } from './EmbeddedYouTubeMedia'

export function AudioStoryDetailOverlay({ onClose, story }) {
  return (
    <ArchiveDialog
      className="audio-detail-dialog"
      kicker="Histoire audio"
      onClose={onClose}
      title={story.title}
      titleId="audio-story-title"
    >
      <div className="audio-detail-layout">
        <article className="audio-detail-copy">
          <p className="archive-chapter-mark" aria-hidden="true">
            Archive d’écoute
          </p>
          <h3>{story.infoTitle}</h3>
          {story.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </article>

        <section
          className="archive-media-section audio-player-section"
          aria-labelledby="audio-player-heading"
        >
          <div className="archive-section-heading">
            <p>Enregistrement</p>
            <h3 id="audio-player-heading">Écouter</h3>
          </div>
          <EmbeddedYouTubeMedia
            media={story.media}
            linkLabel="Ouvrir l’enregistrement sur YouTube"
          />
        </section>
      </div>
    </ArchiveDialog>
  )
}
