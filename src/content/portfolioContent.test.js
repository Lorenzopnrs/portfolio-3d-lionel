import assert from 'node:assert/strict'
import test from 'node:test'
import {
  aboutContent,
  contactContent,
  projects,
  socialLinks,
} from './portfolioContent.js'

const requiredProjectFields = [
  'id',
  'title',
  'category',
  'thumbnail',
  'shortSummary',
  'context',
  'role',
  'objective',
  'process',
  'decisions',
  'result',
  'imageGallery',
  'video',
  'outcome',
]

test('portfolio content exposes exactly three neutral project records', () => {
  assert.deepEqual(
    projects.map((project) => project.id),
    ['project-01', 'project-02', 'project-03'],
  )

  for (const project of projects) {
    assert.deepEqual(
      Object.keys(project),
      requiredProjectFields,
    )
    assert.equal(project.contentStatus, undefined)
    assert.equal(project.thumbnail.src, null)
    assert.equal(project.video, null)
  }
})

test('social content exposes exactly three unconfigured links', () => {
  assert.deepEqual(
    socialLinks.map((socialLink) => socialLink.id),
    ['social-01', 'social-02', 'social-03'],
  )

  for (const socialLink of socialLinks) {
    assert.equal(socialLink.href, null)
  }
})

test('personal and contact records remain neutral placeholders', () => {
  assert.equal(aboutContent.contentStatus, 'placeholder')
  assert.equal(contactContent.contentStatus, 'placeholder')
  assert.equal(contactContent.action.href, null)
})
