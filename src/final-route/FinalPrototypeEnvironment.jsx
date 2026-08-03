import { EntranceVerticalSlice } from '../vertical-slice/EntranceVerticalSlice'
import { ProvenanceGallery } from '../vertical-slice/ProvenanceGallery'
import { CategorySignage } from './CategorySignage'
import { FinalRouteEnvironment } from './FinalRouteEnvironment'

export function FinalPrototypeEnvironment({
  audioInteractionEnabled,
  bookInteractionEnabled,
  onAboutOpen,
  onAudioStorySelect,
  onBookSelect,
  onSocialOpen,
  reducedMotionEnabled,
  socialInteractionEnabled,
}) {
  return (
    <>
      <EntranceVerticalSlice
        onAboutOpen={onAboutOpen}
        reducedMotionEnabled={reducedMotionEnabled}
      />
      <ProvenanceGallery />
      <FinalRouteEnvironment
        audioInteractionEnabled={audioInteractionEnabled}
        bookInteractionEnabled={bookInteractionEnabled}
        onAudioStorySelect={onAudioStorySelect}
        onBookSelect={onBookSelect}
        onSocialOpen={onSocialOpen}
        socialInteractionEnabled={socialInteractionEnabled}
      />

      <CategorySignage reducedMotionEnabled={reducedMotionEnabled} />
    </>
  )
}
