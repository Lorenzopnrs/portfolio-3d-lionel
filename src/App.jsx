import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
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
import {
  CAMERA_FIELD_OF_VIEW,
  EVALUATION_STOPS,
  INITIAL_PROGRESS,
} from './prototype/cameraPath'
import {
  formatEventDates,
  formatEventPlace,
  selectUpcomingEvents,
} from './content/agenda.js'
import {
  applyDirectionalInput,
  createMovementState,
  resetMovementToStart,
  setReducedMotion,
  setTravelLocked,
} from './prototype/movementController'
import { PathCamera } from './prototype/PathCamera'
import { PrototypeInterface } from './prototype/PrototypeInterface'
import { usePathControls } from './prototype/usePathControls'
import { usePortfolioContent } from './content/usePortfolioContent'
import { selectFeaturedBooks } from './content/sanityContent'
import { ContextualContentControls } from './final-route/ContextualContentControls'
import { FinalPrototypeEnvironment } from './final-route/FinalPrototypeEnvironment'
import { LibraryAccessButton } from './final-route/LibraryAccessButton'
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
const AgendaOverlay = lazy(() =>
  import('./final-route/AgendaOverlay').then((module) => ({
    default: module.AgendaOverlay,
  })),
)
const SocialDetailOverlay = lazy(() =>
  import('./final-route/SocialDetailOverlay').then((module) => ({
    default: module.SocialDetailOverlay,
  })),
)
const FullLibraryOverlay = lazy(() =>
  import('./final-route/FullLibraryOverlay').then((module) => ({
    default: module.FullLibraryOverlay,
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

const AGENDA_RECORD = Object.freeze({ id: 'agenda', title: 'Agenda' })

function getContentRecord(content, contentType, contentId) {
  if (contentType === 'agenda') {
    return AGENDA_RECORD
  }

  if (contentType === 'about' && contentId === content.about.id) {
    return content.about
  }

  if (contentType === 'book') {
    return content.books.find((book) => book.id === contentId) ?? null
  }

  if (contentType === 'audio-story') {
    return (
      content.audioStories.find((story) => story.id === contentId) ??
      null
    )
  }

  if (
    contentType === 'social' &&
    contentId === content.socialContent.id
  ) {
    return content.socialContent
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

  if (content.type === 'agenda') {
    return '[data-agenda-trigger]'
  }

  return null
}

function App() {
  const { content: portfolioContent, settled: contentSettled } =
    usePortfolioContent()
  const {
    about: aboutContent,
    agendaEvents,
    audioStories,
    books,
    socialContent,
    socialLinks,
  } = portfolioContent
  const featuredBooks = useMemo(
    () => selectFeaturedBooks(books),
    [books],
  )
  const upcomingEvents = useMemo(
    () => selectUpcomingEvents(agendaEvents),
    [agendaEvents],
  )
  const movementRef = useRef(createMovementState())
  const contentTriggerRef = useRef(null)
  const libraryTriggerRef = useRef(null)
  const loopTransitionRef = useRef(false)
  const loopTimersRef = useRef([])
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
  const [libraryOpen, setLibraryOpen] = useState(false)
  const [loopTransitionActive, setLoopTransitionActive] = useState(false)
  const [archiveIndexOpen, setArchiveIndexOpen] = useState(false)
  const [entranceReady, setEntranceReady] = useState(false)
  const [documentVisible, setDocumentVisible] = useState(!document.hidden)
  const [qualityPreference, setQualityPreference] = useState(
    getStoredQualityPreference,
  )
  const [automaticQuality, setAutomaticQuality] = useState(
    getAutomaticQualityRecommendation,
  )
  const [initialAutomaticQuality] = useState(automaticQuality)
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

  useEffect(
    () => () => {
      loopTimersRef.current.forEach((timer) => window.clearTimeout(timer))
    },
    [],
  )

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

  const handleLoopActivate = useCallback(() => {
    if (loopTransitionRef.current) {
      return
    }

    loopTransitionRef.current = true
    setLoopTransitionActive(true)
    setTravelLocked(movementRef.current, true)
    setArchiveIndexOpen(false)
    setAnnouncement('Retour au début du portfolio')

    const resetDelay = reducedMotionEnabled ? 100 : 360
    const transitionDuration = reducedMotionEnabled ? 260 : 820
    const resetTimer = window.setTimeout(() => {
      resetMovementToStart(movementRef.current)
      setTelemetry({
        progress: INITIAL_PROGRESS,
        activeStopIndex: null,
        sectionVisibility: INITIAL_ROUTE_SECTION_VISIBILITY,
      })
    }, resetDelay)
    const finishTimer = window.setTimeout(() => {
      loopTransitionRef.current = false
      setLoopTransitionActive(false)
      setAnnouncement('Début du portfolio retrouvé')

      window.requestAnimationFrame(() => {
        document.querySelector('.direction-button')?.focus()
      })
    }, transitionDuration)

    loopTimersRef.current = [resetTimer, finishTimer]
  }, [reducedMotionEnabled])

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
      const contentRecord = getContentRecord(
        portfolioContent,
        contentType,
        contentId,
      )

      if (!contentRecord) {
        return
      }

      contentTriggerRef.current =
        trigger && typeof trigger.focus === 'function' ? trigger : null
      setTravelLocked(movementRef.current, true)
      setActiveContent({ id: contentId, type: contentType })
      setAnnouncement(`${contentRecord.title} opened`)
    },
    [portfolioContent],
  )

  const handleContentClose = useCallback(() => {
    if (!activeContent) {
      return
    }

    const closingContent = activeContent
    const contentRecord = getContentRecord(
      portfolioContent,
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
  }, [activeContent, portfolioContent])

  const handleLibraryOpen = useCallback((trigger) => {
    libraryTriggerRef.current = trigger
    setTravelLocked(movementRef.current, true)
    setArchiveIndexOpen(false)
    setLibraryOpen(true)
    setAnnouncement('Bibliothèque complète ouverte')
  }, [])

  const handleLibraryClose = useCallback(() => {
    setTravelLocked(movementRef.current, false)
    setLibraryOpen(false)
    setAnnouncement(
      'Bibliothèque fermée. Position dans le corridor restaurée.',
    )

    window.requestAnimationFrame(() => {
      const focusTarget = getReturnFocusTarget(
        libraryTriggerRef.current,
        document.querySelector('[data-library-trigger]'),
        document.querySelector('.direction-button'),
      )

      focusTarget?.focus()
      libraryTriggerRef.current = null
    })
  }, [])

  const handleAboutOpen = useCallback(
    (trigger = null) =>
      handleContentOpen('about', aboutContent.id, trigger),
    [aboutContent.id, handleContentOpen],
  )

  const handleBookSelect = useCallback(
    (bookId, trigger = null) =>
      handleContentOpen('book', bookId, trigger),
    [handleContentOpen],
  )

  const handleLibraryBookSelect = useCallback(
    (bookId, trigger) =>
      handleContentOpen('book', bookId, trigger),
    [handleContentOpen],
  )

  const handleBookDetailClose = useCallback(() => {
    if (!libraryOpen || activeContent?.type !== 'book') {
      handleContentClose()
      return
    }

    const closingBook = activeContent
    setActiveContent(null)
    setAnnouncement('Retour à la bibliothèque complète')

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        document
          .querySelector(
            `[data-library-book-id="${closingBook.id}"]`,
          )
          ?.focus()
      })
    })
  }, [activeContent, handleContentClose, libraryOpen])

  const handleAudioStorySelect = useCallback(
    (storyId, trigger = null) =>
      handleContentOpen('audio-story', storyId, trigger),
    [handleContentOpen],
  )

  const handleSocialOpen = useCallback(
    (trigger = null) =>
      handleContentOpen('social', socialContent.id, trigger),
    [handleContentOpen, socialContent.id],
  )

  const handleAgendaOpen = useCallback(
    (trigger = null) =>
      handleContentOpen('agenda', AGENDA_RECORD.id, trigger),
    [handleContentOpen],
  )

  const activeBook =
    activeContent?.type === 'book'
      ? getContentRecord(
          portfolioContent,
          activeContent.type,
          activeContent.id,
        )
      : null
  const activeAudioStory =
    activeContent?.type === 'audio-story'
      ? getContentRecord(
          portfolioContent,
          activeContent.type,
          activeContent.id,
        )
      : null

  const aboutOpen = activeContent?.type === 'about'
  const socialOpen = activeContent?.type === 'social'
  const agendaOpen = activeContent?.type === 'agenda'
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
  const interactionLocked = Boolean(
    aboutOpen ||
      activeAudioStory ||
      activeBook ||
      socialOpen ||
      agendaOpen,
  )
  const controlsLocked =
    interactionLocked ||
    libraryOpen ||
    loopTransitionActive ||
    !entranceReady
  const renderingPaused =
    interactionLocked || libraryOpen || !documentVisible
  // SceneWarmup draws the first frame itself once every shader is compiled.
  const frameloop = !entranceReady
    ? 'never'
    : renderingPaused
      ? 'demand'
      : 'always'
  const qualityLevel = getEffectiveQuality(
    qualityPreference,
    automaticQuality,
  )
  // Changing the number of lights recompiles every shader, so the automatic
  // quality never does it mid-visit: only an explicit choice from the visitor.
  const lightQuality =
    qualityPreference === 'automatic'
      ? initialAutomaticQuality
      : qualityPreference
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
      data-content-source={portfolioContent.source}
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
              fov: CAMERA_FIELD_OF_VIEW,
              near: 0.1,
              far: 120,
            }}
            dpr={qualitySettings.dpr}
            frameloop={frameloop}
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
              agendaEvents={upcomingEvents}
              audioStories={audioStories}
              audioInteractionEnabled={audioSurfaceInteractionEnabled}
              contentSettled={contentSettled}
              featuredBooks={featuredBooks}
              bookInteractionEnabled={bookSurfaceInteractionEnabled}
              entranceReady={entranceReady}
              libraryAudioStories={audioStories}
              libraryBooks={books}
              lightQuality={lightQuality}
              onAboutOpen={handleAboutOpen}
              onAgendaOpen={handleAgendaOpen}
              onAudioStorySelect={handleAudioStorySelect}
              onBookSelect={handleBookSelect}
              onEntranceReady={handleEntranceReady}
              onLoopActivate={handleLoopActivate}
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
          audioStories={audioStories}
          books={books}
          interactionLocked={controlsLocked}
          onAgendaOpen={handleAgendaOpen}
          onAudioStorySelect={handleAudioStorySelect}
          onBookSelect={handleBookSelect}
          onSocialOpen={handleSocialOpen}
          socialContent={socialContent}
        />

        <LibraryAccessButton
          disabled={controlsLocked}
          onOpen={handleLibraryOpen}
          visible={activeStopId === 'library'}
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
          <h3>AGENDA</h3>
          <ol>
            {upcomingEvents.map((event) => (
              <li key={event.id}>
                {event.title}, {formatEventDates(event)},{' '}
                {formatEventPlace(event)}
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
            onClose={handleBookDetailClose}
          />
        )}

        {libraryOpen && !activeBook && (
          <FullLibraryOverlay
            books={books}
            onBookSelect={handleLibraryBookSelect}
            onClose={handleLibraryClose}
          />
        )}

        {activeAudioStory && (
          <AudioStoryDetailOverlay
            story={activeAudioStory}
            onClose={handleContentClose}
          />
        )}

        {agendaOpen && (
          <AgendaOverlay
            events={upcomingEvents}
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

      {loopTransitionActive && (
        <div
          className={`loop-transition${reducedMotionEnabled ? ' is-reduced-motion' : ''}`}
          role="status"
          aria-live="polite"
        >
          <span>Retour au seuil d’entrée</span>
        </div>
      )}
    </main>
  )
}

export default App
