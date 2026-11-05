const ENTRANCE_VISIBILITY = Object.freeze({
  hideAbove: 0.5,
  showBelow: 0.42,
})
const PROVENANCE_VISIBILITY = Object.freeze({
  hideAbove: 0.65,
  showBelow: 0.58,
})
// Shown before the turn: the gallery is in sight as soon as the corridor lines up.
const FINAL_ROUTE_VISIBILITY = Object.freeze({
  hideBelow: 0.22,
  showAbove: 0.29,
})
const SIGNAGE_VISIBILITY = Object.freeze({
  hideBelow: 0.4,
  showAbove: 0.48,
})

export const INITIAL_ROUTE_SECTION_VISIBILITY = Object.freeze({
  entrance: true,
  finalRoute: false,
  provenance: true,
  signage: false,
})

export function resolveSectionVisibility(
  isVisible,
  progress,
  { hideAbove, hideBelow, showAbove, showBelow },
) {
  if (isVisible) {
    if (hideAbove !== undefined && progress > hideAbove) {
      return false
    }

    if (hideBelow !== undefined && progress < hideBelow) {
      return false
    }
  }

  if (!isVisible) {
    if (showAbove !== undefined && progress > showAbove) {
      return true
    }

    if (showBelow !== undefined && progress < showBelow) {
      return true
    }
  }

  return isVisible
}

export function resolveRouteSectionVisibility(
  currentVisibility,
  progress,
) {
  const nextVisibility = {
    entrance: resolveSectionVisibility(
      currentVisibility.entrance,
      progress,
      ENTRANCE_VISIBILITY,
    ),
    finalRoute: resolveSectionVisibility(
      currentVisibility.finalRoute,
      progress,
      FINAL_ROUTE_VISIBILITY,
    ),
    provenance: resolveSectionVisibility(
      currentVisibility.provenance,
      progress,
      PROVENANCE_VISIBILITY,
    ),
    signage: resolveSectionVisibility(
      currentVisibility.signage,
      progress,
      SIGNAGE_VISIBILITY,
    ),
  }
  const unchanged = Object.keys(nextVisibility).every(
    (section) => nextVisibility[section] === currentVisibility[section],
  )

  // Keeping the same object tells listeners that nothing changed: the static
  // shadow maps are only redrawn when a room really appears or disappears.
  return unchanged ? currentVisibility : nextVisibility
}
