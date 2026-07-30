import {
  applyDirectionalInput,
  applyWheelInput,
  setKeyboardDirection,
} from './movementController.js'

const FORWARD_KEYS = new Set(['ArrowDown', 'PageDown'])
const BACKWARD_KEYS = new Set(['ArrowUp', 'PageUp'])

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
    setKeyboardDirection(movementRef.current, 0)
  }

  eventTarget.addEventListener('wheel', handleWheel, { passive: false })
  eventTarget.addEventListener('keydown', handleKeyDown)
  eventTarget.addEventListener('keyup', handleKeyUp)
  eventTarget.addEventListener('blur', handleBlur)

  return () => {
    eventTarget.removeEventListener('wheel', handleWheel)
    eventTarget.removeEventListener('keydown', handleKeyDown)
    eventTarget.removeEventListener('keyup', handleKeyUp)
    eventTarget.removeEventListener('blur', handleBlur)
  }
}
