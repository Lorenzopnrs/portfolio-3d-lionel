import assert from 'node:assert/strict'
import test from 'node:test'
import {
  detectInitialAutomaticQuality,
  getEffectiveQuality,
  getHigherQuality,
  getLowerQuality,
  getShadowMapSize,
  normalizeQualityPreference,
  shouldCastObjectShadow,
} from './qualitySettings.js'

test('automatic quality starts conservatively from device capabilities', () => {
  assert.equal(
    detectInitialAutomaticQuality({
      deviceMemory: 8,
      hardwareConcurrency: 8,
      viewportWidth: 1440,
    }),
    'high',
  )
  assert.equal(
    detectInitialAutomaticQuality({
      deviceMemory: 4,
      hardwareConcurrency: 8,
      viewportWidth: 1080,
    }),
    'medium',
  )
  assert.equal(
    detectInitialAutomaticQuality({
      deviceMemory: 2,
      hardwareConcurrency: 4,
      viewportWidth: 390,
    }),
    'low',
  )
})

test('quality preferences and adaptive steps remain bounded', () => {
  assert.equal(normalizeQualityPreference('high'), 'high')
  assert.equal(normalizeQualityPreference('unknown'), 'automatic')
  assert.equal(getEffectiveQuality('automatic', 'medium'), 'medium')
  assert.equal(getEffectiveQuality('high', 'low'), 'high')
  assert.equal(getLowerQuality('high'), 'medium')
  assert.equal(getLowerQuality('low'), 'low')
  assert.equal(getHigherQuality('medium'), 'high')
  assert.equal(getHigherQuality('high'), 'high')
})

test('High preserves current shadows while fallback modes reduce cost', () => {
  assert.equal(getShadowMapSize(512, 'high'), 512)
  assert.equal(getShadowMapSize(512, 'medium'), 256)
  assert.equal(getShadowMapSize(512, 'low'), 128)
  assert.equal(shouldCastObjectShadow('LoosePaper_01', 'high'), true)
  assert.equal(shouldCastObjectShadow('LoosePaper_01', 'medium'), false)
  assert.equal(shouldCastObjectShadow('StoneWall_01', 'low'), true)
  assert.equal(shouldCastObjectShadow('LoosePaper_01', 'low'), false)
})
