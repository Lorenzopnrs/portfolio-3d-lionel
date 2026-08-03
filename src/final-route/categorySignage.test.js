import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { EVALUATION_STOPS } from '../prototype/cameraPath.js'

const root = fileURLToPath(new URL('../../', import.meta.url))
const signagePath = `${root}src/final-route/CategorySignage.jsx`
const finalEnvironmentPath = `${root}src/final-route/FinalPrototypeEnvironment.jsx`
const prototypeEnvironmentPath = `${root}src/prototype/PrototypeEnvironment.jsx`
const palettePath = `${root}src/prototype/blockoutPalette.js`
const stylesheetPath = `${root}src/App.css`
const contextualControlsPath = `${root}src/final-route/ContextualContentControls.jsx`
const aboutOverlayPath = `${root}src/final-route/AboutDetailOverlay.jsx`
const archiveDialogPath = `${root}src/final-route/ArchiveDialog.jsx`

test('route categories exclude the portal-only About destination', () => {
  assert.deepEqual(
    EVALUATION_STOPS.map((stop) => stop.id),
    ['entrance', 'projects', 'social', 'contact'],
  )
  assert.deepEqual(
    EVALUATION_STOPS.slice(1).map((stop) => stop.label),
    [
      'LIVRES',
      'HISTOIRES AUDIOS',
      'RESEAUX SOCIAUX',
    ],
  )
})

test('category markers use suspended wooden signage without beige posts', () => {
  assert.equal(existsSync(signagePath), true)

  if (!existsSync(signagePath)) {
    return
  }

  const signageSource = readFileSync(signagePath, 'utf8')
  const finalEnvironmentSource = readFileSync(
    finalEnvironmentPath,
    'utf8',
  )
  const prototypeEnvironmentSource = readFileSync(
    prototypeEnvironmentPath,
    'utf8',
  )
  const paletteSource = readFileSync(palettePath, 'utf8')

  assert.match(signageSource, /elements\/pancarte\.png/)
  assert.match(signageSource, /torusGeometry/)
  assert.match(finalEnvironmentSource, /CategorySignage/)
  assert.match(prototypeEnvironmentSource, /CategorySignage/)
  assert.doesNotMatch(finalEnvironmentSource, /BLOCKOUT_COLORS\.marker/)
  assert.doesNotMatch(prototypeEnvironmentSource, /BLOCKOUT_COLORS\.marker/)
  assert.doesNotMatch(paletteSource, /marker:/)
})

test('About is not repeated in corridor contextual controls', () => {
  const contextualControls = readFileSync(contextualControlsPath, 'utf8')

  assert.doesNotMatch(contextualControls, /panelId === 'about'/)
  assert.doesNotMatch(contextualControls, /data-about-trigger/)
  assert.doesNotMatch(contextualControls, /A PROPOS DE MOI/)
})

test('About uses the supplied papyrus as a complete manuscript container', () => {
  const stylesheet = readFileSync(stylesheetPath, 'utf8')
  const aboutOverlay = readFileSync(aboutOverlayPath, 'utf8')
  const archiveDialog = readFileSync(archiveDialogPath, 'utf8')

  assert.match(stylesheet, /elements\/papier\.png/)
  assert.match(aboutOverlay, /variant="manuscript"/)
  assert.match(archiveDialog, /is-manuscript/)
  assert.match(
    stylesheet,
    /\.archive-dialog\.is-manuscript[\s\S]*?background:[\s\S]*?papier\.png/,
  )
  assert.match(
    stylesheet,
    /\.archive-dialog\.is-manuscript \.archive-dialog-header[\s\S]*?background:\s*transparent/,
  )
})

test('category sign text retains its restrained magical animation', () => {
  const stylesheet = readFileSync(stylesheetPath, 'utf8')

  assert.match(stylesheet, /@keyframes category-sign-shimmer/)
  assert.match(stylesheet, /\.category-sign-label/)
})
