import { Suspense } from 'react'
import { RouteLightRig } from '../performance/RouteLightRig'
import { SceneWarmup } from '../performance/SceneWarmup'
import { EntranceVerticalSlice } from '../vertical-slice/EntranceVerticalSlice'
import { ProvenanceGallery } from '../vertical-slice/ProvenanceGallery'
import { CategorySignage } from './CategorySignage'
import { FinalRouteEnvironment } from './FinalRouteEnvironment'

export function FinalPrototypeEnvironment({
  agendaEvents,
  audioStories,
  audioInteractionEnabled,
  contentSettled,
  entranceReady,
  featuredBooks,
  bookInteractionEnabled,
  libraryAudioStories,
  libraryBooks,
  lightQuality,
  onAboutOpen,
  onAgendaOpen,
  onAudioStorySelect,
  onBookSelect,
  onEntranceReady,
  onLoopActivate,
  onSocialOpen,
  progress,
  qualityLevel,
  reducedMotionEnabled,
  sectionVisibility,
  socialInteractionEnabled,
}) {
  return (
    <Suspense fallback={null}>
      <group visible={sectionVisibility.entrance}>
        <EntranceVerticalSlice
          aboutInteractionEnabled={sectionVisibility.entrance}
          onAboutOpen={onAboutOpen}
          portalAnimationEnabled={progress < 0.36}
          qualityLevel={qualityLevel}
          reducedMotionEnabled={reducedMotionEnabled}
        />
      </group>
      <group visible={sectionVisibility.provenance}>
        <ProvenanceGallery qualityLevel={qualityLevel} />
      </group>
      <group visible={sectionVisibility.finalRoute}>
        <FinalRouteEnvironment
          agendaEvents={agendaEvents}
          audioStories={audioStories}
          audioInteractionEnabled={audioInteractionEnabled}
          featuredBooks={featuredBooks}
          bookInteractionEnabled={bookInteractionEnabled}
          libraryAudioStories={libraryAudioStories}
          libraryBooks={libraryBooks}
          onAgendaOpen={onAgendaOpen}
          onAudioStorySelect={onAudioStorySelect}
          onBookSelect={onBookSelect}
          onLoopActivate={onLoopActivate}
          onSocialOpen={onSocialOpen}
          progress={progress}
          qualityLevel={qualityLevel}
          reducedMotionEnabled={reducedMotionEnabled}
          socialInteractionEnabled={socialInteractionEnabled}
        />
      </group>
      <group visible={sectionVisibility.signage}>
        <CategorySignage
          enabled={sectionVisibility.signage}
          progress={progress}
          qualityLevel={qualityLevel}
          reducedMotionEnabled={reducedMotionEnabled}
        />
      </group>
      <RouteLightRig
        lightQuality={lightQuality}
        qualityLevel={qualityLevel}
        ready={entranceReady}
        sectionVisibility={sectionVisibility}
      />
      <SceneWarmup
        contentSettled={contentSettled}
        onReady={onEntranceReady}
      />
    </Suspense>
  )
}
