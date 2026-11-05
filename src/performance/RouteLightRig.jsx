import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Vector3 } from 'three'
import { QUALITY_SETTINGS, getShadowMapSize } from './qualitySettings'
import {
  ROUTE_LIGHTS,
  createLightSlots,
  getRouteShadowVersion,
  requestRouteShadowRefresh,
  selectRouteLights,
  stepLightSlots,
} from './routeLights'

const LIGHT_FADE_SECONDS = 0.4
const RANKING_DISTANCE_SQUARED = 0.04
const SLOT_GROUPS = Object.freeze(['shadow', 'plain', 'rect'])

function applyLightSource(object, source) {
  object.position.set(...source.position)
  object.color.set(source.color)

  if (source.kind === 'rect') {
    object.rotation.set(...source.rotation)
    object.width = source.width
    object.height = source.height
    return
  }

  object.distance = source.distance
  object.decay = source.decay

  if (object.castShadow) {
    object.shadow.bias = source.shadow.bias
    object.shadow.normalBias = source.shadow.normalBias
    object.shadow.needsUpdate = true
  }
}

// Three.js recompiles every material when the number of lights changes, which
// froze the visit at each room. This rig keeps that number constant and moves
// a fixed set of lights along the route instead.
export function RouteLightRig({
  lightQuality,
  qualityLevel,
  ready,
  sectionVisibility,
}) {
  const budget = QUALITY_SETTINGS[lightQuality].lightBudget
  const shadowMapSize = getShadowMapSize(512, qualityLevel)
  const slots = useMemo(
    () => ({
      plain: createLightSlots(budget.plain),
      rect: createLightSlots(budget.rect),
      shadow: createLightSlots(budget.shadow),
    }),
    [budget],
  )
  const objects = useRef({ plain: [], rect: [], shadow: [] })
  const selection = useRef(null)
  const lastRanking = useRef(new Vector3())
  const forward = useRef(new Vector3())
  const refreshedVersion = useRef(getRouteShadowVersion())

  useEffect(() => {
    selection.current = null
    requestRouteShadowRefresh()
  }, [budget, sectionVisibility])

  useEffect(() => {
    objects.current.shadow.forEach((light) => {
      if (!light) {
        return
      }

      light.shadow.autoUpdate = false
      light.shadow.mapSize.set(shadowMapSize, shadowMapSize)
      light.shadow.map?.dispose()
      light.shadow.map = null
      light.shadow.needsUpdate = true
    })
  }, [budget, qualityLevel, shadowMapSize])

  useFrame(({ camera }, delta) => {
    if (
      !selection.current ||
      lastRanking.current.distanceToSquared(camera.position) >
        RANKING_DISTANCE_SQUARED
    ) {
      camera.getWorldDirection(forward.current)
      selection.current = selectRouteLights(
        ROUTE_LIGHTS,
        sectionVisibility,
        camera.position,
        forward.current,
        budget,
      )
      lastRanking.current.copy(camera.position)
    }

    const fadeAmount = ready ? delta / LIGHT_FADE_SECONDS : 1

    SLOT_GROUPS.forEach((group) => {
      const groupObjects = objects.current[group]

      stepLightSlots(
        slots[group],
        selection.current[group],
        fadeAmount,
      ).forEach((slot) => {
        applyLightSource(
          groupObjects[slots[group].indexOf(slot)],
          slot.light,
        )
      })

      slots[group].forEach((slot, index) => {
        groupObjects[index].intensity = slot.light
          ? slot.light.intensity * slot.level
          : 0
      })
    })

    if (refreshedVersion.current !== getRouteShadowVersion()) {
      refreshedVersion.current = getRouteShadowVersion()
      objects.current.shadow.forEach((light) => {
        if (light) {
          light.shadow.needsUpdate = true
        }
      })
    }
  })

  return (
    <group name="route-light-rig" key={lightQuality}>
      {slots.shadow.map((_, index) => (
        <pointLight
          key={index}
          ref={(light) => {
            objects.current.shadow[index] = light
          }}
          castShadow
          intensity={0}
        />
      ))}
      {slots.plain.map((_, index) => (
        <pointLight
          key={index}
          ref={(light) => {
            objects.current.plain[index] = light
          }}
          intensity={0}
        />
      ))}
      {slots.rect.map((_, index) => (
        <rectAreaLight
          key={index}
          ref={(light) => {
            objects.current.rect[index] = light
          }}
          intensity={0}
        />
      ))}
    </group>
  )
}
