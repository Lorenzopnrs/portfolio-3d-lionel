import { Euler, Vector3 } from 'three'
import {
  FINAL_LOOP_PORTAL_POSITION,
  FINAL_LOOP_PORTAL_ROTATION,
} from '../final-route/finalRoutePlacement.js'
import { ABOUT_PORTAL_POSITION } from '../vertical-slice/aboutPortalConfig.js'

const BEHIND_CAMERA_WEIGHT = 0.3
const MINIMUM_SCORE_DISTANCE = 1.5
const PORTAL_LIGHT_OFFSET = Object.freeze([0, 1.72, 0.42])

function pointLight(section, color, distance, intensity, position, shadow) {
  return Object.freeze({
    color,
    decay: 2,
    distance,
    intensity,
    kind: 'point',
    position: Object.freeze(position),
    section,
    shadow: shadow ? Object.freeze(shadow) : null,
  })
}

function rectLight(section, color, width, height, intensity, position, rotation) {
  return Object.freeze({
    color,
    height,
    intensity,
    kind: 'rect',
    position: Object.freeze(position),
    rotation: Object.freeze(rotation),
    section,
    width,
  })
}

function offsetFrom(position, rotation, offset) {
  const worldOffset = new Vector3(...offset).applyEuler(
    new Euler(...rotation),
  )

  return [
    position[0] + worldOffset.x,
    position[1] + worldOffset.y,
    position[2] + worldOffset.z,
  ]
}

const KEY_SHADOW = { bias: -0.0006, normalBias: 0.035 }
const SOFT_SHADOW = { bias: -0.0006, normalBias: 0.04 }

const ENTRANCE_LIGHTS = [
  pointLight('entrance', '#ff9d4d', 7, 29.1, [-18, 3.25, 25], KEY_SHADOW),
  pointLight('entrance', '#f28b35', 3, 5, [-20.05, 1.18, 26.48]),
  pointLight('entrance', '#ffad63', 4.2, 8, [-20.32, 1.62, 22.95]),
  pointLight('entrance', '#f59a45', 6.1, 20.7, [-18, 3.18, 16.65]),
  pointLight('entrance', '#ffad62', 4, 7, [-15.68, 1.62, 14.85]),
  pointLight('entrance', '#ed8734', 2.8, 3.5, [-20.08, 0.55, 13.65]),
  rectLight('entrance', '#adb7b2', 3.6, 4.8, 3.6, [-18, 3.3, 10.2], [0, Math.PI, 0]),
  pointLight('entrance', '#aebbb8', 8.5, 5, [-18, 2.8, 10.4]),
  pointLight(
    'entrance',
    '#7189d2',
    4.6,
    10.5,
    offsetFrom(ABOUT_PORTAL_POSITION, [0, 0, 0], PORTAL_LIGHT_OFFSET),
  ),
]

const PROVENANCE_LIGHTS = [
  pointLight('provenance', '#f6a154', 4.9, 32.2, [-14.18, 2.08, 14.08], SOFT_SHADOW),
  pointLight('provenance', '#ff9d52', 3.7, 9.8, [-9.55, 2.08, 14.08], KEY_SHADOW),
  pointLight('provenance', '#f08c3d', 2.8, 3.5, [-9.35, 1.35, 13.55]),
  pointLight('provenance', '#f3a35a', 2.7, 4.5, [-8.62, 1.55, 10.45]),
  pointLight('provenance', '#baa78f', 9, 10, [-11.15, 1.2, 12]),
  rectLight('provenance', '#9ba9aa', 2.8, 3.4, 1.4, [-6.72, 2.85, 12], [0, Math.PI / 2, 0]),
  pointLight('provenance', '#aab4b2', 5.2, 1.8, [-6.7, 2.45, 12]),
]

const FINAL_ROUTE_LIGHTS = [
  pointLight('finalRoute', '#f7a052', 5.3, 50.6, [-6.45, 3.4, 12], SOFT_SHADOW),
  pointLight('finalRoute', '#ffa257', 2.9, 66.7, [-3.8, 3.45, 12], KEY_SHADOW),
  pointLight('finalRoute', '#f3903f', 6.1, 48.3, [1.15, 3.4, 12]),
  pointLight('finalRoute', '#c8aa89', 9, 7, [-2.2, 1.25, 12]),
  pointLight('finalRoute', '#ffb878', 4.4, 13, [3.75, 2.95, 12], KEY_SHADOW),
  pointLight('finalRoute', '#ffb878', 3.6, 3.2, [3.9, 2.35, 7.1], KEY_SHADOW),
  rectLight('finalRoute', '#96a5a5', 3, 3.8, 2.1, [4.1, 3.1, 8.6], [-Math.PI / 2, 0, 0]),
  pointLight('finalRoute', '#f79a4d', 5, 38, [4.15, 2.25, 5.3], SOFT_SHADOW),
  pointLight('finalRoute', '#ffac61', 5.8, 48.3, [9.85, 2.55, 4]),
  pointLight('finalRoute', '#b9aa98', 8, 5.5, [4.2, 1.3, 4]),
  rectLight('finalRoute', '#8c9d9f', 2.7, 3.2, 1.9, [13.25, 2.8, 4], [0, -Math.PI / 2, 0]),
  pointLight('finalRoute', '#9da9a7', 6, 6.5, [13.1, 2.3, 4]),
  pointLight(
    'finalRoute',
    '#7189d2',
    4.6,
    10.5,
    offsetFrom(
      FINAL_LOOP_PORTAL_POSITION,
      FINAL_LOOP_PORTAL_ROTATION,
      PORTAL_LIGHT_OFFSET,
    ),
  ),
]

export const ROUTE_LIGHTS = Object.freeze([
  ...ENTRANCE_LIGHTS,
  ...PROVENANCE_LIGHTS,
  ...FINAL_ROUTE_LIGHTS,
])

let routeShadowVersion = 0

// Shadow maps are static: anything that changes what casts a shadow calls this.
export function requestRouteShadowRefresh() {
  routeShadowVersion += 1
}

export function getRouteShadowVersion() {
  return routeShadowVersion
}

// Estimates how much a light shows on screen: its power, the area it reaches,
// then how small that area looks from the camera. A strong lamp down the
// corridor matters more than a weak one nearby.
function scoreLight(light, cameraPosition, cameraForward) {
  const x = light.position[0] - cameraPosition.x
  const y = light.position[1] - cameraPosition.y
  const z = light.position[2] - cameraPosition.z
  const distance = Math.max(MINIMUM_SCORE_DISTANCE, Math.hypot(x, y, z))
  const ahead =
    x * cameraForward.x + y * cameraForward.y + z * cameraForward.z
  const reach = light.distance ?? Math.max(light.width, light.height)

  return (
    (light.intensity * reach * reach) /
    (distance * distance) *
    (ahead < 0 ? BEHIND_CAMERA_WEIGHT : 1)
  )
}

export function selectRouteLights(
  lights,
  visibleSections,
  cameraPosition,
  cameraForward,
  budget,
) {
  const ranked = lights
    .filter((light) => visibleSections[light.section])
    .map((light) => ({
      light,
      score: scoreLight(light, cameraPosition, cameraForward),
    }))
    .sort((first, second) => second.score - first.score)
    .map(({ light }) => light)
  const points = ranked.filter((light) => light.kind === 'point')
  const shadow = points
    .filter((light) => light.shadow)
    .slice(0, budget.shadow)

  return {
    // A strong lamp that loses its shadow would shine through the walls, so it
    // stays off, unless the quality level has no shadows at all.
    plain: points
      .filter((light) => !light.shadow || budget.shadow === 0)
      .slice(0, budget.plain),
    rect: ranked
      .filter((light) => light.kind === 'rect')
      .slice(0, budget.rect),
    shadow,
  }
}

export function createLightSlots(count) {
  return Array.from({ length: count }, () => ({ level: 0, light: null }))
}

// A slot is only reassigned once it has faded out, so a light never pops.
export function stepLightSlots(slots, desiredLights, fadeAmount) {
  const missing = desiredLights.filter(
    (light) => !slots.some((slot) => slot.light === light),
  )
  const reassignedSlots = []

  slots.forEach((slot) => {
    if (slot.light && desiredLights.includes(slot.light)) {
      slot.level = Math.min(1, slot.level + fadeAmount)
      return
    }

    if (slot.light) {
      slot.level = Math.max(0, slot.level - fadeAmount)

      if (slot.level > 0) {
        return
      }

      slot.light = null
    }

    if (missing.length > 0) {
      slot.light = missing.shift()
      slot.level = Math.min(1, fadeAmount)
      reassignedSlots.push(slot)
    }
  })

  return reassignedSlots
}
