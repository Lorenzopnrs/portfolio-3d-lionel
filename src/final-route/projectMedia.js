function hasText(value) {
  return typeof value === 'string' && value.trim().length > 0
}

export function hasAccessibleImage(media) {
  return hasText(media?.src) && hasText(media?.alt)
}

export function getImageAlternative(media, fallback) {
  return hasText(media?.alt) ? media.alt.trim() : fallback
}

export function getCaptionTrackSource(video) {
  if (hasText(video?.captionTrack)) {
    return video.captionTrack
  }

  return hasText(video?.captionTrack?.src)
    ? video.captionTrack.src
    : null
}

export function canRenderProjectVideo(video) {
  return Boolean(
    hasText(video?.src) &&
      (getCaptionTrackSource(video) || hasText(video?.transcript)),
  )
}

export function getYouTubeVideoId(sourceUrl) {
  if (!hasText(sourceUrl)) {
    return null
  }

  try {
    const url = new URL(sourceUrl)
    const host = url.hostname.replace(/^www\./, '')

    if (host === 'youtu.be') {
      return url.pathname.split('/').filter(Boolean)[0] ?? null
    }

    if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
      if (url.pathname === '/watch') {
        return url.searchParams.get('v')
      }

      const [route, videoId] = url.pathname.split('/').filter(Boolean)
      return ['embed', 'shorts'].includes(route) ? videoId ?? null : null
    }
  } catch {
    return null
  }

  return null
}

export function getYouTubeEmbedUrl(sourceUrl) {
  const videoId = getYouTubeVideoId(sourceUrl)

  return videoId
    ? `https://www.youtube-nocookie.com/embed/${videoId}?rel=0`
    : null
}
