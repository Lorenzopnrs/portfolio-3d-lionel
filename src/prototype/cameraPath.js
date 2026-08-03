import { CatmullRomCurve3, Vector3 } from 'three'

export const CAMERA_HEIGHT = 1.68
export const CAMERA_LOOK_AHEAD_DISTANCE = 4.5
export const GROUND_LEVEL = 0
export const UPPER_LEVEL = 4
export const INITIAL_PROGRESS = 0.018

const CAMERA_ORIENTATION_RESPONSE = 12
const TURN_ORIENTATION_RESPONSE = 18
const PROJECT_FOCUS_ORIENTATION_RESPONSE = 30

function cameraPoint(x, z, floorLevel = GROUND_LEVEL) {
  return new Vector3(x, floorLevel + CAMERA_HEIGHT, z)
}

const pathPoints = [
  cameraPoint(-18, 30),
  cameraPoint(-18, 27),
  cameraPoint(-18, 23),
  cameraPoint(-18, 20),
  cameraPoint(-18, 16),
  cameraPoint(-18, 13),
  cameraPoint(-18, 12.55),
  cameraPoint(-17.85, 12.15),
  cameraPoint(-17.5, 11.8),
  cameraPoint(-17, 11.55),
  cameraPoint(-16.4, 11.42),
  cameraPoint(-15.8, 11.4),
  cameraPoint(-15.3, 11.42),
  cameraPoint(-14.95, 11.55),
  cameraPoint(-14.78, 11.96),
  cameraPoint(-14.45, 12),
  cameraPoint(-14.1, 12),
  cameraPoint(-13.7, 12),
  cameraPoint(-12, 12),
  cameraPoint(-9.5, 12),
  cameraPoint(-8.3, 12),
  cameraPoint(-7.5, 12),
  cameraPoint(-6.9, 12),
  cameraPoint(-6.2, 12),
  cameraPoint(-5.4, 12),
  cameraPoint(-4.2, 12),
  cameraPoint(-2.8, 12),
  cameraPoint(-1.2, 12),
  cameraPoint(0.4, 12),
  cameraPoint(1.8, 12),
  cameraPoint(2.7, 11.95),
  cameraPoint(3.25, 11.75),
  cameraPoint(3.7, 11.4),
  cameraPoint(4, 10.9),
  cameraPoint(4.15, 10.25),
  cameraPoint(4.2, 9.7),
  cameraPoint(4.2, 9),
  cameraPoint(4.2, 8.4),
  cameraPoint(4.2, 7.6),
  cameraPoint(4.2, 6.8),
  cameraPoint(4.2, 6),
  cameraPoint(4.2, 5.4),
  cameraPoint(4.3, 4.9),
  cameraPoint(4.55, 4.5),
  cameraPoint(5, 4.2),
  cameraPoint(5.55, 4.05),
  cameraPoint(6.05, 4),
  cameraPoint(6.5, 4),
  cameraPoint(7, 4),
  cameraPoint(7.8, 4),
  cameraPoint(8.8, 4),
  cameraPoint(9.7, 4),
  cameraPoint(10.5, 4),
  cameraPoint(11.1, 4),
]

export const cameraPath = new CatmullRomCurve3(
  pathPoints,
  false,
  'centripetal',
)

cameraPath.arcLengthDivisions = 600

export const PATH_LENGTH = cameraPath.getLength()

const stopTargets = [
  {
    id: 'entrance',
    label: 'Entrée',
    point: cameraPoint(-18, 25),
  },
  {
    id: 'projects',
    label: 'LIVRES',
    point: cameraPoint(-0.6, 12),
  },
  {
    id: 'social',
    label: 'HISTOIRES AUDIOS',
    point: cameraPoint(4.2, 5.5),
  },
  {
    id: 'contact',
    label: 'RESEAUX SOCIAUX',
    point: cameraPoint(9.4, 4),
  },
]

function findClosestProgress(targetPoint) {
  const sampleCount = 1600
  let closestProgress = 0
  let closestDistance = Infinity

  for (let index = 0; index <= sampleCount; index += 1) {
    const progress = index / sampleCount
    const distance = getCameraPointAt(progress).distanceToSquared(targetPoint)

    if (distance < closestDistance) {
      closestDistance = distance
      closestProgress = progress
    }
  }

  return closestProgress
}

export const EVALUATION_STOPS = Object.freeze(
  stopTargets.map(({ id, label, point }) => ({
    id,
    label,
    progress: findClosestProgress(point),
  })),
)

export const PROJECT_GALLERY_PROGRESS_RANGE = Object.freeze({
  start: findClosestProgress(cameraPoint(-7.5, 12)),
  end: findClosestProgress(cameraPoint(4.2, 8.7)),
})

export const AUDIO_STORY_PROGRESS_RANGE = Object.freeze({
  start: findClosestProgress(cameraPoint(4.2, 8.7)),
  end: findClosestProgress(cameraPoint(7.1, 4)),
})

export const SOCIAL_NETWORK_PROGRESS_RANGE = Object.freeze({
  start: findClosestProgress(cameraPoint(6.7, 4)),
  end: findClosestProgress(cameraPoint(11.1, 4)),
})

const PROJECT_FOCUS_ZONES = Object.freeze(
  [
    {
      start: cameraPoint(-7.5, 12),
      peakIn: cameraPoint(-7.2, 12),
      peakOut: cameraPoint(-5.5, 12),
      end: cameraPoint(-4.7, 12),
      target: cameraPoint(-4.95, 14.785),
    },
    {
      start: cameraPoint(-4.8, 12),
      peakIn: cameraPoint(-4.3, 12),
      peakOut: cameraPoint(-1.9, 12),
      end: cameraPoint(-1, 12),
      target: cameraPoint(-1.25, 9.19),
    },
    {
      start: cameraPoint(-1.1, 12),
      peakIn: cameraPoint(-0.6, 12),
      peakOut: cameraPoint(1.4, 12),
      end: cameraPoint(2.2, 12),
      target: cameraPoint(2.05, 14.78),
    },
  ].map((zone) => ({
    start: findClosestProgress(zone.start),
    peakIn: findClosestProgress(zone.peakIn),
    peakOut: findClosestProgress(zone.peakOut),
    end: findClosestProgress(zone.end),
    target: zone.target,
  })),
)

const TURN_ZONES = Object.freeze(
  [
    {
      start: cameraPoint(-18, 14.5),
      peakIn: cameraPoint(-18, 13.2),
      peakOut: cameraPoint(-15.1, 11.5),
      end: cameraPoint(-13.7, 12),
      lookAheadDistance: 2,
    },
    {
      start: cameraPoint(2.3, 12),
      peakIn: cameraPoint(3.25, 11.75),
      peakOut: cameraPoint(4.2, 9.7),
      end: cameraPoint(4.2, 8.3),
      lookAheadDistance: 2.2,
    },
    {
      start: cameraPoint(4.2, 6.2),
      peakIn: cameraPoint(4.3, 4.9),
      peakOut: cameraPoint(5.55, 4.05),
      end: cameraPoint(7, 4),
      lookAheadDistance: 2,
    },
  ].map((zone) => ({
    start: findClosestProgress(zone.start),
    peakIn: findClosestProgress(zone.peakIn),
    peakOut: findClosestProgress(zone.peakOut),
    end: findClosestProgress(zone.end),
    lookAheadDistance: zone.lookAheadDistance,
  })),
)

export function clampProgress(progress) {
  return Math.min(1, Math.max(0, progress))
}

function smoothstep(minimum, maximum, value) {
  const normalized = clampProgress(
    (value - minimum) / (maximum - minimum),
  )
  return normalized * normalized * (3 - 2 * normalized)
}

function getTurnWeight(progress, zone) {
  const clampedProgress = clampProgress(progress)
  const turnIn = smoothstep(
    zone.start,
    zone.peakIn,
    clampedProgress,
  )
  const turnOut =
    1 -
    smoothstep(
      zone.peakOut,
      zone.end,
      clampedProgress,
    )

  return Math.min(turnIn, turnOut)
}

export function applyCameraFocusTarget(
  progress,
  cameraPosition,
  lookTarget,
) {
  let strongestWeight = 0
  let strongestTarget = null

  for (const zone of PROJECT_FOCUS_ZONES) {
    const weight = getTurnWeight(progress, zone)

    if (weight > strongestWeight) {
      strongestWeight = weight
      strongestTarget = zone.target
    }
  }

  if (strongestTarget) {
    lookTarget.lerp(strongestTarget, strongestWeight)
    lookTarget.y = cameraPosition.y
  }

  return lookTarget
}

export function getCameraLookAheadDistance(progress) {
  return TURN_ZONES.reduce((distance, zone) => {
    const turnWeight = getTurnWeight(progress, zone)
    const turnDistance =
      CAMERA_LOOK_AHEAD_DISTANCE +
      (zone.lookAheadDistance - CAMERA_LOOK_AHEAD_DISTANCE) *
        turnWeight

    return Math.min(distance, turnDistance)
  }, CAMERA_LOOK_AHEAD_DISTANCE)
}

export function getCameraOrientationResponse(
  progress,
  projectFocusEnabled = true,
) {
  const turnResponse = TURN_ZONES.reduce((response, zone) => {
    const turnWeight = getTurnWeight(progress, zone)
    const turnResponse =
      CAMERA_ORIENTATION_RESPONSE +
      (TURN_ORIENTATION_RESPONSE - CAMERA_ORIENTATION_RESPONSE) *
        turnWeight

    return Math.max(response, turnResponse)
  }, CAMERA_ORIENTATION_RESPONSE)

  if (!projectFocusEnabled) {
    return turnResponse
  }

  return PROJECT_FOCUS_ZONES.reduce((response, zone) => {
    const focusWeight = getTurnWeight(progress, zone)
    const focusResponse =
      CAMERA_ORIENTATION_RESPONSE +
      (PROJECT_FOCUS_ORIENTATION_RESPONSE -
        CAMERA_ORIENTATION_RESPONSE) *
        focusWeight

    return Math.max(response, focusResponse)
  }, turnResponse)
}

export function getCameraPointAt(progress, target) {
  const point = cameraPath.getPointAt(clampProgress(progress), target)
  point.y = Math.min(
    CAMERA_HEIGHT + UPPER_LEVEL,
    Math.max(CAMERA_HEIGHT, point.y),
  )

  return point
}

export function getPathPlacement(progress) {
  const clampedProgress = clampProgress(progress)
  const point = getCameraPointAt(clampedProgress)
  const tangent = cameraPath.getTangentAt(clampedProgress).normalize()
  tangent.y = 0
  tangent.normalize()
  const yaw = Math.atan2(-tangent.x, -tangent.z)

  return {
    position: [point.x, point.y - CAMERA_HEIGHT, point.z],
    rotation: [0, yaw, 0],
  }
}
