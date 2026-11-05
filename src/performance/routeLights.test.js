import assert from 'node:assert/strict'
import test from 'node:test'
import {
  ROUTE_LIGHTS,
  createLightSlots,
  selectRouteLights,
  stepLightSlots,
} from './routeLights.js'
import { QUALITY_SETTINGS } from './qualitySettings.js'

const ALL_SECTIONS = Object.freeze({
  entrance: true,
  finalRoute: true,
  provenance: true,
  signage: true,
})
const FORWARD = Object.freeze({ x: 0, y: 0, z: -1 })

function cameraAt(x, y, z) {
  return { x, y, z }
}

test('the route keeps every approved light, including the portals', () => {
  assert.equal(ROUTE_LIGHTS.length, 29)
  assert.equal(
    ROUTE_LIGHTS.filter((light) => light.kind === 'rect').length,
    4,
  )
  assert.equal(ROUTE_LIGHTS.filter((light) => light.shadow).length, 8)
})

test('selection never exceeds the light budget of any quality level', () => {
  Object.values(QUALITY_SETTINGS).forEach(({ lightBudget }) => {
    const selection = selectRouteLights(
      ROUTE_LIGHTS,
      ALL_SECTIONS,
      cameraAt(-18, 1.7, 25),
      FORWARD,
      lightBudget,
    )

    assert.ok(selection.plain.length <= lightBudget.plain)
    assert.ok(selection.shadow.length <= lightBudget.shadow)
    assert.ok(selection.rect.length <= lightBudget.rect)
    assert.ok(selection.shadow.every((light) => light.shadow))
  })
})

test('selection keeps the lights nearest to the visitor', () => {
  const { shadow } = selectRouteLights(
    ROUTE_LIGHTS,
    ALL_SECTIONS,
    cameraAt(-18, 1.7, 26),
    FORWARD,
    QUALITY_SETTINGS.high.lightBudget,
  )

  assert.deepEqual(shadow[0].position, [-18, 3.25, 25])
})

test('lights of a hidden section are never selected', () => {
  const { plain, rect, shadow } = selectRouteLights(
    ROUTE_LIGHTS,
    { ...ALL_SECTIONS, entrance: false },
    cameraAt(-18, 1.7, 26),
    FORWARD,
    QUALITY_SETTINGS.high.lightBudget,
  )

  assert.ok(
    [...plain, ...rect, ...shadow].every(
      (light) => light.section !== 'entrance',
    ),
  )
})

test('shadow lights fall back to plain slots when the budget has no shadows', () => {
  const { plain, shadow } = selectRouteLights(
    ROUTE_LIGHTS,
    ALL_SECTIONS,
    cameraAt(-18, 1.7, 26),
    FORWARD,
    QUALITY_SETTINGS.low.lightBudget,
  )

  assert.equal(shadow.length, 0)
  assert.ok(plain.some((light) => light.shadow))
})

test('a shadow light never shines through walls when out of shadow slots', () => {
  const { plain, shadow } = selectRouteLights(
    ROUTE_LIGHTS,
    ALL_SECTIONS,
    cameraAt(-10, 1.7, 12),
    FORWARD,
    { plain: 6, rect: 1, shadow: 1 },
  )

  assert.equal(shadow.length, 1)
  assert.ok(plain.every((light) => !light.shadow))
})

test('a strong lamp down the corridor outranks a weak one nearby', () => {
  const { plain } = selectRouteLights(
    ROUTE_LIGHTS,
    ALL_SECTIONS,
    cameraAt(-6.7, 1.7, 12),
    { x: 1, y: 0, z: 0 },
    { plain: 1, rect: 0, shadow: 1 },
  )

  assert.notDeepEqual(plain[0].position, [-6.7, 2.45, 12])
  assert.ok(plain[0].intensity > 1.8)
})

test('a slot fades out before receiving another light', () => {
  const [first, second] = ROUTE_LIGHTS
  const slots = createLightSlots(1)

  assert.equal(stepLightSlots(slots, [first], 1).length, 1)
  assert.equal(slots[0].light, first)
  assert.equal(slots[0].level, 1)

  assert.equal(stepLightSlots(slots, [second], 0.5).length, 0)
  assert.equal(slots[0].light, first)
  assert.equal(slots[0].level, 0.5)

  assert.equal(stepLightSlots(slots, [second], 0.5).length, 1)
  assert.equal(slots[0].light, second)
  assert.equal(slots[0].level, 0.5)

  stepLightSlots(slots, [second], 0.5)
  assert.equal(slots[0].level, 1)
})

test('the number of slots never changes, even with nothing to light', () => {
  const slots = createLightSlots(3)

  stepLightSlots(slots, ROUTE_LIGHTS.slice(0, 2), 1)
  assert.equal(slots.length, 3)
  assert.equal(slots[2].light, null)

  stepLightSlots(slots, [], 1)
  assert.equal(slots.length, 3)
  assert.ok(slots.every((slot) => slot.light === null))
})
