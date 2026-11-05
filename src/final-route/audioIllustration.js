import { ImageLoader } from 'three'
import { getYouTubeVideoId } from './projectMedia.js'

const ANALYSIS_WIDTH = 64
const ANALYSIS_HEIGHT = 36
const BLACK_BAR_LUMINANCE = 14
const MINIMUM_CONTENT_RATIO = 0.2
// YouTube answers a missing size with a small grey image, not with an error.
const YOUTUBE_PLACEHOLDER_WIDTH = 120
const MAXIMUM_ILLUSTRATION_WIDTH = 720
const SERIF = 'Georgia, "Times New Roman", serif'

const illustrations = new Map()

// An illustration added in Sanity comes first, then the video's own thumbnail.
export function getAudioIllustrationSources(story) {
  const videoId = getYouTubeVideoId(story?.media?.sourceUrl)

  return [
    story?.image?.src,
    ...(videoId
      ? [
          `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
          `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        ]
      : []),
  ].filter(Boolean)
}

function isBlackLine(pixels, width, start, step, count) {
  let total = 0

  for (let index = 0; index < count; index += 1) {
    const offset = (start + index * step) * 4
    total += (pixels[offset] + pixels[offset + 1] + pixels[offset + 2]) / 3
  }

  return total / count < BLACK_BAR_LUMINANCE
}

// Thumbnails often show a square illustration between two black bars.
export function findContentBounds(pixels, width, height) {
  let left = 0
  let right = width - 1
  let top = 0
  let bottom = height - 1

  while (left < right && isBlackLine(pixels, width, left, width, height)) {
    left += 1
  }

  while (right > left && isBlackLine(pixels, width, right, width, height)) {
    right -= 1
  }

  while (top < bottom && isBlackLine(pixels, width, top * width, 1, width)) {
    top += 1
  }

  while (bottom > top && isBlackLine(pixels, width, bottom * width, 1, width)) {
    bottom -= 1
  }

  const bounds = {
    bottom: (bottom + 1) / height,
    left: left / width,
    right: (right + 1) / width,
    top: top / height,
  }

  return bounds.right - bounds.left < MINIMUM_CONTENT_RATIO ||
    bounds.bottom - bounds.top < MINIMUM_CONTENT_RATIO
    ? { bottom: 1, left: 0, right: 1, top: 0 }
    : bounds
}

function cropToContent(image) {
  const analysis = document.createElement('canvas')
  analysis.width = ANALYSIS_WIDTH
  analysis.height = ANALYSIS_HEIGHT
  const analysisContext = analysis.getContext('2d', {
    willReadFrequently: true,
  })
  analysisContext.drawImage(image, 0, 0, ANALYSIS_WIDTH, ANALYSIS_HEIGHT)

  const { bottom, left, right, top } = findContentBounds(
    analysisContext.getImageData(0, 0, ANALYSIS_WIDTH, ANALYSIS_HEIGHT).data,
    ANALYSIS_WIDTH,
    ANALYSIS_HEIGHT,
  )
  const sourceX = left * image.naturalWidth
  const sourceY = top * image.naturalHeight
  const sourceWidth = (right - left) * image.naturalWidth
  const sourceHeight = (bottom - top) * image.naturalHeight
  const scale = Math.min(1, MAXIMUM_ILLUSTRATION_WIDTH / sourceWidth)
  const illustration = document.createElement('canvas')
  illustration.width = Math.round(sourceWidth * scale)
  illustration.height = Math.round(sourceHeight * scale)
  illustration
    .getContext('2d')
    .drawImage(
      image,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      0,
      0,
      illustration.width,
      illustration.height,
    )

  return illustration
}

function loadImage(source) {
  return new Promise((resolve) => {
    new ImageLoader().load(source, resolve, undefined, () => resolve(null))
  })
}

async function loadFirstAvailableIllustration(sources) {
  for (const source of sources) {
    const image = await loadImage(source)

    if (image && image.naturalWidth > YOUTUBE_PLACEHOLDER_WIDTH) {
      return cropToContent(image)
    }
  }

  return null
}

// Shared by the frames and the shelf, so each illustration loads only once.
export function loadAudioIllustration(story) {
  const sources = getAudioIllustrationSources(story)
  const key = sources.join('|')

  if (!illustrations.has(key)) {
    illustrations.set(key, loadFirstAvailableIllustration(sources))
  }

  return illustrations.get(key)
}

function getTitleLines(context, title, maximumWidth) {
  const lines = []
  let line = ''

  title.split(' ').forEach((word) => {
    const candidate = line ? `${line} ${word}` : word

    if (line && context.measureText(candidate).width > maximumWidth) {
      lines.push(line)
      line = word
    } else {
      line = candidate
    }
  })

  return line ? [...lines, line] : lines
}

// Shown until the illustration arrives, or for good if a story has none.
export function drawAudioTitleCard(context, story, width, height) {
  const gradient = context.createLinearGradient(0, 0, width, height)
  gradient.addColorStop(0, '#231a13')
  gradient.addColorStop(1, '#100d0a')
  context.fillStyle = gradient
  context.fillRect(0, 0, width, height)

  const inset = Math.round(width * 0.06)
  context.strokeStyle = 'rgb(197 166 112 / 62%)'
  context.lineWidth = Math.max(2, Math.round(width * 0.006))
  context.strokeRect(inset, inset, width - inset * 2, height - inset * 2)

  const fontSize = Math.round(width * 0.09)
  context.fillStyle = '#e4c98a'
  context.font = `600 ${fontSize}px ${SERIF}`
  context.textAlign = 'center'
  context.textBaseline = 'middle'

  const lines = getTitleLines(
    context,
    story?.title ?? '',
    width - inset * 4,
  )
  const lineHeight = fontSize * 1.25
  lines.forEach((line, index) => {
    context.fillText(
      line,
      width / 2,
      height / 2 + (index - (lines.length - 1) / 2) * lineHeight,
    )
  })
}
