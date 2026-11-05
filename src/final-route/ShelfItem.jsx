import { useEffect, useRef, useState } from 'react'
import { Html } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'

const PULL_DISTANCE = 0.2
const PULL_SPEED = 9
const RESTING_GLOW = 0.05
const ACTIVE_GLOW = 0.24

export function ShelfItem({
  entry,
  geometry,
  interactionEnabled,
  isActive,
  labelSubtitle,
  labelTitle,
  material,
  name,
  onHoverEnd,
  onHoverStart,
  onSelect,
  reducedMotionEnabled,
}) {
  const { position } = entry
  const itemId = entry.item.id
  const groupRef = useRef(null)
  const meshRef = useRef(null)

  useFrame((_, delta) => {
    const group = groupRef.current
    const mesh = meshRef.current

    if (!group || !mesh) {
      return
    }

    mesh.material.emissiveIntensity = isActive
      ? ACTIVE_GLOW
      : RESTING_GLOW

    const target = position[2] + (isActive ? PULL_DISTANCE : 0)

    if (Math.abs(group.position.z - target) < 0.0005) {
      return
    }

    group.position.z = reducedMotionEnabled
      ? target
      : group.position.z +
        (target - group.position.z) *
          (1 - Math.exp(-PULL_SPEED * delta))
  })

  return (
    <group ref={groupRef} position={position}>
      <mesh
        ref={meshRef}
        geometry={geometry}
        material={material}
        name={name}
        receiveShadow
        rotation={[entry.tilt ?? 0, 0, 0]}
        onClick={(event) => {
          if (interactionEnabled) {
            event.stopPropagation()
            onSelect(itemId)
          }
        }}
        onPointerOut={(event) => {
          event.stopPropagation()
          onHoverEnd(itemId)
        }}
        onPointerOver={(event) => {
          if (interactionEnabled) {
            event.stopPropagation()
            onHoverStart(itemId)
          }
        }}
      />
      {isActive && (
        <Html
          center
          position={[0, entry.height / 2 + 0.07, entry.depth / 2]}
          zIndexRange={[3, 1]}
        >
          <div className="library-book-label" aria-hidden="true">
            <strong>{labelTitle}</strong>
            <small>{labelSubtitle}</small>
          </div>
        </Html>
      )}
    </group>
  )
}

export function ShelfItemGroup({
  entries,
  interactionEnabled,
  name,
  position,
  renderItem,
  rotation,
  scale,
}) {
  const [hoveredItemId, setHoveredItemId] = useState(null)
  const activeItemId = interactionEnabled ? hoveredItemId : null

  useEffect(() => {
    if (!activeItemId) {
      return undefined
    }

    document.body.style.cursor = 'pointer'

    return () => {
      document.body.style.cursor = ''
    }
  }, [activeItemId])

  return (
    <group
      name={name}
      position={position}
      rotation={rotation}
      scale={scale}
    >
      {entries.map((entry) =>
        renderItem(entry, {
          isActive: activeItemId === entry.item.id,
          onHoverEnd: (itemId) =>
            setHoveredItemId((current) =>
              current === itemId ? null : current,
            ),
          onHoverStart: setHoveredItemId,
        }),
      )}
    </group>
  )
}
