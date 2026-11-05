import { ProvenanceGalleryAsset } from './ProvenanceGalleryAsset'

export function ProvenanceGallery({ qualityLevel = 'high' }) {
  return (
    <group name="provenance-gallery">
      <ProvenanceGalleryAsset
        position={[-15, 0, 12]}
        qualityLevel={qualityLevel}
        rotation={[0, -Math.PI / 2, 0]}
      />
    </group>
  )
}
