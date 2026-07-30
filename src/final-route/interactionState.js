export function getContextualPanelId(
  activeStopId,
  projectIndexOpen,
  interactionLocked,
) {
  if (interactionLocked) {
    return null
  }

  if (projectIndexOpen) {
    return 'projects'
  }

  if (['about', 'social', 'contact'].includes(activeStopId)) {
    return activeStopId
  }

  return null
}

export function getReturnFocusTarget(
  storedTrigger,
  liveProjectTrigger,
  movementTrigger,
) {
  return [storedTrigger, liveProjectTrigger, movementTrigger].find(
    (target) => target?.isConnected,
  )
}

export function isProjectSurfaceInteractionEnabled(progress) {
  return (
    Number.isFinite(progress) &&
    progress >= PROJECT_GALLERY_PROGRESS_RANGE.start &&
    progress <= PROJECT_GALLERY_PROGRESS_RANGE.end
  )
}

export function shouldOpenProjectIndex(
  reducedMotionEnabled,
  activeStopId,
) {
  return reducedMotionEnabled && activeStopId === 'projects'
}
import { PROJECT_GALLERY_PROGRESS_RANGE } from '../prototype/cameraPath.js'
