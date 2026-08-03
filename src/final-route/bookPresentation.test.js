import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../../', import.meta.url))
const appPath = `${root}src/App.jsx`
const assetPath = `${root}src/final-route/FinalRouteAsset.jsx`
const focusPath = `${root}src/final-route/FocusedBookFrame.jsx`

test('book corridor frames use the supplied cover images without stretching', () => {
  const assetSource = readFileSync(assetPath, 'utf8')

  assert.match(assetSource, /books\.map\(\(book\) => book\.cover\.src\)/)
  assert.match(assetSource, /context\.drawImage\(sourceImage/)
  assert.match(assetSource, /PROJECT_SURFACE_PATTERN/)
  assert.doesNotMatch(assetSource, /`LIVRE \$\{/)
})

test('book frames use a two-stage accessible focused presentation', () => {
  assert.equal(existsSync(focusPath), true)

  if (!existsSync(focusPath)) {
    return
  }

  const appSource = readFileSync(appPath, 'utf8')
  const focusSource = readFileSync(focusPath, 'utf8')

  assert.match(appSource, /FocusedBookFrame/)
  assert.match(appSource, /reduceBookFocus/)
  assert.match(focusSource, /role="dialog"/)
  assert.match(focusSource, /onOpenDetails/)
  assert.match(focusSource, /reducedMotionEnabled/)
  assert.match(focusSource, /event\.key === 'Escape'/)
})
