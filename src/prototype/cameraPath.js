import { CatmullRomCurve3, Vector3 } from 'three'

export const CAMERA_HEIGHT = 1.68
export const CAMERA_LOOK_AHEAD_DISTANCE = 4.5
export const GROUND_LEVEL = 0
export const UPPER_LEVEL = 4
export const INITIAL_PROGRESS = 0.018
export const CAMERA_FIELD_OF_VIEW = 52
const PHONE_ZOOM_FIELD_OF_VIEW = 24
// Keeps a whole frame on screen on a phone held upright.
const MINIMUM_HORIZONTAL_FIELD_OF_VIEW = 36
const DEGREES_PER_RADIAN = 180 / Math.PI

const CAMERA_ORIENTATION_RESPONSE = 4.5
const TURN_ORIENTATION_RESPONSE = 6.5
const WIDE_TURN_ORIENTATION_RESPONSE = 5.5
const MAXIMUM_ORIENTATION_FRAME_DELTA = 1 / 15

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
    id: 'book1',
    label: 'LIVRE 1',
    point: cameraPoint(-4.95, 12),
    hold: true,
  },
  {
    id: 'book2',
    label: 'LIVRE 2',
    point: cameraPoint(-1.25, 12),
    hold: true,
  },
  {
    id: 'projects',
    label: 'LIVRES',
    point: cameraPoint(1.85, 12),
    signPoint: cameraPoint(-0.6, 12),
    hold: true,
  },
  {
    id: 'library',
    label: 'BIBLIOTHÈQUE',
    point: cameraPoint(3, 11.85),
    hold: true,
  },
  {
    id: 'audioFrames',
    label: 'GALERIE D’ÉCOUTE',
    point: cameraPoint(4.2, 6.9),
  },
  {
    id: 'social',
    label: 'HISTOIRES AUDIOS',
    point: cameraPoint(4.2, 5.3),
  },
  {
    id: 'contact',
    label: 'RESEAUX SOCIAUX',
    point: cameraPoint(8.95, 4),
    signPoint: cameraPoint(9.4, 4),
    hold: true,
  },
  {
    id: 'agenda',
    label: 'AGENDA',
    point: cameraPoint(10.6, 4),
    hold: true,
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
  stopTargets.map(({ hold = false, id, label, point, signPoint = point }) => ({
    hold,
    id,
    label,
    progress: findClosestProgress(point),
    signProgress: findClosestProgress(signPoint),
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
      start: cameraPoint(-8.4, 12),
      peakIn: cameraPoint(-6.2, 12),
      peakOut: cameraPoint(-4.75, 12),
      end: cameraPoint(-3.4, 12),
      target: cameraPoint(-4.95, 14.83),
    },
    {
      start: cameraPoint(-3.4, 12),
      peakIn: cameraPoint(-1.85, 12),
      peakOut: cameraPoint(-1.05, 12),
      end: cameraPoint(0.3, 12),
      target: cameraPoint(-1.25, 9.17),
    },
    {
      start: cameraPoint(0.3, 12),
      peakIn: cameraPoint(1.6, 12),
      peakOut: cameraPoint(1.95, 12),
      end: cameraPoint(2.8, 11.93),
      target: cameraPoint(2.05, 14.83),
    },
  ].map((zone) => ({
    start: findClosestProgress(zone.start),
    peakIn: findClosestProgress(zone.peakIn),
    peakOut: findClosestProgress(zone.peakOut),
    end: findClosestProgress(zone.end),
    target: zone.target,
  })),
)

// Holds the view on the bookcase before the corridor turns away from it.
const LIBRARY_FOCUS_ZONE = Object.freeze({
  start: findClosestProgress(cameraPoint(1.95, 12)),
  peakIn: findClosestProgress(cameraPoint(2.85, 11.92)),
  peakOut: findClosestProgress(cameraPoint(3.2, 11.77)),
  end: findClosestProgress(cameraPoint(3.95, 11)),
  target: cameraPoint(5.29, 12),
})
// The camera faces the wall as it walks along the frames: on a narrow phone
// screen, the visitor sees them go by one after the other.
const AUDIO_FRAMES_FOCUS_ZONE = Object.freeze({
  start: findClosestProgress(cameraPoint(4.2, 8)),
  peakIn: findClosestProgress(cameraPoint(4.2, 7.2)),
  peakOut: findClosestProgress(cameraPoint(4.2, 6.5)),
  end: findClosestProgress(cameraPoint(4.2, 5.6)),
  target: cameraPoint(2.12, 6.9),
  faceWallAlongZ: true,
})
// Starts before the frames let go, so the view goes straight from one to the
// other instead of first swinging towards the corner ahead.
const AUDIO_LIBRARY_FOCUS_ZONE = Object.freeze({
  start: findClosestProgress(cameraPoint(4.2, 6.7)),
  peakIn: findClosestProgress(cameraPoint(4.2, 5.4)),
  peakOut: findClosestProgress(cameraPoint(4.3, 4.9)),
  end: findClosestProgress(cameraPoint(4.55, 4.5)),
  target: cameraPoint(4.2, 2.42),
})
// Looks down at the phone on the desk, unlike the zones aimed at a wall.
const CONTACT_PHONE_FOCUS_ZONE = Object.freeze({
  start: findClosestProgress(cameraPoint(7.3, 4)),
  peakIn: findClosestProgress(cameraPoint(8.5, 4)),
  peakOut: findClosestProgress(cameraPoint(9.05, 4)),
  end: findClosestProgress(cameraPoint(9.85, 4)),
  target: new Vector3(9.72, 1.02, 2.09),
  lookDown: true,
})
const AGENDA_FOCUS_ZONE = Object.freeze({
  start: findClosestProgress(cameraPoint(9.85, 4)),
  peakIn: findClosestProgress(cameraPoint(10.45, 4)),
  peakOut: findClosestProgress(cameraPoint(10.8, 4)),
  end: findClosestProgress(cameraPoint(11.05, 4)),
  target: cameraPoint(10.65, 6.1),
})
const PHONE_ZOOM_ZONE = Object.freeze({
  start: findClosestProgress(cameraPoint(7.9, 4)),
  peakIn: findClosestProgress(cameraPoint(8.8, 4)),
  peakOut: findClosestProgress(cameraPoint(9.05, 4)),
  end: findClosestProgress(cameraPoint(9.7, 4)),
})
// These hold the view at a stop, so reduced motion keeps them too.
const STOP_FOCUS_ZONES = Object.freeze([
  LIBRARY_FOCUS_ZONE,
  AUDIO_FRAMES_FOCUS_ZONE,
  AUDIO_LIBRARY_FOCUS_ZONE,
  CONTACT_PHONE_FOCUS_ZONE,
  AGENDA_FOCUS_ZONE,
])
const ALL_FOCUS_ZONES = Object.freeze([
  ...PROJECT_FOCUS_ZONES,
  ...STOP_FOCUS_ZONES,
])

// The visit slows down in the gallery, the audio room and the corners, so the
// camera has time to turn gently.
const GALLERY_SPEED_FACTOR = 0.55
const TURN_SPEED_FACTOR = 0.6
const GALLERY_SPEED_ZONE = Object.freeze({
  start: findClosestProgress(cameraPoint(-9.5, 12)),
  peakIn: findClosestProgress(cameraPoint(-7.5, 12)),
  peakOut: findClosestProgress(cameraPoint(4.3, 4.9)),
  end: findClosestProgress(cameraPoint(6.05, 4)),
})

// The places where the camera turns the most in the shortest distance.
const WIDE_TURN_SPEED_FACTOR = 0.42
const WIDE_TURN_SPEED_ZONES = Object.freeze(
  [
    {
      start: cameraPoint(3, 11.85),
      peakIn: cameraPoint(3.7, 11.4),
      peakOut: cameraPoint(4.2, 9.7),
      end: cameraPoint(4.2, 8.8),
    },
    {
      start: cameraPoint(4.2, 8.3),
      peakIn: cameraPoint(4.2, 7.8),
      peakOut: cameraPoint(4.2, 5.7),
      end: cameraPoint(4.2, 5.3),
    },
    {
      start: cameraPoint(4.2, 5.3),
      peakIn: cameraPoint(4.35, 4.8),
      peakOut: cameraPoint(5.9, 4),
      end: cameraPoint(6.7, 4),
    },
    {
      start: cameraPoint(8.2, 4),
      peakIn: cameraPoint(8.95, 4),
      peakOut: cameraPoint(10.6, 4),
      end: cameraPoint(10.95, 4),
    },
  ].map((zone) => ({
    start: findClosestProgress(zone.start),
    peakIn: findClosestProgress(zone.peakIn),
    peakOut: findClosestProgress(zone.peakOut),
    end: findClosestProgress(zone.end),
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
      response: WIDE_TURN_ORIENTATION_RESPONSE,
    },
    {
      start: cameraPoint(4.2, 5.3),
      peakIn: cameraPoint(4.3, 4.9),
      peakOut: cameraPoint(5.55, 4.05),
      end: cameraPoint(7, 4),
      lookAheadDistance: 2,
      response: CAMERA_ORIENTATION_RESPONSE,
    },
  ].map((zone) => ({
    start: findClosestProgress(zone.start),
    peakIn: findClosestProgress(zone.peakIn),
    peakOut: findClosestProgress(zone.peakOut),
    end: findClosestProgress(zone.end),
    lookAheadDistance: zone.lookAheadDistance,
    response: zone.response ?? TURN_ORIENTATION_RESPONSE,
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

const focusTarget = new Vector3()
const zoneFocusTarget = new Vector3()

export function applyCameraFocusTarget(
  progress,
  cameraPosition,
  lookTarget,
  projectFocusEnabled = true,
) {
  let strongestWeight = 0
  let strongestZone = null
  let totalWeight = 0

  focusTarget.set(0, 0, 0)

  for (const zone of projectFocusEnabled
    ? ALL_FOCUS_ZONES
    : STOP_FOCUS_ZONES) {
    const weight = getTurnWeight(progress, zone)

    if (weight <= 0) {
      continue
    }

    // Overlapping zones blend, so the look glides from one to the next.
    zoneFocusTarget.copy(zone.target)

    if (zone.faceWallAlongZ) {
      zoneFocusTarget.z = cameraPosition.z
    }

    focusTarget.addScaledVector(zoneFocusTarget, weight)
    totalWeight += weight

    if (weight > strongestWeight) {
      strongestWeight = weight
      strongestZone = zone
    }
  }

  if (strongestZone) {
    focusTarget.divideScalar(totalWeight)
    // At the same distance, so the view turns evenly: a far look-ahead point
    // would otherwise outweigh a nearby frame and swing the camera at the end.
    lookTarget
      .sub(cameraPosition)
      .setLength(focusTarget.distanceTo(cameraPosition))
      .add(cameraPosition)
      .lerp(focusTarget, strongestWeight)

    if (!strongestZone.lookDown) {
      lookTarget.y = cameraPosition.y
    }
  }

  return lookTarget
}

export function getRestingFieldOfView(aspect) {
  const horizontalTangent = Math.tan(
    MINIMUM_HORIZONTAL_FIELD_OF_VIEW / DEGREES_PER_RADIAN / 2,
  )

  return Math.max(
    CAMERA_FIELD_OF_VIEW,
    2 * Math.atan(horizontalTangent / aspect) * DEGREES_PER_RADIAN,
  )
}

export function getCameraFieldOfView(progress, aspect) {
  const restingFieldOfView = getRestingFieldOfView(aspect)

  return (
    restingFieldOfView +
    (PHONE_ZOOM_FIELD_OF_VIEW - restingFieldOfView) *
      getTurnWeight(progress, PHONE_ZOOM_ZONE)
  )
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

function getZoneSpeedFactor(progress, zone, factor) {
  return 1 - (1 - factor) * getTurnWeight(progress, zone)
}

export function getRouteSpeedFactor(progress) {
  return Math.min(
    getZoneSpeedFactor(
      progress,
      GALLERY_SPEED_ZONE,
      GALLERY_SPEED_FACTOR,
    ),
    ...TURN_ZONES.map((zone) =>
      getZoneSpeedFactor(progress, zone, TURN_SPEED_FACTOR),
    ),
    ...WIDE_TURN_SPEED_ZONES.map((zone) =>
      getZoneSpeedFactor(progress, zone, WIDE_TURN_SPEED_FACTOR),
    ),
  )
}

export function getCameraOrientationResponse(progress) {
  return TURN_ZONES.reduce((response, zone) => {
    const turnWeight = getTurnWeight(progress, zone)
    const turnResponse =
      CAMERA_ORIENTATION_RESPONSE +
      (zone.response - CAMERA_ORIENTATION_RESPONSE) * turnWeight

    return Math.max(response, turnResponse)
  }, CAMERA_ORIENTATION_RESPONSE)
}

export function createCameraOrientation(targetQuaternion) {
  return {
    quaternion: targetQuaternion.clone(),
    smoothedTarget: targetQuaternion.clone(),
  }
}

// Two chained filters, so a rotation eases in as well as out, like a head
// turning. A single one would start at full speed.
export function stepCameraOrientation(
  orientation,
  targetQuaternion,
  progress,
  frameDelta,
) {
  const alpha =
    1 -
    Math.exp(
      -getCameraOrientationResponse(progress) *
        Math.min(frameDelta, MAXIMUM_ORIENTATION_FRAME_DELTA),
    )

  orientation.smoothedTarget.slerp(targetQuaternion, alpha)
  orientation.quaternion.slerp(orientation.smoothedTarget, alpha)
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
