import { CatmullRomCurve3, Vector3 } from 'three'

export const CAMERA_HEIGHT = 1.68
export const CAMERA_LOOK_AHEAD_DISTANCE = 4.5
export const GROUND_LEVEL = 0
export const UPPER_LEVEL = 4
export const INITIAL_PROGRESS = 0.018

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
  cameraPoint(-18, 12.4),
  cameraPoint(-17.6, 12.1),
  cameraPoint(-16.5, 12),
  cameraPoint(-15.8, 12),
  cameraPoint(-15, 12),
  cameraPoint(-14.2, 12),
  cameraPoint(-12, 12),
  cameraPoint(-9.5, 12),
  cameraPoint(-8.3, 12),
  cameraPoint(-7.5, 12),
  cameraPoint(-6.8, 12),
  cameraPoint(-5.5, 12),
  cameraPoint(-4.8, 12),
  cameraPoint(-3.8, 11.8),
  cameraPoint(-3, 11.4),
  cameraPoint(-2.3, 10.7),
  cameraPoint(-1.7, 9.8),
  cameraPoint(-0.8, 9.25),
  cameraPoint(0.3, 9.2),
  cameraPoint(1.5, 9.45),
  cameraPoint(2.5, 10),
  cameraPoint(3.4, 10.8),
  cameraPoint(4.3, 11.3),
  cameraPoint(5, 11.5),
  cameraPoint(5.5, 11.5),
  cameraPoint(6.2, 11.5),
  cameraPoint(7, 11.5),
  cameraPoint(7.8, 11.5),
  cameraPoint(9.5, 11.5),
  cameraPoint(10.6, 11.4),
  cameraPoint(11.3, 10.8),
  cameraPoint(11.5, 10),
  cameraPoint(11.5, 8.5),
  cameraPoint(11.5, 7.7),
  cameraPoint(11.5, 7),
  cameraPoint(11.45, 6.95),
  cameraPoint(10.8, 6.8),
  cameraPoint(10.3, 6.5),
  cameraPoint(9.9, 6.15),
  cameraPoint(9.6, 5.85),
  cameraPoint(9.5, 5.75, 0.08),
  cameraPoint(9.5, 4, 0.67),
  cameraPoint(9.5, 2, 1.33),
  cameraPoint(9.5, 0, 2),
  cameraPoint(9.5, -2, 2.67),
  cameraPoint(9.5, -4, 3.33),
  cameraPoint(9.5, -6, UPPER_LEVEL),
  cameraPoint(9.5, -7.5, UPPER_LEVEL),
  cameraPoint(9.5, -8.5, UPPER_LEVEL),
  cameraPoint(9.5, -9.5, UPPER_LEVEL),
  cameraPoint(9.5, -11.3, UPPER_LEVEL),
  cameraPoint(8, -12.2, UPPER_LEVEL),
  cameraPoint(6.5, -12.5, UPPER_LEVEL),
  cameraPoint(4, -12.5, UPPER_LEVEL),
  cameraPoint(1, -12.5, UPPER_LEVEL),
  cameraPoint(-2.5, -12.5, UPPER_LEVEL),
  cameraPoint(-4.8, -12.5, UPPER_LEVEL),
  cameraPoint(-5.8, -12.5, UPPER_LEVEL),
  cameraPoint(-6.5, -12.5, UPPER_LEVEL),
  cameraPoint(-7.2, -12.5, UPPER_LEVEL),
  cameraPoint(-8, -12.3, UPPER_LEVEL),
  cameraPoint(-8.7, -11.7, UPPER_LEVEL),
  cameraPoint(-9, -10.8, UPPER_LEVEL),
  cameraPoint(-9, -9.8, UPPER_LEVEL),
  cameraPoint(-9, -9, UPPER_LEVEL),
  cameraPoint(-9, -8.2, UPPER_LEVEL),
  cameraPoint(-9, -6, UPPER_LEVEL),
  cameraPoint(-9, -3, UPPER_LEVEL),
  cameraPoint(-9, -1.8, UPPER_LEVEL),
  cameraPoint(-9, -1, UPPER_LEVEL),
  cameraPoint(-9, -0.2, UPPER_LEVEL),
  cameraPoint(-9, 2.5, UPPER_LEVEL),
  cameraPoint(-9, 4.8, UPPER_LEVEL),
  cameraPoint(-9, 5.8, UPPER_LEVEL),
  cameraPoint(-9.1, 6.4, UPPER_LEVEL),
  cameraPoint(-9.6, 6.9, UPPER_LEVEL),
  cameraPoint(-10.3, 7, UPPER_LEVEL),
  cameraPoint(-10.8, 7, UPPER_LEVEL),
  cameraPoint(-11.5, 7, UPPER_LEVEL),
  cameraPoint(-12.2, 7, UPPER_LEVEL),
  cameraPoint(-13.5, 7, UPPER_LEVEL),
  cameraPoint(-14.7, 7, UPPER_LEVEL),
  cameraPoint(-15.4, 7, UPPER_LEVEL),
  cameraPoint(-16, 7, UPPER_LEVEL),
  cameraPoint(-17.2, 7, UPPER_LEVEL),
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
    id: 'vestibule',
    label: 'Introductory vestibule',
    point: cameraPoint(-18, 25),
  },
  {
    id: 'provenance',
    label: 'Provenance gallery',
    point: cameraPoint(-18, 18),
  },
  {
    id: 'project-one',
    label: 'First project room',
    point: cameraPoint(-11.5, 12),
  },
  {
    id: 'catalogue',
    label: 'Catalogue crossing',
    point: cameraPoint(0.3, 9.2),
  },
  {
    id: 'project-two',
    label: 'Second project room',
    point: cameraPoint(11.5, 10),
  },
  {
    id: 'ascent',
    label: 'Ascending transition',
    point: cameraPoint(9.5, 0, 2),
  },
  {
    id: 'manifesto',
    label: 'Manifesto-project space',
    point: cameraPoint(2, -12.5, UPPER_LEVEL),
  },
  {
    id: 'personal',
    label: 'Personal and contact space',
    point: cameraPoint(-9, -5, UPPER_LEVEL),
  },
  {
    id: 'threshold',
    label: 'Final unfinished threshold',
    point: cameraPoint(-12.3, 7, UPPER_LEVEL),
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

export function clampProgress(progress) {
  return Math.min(1, Math.max(0, progress))
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
