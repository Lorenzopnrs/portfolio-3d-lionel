import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Matrix4, Quaternion, Vector3 } from 'three'
import {
  PATH_LENGTH,
  applyCameraFocusTarget,
  cameraPath,
  createCameraOrientation,
  getCameraFieldOfView,
  getCameraLookAheadDistance,
  getCameraPointAt,
  getRestingFieldOfView,
  stepCameraOrientation,
} from './cameraPath'
import { updateMovement } from './movementController'

const WORLD_UP = new Vector3(0, 1, 0)
// Far more than a frame can travel: only the return to the start jumps this far.
const TELEPORT_PROGRESS = 0.1
const ZOOM_RESPONSE = 2.6

export function PathCamera({ movementRef, onTelemetry }) {
  const position = useRef(new Vector3())
  const tangent = useRef(new Vector3())
  const lookAheadPoint = useRef(new Vector3())
  const lookTarget = useRef(new Vector3())
  const lookMatrix = useRef(new Matrix4())
  const targetQuaternion = useRef(new Quaternion())
  const orientation = useRef(null)
  const previousProgress = useRef(0)
  const lastReport = useRef({
    progress: -1,
    activeStopIndex: null,
  })

  // Runs first so everything else in the frame reads the current camera.
  useFrame(({ camera }, delta) => {
    const movement = movementRef.current
    updateMovement(movement, delta)

    getCameraPointAt(movement.progress, position.current)
    const lookAheadDistance = getCameraLookAheadDistance(
      movement.progress,
    )
    const lookAheadProgress = Math.min(
      1,
      movement.progress + lookAheadDistance / PATH_LENGTH,
    )
    getCameraPointAt(lookAheadProgress, lookAheadPoint.current)
    tangent.current.subVectors(lookAheadPoint.current, position.current)

    if (tangent.current.lengthSq() < 0.000001) {
      cameraPath.getTangentAt(movement.progress, tangent.current)
    }

    tangent.current.y = 0
    tangent.current.normalize()

    lookTarget.current
      .copy(position.current)
      .addScaledVector(tangent.current, 6)
    lookTarget.current.y = position.current.y

    applyCameraFocusTarget(
      movement.progress,
      position.current,
      lookTarget.current,
      !movement.reducedMotion,
    )

    lookMatrix.current.lookAt(
      position.current,
      lookTarget.current,
      WORLD_UP,
    )
    targetQuaternion.current.setFromRotationMatrix(lookMatrix.current)

    const teleported =
      !orientation.current ||
      Math.abs(movement.progress - previousProgress.current) >
        TELEPORT_PROGRESS

    if (teleported) {
      orientation.current = createCameraOrientation(
        targetQuaternion.current,
      )
    } else {
      stepCameraOrientation(
        orientation.current,
        targetQuaternion.current,
        movement.progress,
        delta,
      )
    }

    previousProgress.current = movement.progress
    camera.position.copy(position.current)
    camera.quaternion.copy(orientation.current.quaternion)
    camera.up.copy(WORLD_UP)

    const targetFieldOfView = movement.reducedMotion
      ? getRestingFieldOfView(camera.aspect)
      : getCameraFieldOfView(movement.progress, camera.aspect)

    if (Math.abs(camera.fov - targetFieldOfView) > 0.01) {
      camera.fov = teleported
        ? targetFieldOfView
        : camera.fov +
          (targetFieldOfView - camera.fov) *
            (1 - Math.exp(-ZOOM_RESPONSE * Math.min(delta, 1 / 15)))
      camera.updateProjectionMatrix()
    }

    const progressChanged =
      Math.abs(movement.progress - lastReport.current.progress) >= 0.005
    const stopChanged =
      movement.activeStopIndex !== lastReport.current.activeStopIndex

    if (progressChanged || stopChanged) {
      lastReport.current = {
        progress: movement.progress,
        activeStopIndex: movement.activeStopIndex,
      }
      onTelemetry(lastReport.current)
    }
  }, -1)

  return null
}
