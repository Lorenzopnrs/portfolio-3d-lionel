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
