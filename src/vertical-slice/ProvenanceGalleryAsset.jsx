import { Suspense, useMemo } from 'react'
import { useGLTF, useTexture } from '@react-three/drei'
import {
  createEntranceMaterialResources,
  createRestoredRunnerMaterial,
  prepareEntranceMaterial,
} from './entranceMaterialSystem'

const MODEL_URL = '/models/provenance-gallery.glb'
const ENTRANCE_MODEL_URL = '/models/entrance-asset-library.glb'
const RUNNER_TEXTURE_URL =
  '/textures/vertical-slice/worn-runner-albedo.jpg'
const ASSEMBLY_NAME = 'ProvenanceGalleryAssembly'
const RUNNER_NAME = 'ProvenanceRunner'
const GALLERY_COLOR_OVERRIDES = {
  AgedStone: '#25221d',
  DarkMortar: '#0f100d',
  DarkOak: '#2f211b',
  WornFloorSlabs: '#25241f',
  WornStoneEdge: '#302a22',
}

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

function prepareGalleryMaterial(options) {
  const sourceBackedMaterial = createSourceBackedMaterial(
    options.material,
    options.sourceMaterials,
    options.sourceBackedMaterialCache,
  )
  const material = prepareEntranceMaterial({
    ...options,
    material: sourceBackedMaterial,
  })

  if (material.userData.provenanceGalleryPrepared) {
    return material
  }

  const materialName = options.material.name || material.name
  const colorOverride = Object.entries(GALLERY_COLOR_OVERRIDES).find(
    ([profileName]) => materialName.startsWith(profileName),
  )?.[1]

  if (colorOverride) {
    material.color.set(colorOverride)
  }

  material.userData.provenanceGalleryPrepared = true
  material.needsUpdate = true
  return material
}

function ProvenanceGalleryModel(props) {
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

      object.material = Array.isArray(object.material)
        ? object.material.map((material) =>
            prepareGalleryMaterial({
              material,
              materialCache,
              objectName: object.name,
              resources: materialResources,
              sourceBackedMaterialCache,
              sourceMaterials,
            }),
          )
        : prepareGalleryMaterial({
            material: object.material,
            materialCache,
            objectName: object.name,
            resources: materialResources,
            sourceBackedMaterialCache,
            sourceMaterials,
          })
    })

    return preparedAssembly
  }, [materialResources, runnerMaterial, scene, sourceMaterials])

  if (!assembly) {
    throw new Error(`Missing GLB assembly: ${ASSEMBLY_NAME}`)
  }

  return (
    <group name="blender-provenance-gallery" {...props} dispose={null}>
      <primitive object={assembly} />
    </group>
  )
}

export function ProvenanceGalleryAsset(props) {
  return (
    <Suspense fallback={null}>
      <ProvenanceGalleryModel {...props} />
    </Suspense>
  )
}

useGLTF.preload(MODEL_URL)
useGLTF.preload(ENTRANCE_MODEL_URL)
useTexture.preload(RUNNER_TEXTURE_URL)
