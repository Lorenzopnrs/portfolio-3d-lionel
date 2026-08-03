import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { Vector3 } from 'three'
import {
  getCameraPointAt,
} from '../prototype/cameraPath.js'
import {
  applyWheelInput,
  createMovementState,
  setTravelLocked,
  updateMovement,
} from '../prototype/movementController.js'
import {
  ABOUT_PORTAL_DEPTH,
  ABOUT_PORTAL_FRAME_OUTER_HEIGHT,
  ABOUT_PORTAL_FRAME_OUTER_WIDTH,
  ABOUT_PORTAL_POSITION,
} from './aboutPortalConfig.js'

const root = fileURLToPath(new URL('../../', import.meta.url))
const portalPath = `${root}src/vertical-slice/AboutPortal.jsx`

function distanceToPortalBounds(point) {
  const [centerX, baseY, centerZ] = ABOUT_PORTAL_POSITION
  const minimumX = centerX - ABOUT_PORTAL_FRAME_OUTER_WIDTH / 2
  const maximumX = centerX + ABOUT_PORTAL_FRAME_OUTER_WIDTH / 2
  const minimumY = baseY
  const maximumY = baseY + ABOUT_PORTAL_FRAME_OUTER_HEIGHT
  const minimumZ = centerZ - ABOUT_PORTAL_DEPTH
  const maximumZ = centerZ + ABOUT_PORTAL_DEPTH
  const dx = Math.max(minimumX - point.x, 0, point.x - maximumX)
  const dy = Math.max(minimumY - point.y, 0, point.y - maximumY)
  const dz = Math.max(minimumZ - point.z, 0, point.z - maximumZ)

  return Math.hypot(dx, dy, dz)
}

test('camera path stays safely clear of the About me portal', () => {
  const samplePoint = new Vector3()
  let minimumClearance = Infinity

  for (let index = 0; index <= 2400; index += 1) {
    getCameraPointAt(index / 2400, samplePoint)
    minimumClearance = Math.min(
      minimumClearance,
      distanceToPortalBounds(samplePoint),
    )
  }

  assert.ok(
    minimumClearance >= 2.4,
    `Expected at least 2.4m portal clearance, received ${minimumClearance.toFixed(3)}m`,
  )
})

test('About me focus lock preserves the exact route position', () => {
  const movement = createMovementState()
  const exactProgress = 0.137245
  movement.progress = exactProgress

  setTravelLocked(movement, true)
  const wheelHandled = applyWheelInput(movement, 48, 0)
  updateMovement(movement, 1)

  assert.equal(wheelHandled, false)
  assert.equal(movement.progress, exactProgress)

  setTravelLocked(movement, false)

  assert.equal(movement.progress, exactProgress)
  assert.equal(movement.lockedProgress, null)
  assert.equal(movement.travelLocked, false)
})

test('About portal title is rendered as portal-anchored 3D material', () => {
  const portalSource = readFileSync(portalPath, 'utf8')

  assert.match(portalSource, /CanvasTexture/)
  assert.match(portalSource, /function PortalTitle/)
  assert.match(portalSource, /name="about-portal-title"/)
  assert.doesNotMatch(
    portalSource,
    /<span>A PROPOS DE MOI<\/span>/,
  )
})
