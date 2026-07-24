import { Html } from '@react-three/drei'
import {
  EVALUATION_STOPS,
  cameraPath,
  getPathPlacement,
} from './cameraPath'

const SEGMENT_COUNT = 48
const FRAME_PROGRESS = [
  0.055, 0.11, 0.245, 0.32, 0.39, 0.57, 0.64, 0.71, 0.89, 0.95,
]

const corridorSegments = Array.from({ length: SEGMENT_COUNT }, (_, index) => {
  const startProgress = index / SEGMENT_COUNT
  const endProgress = (index + 1) / SEGMENT_COUNT
  const centerProgress = (startProgress + endProgress) / 2
  const start = cameraPath.getPointAt(startProgress)
  const end = cameraPath.getPointAt(endProgress)
  const placement = getPathPlacement(centerProgress)

  return {
    ...placement,
    id: `segment-${index}`,
    length: start.distanceTo(end) + 0.16,
  }
})

function CorridorSegment({ position, rotation, length }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, -0.08, 0]}>
        <boxGeometry args={[5.6, 0.16, length]} />
        <meshStandardMaterial color="#25303d" roughness={1} />
      </mesh>
      <mesh position={[-3.05, 0.65, 0]}>
        <boxGeometry args={[0.14, 1.3, length]} />
        <meshStandardMaterial color="#121b27" roughness={1} />
      </mesh>
      <mesh position={[3.05, 0.65, 0]}>
        <boxGeometry args={[0.14, 1.3, length]} />
        <meshStandardMaterial color="#121b27" roughness={1} />
      </mesh>
    </group>
  )
}

function CorridorFrame({ progress, color = '#708096' }) {
  const placement = getPathPlacement(progress)

  return (
    <group position={placement.position} rotation={placement.rotation}>
      <mesh position={[-2.9, 2.05, 0]}>
        <boxGeometry args={[0.22, 4.1, 0.22]} />
        <meshStandardMaterial color={color} roughness={0.9} />
      </mesh>
      <mesh position={[2.9, 2.05, 0]}>
        <boxGeometry args={[0.22, 4.1, 0.22]} />
        <meshStandardMaterial color={color} roughness={0.9} />
      </mesh>
      <mesh position={[0, 4.0, 0]}>
        <boxGeometry args={[6.02, 0.22, 0.22]} />
        <meshStandardMaterial color={color} roughness={0.9} />
      </mesh>
    </group>
  )
}

function StopMarker({ label, progress }) {
  const markerProgress = Math.min(0.99, progress + 0.032)
  const placement = getPathPlacement(markerProgress)
  const stopPlacement = getPathPlacement(progress)

  return (
    <>
      <group position={placement.position} rotation={placement.rotation}>
        <mesh position={[-2.9, 2.05, 0]}>
          <boxGeometry args={[0.3, 4.1, 0.3]} />
          <meshStandardMaterial color="#f2a65a" roughness={0.85} />
        </mesh>
        <mesh position={[2.9, 2.05, 0]}>
          <boxGeometry args={[0.3, 4.1, 0.3]} />
          <meshStandardMaterial color="#f2a65a" roughness={0.85} />
        </mesh>
        <mesh position={[0, 4.0, 0]}>
          <boxGeometry args={[6.1, 0.3, 0.3]} />
          <meshStandardMaterial color="#f2a65a" roughness={0.85} />
        </mesh>
        <Html
          position={[0, 3.35, 0]}
          center
          distanceFactor={6}
          occlude
          zIndexRange={[1, 0]}
        >
          <div className="stop-label" aria-hidden="true">
            {label}
          </div>
        </Html>
      </group>

      <group position={stopPlacement.position} rotation={stopPlacement.rotation}>
        <mesh position={[0, 0.025, 0]}>
          <boxGeometry args={[2.1, 0.05, 0.28]} />
          <meshBasicMaterial color="#f2a65a" />
        </mesh>
      </group>
    </>
  )
}

export function PrototypeEnvironment() {
  return (
    <>
      {corridorSegments.map((segment) => (
        <CorridorSegment
          key={segment.id}
          position={segment.position}
          rotation={segment.rotation}
          length={segment.length}
        />
      ))}

      {FRAME_PROGRESS.map((progress) => (
        <CorridorFrame key={progress} progress={progress} />
      ))}

      {EVALUATION_STOPS.map((stop) => (
        <StopMarker key={stop.label} {...stop} />
      ))}
    </>
  )
}
