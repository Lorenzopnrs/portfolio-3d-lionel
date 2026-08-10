import assert from 'node:assert/strict'
import test from 'node:test'
import {
  createPortfolioContentBundle,
  loadPortfolioContent,
  selectFeaturedBooks,
} from './sanityContent.js'

const sanityPayload = Object.freeze({
  about: {
    _id: 'about-profile',
    name: 'Lionel Chiry',
    subtitle: 'Auteur et éducateur spécialisé',
    biography: ['Premier paragraphe.', 'Second paragraphe.'],
    portrait: {
      url: 'https://cdn.sanity.io/images/43dsdcuf/production/portrait.jpg',
    },
  },
  books: [
    {
      _id: 'book-four',
      title: 'Livre quatre',
      author: 'Lionel Chiry',
      category: 'Roman',
      summary: 'Résumé quatre.',
      description: ['Description quatre.'],
      cover: {
        url: 'https://cdn.sanity.io/images/43dsdcuf/production/four.jpg',
      },
      featured: true,
      featuredOrder: 4,
      displayOrder: 4,
      published: true,
    },
    {
      _id: 'book-one',
      title: 'Livre un',
      author: 'Lionel Chiry',
      category: 'Roman',
      summary: 'Résumé un.',
      description: ['Description un.'],
      cover: {
        url: 'https://cdn.sanity.io/images/43dsdcuf/production/one.jpg',
      },
      teaser: 'https://www.youtube.com/watch?v=example',
      featured: true,
      featuredOrder: 1,
      displayOrder: 1,
      published: true,
    },
    {
      _id: 'book-three',
      title: 'Livre trois',
      author: 'Lionel Chiry',
      category: 'Roman',
      summary: 'Résumé trois.',
      description: ['Description trois.'],
      cover: {
        url: 'https://cdn.sanity.io/images/43dsdcuf/production/three.jpg',
      },
      featured: true,
      featuredOrder: 3,
      displayOrder: 3,
      published: true,
    },
    {
      _id: 'book-two',
      title: 'Livre deux',
      author: 'Lionel Chiry',
      category: 'Roman',
      summary: 'Résumé deux.',
      description: ['Description deux.'],
      cover: {
        url: 'https://cdn.sanity.io/images/43dsdcuf/production/two.jpg',
      },
      featured: true,
      featuredOrder: 2,
      displayOrder: 2,
      published: true,
    },
    {
      _id: 'book-draft',
      title: 'Brouillon',
      description: ['Ne doit pas être publié.'],
      cover: {
        url: 'https://cdn.sanity.io/images/43dsdcuf/production/draft.jpg',
      },
      featured: true,
      featuredOrder: 0,
      displayOrder: 0,
      published: false,
    },
  ],
  audioStories: [
    {
      _id: 'audio-one',
      title: 'Histoire audio',
      infoTitle: 'Sous-titre réel',
      summary: 'Résumé audio.',
      description: ['Description audio.'],
      audioFile: {
        externalUrl: 'https://www.youtube.com/watch?v=audio',
      },
      displayOrder: 1,
      published: true,
    },
  ],
  socialLinks: [
    {
      _id: 'social-one',
      label: 'Réseau',
      url: 'https://example.com/profile',
      description: 'Profil officiel',
      displayOrder: 1,
      active: true,
    },
  ],
})

test('Sanity content maps to the established portfolio view model', () => {
  const content = createPortfolioContentBundle(sanityPayload)

  assert.equal(content.about.id, 'about')
  assert.equal(content.about.title, 'A PROPOS DE MOI')
  assert.deepEqual(content.about.paragraphs, [
    'Premier paragraphe.',
    'Second paragraphe.',
  ])
  assert.match(content.about.portrait.src, /auto=format/)
  assert.deepEqual(
    content.books.map((book) => book.id),
    ['one', 'two', 'three', 'four'],
  )
  assert.equal(content.books[0].backCover[0], 'Description un.')
  assert.equal(
    content.books[0].teaser.sourceUrl,
    'https://www.youtube.com/watch?v=example',
  )
  assert.equal(
    content.audioStories[0].media.sourceUrl,
    'https://www.youtube.com/watch?v=audio',
  )
  assert.equal(content.socialLinks[0].href, 'https://example.com/profile')
})

test('featured books always use at most the first three ordered slots', () => {
  const content = createPortfolioContentBundle(sanityPayload)

  assert.deepEqual(
    selectFeaturedBooks(content.books).map((book) => book.id),
    ['one', 'two', 'three'],
  )
})

test('a newly published book appears without changing the three physical slots', () => {
  const newBook = {
    _id: 'temporary-new-book',
    title: 'Nouveau livre temporaire',
    author: 'Lionel Chiry',
    category: 'Roman',
    summary: 'Résumé temporaire.',
    description: ['Description temporaire.'],
    cover: {
      url: 'https://cdn.sanity.io/images/43dsdcuf/production/temp.jpg',
    },
    featured: false,
    displayOrder: 5,
    published: true,
  }
  const content = createPortfolioContentBundle({
    ...sanityPayload,
    books: [...sanityPayload.books, newBook],
  })

  assert.equal(
    content.books.some((book) => book.id === 'temporary-new-book'),
    true,
  )
  assert.equal(selectFeaturedBooks(content.books).length, 3)
})

test('Sanity failures preserve the complete local fallback', async () => {
  const warnings = []
  const fallbackContent = Object.freeze({ source: 'local' })
  const content = await loadPortfolioContent({
    fallbackContent,
    fetchContent: async () => {
      throw new Error('Network unavailable')
    },
    logger: {
      warn: (...messages) => warnings.push(messages),
    },
  })

  assert.equal(content, fallbackContent)
  assert.equal(warnings.length, 1)
  assert.match(String(warnings[0][0]), /Sanity/)
})

test('partial About content and equal social orders remain safe', () => {
  const fallbackContent = {
    about: {
      id: 'about',
      title: 'A PROPOS DE MOI',
      name: 'Fallback name',
      summary: 'Fallback summary',
      paragraphs: ['Fallback biography.'],
      portrait: {
        src: '/categories/about/portrait.jpg',
        alt: 'Fallback portrait.',
      },
      sourceFiles: [],
    },
  }
  const content = createPortfolioContentBundle(
    {
      ...sanityPayload,
      about: {
        _id: 'about-profile',
        name: '',
        subtitle: '',
        biography: [],
        portrait: null,
      },
      socialLinks: [
        sanityPayload.socialLinks[0],
        {
          _id: 'social-two',
          label: 'Autre réseau',
          url: 'https://example.com/other',
          displayOrder: 1,
          active: true,
        },
      ],
    },
    fallbackContent,
  )

  assert.equal(content.about.name, 'Fallback name')
  assert.deepEqual(content.about.paragraphs, ['Fallback biography.'])
  assert.equal(content.about.portrait.src, '/categories/about/portrait.jpg')
  assert.deepEqual(
    content.socialLinks.map((socialLink) => socialLink.label),
    ['Autre réseau', 'Réseau'],
  )
})
