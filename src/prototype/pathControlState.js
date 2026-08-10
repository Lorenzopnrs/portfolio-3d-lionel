import {
  applyDirectionalInput,
  applyWheelInput,
  setKeyboardDirection,
} from './movementController.js'

const FORWARD_KEYS = new Set(['ArrowUp', 'PageDown'])
const BACKWARD_KEYS = new Set(['ArrowDown', 'PageUp'])
const INTERACTIVE_TOUCH_SELECTOR = [
  '[data-travel-lock]',
  'a',
  'audio',
  'button',
  'iframe',
  'input',
  'select',
  'textarea',
  'video',
  '[contenteditable="true"]',
  '[role="button"]',
  '[role="dialog"]',
].join(',')
const SWIPE_DISTANCE_THRESHOLD = 56
const SWIPE_VELOCITY_THRESHOLD = 0.24
const SWIPE_VERTICAL_DOMINANCE = 1.2

function getKeyDirection(key) {
  if (FORWARD_KEYS.has(key)) {
    return 1
  }

  if (BACKWARD_KEYS.has(key)) {
    return -1
  }

  return 0
}

export function installPathControls(eventTarget, movementRef) {
  const pressedKeys = new Set()
  let touchGesture = null

  const getPressedDirection = () => {
    const forwardPressed = [...FORWARD_KEYS].some((key) =>
      pressedKeys.has(key),
    )
    const backwardPressed = [...BACKWARD_KEYS].some((key) =>
      pressedKeys.has(key),
    )

    if (forwardPressed === backwardPressed) {
      return 0
    }

    return forwardPressed ? 1 : -1
  }

  const handleWheel = (event) => {
    if (event.ctrlKey || movementRef.current.travelLocked) {
      return
    }

    const inputHandled = applyWheelInput(
      movementRef.current,
      event.deltaY,
      event.deltaMode,
    )

    if (inputHandled) {
      event.preventDefault()
    }
  }

  const handleKeyDown = (event) => {
    if (movementRef.current.travelLocked) {
      return
    }

    const direction = getKeyDirection(event.key)

    if (direction === 0) {
      return
    }

    event.preventDefault()
    const keyWasAlreadyPressed = pressedKeys.has(event.key)
    pressedKeys.add(event.key)
    const pressedDirection = getPressedDirection()

    if (!keyWasAlreadyPressed) {
      if (movementRef.current.reducedMotion) {
        applyDirectionalInput(movementRef.current, direction)
      } else if (pressedDirection !== 0) {
        applyDirectionalInput(movementRef.current, pressedDirection)
      }
    }

    setKeyboardDirection(movementRef.current, pressedDirection)
  }

  const handleKeyUp = (event) => {
    const direction = getKeyDirection(event.key)

    if (direction === 0) {
      return
    }

    pressedKeys.delete(event.key)

    if (movementRef.current.travelLocked) {
      return
    }

    event.preventDefault()
    setKeyboardDirection(movementRef.current, getPressedDirection())
  }

  const handleBlur = () => {
    pressedKeys.clear()
    touchGesture = null
    setKeyboardDirection(movementRef.current, 0)
  }

  const handleTouchStart = (event) => {
    const touch = event.touches?.[0]
    const interactiveOrigin = event.target?.closest?.(
      INTERACTIVE_TOUCH_SELECTOR,
    )

    if (
      movementRef.current.travelLocked ||
      event.touches?.length !== 1 ||
      !touch ||
      interactiveOrigin
    ) {
      touchGesture = null
      return
    }

    touchGesture = {
      clientX: touch.clientX,
      clientY: touch.clientY,
      timeStamp: event.timeStamp,
    }
  }

  const handleTouchEnd = (event) => {
    const gesture = touchGesture
    const touch = event.changedTouches?.[0]
    touchGesture = null

    if (!gesture || !touch || movementRef.current.travelLocked) {
      return
    }

    const distanceX = touch.clientX - gesture.clientX
    const distanceY = touch.clientY - gesture.clientY
    const duration = Math.max(1, event.timeStamp - gesture.timeStamp)
    const velocity = Math.abs(distanceY) / duration
    const isIntentionalVerticalSwipe =
      Math.abs(distanceY) >= SWIPE_DISTANCE_THRESHOLD &&
      Math.abs(distanceY) >=
        Math.abs(distanceX) * SWIPE_VERTICAL_DOMINANCE &&
      velocity >= SWIPE_VELOCITY_THRESHOLD

    if (!isIntentionalVerticalSwipe) {
      return
    }

    event.preventDefault()
    applyDirectionalInput(movementRef.current, Math.sign(distanceY))
  }

  const handleTouchCancel = () => {
    touchGesture = null
  }

  eventTarget.addEventListener('wheel', handleWheel, { passive: false })
  eventTarget.addEventListener('keydown', handleKeyDown)
  eventTarget.addEventListener('keyup', handleKeyUp)
  eventTarget.addEventListener('blur', handleBlur)
  eventTarget.addEventListener('touchstart', handleTouchStart, {
    passive: true,
  })
  eventTarget.addEventListener('touchend', handleTouchEnd, {
    passive: false,
  })
  eventTarget.addEventListener('touchcancel', handleTouchCancel)

  return () => {
    eventTarget.removeEventListener('wheel', handleWheel)
    eventTarget.removeEventListener('keydown', handleKeyDown)
    eventTarget.removeEventListener('keyup', handleKeyUp)
    eventTarget.removeEventListener('blur', handleBlur)
    eventTarget.removeEventListener('touchstart', handleTouchStart)
    eventTarget.removeEventListener('touchend', handleTouchEnd)
    eventTarget.removeEventListener('touchcancel', handleTouchCancel)
  }
}
