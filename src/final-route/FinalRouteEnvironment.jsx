import { FinalRouteAsset } from './FinalRouteAsset'
import { MagicalPortal } from '../vertical-slice/AboutPortal'
import {
  FINAL_LOOP_PORTAL_POSITION,
  FINAL_LOOP_PORTAL_ROTATION,
  FINAL_ROUTE_POSITION,
  FINAL_ROUTE_ROTATION,
} from './finalRoutePlacement'

export function FinalRouteEnvironment({
  agendaEvents,
  audioStories,
  audioInteractionEnabled,
  featuredBooks,
  bookInteractionEnabled,
  libraryAudioStories,
  libraryBooks,
  onAgendaOpen,
  onAudioStorySelect,
  onBookSelect,
  onLoopActivate,
  onSocialOpen,
  progress,
  qualityLevel = 'high',
  reducedMotionEnabled,
  socialInteractionEnabled,
}) {
  return (
    <group name="final-approved-route">
      <FinalRouteAsset
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
        onSocialOpen={onSocialOpen}
        position={FINAL_ROUTE_POSITION}
        qualityLevel={qualityLevel}
        reducedMotionEnabled={reducedMotionEnabled}
        rotation={FINAL_ROUTE_ROTATION}
        socialInteractionEnabled={socialInteractionEnabled}
      />
      <MagicalPortal
        animationEnabled={progress > 0.78}
        ariaLabel="Revenir au début du portfolio"
        groupName="final-loop-portal"
        interactionEnabled={progress > 0.9}
        onActivate={onLoopActivate}
        position={FINAL_LOOP_PORTAL_POSITION}
        reducedMotionEnabled={reducedMotionEnabled}
        rotation={FINAL_LOOP_PORTAL_ROTATION}
        title="RETOUR AU DEBUT"
        titleName="final-loop-portal-title"
        triggerAttribute="data-final-loop-trigger"
      />
    </group>
  )
}
