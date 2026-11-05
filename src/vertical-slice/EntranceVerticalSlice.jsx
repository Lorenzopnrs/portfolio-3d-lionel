import { EntranceAssetLibrary } from './EntranceAssetLibrary'
import { AboutPortal } from './AboutPortal'

export function EntranceVerticalSlice({
  aboutInteractionEnabled = true,
  onAboutOpen,
  portalAnimationEnabled = true,
  qualityLevel = 'high',
  reducedMotionEnabled,
}) {
  return (
    <group name="entrance-vertical-slice">
      <EntranceAssetLibrary
        position={[-18, 0, 30]}
        qualityLevel={qualityLevel}
      />
      <AboutPortal
        animationEnabled={portalAnimationEnabled}
        interactionEnabled={aboutInteractionEnabled}
        onActivate={onAboutOpen}
        reducedMotionEnabled={reducedMotionEnabled}
      />
    </group>
  )
}
