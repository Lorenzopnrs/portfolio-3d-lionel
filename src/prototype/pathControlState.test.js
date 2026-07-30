import assert from 'node:assert/strict'
import test from 'node:test'
import {
  createMovementState,
  setReducedMotion,
  setTravelLocked,
  updateMovement,
} from './movementController.js'
import { installPathControls } from './pathControlState.js'

function dispatchKey(target, type, key) {
  const event = new Event(type, { cancelable: true })
  Object.defineProperty(event, 'key', { value: key })
  target.dispatchEvent(event)
  return event
}

test('registered controls release a key while project travel is locked', () => {
  const eventTarget = new EventTarget()
  const movementRef = { current: createMovementState() }
  setReducedMotion(movementRef.current, true)

  while (movementRef.current.transition) {
    updateMovement(movementRef.current, 1 / 30)
  }

  const removeControls = installPathControls(eventTarget, movementRef)
  const firstKeyDown = dispatchKey(eventTarget, 'keydown', 'ArrowDown')

  assert.equal(firstKeyDown.defaultPrevented, true)
  assert.notEqual(movementRef.current.transition, null)

  setTravelLocked(movementRef.current, true)
  dispatchKey(eventTarget, 'keyup', 'ArrowDown')
  setTravelLocked(movementRef.current, false)

  assert.equal(movementRef.current.transition, null)

  const secondKeyDown = dispatchKey(eventTarget, 'keydown', 'ArrowDown')

  assert.equal(secondKeyDown.defaultPrevented, true)
  assert.notEqual(movementRef.current.transition, null)
  removeControls()
})
