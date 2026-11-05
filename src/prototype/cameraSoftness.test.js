import assert from 'node:assert/strict'
import test from 'node:test'
import { Matrix4, Quaternion, Vector3 } from 'three'
import {
  PATH_LENGTH,
  PROJECT_GALLERY_PROGRESS_RANGE,
  applyCameraFocusTarget,
  createCameraOrientation,
  getCameraLookAheadDistance,
  getCameraPointAt,
  stepCameraOrientation,
} from './cameraPath.js'
import {
  applyWheelInput,
  createMovementState,
  setKeyboardDirection,
  updateMovement,
} from './movementController.js'

const FRAME_DELTA = 1 / 60
const WORLD_UP = new Vector3(0, 1, 0)
// A head turning briskly: the visit must never feel faster than this.
const MAXIMUM_DEGREES_PER_SECOND = 200

function getTargetQuaternion(progress) {
  const position = getCameraPointAt(progress)
  const tangent = getCameraPointAt(
    Math.min(
      1,
      progress + getCameraLookAheadDistance(progress) / PATH_LENGTH,
    ),
  ).sub(position)

  tangent.y = 0
  tangent.normalize()

  const lookTarget = position.clone().addScaledVector(tangent, 6)
  lookTarget.y = position.y
  applyCameraFocusTarget(progress, position, lookTarget)

  return new Quaternion().setFromRotationMatrix(
    new Matrix4().lookAt(position, lookTarget, WORLD_UP),
  )
}

function measurePeakRotation(t, startProgress, endProgress, applyInput) {
  let now = 0
  t.mock.method(performance, 'now', () => now)

  const controller = createMovementState()
  controller.progress = startProgress

  const orientation = createCameraOrientation(
    getTargetQuaternion(startProgress),
  )
  let previous = orientation.quaternion.clone()
  let peak = 0

  for (
    let frame = 0;
    controller.progress < endProgress && frame < 60 * 120;
    frame += 1
  ) {
    now += FRAME_DELTA * 1000
    applyInput(controller, frame)
    updateMovement(controller, FRAME_DELTA)
    stepCameraOrientation(
      orientation,
      getTargetQuaternion(controller.progress),
      controller.progress,
      FRAME_DELTA,
    )
    peak = Math.max(
      peak,
      (previous.angleTo(orientation.quaternion) * 180) /
        Math.PI /
        FRAME_DELTA,
    )
    previous = orientation.quaternion.clone()
  }

  assert.ok(controller.progress >= endProgress)
  return peak
}

const GALLERY_START = PROJECT_GALLERY_PROGRESS_RANGE.start - 0.02
// Past the audio room and its bookcase.
const GALLERY_END = 0.87

for (const [label, notchEvery] of [
  ['a very gentle wheel', 60],
  ['a gentle wheel', 30],
  ['a relaxed wheel', 20],
  ['a normal wheel', 12],
  ['a fast wheel', 6],
]) {
  test(`the camera never turns abruptly in the gallery with ${label}`, (t) => {
    const peak = measurePeakRotation(
      t,
      GALLERY_START,
      GALLERY_END,
      (controller, frame) => {
        if (frame % notchEvery === 0) {
          applyWheelInput(controller, 100, 0)
        }
      },
    )

    assert.ok(
      peak <= MAXIMUM_DEGREES_PER_SECOND,
      `peak rotation of ${Math.round(peak)} degrees per second`,
    )
  })
}

test('the camera never turns abruptly with the arrow key held down', (t) => {
  const peak = measurePeakRotation(
    t,
    GALLERY_START,
    GALLERY_END,
    (controller, frame) => {
      if (frame === 0) {
        setKeyboardDirection(controller, 1)
      }
    },
  )

  assert.ok(
    peak <= MAXIMUM_DEGREES_PER_SECOND,
    `peak rotation of ${Math.round(peak)} degrees per second`,
  )
})

for (const notchEvery of [12, 6]) {
  test(`the whole route stays gentle with a notch every ${notchEvery} frames`, (t) => {
    const peak = measurePeakRotation(
      t,
      0.02,
      0.995,
      (controller, frame) => {
        if (frame % notchEvery === 0) {
          applyWheelInput(controller, 100, 0)
        }
      },
    )

    assert.ok(
      peak <= MAXIMUM_DEGREES_PER_SECOND,
      `peak rotation of ${Math.round(peak)} degrees per second`,
    )
  })
}
