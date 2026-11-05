import { useEffect, useMemo } from 'react'
import {
  BoxGeometry,
  CanvasTexture,
  Color,
  ImageLoader,
  MeshStandardMaterial,
  SRGBColorSpace,
} from 'three'
import { SHELF_POSITION, SHELF_SCALE, splitBookTitle } from './libraryShelf.js'
import { ShelfItem, ShelfItemGroup } from './ShelfItem'

const CANVAS_SIZE = 512
const SPINE_WIDTH = 205
const COVER_HEIGHT = 384
const COVER_IMAGE_WIDTH = 320
const FALLBACK_SPINE_COLOR = '#4a2318'
const GOLD = '#e4c98a'
const SERIF = 'Georgia, "Times New Roman", serif'

// Where each side of the box reads in the canvas, as [u0, v0, u1, v1].
const SPINE_REGION = Object.freeze([0, 0, SPINE_WIDTH / CANVAS_SIZE, 1])
const COVER_REGION = Object.freeze([
  SPINE_WIDTH / CANVAS_SIZE,
  1 - COVER_HEIGHT / CANVAS_SIZE,
  1,
  1,
])
const PAGES_REGION = Object.freeze([
  SPINE_WIDTH / CANVAS_SIZE,
  0,
  1,
  1 - COVER_HEIGHT / CANVAS_SIZE,
])
const LEATHER_REGION = Object.freeze([0.002, 0.45, 0.012, 0.55])
const FACE_REGIONS = Object.freeze([
  COVER_REGION,
  LEATHER_REGION,
  PAGES_REGION,
  PAGES_REGION,
  SPINE_REGION,
  LEATHER_REGION,
])

function createBookGeometry({ depth, height, thickness }) {
  const geometry = new BoxGeometry(thickness, height, depth)
  const uv = geometry.getAttribute('uv')

  FACE_REGIONS.forEach(([u0, v0, u1, v1], face) => {
    for (let corner = 0; corner < 4; corner += 1) {
      const vertex = face * 4 + corner

      uv.setXY(
        vertex,
        u0 + uv.getX(vertex) * (u1 - u0),
        v0 + uv.getY(vertex) * (v1 - v0),
      )
    }
  })

  return geometry
}

function getSpineColor(image) {
  const color = new Color(FALLBACK_SPINE_COLOR)

  if (!image) {
    return color
  }

  const canvas = document.createElement('canvas')
  canvas.width = 12
  canvas.height = 12
  const context = canvas.getContext('2d', { willReadFrequently: true })
  context.drawImage(image, 0, 0, canvas.width, canvas.height)
  const { data } = context.getImageData(0, 0, canvas.width, canvas.height)
  let red = 0
  let green = 0
  let blue = 0

  for (let index = 0; index < data.length; index += 4) {
    red += data[index]
    green += data[index + 1]
    blue += data[index + 2]
  }

  const pixelCount = data.length / 4
  const hsl = {}

  color.setRGB(
    red / pixelCount / 255,
    green / pixelCount / 255,
    blue / pixelCount / 255,
    SRGBColorSpace,
  )
  color.getHSL(hsl, SRGBColorSpace)
  // Keeps the cover's hue, but dark enough for gold lettering and old leather.
  color.setHSL(
    hsl.h,
    Math.min(0.62, Math.max(0.28, hsl.s)),
    Math.min(0.3, Math.max(0.17, hsl.l)),
    SRGBColorSpace,
  )

  return color
}

function fillFittedText(context, text, y, maximumWidth, size, style) {
  let fontSize = size

  context.font = `${style} ${fontSize}px ${SERIF}`

  while (context.measureText(text).width > maximumWidth && fontSize > 14) {
    fontSize -= 1
    context.font = `${style} ${fontSize}px ${SERIF}`
  }

  context.fillText(text, 0, y)
}

function drawSpine(context, book, baseColor) {
  const { main, subtitle } = splitBookTitle(book.title)
  const base = `#${baseColor.getHexString(SRGBColorSpace)}`
  const curve = context.createLinearGradient(0, 0, SPINE_WIDTH, 0)

  curve.addColorStop(0, 'rgb(0 0 0 / 55%)')
  curve.addColorStop(0.22, 'rgb(0 0 0 / 0%)')
  curve.addColorStop(0.5, 'rgb(255 236 200 / 10%)')
  curve.addColorStop(0.78, 'rgb(0 0 0 / 0%)')
  curve.addColorStop(1, 'rgb(0 0 0 / 55%)')

  context.fillStyle = base
  context.fillRect(0, 0, SPINE_WIDTH, CANVAS_SIZE)
  context.fillStyle = curve
  context.fillRect(0, 0, SPINE_WIDTH, CANVAS_SIZE)

  context.fillStyle = GOLD
  ;[26, 40, CANVAS_SIZE - 44, CANVAS_SIZE - 30].forEach((y) => {
    context.fillRect(12, y, SPINE_WIDTH - 24, 3)
  })

  // French spines read from bottom to top.
  context.save()
  context.translate(SPINE_WIDTH / 2, CANVAS_SIZE / 2)
  context.rotate(-Math.PI / 2)
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.fillStyle = GOLD
  context.shadowColor = 'rgb(0 0 0 / 70%)'
  context.shadowBlur = 3

  const availableLength = CANVAS_SIZE - 110

  if (subtitle) {
    fillFittedText(context, main, -50, availableLength, 42, '700')
    fillFittedText(context, subtitle, 4, availableLength, 34, 'italic 500')
    fillFittedText(context, book.author ?? '', 52, availableLength, 22, '500')
  } else {
    fillFittedText(context, main, -22, availableLength, 50, '700')
    fillFittedText(context, book.author ?? '', 34, availableLength, 24, '500')
  }

  context.restore()
}

function drawCover(context, image, baseColor) {
  context.fillStyle = `#${baseColor.getHexString(SRGBColorSpace)}`
  context.fillRect(
    SPINE_WIDTH,
    0,
    CANVAS_SIZE - SPINE_WIDTH,
    COVER_HEIGHT,
  )

  if (image) {
    context.drawImage(
      image,
      SPINE_WIDTH,
      0,
      CANVAS_SIZE - SPINE_WIDTH,
      COVER_HEIGHT,
    )
  }
}

function drawPages(context) {
  context.fillStyle = '#c9b78e'
  context.fillRect(
    SPINE_WIDTH,
    COVER_HEIGHT,
    CANVAS_SIZE - SPINE_WIDTH,
    CANVAS_SIZE - COVER_HEIGHT,
  )
  context.fillStyle = 'rgb(84 62 36 / 35%)'

  for (let y = COVER_HEIGHT + 6; y < CANVAS_SIZE; y += 9) {
    context.fillRect(SPINE_WIDTH, y, CANVAS_SIZE - SPINE_WIDTH, 2)
  }
}

function drawBook(canvas, book, image) {
  const context = canvas.getContext('2d')
  const baseColor = getSpineColor(image)

  drawCover(context, image, baseColor)
  drawPages(context)
  drawSpine(context, book, baseColor)
}

function createBookMaterial(book) {
  const canvas = document.createElement('canvas')
  canvas.width = CANVAS_SIZE
  canvas.height = CANVAS_SIZE
  drawBook(canvas, book, null)

  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.anisotropy = 8

  const material = new MeshStandardMaterial({
    emissive: '#ffffff',
    emissiveMap: texture,
    map: texture,
    metalness: 0,
    roughness: 0.68,
  })
  material.name = 'LibraryShelfBook'
  return material
}

function getThumbnailUrl(source) {
  return source?.replace(/([?&]w=)\d+/, `$1${COVER_IMAGE_WIDTH}`)
}

function LibraryBook({ entry, ...itemProps }) {
  const book = entry.item
  const material = useMemo(() => createBookMaterial(book), [book])
  const geometry = useMemo(() => createBookGeometry(entry), [entry])

  useEffect(() => {
    const source = getThumbnailUrl(book.cover?.src)

    if (!source) {
      return undefined
    }

    let active = true

    new ImageLoader().load(source, (image) => {
      if (!active) {
        return
      }

      drawBook(material.map.image, book, image)
      material.map.needsUpdate = true
    })

    return () => {
      active = false
    }
  }, [book, material])

  useEffect(
    () => () => {
      material.map.dispose()
      material.dispose()
      geometry.dispose()
    },
    [geometry, material],
  )

  return (
    <ShelfItem
      entry={entry}
      geometry={geometry}
      labelSubtitle={book.author}
      labelTitle={book.title}
      material={material}
      name={`LibraryBook:${book.id}`}
      {...itemProps}
    />
  )
}

export function LibraryShelfBooks({
  entries,
  interactionEnabled,
  onBookSelect,
  reducedMotionEnabled,
}) {
  return (
    <ShelfItemGroup
      entries={entries}
      interactionEnabled={interactionEnabled}
      name="library-shelf-books"
      position={SHELF_POSITION}
      renderItem={(entry, hoverProps) => (
        <LibraryBook
          key={entry.item.id}
          entry={entry}
          interactionEnabled={interactionEnabled}
          onSelect={onBookSelect}
          reducedMotionEnabled={reducedMotionEnabled}
          {...hoverProps}
        />
      )}
      scale={SHELF_SCALE}
    />
  )
}
