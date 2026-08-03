import assert from 'node:assert/strict'
import test from 'node:test'
import {
  canRenderProjectVideo,
  getCaptionTrackSource,
  getImageAlternative,
  getYouTubeEmbedUrl,
  getYouTubeVideoId,
  hasAccessibleImage,
} from './projectMedia.js'

test('configured images require a source and text alternative', () => {
  assert.equal(
    hasAccessibleImage({
      src: '/project/image.webp',
      alt: 'Project view',
    }),
    true,
  )
  assert.equal(
    hasAccessibleImage({ src: '/project/image.webp' }),
    false,
  )
  assert.equal(
    hasAccessibleImage({ src: null, alt: 'Project view' }),
    false,
  )
  assert.equal(hasAccessibleImage(null), false)
  assert.equal(
    getImageAlternative({}, 'Project image placeholder'),
    'Project image placeholder',
  )
})

test('project video requires captions or a transcript', () => {
  assert.equal(
    canRenderProjectVideo({
      src: '/project/video.mp4',
      captionTrack: '/project/video.vtt',
    }),
    true,
  )
  assert.equal(
    canRenderProjectVideo({
      src: '/project/video.mp4',
      transcript: 'Accessible transcript',
    }),
    true,
  )
  assert.equal(
    canRenderProjectVideo({ src: '/project/video.mp4' }),
    false,
  )
  assert.equal(
    canRenderProjectVideo({
      src: '/project/video.mp4',
      captionTrack: {},
    }),
    false,
  )
  assert.equal(
    getCaptionTrackSource({
      captionTrack: { src: '/project/video.vtt' },
    }),
    '/project/video.vtt',
  )
})

test('YouTube helpers support every supplied media URL shape', () => {
  assert.equal(
    getYouTubeVideoId('https://www.youtube.com/watch?v=PI4bK17n48o'),
    'PI4bK17n48o',
  )
  assert.equal(
    getYouTubeVideoId(
      'https://www.youtube.com/watch?is=unused&v=x0FZNvFNkiQ&feature=youtu.be',
    ),
    'x0FZNvFNkiQ',
  )
  assert.equal(
    getYouTubeVideoId('https://youtu.be/iiPtbwL6E44'),
    'iiPtbwL6E44',
  )
  assert.equal(
    getYouTubeEmbedUrl(
      'https://www.youtube.com/watch?v=eiD-zwDqOn4&feature=youtu.be',
    ),
    'https://www.youtube-nocookie.com/embed/eiD-zwDqOn4?rel=0',
  )
  assert.equal(getYouTubeEmbedUrl('not-a-url'), null)
})
