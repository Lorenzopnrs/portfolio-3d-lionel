import assert from 'node:assert/strict'
import test from 'node:test'
import {
  applyDirectionalInput,
  applyWheelInput,
  createMovementState,
  resetMovementToStart,
  setKeyboardDirection,
  setReducedMotion,
  setTravelLocked,
  updateMovement,
} from './movementController.js'
import {
  EVALUATION_STOPS,
  INITIAL_PROGRESS,
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

test('reduced motion visits all the route stops forward and backward', () => {
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

test('a gentle wheel crosses every stop in both directions', (t) => {
  let now = 0
  t.mock.method(performance, 'now', () => now)

  for (const direction of [1, -1]) {
    const controller = createMovementState()
    controller.progress = direction > 0 ? INITIAL_PROGRESS : 0.99
    const crossedStops = new Set()

    // One wheel notch per second, the slowest a visitor would reasonably scroll.
    for (let frame = 0; frame < 60 * 180; frame += 1) {
      now += 1000 / 60

      if (frame % 60 === 0) {
        applyWheelInput(controller, direction * 100, 0)
      }

      updateMovement(controller, 1 / 60)

      EVALUATION_STOPS.forEach((stop) => {
        if ((controller.progress - stop.progress) * direction > 0.005) {
          crossedStops.add(stop.id)
        }
      })
    }

    assert.equal(
      crossedStops.size,
      EVALUATION_STOPS.length,
      `direction ${direction}: ${[...crossedStops].join(', ')}`,
    )
  }
})

test('a stop still catches a visitor who stops scrolling on arrival', (t) => {
  let now = 0
  t.mock.method(performance, 'now', () => now)

  const stop = EVALUATION_STOPS[1]
  const controller = createMovementState()
  controller.progress = stop.progress + 0.01

  // As fast here as anywhere else, even though the route slows down around it.
  for (let frame = 0; frame < 95; frame += 1) {
    now += 1000 / 60
    updateMovement(controller, 1 / 60)
  }

  assert.equal(controller.activeStopIndex, 1)
  assert.equal(controller.progress, stop.progress)
})

const HOLD_STOPS = EVALUATION_STOPS.filter((stop) => stop.hold)
const FIRST_HOLD_INDEX = EVALUATION_STOPS.indexOf(HOLD_STOPS[0])

function createClock(t) {
  const clock = { now: 0 }
  t.mock.method(performance, 'now', () => clock.now)
  return clock
}

function holdAtFirstStop(clock) {
  const controller = createMovementState()
  controller.progress = HOLD_STOPS[0].progress - 0.002

  for (
    let frame = 0;
    controller.holdStopIndex === null && frame < 600;
    frame += 1
  ) {
    clock.now += 1000 / 60
    updateMovement(controller, 1 / 60)
  }

  assert.equal(controller.holdStopIndex, FIRST_HOLD_INDEX)
  clock.now += 500
  return controller
}

function wait(controller, clock, frames = 12) {
  for (let frame = 0; frame < frames; frame += 1) {
    clock.now += 1000 / 60
    updateMovement(controller, 1 / 60)
  }
}

test('however fast the wheel spins, every book is a real stop', (t) => {
  const clock = createClock(t)
  const controller = createMovementState()
  const visited = []

  controller.progress = HOLD_STOPS[0].progress - 0.08

  for (
    let frame = 0;
    controller.progress < 0.995 && frame < 60 * 120;
    frame += 1
  ) {
    clock.now += 1000 / 60

    if (frame % 3 === 0) {
      applyWheelInput(controller, 100, 0)
    }

    updateMovement(controller, 1 / 60)

    if (
      controller.holdStopIndex !== null &&
      visited.at(-1) !== controller.holdStopIndex
    ) {
      visited.push(controller.holdStopIndex)
    }
  }

  assert.deepEqual(
    visited.map((index) => EVALUATION_STOPS[index].id),
    HOLD_STOPS.map((stop) => stop.id),
  )
})

test('the third wheel notch lets the visitor go, not the first two', (t) => {
  const clock = createClock(t)
  const controller = holdAtFirstStop(clock)

  for (const notch of [1, 2]) {
    applyWheelInput(controller, 100, 0)
    wait(controller, clock)
    assert.equal(controller.holdStopIndex, FIRST_HOLD_INDEX, `notch ${notch}`)
    assert.ok(
      Math.abs(controller.progress - HOLD_STOPS[0].progress) < 0.005,
    )
  }

  applyWheelInput(controller, 100, 0)
  wait(controller, clock, 30)

  assert.equal(controller.holdStopIndex, null)
  assert.ok(controller.progress > HOLD_STOPS[0].progress + 0.003)
})

test('the end of the scroll that brought the visitor there does not count', (t) => {
  const clock = createClock(t)
  const controller = holdAtFirstStop(clock)

  controller.holdStartTime = clock.now

  for (let notch = 0; notch < 6; notch += 1) {
    applyWheelInput(controller, 100, 0)
    wait(controller, clock, 2)
  }

  assert.equal(controller.holdStopIndex, FIRST_HOLD_INDEX)
  assert.equal(controller.holdCharge, 0)
})

test('changing direction starts the count again', (t) => {
  const clock = createClock(t)
  const controller = holdAtFirstStop(clock)

  applyWheelInput(controller, 100, 0)
  applyWheelInput(controller, 100, 0)
  applyWheelInput(controller, -100, 0)
  wait(controller, clock)

  assert.equal(controller.holdStopIndex, FIRST_HOLD_INDEX)

  applyWheelInput(controller, -100, 0)
  applyWheelInput(controller, -100, 0)
  wait(controller, clock, 30)

  assert.equal(controller.holdStopIndex, null)
  assert.ok(controller.progress < HOLD_STOPS[0].progress - 0.003)
})

test('going back stops on the books too', (t) => {
  const clock = createClock(t)
  const controller = createMovementState()
  const secondStopIndex = EVALUATION_STOPS.indexOf(HOLD_STOPS[1])

  controller.progress = HOLD_STOPS[1].progress + 0.03

  for (
    let frame = 0;
    controller.holdStopIndex === null && frame < 600;
    frame += 1
  ) {
    clock.now += 1000 / 60

    if (frame % 3 === 0) {
      applyWheelInput(controller, -100, 0)
    }

    updateMovement(controller, 1 / 60)
  }

  assert.equal(controller.holdStopIndex, secondStopIndex)
})

test('on screen, two presses or swipes are enough', (t) => {
  const clock = createClock(t)
  const controller = holdAtFirstStop(clock)

  applyDirectionalInput(controller, 1)
  wait(controller, clock)
  assert.equal(controller.holdStopIndex, FIRST_HOLD_INDEX)

  applyDirectionalInput(controller, 1)
  assert.equal(controller.holdStopIndex, null)
})

test('holding an arrow key leaves after a moment', (t) => {
  const clock = createClock(t)
  const controller = holdAtFirstStop(clock)

  setKeyboardDirection(controller, 1)
  wait(controller, clock, 12)
  assert.equal(controller.holdStopIndex, FIRST_HOLD_INDEX)

  wait(controller, clock, 45)
  assert.equal(controller.holdStopIndex, null)
})

test('a locked overlay keeps the visitor on the same book', (t) => {
  const clock = createClock(t)
  const controller = holdAtFirstStop(clock)

  setTravelLocked(controller, true)
  applyWheelInput(controller, 100, 0)
  wait(controller, clock)
  setTravelLocked(controller, false)
  wait(controller, clock)

  assert.equal(controller.holdStopIndex, FIRST_HOLD_INDEX)
  assert.equal(controller.activeStopIndex, FIRST_HOLD_INDEX)
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

test('the final portal resets movement while preserving active preferences', () => {
  const controller = createMovementState()
  controller.progress = 0.997
  controller.velocity = 0.18
  controller.keyboardDirection = 1
  controller.activeStopIndex = EVALUATION_STOPS.length - 1
  controller.reducedMotion = true
  controller.travelLocked = true
  controller.lockedProgress = controller.progress

  resetMovementToStart(controller)

  assert.equal(controller.progress, INITIAL_PROGRESS)
  assert.equal(controller.lockedProgress, INITIAL_PROGRESS)
  assert.equal(controller.velocity, 0)
  assert.equal(controller.keyboardDirection, 0)
  assert.equal(controller.activeStopIndex, null)
  assert.equal(controller.transition, null)
  assert.equal(controller.reducedMotion, true)
  assert.equal(controller.travelLocked, true)
})
