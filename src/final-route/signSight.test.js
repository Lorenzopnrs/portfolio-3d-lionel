import assert from 'node:assert/strict'
import test from 'node:test'
import { EVALUATION_STOPS } from '../prototype/cameraPath.js'
import { getSignSightRange } from './signSight.js'

const signStops = EVALUATION_STOPS.filter(
  (stop) => ['projects', 'social', 'contact'].includes(stop.id),
)

test('every category sign is readable while approaching its stop', () => {
  signStops.forEach((stop) => {
    const { end, start } = getSignSightRange(stop.signProgress)

    assert.ok(start < stop.signProgress)
    assert.ok(end > stop.signProgress)
  })
})

test('a sign around the corner stays hidden until the corridor lines up', () => {
  const [books, audio, social] = signStops
  const booksRange = getSignSightRange(books.signProgress)
  const audioRange = getSignSightRange(audio.signProgress)
  const socialRange = getSignSightRange(social.signProgress)

  assert.ok(audioRange.start > books.signProgress - 0.05)
  assert.ok(socialRange.start > audio.signProgress - 0.05)
  assert.ok(booksRange.end < audioRange.end)
})
