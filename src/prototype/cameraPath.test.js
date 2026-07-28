import assert from 'node:assert/strict'
import test from 'node:test'
import { Matrix4, Quaternion, Vector3 } from 'three'
import * as cameraPathModule from './cameraPath.js'
import {
  CAMERA_HEIGHT,
  CAMERA_LOOK_AHEAD_DISTANCE,
  EVALUATION_STOPS,
  PATH_LENGTH,
  UPPER_LEVEL,
  getCameraLookAheadDistance,
  getCameraPointAt,
} from './cameraPath.js'

const SAMPLE_COUNT = 20000
const GATE_CENTER_TOLERANCE = 0.22
const TURN_CLEARANCE_SAMPLE_COUNT = 800
const TURN_MINIMUM_CLEARANCE = 0.4
const PATH_CAMERA_LOOK_DISTANCE = 6
const PATH_CAMERA_RESPONSE = 12
const STRONG_IMPULSE_PROGRESS_STEP =
  (0.32 * 57.466) / PATH_LENGTH / 30
const WORLD_UP = new Vector3(0, 1, 0)
const CAMERA_FORWARD = new Vector3(0, 0, -1)
const entranceTurnInsideSupport = {
  maximumX: -15.21,
  maximumZ: 12.86,
  minimumX: -16.09,
  minimumZ: 12.04,
}

const supportedFloorAreas = [
  [-20.81, -15.19, 20, 30],
  [-20.56, -15.44, 13, 20],
  [-21, -15, 9.5, 14],
  [-15, -7.5, 6.88, 17.12],
  [-7.5, -5.5, 9.28, 14.72],
  [-5.5, 5.5, 8, 15],
  [5.5, 7, 8.78, 14.22],
  [7, 16, 7, 16],
  [8, 13, 5, 8],
  [7.8, 11.2, -6, 6],
  [7, 12, -9, -6],
  [-6.5, 11, -17.12, -7.88],
  [-10, -5.5, -13, -8],
  [-12.12, -5.88, -9, -1],
  [-12.12, -5.88, -1, 7],
  [-11.5, -9, 6, 8],
  [-22.5, -11.5, 4.5, 9.5],
]

const doorwayCenters = [
  { label: 'vestibule portal', point: [-18, CAMERA_HEIGHT, 20] },
  { label: 'provenance portal', point: [-18, CAMERA_HEIGHT, 13] },
  { label: 'entrance corner portal', point: [-15, CAMERA_HEIGHT, 12] },
  { label: 'first project east portal', point: [-7.5, CAMERA_HEIGHT, 12] },
  { label: 'catalogue west arch', point: [-5.5, CAMERA_HEIGHT, 12] },
  { label: 'catalogue east arch', point: [5.5, CAMERA_HEIGHT, 11.5] },
  { label: 'second project west portal', point: [7, CAMERA_HEIGHT, 11.5] },
  { label: 'second project north portal', point: [11.5, CAMERA_HEIGHT, 7] },
  {
    label: 'upper stair portal',
    point: [9.5, CAMERA_HEIGHT + UPPER_LEVEL, -8.5],
  },
  {
    label: 'manifesto west portal',
    point: [-6.5, CAMERA_HEIGHT + UPPER_LEVEL, -12.5],
  },
  {
    label: 'personal north portal',
    point: [-9, CAMERA_HEIGHT + UPPER_LEVEL, -9],
  },
  {
    label: 'personal south portal',
    point: [-9, CAMERA_HEIGHT + UPPER_LEVEL, -1],
  },
  {
    label: 'final gallery west portal',
    point: [-11.5, CAMERA_HEIGHT + UPPER_LEVEL, 7],
  },
  {
    label: 'unfinished threshold arch',
    point: [-15.4, CAMERA_HEIGHT + UPPER_LEVEL, 7],
  },
]

function samplePath() {
  return Array.from({ length: SAMPLE_COUNT + 1 }, (_, index) => ({
    point: getCameraPointAt(index / SAMPLE_COUNT),
    progress: index / SAMPLE_COUNT,
  }))
}

function findClosestSample(samples, target) {
  return samples.reduce(
    (closest, sample) => {
      const distance = sample.point.distanceTo(target)

      return distance < closest.distance
        ? { ...sample, distance }
        : closest
    },
    { distance: Infinity, point: null, progress: 0 },
  )
}

function isSupported(point) {
  return supportedFloorAreas.some(
    ([minimumX, maximumX, minimumZ, maximumZ]) =>
      point.x >= minimumX - 0.02 &&
      point.x <= maximumX + 0.02 &&
      point.z >= minimumZ - 0.02 &&
      point.z <= maximumZ + 0.02,
  )
}

function distanceToRectangle(
  point,
  minimumX,
  maximumX,
  minimumZ,
  maximumZ,
) {
  const xDistance = Math.max(minimumX - point.x, 0, point.x - maximumX)
  const zDistance = Math.max(minimumZ - point.z, 0, point.z - maximumZ)

  return Math.hypot(xDistance, zDistance)
}

function segmentIntersectsRectangle(
  start,
  end,
  {
    minimumX,
    maximumX,
    minimumZ,
    maximumZ,
  },
) {
  let minimumTime = 0
  let maximumTime = 1

  for (const [axis, minimum, maximum] of [
    ['x', minimumX, maximumX],
    ['z', minimumZ, maximumZ],
  ]) {
    const delta = end[axis] - start[axis]

    if (Math.abs(delta) < 0.000001) {
      if (start[axis] < minimum || start[axis] > maximum) {
        return false
      }

      continue
    }

    let entryTime = (minimum - start[axis]) / delta
    let exitTime = (maximum - start[axis]) / delta

    if (entryTime > exitTime) {
      const previousEntryTime = entryTime
      entryTime = exitTime
      exitTime = previousEntryTime
    }

    minimumTime = Math.max(minimumTime, entryTime)
    maximumTime = Math.min(maximumTime, exitTime)

    if (minimumTime > maximumTime) {
      return false
    }
  }

  return true
}

function getTargetCameraQuaternion(progress) {
  const position = getCameraPointAt(progress)
  const lookAheadProgress = Math.min(
    1,
    progress + getCameraLookAheadDistance(progress) / PATH_LENGTH,
  )
  const direction = getCameraPointAt(lookAheadProgress)
    .sub(position)
    .setY(0)
    .normalize()
  const lookTarget = position
    .clone()
    .addScaledVector(direction, PATH_CAMERA_LOOK_DISTANCE)
  const lookMatrix = new Matrix4().lookAt(
    position,
    lookTarget,
    WORLD_UP,
  )

  return new Quaternion().setFromRotationMatrix(lookMatrix)
}

function findBlockedSmoothedOrientation(direction) {
  const startProgress = direction > 0 ? 0.115 : 0.2
  const endProgress = direction > 0 ? 0.2 : 0.115
  const cameraQuaternion = getTargetCameraQuaternion(startProgress)

  for (
    let progress = startProgress;
    direction > 0
      ? progress <= endProgress
      : progress >= endProgress;
    progress += direction * STRONG_IMPULSE_PROGRESS_STEP
  ) {
    const orientationResponse =
      cameraPathModule.getCameraOrientationResponse?.(progress) ??
      PATH_CAMERA_RESPONSE
    const slerpAlpha =
      1 - Math.exp(-orientationResponse * (1 / 30))
    cameraQuaternion.slerp(
      getTargetCameraQuaternion(progress),
      slerpAlpha,
    )

    const position = getCameraPointAt(progress)
    const directionVector = CAMERA_FORWARD.clone()
      .applyQuaternion(cameraQuaternion)
      .setY(0)
      .normalize()
    const lookTarget = position
      .clone()
      .addScaledVector(directionVector, PATH_CAMERA_LOOK_DISTANCE)

    if (
      segmentIntersectsRectangle(
        position,
        lookTarget,
        entranceTurnInsideSupport,
      )
    ) {
      return progress
    }
  }

  return null
}

test('camera path crosses the center of every architectural opening', () => {
  const samples = samplePath()

  for (const doorway of doorwayCenters) {
    const target = new Vector3(...doorway.point)
    const closest = findClosestSample(samples, target)

    assert.ok(
      closest.distance <= GATE_CENTER_TOLERANCE,
      `${doorway.label} misses center by ${closest.distance.toFixed(3)}m`,
    )
  }
})

test('ground-level catalogue route clears the south cloister arcade', () => {
  const samples = samplePath()
  const catalogueSamples = samples.filter(
    ({ point }) =>
      point.y < CAMERA_HEIGHT + 0.05 &&
      point.x >= -5.8 &&
      point.x <= 5.8,
  )
  const nearestArcadeSample = catalogueSamples.reduce((nearest, sample) =>
    sample.point.z < nearest.point.z ? sample : nearest,
  )

  assert.ok(
    nearestArcadeSample.point.z >= 9.1,
    `catalogue route leaves only ${(nearestArcadeSample.point.z - 8.61).toFixed(3)}m beyond the arcade`,
  )
})

test('route stays over supported architecture in both directions', () => {
  const samples = samplePath()

  for (const [direction, directionalSamples] of [
    ['forward', samples],
    ['backward', samples.toReversed()],
  ]) {
    const unsupportedSample = directionalSamples.find(
      ({ point }) => !isSupported(point),
    )

    assert.equal(
      unsupportedSample,
      undefined,
      `${direction} route leaves the architecture at progress ${unsupportedSample?.progress.toFixed(4)}`,
    )
  }
})

test('turn into the stair keeps camera clearance from the side wall', () => {
  const samples = samplePath()
  const nearestWallSample = samples.reduce((nearest, sample) => {
    const distance = distanceToRectangle(
      sample.point,
      11.34,
      12.06,
      -6.5,
      6.5,
    )

    return distance < nearest.distance
      ? { ...sample, distance }
      : nearest
  }, { distance: Infinity })

  assert.ok(
    nearestWallSample.distance >= 0.4,
    `stair turn leaves only ${nearestWallSample.distance.toFixed(3)}m from the side wall`,
  )
})

test('catalogue stop orientation does not aim into a cloister pier', () => {
  const catalogueStop = EVALUATION_STOPS.find(
    (stop) => stop.id === 'catalogue',
  )
  const position = getCameraPointAt(catalogueStop.progress)
  const lookAheadPoint = getCameraPointAt(
    Math.min(
      1,
      catalogueStop.progress +
        CAMERA_LOOK_AHEAD_DISTANCE / PATH_LENGTH,
    ),
  )
  const direction = lookAheadPoint
    .sub(position)
    .setY(0)
    .normalize()
  const pierIntervals = [
    [-5.955, -5.575],
    [-3.425, -3.045],
    [-2.955, -2.575],
    [-0.425, -0.045],
    [0.045, 0.425],
    [2.575, 2.955],
    [3.045, 3.425],
    [5.575, 5.955],
  ]
  const aimsIntoPier = Array.from({ length: 121 }, (_, index) =>
    position.clone().addScaledVector(direction, index * 0.05),
  ).some(
    (point) =>
      point.z >= 7.89 &&
      point.z <= 8.61 &&
      pierIntervals.some(
        ([minimumX, maximumX]) =>
          point.x >= minimumX && point.x <= maximumX,
      ),
  )

  assert.equal(aimsIntoPier, false)
})

test('entrance turn orientation follows the connected portals', () => {
  const entranceProgress = 0.135
  const entrancePosition = getCameraPointAt(entranceProgress)
  const entranceLookAheadPoint = getCameraPointAt(
    Math.min(
      1,
      entranceProgress +
        getCameraLookAheadDistance(entranceProgress) / PATH_LENGTH,
    ),
  )
  const entranceDirection = entranceLookAheadPoint
    .sub(entrancePosition)
    .setY(0)
    .normalize()
  const entrancePortalX =
    entrancePosition.x +
    entranceDirection.x *
      ((13 - entrancePosition.z) / entranceDirection.z)

  const turnProgress = 0.165
  const turnPosition = getCameraPointAt(turnProgress)
  const turnLookAheadPoint = getCameraPointAt(
    Math.min(
      1,
      turnProgress +
        getCameraLookAheadDistance(turnProgress) / PATH_LENGTH,
    ),
  )
  const turnDirection = turnLookAheadPoint
    .sub(turnPosition)
    .setY(0)
    .normalize()
  const sidePortalZ =
    turnPosition.z +
    turnDirection.z *
      ((-15 - turnPosition.x) / turnDirection.x)
  const turnViewEndpoint = turnPosition
    .clone()
    .addScaledVector(turnDirection, PATH_CAMERA_LOOK_DISTANCE)

  assert.ok(entrancePortalX >= -19.5 && entrancePortalX <= -16.5)
  assert.ok(sidePortalZ >= 10.4 && sidePortalZ <= 13.6)
  assert.ok(turnViewEndpoint.x > -15)
  assert.ok(turnViewEndpoint.z >= 9.5 && turnViewEndpoint.z <= 14.5)
})

test('entrance turn keeps camera clear of the inside support', () => {
  const turnSamples = Array.from(
    { length: TURN_CLEARANCE_SAMPLE_COUNT + 1 },
    (_, index) => {
      const progress = 0.135 + (index / TURN_CLEARANCE_SAMPLE_COUNT) * 0.05
      const point = getCameraPointAt(progress)
      const distance = distanceToRectangle(
        point,
        entranceTurnInsideSupport.minimumX,
        entranceTurnInsideSupport.maximumX,
        entranceTurnInsideSupport.minimumZ,
        entranceTurnInsideSupport.maximumZ,
      )

      return { distance, point, progress }
    },
  )
  const nearestSample = turnSamples.reduce((nearest, sample) =>
    sample.distance < nearest.distance ? sample : nearest,
  )

  assert.ok(
    nearestSample.distance >= TURN_MINIMUM_CLEARANCE,
    `entrance turn leaves only ${nearestSample.distance.toFixed(3)}m from the inside support at progress ${nearestSample.progress.toFixed(4)}`,
  )
})

test('entrance turn orientation does not look through the inside support', () => {
  const blockedSample = Array.from({ length: 81 }, (_, index) => {
    const progress = 0.135 + (index / 80) * 0.04
    const position = getCameraPointAt(progress)
    const lookAheadProgress = Math.min(
      1,
      progress + getCameraLookAheadDistance(progress) / PATH_LENGTH,
    )
    const lookAheadPoint = getCameraPointAt(lookAheadProgress)
    const direction = lookAheadPoint
      .sub(position)
      .setY(0)
      .normalize()
    const lookTarget = position
      .clone()
      .addScaledVector(direction, PATH_CAMERA_LOOK_DISTANCE)

    return {
      blocked: segmentIntersectsRectangle(
        position,
        lookTarget,
        entranceTurnInsideSupport,
      ),
      progress,
    }
  }).find(({ blocked }) => blocked)

  assert.equal(
    blockedSample,
    undefined,
    `entrance turn looks through the inside support at progress ${blockedSample?.progress.toFixed(4)}`,
  )
})

test('entrance turn smoothed orientation clears the support both ways', () => {
  for (const [label, direction] of [
    ['forward', 1],
    ['backward', -1],
  ]) {
    const blockedProgress = findBlockedSmoothedOrientation(direction)

    assert.equal(
      blockedProgress,
      null,
      `${label} strong-impulse orientation intersects the inside support at progress ${blockedProgress?.toFixed(4)}`,
    )
  }
})

test('first project stop remains beyond the provenance gallery', () => {
  const firstProjectStop = EVALUATION_STOPS.find(
    (stop) => stop.id === 'project-one',
  )
  const position = getCameraPointAt(firstProjectStop.progress)

  assert.ok(position.x >= -7.5 && position.x <= -5.5)
  assert.ok(Math.abs(position.z - 12) <= GATE_CENTER_TOLERANCE)
})

test('camera remains at human eye height and finishes inside the threshold', () => {
  const samples = samplePath()
  const minimumHeight = Math.min(...samples.map(({ point }) => point.y))
  const maximumHeight = Math.max(...samples.map(({ point }) => point.y))
  const endpoint = samples.at(-1).point

  assert.ok(minimumHeight >= CAMERA_HEIGHT)
  assert.ok(maximumHeight <= CAMERA_HEIGHT + UPPER_LEVEL)
  assert.ok(endpoint.x >= -17.7 && endpoint.x <= -16.8)
  assert.ok(endpoint.z >= 4.8 && endpoint.z <= 9.2)
})
