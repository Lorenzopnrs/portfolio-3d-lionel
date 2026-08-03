import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../../', import.meta.url))
const expectedRuntimeAssets = Object.freeze([
  '/categories/about/portrait.jpg',
  '/categories/books/le-penseur/affiche.jpeg',
  '/categories/books/tome-1/affiche1.jpeg',
  '/categories/books/tome-2/affiche2.jpeg',
  '/categories/elements/pancarte.png',
  '/categories/elements/papier.png',
])

const runtimeSourcePaths = Object.freeze([
  'src/App.css',
  'src/assets/runtimeAssetPaths.js',
  'src/final-route/CategorySignage.jsx',
])

const safeImageConsumers = Object.freeze([
  'src/final-route/AboutDetailOverlay.jsx',
  'src/final-route/BookDetailOverlay.jsx',
  'src/final-route/ProjectDetailOverlay.jsx',
])

test('direct runtime images use public ASCII-safe paths', () => {
  expectedRuntimeAssets.forEach((assetUrl) => {
    assert.match(assetUrl, /^\/[a-z0-9][a-z0-9./-]+$/)
    assert.ok(
      existsSync(`${root}public${assetUrl}`),
      `Missing public runtime asset: ${assetUrl}`,
    )
  })

  const runtimeSource = runtimeSourcePaths
    .map((sourcePath) => readFileSync(`${root}${sourcePath}`, 'utf8'))
    .join('\n')

  expectedRuntimeAssets.forEach((assetUrl) => {
    assert.match(runtimeSource, new RegExp(assetUrl.replaceAll('/', '\\/')))
  })
  assert.doesNotMatch(runtimeSource, /cat(?:e\u0301|é)gories/)

  const contentSource = readFileSync(
    `${root}src/content/portfolioContent.js`,
    'utf8',
  )
  assert.doesNotMatch(contentSource, /new URL\(/)
  assert.doesNotMatch(
    contentSource,
    /cat(?:e\u0301|é)gories[^'"\n]+\.(?:png|jpe?g)/,
  )
  assert.match(contentSource, /ABOUT_PORTRAIT_URL/)
  assert.match(contentSource, /BOOK_COVER_URLS/)
})

test('decorative textures and content images have safe fallbacks', () => {
  const signageSource = readFileSync(
    `${root}src/final-route/CategorySignage.jsx`,
    'utf8',
  )
  const routeAssetSource = readFileSync(
    `${root}src/final-route/FinalRouteAsset.jsx`,
    'utf8',
  )

  assert.match(signageSource, /useSafeTexture\(CATEGORY_SIGN_URL/)
  assert.doesNotMatch(signageSource, /useTexture\.preload\(SIGN_REFERENCE_URL/)
  assert.match(routeAssetSource, /useSafeTexture\(/)
  assert.doesNotMatch(
    routeAssetSource,
    /useTexture\(\s*books\.map\(\(book\) => book\.cover\.src\)/,
  )

  safeImageConsumers.forEach((sourcePath) => {
    const source = readFileSync(`${root}${sourcePath}`, 'utf8')
    assert.match(
      source,
      /onError=\{handleImageError\}/,
      `Missing image fallback in ${sourcePath}`,
    )
  })
})
