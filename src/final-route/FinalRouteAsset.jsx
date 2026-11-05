import { useCallback, useEffect, useMemo } from 'react'
import { useGLTF, useTexture } from '@react-three/drei'
import {
  CanvasTexture,
  ClampToEdgeWrapping,
  Color,
  DoubleSide,
  MeshStandardMaterial,
  PlaneGeometry,
  SRGBColorSpace,
} from 'three'
import { useSafeTexture } from '../assets/useSafeTexture.js'
import { requestRouteShadowRefresh } from '../performance/routeLights'
import { shouldCastObjectShadow } from '../performance/qualitySettings'
import {
  drawAudioTitleCard,
  loadAudioIllustration,
} from './audioIllustration.js'
import { AgendaBoard } from './AgendaBoard'
import { AudioShelfCases } from './AudioShelfCases'
import { FINAL_ROUTE_MASONRY, extendCastle } from './castleMasonry.js'
import { ContactPhone } from './ContactPhone'
import {
  BOOK_FRAME_PLACEMENTS,
  BOOK_POSTER_HEIGHT,
  BOOK_POSTER_WIDTH,
} from './ornateFrame.js'
import { OrnateBookFrames } from './OrnateBookFrames'
import {
  AUDIO_FRAMES_CLUSTER_NAME,
  AUDIO_FRAMES_TRANSFORM,
  AUDIO_MISSING_WALL_POSITION,
  AUDIO_SHELF_TRANSFORM,
  AUDIO_WALL_NAME,
  SHELF_BOOK_MATERIALS,
  SHELF_NAME,
  layoutAudioCases,
  layoutLibraryBooks,
  removeBooksInZones,
} from './libraryShelf.js'
import { LibraryShelfBooks } from './LibraryShelfBooks'
import {
  createEntranceMaterialResources,
  createRestoredRunnerMaterial,
  prepareEntranceMaterial,
  retainGeneratedMaterials,
  retainPreparedAssembly,
} from '../vertical-slice/entranceMaterialSystem'

const MODEL_URL = '/models/final-route-asset-library.glb'
const ENTRANCE_MODEL_URL = '/models/entrance-asset-library.glb'
const RUNNER_TEXTURE_URL =
  '/textures/vertical-slice/worn-runner-albedo.jpg'
const ASSEMBLY_NAME = 'FinalRouteAssetLibraryAssembly'
const RUNNER_NAME = 'FinalRouteRunner'
const PROJECT_SURFACE_PATTERN = /^ProjectInteractionSurface_(\d+)$/
const SOCIAL_SURFACE_PATTERN = /^SocialInteractionSurface_(\d+)$/
const DISPLAY_SURFACE_PATTERN =
  /^(?:Project|Social)InteractionSurface_\d+$/
const AUDIO_SHELF_NAME = 'AudioArchiveShelf'
const BOOK_SURFACE_LAYOUTS = Object.freeze(
  BOOK_FRAME_PLACEMENTS.map(({ normalX }) =>
    Object.freeze({
      normalX,
      textureDimensions: Object.freeze([800, 1234]),
      worldHeight: BOOK_POSTER_HEIGHT,
      worldWidth: BOOK_POSTER_WIDTH,
    }),
  ),
)
const BOOK_POSTER_GLOW = 0.17
// Replaced by the carved frames, the phone and the agenda.
const REPLACED_OBJECT_NAMES = Object.freeze([
  'ArchiveDisplaySupport03',
  'ContactFrameSupport',
  'ContactInteractionSurface',
  'ProjectFrameSupport01',
  'ProjectFrameSupport03',
  'ProjectLectern02',
  'ProjectNicheSupport02',
])
const PHYSICAL_BOOK_SLOT_COUNT = 3
const PHYSICAL_AUDIO_SLOT_COUNT = 3
const AUDIO_SURFACE_LAYOUT = Object.freeze({
  normalX: 1,
  textureDimensions: Object.freeze([640, 800]),
  worldHeight: 0.78,
  worldWidth: 0.62,
})

function collectSourceMaterials(scene) {
  const sourceMaterials = new Map()

  scene.traverse((object) => {
    if (!object.isMesh) {
      return
    }

    const materials = Array.isArray(object.material)
      ? object.material
      : [object.material]

    materials.forEach((material) => {
      if (material && !sourceMaterials.has(material.name)) {
        sourceMaterials.set(material.name, material)
      }
    })
  })

  return sourceMaterials
}

function drawBookSurface(
  context,
  sourceImage,
  width,
  height,
) {
  context.imageSmoothingEnabled = true
  context.imageSmoothingQuality = 'high'

  const frameInset = Math.round(Math.min(width, height) * 0.045)
  const imageAreaWidth = width - frameInset * 2
  const imageAreaHeight = height - frameInset * 2
  const imageWidth = sourceImage.naturalWidth ?? sourceImage.width
  const imageHeight = sourceImage.naturalHeight ?? sourceImage.height
  const imageRatio = imageWidth / imageHeight
  const areaRatio = imageAreaWidth / imageAreaHeight
  const drawWidth =
    imageRatio > areaRatio
      ? imageAreaWidth
      : imageAreaHeight * imageRatio
  const drawHeight =
    imageRatio > areaRatio
      ? imageAreaWidth / imageRatio
      : imageAreaHeight
  const drawX = Math.round((width - drawWidth) / 2)
  const drawY = Math.round((height - drawHeight) / 2)
  const matte = context.createLinearGradient(0, 0, width, height)

  matte.addColorStop(0, '#211a14')
  matte.addColorStop(0.52, '#14110e')
  matte.addColorStop(1, '#241b14')
  context.fillStyle = matte
  context.fillRect(0, 0, width, height)
  context.strokeStyle = 'rgb(142 108 68 / 58%)'
  context.lineWidth = Math.max(2, Math.round(width * 0.004))
  context.strokeRect(
    frameInset,
    frameInset,
    imageAreaWidth,
    imageAreaHeight,
  )

  context.save()
  context.shadowColor = 'rgb(0 0 0 / 68%)'
  context.shadowBlur = Math.round(width * 0.028)
  context.shadowOffsetY = Math.round(height * 0.012)
  context.drawImage(sourceImage, drawX, drawY, drawWidth, drawHeight)
  context.restore()

  context.strokeStyle = 'rgb(197 166 112 / 72%)'
  context.lineWidth = Math.max(2, Math.round(width * 0.0035))
  context.strokeRect(
    drawX,
    drawY,
    Math.round(drawWidth),
    Math.round(drawHeight),
  )
}

function drawEmptySurface(context, width, height) {
  const gradient = context.createLinearGradient(0, 0, width, height)
  gradient.addColorStop(0, '#171512')
  gradient.addColorStop(0.5, '#0d0d0c')
  gradient.addColorStop(1, '#1d1813')
  context.fillStyle = gradient
  context.fillRect(0, 0, width, height)
  context.strokeStyle = 'rgb(142 108 68 / 32%)'
  context.lineWidth = Math.max(2, Math.round(width * 0.004))
  context.strokeRect(28, 28, width - 56, height - 56)
}

function createSurfaceMaterial(
  drawSurface,
  dimensions = [768, 1024],
  { flipY = false } = {},
) {
  const canvas = document.createElement('canvas')
  canvas.width = dimensions[0]
  canvas.height = dimensions[1]
  const context = canvas.getContext('2d')
  drawSurface(context, canvas.width, canvas.height)

  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.flipY = flipY
  texture.wrapS = ClampToEdgeWrapping
  texture.wrapT = ClampToEdgeWrapping
  texture.anisotropy = 8
  texture.needsUpdate = true

  const material = new MeshStandardMaterial({
    color: '#eee0bd',
    map: texture,
    roughness: 0.94,
    metalness: 0,
  })
  material.emissive = new Color('#3f2311')
  material.emissiveIntensity = 0.08
  material.name = 'FinalRouteInformationSurface'
  return material
}

function applyDisplayFinish(material, name, glow = 0.075) {
  material.color.set('#ffffff')
  material.depthTest = true
  material.depthWrite = true
  material.emissive.set('#ffffff')
  material.emissiveMap = material.map
  material.emissiveIntensity = glow
  material.roughness = 0.9
  material.side = DoubleSide
  material.transparent = false
  material.name = name
  return material
}

function createBookCoverMaterial(sourceTexture, index, book) {
  const layout = BOOK_SURFACE_LAYOUTS[index]
  const material = createSurfaceMaterial(
    (context, width, height) => {
      if (book) {
        drawBookSurface(
          context,
          sourceTexture.image,
          width,
          height,
        )
      } else {
        drawEmptySurface(context, width, height)
      }
    },
    layout.textureDimensions,
    { flipY: true },
  )

  return applyDisplayFinish(
    material,
    `BookCoverSurface_${String(index + 1).padStart(2, '0')}`,
    BOOK_POSTER_GLOW,
  )
}

function createAudioFrameMaterial(story, index) {
  const material = createSurfaceMaterial(
    (context, width, height) => {
      if (story) {
        drawAudioTitleCard(context, story, width, height)
      } else {
        drawEmptySurface(context, width, height)
      }
    },
    AUDIO_SURFACE_LAYOUT.textureDimensions,
    { flipY: true },
  )

  return applyDisplayFinish(
    material,
    `AudioFrameSurface_${String(index + 1).padStart(2, '0')}`,
  )
}

function createDisplaySurfaceGeometry(layout) {
  const geometry = new PlaneGeometry(
    layout.worldWidth,
    layout.worldHeight,
  )

  geometry.rotateY(layout.normalX * Math.PI * 0.5)
  return geometry
}

function createInformationMaterials(
  bookCoverTextures,
  { audioStories, featuredBooks },
) {
  const bookMaterials = bookCoverTextures.map((texture, index) =>
    createBookCoverMaterial(texture, index, featuredBooks[index]),
  )
  const audioMaterials = Array.from(
    { length: PHYSICAL_AUDIO_SLOT_COUNT },
    (_, index) => createAudioFrameMaterial(audioStories[index], index),
  )

  return {
    audioMaterials,
    bookMaterials,
  }
}

function getBookId(objectName, featuredBooks) {
  const match = PROJECT_SURFACE_PATTERN.exec(objectName)

  if (!match) {
    return null
  }

  return featuredBooks[Number(match[1]) - 1]?.id ?? null
}

function getAudioStoryId(objectName, audioStories) {
  const match = SOCIAL_SURFACE_PATTERN.exec(objectName)

  if (!match) {
    return null
  }

  const surfaceIndex = Number(match[1]) - 1
  return surfaceIndex < PHYSICAL_AUDIO_SLOT_COUNT
    ? audioStories[surfaceIndex]?.id ?? null
    : null
}

function ignoreRaycast() {}

// Real items take the place of the decorative books they would overlap.
function clearShelfSpace(shelf, zones) {
  const bookMeshes = []

  shelf.traverse((object) => {
    if (
      object.isMesh &&
      SHELF_BOOK_MATERIALS.test(object.material.name)
    ) {
      bookMeshes.push(object)
    }
  })
  removeBooksInZones(
    bookMeshes.map((object) => object.geometry),
    zones,
  ).forEach((geometry, index) => {
    if (geometry !== bookMeshes[index].geometry) {
      bookMeshes[index].geometry = geometry
      bookMeshes[index].userData.performanceOwnedGeometry = true
    }
  })
}

export function FinalRouteAsset({
  agendaEvents = [],
  audioStories = [],
  audioInteractionEnabled = false,
  featuredBooks = [],
  bookInteractionEnabled = false,
  libraryAudioStories = [],
  libraryBooks = [],
  onAgendaOpen,
  onAudioStorySelect,
  onBookSelect,
  onSocialOpen,
  qualityLevel = 'high',
  reducedMotionEnabled = false,
  socialInteractionEnabled = false,
  ...props
}) {
  const { scene } = useGLTF(MODEL_URL, '/draco/')
  const { scene: entranceScene } = useGLTF(
    ENTRANCE_MODEL_URL,
    '/draco/',
  )
  const runnerTexture = useTexture(RUNNER_TEXTURE_URL)
  const bookSlots = useMemo(
    () =>
      Array.from(
        { length: PHYSICAL_BOOK_SLOT_COUNT },
        (_, index) => featuredBooks[index] ?? null,
      ),
    [featuredBooks],
  )
  const libraryLayout = useMemo(
    () => layoutLibraryBooks(libraryBooks),
    [libraryBooks],
  )
  const audioLayout = useMemo(
    () => layoutAudioCases(libraryAudioStories),
    [libraryAudioStories],
  )
  const firstBookCoverTexture = useSafeTexture(
    bookSlots[0]?.cover.src,
    {
      fallbackHeight:
        BOOK_SURFACE_LAYOUTS[0].textureDimensions[1],
      fallbackLabel: bookSlots[0]?.title ?? 'Archive',
      fallbackWidth:
        BOOK_SURFACE_LAYOUTS[0].textureDimensions[0],
    },
  )
  const secondBookCoverTexture = useSafeTexture(
    bookSlots[1]?.cover.src,
    {
      fallbackHeight:
        BOOK_SURFACE_LAYOUTS[1].textureDimensions[1],
      fallbackLabel: bookSlots[1]?.title ?? 'Archive',
      fallbackWidth:
        BOOK_SURFACE_LAYOUTS[1].textureDimensions[0],
    },
  )
  const thirdBookCoverTexture = useSafeTexture(
    bookSlots[2]?.cover.src,
    {
      fallbackHeight:
        BOOK_SURFACE_LAYOUTS[2].textureDimensions[1],
      fallbackLabel: bookSlots[2]?.title ?? 'Archive',
      fallbackWidth:
        BOOK_SURFACE_LAYOUTS[2].textureDimensions[0],
    },
  )
  const bookCoverTextures = useMemo(
    () => [
      firstBookCoverTexture,
      secondBookCoverTexture,
      thirdBookCoverTexture,
    ],
    [
      firstBookCoverTexture,
      secondBookCoverTexture,
      thirdBookCoverTexture,
    ],
  )
  const materialResources = useMemo(
    () => createEntranceMaterialResources(),
    [],
  )
  const sourceMaterials = useMemo(
    () => collectSourceMaterials(entranceScene),
    [entranceScene],
  )
  const runnerUvChannel = useMemo(() => {
    const runner = scene.getObjectByName(RUNNER_NAME)
    return runner?.geometry?.getAttribute('uv1') ? 1 : 0
  }, [scene])
  const runnerMaterial = useMemo(
    () =>
      createRestoredRunnerMaterial(
        runnerTexture,
        runnerUvChannel,
      ),
    [runnerTexture, runnerUvChannel],
  )
  const informationMaterials = useMemo(
    () =>
      createInformationMaterials(bookCoverTextures, {
        audioStories,
        featuredBooks: bookSlots,
      }),
    [audioStories, bookCoverTextures, bookSlots],
  )
  const assembly = useMemo(() => {
    const sourceAssembly = scene.getObjectByName(ASSEMBLY_NAME)

    if (!sourceAssembly) {
      return null
    }

    const preparedAssembly = sourceAssembly.clone(true)
    const materialCache = new Map()

    extendCastle(preparedAssembly, FINAL_ROUTE_MASONRY)
    REPLACED_OBJECT_NAMES.forEach((name) => {
      preparedAssembly.getObjectByName(name)?.removeFromParent()
    })
    BOOK_FRAME_PLACEMENTS.forEach(({ position }, index) => {
      const surface = preparedAssembly.getObjectByName(
        `ProjectInteractionSurface_${String(index + 1).padStart(2, '0')}`,
      )

      if (surface) {
        preparedAssembly.add(surface)
        surface.position.set(...position)
        surface.rotation.set(0, 0, 0)
        surface.scale.setScalar(1)
      }
    })

    const audioFrames = preparedAssembly.getObjectByName(
      AUDIO_FRAMES_CLUSTER_NAME,
    )
    const audioWall = preparedAssembly.getObjectByName(AUDIO_WALL_NAME)

    audioFrames?.position.set(...AUDIO_FRAMES_TRANSFORM.position)
    audioFrames?.rotation.set(...AUDIO_FRAMES_TRANSFORM.rotation)

    if (audioWall) {
      const missingWall = audioWall.clone(true)

      missingWall.position.set(...AUDIO_MISSING_WALL_POSITION)
      preparedAssembly.add(missingWall)
    }

    const bookShelf = preparedAssembly.getObjectByName(SHELF_NAME)

    if (bookShelf) {
      const audioShelf = bookShelf.clone(true)

      audioShelf.name = AUDIO_SHELF_NAME
      audioShelf.position.set(...AUDIO_SHELF_TRANSFORM.position)
      audioShelf.rotation.set(...AUDIO_SHELF_TRANSFORM.rotation)
      audioShelf.scale.setScalar(AUDIO_SHELF_TRANSFORM.scale)
      preparedAssembly.add(audioShelf)
      clearShelfSpace(bookShelf, libraryLayout.clearedZones)
      clearShelfSpace(audioShelf, audioLayout.clearedZones)
    }

    preparedAssembly.traverse((object) => {
      if (!object.isMesh) {
        return
      }

      object.receiveShadow = true

      if (object.name === RUNNER_NAME) {
        object.material = runnerMaterial
        object.raycast = ignoreRaycast
        return
      }

      const projectMatch = PROJECT_SURFACE_PATTERN.exec(object.name)
      if (projectMatch) {
        const surfaceIndex = Number(projectMatch[1]) - 1

        object.geometry = createDisplaySurfaceGeometry(
          BOOK_SURFACE_LAYOUTS[surfaceIndex],
        )
        object.userData.performanceOwnedGeometry = true
        object.material =
          informationMaterials.bookMaterials[surfaceIndex]
        object.castShadow = false
        object.receiveShadow = true
        object.renderOrder = 1
        object.userData.bookId =
          bookSlots[surfaceIndex]?.id
        return
      }

      const socialMatch = SOCIAL_SURFACE_PATTERN.exec(object.name)
      if (socialMatch) {
        object.geometry = createDisplaySurfaceGeometry(
          AUDIO_SURFACE_LAYOUT,
        )
        object.userData.performanceOwnedGeometry = true
        object.material =
          informationMaterials.audioMaterials[
            Number(socialMatch[1]) - 1
          ]
        object.renderOrder = 1
        object.userData.audioStoryId =
          audioStories[Number(socialMatch[1]) - 1]?.id
        return
      }

      // Only the information surfaces react to the pointer: skipping the rest
      // avoids testing tens of thousands of triangles on every pointer move.
      object.raycast = ignoreRaycast
      object.material = Array.isArray(object.material)
        ? object.material.map((material) =>
            prepareEntranceMaterial({
              material,
              materialCache,
              objectName: object.name,
              resources: materialResources,
              sourceMaterials,
            }),
          )
        : prepareEntranceMaterial({
            material: object.material,
            materialCache,
            objectName: object.name,
            resources: materialResources,
            sourceMaterials,
          })
    })

    return preparedAssembly
  }, [
    audioLayout,
    audioStories,
    bookSlots,
    informationMaterials,
    libraryLayout,
    materialResources,
    runnerMaterial,
    scene,
    sourceMaterials,
  ])

  const handleClick = useCallback(
    (event) => {
      const objectName = event.object.name
      const bookId = getBookId(objectName, bookSlots)
      const audioStoryId = getAudioStoryId(objectName, audioStories)

      if (bookInteractionEnabled && bookId) {
        event.stopPropagation()
        onBookSelect(bookId)
        return
      }

      if (audioInteractionEnabled && audioStoryId) {
        event.stopPropagation()
        onAudioStorySelect(audioStoryId)
      }
    },
    [
      audioInteractionEnabled,
      audioStories,
      bookSlots,
      bookInteractionEnabled,
      onAudioStorySelect,
      onBookSelect,
    ],
  )

  const handlePointerOver = useCallback(
    (event) => {
      const objectName = event.object.name
      const interactive =
        (bookInteractionEnabled &&
          getBookId(objectName, bookSlots)) ||
        (audioInteractionEnabled &&
          getAudioStoryId(objectName, audioStories))

      if (interactive) {
        event.stopPropagation()
        document.body.style.cursor = 'pointer'
      }
    },
    [
      audioInteractionEnabled,
      audioStories,
      bookSlots,
      bookInteractionEnabled,
    ],
  )

  const handlePointerOut = useCallback((event) => {
    if (
      getBookId(event.object.name, bookSlots) ||
      getAudioStoryId(event.object.name, audioStories)
    ) {
      document.body.style.cursor = ''
    }
  }, [audioStories, bookSlots])

  useEffect(() => {
    if (!assembly) {
      return
    }

    assembly.traverse((object) => {
      if (!object.isMesh) {
        return
      }

      object.castShadow = DISPLAY_SURFACE_PATTERN.test(object.name)
        ? false
        : shouldCastObjectShadow(object.name, qualityLevel)
    })
    requestRouteShadowRefresh()
  }, [assembly, qualityLevel])

  useEffect(() => {
    const materials = [
      ...informationMaterials.audioMaterials,
      ...informationMaterials.bookMaterials,
    ]

    return retainGeneratedMaterials(materials)
  }, [informationMaterials])

  useEffect(() => {
    let active = true

    informationMaterials.audioMaterials.forEach((material, index) => {
      if (!audioStories[index]) {
        return
      }

      loadAudioIllustration(audioStories[index]).then((illustration) => {
        if (active && illustration) {
          const canvas = material.map.image

          drawBookSurface(
            canvas.getContext('2d'),
            illustration,
            canvas.width,
            canvas.height,
          )
          material.map.needsUpdate = true
        }
      })
    })

    return () => {
      active = false
    }
  }, [audioStories, informationMaterials])

  useEffect(
    () =>
      assembly
        ? retainPreparedAssembly(
            assembly,
            [
              runnerMaterial,
              ...informationMaterials.audioMaterials,
              ...informationMaterials.bookMaterials,
            ],
            { releaseSharedGeometries: true },
          )
        : undefined,
    [assembly, informationMaterials, runnerMaterial],
  )

  if (!assembly) {
    throw new Error(`Missing GLB assembly: ${ASSEMBLY_NAME}`)
  }

  return (
    <group
      name="blender-final-route-asset-library"
      onClick={handleClick}
      onPointerOut={handlePointerOut}
      onPointerOver={handlePointerOver}
      {...props}
      dispose={null}
    >
      <primitive object={assembly} />
      <OrnateBookFrames />
      <ContactPhone
        interactionEnabled={socialInteractionEnabled}
        onOpen={onSocialOpen}
      />
      <AgendaBoard
        events={agendaEvents}
        interactionEnabled={socialInteractionEnabled}
        onOpen={onAgendaOpen}
      />
      <AudioShelfCases
        entries={audioLayout.entries}
        interactionEnabled={audioInteractionEnabled}
        onAudioStorySelect={onAudioStorySelect}
        reducedMotionEnabled={reducedMotionEnabled}
      />
      <LibraryShelfBooks
        entries={libraryLayout.entries}
        interactionEnabled={bookInteractionEnabled}
        onBookSelect={onBookSelect}
        reducedMotionEnabled={reducedMotionEnabled}
      />
    </group>
  )
}

useGLTF.preload(MODEL_URL, '/draco/')
useGLTF.preload(ENTRANCE_MODEL_URL, '/draco/')
useTexture.preload(RUNNER_TEXTURE_URL)
