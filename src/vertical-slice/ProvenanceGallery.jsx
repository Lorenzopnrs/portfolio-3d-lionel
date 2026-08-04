import { ProvenanceGalleryAsset } from './ProvenanceGalleryAsset'
import { getShadowMapSize } from '../performance/qualitySettings'

function ProvenanceGalleryLighting({ qualityLevel }) {
  const smallShadowMapSize = getShadowMapSize(256, qualityLevel)
  const largeShadowMapSize = getShadowMapSize(512, qualityLevel)

  return (
    <>
      <pointLight
        castShadow
        color="#f6a154"
        decay={2}
        distance={4.9}
        intensity={32.2}
        position={[-14.18, 2.08, 14.08]}
        shadow-bias={-0.0006}
        shadow-mapSize-height={smallShadowMapSize}
        shadow-mapSize-width={smallShadowMapSize}
        shadow-normalBias={0.04}
      />
      <pointLight
        castShadow={qualityLevel !== 'low'}
        color="#ff9d52"
        decay={2}
        distance={3.7}
        intensity={9.8}
        position={[-9.55, 2.08, 14.08]}
        shadow-bias={-0.0006}
        shadow-mapSize-height={largeShadowMapSize}
        shadow-mapSize-width={largeShadowMapSize}
        shadow-normalBias={0.035}
      />
      <pointLight
        color="#f08c3d"
        decay={2}
        distance={2.8}
        intensity={3.5}
        position={[-9.35, 1.35, 13.55]}
      />
      <pointLight
        color="#f3a35a"
        decay={2}
        distance={2.7}
        intensity={4.5}
        position={[-8.62, 1.55, 10.45]}
      />
      <pointLight
        color="#baa78f"
        decay={2}
        distance={9}
        intensity={10}
        position={[-11.15, 1.2, 12]}
      />
      <rectAreaLight
        color="#9ba9aa"
        height={3.4}
        intensity={1.4}
        position={[-6.72, 2.85, 12]}
        rotation={[0, Math.PI / 2, 0]}
        width={2.8}
      />
      <pointLight
        color="#aab4b2"
        decay={2}
        distance={5.2}
        intensity={1.8}
        position={[-6.7, 2.45, 12]}
      />
    </>
  )
}

export function ProvenanceGallery({ qualityLevel = 'high' }) {
  return (
    <group name="provenance-gallery">
      <ProvenanceGalleryAsset
        position={[-15, 0, 12]}
        qualityLevel={qualityLevel}
        rotation={[0, -Math.PI / 2, 0]}
      />
      <ProvenanceGalleryLighting qualityLevel={qualityLevel} />
    </group>
  )
}
