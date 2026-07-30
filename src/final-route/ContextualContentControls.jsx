import {
  aboutContent,
  contactContent,
  projects,
  socialLinks,
} from '../content/portfolioContent'
import { getContextualPanelId } from './interactionState'

function SocialLinkControl({ socialLink }) {
  const content = (
    <>
      <span>{socialLink.label}</span>
      <small>
        {socialLink.href ? 'Open external profile' : 'Awaiting configuration'}
      </small>
    </>
  )

  if (socialLink.href) {
    return (
      <a
        href={socialLink.href}
        target="_blank"
        rel="noopener noreferrer"
      >
        {content}
      </a>
    )
  }

  return (
    <button
      type="button"
      aria-disabled="true"
      onClick={(event) => event.preventDefault()}
    >
      {content}
    </button>
  )
}

function ContactActionControl() {
  if (contactContent.action.href) {
    return (
      <a
        className="contact-placeholder-action"
        href={contactContent.action.href}
      >
        {contactContent.action.label}
      </a>
    )
  }

  return (
    <button
      type="button"
      className="contact-placeholder-action"
      aria-disabled="true"
      onClick={(event) => event.preventDefault()}
    >
      {contactContent.action.label}
    </button>
  )
}

export function ContextualContentControls({
  activeStopId,
  interactionLocked,
  onProjectSelect,
  projectIndexOpen,
}) {
  const panelId = getContextualPanelId(
    activeStopId,
    projectIndexOpen,
    interactionLocked,
  )

  if (panelId === 'projects') {
    return (
      <nav
        id="project-index-panel"
        className="content-access-panel"
        aria-labelledby="project-access-title"
      >
        <p className="content-access-kicker">Direct access</p>
        <h2 id="project-access-title">Project gallery</h2>
        <div className="content-access-actions">
          {projects.map((project) => (
            <button
              key={project.id}
              type="button"
              data-project-id={project.id}
              onClick={(event) =>
                onProjectSelect(project.id, event.currentTarget)
              }
            >
              <span>{project.title}</span>
              <small>Open project archive</small>
            </button>
          ))}
        </div>
      </nav>
    )
  }

  if (panelId === 'about') {
    return (
      <aside
        className="content-access-panel"
        aria-labelledby="about-access-title"
      >
        <p className="content-access-kicker">About archive</p>
        <h2 id="about-access-title">{aboutContent.title}</h2>
        <p>{aboutContent.summary}</p>
      </aside>
    )
  }

  if (panelId === 'social') {
    return (
      <nav
        className="content-access-panel"
        aria-labelledby="social-access-title"
      >
        <p className="content-access-kicker">Correspondence</p>
        <h2 id="social-access-title">Social Networks</h2>
        <div className="content-access-actions">
          {socialLinks.map((socialLink) => (
            <SocialLinkControl
              key={socialLink.id}
              socialLink={socialLink}
            />
          ))}
        </div>
      </nav>
    )
  }

  if (panelId === 'contact') {
    return (
      <aside
        className="content-access-panel"
        aria-labelledby="contact-access-title"
      >
        <p className="content-access-kicker">Unfinished Wing</p>
        <h2 id="contact-access-title">{contactContent.title}</h2>
        <p>{contactContent.summary}</p>
        <ContactActionControl />
      </aside>
    )
  }

  return null
}
