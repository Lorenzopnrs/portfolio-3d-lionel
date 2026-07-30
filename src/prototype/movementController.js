import {
  EVALUATION_STOPS,
  INITIAL_PROGRESS,
  PATH_LENGTH,
  clampProgress,
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

function releaseStop(controller, direction) {
  if (controller.activeStopIndex !== null) {
    controller.progress = clampProgress(
      controller.progress + direction * RELEASE_DISTANCE,
    )
    controller.activeStopIndex = null
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
    reducedMotion: false,
    lastReducedWheelTime: -Infinity,
    lastInputTime: -Infinity,
    transition: null,
    travelLocked: false,
    lockedProgress: null,
  }
}

export function setReducedMotion(controller, enabled) {
  controller.reducedMotion = enabled
  controller.velocity = 0
  controller.keyboardDirection = 0
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

  if (direction !== 0 && !controller.reducedMotion) {
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

  const delta = Math.min(frameDelta, 1 / 30)

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

  controller.progress = clampProgress(
    controller.progress + controller.velocity * delta,
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

  if (Math.abs(stopDistance) > STOP_RADIUS) {
    controller.activeStopIndex = null
    return
  }

  controller.velocity += stopDistance * STOP_SPRING * delta
  controller.velocity *= Math.exp(-STOP_DAMPING * delta)

  if (
    Math.abs(stopDistance) < STOP_SNAP_DISTANCE &&
    Math.abs(controller.velocity) < STOP_SNAP_VELOCITY
  ) {
    controller.progress = nearestStop.progress
    controller.velocity = 0
    controller.activeStopIndex = nearestStopIndex
  }
}
