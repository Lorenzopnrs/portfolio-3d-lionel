import { EntranceAssetLibrary } from './EntranceAssetLibrary'
import { AboutPortal } from './AboutPortal'
import { getShadowMapSize } from '../performance/qualitySettings'

function EntranceLighting({ qualityLevel }) {
  const shadowMapSize = getShadowMapSize(512, qualityLevel)

  return (
    <>
      <pointLight
        castShadow
        color="#ff9d4d"
        decay={2}
        distance={7}
        intensity={29.1}
        position={[-18, 3.25, 25]}
        shadow-bias={-0.0006}
        shadow-mapSize-height={shadowMapSize}
        shadow-mapSize-width={shadowMapSize}
        shadow-normalBias={0.035}
      />
      <pointLight
        color="#f28b35"
        decay={2}
        distance={3}
        intensity={5}
        position={[-20.05, 1.18, 26.48]}
      />
      <pointLight
        color="#ffad63"
        decay={2}
        distance={4.2}
        intensity={8}
        position={[-20.32, 1.62, 22.95]}
      />
      <pointLight
        color="#f59a45"
        decay={2}
        distance={6.1}
        intensity={20.7}
        position={[-18, 3.18, 16.65]}
      />
      <pointLight
        color="#ffad62"
        decay={2}
        distance={4}
        intensity={7}
        position={[-15.68, 1.62, 14.85]}
      />
      <pointLight
        color="#ed8734"
        decay={2}
        distance={2.8}
        intensity={3.5}
        position={[-20.08, 0.55, 13.65]}
      />
      <rectAreaLight
        color="#adb7b2"
        height={4.8}
        intensity={3.6}
        position={[-18, 3.3, 10.2]}
        rotation={[0, Math.PI, 0]}
        width={3.6}
      />
      <pointLight
        color="#aebbb8"
        decay={2}
        distance={8.5}
        intensity={5}
        position={[-18, 2.8, 10.4]}
      />
    </>
  )
}

export function EntranceVerticalSlice({
  onReady,
  onAboutOpen,
  portalAnimationEnabled = true,
  qualityLevel = 'high',
  reducedMotionEnabled,
}) {
  return (
    <group name="entrance-vertical-slice">
      <EntranceAssetLibrary
        onReady={onReady}
        position={[-18, 0, 30]}
        qualityLevel={qualityLevel}
      />
      <AboutPortal
        animationEnabled={portalAnimationEnabled}
        onActivate={onAboutOpen}
        reducedMotionEnabled={reducedMotionEnabled}
      />
      <EntranceLighting qualityLevel={qualityLevel} />
    </group>
  )
}
