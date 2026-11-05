import { useEffect, useMemo, useState } from 'react'
import { Html } from '@react-three/drei'
import { createRotaryPhoneGeometries } from './rotaryPhoneGeometry.js'

// On the desk of the social networks wing.
const PHONE_POSITION = Object.freeze([-9.91, 0.905, -17.22])
const PHONE_ROTATION = Object.freeze([0, 1.33, 0])
const PHONE_SCALE = 1.15

export function ContactPhone({ interactionEnabled, onOpen }) {
  const geometries = useMemo(() => createRotaryPhoneGeometries(), [])
  const [hovered, setHovered] = useState(false)
  const active = interactionEnabled && hovered

  useEffect(
    () => () => {
      Object.values(geometries).forEach((geometry) => geometry.dispose())
    },
    [geometries],
  )

  useEffect(() => {
    if (!active) {
      return undefined
    }

    document.body.style.cursor = 'pointer'

    return () => {
      document.body.style.cursor = ''
    }
  }, [active])

  return (
    <group
      name="contact-rotary-phone"
      position={PHONE_POSITION}
      rotation={PHONE_ROTATION}
      scale={PHONE_SCALE}
    >
      <mesh castShadow geometry={geometries.body} receiveShadow>
        <meshStandardMaterial
          color="#16110d"
          emissive="#3a2a18"
          emissiveIntensity={active ? 0.55 : 0.12}
          metalness={0.25}
          roughness={0.3}
        />
      </mesh>
      <mesh geometry={geometries.brass}>
        <meshStandardMaterial
          color="#c99a45"
          emissive="#6e4a14"
          emissiveIntensity={active ? 0.8 : 0.3}
          metalness={0.55}
          roughness={0.34}
        />
      </mesh>
      <mesh geometry={geometries.label}>
        <meshStandardMaterial
          color="#e8dcc0"
          emissive="#e8dcc0"
          emissiveIntensity={0.08}
          roughness={0.8}
        />
      </mesh>
      {/* Larger than the phone, so it is easy to reach on a touch screen. */}
      <mesh
        position={[0, 0.11, 0]}
        onClick={(event) => {
          if (interactionEnabled) {
            event.stopPropagation()
            onOpen(null)
          }
        }}
        onPointerOut={() => setHovered(false)}
        onPointerOver={(event) => {
          if (interactionEnabled) {
            event.stopPropagation()
            setHovered(true)
          }
        }}
      >
        <boxGeometry args={[0.46, 0.34, 0.4]} />
        <meshBasicMaterial visible={false} />
      </mesh>
      {active && (
        <Html center position={[0, 0.32, 0]} zIndexRange={[3, 1]}>
          <div className="library-book-label" aria-hidden="true">
            <strong>Décrocher le téléphone</strong>
            <small>Réseaux sociaux</small>
          </div>
        </Html>
      )}
    </group>
  )
}
