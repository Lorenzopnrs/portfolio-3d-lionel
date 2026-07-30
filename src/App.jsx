import { useCallback, useEffect, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import './App.css'
import { EVALUATION_STOPS, INITIAL_PROGRESS } from './prototype/cameraPath'
import {
  applyDirectionalInput,
  createMovementState,
  setReducedMotion,
  setTravelLocked,
} from './prototype/movementController'
import { PathCamera } from './prototype/PathCamera'
import { PrototypeInterface } from './prototype/PrototypeInterface'
import { usePathControls } from './prototype/usePathControls'
import {
  aboutContent,
  contactContent,
  projects,
  socialLinks,
} from './content/portfolioContent'
import { ContextualContentControls } from './final-route/ContextualContentControls'
import { FinalPrototypeEnvironment } from './final-route/FinalPrototypeEnvironment'
import {
  getReturnFocusTarget,
  isProjectSurfaceInteractionEnabled,
  shouldOpenProjectIndex,
} from './final-route/interactionState'
import { AboutDetailOverlay } from './final-route/AboutDetailOverlay'
import { ProjectDetailOverlay } from './final-route/ProjectDetailOverlay'

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
  const [aboutOpen, setAboutOpen] = useState(false)
  const [activeProjectId, setActiveProjectId] = useState(null)
  const [projectIndexOpen, setProjectIndexOpen] = useState(false)
  const aboutTriggerRef = useRef(null)
  const projectTriggerRef = useRef(null)

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

  const handleTelemetry = useCallback(
    (nextTelemetry) => {
      setTelemetry(nextTelemetry)
      const activeStop =
        nextTelemetry.activeStopIndex === null
          ? null
          : EVALUATION_STOPS[nextTelemetry.activeStopIndex]

      if (activeStop) {
        setAnnouncement(`${activeStop.label} reached`)

        if (
          shouldOpenProjectIndex(
            reducedMotionEnabled,
            activeStop.id,
          )
        ) {
          setProjectIndexOpen(true)
        }
      } else {
        setAnnouncement('')
      }
    },
    [reducedMotionEnabled],
  )

  const handleMove = useCallback((direction) => {
    applyDirectionalInput(movementRef.current, direction)
  }, [])

  const handleProjectSelect = useCallback((projectId, trigger = null) => {
    if (!projects.some((project) => project.id === projectId)) {
      return
    }

    projectTriggerRef.current =
      trigger instanceof HTMLElement ? trigger : null
    setTravelLocked(movementRef.current, true)
    setActiveProjectId(projectId)
    setAnnouncement(`${projectId} opened`)
  }, [])

  const handleProjectClose = useCallback(() => {
    const projectId = activeProjectId
    setTravelLocked(movementRef.current, false)
    setActiveProjectId(null)
    setAnnouncement(`${projectId} closed. Route position restored.`)

    window.requestAnimationFrame(() => {
      const fallbackTrigger = projectId
        ? document.querySelector(
            `[data-project-id="${projectId}"]`,
          )
        : null
      const focusTarget = getReturnFocusTarget(
        projectTriggerRef.current,
        fallbackTrigger,
        document.querySelector('.direction-button'),
      )

      focusTarget?.focus()
      projectTriggerRef.current = null
    })
  }, [activeProjectId])

  const handleAboutOpen = useCallback((trigger = null) => {
    aboutTriggerRef.current =
      trigger instanceof HTMLElement ? trigger : null
    setTravelLocked(movementRef.current, true)
    setAboutOpen(true)
    setAnnouncement('About me opened')
  }, [])

  const handleAboutClose = useCallback(() => {
    setTravelLocked(movementRef.current, false)
    setAboutOpen(false)
    setAnnouncement('About me closed. Route position restored.')

    window.requestAnimationFrame(() => {
      const focusTarget = getReturnFocusTarget(
        aboutTriggerRef.current,
        document.querySelector('[data-about-trigger]'),
        document.querySelector('.direction-button'),
      )

      focusTarget?.focus()
      aboutTriggerRef.current = null
    })
  }, [])

  const activeProject =
    projects.find((project) => project.id === activeProjectId) ?? null
  const activeStopId =
    telemetry.activeStopIndex === null
      ? null
      : EVALUATION_STOPS[telemetry.activeStopIndex].id
  const projectSurfaceInteractionEnabled =
    isProjectSurfaceInteractionEnabled(telemetry.progress)
  const interactionLocked = activeProject !== null || aboutOpen

  return (
    <main className="prototype-shell">
      <div
        className="experience-layer"
        inert={interactionLocked}
        aria-hidden={interactionLocked}
      >
        <div className="prototype-scene">
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
            <color attach="background" args={['#0d0c0a']} />
            <fog attach="fog" args={['#0d0c0a', 22, 64]} />
            <ambientLight color="#91887c" intensity={1.7} />
            <directionalLight
              color="#a89d8c"
              position={[5, 9, 4]}
              intensity={1.78}
            />
            <FinalPrototypeEnvironment
              onAboutOpen={handleAboutOpen}
              onProjectSelect={handleProjectSelect}
              projectInteractionEnabled={projectSurfaceInteractionEnabled}
              reducedMotionEnabled={reducedMotionEnabled}
            />
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
          interactionLocked={interactionLocked}
          projectIndexOpen={projectIndexOpen}
          onReducedMotionChange={setReducedMotionEnabled}
          onMoveBackward={() => handleMove(-1)}
          onMoveForward={() => handleMove(1)}
          onProjectIndexToggle={() =>
            setProjectIndexOpen((isOpen) => !isOpen)
          }
        />

        <ContextualContentControls
          activeStopId={activeStopId}
          interactionLocked={interactionLocked}
          onProjectSelect={handleProjectSelect}
          projectIndexOpen={projectIndexOpen}
        />

        <p className="sr-only" aria-live="polite">
          {announcement}
        </p>

        <section
          className="sr-only"
          aria-labelledby="evaluation-stops-heading"
        >
          <h2 id="evaluation-stops-heading">Evaluation stops</h2>
          <ol>
            {EVALUATION_STOPS.map((stop) => (
              <li key={stop.label}>{stop.label}</li>
            ))}
          </ol>
        </section>

        <section
          className="sr-only"
          aria-labelledby="project-index-heading"
        >
          <h2 id="project-index-heading">Project index</h2>
          <ol>
            {projects.map((project) => (
              <li key={project.id}>
                <h3>{project.title}</h3>
                <p>{project.shortSummary}</p>
              </li>
            ))}
          </ol>
        </section>

        <section
          className="sr-only"
          aria-labelledby="route-content-heading"
        >
          <h2 id="route-content-heading">Route content</h2>
          <h3>{aboutContent.title}</h3>
          <p>{aboutContent.summary}</p>
          <h3>Social Networks</h3>
          <ul>
            {socialLinks.map((socialLink) => (
              <li key={socialLink.id}>{socialLink.label}</li>
            ))}
          </ul>
          <h3>{contactContent.title}</h3>
          <p>{contactContent.summary}</p>
        </section>
      </div>

      {activeProject && (
        <ProjectDetailOverlay
          project={activeProject}
          onClose={handleProjectClose}
        />
      )}

      {aboutOpen && (
        <AboutDetailOverlay
          about={aboutContent}
          onClose={handleAboutClose}
        />
      )}
    </main>
  )
}

export default App
