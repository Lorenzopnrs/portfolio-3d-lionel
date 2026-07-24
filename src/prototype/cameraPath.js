import { CatmullRomCurve3, Vector3 } from 'three'

export const CAMERA_HEIGHT = 1.68
export const INITIAL_PROGRESS = 0.035

const pathPoints = [
  new Vector3(0, CAMERA_HEIGHT, 8),
  new Vector3(0, CAMERA_HEIGHT, 2),
  new Vector3(0.8, CAMERA_HEIGHT, -6),
  new Vector3(3.2, CAMERA_HEIGHT, -13),
  new Vector3(2.4, CAMERA_HEIGHT, -21),
  new Vector3(-0.5, CAMERA_HEIGHT, -29),
  new Vector3(-2.2, CAMERA_HEIGHT, -38),
  new Vector3(0, CAMERA_HEIGHT, -48),
]

export const cameraPath = new CatmullRomCurve3(
  pathPoints,
  false,
  'catmullrom',
  0.35,
)

cameraPath.arcLengthDivisions = 600

export const EVALUATION_STOPS = Object.freeze([
  { label: 'Stop 1', progress: 0.18 },
  { label: 'Stop 2', progress: 0.5 },
  { label: 'Stop 3', progress: 0.82 },
])

export function clampProgress(progress) {
  return Math.min(1, Math.max(0, progress))
}

export function getPathPlacement(progress) {
  const clampedProgress = clampProgress(progress)
  const point = cameraPath.getPointAt(clampedProgress)
  const tangent = cameraPath.getTangentAt(clampedProgress).normalize()
  const yaw = Math.atan2(-tangent.x, -tangent.z)

  return {
    position: [point.x, 0, point.z],
    rotation: [0, yaw, 0],
  }
}
