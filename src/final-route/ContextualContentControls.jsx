import {
  audioStories,
  books,
  socialContent,
  socialLinks,
} from '../content/portfolioContent'
import { getContextualPanelId } from './interactionState'

function SocialLinkControl({ socialLink }) {
  return (
    <a
      href={socialLink.href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${socialLink.label}, ouvrir le lien externe`}
    >
      <span>{socialLink.label}</span>
      <small>{socialLink.description}</small>
    </a>
  )
}

function BookControls({ onBookSelect }) {
  return (
    <div className="content-access-actions">
      {books.map((book) => (
        <button
          key={book.id}
          type="button"
          data-book-id={book.id}
          onClick={(event) =>
            onBookSelect(book.id, event.currentTarget)
          }
        >
          <span>{book.title}</span>
          <small>{book.author}</small>
        </button>
      ))}
    </div>
  )
}

function AudioStoryControls({ onAudioStorySelect }) {
  return (
    <div className="content-access-actions">
      {audioStories.map((story) => (
        <button
          key={story.id}
          type="button"
          data-audio-story-id={story.id}
          onClick={(event) =>
            onAudioStorySelect(story.id, event.currentTarget)
          }
        >
          <span>{story.title}</span>
          <small>Ouvrir l’archive d’écoute</small>
        </button>
      ))}
    </div>
  )
}

function SocialControls({ onSocialOpen }) {
  return (
    <>
      <button
        type="button"
        className="content-primary-action"
        data-social-trigger
        onClick={(event) => onSocialOpen(event.currentTarget)}
      >
        Ouvrir les réseaux sociaux
      </button>
      <div className="content-access-actions">
        {socialLinks.map((socialLink) => (
          <SocialLinkControl
            key={socialLink.id}
            socialLink={socialLink}
          />
        ))}
      </div>
    </>
  )
}

function ArchiveIndex({
  onAudioStorySelect,
  onBookSelect,
  onSocialOpen,
}) {
  return (
    <nav
      id="archive-index-panel"
      className="content-access-panel content-access-panel-wide"
      aria-labelledby="archive-access-title"
    >
      <p className="content-access-kicker">Accès direct</p>
      <h2 id="archive-access-title">Archives du portfolio</h2>
      <div className="content-access-groups">
        <section>
          <h3>LIVRES</h3>
          <BookControls onBookSelect={onBookSelect} />
        </section>
        <section>
          <h3>HISTOIRES AUDIOS</h3>
          <AudioStoryControls onAudioStorySelect={onAudioStorySelect} />
        </section>
        <section>
          <h3>RESEAUX SOCIAUX</h3>
          <button
            type="button"
            className="content-primary-action"
            data-social-trigger
            onClick={(event) => onSocialOpen(event.currentTarget)}
          >
            Ouvrir les réseaux sociaux
          </button>
        </section>
      </div>
    </nav>
  )
}

export function ContextualContentControls({
  activeStopId,
  archiveIndexOpen,
  interactionLocked,
  onAudioStorySelect,
  onBookSelect,
  onSocialOpen,
}) {
  const panelId = getContextualPanelId(
    activeStopId,
    archiveIndexOpen,
    interactionLocked,
  )

  if (panelId === 'archive') {
    return (
      <ArchiveIndex
        onAudioStorySelect={onAudioStorySelect}
        onBookSelect={onBookSelect}
        onSocialOpen={onSocialOpen}
      />
    )
  }

  if (panelId === 'books') {
    return (
      <nav
        className="content-access-panel"
        aria-labelledby="book-access-title"
      >
        <p className="content-access-kicker">Galerie de lecture</p>
        <h2 id="book-access-title">LIVRES</h2>
        <BookControls onBookSelect={onBookSelect} />
      </nav>
    )
  }

  if (panelId === 'audio') {
    return (
      <nav
        className="content-access-panel"
        aria-labelledby="audio-access-title"
      >
        <p className="content-access-kicker">Galerie d’écoute</p>
        <h2 id="audio-access-title">HISTOIRES AUDIOS</h2>
        <AudioStoryControls onAudioStorySelect={onAudioStorySelect} />
      </nav>
    )
  }

  if (panelId === 'social') {
    return (
      <nav
        className="content-access-panel"
        aria-labelledby="social-access-title"
      >
        <p className="content-access-kicker">Correspondances</p>
        <h2 id="social-access-title">{socialContent.title}</h2>
        <p>{socialContent.summary}</p>
        <SocialControls onSocialOpen={onSocialOpen} />
      </nav>
    )
  }

  return null
}
