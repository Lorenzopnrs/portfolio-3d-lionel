import {
  PATH_LENGTH,
  getCameraPointAt,
  cameraPath,
} from '../prototype/cameraPath.js'

const SIGN_AHEAD_OF_STOP = 1.55
const SIGHT_STEP = 0.002
const OPEN_CORRIDOR_HALF_WIDTH = 0.9
const MAXIMUM_SIGHT_DISTANCE = 12

function distanceToSegment(point, start, end) {
  const segment = end.clone().sub(start)
  const position = Math.min(
    1,
    Math.max(
      0,
      point.clone().sub(start).dot(segment) / segment.lengthSq(),
    ),
  )

  return point.distanceTo(start.clone().addScaledVector(segment, position))
}

function hasClearCorridor(cameraProgress, stopProgress, signPosition) {
  const cameraPoint = getCameraPointAt(cameraProgress)

  for (
    let progress = cameraProgress + SIGHT_STEP;
    progress < stopProgress;
    progress += SIGHT_STEP
  ) {
    if (
      distanceToSegment(
        getCameraPointAt(progress),
        cameraPoint,
        signPosition,
      ) > OPEN_CORRIDOR_HALF_WIDTH
    ) {
      return false
    }
  }

  return true
}

// The camera always stays in open space, so a sign is in plain sight for as
// long as the path keeps to the straight line between the camera and the sign.
// This replaces a ray cast through the whole scene on every frame.
export function getSignSightRange(stopProgress) {
  const signPosition = getCameraPointAt(stopProgress).addScaledVector(
    cameraPath.getTangentAt(stopProgress),
    SIGN_AHEAD_OF_STOP,
  )
  let start = stopProgress

  for (
    let progress = stopProgress - SIGHT_STEP;
    progress > 0;
    progress -= SIGHT_STEP
  ) {
    if (
      getCameraPointAt(progress).distanceTo(signPosition) >
        MAXIMUM_SIGHT_DISTANCE ||
      !hasClearCorridor(progress, stopProgress, signPosition)
    ) {
      break
    }

    start = progress
  }

  return {
    end: stopProgress + SIGN_AHEAD_OF_STOP / PATH_LENGTH,
    start,
  }
}
