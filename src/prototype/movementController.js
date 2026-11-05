import {
  EVALUATION_STOPS,
  INITIAL_PROGRESS,
  PATH_LENGTH,
  clampProgress,
  getRouteSpeedFactor,
} from './cameraPath.js'

const REFERENCE_PATH_LENGTH = 57.466
// Keep the validated motion distances consistent as the route grows.
const PATH_PROGRESS_SCALE = REFERENCE_PATH_LENGTH / PATH_LENGTH
const MAX_VELOCITY = 0.32 * PATH_PROGRESS_SCALE
const WHEEL_IMPULSE = 0.0024 * PATH_PROGRESS_SCALE
const KEYBOARD_IMPULSE = 0.045 * PATH_PROGRESS_SCALE
const KEYBOARD_ACCELERATION = 0.62 * PATH_PROGRESS_SCALE
const DECELERATION = 6.8
const STOP_RADIUS = 0.026 * PATH_PROGRESS_SCALE
const STOP_SPRING = 24
const STOP_DAMPING = 9
const REDUCED_GESTURE_GAP = 140
const REDUCED_TRANSITION_DURATION = 0.34
const RELEASE_DISTANCE = 0.0015 * PATH_PROGRESS_SCALE
const STOP_PROGRESS_THRESHOLD = 0.003 * PATH_PROGRESS_SCALE
const STOP_SNAP_DISTANCE = 0.0012 * PATH_PROGRESS_SCALE
const STOP_SNAP_VELOCITY = 0.012 * PATH_PROGRESS_SCALE
const STOP_APPROACH_VELOCITY = 0.075 * PATH_PROGRESS_SCALE
const STOP_REACHED_DISTANCE = 0.006 * PATH_PROGRESS_SCALE
// A held stop lets go after three wheel notches (each one counts for 48).
const HOLD_RELEASE_CHARGE = 130
const HOLD_DIRECTIONAL_CHARGE = 70
const HOLD_KEY_CHARGE_PER_SECOND = 190
// Ignores the end of the scroll that brought the visitor here.
const HOLD_SETTLE_MILLISECONDS = 350
const HOLD_NUDGE = 0.016 * PATH_PROGRESS_SCALE
const HOLD_SPRING = 70
const HOLD_DAMPING = 14
const HOLD_BRAKE_DISTANCE = 0.05 * PATH_PROGRESS_SCALE
const HOLD_BRAKE_RATE = 2
const HOLD_MINIMUM_APPROACH = 0.02 * PATH_PROGRESS_SCALE
const HOLD_CAPTURE_DISTANCE = 0.0015 * PATH_PROGRESS_SCALE
// Keeps the travel speed unchanged on phones rendering down to 15 frames/s.
const MAXIMUM_FRAME_DELTA = 1 / 15

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value))
}

function easeInOutCubic(value) {
  return value < 0.5
    ? 4 * value * value * value
    : 1 - Math.pow(-2 * value + 2, 3) / 2
}

function getNearestStopIndex(progress) {
  let nearestIndex = 0
  let nearestDistance = Infinity

  EVALUATION_STOPS.forEach((stop, index) => {
    const distance = Math.abs(stop.progress - progress)

    if (distance < nearestDistance) {
      nearestDistance = distance
      nearestIndex = index
    }
  })

  return nearestIndex
}

function startReducedTransition(controller, targetStopIndex) {
  const targetProgress = EVALUATION_STOPS[targetStopIndex].progress

  controller.velocity = 0
  controller.keyboardDirection = 0
  controller.activeStopIndex = null
  controller.transition = {
    from: controller.progress,
    to: targetProgress,
    elapsed: 0,
    duration: REDUCED_TRANSITION_DURATION,
    targetStopIndex,
  }
}

function stepReducedMotion(controller, direction) {
  const referenceProgress = controller.transition
    ? controller.transition.to
    : controller.progress
  let targetStopIndex

  if (direction > 0) {
    targetStopIndex = EVALUATION_STOPS.findIndex(
      (stop) => stop.progress > referenceProgress + STOP_PROGRESS_THRESHOLD,
    )
    if (targetStopIndex === -1) {
      targetStopIndex = EVALUATION_STOPS.length - 1
    }
  } else {
    targetStopIndex = EVALUATION_STOPS.findLastIndex(
      (stop) => stop.progress < referenceProgress - STOP_PROGRESS_THRESHOLD,
    )
    if (targetStopIndex === -1) {
      targetStopIndex = 0
    }
  }

  startReducedTransition(controller, targetStopIndex)
}

function enterHold(controller, stopIndex) {
  controller.progress = EVALUATION_STOPS[stopIndex].progress
  controller.velocity = 0
  controller.activeStopIndex = stopIndex
  controller.holdStopIndex = stopIndex
  controller.holdCharge = 0
  controller.holdDirection = 0
  controller.holdStartTime = performance.now()
  controller.releasedStopIndex = null
}

function clearHold(controller) {
  controller.holdStopIndex = null
  controller.holdCharge = 0
  controller.holdDirection = 0
}

// Returns true while the stop keeps the visitor, who feels a slight push.
function chargeHeldStop(controller, direction, amount, nudge = true) {
  if (controller.holdStopIndex === null) {
    return false
  }

  if (
    performance.now() - controller.holdStartTime <
    HOLD_SETTLE_MILLISECONDS
  ) {
    return true
  }

  if (direction !== controller.holdDirection) {
    controller.holdDirection = direction
    controller.holdCharge = 0
  }

  controller.holdCharge += amount

  if (controller.holdCharge < HOLD_RELEASE_CHARGE) {
    if (nudge) {
      controller.velocity += direction * HOLD_NUDGE
    }

    return true
  }

  controller.releasedStopIndex = controller.holdStopIndex
  controller.releasedDirection = direction
  clearHold(controller)
  controller.activeStopIndex = null
  controller.velocity = 0
  controller.progress = clampProgress(
    controller.progress + direction * RELEASE_DISTANCE,
  )
  return false
}

function findHoldStopAhead(controller, direction) {
  let found = null
  let foundDistance = Infinity

  EVALUATION_STOPS.forEach((stop, index) => {
    const distance = (stop.progress - controller.progress) * direction

    // Coming back to a book just left stops on it again.
    const leavingThisStop =
      index === controller.releasedStopIndex &&
      direction === controller.releasedDirection

    if (
      stop.hold &&
      !leavingThisStop &&
      distance >= -HOLD_CAPTURE_DISTANCE &&
      distance <= HOLD_BRAKE_DISTANCE &&
      distance < foundDistance
    ) {
      found = index
      foundDistance = distance
    }
  })

  return found
}

function updateHeldStop(controller, delta) {
  if (controller.keyboardDirection !== 0) {
    chargeHeldStop(
      controller,
      controller.keyboardDirection,
      HOLD_KEY_CHARGE_PER_SECOND * delta,
      false,
    )
  }

  if (controller.holdStopIndex === null) {
    return
  }

  const stopProgress = EVALUATION_STOPS[controller.holdStopIndex].progress

  controller.velocity +=
    (stopProgress - controller.progress) * HOLD_SPRING * delta
  controller.velocity *= Math.exp(-HOLD_DAMPING * delta)
  controller.progress = clampProgress(
    controller.progress + controller.velocity * delta,
  )
  controller.activeStopIndex = controller.holdStopIndex
}

function releaseStop(controller, direction) {
  if (controller.activeStopIndex !== null) {
    controller.progress = clampProgress(
      controller.progress + direction * RELEASE_DISTANCE,
    )
    controller.releasedStopIndex = controller.activeStopIndex
    controller.activeStopIndex = null
    return
  }

  const nearestStopIndex = getNearestStopIndex(controller.progress)
  const distanceAhead =
    (EVALUATION_STOPS[nearestStopIndex].progress - controller.progress) *
    direction

  // Already at the stop or past it: the visitor is leaving, even if the spring
  // had not finished settling them. A held stop only lets go once charged.
  if (
    !EVALUATION_STOPS[nearestStopIndex].hold &&
    distanceAhead < STOP_REACHED_DISTANCE &&
    distanceAhead > -STOP_RADIUS
  ) {
    controller.releasedStopIndex = nearestStopIndex
  }
}

function normalizeWheelDelta(deltaY, deltaMode) {
  const modeMultiplier = deltaMode === 1 ? 16 : deltaMode === 2 ? 800 : 1
  return clamp(deltaY * modeMultiplier, -48, 48)
}

export function createMovementState() {
  return {
    progress: INITIAL_PROGRESS,
    velocity: 0,
    keyboardDirection: 0,
    activeStopIndex: null,
    releasedStopIndex: null,
    releasedDirection: 0,
    holdStopIndex: null,
    holdCharge: 0,
    holdDirection: 0,
    holdStartTime: 0,
    reducedMotion: false,
    lastReducedWheelTime: -Infinity,
    lastInputTime: -Infinity,
    transition: null,
    travelLocked: false,
    lockedProgress: null,
  }
}

export function resetMovementToStart(controller) {
  controller.progress = INITIAL_PROGRESS
  controller.velocity = 0
  controller.keyboardDirection = 0
  controller.activeStopIndex = null
  controller.releasedStopIndex = null
  clearHold(controller)
  controller.lastReducedWheelTime = -Infinity
  controller.lastInputTime = -Infinity
  controller.transition = null
  controller.lockedProgress = controller.travelLocked
    ? INITIAL_PROGRESS
    : null
}

export function setReducedMotion(controller, enabled) {
  controller.reducedMotion = enabled
  controller.velocity = 0
  controller.keyboardDirection = 0
  clearHold(controller)
  controller.lastReducedWheelTime = -Infinity
  controller.transition = null

  if (enabled && !controller.travelLocked) {
    startReducedTransition(
      controller,
      getNearestStopIndex(controller.progress),
    )
  }
}

export function setTravelLocked(controller, locked) {
  if (locked === controller.travelLocked) {
    return
  }

  if (locked) {
    controller.travelLocked = true
    controller.lockedProgress = controller.progress
    controller.velocity = 0
    controller.keyboardDirection = 0
    controller.transition = null
    return
  }

  if (controller.lockedProgress !== null) {
    controller.progress = controller.lockedProgress
  }

  controller.travelLocked = false
  controller.lockedProgress = null
  controller.velocity = 0
  controller.keyboardDirection = 0
}

export function applyWheelInput(controller, deltaY, deltaMode) {
  if (controller.travelLocked) {
    return false
  }

  const delta = normalizeWheelDelta(deltaY, deltaMode)

  if (Math.abs(delta) < 0.1) {
    return false
  }

  const direction = Math.sign(delta)
  const now = performance.now()

  if (controller.reducedMotion) {
    const startsNewGesture =
      now - controller.lastReducedWheelTime >= REDUCED_GESTURE_GAP
    controller.lastReducedWheelTime = now

    if (startsNewGesture) {
      stepReducedMotion(controller, direction)
    }

    return true
  }

  if (chargeHeldStop(controller, direction, Math.abs(delta))) {
    return true
  }

  releaseStop(controller, direction)
  controller.transition = null
  controller.lastInputTime = now
  controller.velocity = clamp(
    controller.velocity + delta * WHEEL_IMPULSE,
    -MAX_VELOCITY,
    MAX_VELOCITY,
  )

  return true
}

export function applyDirectionalInput(controller, direction) {
  if (controller.travelLocked) {
    return
  }

  if (controller.reducedMotion) {
    stepReducedMotion(controller, direction)
    return
  }

  if (chargeHeldStop(controller, direction, HOLD_DIRECTIONAL_CHARGE)) {
    return
  }

  releaseStop(controller, direction)
  controller.lastInputTime = performance.now()
  controller.velocity = clamp(
    controller.velocity + direction * KEYBOARD_IMPULSE,
    -MAX_VELOCITY,
    MAX_VELOCITY,
  )
}

export function setKeyboardDirection(controller, direction) {
  if (controller.travelLocked) {
    controller.keyboardDirection = 0
    return
  }

  controller.keyboardDirection = direction

  if (
    direction !== 0 &&
    !controller.reducedMotion &&
    controller.holdStopIndex === null
  ) {
    releaseStop(controller, direction)
    controller.lastInputTime = performance.now()
  }
}

export function updateMovement(controller, frameDelta) {
  if (controller.travelLocked) {
    controller.progress = controller.lockedProgress
    controller.velocity = 0
    controller.keyboardDirection = 0
    return
  }

  const delta = Math.min(frameDelta, MAXIMUM_FRAME_DELTA)

  if (controller.reducedMotion) {
    if (!controller.transition) {
      return
    }

    controller.transition.elapsed += delta
    const transitionProgress = Math.min(
      1,
      controller.transition.elapsed / controller.transition.duration,
    )
    const easedProgress = easeInOutCubic(transitionProgress)

    controller.progress =
      controller.transition.from +
      (controller.transition.to - controller.transition.from) * easedProgress

    if (transitionProgress >= 1) {
      controller.progress = controller.transition.to
      controller.activeStopIndex = controller.transition.targetStopIndex
      controller.transition = null
    }

    return
  }

  if (controller.holdStopIndex !== null) {
    updateHeldStop(controller, delta)
    return
  }

  if (controller.keyboardDirection !== 0) {
    controller.velocity = clamp(
      controller.velocity +
        controller.keyboardDirection * KEYBOARD_ACCELERATION * delta,
      -MAX_VELOCITY,
      MAX_VELOCITY,
    )
  } else {
    controller.velocity *= Math.exp(-DECELERATION * delta)
  }

  if (
    controller.releasedStopIndex !== null &&
    Math.abs(
      EVALUATION_STOPS[controller.releasedStopIndex].progress -
        controller.progress,
    ) > STOP_RADIUS
  ) {
    controller.releasedStopIndex = null
  }

  const travelDirection = Math.sign(controller.velocity)
  const holdStopAhead =
    travelDirection === 0
      ? null
      : findHoldStopAhead(controller, travelDirection)
  const speedFactor = getRouteSpeedFactor(controller.progress)

  // However fast the visitor scrolls, the camera brakes and stops at each one.
  if (holdStopAhead !== null) {
    const distance = Math.abs(
      EVALUATION_STOPS[holdStopAhead].progress - controller.progress,
    )
    const maximumSpeed =
      Math.max(HOLD_MINIMUM_APPROACH, distance * HOLD_BRAKE_RATE) /
      speedFactor

    controller.velocity = clamp(
      controller.velocity,
      -maximumSpeed,
      maximumSpeed,
    )

    if (
      distance <= HOLD_CAPTURE_DISTANCE ||
      distance <= Math.abs(controller.velocity) * speedFactor * delta
    ) {
      enterHold(controller, holdStopAhead)
      return
    }
  }

  controller.progress = clampProgress(
    controller.progress + controller.velocity * speedFactor * delta,
  )

  if (
    (controller.progress === 0 && controller.velocity < 0) ||
    (controller.progress === 1 && controller.velocity > 0)
  ) {
    controller.velocity = 0
  }

  const inputIsActive =
    controller.keyboardDirection !== 0 ||
    performance.now() - controller.lastInputTime < 90

  if (
    inputIsActive ||
    Math.abs(controller.velocity) > STOP_APPROACH_VELOCITY
  ) {
    controller.activeStopIndex = null
    return
  }

  const nearestStopIndex = getNearestStopIndex(controller.progress)
  const nearestStop = EVALUATION_STOPS[nearestStopIndex]
  const stopDistance = nearestStop.progress - controller.progress

  if (
    Math.abs(stopDistance) > STOP_RADIUS ||
    nearestStopIndex !== controller.releasedStopIndex
  ) {
    controller.releasedStopIndex = null
  }

  // A stop welcomes the visitor arriving, but never holds back one leaving it.
  if (
    Math.abs(stopDistance) > STOP_RADIUS ||
    nearestStopIndex === controller.releasedStopIndex
  ) {
    controller.activeStopIndex = null
    return
  }

  // Compensated so a stop settles just as fast where the route slows down.
  controller.velocity +=
    (stopDistance * STOP_SPRING * delta) /
    getRouteSpeedFactor(controller.progress)
  controller.velocity *= Math.exp(-STOP_DAMPING * delta)

  if (
    Math.abs(stopDistance) < STOP_SNAP_DISTANCE &&
    Math.abs(controller.velocity) < STOP_SNAP_VELOCITY
  ) {
    controller.progress = nearestStop.progress
    controller.velocity = 0
    controller.activeStopIndex = nearestStopIndex

    if (nearestStop.hold) {
      enterHold(controller, nearestStopIndex)
    }
  }
}
