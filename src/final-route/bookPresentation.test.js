import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../../', import.meta.url))
const appPath = `${root}src/App.jsx`
const assetPath = `${root}src/final-route/FinalRouteAsset.jsx`
const focusPath = `${root}src/final-route/FocusedBookFrame.jsx`
const focusStatePath = `${root}src/final-route/bookFocusState.js`

test('book corridor frames use upright full-cover display planes', () => {
  const assetSource = readFileSync(assetPath, 'utf8')

  assert.match(assetSource, /books\.map\(\(book\) => book\.cover\.src\)/)
  assert.match(assetSource, /context\.drawImage\(sourceImage/)
  assert.match(assetSource, /PROJECT_SURFACE_PATTERN/)
  assert.match(assetSource, /PlaneGeometry/)
  assert.match(assetSource, /BOOK_SURFACE_LAYOUTS/)
  assert.match(assetSource, /imageSmoothingQuality\s*=\s*'high'/)
  assert.match(assetSource, /material\.depthWrite\s*=\s*true/)
  assert.match(assetSource, /material\.transparent\s*=\s*false/)
  assert.doesNotMatch(assetSource, /`LIVRE \$\{/)
})

test('a single book selection opens the complete detail view directly', () => {
  const appSource = readFileSync(appPath, 'utf8')

  assert.equal(existsSync(focusPath), false)
  assert.equal(existsSync(focusStatePath), false)
  assert.doesNotMatch(appSource, /FocusedBookFrame/)
  assert.doesNotMatch(appSource, /reduceBookFocus/)
  assert.match(appSource, /handleContentOpen\('book', bookId, trigger\)/)
  assert.match(appSource, /activeContent\?\.type === 'book'/)
  assert.match(appSource, /<BookDetailOverlay[\s\S]*?onClose=\{handleContentClose\}/)
})
