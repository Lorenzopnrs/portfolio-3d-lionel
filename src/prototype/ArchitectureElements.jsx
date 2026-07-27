import { DoubleSide } from 'three'
import { BLOCKOUT_COLORS } from './blockoutPalette'

const ARCH_SEGMENT_COUNT = 9
const archSegments = Array.from(
  { length: ARCH_SEGMENT_COUNT },
  (_, index) => (Math.PI * (index + 0.5)) / ARCH_SEGMENT_COUNT,
)

export function Block({
  color = BLOCKOUT_COLORS.stone,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  size,
}) {
  return (
    <mesh position={position} rotation={rotation}>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} roughness={1} />
    </mesh>
  )
}

export function FloorPlate({
  color = BLOCKOUT_COLORS.floor,
  position = [0, 0, 0],
  size,
}) {
  return (
    <Block
      color={color}
      position={[position[0], position[1] - 0.12, position[2]]}
      size={[size[0], 0.24, size[1]]}
    />
  )
}

export function DeepArchway({
  color = BLOCKOUT_COLORS.stoneLight,
  depth = 1,
  openingHeight = 4.6,
  openingWidth = 3.4,
  pierWidth = 0.55,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
}) {
  const radius = openingWidth / 2
  const archRadius = radius + pierWidth / 2
  const springHeight = openingHeight - radius
  const segmentLength =
    ((Math.PI * archRadius) / ARCH_SEGMENT_COUNT) * 1.08

  return (
    <group position={position} rotation={rotation}>
      <Block
        color={color}
        position={[-radius - pierWidth / 2, springHeight / 2, 0]}
        size={[pierWidth, springHeight, depth]}
      />
      <Block
        color={color}
        position={[radius + pierWidth / 2, springHeight / 2, 0]}
        size={[pierWidth, springHeight, depth]}
      />

      {archSegments.map((angle) => (
        <Block
          key={angle}
          color={color}
          position={[
            Math.cos(angle) * archRadius,
            springHeight + Math.sin(angle) * archRadius,
            0,
          ]}
          rotation={[0, 0, angle - Math.PI / 2]}
          size={[segmentLength, pierWidth, depth]}
        />
      ))}
    </group>
  )
}

export function PortalWall({
  color = BLOCKOUT_COLORS.stone,
  openingHeight = 4.6,
  openingWidth = 3.4,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  wallDepth = 1,
  wallHeight = 5.4,
  wallWidth = 8,
}) {
  const pierWidth = 0.58
  const framedOpeningWidth = openingWidth + pierWidth * 2
  const wingWidth = Math.max(0, (wallWidth - framedOpeningWidth) / 2)
  const archTop = openingHeight + pierWidth
  const upperHeight = Math.max(0, wallHeight - archTop)

  return (
    <group position={position} rotation={rotation}>
      {wingWidth > 0 && (
        <>
          <Block
            color={color}
            position={[
              -(framedOpeningWidth + wingWidth) / 2,
              wallHeight / 2,
              0,
            ]}
            size={[wingWidth, wallHeight, wallDepth]}
          />
          <Block
            color={color}
            position={[
              (framedOpeningWidth + wingWidth) / 2,
              wallHeight / 2,
              0,
            ]}
            size={[wingWidth, wallHeight, wallDepth]}
          />
        </>
      )}

      {upperHeight > 0 && (
        <Block
          color={color}
          position={[0, archTop + upperHeight / 2, 0]}
          size={[framedOpeningWidth, upperHeight, wallDepth]}
        />
      )}

      <DeepArchway
        color={BLOCKOUT_COLORS.stoneLight}
        depth={wallDepth + 0.04}
        openingHeight={openingHeight}
        openingWidth={openingWidth}
        pierWidth={pierWidth}
      />
    </group>
  )
}

export function VaultedPassage({
  color = BLOCKOUT_COLORS.stone,
  floor = true,
  height = 5,
  length = 8,
  negativeSideWall = true,
  positiveSideWall = true,
  position = [0, 0, 0],
  ribCount = 2,
  rotation = [0, 0, 0],
  width = 4.8,
}) {
  const radius = width / 2
  const springHeight = height - radius
  const wallThickness = 0.62
  const ribs = Array.from({ length: ribCount }, (_, index) => {
    if (ribCount === 1) {
      return 0
    }

    return -length / 2 + (length * index) / (ribCount - 1)
  })

  return (
    <group position={position} rotation={rotation}>
      {floor && <FloorPlate size={[width + wallThickness * 2, length]} />}

      {negativeSideWall && (
        <Block
          color={color}
          position={[-radius - wallThickness / 2, springHeight / 2, 0]}
          size={[wallThickness, springHeight, length]}
        />
      )}
      {positiveSideWall && (
        <Block
          color={color}
          position={[radius + wallThickness / 2, springHeight / 2, 0]}
          size={[wallThickness, springHeight, length]}
        />
      )}

      <mesh
        position={[0, springHeight, 0]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <cylinderGeometry
          args={[
            radius,
            radius,
            length,
            18,
            1,
            true,
            Math.PI / 2,
            Math.PI,
          ]}
        />
        <meshStandardMaterial
          color={BLOCKOUT_COLORS.stoneDark}
          roughness={1}
          side={DoubleSide}
        />
      </mesh>

      {ribs.map((zPosition) => (
        <DeepArchway
          key={zPosition}
          color={BLOCKOUT_COLORS.stoneLight}
          depth={0.16}
          openingHeight={height}
          openingWidth={width}
          pierWidth={0.16}
          position={[0, 0, zPosition]}
        />
      ))}
    </group>
  )
}

export function StairFlight({
  color = BLOCKOUT_COLORS.floor,
  position = [0, 0, 0],
  rise = 4,
  rotation = [0, 0, 0],
  run = 12,
  stepCount = 24,
  width = 3.4,
}) {
  const tread = run / stepCount
  const riser = rise / stepCount
  const steps = Array.from({ length: stepCount }, (_, index) => {
    const topHeight = (index + 1) * riser

    return {
      id: `step-${index}`,
      height: topHeight,
      position: [0, topHeight / 2, -(index + 0.5) * tread],
    }
  })

  return (
    <group position={position} rotation={rotation}>
      {steps.map((step) => (
        <Block
          key={step.id}
          color={color}
          position={step.position}
          size={[width, step.height, tread + 0.02]}
        />
      ))}
    </group>
  )
}
