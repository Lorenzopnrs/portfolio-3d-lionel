import { FinalRouteAsset } from './FinalRouteAsset'
import { getShadowMapSize } from '../performance/qualitySettings'
import { MagicalPortal } from '../vertical-slice/AboutPortal'
import {
  FINAL_LOOP_PORTAL_POSITION,
  FINAL_LOOP_PORTAL_ROTATION,
  FINAL_ROUTE_POSITION,
  FINAL_ROUTE_ROTATION,
} from './finalRoutePlacement'

function FinalRouteLighting({ qualityLevel }) {
  const smallShadowMapSize = getShadowMapSize(256, qualityLevel)
  const largeShadowMapSize = getShadowMapSize(512, qualityLevel)

  return (
    <>
      <pointLight
        castShadow={qualityLevel !== 'low'}
        color="#f7a052"
        decay={2}
        distance={5.3}
        intensity={50.6}
        position={[-6.45, 3.4, 12]}
        shadow-bias={-0.0006}
        shadow-mapSize-height={smallShadowMapSize}
        shadow-mapSize-width={smallShadowMapSize}
        shadow-normalBias={0.04}
      />
      <pointLight
        castShadow
        color="#ffa257"
        decay={2}
        distance={2.9}
        intensity={66.7}
        position={[-3.8, 3.45, 12]}
        shadow-bias={-0.0006}
        shadow-mapSize-height={largeShadowMapSize}
        shadow-mapSize-width={largeShadowMapSize}
        shadow-normalBias={0.035}
      />
      <pointLight
        color="#f3903f"
        decay={2}
        distance={6.1}
        intensity={48.3}
        position={[1.15, 3.4, 12]}
      />
      <pointLight
        color="#c8aa89"
        decay={2}
        distance={9}
        intensity={7}
        position={[-2.2, 1.25, 12]}
      />
      <rectAreaLight
        color="#96a5a5"
        height={3.8}
        intensity={2.1}
        position={[4.1, 3.1, 8.6]}
        rotation={[-Math.PI / 2, 0, 0]}
        width={3}
      />
      <pointLight
        castShadow={qualityLevel !== 'low'}
        color="#f79a4d"
        decay={2}
        distance={5}
        intensity={38}
        position={[4.15, 2.25, 5.3]}
        shadow-bias={-0.0006}
        shadow-mapSize-height={smallShadowMapSize}
        shadow-mapSize-width={smallShadowMapSize}
        shadow-normalBias={0.04}
      />
      <pointLight
        color="#ffac61"
        decay={2}
        distance={5.8}
        intensity={48.3}
        position={[9.85, 2.55, 4]}
      />
      <pointLight
        color="#b9aa98"
        decay={2}
        distance={8}
        intensity={5.5}
        position={[4.2, 1.3, 4]}
      />
      <rectAreaLight
        color="#8c9d9f"
        height={3.2}
        intensity={1.9}
        position={[13.25, 2.8, 4]}
        rotation={[0, -Math.PI / 2, 0]}
        width={2.7}
      />
      <pointLight
        color="#9da9a7"
        decay={2}
        distance={6}
        intensity={6.5}
        position={[13.1, 2.3, 4]}
      />
    </>
  )
}

export function FinalRouteEnvironment({
  audioStories,
  audioInteractionEnabled,
  featuredBooks,
  bookInteractionEnabled,
  onAudioStorySelect,
  onBookSelect,
  onLoopActivate,
  onSocialOpen,
  progress,
  qualityLevel = 'high',
  reducedMotionEnabled,
  socialContent,
  socialInteractionEnabled,
  socialLinks,
}) {
  return (
    <group name="final-approved-route">
      <FinalRouteAsset
        audioStories={audioStories}
        audioInteractionEnabled={audioInteractionEnabled}
        featuredBooks={featuredBooks}
        bookInteractionEnabled={bookInteractionEnabled}
        onAudioStorySelect={onAudioStorySelect}
        onBookSelect={onBookSelect}
        onSocialOpen={onSocialOpen}
        position={FINAL_ROUTE_POSITION}
        qualityLevel={qualityLevel}
        rotation={FINAL_ROUTE_ROTATION}
        socialContent={socialContent}
        socialInteractionEnabled={socialInteractionEnabled}
        socialLinks={socialLinks}
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
      <FinalRouteLighting qualityLevel={qualityLevel} />
    </group>
  )
}
