import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import {
  aboutContent,
  audioStories,
  books,
  socialContent,
  socialLinks,
} from './portfolioContent.js'

const root = fileURLToPath(new URL('../../', import.meta.url))

function getPublicAssetPath(assetUrl) {
  return `${root}public${assetUrl}`
}

test('about content uses the supplied portrait and biography', () => {
  assert.equal(aboutContent.title, 'A PROPOS DE MOI')
  assert.equal(aboutContent.paragraphs.length, 2)
  assert.match(aboutContent.paragraphs[0], /liberté/)
  assert.match(aboutContent.paragraphs[1], /éducateur spécialisé/)
  assert.ok(aboutContent.portrait.alt)
  assert.equal(
    existsSync(getPublicAssetPath(aboutContent.portrait.src)),
    true,
  )
})

test('book archive exposes all supplied covers, texts and teasers', () => {
  assert.deepEqual(
    books.map((book) => book.id),
    [
      'shadow-of-jack-volume-1',
      'shadow-of-jack-volume-2',
      'the-thinker',
    ],
  )

  for (const book of books) {
    assert.ok(book.title)
    assert.ok(book.author)
    assert.ok(book.category)
    assert.ok(book.summary)
    assert.ok(book.backCover.length)
    assert.ok(book.cover.alt)
    assert.equal(existsSync(getPublicAssetPath(book.cover.src)), true)
    assert.ok(book.sourceFiles.some((path) => path.endsWith('infos.rtf')))
  }

  assert.ok(books[0].teaser?.sourceUrl)
  assert.ok(books[1].teaser?.sourceUrl)
  assert.equal(books[2].teaser, null)
})

test('audio archive exposes both supplied stories and playable URLs', () => {
  assert.deepEqual(
    audioStories.map((story) => story.id),
    ['between-four-mirrors', 'coffee-time'],
  )

  for (const story of audioStories) {
    assert.ok(story.title)
    assert.ok(story.infoTitle)
    assert.ok(story.paragraphs.length)
    assert.match(story.media.sourceUrl, /^https:\/\/www\.youtube\.com\//)
    assert.ok(
      story.sourceFiles.some((path) => path.endsWith('infos.rtf')),
    )
  }
})

test('social archive exposes the four supplied links', () => {
  assert.equal(socialContent.title, 'RESEAUX SOCIAUX')
  assert.deepEqual(
    socialLinks.map((socialLink) => socialLink.id),
    ['instagram', 'facebook', 'youtube', 'author-page'],
  )

  for (const socialLink of socialLinks) {
    assert.match(socialLink.href, /^https:\/\//)
    assert.ok(socialLink.description)
    assert.ok(socialLink.sourceFile.endsWith('.webloc'))
  }
})
