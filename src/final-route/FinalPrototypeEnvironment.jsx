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
  audioStories,
  audioInteractionEnabled,
  featuredBooks,
  bookInteractionEnabled,
  entranceReady,
  onAboutOpen,
  onAudioStorySelect,
  onBookSelect,
  onEntranceReady,
  onLoopActivate,
  onSocialOpen,
  progress,
  qualityLevel,
  reducedMotionEnabled,
  sectionVisibility,
  socialContent,
  socialInteractionEnabled,
  socialLinks,
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
            audioStories={audioStories}
            audioInteractionEnabled={audioInteractionEnabled}
            featuredBooks={featuredBooks}
            bookInteractionEnabled={bookInteractionEnabled}
            onAudioStorySelect={onAudioStorySelect}
            onBookSelect={onBookSelect}
            onLoopActivate={onLoopActivate}
            onSocialOpen={onSocialOpen}
            progress={progress}
            qualityLevel={qualityLevel}
            reducedMotionEnabled={reducedMotionEnabled}
            socialContent={socialContent}
            socialInteractionEnabled={socialInteractionEnabled}
            socialLinks={socialLinks}
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
