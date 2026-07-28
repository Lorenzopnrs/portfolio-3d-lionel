import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Matrix4, Quaternion, Vector3 } from 'three'
import {
  PATH_LENGTH,
  cameraPath,
  getCameraLookAheadDistance,
  getCameraOrientationResponse,
  getCameraPointAt,
} from './cameraPath'
import { updateMovement } from './movementController'

const WORLD_UP = new Vector3(0, 1, 0)

export function PathCamera({ movementRef, onTelemetry }) {
  const camera = useThree((state) => state.camera)
  const position = useRef(new Vector3())
  const tangent = useRef(new Vector3())
  const lookAheadPoint = useRef(new Vector3())
  const lookTarget = useRef(new Vector3())
  const lookMatrix = useRef(new Matrix4())
  const targetQuaternion = useRef(new Quaternion())
  const lastReport = useRef({
    progress: -1,
    activeStopIndex: null,
  })

  useFrame((_, delta) => {
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

    lookMatrix.current.lookAt(
      position.current,
      lookTarget.current,
      WORLD_UP,
    )
    targetQuaternion.current.setFromRotationMatrix(lookMatrix.current)
    const orientationResponse = getCameraOrientationResponse(
      movement.progress,
    )

    camera.position.copy(position.current)
    camera.quaternion.slerp(
      targetQuaternion.current,
      1 -
        Math.exp(
          -orientationResponse * Math.min(delta, 1 / 30),
        ),
    )
    camera.up.copy(WORLD_UP)

    const progressChanged =
      Math.abs(movement.progress - lastReport.current.progress) >= 0.003
    const stopChanged =
      movement.activeStopIndex !== lastReport.current.activeStopIndex

    if (progressChanged || stopChanged) {
      lastReport.current = {
        progress: movement.progress,
        activeStopIndex: movement.activeStopIndex,
      }
      onTelemetry(lastReport.current)
    }
  })

  return null
}
