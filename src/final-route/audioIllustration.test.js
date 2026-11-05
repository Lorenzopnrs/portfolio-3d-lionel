import assert from 'node:assert/strict'
import test from 'node:test'
import {
  findContentBounds,
  getAudioIllustrationSources,
} from './audioIllustration.js'

// A grey picture, with `black` columns and rows left black on every side.
function createPixels(width, height, blackColumns, blackRows = 0) {
  const pixels = new Uint8ClampedArray(width * height * 4)

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const isBlack =
        x < blackColumns ||
        x >= width - blackColumns ||
        y < blackRows ||
        y >= height - blackRows
      const offset = (y * width + x) * 4

      pixels.fill(isBlack ? 0 : 120, offset, offset + 3)
      pixels[offset + 3] = 255
    }
  }

  return pixels
}

test('an illustration added in Sanity comes before the video thumbnail', () => {
  const sources = getAudioIllustrationSources({
    image: { src: 'https://cdn.sanity.io/images/cover.jpg' },
    media: { sourceUrl: 'https://www.youtube.com/watch?v=abc123' },
  })

  assert.deepEqual(sources, [
    'https://cdn.sanity.io/images/cover.jpg',
    'https://i.ytimg.com/vi/abc123/maxresdefault.jpg',
    'https://i.ytimg.com/vi/abc123/hqdefault.jpg',
  ])
})

test('the thumbnail is found whatever the shape of the YouTube link', () => {
  for (const sourceUrl of [
    'https://www.youtube.com/watch?v=eiD-zwDqOn4&feature=youtu.be',
    'https://www.youtube.com/watch?v=eiD-zwDqOn4&t=38s',
    'https://youtu.be/eiD-zwDqOn4',
  ]) {
    assert.equal(
      getAudioIllustrationSources({ media: { sourceUrl } })[0],
      'https://i.ytimg.com/vi/eiD-zwDqOn4/maxresdefault.jpg',
    )
  }
})

test('a story without image nor video has no illustration to load', () => {
  assert.deepEqual(getAudioIllustrationSources({ media: {} }), [])
  assert.deepEqual(
    getAudioIllustrationSources({
      media: { sourceUrl: 'https://cdn.sanity.io/files/story.mp3' },
    }),
    [],
  )
  assert.deepEqual(getAudioIllustrationSources(undefined), [])
})

test('the black bars around an illustration are cropped away', () => {
  assert.deepEqual(findContentBounds(createPixels(64, 36, 16), 64, 36), {
    bottom: 1,
    left: 0.25,
    right: 0.75,
    top: 0,
  })
})

test('black bars above and below are cropped away too', () => {
  const { bottom, left, right, top } = findContentBounds(
    createPixels(64, 36, 0, 9),
    64,
    36,
  )

  assert.deepEqual({ bottom, left, right, top }, {
    bottom: 0.75,
    left: 0,
    right: 1,
    top: 0.25,
  })
})

test('a picture without black bars stays whole', () => {
  assert.deepEqual(findContentBounds(createPixels(64, 36, 0), 64, 36), {
    bottom: 1,
    left: 0,
    right: 1,
    top: 0,
  })
})

test('a nearly black picture is kept whole, not cropped to a sliver', () => {
  assert.deepEqual(findContentBounds(createPixels(64, 36, 30), 64, 36), {
    bottom: 1,
    left: 0,
    right: 1,
    top: 0,
  })
})
