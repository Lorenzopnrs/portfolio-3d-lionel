import { handleImageError } from '../assets/imageFallback.js'
import { ArchiveDialog } from './ArchiveDialog'
import {
  canRenderProjectVideo,
  getCaptionTrackSource,
  getImageAlternative,
  hasAccessibleImage,
} from './projectMedia'

export function ProjectDetailOverlay({ project, onClose }) {
  const captionTrackSource = getCaptionTrackSource(project.video)
  const projectVideoIsAccessible = canRenderProjectVideo(project.video)

  return (
    <ArchiveDialog
      className="project-detail-dialog"
      descriptionId="project-focus-summary"
      kicker={project.category}
      onClose={onClose}
      title={project.title}
      titleId="project-focus-title"
    >
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
    </ArchiveDialog>
  )
}
