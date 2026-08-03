import assert from 'node:assert/strict'
import test from 'node:test'
import {
  applyDirectionalInput,
  applyWheelInput,
  createMovementState,
  setReducedMotion,
  setTravelLocked,
  updateMovement,
} from './movementController.js'
import {
  EVALUATION_STOPS,
  PATH_LENGTH,
} from './cameraPath.js'

test('project focus locks and restores the exact route position', () => {
  const controller = createMovementState()
  controller.progress = 0.543210987
  controller.velocity = 0.12

  setTravelLocked(controller, true)
  const lockedProgress = controller.progress

  applyDirectionalInput(controller, 1)
  updateMovement(controller, 1 / 30)

  assert.equal(controller.progress, lockedProgress)
  assert.equal(controller.velocity, 0)

  setTravelLocked(controller, false)

  assert.equal(controller.progress, 0.543210987)
  assert.equal(controller.travelLocked, false)
})

function settleTransition(controller) {
  for (let frame = 0; frame < 30; frame += 1) {
    updateMovement(controller, 1 / 30)
  }
}

test('reduced motion visits all four route stops forward and backward', () => {
  const controller = createMovementState()
  setReducedMotion(controller, true)
  settleTransition(controller)

  assert.equal(controller.activeStopIndex, 0)

  for (let index = 1; index < EVALUATION_STOPS.length; index += 1) {
    applyDirectionalInput(controller, 1)
    settleTransition(controller)
    assert.equal(controller.activeStopIndex, index)
    assert.equal(
      controller.progress,
      EVALUATION_STOPS[index].progress,
    )
  }

  for (let index = EVALUATION_STOPS.length - 2; index >= 0; index -= 1) {
    applyDirectionalInput(controller, -1)
    settleTransition(controller)
    assert.equal(controller.activeStopIndex, index)
    assert.equal(
      controller.progress,
      EVALUATION_STOPS[index].progress,
    )
  }
})

test('a strong wheel impulse cannot skip an architectural section', () => {
  const controller = createMovementState()
  const startProgress = controller.progress

  applyWheelInput(controller, 100000, 0)
  updateMovement(controller, 1 / 30)

  const travelledDistance =
    Math.abs(controller.progress - startProgress) * PATH_LENGTH

  assert.ok(travelledDistance <= 0.62)
})
