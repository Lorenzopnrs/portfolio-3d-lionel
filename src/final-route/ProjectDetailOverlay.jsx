import { useEffect, useRef } from 'react'
import { handleImageError } from '../assets/imageFallback.js'
import {
  canRenderProjectVideo,
  getCaptionTrackSource,
  getImageAlternative,
  hasAccessibleImage,
} from './projectMedia'

const FOCUSABLE_SELECTOR = [
  'button:not([disabled])',
  'a[href]',
  'video[controls]',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

export function ProjectDetailOverlay({ project, onClose }) {
  const dialogRef = useRef(null)
  const closeButtonRef = useRef(null)
  const captionTrackSource = getCaptionTrackSource(project.video)
  const projectVideoIsAccessible = canRenderProjectVideo(project.video)

  useEffect(() => {
    closeButtonRef.current?.focus()

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }

      if (event.key !== 'Tab' || !dialogRef.current) {
        return
      }

      const focusableElements = [
        ...dialogRef.current.querySelectorAll(FOCUSABLE_SELECTOR),
      ]

      if (focusableElements.length === 0) {
        event.preventDefault()
        return
      }

      const firstElement = focusableElements[0]
      const lastElement = focusableElements.at(-1)

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault()
        lastElement.focus()
      } else if (
        !event.shiftKey &&
        document.activeElement === lastElement
      ) {
        event.preventDefault()
        firstElement.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div
      className="project-focus-backdrop"
      data-travel-lock
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <section
        ref={dialogRef}
        className="project-focus-view"
        role="dialog"
        aria-modal="true"
        aria-labelledby="project-focus-title"
        aria-describedby="project-focus-summary"
      >
        <header className="project-focus-header">
          <div>
            <p className="project-focus-kicker">{project.category}</p>
            <h2 id="project-focus-title">{project.title}</h2>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            className="project-focus-close"
            onClick={onClose}
            aria-label="Close project view"
            title="Close project view"
          >
            X
          </button>
        </header>

        <div className="project-focus-layout">
          <div>
            {hasAccessibleImage(project.thumbnail) ? (
              <img
                className="project-media-image"
                src={project.thumbnail.src}
                alt={project.thumbnail.alt}
                decoding="async"
                onError={handleImageError}
              />
            ) : (
              <div
                className="project-media-placeholder"
                role="img"
                aria-label={getImageAlternative(
                  project.thumbnail,
                  `Project image placeholder for ${project.title}`,
                )}
              >
                <span>Project image placeholder</span>
                <strong>{project.id}</strong>
              </div>
            )}
            <div
              className="project-image-gallery"
              aria-label="Project image gallery"
            >
              {project.imageGallery.map((image, index) =>
                hasAccessibleImage(image) ? (
                  <img
                    key={image.id}
                    src={image.src}
                    alt={image.alt}
                    decoding="async"
                    loading="lazy"
                    onError={handleImageError}
                  />
                ) : (
                  <div
                    key={image.id}
                    role="img"
                    aria-label={getImageAlternative(
                      image,
                      `Image placeholder ${String(index + 1).padStart(2, '0')} for ${project.title}`,
                    )}
                  >
                    Image placeholder{' '}
                    {String(index + 1).padStart(2, '0')}
                  </div>
                ),
              )}
            </div>
            {projectVideoIsAccessible && (
              <figure className="project-video">
                <video
                  controls
                  preload="metadata"
                  poster={project.video.poster ?? undefined}
                >
                  <source
                    src={project.video.src}
                    type={project.video.type}
                  />
                  {captionTrackSource && (
                    <track
                      default
                      kind="captions"
                      src={captionTrackSource}
                      srcLang={project.video.language ?? 'en'}
                      label={project.video.captionLabel ?? 'Captions'}
                    />
                  )}
                </video>
                {project.video.transcript && (
                  <figcaption>{project.video.transcript}</figcaption>
                )}
              </figure>
            )}
            <p id="project-focus-summary" className="project-focus-summary">
              {project.shortSummary}
            </p>
          </div>

          <div className="project-case-study">
            <section>
              <h3>Context</h3>
              <p>{project.context}</p>
            </section>
            <section>
              <h3>Role</h3>
              <p>{project.role}</p>
            </section>
            <section>
              <h3>Objective</h3>
              <p>{project.objective}</p>
            </section>
            <section>
              <h3>Process</h3>
              <ol>
                {project.process.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </section>
            <section>
              <h3>Decisions</h3>
              <ul>
                {project.decisions.map((decision) => (
                  <li key={decision}>{decision}</li>
                ))}
              </ul>
            </section>
            <section>
              <h3>Result</h3>
              <p>{project.result}</p>
            </section>
            <section>
              <h3>Outcome</h3>
              <p>{project.outcome}</p>
            </section>
          </div>
        </div>
      </section>
    </div>
  )
}
