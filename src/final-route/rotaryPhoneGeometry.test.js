import assert from 'node:assert/strict'
import test from 'node:test'
import { createRotaryPhoneGeometries } from './rotaryPhoneGeometry.js'

const { body, brass, label } = createRotaryPhoneGeometries()

test('the phone is one solid object, without broken geometry', () => {
  for (const geometry of [body, brass, label]) {
    const positions = geometry.getAttribute('position').array

    assert.ok(positions.length > 0)
    assert.ok(positions.every(Number.isFinite))
  }
})

test('the phone stands on the table, with a credible size', () => {
  body.computeBoundingBox()
  const { max, min } = body.boundingBox

  assert.ok(Math.abs(min.y) < 0.001)
  assert.ok(max.y > 0.2 && max.y < 0.26)
  assert.ok(max.x - min.x < 0.4)
  assert.ok(max.z - min.z < 0.32)
})

test('the dial faces forward and upward, towards the visitor', () => {
  label.computeBoundingBox()
  const { max, min } = label.boundingBox

  assert.ok((max.z + min.z) / 2 > 0.05)
  assert.ok((max.y + min.y) / 2 > 0.03)
})
