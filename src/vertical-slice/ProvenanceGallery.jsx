import { ProvenanceGalleryAsset } from './ProvenanceGalleryAsset'

function ProvenanceGalleryLighting() {
  return (
    <>
      <pointLight
        castShadow
        color="#ff9d52"
        decay={2}
        distance={3.5}
        intensity={8.5}
        position={[-9.55, 2.08, 14.08]}
        shadow-bias={-0.0006}
        shadow-mapSize-height={512}
        shadow-mapSize-width={512}
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

export function ProvenanceGallery() {
  return (
    <group name="provenance-gallery">
      <ProvenanceGalleryAsset
        position={[-15, 0, 12]}
        rotation={[0, -Math.PI / 2, 0]}
      />
      <ProvenanceGalleryLighting />
    </group>
  )
}
