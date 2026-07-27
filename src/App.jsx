import { useCallback, useEffect, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import './App.css'
import { EVALUATION_STOPS, INITIAL_PROGRESS } from './prototype/cameraPath'
import {
  applyDirectionalInput,
  createMovementState,
  setReducedMotion,
} from './prototype/movementController'
import { PathCamera } from './prototype/PathCamera'
import { PrototypeEnvironment } from './prototype/PrototypeEnvironment'
import { PrototypeInterface } from './prototype/PrototypeInterface'
import { usePathControls } from './prototype/usePathControls'

function App() {
  const movementRef = useRef(createMovementState())
  const [reducedMotionEnabled, setReducedMotionEnabled] = useState(() =>
    window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  const [telemetry, setTelemetry] = useState({
    progress: INITIAL_PROGRESS,
    activeStopIndex: null,
  })
  const [announcement, setAnnouncement] = useState('')

  usePathControls(movementRef)

  useEffect(() => {
    const motionPreference = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    )
    const handleMotionPreferenceChange = (event) => {
      setReducedMotionEnabled(event.matches)
    }

    motionPreference.addEventListener('change', handleMotionPreferenceChange)

    return () => {
      motionPreference.removeEventListener(
        'change',
        handleMotionPreferenceChange,
      )
    }
  }, [])

  useEffect(() => {
    setReducedMotion(movementRef.current, reducedMotionEnabled)
  }, [reducedMotionEnabled])

  const handleTelemetry = useCallback((nextTelemetry) => {
    setTelemetry(nextTelemetry)

    if (nextTelemetry.activeStopIndex !== null) {
      setAnnouncement(
        `${EVALUATION_STOPS[nextTelemetry.activeStopIndex].label} reached`,
      )
    } else {
      setAnnouncement('')
    }
  }, [])

  const handleMove = useCallback((direction) => {
    applyDirectionalInput(movementRef.current, direction)
  }, [])

  return (
    <main className="prototype-shell">
      <div className="prototype-scene" aria-hidden="true">
        <Canvas
          shadows="percentage"
          camera={{
            fov: 52,
            near: 0.1,
            far: 120,
          }}
          dpr={[1, 1.5]}
          gl={{ antialias: true, powerPreference: 'high-performance' }}
        >
          <color attach="background" args={['#080d14']} />
          <ambientLight intensity={1.4} />
          <directionalLight position={[5, 9, 4]} intensity={2.2} />
          <PrototypeEnvironment />
          <PathCamera
            movementRef={movementRef}
            onTelemetry={handleTelemetry}
          />
        </Canvas>
      </div>

      <PrototypeInterface
        activeStopIndex={telemetry.activeStopIndex}
        progress={telemetry.progress}
        reducedMotionEnabled={reducedMotionEnabled}
        onReducedMotionChange={setReducedMotionEnabled}
        onMoveBackward={() => handleMove(-1)}
        onMoveForward={() => handleMove(1)}
      />

      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>

      <section className="sr-only" aria-labelledby="evaluation-stops-heading">
        <h2 id="evaluation-stops-heading">Evaluation stops</h2>
        <ol>
          {EVALUATION_STOPS.map((stop) => (
            <li key={stop.label}>{stop.label}</li>
          ))}
        </ol>
      </section>
    </main>
  )
}

export default App
