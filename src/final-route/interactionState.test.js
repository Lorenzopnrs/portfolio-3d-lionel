import assert from 'node:assert/strict'
import test from 'node:test'
import {
  AUDIO_STORY_PROGRESS_RANGE,
  PROJECT_GALLERY_PROGRESS_RANGE,
  SOCIAL_NETWORK_PROGRESS_RANGE,
} from '../prototype/cameraPath.js'
import {
  getContextualPanelId,
  getReturnFocusTarget,
  isAudioSurfaceInteractionEnabled,
  isProjectSurfaceInteractionEnabled,
  isSocialSurfaceInteractionEnabled,
} from './interactionState.js'

test('contextual panels follow the approved route order', () => {
  assert.equal(getContextualPanelId(null, true, false), 'archive')
  assert.equal(getContextualPanelId('about', true, false), 'archive')
  assert.equal(getContextualPanelId('about', false, false), null)
  assert.equal(getContextualPanelId('book1', false, false), null)
  assert.equal(getContextualPanelId('projects', false, false), null)
  assert.equal(getContextualPanelId('library', false, false), 'books')
  assert.equal(getContextualPanelId('social', false, false), 'audio')
  assert.equal(getContextualPanelId('contact', false, false), 'social')
  assert.equal(getContextualPanelId('agenda', false, false), 'agenda')
  assert.equal(getContextualPanelId('contact', true, true), null)
})

test('focus restoration rejects a disconnected trigger', () => {
  const disconnectedTrigger = { isConnected: false }
  const liveContentTrigger = { isConnected: true }
  const movementTrigger = { isConnected: true }

  assert.equal(
    getReturnFocusTarget(
      disconnectedTrigger,
      liveContentTrigger,
      movementTrigger,
    ),
    liveContentTrigger,
  )
  assert.equal(
    getReturnFocusTarget(null, null, movementTrigger),
    movementTrigger,
  )
})

test('3D content surfaces activate only in their route areas', () => {
  const bookMiddle =
    (PROJECT_GALLERY_PROGRESS_RANGE.start +
      PROJECT_GALLERY_PROGRESS_RANGE.end) /
    2
  const audioMiddle =
    (AUDIO_STORY_PROGRESS_RANGE.start +
      AUDIO_STORY_PROGRESS_RANGE.end) /
    2
  const socialMiddle =
    (SOCIAL_NETWORK_PROGRESS_RANGE.start +
      SOCIAL_NETWORK_PROGRESS_RANGE.end) /
    2

  assert.equal(isProjectSurfaceInteractionEnabled(bookMiddle), true)
  assert.equal(isAudioSurfaceInteractionEnabled(audioMiddle), true)
  assert.equal(isSocialSurfaceInteractionEnabled(socialMiddle), true)
  assert.equal(
    isProjectSurfaceInteractionEnabled(
      PROJECT_GALLERY_PROGRESS_RANGE.start - 0.001,
    ),
    false,
  )
  assert.equal(
    isAudioSurfaceInteractionEnabled(
      AUDIO_STORY_PROGRESS_RANGE.end + 0.001,
    ),
    false,
  )
  assert.equal(
    isSocialSurfaceInteractionEnabled(
      SOCIAL_NETWORK_PROGRESS_RANGE.start - 0.001,
    ),
    false,
  )
  assert.equal(isSocialSurfaceInteractionEnabled(null), false)
})
