import { useEffect, useMemo } from 'react'
import {
  BoxGeometry,
  CanvasTexture,
  MeshStandardMaterial,
  SRGBColorSpace,
} from 'three'
import {
  drawAudioTitleCard,
  loadAudioIllustration,
} from './audioIllustration.js'
import { AUDIO_SHELF_TRANSFORM } from './libraryShelf.js'
import { ShelfItem, ShelfItemGroup } from './ShelfItem'

const CANVAS_WIDTH = 512
const CANVAS_HEIGHT = 545
// The sides of a case take their colour from a corner of the artwork.
const EDGE_REGION = Object.freeze([0.002, 0.002, 0.012, 0.012])
const COVER_REGION = Object.freeze([0, 0, 1, 1])
const FACE_REGIONS = Object.freeze([
  EDGE_REGION,
  EDGE_REGION,
  EDGE_REGION,
  EDGE_REGION,
  COVER_REGION,
  EDGE_REGION,
])

function createCaseGeometry({ depth, height, thickness }) {
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

// The illustration fills the whole case, like an album sleeve.
function drawIllustration(canvas, illustration) {
  const context = canvas.getContext('2d')
  const scale = Math.max(
    canvas.width / illustration.width,
    canvas.height / illustration.height,
  )
  const width = illustration.width * scale
  const height = illustration.height * scale

  context.imageSmoothingQuality = 'high'
  context.drawImage(
    illustration,
    (canvas.width - width) / 2,
    (canvas.height - height) / 2,
    width,
    height,
  )
}

function createCaseMaterial(story) {
  const canvas = document.createElement('canvas')
  canvas.width = CANVAS_WIDTH
  canvas.height = CANVAS_HEIGHT
  drawAudioTitleCard(
    canvas.getContext('2d'),
    story,
    canvas.width,
    canvas.height,
  )

  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.anisotropy = 8

  const material = new MeshStandardMaterial({
    emissive: '#ffffff',
    emissiveMap: texture,
    map: texture,
    metalness: 0,
    roughness: 0.62,
  })
  material.name = 'AudioShelfCase'
  return material
}

function AudioCase({ entry, ...itemProps }) {
  const story = entry.item
  const material = useMemo(() => createCaseMaterial(story), [story])
  const geometry = useMemo(() => createCaseGeometry(entry), [entry])

  useEffect(() => {
    let active = true

    loadAudioIllustration(story).then((illustration) => {
      if (active && illustration) {
        drawIllustration(material.map.image, illustration)
        material.map.needsUpdate = true
      }
    })

    return () => {
      active = false
    }
  }, [material, story])

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
      labelSubtitle="Histoire audio"
      labelTitle={story.title}
      material={material}
      name={`AudioCase:${story.id}`}
      {...itemProps}
    />
  )
}

export function AudioShelfCases({
  entries,
  interactionEnabled,
  onAudioStorySelect,
  reducedMotionEnabled,
}) {
  return (
    <ShelfItemGroup
      entries={entries}
      interactionEnabled={interactionEnabled}
      name="audio-shelf-cases"
      position={AUDIO_SHELF_TRANSFORM.position}
      renderItem={(entry, hoverProps) => (
        <AudioCase
          key={entry.item.id}
          entry={entry}
          interactionEnabled={interactionEnabled}
          onSelect={onAudioStorySelect}
          reducedMotionEnabled={reducedMotionEnabled}
          {...hoverProps}
        />
      )}
      rotation={AUDIO_SHELF_TRANSFORM.rotation}
      scale={AUDIO_SHELF_TRANSFORM.scale}
    />
  )
}
