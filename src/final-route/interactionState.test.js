import assert from 'node:assert/strict'
import test from 'node:test'
import { PROJECT_GALLERY_PROGRESS_RANGE } from '../prototype/cameraPath.js'
import {
  getContextualPanelId,
  getReturnFocusTarget,
  isProjectSurfaceInteractionEnabled,
  shouldOpenProjectIndex,
} from './interactionState.js'

test('project index visibility always matches its expanded control', () => {
  assert.equal(getContextualPanelId(null, true, false), 'projects')
  assert.equal(getContextualPanelId('about', true, false), 'projects')
  assert.equal(getContextualPanelId('projects', false, false), null)
  assert.equal(getContextualPanelId('about', false, false), 'about')
  assert.equal(getContextualPanelId('social', false, false), 'social')
  assert.equal(getContextualPanelId('contact', false, false), 'contact')
  assert.equal(getContextualPanelId('contact', true, true), null)
})

test('focus restoration rejects a disconnected trigger', () => {
  const disconnectedTrigger = { isConnected: false }
  const liveProjectTrigger = { isConnected: true }
  const movementTrigger = { isConnected: true }

  assert.equal(
    getReturnFocusTarget(
      disconnectedTrigger,
      liveProjectTrigger,
      movementTrigger,
    ),
    liveProjectTrigger,
  )
  assert.equal(
    getReturnFocusTarget(null, null, movementTrigger),
    movementTrigger,
  )
})

test('3D project surfaces activate throughout the physical gallery', () => {
  const galleryMiddle =
    (PROJECT_GALLERY_PROGRESS_RANGE.start +
      PROJECT_GALLERY_PROGRESS_RANGE.end) /
    2

  assert.equal(
    isProjectSurfaceInteractionEnabled(
      PROJECT_GALLERY_PROGRESS_RANGE.start,
    ),
    true,
  )
  assert.equal(
    isProjectSurfaceInteractionEnabled(galleryMiddle),
    true,
  )
  assert.equal(
    isProjectSurfaceInteractionEnabled(
      PROJECT_GALLERY_PROGRESS_RANGE.end,
    ),
    true,
  )
  assert.equal(
    isProjectSurfaceInteractionEnabled(
      PROJECT_GALLERY_PROGRESS_RANGE.start - 0.001,
    ),
    false,
  )
  assert.equal(
    isProjectSurfaceInteractionEnabled(
      PROJECT_GALLERY_PROGRESS_RANGE.end + 0.001,
    ),
    false,
  )
  assert.equal(isProjectSurfaceInteractionEnabled(null), false)
})

test('reduced motion exposes the project index at its route stop', () => {
  assert.equal(shouldOpenProjectIndex(true, 'projects'), true)
  assert.equal(shouldOpenProjectIndex(false, 'projects'), false)
  assert.equal(shouldOpenProjectIndex(true, 'about'), false)
})
