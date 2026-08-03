import {
  useCallback,
  useEffect,
  useReducer,
  useRef,
  useState,
} from 'react'
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
  audioStories,
  books,
  socialContent,
  socialLinks,
} from './content/portfolioContent'
import { AboutDetailOverlay } from './final-route/AboutDetailOverlay'
import { AudioStoryDetailOverlay } from './final-route/AudioStoryDetailOverlay'
import { BookDetailOverlay } from './final-route/BookDetailOverlay'
import { ContextualContentControls } from './final-route/ContextualContentControls'
import { FinalPrototypeEnvironment } from './final-route/FinalPrototypeEnvironment'
import { FocusedBookFrame } from './final-route/FocusedBookFrame'
import {
  BOOK_FOCUS_INITIAL_STATE,
  reduceBookFocus,
} from './final-route/bookFocusState'
import {
  getReturnFocusTarget,
  isAudioSurfaceInteractionEnabled,
  isProjectSurfaceInteractionEnabled,
  isSocialSurfaceInteractionEnabled,
} from './final-route/interactionState'
import { SocialDetailOverlay } from './final-route/SocialDetailOverlay'

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
  const bookFocusTriggerRef = useRef(null)
  const [reducedMotionEnabled, setReducedMotionEnabled] = useState(() =>
    window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  const [telemetry, setTelemetry] = useState({
    progress: INITIAL_PROGRESS,
    activeStopIndex: null,
  })
  const [announcement, setAnnouncement] = useState('')
  const [activeContent, setActiveContent] = useState(null)
  const [archiveIndexOpen, setArchiveIndexOpen] = useState(false)
  const [bookFocus, dispatchBookFocus] = useReducer(
    reduceBookFocus,
    BOOK_FOCUS_INITIAL_STATE,
  )

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
    const activeStop =
      nextTelemetry.activeStopIndex === null
        ? null
        : EVALUATION_STOPS[nextTelemetry.activeStopIndex]

    setAnnouncement(activeStop ? `${activeStop.label} reached` : '')
  }, [])

  const handleMove = useCallback((direction) => {
    applyDirectionalInput(movementRef.current, direction)
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

  const handleBookSelect = useCallback((bookId, trigger = null) => {
    const book = getContentRecord('book', bookId)

    if (!book) {
      return
    }

    bookFocusTriggerRef.current =
      trigger && typeof trigger.focus === 'function' ? trigger : null
    setTravelLocked(movementRef.current, true)
    dispatchBookFocus({ type: 'focus', bookId })
    setAnnouncement(`${book.title} focused`)
  }, [])

  const handleBookDetailsOpen = useCallback(
    (trigger = null) => {
      const book = getContentRecord('book', bookFocus.bookId)

      if (!book) {
        return
      }

      contentTriggerRef.current =
        trigger && typeof trigger.focus === 'function' ? trigger : null
      dispatchBookFocus({ type: 'open-detail' })
      setAnnouncement(`${book.title} opened`)
    },
    [bookFocus.bookId],
  )

  const handleBookDetailClose = useCallback(() => {
    const book = getContentRecord('book', bookFocus.bookId)

    if (!bookFocus.detailOpen || !book) {
      return
    }

    dispatchBookFocus({ type: 'close-detail' })
    setAnnouncement(`${book.title} returned to focused cover`)

    window.requestAnimationFrame(() => {
      const focusTarget = getReturnFocusTarget(
        contentTriggerRef.current,
        document.querySelector('.book-focus-cover-button'),
        document.querySelector('.direction-button'),
      )

      focusTarget?.focus()
      contentTriggerRef.current = null
    })
  }, [bookFocus.bookId, bookFocus.detailOpen])

  const handleBookFocusClose = useCallback(() => {
    const book = getContentRecord('book', bookFocus.bookId)

    if (!book) {
      return
    }

    const closingBookId = book.id
    dispatchBookFocus({ type: 'close' })
    setTravelLocked(movementRef.current, false)
    setAnnouncement(`${book.title} closed. Route position restored.`)

    window.requestAnimationFrame(() => {
      const fallbackTrigger = document.querySelector(
        `[data-book-id="${closingBookId}"]`,
      )
      const focusTarget = getReturnFocusTarget(
        bookFocusTriggerRef.current,
        fallbackTrigger,
        document.querySelector('.direction-button'),
      )

      focusTarget?.focus()
      bookFocusTriggerRef.current = null
    })
  }, [bookFocus.bookId])

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

  const focusedBook = bookFocus.bookId
    ? getContentRecord('book', bookFocus.bookId)
    : null
  const activeBook = bookFocus.detailOpen ? focusedBook : null
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
  const interactionLocked =
    activeContent !== null || bookFocus.bookId !== null

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
              audioInteractionEnabled={audioSurfaceInteractionEnabled}
              bookInteractionEnabled={bookSurfaceInteractionEnabled}
              onAboutOpen={handleAboutOpen}
              onAudioStorySelect={handleAudioStorySelect}
              onBookSelect={handleBookSelect}
              onSocialOpen={handleSocialOpen}
              reducedMotionEnabled={reducedMotionEnabled}
              socialInteractionEnabled={socialSurfaceInteractionEnabled}
            />
            <PathCamera
              movementRef={movementRef}
              onTelemetry={handleTelemetry}
            />
          </Canvas>
        </div>

        <PrototypeInterface
          activeStopIndex={telemetry.activeStopIndex}
          archiveIndexOpen={archiveIndexOpen}
          interactionLocked={interactionLocked}
          progress={telemetry.progress}
          reducedMotionEnabled={reducedMotionEnabled}
          onArchiveIndexToggle={() =>
            setArchiveIndexOpen((isOpen) => !isOpen)
          }
          onMoveBackward={() => handleMove(-1)}
          onMoveForward={() => handleMove(1)}
          onReducedMotionChange={setReducedMotionEnabled}
        />

        <ContextualContentControls
          activeStopId={activeStopId}
          archiveIndexOpen={archiveIndexOpen}
          interactionLocked={interactionLocked}
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

      {aboutOpen && (
        <AboutDetailOverlay
          about={aboutContent}
          onClose={handleContentClose}
        />
      )}

      {focusedBook && !bookFocus.detailOpen && (
        <FocusedBookFrame
          book={focusedBook}
          onClose={handleBookFocusClose}
          onOpenDetails={handleBookDetailsOpen}
          reducedMotionEnabled={reducedMotionEnabled}
        />
      )}

      {activeBook && (
        <BookDetailOverlay
          book={activeBook}
          onClose={handleBookDetailClose}
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
    </main>
  )
}

export default App
