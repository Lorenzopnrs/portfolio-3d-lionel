import { lazy, Suspense } from 'react'
import { EntranceVerticalSlice } from '../vertical-slice/EntranceVerticalSlice'

const ProvenanceGallery = lazy(() =>
  import('../vertical-slice/ProvenanceGallery').then((module) => ({
    default: module.ProvenanceGallery,
  })),
)
const FinalRouteEnvironment = lazy(() =>
  import('./FinalRouteEnvironment').then((module) => ({
    default: module.FinalRouteEnvironment,
  })),
)
const CategorySignage = lazy(() =>
  import('./CategorySignage').then((module) => ({
    default: module.CategorySignage,
  })),
)

export function FinalPrototypeEnvironment({
  audioInteractionEnabled,
  bookInteractionEnabled,
  entranceReady,
  onAboutOpen,
  onAudioStorySelect,
  onBookSelect,
  onEntranceReady,
  onSocialOpen,
  progress,
  qualityLevel,
  reducedMotionEnabled,
  sectionVisibility,
  socialInteractionEnabled,
}) {
  return (
    <>
      {sectionVisibility.entrance && (
        <EntranceVerticalSlice
          onAboutOpen={onAboutOpen}
          onReady={onEntranceReady}
          portalAnimationEnabled={progress < 0.36}
          qualityLevel={qualityLevel}
          reducedMotionEnabled={reducedMotionEnabled}
        />
      )}
      <Suspense fallback={null}>
        {entranceReady && sectionVisibility.provenance && (
          <ProvenanceGallery qualityLevel={qualityLevel} />
        )}
      </Suspense>
      <Suspense fallback={null}>
        {sectionVisibility.finalRoute && (
          <FinalRouteEnvironment
            audioInteractionEnabled={audioInteractionEnabled}
            bookInteractionEnabled={bookInteractionEnabled}
            onAudioStorySelect={onAudioStorySelect}
            onBookSelect={onBookSelect}
            onSocialOpen={onSocialOpen}
            qualityLevel={qualityLevel}
            socialInteractionEnabled={socialInteractionEnabled}
          />
        )}
      </Suspense>
      <Suspense fallback={null}>
        {sectionVisibility.signage && (
          <CategorySignage
            qualityLevel={qualityLevel}
            reducedMotionEnabled={reducedMotionEnabled}
          />
        )}
      </Suspense>
    </>
  )
}
