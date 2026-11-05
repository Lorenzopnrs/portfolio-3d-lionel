import { useEffect, useMemo } from 'react'
import { useGLTF, useTexture } from '@react-three/drei'
import {
  ENTRANCE_MASONRY,
  extendCastle,
} from '../final-route/castleMasonry.js'
import { shouldCastObjectShadow } from '../performance/qualitySettings'
import {
  createEntranceMaterialResources,
  createRestoredRunnerMaterial,
  prepareEntranceMaterial,
  retainPreparedAssembly,
} from './entranceMaterialSystem'

const MODEL_URL = '/models/entrance-asset-library.glb'
const RUNNER_TEXTURE_URL =
  '/textures/vertical-slice/worn-runner-albedo.jpg'
const ASSEMBLY_NAME = 'EntranceAssembly'
const RUNNER_NAME = 'EntranceRunner'
const DESTINATION_DOOR_NAME = 'CorridorEndDoor'

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

export function EntranceAssetLibrary({
  qualityLevel = 'high',
  ...props
}) {
  const { scene } = useGLTF(MODEL_URL, '/draco/')
  const runnerTexture = useTexture(RUNNER_TEXTURE_URL)
  const materialResources = useMemo(
    () => createEntranceMaterialResources(),
    [],
  )
  const sourceMaterials = useMemo(
    () => collectSourceMaterials(scene),
    [scene],
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
  const assembly = useMemo(
    () => {
      const sourceAssembly = scene.getObjectByName(ASSEMBLY_NAME)

      if (!sourceAssembly) {
        return null
      }

      const preparedAssembly = sourceAssembly.clone(true)
      const materialCache = new Map()
      const destinationDoor = preparedAssembly.getObjectByName(
        DESTINATION_DOOR_NAME,
      )

      if (!destinationDoor) {
        throw new Error(
          `Missing GLB object: ${DESTINATION_DOOR_NAME}`,
        )
      }

      destinationDoor.visible = false
      extendCastle(preparedAssembly, ENTRANCE_MASONRY)

      preparedAssembly.traverse((object) => {
        if (!object.isMesh) {
          return
        }

        object.receiveShadow = true

        if (object.name === RUNNER_NAME) {
          object.material = runnerMaterial
          return
        }

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
    },
    [
      materialResources,
      runnerMaterial,
      scene,
      sourceMaterials,
    ],
  )

  useEffect(() => {
    if (!assembly) {
      return
    }

    assembly.traverse((object) => {
      if (object.isMesh) {
        object.castShadow = shouldCastObjectShadow(
          object.name,
          qualityLevel,
        )
      }
    })
  }, [assembly, qualityLevel])

  useEffect(
    () =>
      assembly
        ? retainPreparedAssembly(assembly, [runnerMaterial], {
            releaseSharedGeometries: true,
          })
        : undefined,
    [assembly, runnerMaterial],
  )

  if (!assembly) {
    throw new Error(`Missing GLB assembly: ${ASSEMBLY_NAME}`)
  }

  return (
    <group name="blender-entrance-asset-library" {...props} dispose={null}>
      <primitive object={assembly} />
    </group>
  )
}

useGLTF.preload(MODEL_URL, '/draco/')
useTexture.preload(RUNNER_TEXTURE_URL)
