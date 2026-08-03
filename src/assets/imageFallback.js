const NEUTRAL_IMAGE_FALLBACK_URL =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=='

export function handleImageError(event) {
  const image = event.currentTarget

  if (image.dataset.assetFallback === 'true') {
    return
  }

  image.dataset.assetFallback = 'true'
  image.removeAttribute('srcset')
  image.src = NEUTRAL_IMAGE_FALLBACK_URL
}
