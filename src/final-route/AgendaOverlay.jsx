import {
  formatEventDates,
  formatEventPlace,
  formatEventTime,
} from '../content/agenda.js'
import { ArchiveDialog } from './ArchiveDialog'

export function AgendaOverlay({ events, onClose }) {
  return (
    <ArchiveDialog
      className="agenda-dialog"
      descriptionId="agenda-description"
      kicker="Rencontres et événements"
      onClose={onClose}
      title="Agenda"
      titleId="agenda-title"
    >
      <div className="agenda-body">
        <p id="agenda-description">
          {events.length === 0
            ? 'Les prochaines dates seront annoncées ici.'
            : 'Retrouvez les prochaines dates et les lieux où venir à la rencontre de l’auteur.'}
        </p>
        {events.length > 0 && (
          <ol className="agenda-list">
            {events.map((event) => (
              <li key={event.id}>
                <p className="agenda-date">
                  {formatEventDates(event)}
                  {event.time ? ` · ${formatEventTime(event.time)}` : ''}
                </p>
                <h3>{event.title}</h3>
                {formatEventPlace(event) && (
                  <p className="agenda-place">{formatEventPlace(event)}</p>
                )}
                {event.description && <p>{event.description}</p>}
                {event.url && (
                  <a
                    href={event.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    En savoir plus
                  </a>
                )}
              </li>
            ))}
          </ol>
        )}
      </div>
    </ArchiveDialog>
  )
}
