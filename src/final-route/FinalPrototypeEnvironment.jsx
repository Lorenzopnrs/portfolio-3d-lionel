import { useRef, useState } from 'react'
import { Html } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { Vector3 } from 'three'
import { Block } from '../prototype/ArchitectureElements'
import { BLOCKOUT_COLORS } from '../prototype/blockoutPalette'
import {
  EVALUATION_STOPS,
  getPathPlacement,
} from '../prototype/cameraPath'
import { EntranceVerticalSlice } from '../vertical-slice/EntranceVerticalSlice'
import { ProvenanceGallery } from '../vertical-slice/ProvenanceGallery'
import { FinalRouteEnvironment } from './FinalRouteEnvironment'

const MARKER_VISIBILITY_DISTANCE_SQUARED = 81

function EvaluationMarker({ index, label, progress }) {
  const placement = getPathPlacement(progress)
  const markerPosition = new Vector3(...placement.position)
  const visibilityRef = useRef(false)
  const [isVisible, setIsVisible] = useState(false)

  useFrame(({ camera }) => {
    const nextVisibility =
      camera.position.distanceToSquared(markerPosition) <=
      MARKER_VISIBILITY_DISTANCE_SQUARED

    if (nextVisibility !== visibilityRef.current) {
      visibilityRef.current = nextVisibility
      setIsVisible(nextVisibility)
    }
  })

  return (
    <group
      position={placement.position}
      rotation={placement.rotation}
      visible={isVisible}
    >
      <Block
        color={BLOCKOUT_COLORS.marker}
        position={[1.85, 1.25, 0]}
        size={[0.1, 2.5, 0.1]}
      />
      <Block
        color={BLOCKOUT_COLORS.marker}
        position={[0.92, 0.035, 0]}
        size={[1.95, 0.07, 0.16]}
      />
      {isVisible && (
        <Html
          center
          distanceFactor={7}
          occlude
          position={[1.85, 2.8, 0]}
          zIndexRange={[1, 0]}
        >
          <div className="stop-label" aria-hidden="true">
            <span>{String(index + 1).padStart(2, '0')}</span>
            {label}
          </div>
        </Html>
      )}
    </group>
  )
}

export function FinalPrototypeEnvironment({
  onAboutOpen,
  onProjectSelect,
  projectInteractionEnabled,
  reducedMotionEnabled,
}) {
  return (
    <>
      <EntranceVerticalSlice
        onAboutOpen={onAboutOpen}
        reducedMotionEnabled={reducedMotionEnabled}
      />
      <ProvenanceGallery />
      <FinalRouteEnvironment
        onProjectSelect={onProjectSelect}
        projectInteractionEnabled={projectInteractionEnabled}
      />

      {EVALUATION_STOPS.map((stop, index) => (
        <EvaluationMarker key={stop.id} index={index} {...stop} />
      ))}
    </>
  )
}
