import assert from 'node:assert/strict'
import test from 'node:test'
import { Vector3 } from 'three'
import {
  CAMERA_HEIGHT,
  CAMERA_LOOK_AHEAD_DISTANCE,
  EVALUATION_STOPS,
  PATH_LENGTH,
  UPPER_LEVEL,
  getCameraPointAt,
} from './cameraPath.js'

const SAMPLE_COUNT = 20000
const GATE_CENTER_TOLERANCE = 0.22

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

test('entrance turn orientation looks through both connected portals', () => {
  const progress = 0.13
  const position = getCameraPointAt(progress)
  const lookAheadPoint = getCameraPointAt(
    Math.min(
      1,
      progress + CAMERA_LOOK_AHEAD_DISTANCE / PATH_LENGTH,
    ),
  )
  const direction = lookAheadPoint
    .sub(position)
    .setY(0)
    .normalize()
  const entrancePortalX =
    position.x + direction.x * ((13 - position.z) / direction.z)
  const sidePortalZ =
    position.z + direction.z * ((-15 - position.x) / direction.x)
  const endWallX =
    position.x + direction.x * ((9.5 - position.z) / direction.z)

  assert.ok(entrancePortalX >= -19.5 && entrancePortalX <= -16.5)
  assert.ok(sidePortalZ >= 10.4 && sidePortalZ <= 13.6)
  assert.ok(endWallX > -15)
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
