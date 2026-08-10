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

function dispatchTouch(target, type, {
  clientX = 0,
  clientY,
  timeStamp,
}) {
  const event = new Event(type, { cancelable: true })
  const touch = { clientX, clientY }

  Object.defineProperty(event, 'touches', {
    value: type === 'touchend' ? [] : [touch],
  })
  Object.defineProperty(event, 'changedTouches', {
    value: [touch],
  })
  Object.defineProperty(event, 'timeStamp', { value: timeStamp })
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
  const firstKeyDown = dispatchKey(eventTarget, 'keydown', 'ArrowUp')

  assert.equal(firstKeyDown.defaultPrevented, true)
  assert.notEqual(movementRef.current.transition, null)

  setTravelLocked(movementRef.current, true)
  dispatchKey(eventTarget, 'keyup', 'ArrowUp')
  setTravelLocked(movementRef.current, false)

  assert.equal(movementRef.current.transition, null)

  const secondKeyDown = dispatchKey(eventTarget, 'keydown', 'ArrowUp')

  assert.equal(secondKeyDown.defaultPrevented, true)
  assert.notEqual(movementRef.current.transition, null)
  removeControls()
})

test('up moves forward and down moves backward on the constrained path', () => {
  const eventTarget = new EventTarget()
  const movementRef = { current: createMovementState() }
  const removeControls = installPathControls(eventTarget, movementRef)

  dispatchKey(eventTarget, 'keydown', 'ArrowUp')
  assert.ok(movementRef.current.velocity > 0)
  dispatchKey(eventTarget, 'keyup', 'ArrowUp')

  movementRef.current.velocity = 0
  dispatchKey(eventTarget, 'keydown', 'ArrowDown')
  assert.ok(movementRef.current.velocity < 0)
  dispatchKey(eventTarget, 'keyup', 'ArrowDown')

  removeControls()
})

test('vertical swipes use distance and velocity thresholds in both directions', () => {
  const eventTarget = new EventTarget()
  const movementRef = { current: createMovementState() }
  const removeControls = installPathControls(eventTarget, movementRef)

  dispatchTouch(eventTarget, 'touchstart', {
    clientY: 100,
    timeStamp: 0,
  })
  dispatchTouch(eventTarget, 'touchend', {
    clientY: 180,
    timeStamp: 180,
  })
  assert.ok(movementRef.current.velocity > 0)

  movementRef.current.velocity = 0
  dispatchTouch(eventTarget, 'touchstart', {
    clientY: 180,
    timeStamp: 300,
  })
  dispatchTouch(eventTarget, 'touchend', {
    clientY: 100,
    timeStamp: 480,
  })
  assert.ok(movementRef.current.velocity < 0)

  movementRef.current.velocity = 0
  dispatchTouch(eventTarget, 'touchstart', {
    clientY: 100,
    timeStamp: 600,
  })
  dispatchTouch(eventTarget, 'touchend', {
    clientY: 130,
    timeStamp: 680,
  })
  assert.equal(movementRef.current.velocity, 0)

  movementRef.current.velocity = 0
  dispatchTouch(eventTarget, 'touchstart', {
    clientY: 100,
    timeStamp: 800,
  })
  dispatchTouch(eventTarget, 'touchend', {
    clientY: 180,
    timeStamp: 1800,
  })
  assert.equal(movementRef.current.velocity, 0)

  removeControls()
})

test('swipes beginning on interactive content never move the route', () => {
  const eventTarget = new EventTarget()
  eventTarget.closest = () => eventTarget
  const movementRef = { current: createMovementState() }
  const removeControls = installPathControls(eventTarget, movementRef)

  dispatchTouch(eventTarget, 'touchstart', {
    clientY: 80,
    timeStamp: 0,
  })
  dispatchTouch(eventTarget, 'touchend', {
    clientY: 220,
    timeStamp: 160,
  })

  assert.equal(movementRef.current.velocity, 0)
  removeControls()
})
