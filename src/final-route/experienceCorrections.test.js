import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { Vector3 } from 'three'
import { getCameraPointAt } from '../prototype/cameraPath.js'
import {
  ABOUT_PORTAL_DEPTH,
  ABOUT_PORTAL_FRAME_OUTER_HEIGHT,
  ABOUT_PORTAL_FRAME_OUTER_WIDTH,
} from '../vertical-slice/aboutPortalConfig.js'
import {
  FINAL_LOOP_PORTAL_POSITION,
} from './finalRoutePlacement.js'

const root = fileURLToPath(new URL('../../', import.meta.url))
const readProjectFile = (path) => readFileSync(`${root}${path}`, 'utf8')

test('the first book frame and final threshold are free of obstructions', () => {
  const blenderSource = readProjectFile(
    'tools/blender/create_final_route_asset_library.py',
  )

  assert.doesNotMatch(blenderSource, /ProjectGalleryRhythmArch_00/)
  assert.doesNotMatch(blenderSource, /UnfinishedStoneBarrier/)
  assert.doesNotMatch(blenderSource, /UnfinishedMasonryBlock_/)
  assert.doesNotMatch(blenderSource, /UnfinishedTimberBrace_/)
  assert.match(blenderSource, /ProjectInteractionSurface_01/)
  assert.match(blenderSource, /ProjectInteractionSurface_02/)
  assert.match(blenderSource, /ProjectInteractionSurface_03/)
})

test('the final loop reuses the established magical portal implementation', () => {
  const portalSource = readProjectFile(
    'src/vertical-slice/AboutPortal.jsx',
  )
  const finalEnvironmentSource = readProjectFile(
    'src/final-route/FinalRouteEnvironment.jsx',
  )
  const appSource = readProjectFile('src/App.jsx')

  assert.match(portalSource, /export function MagicalPortal/)
  assert.match(finalEnvironmentSource, /<MagicalPortal/)
  assert.match(finalEnvironmentSource, /onLoopActivate/)
  assert.match(appSource, /resetMovementToStart/)
})

test('the final camera position approaches the portal without intersecting it', () => {
  const finalCameraPoint = getCameraPointAt(1, new Vector3())
  const [portalX, portalY, portalZ] = FINAL_LOOP_PORTAL_POSITION
  const minimumX = portalX - ABOUT_PORTAL_DEPTH
  const maximumX = portalX + ABOUT_PORTAL_DEPTH
  const minimumY = portalY
  const maximumY = portalY + ABOUT_PORTAL_FRAME_OUTER_HEIGHT
  const minimumZ = portalZ - ABOUT_PORTAL_FRAME_OUTER_WIDTH / 2
  const maximumZ = portalZ + ABOUT_PORTAL_FRAME_OUTER_WIDTH / 2
  const distanceX = Math.max(
    minimumX - finalCameraPoint.x,
    0,
    finalCameraPoint.x - maximumX,
  )
  const distanceY = Math.max(
    minimumY - finalCameraPoint.y,
    0,
    finalCameraPoint.y - maximumY,
  )
  const distanceZ = Math.max(
    minimumZ - finalCameraPoint.z,
    0,
    finalCameraPoint.z - maximumZ,
  )
  const clearance = Math.hypot(distanceX, distanceY, distanceZ)

  assert.ok(clearance >= 1.4)
  assert.ok(clearance <= 2)
})

test('every information view uses the professional archive panel without papyrus', () => {
  const stylesheet = readProjectFile('src/App.css')
  const dialogSource = readProjectFile(
    'src/final-route/ArchiveDialog.jsx',
  )
  const projectOverlaySource = readProjectFile(
    'src/final-route/ProjectDetailOverlay.jsx',
  )

  assert.doesNotMatch(stylesheet, /papier\.webp|papyrus/i)
  assert.match(dialogSource, /is-profile/)
  assert.doesNotMatch(dialogSource, /is-default/)
  assert.match(projectOverlaySource, /<ArchiveDialog/)
})

test('the complete library is route-aware and data-driven', () => {
  const appSource = readProjectFile('src/App.jsx')
  const librarySource = readProjectFile(
    'src/final-route/FullLibraryOverlay.jsx',
  )
  const accessSource = readProjectFile(
    'src/final-route/LibraryAccessButton.jsx',
  )

  assert.match(appSource, /bookSurfaceInteractionEnabled/)
  assert.match(appSource, /libraryOpen/)
  assert.match(librarySource, /books\.map/)
  assert.match(librarySource, /data-library-book-id/)
  assert.match(accessSource, /VOIR TOUTE LA BIBLIOTHÈQUE/)
})
