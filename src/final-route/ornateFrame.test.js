import assert from 'node:assert/strict'
import test from 'node:test'
import {
  BOOK_FRAME_PLACEMENTS,
  BOOK_POSTER_HEIGHT,
  BOOK_POSTER_WIDTH,
  createOrnateFrameGeometry,
} from './ornateFrame.js'

const bookFrame = createOrnateFrameGeometry(
  BOOK_POSTER_WIDTH,
  BOOK_POSTER_HEIGHT,
)

function getBounds(geometry) {
  geometry.computeBoundingBox()
  return geometry.boundingBox
}

test('the frame is symmetrical left and right', () => {
  const { max, min } = getBounds(bookFrame)

  assert.ok(Math.abs(max.x + min.x) < 0.0001)
})

test('the carving leaves the cover itself uncovered', () => {
  const positions = bookFrame.getAttribute('position')
  // The picture has a dark margin of 6 cm around the cover.
  const coverHalfWidth = BOOK_POSTER_WIDTH / 2 - 0.06
  const coverHalfHeight = BOOK_POSTER_HEIGHT / 2 - 0.06

  for (let index = 0; index < positions.count; index += 1) {
    const inFront = positions.getZ(index) > 0
    const overCover =
      Math.abs(positions.getX(index)) < coverHalfWidth &&
      Math.abs(positions.getY(index)) < coverHalfHeight

    assert.ok(!(inFront && overCover))
  }
})

test('the whole frame fits on screen, even on a phone held upright', () => {
  const { max, min } = getBounds(bookFrame)

  // What the camera sees of the wall from its stop, 2.87 m away.
  assert.ok(max.y - min.y < 2.7)
  assert.ok(max.x - min.x < 1.8)
})

test('the frame reaches the wall behind the picture', () => {
  const { min } = getBounds(bookFrame)
  const wallDistance = 2.94 - BOOK_FRAME_PLACEMENTS[0].position[0]

  assert.ok(-min.z >= wallDistance)
})

test('a smaller scale gives a finer frame around the same opening', () => {
  const large = getBounds(createOrnateFrameGeometry(1, 1))
  const small = getBounds(createOrnateFrameGeometry(1, 1, { scale: 0.5 }))

  assert.ok(small.max.x < large.max.x)
  assert.ok(small.max.x > 0.5)
})

test('the carving stays light enough for a phone', () => {
  assert.ok(bookFrame.getIndex().count / 3 < 45000)
})

test('every part of the geometry is valid', () => {
  const positions = bookFrame.getAttribute('position')
  const colors = bookFrame.getAttribute('color')

  assert.equal(colors.count, positions.count)
  positions.array.forEach((value) => assert.ok(Number.isFinite(value)))
  colors.array.forEach((value) =>
    assert.ok(value >= 0 && value <= 1),
  )
})

test('every book frame hangs at the same height, centred on its wall', () => {
  const heights = new Set(
    BOOK_FRAME_PLACEMENTS.map(({ position }) => position[1]),
  )

  assert.equal(heights.size, 1)
  BOOK_FRAME_PLACEMENTS.forEach(({ normalX, position }) => {
    assert.equal(Math.sign(position[0]), -normalX)
  })
})
