import { ArchiveDialog } from './ArchiveDialog'

export function SocialDetailOverlay({ content, links, onClose }) {
  return (
    <ArchiveDialog
      className="social-detail-dialog"
      descriptionId="social-detail-summary"
      kicker="Archive des correspondances"
      onClose={onClose}
      title={content.title}
      titleId="social-detail-title"
    >
      <div className="social-detail-body">
        <p id="social-detail-summary">{content.summary}</p>
        <ul className="social-link-list">
          {links.map((socialLink) => (
            <li key={socialLink.id}>
              <a
                href={socialLink.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${socialLink.label}, ouvrir le lien externe`}
              >
                <span>
                  <strong>{socialLink.label}</strong>
                  <small>{socialLink.description}</small>
                </span>
                <span className="social-link-action" aria-hidden="true">
                  Ouvrir
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </ArchiveDialog>
  )
}
