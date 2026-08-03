import { Suspense, useCallback, useMemo } from 'react'
import { useGLTF, useTexture } from '@react-three/drei'
import {
  CanvasTexture,
  ClampToEdgeWrapping,
  Color,
  MeshStandardMaterial,
  SRGBColorSpace,
} from 'three'
import {
  audioStories,
  books,
  socialContent,
  socialLinks,
} from '../content/portfolioContent'
import {
  createEntranceMaterialResources,
  createRestoredRunnerMaterial,
  prepareEntranceMaterial,
} from '../vertical-slice/entranceMaterialSystem'

const MODEL_URL = '/models/final-route-asset-library.glb'
const ENTRANCE_MODEL_URL = '/models/entrance-asset-library.glb'
const RUNNER_TEXTURE_URL =
  '/textures/vertical-slice/worn-runner-albedo.jpg'
const ASSEMBLY_NAME = 'FinalRouteAssetLibraryAssembly'
const RUNNER_NAME = 'FinalRouteRunner'
const PROJECT_SURFACE_PATTERN = /^ProjectInteractionSurface_(\d+)$/
const SOCIAL_SURFACE_PATTERN = /^SocialInteractionSurface_(\d+)$/
const BOOK_SURFACE_DIMENSIONS = Object.freeze([
  Object.freeze([800, 1000]),
  Object.freeze([866, 1000]),
  Object.freeze([876, 1000]),
])

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

function createSourceBackedMaterial(
  material,
  sourceMaterials,
  materialCache,
) {
  if (materialCache.has(material.uuid)) {
    return materialCache.get(material.uuid)
  }

  const sourceMaterial = sourceMaterials.get(material.name)
  if (!sourceMaterial) {
    materialCache.set(material.uuid, material)
    return material
  }

  const sourceBackedMaterial = material.clone()
  sourceBackedMaterial.map = sourceMaterial.map
  sourceBackedMaterial.normalMap = sourceMaterial.normalMap
  sourceBackedMaterial.roughnessMap = sourceMaterial.roughnessMap

  if (sourceMaterial.normalScale) {
    sourceBackedMaterial.normalScale.copy(sourceMaterial.normalScale)
  }

  materialCache.set(material.uuid, sourceBackedMaterial)
  return sourceBackedMaterial
}

function prepareFinalRouteMaterial({
  material,
  materialCache,
  objectName,
  resources,
  sourceBackedMaterialCache,
  sourceMaterials,
}) {
  const sourceBackedMaterial = createSourceBackedMaterial(
    material,
    sourceMaterials,
    sourceBackedMaterialCache,
  )

  return prepareEntranceMaterial({
    material: sourceBackedMaterial,
    materialCache,
    objectName,
    resources,
    sourceMaterials,
  })
}

function wrapText(
  context,
  text,
  x,
  y,
  maximumWidth,
  lineHeight,
  maximumLines = Infinity,
) {
  const words = text.split(' ')
  const lines = []
  let line = ''

  words.forEach((word) => {
    const candidate = line ? `${line} ${word}` : word

    if (
      context.measureText(candidate).width > maximumWidth &&
      line
    ) {
      lines.push(line)
      line = word
    } else {
      line = candidate
    }
  })

  if (line) {
    lines.push(line)
  }

  const visibleLines = lines.slice(0, maximumLines)

  if (lines.length > maximumLines) {
    const lastIndex = visibleLines.length - 1
    let truncatedLine = visibleLines[lastIndex]

    while (
      context.measureText(`${truncatedLine}...`).width > maximumWidth &&
      truncatedLine.includes(' ')
    ) {
      truncatedLine = truncatedLine.slice(
        0,
        truncatedLine.lastIndexOf(' '),
      )
    }

    visibleLines[lastIndex] = `${truncatedLine}...`
  }

  visibleLines.forEach((lineText, index) => {
    context.fillText(lineText, x, y + index * lineHeight)
  })

  return y + visibleLines.length * lineHeight
}

function drawInformationFrame(context, width, height, color = '#b7a171') {
  context.fillStyle = color
  context.fillRect(0, 0, width, height)
  context.strokeStyle = '#33261c'
  context.lineWidth = 18
  context.strokeRect(20, 20, width - 40, height - 40)
  context.strokeStyle = '#806139'
  context.lineWidth = 4
  context.strokeRect(48, 48, width - 96, height - 96)
}

function drawAudioSurface(context, story, index, width, height) {
  drawInformationFrame(context, width, height)

  context.fillStyle = '#3a2b20'
  context.font = '700 26px Arial'
  context.fillText(
    `HISTOIRE AUDIO ${String(index + 1).padStart(2, '0')}`,
    70,
    120,
  )
  context.font = '700 42px Georgia'
  const textY = wrapText(
    context,
    story.title,
    70,
    225,
    width - 140,
    50,
    3,
  )
  context.font = '400 23px Arial'
  wrapText(
    context,
    story.summary,
    70,
    textY + 38,
    width - 140,
    32,
    5,
  )
  context.font = '600 24px Arial'
  context.fillText(
    'OUVRIR L’ARCHIVE AUDIO',
    70,
    height - 92,
  )
}

function drawBookSurface(
  context,
  sourceImage,
  width,
  height,
) {
  const frameInset = Math.round(width * 0.035)
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
  const drawX = (width - drawWidth) / 2
  const drawY = (height - drawHeight) / 2

  context.fillStyle = '#17130f'
  context.fillRect(0, 0, width, height)
  context.shadowColor = 'rgb(0 0 0 / 68%)'
  context.shadowBlur = Math.round(width * 0.035)
  context.drawImage(sourceImage, drawX, drawY, drawWidth, drawHeight)
  context.shadowBlur = 0
  context.strokeStyle = '#765838'
  context.lineWidth = Math.max(3, Math.round(width * 0.006))
  context.strokeRect(
    frameInset,
    frameInset,
    imageAreaWidth,
    imageAreaHeight,
  )
}

function drawAudioIndexSurface(context, width, height) {
  drawInformationFrame(context, width, height, '#a99770')

  context.fillStyle = '#3a2b20'
  context.font = '700 26px Arial'
  context.fillText('GALERIE D’ÉCOUTE', 70, 120)
  context.font = '700 44px Georgia'
  const textY = wrapText(
    context,
    'HISTOIRES AUDIOS',
    70,
    235,
    width - 140,
    52,
    2,
  )
  context.font = '400 24px Arial'
  wrapText(
    context,
    `${audioStories.length} enregistrements fournis`,
    70,
    textY + 42,
    width - 140,
    34,
    4,
  )
}

function drawSocialSurface(context, width, height) {
  drawInformationFrame(context, width, height, '#c2af80')

  context.fillStyle = '#3a2a20'
  context.font = '700 28px Arial'
  context.fillText('CORRESPONDANCES', 78, 126)
  context.font = '700 54px Georgia'
  const textY = wrapText(
    context,
    socialContent.title,
    78,
    230,
    width - 156,
    62,
    2,
  )
  context.font = '400 26px Arial'
  wrapText(
    context,
    socialLinks.map((socialLink) => socialLink.label).join(' · '),
    78,
    textY + 45,
    width - 156,
    38,
    5,
  )
  context.font = '700 24px Arial'
  context.fillText('OUVRIR LES LIENS', 78, height - 112)
}

function createSurfaceMaterial(drawSurface, dimensions = [768, 1024]) {
  const canvas = document.createElement('canvas')
  canvas.width = dimensions[0]
  canvas.height = dimensions[1]
  const context = canvas.getContext('2d')
  drawSurface(context, canvas.width, canvas.height)

  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.flipY = false
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

function createBookCoverMaterial(sourceTexture, index) {
  const material = createSurfaceMaterial(
    (context, width, height) =>
      drawBookSurface(
        context,
        sourceTexture.image,
        width,
        height,
      ),
    BOOK_SURFACE_DIMENSIONS[index],
  )
  material.name = `BookCoverSurface_${String(index + 1).padStart(2, '0')}`
  return material
}

function createInformationMaterials(bookCoverTextures) {
  const bookMaterials = bookCoverTextures.map(createBookCoverMaterial)
  const audioMaterials = audioStories.map((story, index) =>
    createSurfaceMaterial(
      (context, width, height) =>
        drawAudioSurface(context, story, index, width, height),
      [640, 760],
    ),
  )
  audioMaterials.push(
    createSurfaceMaterial(drawAudioIndexSurface, [640, 760]),
  )
  const socialMaterial = createSurfaceMaterial(
    drawSocialSurface,
    [720, 900],
  )

  return {
    audioMaterials,
    bookMaterials,
    socialMaterial,
  }
}

function getBookId(objectName) {
  const match = PROJECT_SURFACE_PATTERN.exec(objectName)

  if (!match) {
    return null
  }

  return books[Number(match[1]) - 1]?.id ?? null
}

function getAudioStoryId(objectName) {
  const match = SOCIAL_SURFACE_PATTERN.exec(objectName)

  if (!match) {
    return null
  }

  return audioStories[Number(match[1]) - 1]?.id ?? null
}

function FinalRouteModel({
  audioInteractionEnabled = false,
  bookInteractionEnabled = false,
  onAudioStorySelect,
  onBookSelect,
  onSocialOpen,
  socialInteractionEnabled = false,
  ...props
}) {
  const { scene } = useGLTF(MODEL_URL)
  const { scene: entranceScene } = useGLTF(ENTRANCE_MODEL_URL)
  const runnerTexture = useTexture(RUNNER_TEXTURE_URL)
  const bookCoverTextures = useTexture(
    books.map((book) => book.cover.src),
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
    () => createInformationMaterials(bookCoverTextures),
    [bookCoverTextures],
  )
  const assembly = useMemo(() => {
    const sourceAssembly = scene.getObjectByName(ASSEMBLY_NAME)

    if (!sourceAssembly) {
      return null
    }

    const preparedAssembly = sourceAssembly.clone(true)
    const materialCache = new Map()
    const sourceBackedMaterialCache = new Map()

    preparedAssembly.traverse((object) => {
      if (!object.isMesh) {
        return
      }

      object.castShadow = true
      object.receiveShadow = true

      if (object.name === RUNNER_NAME) {
        object.material = runnerMaterial
        return
      }

      const projectMatch = PROJECT_SURFACE_PATTERN.exec(object.name)
      if (projectMatch) {
        object.material =
          informationMaterials.bookMaterials[
            Number(projectMatch[1]) - 1
          ]
        object.userData.bookId =
          books[Number(projectMatch[1]) - 1]?.id
        return
      }

      const socialMatch = SOCIAL_SURFACE_PATTERN.exec(object.name)
      if (socialMatch) {
        object.material =
          informationMaterials.audioMaterials[
            Number(socialMatch[1]) - 1
          ]
        object.userData.audioStoryId =
          audioStories[Number(socialMatch[1]) - 1]?.id
        return
      }

      if (object.name === 'ContactInteractionSurface') {
        object.material = informationMaterials.socialMaterial
        object.userData.contentType = 'social'
        return
      }

      object.material = Array.isArray(object.material)
        ? object.material.map((material) =>
            prepareFinalRouteMaterial({
              material,
              materialCache,
              objectName: object.name,
              resources: materialResources,
              sourceBackedMaterialCache,
              sourceMaterials,
            }),
          )
        : prepareFinalRouteMaterial({
            material: object.material,
            materialCache,
            objectName: object.name,
            resources: materialResources,
            sourceBackedMaterialCache,
            sourceMaterials,
          })
    })

    return preparedAssembly
  }, [
    informationMaterials,
    materialResources,
    runnerMaterial,
    scene,
    sourceMaterials,
  ])

  const handleClick = useCallback(
    (event) => {
      const objectName = event.object.name
      const bookId = getBookId(objectName)
      const audioStoryId = getAudioStoryId(objectName)

      if (bookInteractionEnabled && bookId) {
        event.stopPropagation()
        onBookSelect(bookId)
        return
      }

      if (audioInteractionEnabled && audioStoryId) {
        event.stopPropagation()
        onAudioStorySelect(audioStoryId)
        return
      }

      if (
        socialInteractionEnabled &&
        objectName === 'ContactInteractionSurface'
      ) {
        event.stopPropagation()
        onSocialOpen(null)
      }
    },
    [
      audioInteractionEnabled,
      bookInteractionEnabled,
      onAudioStorySelect,
      onBookSelect,
      onSocialOpen,
      socialInteractionEnabled,
    ],
  )

  const handlePointerOver = useCallback(
    (event) => {
      const objectName = event.object.name
      const interactive =
        (bookInteractionEnabled && getBookId(objectName)) ||
        (audioInteractionEnabled && getAudioStoryId(objectName)) ||
        (socialInteractionEnabled &&
          objectName === 'ContactInteractionSurface')

      if (interactive) {
        event.stopPropagation()
        document.body.style.cursor = 'pointer'
      }
    },
    [
      audioInteractionEnabled,
      bookInteractionEnabled,
      socialInteractionEnabled,
    ],
  )

  const handlePointerOut = useCallback((event) => {
    if (
      getBookId(event.object.name) ||
      getAudioStoryId(event.object.name) ||
      event.object.name === 'ContactInteractionSurface'
    ) {
      document.body.style.cursor = ''
    }
  }, [])

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
    </group>
  )
}

export function FinalRouteAsset(props) {
  return (
    <Suspense fallback={null}>
      <FinalRouteModel {...props} />
    </Suspense>
  )
}

useGLTF.preload(MODEL_URL)
useGLTF.preload(ENTRANCE_MODEL_URL)
useTexture.preload(RUNNER_TEXTURE_URL)
books.forEach((book) => useTexture.preload(book.cover.src))
