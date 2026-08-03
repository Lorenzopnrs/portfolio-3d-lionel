import {
  AUDIO_STORY_PROGRESS_RANGE,
  PROJECT_GALLERY_PROGRESS_RANGE,
  SOCIAL_NETWORK_PROGRESS_RANGE,
} from '../prototype/cameraPath.js'

const STOP_PANEL_IDS = Object.freeze({
  contact: 'social',
  projects: 'books',
  social: 'audio',
})

export function getContextualPanelId(
  activeStopId,
  archiveIndexOpen,
  interactionLocked,
) {
  if (interactionLocked) {
    return null
  }

  if (archiveIndexOpen) {
    return 'archive'
  }

  return STOP_PANEL_IDS[activeStopId] ?? null
}

export function getReturnFocusTarget(
  storedTrigger,
  liveContentTrigger,
  movementTrigger,
) {
  return [storedTrigger, liveContentTrigger, movementTrigger].find(
    (target) => target?.isConnected,
  )
}

function isProgressInsideRange(progress, range) {
  return (
    Number.isFinite(progress) &&
    progress >= range.start &&
    progress <= range.end
  )
}

export function isProjectSurfaceInteractionEnabled(progress) {
  return isProgressInsideRange(
    progress,
    PROJECT_GALLERY_PROGRESS_RANGE,
  )
}

export function isAudioSurfaceInteractionEnabled(progress) {
  return isProgressInsideRange(progress, AUDIO_STORY_PROGRESS_RANGE)
}

export function isSocialSurfaceInteractionEnabled(progress) {
  return isProgressInsideRange(progress, SOCIAL_NETWORK_PROGRESS_RANGE)
}
