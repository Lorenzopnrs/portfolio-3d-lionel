import { getContextualPanelId } from './interactionState'

function BookControls({ books, onBookSelect }) {
  if (books.length === 0) {
    return <p className="content-access-empty">Aucun livre publié.</p>
  }

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

function AudioStoryControls({ audioStories, onAudioStorySelect }) {
  if (audioStories.length === 0) {
    return (
      <p className="content-access-empty">
        Aucune histoire audio publiée.
      </p>
    )
  }

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

function ArchiveIndex({
  audioStories,
  books,
  onAgendaOpen,
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
          <BookControls books={books} onBookSelect={onBookSelect} />
        </section>
        <section>
          <h3>HISTOIRES AUDIOS</h3>
          <AudioStoryControls
            audioStories={audioStories}
            onAudioStorySelect={onAudioStorySelect}
          />
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
        <section>
          <h3>AGENDA</h3>
          <button
            type="button"
            className="content-primary-action"
            data-agenda-trigger
            onClick={(event) => onAgendaOpen(event.currentTarget)}
          >
            Ouvrir l’agenda
          </button>
        </section>
      </div>
    </nav>
  )
}

export function ContextualContentControls({
  activeStopId,
  archiveIndexOpen,
  audioStories,
  books,
  interactionLocked,
  onAgendaOpen,
  onAudioStorySelect,
  onBookSelect,
  onSocialOpen,
  socialContent,
}) {
  const panelId = getContextualPanelId(
    activeStopId,
    archiveIndexOpen,
    interactionLocked,
  )

  if (panelId === 'archive') {
    return (
      <ArchiveIndex
        audioStories={audioStories}
        books={books}
        onAgendaOpen={onAgendaOpen}
        onAudioStorySelect={onAudioStorySelect}
        onBookSelect={onBookSelect}
        onSocialOpen={onSocialOpen}
      />
    )
  }

  if (panelId === 'books') {
    return (
      <nav
        className="content-access-panel content-access-panel-books"
        aria-labelledby="book-access-title"
      >
        <p className="content-access-kicker">Galerie de lecture</p>
        <h2 id="book-access-title">LIVRES</h2>
        <BookControls books={books} onBookSelect={onBookSelect} />
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
        <AudioStoryControls
          audioStories={audioStories}
          onAudioStorySelect={onAudioStorySelect}
        />
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
        <button
          type="button"
          className="content-primary-action"
          data-social-trigger
          onClick={(event) => onSocialOpen(event.currentTarget)}
        >
          Décrocher le téléphone
        </button>
      </nav>
    )
  }

  if (panelId === 'agenda') {
    return (
      <nav
        className="content-access-panel"
        aria-labelledby="agenda-access-title"
      >
        <p className="content-access-kicker">Rencontres et événements</p>
        <h2 id="agenda-access-title">AGENDA</h2>
        <button
          type="button"
          className="content-primary-action"
          data-agenda-trigger
          onClick={(event) => onAgendaOpen(event.currentTarget)}
        >
          Ouvrir l’agenda
        </button>
      </nav>
    )
  }

  return null
}
