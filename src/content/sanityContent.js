const DEFAULT_AUTHOR = 'Lionel Chiry'
const DEFAULT_CATEGORY = 'Archive littéraire'

function compareOrder(left, right, field) {
  const leftOrder = Number.isFinite(left[field])
    ? left[field]
    : Number.MAX_SAFE_INTEGER
  const rightOrder = Number.isFinite(right[field])
    ? right[field]
    : Number.MAX_SAFE_INTEGER

  const leftLabel = String(left.title ?? left.label ?? '')
  const rightLabel = String(right.title ?? right.label ?? '')

  return leftOrder - rightOrder || leftLabel.localeCompare(rightLabel, 'fr')
}

function createOptimizedImageUrl(url, width) {
  if (!url) {
    return ''
  }

  const separator = url.includes('?') ? '&' : '?'
  return `${url}${separator}auto=format&fit=max&w=${width}&q=85`
}

function normalizeParagraphs(value) {
  return Array.isArray(value)
    ? value.filter((paragraph) => typeof paragraph === 'string' && paragraph.trim())
    : []
}

function normalizeDocumentId(id, prefix) {
  return typeof id === 'string' && id.startsWith(prefix)
    ? id.slice(prefix.length)
    : id
}

function mapAbout(about, fallbackAbout) {
  if (!about) {
    return fallbackAbout
  }

  const biography = normalizeParagraphs(about.biography)
  const paragraphs = biography.length
    ? biography
    : (fallbackAbout?.paragraphs ?? [])
  const name = about.name || fallbackAbout?.name || DEFAULT_AUTHOR
  const portraitUrl = about.portrait?.url
  return Object.freeze({
    id: 'about',
    title: 'A PROPOS DE MOI',
    name,
    summary:
      about.subtitle || paragraphs[0] || fallbackAbout?.summary || '',
    paragraphs: Object.freeze(paragraphs),
    portrait: Object.freeze({
      src: portraitUrl
        ? createOptimizedImageUrl(portraitUrl, 900)
        : (fallbackAbout?.portrait?.src ?? ''),
      alt: portraitUrl
        ? `Portrait of ${name}.`
        : (fallbackAbout?.portrait?.alt ?? `Portrait of ${name}.`),
    }),
    sourceFiles: Object.freeze([]),
  })
}

function mapBook(book) {
  const description = normalizeParagraphs(book.description)
  const author = book.author || DEFAULT_AUTHOR

  return Object.freeze({
    id: normalizeDocumentId(book._id, 'book-'),
    title: book.title,
    author,
    category: book.category || DEFAULT_CATEGORY,
    hook: book.hook || null,
    summary: book.summary || description[0] || '',
    backCover: Object.freeze(description),
    cover: Object.freeze({
      src: createOptimizedImageUrl(book.cover?.url, 1200),
      alt: `Cover of ${book.title} by ${author}.`,
    }),
    teaser: book.teaser
      ? Object.freeze({
          sourceUrl: book.teaser,
          title: `Teaser for ${book.title}`,
        })
      : null,
    featured: book.featured === true,
    featuredOrder: book.featuredOrder,
    displayOrder: book.displayOrder,
    published: true,
    sourceFiles: Object.freeze([]),
  })
}

function mapAudioStory(story) {
  const paragraphs = normalizeParagraphs(story.description)
  const sourceUrl =
    story.audioFile?.externalUrl || story.audioFile?.fileUrl || ''

  return Object.freeze({
    id: normalizeDocumentId(story._id, 'audio-'),
    title: story.title,
    infoTitle: story.infoTitle || story.title,
    summary: story.summary || paragraphs[0] || '',
    paragraphs: Object.freeze(paragraphs),
    media: Object.freeze({
      sourceUrl,
      title: `Listen to ${story.title}`,
    }),
    image: story.image?.url
      ? Object.freeze({
          src: createOptimizedImageUrl(story.image.url, 1000),
          alt: `Illustration for ${story.title}.`,
        })
      : null,
    displayOrder: story.displayOrder,
    published: true,
    sourceFiles: Object.freeze([]),
  })
}

function mapAgendaEvent(event) {
  return Object.freeze({
    id: normalizeDocumentId(event._id, 'event-'),
    title: event.title,
    startDate: event.startDate,
    endDate: event.endDate || null,
    time: event.time || '',
    venue: event.venue || '',
    city: event.city || '',
    description: event.description || '',
    url: event.url || '',
  })
}

function mapSocialLink(socialLink) {
  return Object.freeze({
    id: normalizeDocumentId(socialLink._id, 'social-'),
    label: socialLink.label,
    description:
      socialLink.description || `Ouvrir le lien ${socialLink.label}`,
    href: socialLink.url,
    displayOrder: socialLink.displayOrder,
    active: true,
  })
}

export function selectFeaturedBooks(books) {
  return Object.freeze(
    books
      .filter((book) => book.featured)
      .sort((left, right) => compareOrder(left, right, 'featuredOrder'))
      .slice(0, 3),
  )
}

export function createPortfolioContentBundle(payload, fallbackContent) {
  const publishedBooks = (payload.books ?? [])
    .filter((book) => book.published === true)
    .map(mapBook)
    .sort((left, right) => compareOrder(left, right, 'displayOrder'))
  const publishedAudioStories = (payload.audioStories ?? [])
    .filter((story) => story.published === true)
    .map(mapAudioStory)
    .sort((left, right) => compareOrder(left, right, 'displayOrder'))
  const publishedEvents = (payload.agendaEvents ?? [])
    .filter((event) => event.published === true)
    .map(mapAgendaEvent)
  const activeSocialLinks = (payload.socialLinks ?? [])
    .filter((socialLink) => socialLink.active === true)
    .map(mapSocialLink)
    .sort((left, right) => compareOrder(left, right, 'displayOrder'))

  return Object.freeze({
    about: mapAbout(payload.about, fallbackContent?.about),
    agendaEvents: Object.freeze(publishedEvents),
    audioStories: Object.freeze(publishedAudioStories),
    books: Object.freeze(publishedBooks),
    socialContent:
      fallbackContent?.socialContent ??
      Object.freeze({
        id: 'social-networks',
        title: 'RESEAUX SOCIAUX',
        summary: 'Liens officiels fournis dans les archives du portfolio.',
      }),
    socialLinks: Object.freeze(activeSocialLinks),
    source: 'sanity',
  })
}

export async function loadPortfolioContent({
  fallbackContent,
  fetchContent,
  logger = console,
}) {
  try {
    const payload = await fetchContent()
    return createPortfolioContentBundle(payload, fallbackContent)
  } catch (error) {
    logger?.warn(
      '[Sanity] Editorial content could not be loaded. Using the local fallback.',
      error,
    )
    return fallbackContent
  }
}
