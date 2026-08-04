export const QUALITY_PREFERENCE_STORAGE_KEY =
  'portfolio-visual-quality'

export const QUALITY_OPTIONS = Object.freeze([
  Object.freeze({ label: 'Automatic', value: 'automatic' }),
  Object.freeze({ label: 'High', value: 'high' }),
  Object.freeze({ label: 'Medium', value: 'medium' }),
  Object.freeze({ label: 'Low', value: 'low' }),
])

export const QUALITY_SETTINGS = Object.freeze({
  high: Object.freeze({
    dpr: Object.freeze([1, 1.5]),
    maximumShadowMapSize: 512,
  }),
  medium: Object.freeze({
    dpr: Object.freeze([1, 1.25]),
    maximumShadowMapSize: 256,
  }),
  low: Object.freeze({
    dpr: 1,
    maximumShadowMapSize: 128,
  }),
})

const QUALITY_LEVELS = Object.freeze(['low', 'medium', 'high'])
const QUALITY_PREFERENCES = new Set(
  QUALITY_OPTIONS.map((option) => option.value),
)
const MEDIUM_SHADOW_EXCLUSIONS =
  /Book|Paper|Page|Notebook|Map|Ivy|Growth|Candle|Wax|Wick|Flame|Glass|Label|InteractionSurface/
const LOW_SHADOW_INCLUSIONS =
  /Wall|Arch|Support|Pillar|Floor|Slab|Door|Frame|Shelf|Cabinet|Desk|Table|Lectern|Runner|Carpet|Ceiling|Vault/

export function normalizeQualityPreference(value) {
  return QUALITY_PREFERENCES.has(value) ? value : 'automatic'
}

export function detectInitialAutomaticQuality({
  deviceMemory,
  hardwareConcurrency,
  viewportWidth,
}) {
  if (
    (Number.isFinite(deviceMemory) && deviceMemory <= 2) ||
    (Number.isFinite(hardwareConcurrency) && hardwareConcurrency <= 2)
  ) {
    return 'low'
  }

  if (
    viewportWidth <= 720 ||
    (Number.isFinite(deviceMemory) && deviceMemory <= 4) ||
    (Number.isFinite(hardwareConcurrency) && hardwareConcurrency <= 4)
  ) {
    return 'medium'
  }

  return 'high'
}

export function getEffectiveQuality(
  qualityPreference,
  automaticQuality,
) {
  return qualityPreference === 'automatic'
    ? automaticQuality
    : qualityPreference
}

export function getLowerQuality(qualityLevel) {
  const index = QUALITY_LEVELS.indexOf(qualityLevel)
  return QUALITY_LEVELS[Math.max(0, index - 1)] ?? 'low'
}

export function getHigherQuality(qualityLevel) {
  const index = QUALITY_LEVELS.indexOf(qualityLevel)
  return QUALITY_LEVELS[Math.min(QUALITY_LEVELS.length - 1, index + 1)] ?? 'high'
}

export function getShadowMapSize(baseSize, qualityLevel) {
  return Math.min(
    baseSize,
    QUALITY_SETTINGS[qualityLevel].maximumShadowMapSize,
  )
}

export function shouldCastObjectShadow(objectName, qualityLevel) {
  if (qualityLevel === 'high') {
    return true
  }

  if (qualityLevel === 'medium') {
    return !MEDIUM_SHADOW_EXCLUSIONS.test(objectName)
  }

  return LOW_SHADOW_INCLUSIONS.test(objectName)
}
