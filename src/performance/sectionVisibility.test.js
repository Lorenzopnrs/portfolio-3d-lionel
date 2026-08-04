import assert from 'node:assert/strict'
import test from 'node:test'
import {
  INITIAL_ROUTE_SECTION_VISIBILITY,
  resolveRouteSectionVisibility,
  resolveSectionVisibility,
} from './sectionVisibility.js'

const thresholds = Object.freeze({
  hideAbove: 0.7,
  showBelow: 0.6,
})

test('section visibility uses hysteresis at route boundaries', () => {
  assert.equal(
    resolveSectionVisibility(true, 0.71, thresholds),
    false,
  )
  assert.equal(
    resolveSectionVisibility(false, 0.65, thresholds),
    false,
  )
  assert.equal(
    resolveSectionVisibility(false, 0.59, thresholds),
    true,
  )
  assert.equal(
    resolveSectionVisibility(true, 0.65, thresholds),
    true,
  )
})

test('future sections load before arrival and unload after backtracking', () => {
  const futureThresholds = {
    hideBelow: 0.22,
    showAbove: 0.3,
  }

  assert.equal(
    resolveSectionVisibility(false, 0.31, futureThresholds),
    true,
  )
  assert.equal(
    resolveSectionVisibility(true, 0.26, futureThresholds),
    true,
  )
  assert.equal(
    resolveSectionVisibility(true, 0.21, futureThresholds),
    false,
  )
})

test('route sections overlap at transitions without remaining at distant stops', () => {
  const transitionVisibility = resolveRouteSectionVisibility(
    INITIAL_ROUTE_SECTION_VISIBILITY,
    0.49,
  )

  assert.deepEqual(transitionVisibility, {
    entrance: true,
    finalRoute: true,
    provenance: true,
    signage: true,
  })

  const projectVisibility = resolveRouteSectionVisibility(
    transitionVisibility,
    0.662,
  )

  assert.deepEqual(projectVisibility, {
    entrance: false,
    finalRoute: true,
    provenance: false,
    signage: true,
  })

  const backwardTransitionVisibility =
    resolveRouteSectionVisibility(projectVisibility, 0.57)

  assert.deepEqual(backwardTransitionVisibility, {
    entrance: false,
    finalRoute: true,
    provenance: true,
    signage: true,
  })
})
