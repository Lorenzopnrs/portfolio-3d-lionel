import { getYouTubeEmbedUrl } from './projectMedia'

export function EmbeddedYouTubeMedia({ media, linkLabel }) {
  const embedUrl = getYouTubeEmbedUrl(media?.sourceUrl)

  if (!embedUrl) {
    return (
      <p className="archive-media-unavailable" role="status">
        Le lien média fourni n’a pas pu être chargé.
      </p>
    )
  }

  return (
    <figure className="archive-media">
      <div className="archive-media-frame">
        <iframe
          src={embedUrl}
          title={media.title}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
      <figcaption>
        <span>Média diffusé via YouTube</span>
        <a
          href={media.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          {linkLabel}
        </a>
      </figcaption>
    </figure>
  )
}
