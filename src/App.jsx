import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import { Canvas } from '@react-three/fiber'
import './App.css'
import { ExperienceLoader } from './performance/ExperienceLoader'
import { PerformanceController } from './performance/PerformanceController'
import {
  QUALITY_PREFERENCE_STORAGE_KEY,
  QUALITY_SETTINGS,
  detectInitialAutomaticQuality,
  getEffectiveQuality,
  normalizeQualityPreference,
} from './performance/qualitySettings'
import {
  INITIAL_ROUTE_SECTION_VISIBILITY,
  resolveRouteSectionVisibility,
} from './performance/sectionVisibility'
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
  audioStories,
  books,
  socialContent,
  socialLinks,
} from './content/portfolioContent'
import { ContextualContentControls } from './final-route/ContextualContentControls'
import { FinalPrototypeEnvironment } from './final-route/FinalPrototypeEnvironment'
import {
  getReturnFocusTarget,
  isAudioSurfaceInteractionEnabled,
  isProjectSurfaceInteractionEnabled,
  isSocialSurfaceInteractionEnabled,
} from './final-route/interactionState'
const AboutDetailOverlay = lazy(() =>
  import('./final-route/AboutDetailOverlay').then((module) => ({
    default: module.AboutDetailOverlay,
  })),
)
const AudioStoryDetailOverlay = lazy(() =>
  import('./final-route/AudioStoryDetailOverlay').then((module) => ({
    default: module.AudioStoryDetailOverlay,
  })),
)
const BookDetailOverlay = lazy(() =>
  import('./final-route/BookDetailOverlay').then((module) => ({
    default: module.BookDetailOverlay,
  })),
)
const SocialDetailOverlay = lazy(() =>
  import('./final-route/SocialDetailOverlay').then((module) => ({
    default: module.SocialDetailOverlay,
  })),
)

function getAutomaticQualityRecommendation() {
  return detectInitialAutomaticQuality({
    deviceMemory: navigator.deviceMemory,
    hardwareConcurrency: navigator.hardwareConcurrency,
    viewportWidth: window.innerWidth,
  })
}

function getStoredQualityPreference() {
  try {
    return normalizeQualityPreference(
      window.localStorage.getItem(QUALITY_PREFERENCE_STORAGE_KEY),
    )
  } catch {
    return 'automatic'
  }
}

function getContentRecord(contentType, contentId) {
  if (contentType === 'about' && contentId === aboutContent.id) {
    return aboutContent
  }

  if (contentType === 'book') {
    return books.find((book) => book.id === contentId) ?? null
  }

  if (contentType === 'audio-story') {
    return audioStories.find((story) => story.id === contentId) ?? null
  }

  if (contentType === 'social' && contentId === socialContent.id) {
    return socialContent
  }

  return null
}

function getContentTriggerSelector(content) {
  if (content.type === 'about') {
    return '[data-about-trigger]'
  }

  if (content.type === 'book') {
    return `[data-book-id="${content.id}"]`
  }

  if (content.type === 'audio-story') {
    return `[data-audio-story-id="${content.id}"]`
  }

  if (content.type === 'social') {
    return '[data-social-trigger]'
  }

  return null
}

function App() {
  const movementRef = useRef(createMovementState())
  const contentTriggerRef = useRef(null)
  const entranceMovementInitializedRef = useRef(false)
  const [performanceDebugEnabled] = useState(() =>
    new URLSearchParams(window.location.search).has('perf'),
  )
  const [reducedMotionEnabled, setReducedMotionEnabled] = useState(() =>
    window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  const [telemetry, setTelemetry] = useState({
    progress: INITIAL_PROGRESS,
    activeStopIndex: null,
    sectionVisibility: INITIAL_ROUTE_SECTION_VISIBILITY,
  })
  const [announcement, setAnnouncement] = useState('')
  const [activeContent, setActiveContent] = useState(null)
  const [archiveIndexOpen, setArchiveIndexOpen] = useState(false)
  const [entranceReady, setEntranceReady] = useState(false)
  const [documentVisible, setDocumentVisible] = useState(!document.hidden)
  const [qualityPreference, setQualityPreference] = useState(
    getStoredQualityPreference,
  )
  const [automaticQuality, setAutomaticQuality] = useState(
    getAutomaticQualityRecommendation,
  )
  const [performanceMetrics, setPerformanceMetrics] = useState(null)

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

  useEffect(() => {
    const handleVisibilityChange = () => {
      setDocumentVisible(!document.hidden)
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener(
        'visibilitychange',
        handleVisibilityChange,
      )
    }
  }, [])

  const handleTelemetry = useCallback((nextTelemetry) => {
    setTelemetry((currentTelemetry) => ({
      ...nextTelemetry,
      sectionVisibility: resolveRouteSectionVisibility(
        currentTelemetry.sectionVisibility,
        nextTelemetry.progress,
      ),
    }))
    const activeStop =
      nextTelemetry.activeStopIndex === null
        ? null
        : EVALUATION_STOPS[nextTelemetry.activeStopIndex]

    setAnnouncement(activeStop ? `${activeStop.label} reached` : '')
  }, [])

  const handleMove = useCallback((direction) => {
    applyDirectionalInput(movementRef.current, direction)
  }, [])

  const handleEntranceReady = useCallback(() => {
    setEntranceReady(true)
  }, [])

  const handleQualityPreferenceChange = useCallback((nextPreference) => {
    const normalizedPreference = normalizeQualityPreference(nextPreference)
    setQualityPreference(normalizedPreference)

    if (normalizedPreference === 'automatic') {
      setAutomaticQuality(getAutomaticQualityRecommendation())
    }

    try {
      window.localStorage.setItem(
        QUALITY_PREFERENCE_STORAGE_KEY,
        normalizedPreference,
      )
    } catch {
      return
    }
  }, [])

  const handleContentOpen = useCallback(
    (contentType, contentId, trigger = null) => {
      const contentRecord = getContentRecord(contentType, contentId)

      if (!contentRecord) {
        return
      }

      contentTriggerRef.current =
        trigger && typeof trigger.focus === 'function' ? trigger : null
      setTravelLocked(movementRef.current, true)
      setActiveContent({ id: contentId, type: contentType })
      setAnnouncement(`${contentRecord.title} opened`)
    },
    [],
  )

  const handleContentClose = useCallback(() => {
    if (!activeContent) {
      return
    }

    const closingContent = activeContent
    const contentRecord = getContentRecord(
      closingContent.type,
      closingContent.id,
    )
    setTravelLocked(movementRef.current, false)
    setActiveContent(null)
    setAnnouncement(
      `${contentRecord?.title ?? 'Archive'} closed. Route position restored.`,
    )

    window.requestAnimationFrame(() => {
      const fallbackSelector = getContentTriggerSelector(closingContent)
      const fallbackTrigger = fallbackSelector
        ? document.querySelector(fallbackSelector)
        : null
      const focusTarget = getReturnFocusTarget(
        contentTriggerRef.current,
        fallbackTrigger,
        document.querySelector('.direction-button'),
      )

      focusTarget?.focus()
      contentTriggerRef.current = null
    })
  }, [activeContent])

  const handleAboutOpen = useCallback(
    (trigger = null) =>
      handleContentOpen('about', aboutContent.id, trigger),
    [handleContentOpen],
  )

  const handleBookSelect = useCallback(
    (bookId, trigger = null) =>
      handleContentOpen('book', bookId, trigger),
    [handleContentOpen],
  )

  const handleAudioStorySelect = useCallback(
    (storyId, trigger = null) =>
      handleContentOpen('audio-story', storyId, trigger),
    [handleContentOpen],
  )

  const handleSocialOpen = useCallback(
    (trigger = null) =>
      handleContentOpen('social', socialContent.id, trigger),
    [handleContentOpen],
  )

  const activeBook =
    activeContent?.type === 'book'
      ? getContentRecord(activeContent.type, activeContent.id)
      : null
  const activeAudioStory =
    activeContent?.type === 'audio-story'
      ? getContentRecord(activeContent.type, activeContent.id)
      : null
  const aboutOpen = activeContent?.type === 'about'
  const socialOpen = activeContent?.type === 'social'
  const activeStopId =
    telemetry.activeStopIndex === null
      ? null
      : EVALUATION_STOPS[telemetry.activeStopIndex].id
  const bookSurfaceInteractionEnabled =
    isProjectSurfaceInteractionEnabled(telemetry.progress)
  const audioSurfaceInteractionEnabled =
    isAudioSurfaceInteractionEnabled(telemetry.progress)
  const socialSurfaceInteractionEnabled =
    isSocialSurfaceInteractionEnabled(telemetry.progress)
  const interactionLocked = activeContent !== null
  const controlsLocked = interactionLocked || !entranceReady
  const renderingPaused = interactionLocked || !documentVisible
  const qualityLevel = getEffectiveQuality(
    qualityPreference,
    automaticQuality,
  )
  const qualitySettings = QUALITY_SETTINGS[qualityLevel]

  useEffect(() => {
    setTravelLocked(movementRef.current, controlsLocked)
  }, [controlsLocked])

  useEffect(() => {
    if (!entranceReady || entranceMovementInitializedRef.current) {
      return
    }

    entranceMovementInitializedRef.current = true
    setTravelLocked(movementRef.current, false)

    if (reducedMotionEnabled) {
      setReducedMotion(movementRef.current, true)
    }
  }, [entranceReady, reducedMotionEnabled])

  return (
    <main
      className={`prototype-shell${renderingPaused ? ' is-render-paused' : ''}`}
      aria-busy={!entranceReady}
    >
      <div
        className="experience-layer"
        inert={controlsLocked}
        aria-hidden={controlsLocked}
      >
        <div className="prototype-scene">
          <Canvas
            shadows="percentage"
            camera={{
              fov: 52,
              near: 0.1,
              far: 120,
            }}
            dpr={qualitySettings.dpr}
            frameloop={renderingPaused ? 'demand' : 'always'}
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
              audioInteractionEnabled={audioSurfaceInteractionEnabled}
              bookInteractionEnabled={bookSurfaceInteractionEnabled}
              entranceReady={entranceReady}
              onAboutOpen={handleAboutOpen}
              onAudioStorySelect={handleAudioStorySelect}
              onBookSelect={handleBookSelect}
              onEntranceReady={handleEntranceReady}
              onSocialOpen={handleSocialOpen}
              progress={telemetry.progress}
              qualityLevel={qualityLevel}
              reducedMotionEnabled={reducedMotionEnabled}
              sectionVisibility={telemetry.sectionVisibility}
              socialInteractionEnabled={socialSurfaceInteractionEnabled}
            />
            <PathCamera
              movementRef={movementRef}
              onTelemetry={handleTelemetry}
            />
            <PerformanceController
              interactionLocked={controlsLocked}
              onAutomaticQualityChange={setAutomaticQuality}
              onMetrics={
                performanceDebugEnabled
                  ? setPerformanceMetrics
                  : undefined
              }
              qualityLevel={qualityLevel}
              qualityPreference={qualityPreference}
            />
          </Canvas>
        </div>

        <PrototypeInterface
          activeStopIndex={telemetry.activeStopIndex}
          archiveIndexOpen={archiveIndexOpen}
          interactionLocked={controlsLocked}
          progress={telemetry.progress}
          qualityLevel={qualityLevel}
          qualityPreference={qualityPreference}
          reducedMotionEnabled={reducedMotionEnabled}
          onArchiveIndexToggle={() =>
            setArchiveIndexOpen((isOpen) => !isOpen)
          }
          onMoveBackward={() => handleMove(-1)}
          onMoveForward={() => handleMove(1)}
          onQualityPreferenceChange={handleQualityPreferenceChange}
          onReducedMotionChange={setReducedMotionEnabled}
        />

        <ContextualContentControls
          activeStopId={activeStopId}
          archiveIndexOpen={archiveIndexOpen}
          interactionLocked={controlsLocked}
          onAudioStorySelect={handleAudioStorySelect}
          onBookSelect={handleBookSelect}
          onSocialOpen={handleSocialOpen}
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
          aria-labelledby="route-content-heading"
        >
          <h2 id="route-content-heading">Portfolio content</h2>
          <h3>{aboutContent.title}</h3>
          {aboutContent.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
          <h3>LIVRES</h3>
          <ol>
            {books.map((book) => (
              <li key={book.id}>
                {book.title}, {book.author}. {book.summary}
              </li>
            ))}
          </ol>
          <h3>HISTOIRES AUDIOS</h3>
          <ol>
            {audioStories.map((story) => (
              <li key={story.id}>
                {story.title}. {story.summary}
              </li>
            ))}
          </ol>
          <h3>{socialContent.title}</h3>
          <ul>
            {socialLinks.map((socialLink) => (
              <li key={socialLink.id}>
                {socialLink.label}: {socialLink.href}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <ExperienceLoader entranceReady={entranceReady} />

      {performanceDebugEnabled && performanceMetrics && (
        <output id="runtime-performance" className="sr-only">
          {JSON.stringify({
            ...performanceMetrics,
            qualityLevel,
            qualityPreference,
          })}
        </output>
      )}

      <Suspense
        fallback={
          <div className="content-loading-fallback" role="status">
            Ouverture de l’archive…
          </div>
        }
      >
        {aboutOpen && (
          <AboutDetailOverlay
            about={aboutContent}
            onClose={handleContentClose}
          />
        )}

        {activeBook && (
          <BookDetailOverlay
            book={activeBook}
            onClose={handleContentClose}
          />
        )}

        {activeAudioStory && (
          <AudioStoryDetailOverlay
            story={activeAudioStory}
            onClose={handleContentClose}
          />
        )}

        {socialOpen && (
          <SocialDetailOverlay
            content={socialContent}
            links={socialLinks}
            onClose={handleContentClose}
          />
        )}
      </Suspense>
    </main>
  )
}

export default App
