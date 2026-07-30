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
  contactContent,
  projects,
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

function drawProjectSurface(context, project, index, width, height) {
  context.fillStyle = '#c7b588'
  context.fillRect(0, 0, width, height)
  context.strokeStyle = '#392b20'
  context.lineWidth = 22
  context.strokeRect(24, 24, width - 48, height - 48)
  context.strokeStyle = '#80623a'
  context.lineWidth = 5
  context.strokeRect(56, 56, width - 112, height - 112)

  context.fillStyle = '#4a3828'
  context.font = '700 28px Georgia'
  context.fillText(
    String(index + 1).padStart(2, '0'),
    86,
    112,
  )
  context.font = '600 20px Arial'
  context.fillText(project.category.toUpperCase(), 150, 110)

  const thumbnailX = 86
  const thumbnailY = 150
  const thumbnailWidth = width - 172
  const thumbnailHeight = 330
  const gradient = context.createLinearGradient(
    thumbnailX,
    thumbnailY,
    thumbnailX + thumbnailWidth,
    thumbnailY + thumbnailHeight,
  )
  gradient.addColorStop(0, '#3c3830')
  gradient.addColorStop(1, '#171b1c')
  context.fillStyle = gradient
  context.fillRect(
    thumbnailX,
    thumbnailY,
    thumbnailWidth,
    thumbnailHeight,
  )
  context.strokeStyle = '#8f7347'
  context.lineWidth = 3
  context.strokeRect(
    thumbnailX,
    thumbnailY,
    thumbnailWidth,
    thumbnailHeight,
  )
  context.strokeStyle = 'rgba(199, 181, 136, 0.26)'
  context.beginPath()
  context.moveTo(thumbnailX, thumbnailY)
  context.lineTo(
    thumbnailX + thumbnailWidth,
    thumbnailY + thumbnailHeight,
  )
  context.moveTo(thumbnailX + thumbnailWidth, thumbnailY)
  context.lineTo(thumbnailX, thumbnailY + thumbnailHeight)
  context.stroke()

  context.fillStyle = '#2c2119'
  context.font = '700 52px Georgia'
  let textY = wrapText(
    context,
    project.title,
    86,
    555,
    width - 172,
    58,
    2,
  )
  context.font = '400 25px Arial'
  wrapText(
    context,
    project.shortSummary,
    86,
    textY + 22,
    width - 172,
    34,
    4,
  )

  context.strokeStyle = '#765c38'
  context.lineWidth = 3
  context.beginPath()
  context.moveTo(86, height - 124)
  context.lineTo(width - 86, height - 124)
  context.stroke()
  context.fillStyle = '#3d2c20'
  context.font = '700 24px Arial'
  context.fillText('OPEN PROJECT ARCHIVE', 86, height - 78)
}

function drawSocialSurface(context, socialLink, index, width, height) {
  context.fillStyle = '#b7a171'
  context.fillRect(0, 0, width, height)
  context.strokeStyle = '#33261c'
  context.lineWidth = 18
  context.strokeRect(20, 20, width - 40, height - 40)
  context.strokeStyle = '#806139'
  context.lineWidth = 4
  context.strokeRect(48, 48, width - 96, height - 96)

  context.fillStyle = '#3a2b20'
  context.font = '700 34px Georgia'
  context.fillText(
    `CORRESPONDENCE ${String(index + 1).padStart(2, '0')}`,
    70,
    120,
  )
  context.font = '700 42px Georgia'
  wrapText(
    context,
    socialLink.label,
    70,
    235,
    width - 140,
    50,
    2,
  )
  context.font = '600 24px Arial'
  context.fillText(
    socialLink.href ? 'OPEN EXTERNAL LINK' : 'AWAITING CONFIGURATION',
    70,
    height - 92,
  )
}

function drawContactSurface(context, width, height) {
  context.fillStyle = '#c2af80'
  context.fillRect(0, 0, width, height)
  context.strokeStyle = '#34271d'
  context.lineWidth = 20
  context.strokeRect(22, 22, width - 44, height - 44)
  context.strokeStyle = '#80613a'
  context.lineWidth = 4
  context.strokeRect(54, 54, width - 108, height - 108)

  context.fillStyle = '#3a2a20'
  context.font = '700 30px Arial'
  context.fillText('CONTACT', 78, 126)
  context.font = '700 56px Georgia'
  let textY = wrapText(
    context,
    contactContent.title,
    78,
    230,
    width - 156,
    64,
    2,
  )
  context.font = '400 27px Arial'
  textY = wrapText(
    context,
    contactContent.summary,
    78,
    textY + 35,
    width - 156,
    38,
    4,
  )
  context.font = '700 24px Arial'
  context.fillText(
    contactContent.action.label.toUpperCase(),
    78,
    Math.max(textY + 80, height - 112),
  )
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

function createInformationMaterials() {
  const projectMaterials = projects.map((project, index) =>
    createSurfaceMaterial((context, width, height) =>
      drawProjectSurface(
        context,
        project,
        index,
        width,
        height,
      ),
    ),
  )
  const socialMaterials = socialLinks.map((socialLink, index) =>
    createSurfaceMaterial(
      (context, width, height) =>
        drawSocialSurface(
          context,
          socialLink,
          index,
          width,
          height,
        ),
      [640, 760],
    ),
  )
  const contactMaterial = createSurfaceMaterial(
    drawContactSurface,
    [720, 900],
  )

  return {
    contactMaterial,
    projectMaterials,
    socialMaterials,
  }
}

function getProjectId(objectName) {
  const match = PROJECT_SURFACE_PATTERN.exec(objectName)

  if (!match) {
    return null
  }

  return projects[Number(match[1]) - 1]?.id ?? null
}

function FinalRouteModel({
  onProjectSelect,
  projectInteractionEnabled = false,
  ...props
}) {
  const { scene } = useGLTF(MODEL_URL)
  const { scene: entranceScene } = useGLTF(ENTRANCE_MODEL_URL)
  const runnerTexture = useTexture(RUNNER_TEXTURE_URL)
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
    () => createInformationMaterials(),
    [],
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
          informationMaterials.projectMaterials[
            Number(projectMatch[1]) - 1
          ]
        object.userData.projectId =
          projects[Number(projectMatch[1]) - 1]?.id
        return
      }

      const socialMatch = SOCIAL_SURFACE_PATTERN.exec(object.name)
      if (socialMatch) {
        object.material =
          informationMaterials.socialMaterials[
            Number(socialMatch[1]) - 1
          ]
        return
      }

      if (object.name === 'ContactInteractionSurface') {
        object.material = informationMaterials.contactMaterial
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
      if (!projectInteractionEnabled) {
        return
      }

      const projectId = getProjectId(event.object.name)

      if (!projectId) {
        return
      }

      event.stopPropagation()
      onProjectSelect(projectId)
    },
    [onProjectSelect, projectInteractionEnabled],
  )

  const handlePointerOver = useCallback(
    (event) => {
      if (
        projectInteractionEnabled &&
        getProjectId(event.object.name)
      ) {
        event.stopPropagation()
        document.body.style.cursor = 'pointer'
      }
    },
    [projectInteractionEnabled],
  )

  const handlePointerOut = useCallback((event) => {
    if (getProjectId(event.object.name)) {
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
