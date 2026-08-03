import { useEffect, useMemo, useRef, useState } from 'react'
import { Html } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import {
  CanvasTexture,
  ClampToEdgeWrapping,
  MeshStandardMaterial,
  SRGBColorSpace,
  Vector3,
} from 'three'
import { CATEGORY_SIGN_URL } from '../assets/runtimeAssetPaths.js'
import { useSafeTexture } from '../assets/useSafeTexture.js'
import {
  EVALUATION_STOPS,
  getPathPlacement,
} from '../prototype/cameraPath'

const SIGN_VISIBILITY_DISTANCE_SQUARED = 144
const SIGN_CENTER_Y = 3.12
const SIGN_CENTER_Z = -1.55
const SIGN_ANCHOR_Y = 4.55
const CHAIN_LINK_COUNT = 8

const SIGN_WIDTHS = Object.freeze({
  about: 2.6,
  projects: 2.15,
  social: 2.8,
  contact: 2.85,
})

const SIGN_PLANKS = Object.freeze([
  Object.freeze({ y: 0.25, height: 0.27, widthScale: 0.96, tilt: 0.012 }),
  Object.freeze({ y: 0, height: 0.3, widthScale: 1, tilt: -0.006 }),
  Object.freeze({ y: -0.26, height: 0.28, widthScale: 0.94, tilt: 0.009 }),
])

function createWoodTexture(referenceTexture) {
  const sourceImage = referenceTexture.image
  const sourceWidth = sourceImage.naturalWidth ?? sourceImage.width
  const sourceHeight = sourceImage.naturalHeight ?? sourceImage.height
  const canvas = document.createElement('canvas')
  canvas.width = 768
  canvas.height = 256
  const context = canvas.getContext('2d')

  if (!context) {
    return referenceTexture.clone()
  }

  context.drawImage(
    sourceImage,
    sourceWidth * 0.28,
    sourceHeight * 0.33,
    sourceWidth * 0.45,
    sourceHeight * 0.14,
    0,
    0,
    canvas.width,
    canvas.height,
  )
  context.fillStyle = 'rgb(54 29 14 / 16%)'
  context.fillRect(0, 0, canvas.width, canvas.height)

  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.wrapS = ClampToEdgeWrapping
  texture.wrapT = ClampToEdgeWrapping
  texture.anisotropy = 8
  texture.needsUpdate = true
  return texture
}

function SuspensionChain({ ironMaterial, x, z }) {
  const boardTop = SIGN_CENTER_Y + 0.48
  const availableHeight = SIGN_ANCHOR_Y - boardTop
  const spacing = availableHeight / (CHAIN_LINK_COUNT - 1)

  return (
    <group>
      <mesh
        castShadow
        material={ironMaterial}
        position={[x, SIGN_ANCHOR_Y + 0.08, z]}
      >
        <cylinderGeometry args={[0.045, 0.055, 0.18, 10]} />
      </mesh>
      {Array.from({ length: CHAIN_LINK_COUNT }, (_, index) => (
        <mesh
          key={index}
          castShadow
          material={ironMaterial}
          position={[x, boardTop + spacing * index, z]}
          rotation={
            index % 2 === 0
              ? [0, 0, 0]
              : [Math.PI / 2, 0, 0]
          }
        >
          <torusGeometry args={[0.067, 0.017, 6, 12]} />
        </mesh>
      ))}
    </group>
  )
}

function SignFace({ label, position, reducedMotionEnabled }) {
  const longLabel = label.length > 16

  return (
    <Html
      center
      distanceFactor={7}
      occlude
      position={position}
      zIndexRange={[2, 0]}
    >
      <div
        className={`category-sign-label${longLabel ? ' is-long' : ''}${reducedMotionEnabled ? ' is-reduced-motion' : ''}`}
        aria-hidden="true"
      >
        {label}
      </div>
    </Html>
  )
}

function SuspendedCategorySign({
  id,
  label,
  progress,
  reducedMotionEnabled,
  woodMaterial,
  ironMaterial,
}) {
  const placement = getPathPlacement(progress)
  const signPosition = useMemo(
    () => new Vector3(...placement.position),
    [placement.position],
  )
  const visibilityRef = useRef(false)
  const [isVisible, setIsVisible] = useState(false)
  const width = SIGN_WIDTHS[id]
  const chainOffset = Math.min(0.88, width * 0.32)

  useFrame(({ camera }) => {
    const nextVisibility =
      camera.position.distanceToSquared(signPosition) <=
      SIGN_VISIBILITY_DISTANCE_SQUARED

    if (nextVisibility !== visibilityRef.current) {
      visibilityRef.current = nextVisibility
      setIsVisible(nextVisibility)
    }
  })

  return (
    <group
      name={`suspended-category-sign-${id}`}
      position={placement.position}
      rotation={placement.rotation}
      visible={isVisible}
    >
      {SIGN_PLANKS.map((plank, index) => (
        <mesh
          key={index}
          castShadow
          receiveShadow
          material={woodMaterial}
          position={[0, SIGN_CENTER_Y + plank.y, SIGN_CENTER_Z]}
          rotation={[0, index === 1 ? 0.012 : -0.01, plank.tilt]}
        >
          <boxGeometry
            args={[width * plank.widthScale, plank.height, 0.16]}
          />
        </mesh>
      ))}

      {[-chainOffset, chainOffset].map((x) => (
        <SuspensionChain
          key={x}
          ironMaterial={ironMaterial}
          x={x}
          z={SIGN_CENTER_Z}
        />
      ))}

      {[-chainOffset, chainOffset].flatMap((x) =>
        [-1, 1].map((side) => (
          <mesh
            key={`${x}-${side}`}
            material={ironMaterial}
            position={[
              x,
              SIGN_CENTER_Y + 0.34,
              SIGN_CENTER_Z + side * 0.086,
            ]}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <cylinderGeometry args={[0.036, 0.036, 0.018, 10]} />
          </mesh>
        )),
      )}

      {isVisible && (
        <>
          <SignFace
            label={label}
            position={[0, SIGN_CENTER_Y, SIGN_CENTER_Z + 0.092]}
            reducedMotionEnabled={reducedMotionEnabled}
          />
          <SignFace
            label={label}
            position={[0, SIGN_CENTER_Y, SIGN_CENTER_Z - 0.092]}
            reducedMotionEnabled={reducedMotionEnabled}
          />
          <pointLight
            color="#9ecbd8"
            decay={2}
            distance={1.8}
            intensity={0.75}
            position={[0, SIGN_CENTER_Y, SIGN_CENTER_Z + 0.34]}
          />
        </>
      )}
    </group>
  )
}

export function CategorySignage({ reducedMotionEnabled = false }) {
  const referenceTexture = useSafeTexture(CATEGORY_SIGN_URL, {
    fallbackColor: '#5b351c',
    fallbackHeight: 512,
    fallbackLabel: 'Category sign',
    fallbackWidth: 768,
  })
  const woodTexture = useMemo(
    () => createWoodTexture(referenceTexture),
    [referenceTexture],
  )
  const woodMaterial = useMemo(
    () =>
      new MeshStandardMaterial({
        color: '#744820',
        map: woodTexture,
        metalness: 0,
        roughness: 0.94,
      }),
    [woodTexture],
  )
  const ironMaterial = useMemo(
    () =>
      new MeshStandardMaterial({
        color: '#211d19',
        metalness: 0.74,
        roughness: 0.7,
      }),
    [],
  )
  const categoryStops = EVALUATION_STOPS.filter(
    (stop) => stop.id !== 'entrance',
  )

  useEffect(
    () => () => {
      woodMaterial.dispose()
      ironMaterial.dispose()
      woodTexture.dispose()
    },
    [ironMaterial, woodMaterial, woodTexture],
  )

  return categoryStops.map((stop) => (
    <SuspendedCategorySign
      key={stop.id}
      {...stop}
      ironMaterial={ironMaterial}
      reducedMotionEnabled={reducedMotionEnabled}
      woodMaterial={woodMaterial}
    />
  ))
}
