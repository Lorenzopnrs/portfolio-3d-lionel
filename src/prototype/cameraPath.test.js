import assert from 'node:assert/strict'
import test from 'node:test'
import { Matrix4, Quaternion, Vector3 } from 'three'
import * as cameraPathModule from './cameraPath.js'
import {
  CAMERA_HEIGHT,
  EVALUATION_STOPS,
  PATH_LENGTH,
  applyCameraFocusTarget,
  getCameraLookAheadDistance,
  getCameraPointAt,
} from './cameraPath.js'

const SAMPLE_COUNT = 20000
const GATE_CENTER_TOLERANCE = 0.22
const TURN_CLEARANCE_SAMPLE_COUNT = 800
const TURN_MINIMUM_CLEARANCE = 0.4
const PATH_CAMERA_LOOK_DISTANCE = 6
const STRONG_IMPULSE_PROGRESS_STEP =
  (0.32 * 57.466) / PATH_LENGTH / 30
// Reversing at full speed may glance at a corner for an instant: a gentle camera
// needs time to turn, and the path keeps it clear of the walls anyway.
const BRISK_BACKWARD_PROGRESS_STEP = 2.5 / PATH_LENGTH / 30
const WORLD_UP = new Vector3(0, 1, 0)
const CAMERA_FORWARD = new Vector3(0, 0, -1)
const entranceTurnInsideSupport = {
  maximumX: -15.21,
  maximumZ: 12.86,
  minimumX: -16.09,
  minimumZ: 12.04,
}
const projectTurnInsideCorner = {
  minimumX: 1.95,
  maximumX: 2.8,
  minimumZ: 8.65,
  maximumZ: 9.35,
}
const socialTurnInsideCorner = {
  minimumX: 6.25,
  maximumX: 6.9,
  minimumZ: 5.55,
  maximumZ: 6.3,
}

const supportedFloorAreas = [
  [-20.81, -15.19, 20, 30],
  [-20.56, -15.44, 13, 20],
  [-21, -15, 9.5, 14],
  [-15, -7.5, 6.88, 17.12],
  [-7.5, 5.6, 8.7, 15.3],
  [1.5, 6.7, 2.2, 12.6],
  [6.35, 13.5, 1.45, 6.55],
]

const doorwayCenters = [
  { label: 'vestibule portal', point: [-18, CAMERA_HEIGHT, 20] },
  { label: 'provenance portal', point: [-18, CAMERA_HEIGHT, 13] },
  { label: 'entrance corner portal', point: [-15, CAMERA_HEIGHT, 12] },
  { label: 'project gallery threshold', point: [-7.5, CAMERA_HEIGHT, 12] },
  { label: 'project to social arch', point: [4.2, CAMERA_HEIGHT, 9] },
  { label: 'social to contact arch', point: [6.5, CAMERA_HEIGHT, 4] },
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
  applyCameraFocusTarget(progress, position, lookTarget)
  const lookMatrix = new Matrix4().lookAt(
    position,
    lookTarget,
    WORLD_UP,
  )

  return new Quaternion().setFromRotationMatrix(lookMatrix)
}

function findBlockedSmoothedOrientation(
  direction,
  progressRange,
  blocker,
) {
  const startProgress =
    direction > 0 ? progressRange.start : progressRange.end
  const endProgress =
    direction > 0 ? progressRange.end : progressRange.start
  const orientation = cameraPathModule.createCameraOrientation(
    getTargetCameraQuaternion(startProgress),
  )

  for (
    let progress = startProgress;
    direction > 0
      ? progress <= endProgress
      : progress >= endProgress;
    progress +=
      direction > 0
        ? STRONG_IMPULSE_PROGRESS_STEP *
          cameraPathModule.getRouteSpeedFactor(progress)
        : -BRISK_BACKWARD_PROGRESS_STEP
  ) {
    cameraPathModule.stepCameraOrientation(
      orientation,
      getTargetCameraQuaternion(progress),
      progress,
      1 / 30,
    )

    const position = getCameraPointAt(progress)
    const directionVector = CAMERA_FORWARD.clone()
      .applyQuaternion(orientation.quaternion)
      .setY(0)
      .normalize()
    const lookTarget = position
      .clone()
      .addScaledVector(directionVector, PATH_CAMERA_LOOK_DISTANCE)

    if (
      segmentIntersectsRectangle(
        position,
        lookTarget,
        blocker,
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

test('project gallery route stays centered between display walls', () => {
  const samples = samplePath()
  const projectGallerySamples = samples.filter(
    ({ point }) =>
      point.y < CAMERA_HEIGHT + 0.05 &&
      point.x >= -7.5 &&
      point.x <= 2.2,
  )
  const minimumZ = Math.min(
    ...projectGallerySamples.map(({ point }) => point.z),
  )
  const maximumZ = Math.max(
    ...projectGallerySamples.map(({ point }) => point.z),
  )

  assert.ok(minimumZ >= 11.9)
  assert.ok(maximumZ <= 12.1)
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

test('new turns keep camera clearance from both inside corners', () => {
  const samples = samplePath()
  for (const [label, blocker] of [
    ['project-to-social', projectTurnInsideCorner],
    ['social-to-contact', socialTurnInsideCorner],
  ]) {
    const nearestSample = samples.reduce((nearest, sample) => {
      const distance = distanceToRectangle(
        sample.point,
        blocker.minimumX,
        blocker.maximumX,
        blocker.minimumZ,
        blocker.maximumZ,
      )

      return distance < nearest.distance
        ? { ...sample, distance }
        : nearest
    }, { distance: Infinity })

    assert.ok(
      nearestSample.distance >= TURN_MINIMUM_CLEARANCE,
      `${label} turn leaves only ${nearestSample.distance.toFixed(3)}m from the inside corner`,
    )
  }
})

test('entrance turn orientation follows the connected portals', () => {
  const samples = samplePath()
  const entranceProgress = findClosestSample(
    samples,
    new Vector3(-18, CAMERA_HEIGHT, 13.1),
  ).progress
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

  const turnProgress = findClosestSample(
    samples,
    new Vector3(-15.1, CAMERA_HEIGHT, 11.5),
  ).progress
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
  const samples = samplePath()
  const startProgress = findClosestSample(
    samples,
    new Vector3(-18, CAMERA_HEIGHT, 14.5),
  ).progress
  const endProgress = findClosestSample(
    samples,
    new Vector3(-13.7, CAMERA_HEIGHT, 12),
  ).progress
  const turnSamples = Array.from(
    { length: TURN_CLEARANCE_SAMPLE_COUNT + 1 },
    (_, index) => {
      const progress =
        startProgress +
        (index / TURN_CLEARANCE_SAMPLE_COUNT) *
          (endProgress - startProgress)
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
  const samples = samplePath()
  const startProgress = findClosestSample(
    samples,
    new Vector3(-18, CAMERA_HEIGHT, 14.5),
  ).progress
  const endProgress = findClosestSample(
    samples,
    new Vector3(-13.7, CAMERA_HEIGHT, 12),
  ).progress
  const blockedSample = Array.from({ length: 81 }, (_, index) => {
    const progress =
      startProgress + (index / 80) * (endProgress - startProgress)
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
  const samples = samplePath()
  const progressRange = {
    start: findClosestSample(
      samples,
      new Vector3(-18, CAMERA_HEIGHT, 14.5),
    ).progress,
    end: findClosestSample(
      samples,
      new Vector3(-13.7, CAMERA_HEIGHT, 12),
    ).progress,
  }

  for (const [label, direction] of [
    ['forward', 1],
    ['backward', -1],
  ]) {
    const blockedProgress = findBlockedSmoothedOrientation(
      direction,
      progressRange,
      entranceTurnInsideSupport,
    )

    assert.equal(
      blockedProgress,
      null,
      `${label} orientation intersects the inside support at progress ${blockedProgress?.toFixed(4)}`,
    )
  }
})

test('new turn orientations clear their inside corners both ways', () => {
  const samples = samplePath()
  const turns = [
    {
      blocker: projectTurnInsideCorner,
      label: 'project-to-social',
      progressRange: {
        start: findClosestSample(
          samples,
          new Vector3(2.3, CAMERA_HEIGHT, 12),
        ).progress,
        end: findClosestSample(
          samples,
          new Vector3(4.2, CAMERA_HEIGHT, 8.3),
        ).progress,
      },
    },
    {
      blocker: socialTurnInsideCorner,
      label: 'social-to-contact',
      progressRange: {
        start: findClosestSample(
          samples,
          new Vector3(4.2, CAMERA_HEIGHT, 6.2),
        ).progress,
        end: findClosestSample(
          samples,
          new Vector3(7, CAMERA_HEIGHT, 4),
        ).progress,
      },
    },
  ]

  for (const turn of turns) {
    for (const [directionLabel, direction] of [
      ['forward', 1],
      ['backward', -1],
    ]) {
      const blockedProgress = findBlockedSmoothedOrientation(
        direction,
        turn.progressRange,
        turn.blocker,
      )

      assert.equal(
        blockedProgress,
        null,
        `${turn.label} ${directionLabel} orientation intersects the inside corner at progress ${blockedProgress?.toFixed(4)}`,
      )
    }
  }
})

test('project stop sits inside the three-display gallery', () => {
  const projectStop = EVALUATION_STOPS.find(
    (stop) => stop.id === 'projects',
  )
  const position = getCameraPointAt(projectStop.progress)

  assert.ok(position.x >= -2 && position.x <= 2.2)
  assert.ok(Math.abs(position.z - 12) <= GATE_CENTER_TOLERANCE)
})

test('camera remains at human eye height and finishes inside the threshold', () => {
  const samples = samplePath()
  const minimumHeight = Math.min(...samples.map(({ point }) => point.y))
  const maximumHeight = Math.max(...samples.map(({ point }) => point.y))
  const endpoint = samples.at(-1).point

  assert.ok(minimumHeight >= CAMERA_HEIGHT)
  assert.ok(maximumHeight <= CAMERA_HEIGHT)
  assert.ok(endpoint.x >= 10.7 && endpoint.x <= 11.4)
  assert.ok(endpoint.z >= 3.75 && endpoint.z <= 4.25)
})
