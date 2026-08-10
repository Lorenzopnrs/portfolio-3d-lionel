import { EmbeddedYouTubeMedia } from './EmbeddedYouTubeMedia'
import { getYouTubeEmbedUrl } from './projectMedia'

export function AudioStoryMedia({ media }) {
  if (getYouTubeEmbedUrl(media?.sourceUrl)) {
    return (
      <EmbeddedYouTubeMedia
        media={media}
        linkLabel="Ouvrir l’enregistrement sur YouTube"
      />
    )
  }

  if (!media?.sourceUrl) {
    return (
      <p className="archive-media-unavailable" role="status">
        Aucun enregistrement n’est disponible pour cette histoire.
      </p>
    )
  }

  return (
    <figure className="archive-media audio-file-media">
      <audio controls preload="none" src={media.sourceUrl}>
        Votre navigateur ne prend pas en charge la lecture audio.
      </audio>
      <figcaption>
        <span>Fichier audio hébergé dans les archives</span>
        <a
          href={media.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          Ouvrir le fichier audio
        </a>
      </figcaption>
    </figure>
  )
}
