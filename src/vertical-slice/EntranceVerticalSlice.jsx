import { useMemo } from 'react'
import { Instance, Instances } from '@react-three/drei'
import { CatmullRomCurve3, Path, Shape, Vector3 } from 'three'
import { BlenderPipelineBookshelf } from './BlenderPipelineBookshelf'
import { getVerticalSliceMaterials } from './useVerticalSliceMaterials'

const floorVariation = [
  { lift: 0, rotation: -0.006 },
  { lift: 0.008, rotation: 0.01 },
  { lift: -0.005, rotation: -0.013 },
  { lift: 0.004, rotation: 0.005 },
]

const VINE_PATHS = [
  [
    [0, 0, 0],
    [0.08, 0.75, -0.12],
    [-0.02, 1.55, 0.1],
    [0.13, 2.35, -0.08],
    [0.06, 3.15, 0.16],
    [0.2, 4.05, -0.05],
  ],
  [
    [0, 0, 0],
    [-0.05, 0.65, 0.18],
    [0.08, 1.25, -0.04],
    [-0.03, 1.9, 0.15],
    [0.11, 2.65, -0.12],
  ],
  [
    [0, 0, 0],
    [0.06, 0.65, 0.14],
    [-0.04, 1.25, -0.08],
    [0.12, 1.85, 0.12],
    [0.02, 2.55, -0.14],
  ],
]

function MaterialBox({
  castShadow = true,
  material,
  position = [0, 0, 0],
  receiveShadow = true,
  rotation = [0, 0, 0],
  size,
}) {
  return (
    <mesh
      castShadow={castShadow}
      position={position}
      receiveShadow={receiveShadow}
      rotation={rotation}
    >
      <boxGeometry args={size} />
      <primitive attach="material" object={material} />
    </mesh>
  )
}

function MasonrySkin({
  height,
  length,
  materials,
  side,
  width,
}) {
  const courseHeight = 0.64
  const courseCount = Math.ceil(height / courseHeight)
  const columnCount = Math.ceil(length / 1.4) + 1
  const blockLength = length / (columnCount - 1)
  const wallX = side * (width / 2 - 0.035)
  const blocks = useMemo(
    () =>
      Array.from(
        { length: courseCount * columnCount },
        (_, index) => {
          const course = Math.floor(index / columnCount)
          const column = index % columnCount
          const offset = course % 2 === 0 ? 0 : blockLength * 0.46
          const zPosition =
            -length / 2 +
            blockLength * (column + 0.5) +
            offset

          if (zPosition > length / 2 + blockLength * 0.25) {
            return null
          }

          const heightVariation =
            ((index * 17) % 5) * 0.006 - 0.012
          const depthVariation = ((index * 23) % 4) * 0.008

          return {
            materialIndex:
              (course + column * 2) % materials.ashlarVariants.length,
            position: [
              wallX - side * depthVariation,
              courseHeight * (course + 0.5) + heightVariation,
              zPosition,
            ],
            scale: [
              0.065 + depthVariation,
              courseHeight - 0.035,
              blockLength - 0.045,
            ],
          }
        },
      ).filter(Boolean),
    [
      blockLength,
      columnCount,
      courseCount,
      length,
      materials.ashlarVariants.length,
      side,
      wallX,
    ],
  )

  return (
    <group>
      {materials.ashlarVariants.map((material, materialIndex) => {
        const instances = blocks.filter(
          (block) => block.materialIndex === materialIndex,
        )

        return (
          <Instances
            key={`${side}-${materialIndex}`}
            castShadow
            limit={instances.length}
            receiveShadow
          >
            <boxGeometry />
            <primitive attach="material" object={material} />
            {instances.map((block, index) => (
              <Instance
                key={`${materialIndex}-${index}`}
                position={block.position}
                scale={block.scale}
              />
            ))}
          </Instances>
        )
      })}
    </group>
  )
}

function StoneArch({
  depth,
  detail = true,
  materialIndex = 1,
  materials,
  openingHeight,
  openingWidth,
  pierWidth,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
}) {
  const radius = openingWidth / 2
  const outerRadius = radius + pierWidth
  const springHeight = openingHeight - radius
  const archShape = useMemo(() => {
    const shape = new Shape()
    shape.moveTo(-outerRadius, 0)
    shape.lineTo(-outerRadius, springHeight)
    shape.absarc(
      0,
      springHeight,
      outerRadius,
      Math.PI,
      0,
      true,
    )
    shape.lineTo(outerRadius, 0)
    shape.closePath()

    const opening = new Path()
    opening.moveTo(-radius, 0)
    opening.lineTo(radius, 0)
    opening.lineTo(radius, springHeight)
    opening.absarc(0, springHeight, radius, 0, Math.PI, false)
    opening.closePath()
    shape.holes.push(opening)

    return shape
  }, [outerRadius, radius, springHeight])
  const extrusionArgs = useMemo(
    () => [
      archShape,
      {
        bevelEnabled: false,
        curveSegments: 32,
        depth,
        steps: 1,
      },
    ],
    [archShape, depth],
  )

  return (
    <group position={position} rotation={rotation}>
      <mesh castShadow position={[0, 0, -depth / 2]} receiveShadow>
        <extrudeGeometry args={extrusionArgs} />
        <primitive
          attach="material"
          object={materials.stoneVariants[materialIndex]}
        />
      </mesh>
      {detail && (
        <>
          {[-1, 1].map((side) => (
            <group
              key={side}
              position={[side * (radius + pierWidth / 2), 0, 0]}
            >
              <MaterialBox
                material={materials.stoneVariants[2]}
                position={[0, 0.13, 0]}
                size={[pierWidth + 0.24, 0.26, depth + 0.22]}
              />
              <MaterialBox
                material={materials.stoneVariants[0]}
                position={[0, 0.36, 0]}
                size={[pierWidth + 0.12, 0.2, depth + 0.12]}
              />
              <MaterialBox
                material={materials.stoneVariants[2]}
                position={[0, springHeight - 0.04, 0]}
                size={[pierWidth + 0.22, 0.22, depth + 0.2]}
              />
            </group>
          ))}
          <MaterialBox
            material={materials.stoneVariants[2]}
            position={[
              0,
              openingHeight + pierWidth * 0.5,
              -depth * 0.04,
            ]}
            rotation={[0, 0, 0.025]}
            size={[
              Math.max(0.34, pierWidth * 0.72),
              pierWidth * 0.92,
              depth + 0.18,
            ]}
          />
        </>
      )}
    </group>
  )
}

function SlabFloor({
  length,
  materials,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  width,
}) {
  const columnCount = Math.max(3, Math.round(width / 1.15))
  const rowCount = Math.max(3, Math.ceil(length / 1.05))
  const slabWidth = width / columnCount
  const slabLength = length / rowCount

  return (
    <group position={position} rotation={rotation}>
      {Array.from({ length: columnCount * rowCount }, (_, index) => {
        const column = index % columnCount
        const row = Math.floor(index / columnCount)
        const variation = floorVariation[index % floorVariation.length]

        return (
          <MaterialBox
            key={`${column}-${row}`}
            material={materials.floorVariants[index % 2]}
            position={[
              -width / 2 + slabWidth * (column + 0.5),
              -0.075 + variation.lift,
              -length / 2 + slabLength * (row + 0.5),
            ]}
            rotation={[0, variation.rotation, 0]}
            size={[
              slabWidth - 0.045,
              0.15,
              slabLength - 0.05,
            ]}
          />
        )
      })}
    </group>
  )
}

function VaultedPassage({
  height,
  length,
  materials,
  negativeSideWall = true,
  positiveSideWall = true,
  position,
  ribCount,
  width,
}) {
  const radius = width / 2
  const springHeight = height - radius
  const wallThickness = 0.8
  const ribs = Array.from({ length: ribCount }, (_, index) =>
    ribCount === 1
      ? 0
      : -length / 2 + (length * index) / (ribCount - 1),
  )

  return (
    <group position={position}>
      <SlabFloor length={length} materials={materials} width={width + 1.1} />

      {negativeSideWall && (
        <>
          <MaterialBox
            material={materials.stoneVariants[0]}
            position={[
              -radius - wallThickness / 2,
              springHeight / 2,
              0,
            ]}
            size={[wallThickness, springHeight, length]}
          />
          <MaterialBox
            material={materials.stoneVariants[2]}
            position={[-radius + 0.08, 0.27, 0]}
            size={[0.18, 0.54, length]}
          />
          <MaterialBox
            material={materials.stoneVariants[2]}
            position={[-radius + 0.075, springHeight - 0.13, 0]}
            size={[0.16, 0.26, length]}
          />
          <MasonrySkin
            height={springHeight}
            length={length}
            materials={materials}
            side={-1}
            width={width}
          />
        </>
      )}

      {positiveSideWall && (
        <>
          <MaterialBox
            material={materials.stoneVariants[1]}
            position={[
              radius + wallThickness / 2,
              springHeight / 2,
              0,
            ]}
            size={[wallThickness, springHeight, length]}
          />
          <MaterialBox
            material={materials.stoneVariants[2]}
            position={[radius - 0.08, 0.27, 0]}
            size={[0.18, 0.54, length]}
          />
          <MaterialBox
            material={materials.stoneVariants[2]}
            position={[radius - 0.075, springHeight - 0.13, 0]}
            size={[0.16, 0.26, length]}
          />
          <MasonrySkin
            height={springHeight}
            length={length}
            materials={materials}
            side={1}
            width={width}
          />
        </>
      )}

      <mesh
        castShadow
        position={[0, springHeight, 0]}
        receiveShadow
        rotation={[Math.PI / 2, 0, 0]}
      >
        <cylinderGeometry
          args={[
            radius,
            radius,
            length,
            32,
            4,
            true,
            Math.PI / 2,
            Math.PI,
          ]}
        />
        <primitive attach="material" object={materials.stoneDark} />
      </mesh>

      {ribs.map((zPosition, index) => (
        <StoneArch
          key={zPosition}
          depth={0.28}
          materials={materials}
          openingHeight={height}
          openingWidth={width}
          pierWidth={0.24 + (index % 2) * 0.04}
          position={[0, 0, zPosition]}
        />
      ))}
    </group>
  )
}

function PortalWall({
  materials,
  openingHeight,
  openingWidth,
  position,
  rotation = [0, 0, 0],
  wallDepth,
  wallHeight,
  wallWidth,
}) {
  const frameWidth = 0.72
  const framedOpeningWidth = openingWidth + frameWidth * 2
  const wingWidth = (wallWidth - framedOpeningWidth) / 2
  const archTop = openingHeight + frameWidth
  const upperHeight = Math.max(0, wallHeight - archTop)

  return (
    <group position={position} rotation={rotation}>
      <MaterialBox
        material={materials.stoneVariants[0]}
        position={[
          -(framedOpeningWidth + wingWidth) / 2,
          wallHeight / 2,
          0,
        ]}
        size={[wingWidth, wallHeight, wallDepth]}
      />
      <MaterialBox
        material={materials.stoneVariants[1]}
        position={[
          (framedOpeningWidth + wingWidth) / 2,
          wallHeight / 2,
          0,
        ]}
        size={[wingWidth, wallHeight, wallDepth]}
      />
      {upperHeight > 0 && (
        <MaterialBox
          material={materials.stoneDark}
          position={[0, archTop + upperHeight / 2, 0]}
          size={[framedOpeningWidth, upperHeight, wallDepth]}
        />
      )}
      <StoneArch
        depth={wallDepth + 0.16}
        detail={false}
        materialIndex={2}
        materials={materials}
        openingHeight={openingHeight + 0.45}
        openingWidth={openingWidth + 0.9}
        pierWidth={0.44}
        position={[0, 0, 0.06]}
      />
      <StoneArch
        depth={wallDepth + 0.08}
        materials={materials}
        openingHeight={openingHeight}
        openingWidth={openingWidth}
        pierWidth={frameWidth}
      />
    </group>
  )
}

function DestinationDoor({ materials }) {
  const plankOffsets = [-0.87, -0.44, 0, 0.44, 0.87]
  const hingeHeights = [0.72, 2.35]

  return (
    <group position={[-18, 0, 9.96]}>
      <MaterialBox
        material={materials.stoneDark}
        position={[0, 2.03, -0.06]}
        size={[2.72, 4.06, 0.16]}
      />
      <StoneArch
        depth={0.32}
        materials={materials}
        openingHeight={4.05}
        openingWidth={2.48}
        pierWidth={0.34}
        position={[0, 0, 0.08]}
      />
      <MaterialBox
        material={materials.woodWorn}
        position={[0, 1.67, 0.11]}
        size={[2.32, 3.34, 0.16]}
      />
      <mesh position={[0, 3.34, 0.195]}>
        <circleGeometry args={[1.16, 32, 0, Math.PI]} />
        <primitive attach="material" object={materials.woodWorn} />
      </mesh>
      {plankOffsets.map((xPosition) => (
        <MaterialBox
          key={xPosition}
          castShadow={false}
          material={materials.wood}
          position={[xPosition, 1.67, 0.205]}
          size={[0.045, 3.25, 0.035]}
        />
      ))}
      <MaterialBox
        material={materials.iron}
        position={[0, 1.67, 0.235]}
        size={[0.065, 3.18, 0.045]}
      />
      {[0.67, 1.52, 2.37].flatMap((height) =>
        [-0.58, 0.58].map((xPosition) => (
          <group key={`${height}-${xPosition}`}>
            <MaterialBox
              material={materials.wood}
              position={[xPosition, height, 0.24]}
              size={[0.88, 0.58, 0.045]}
            />
            <MaterialBox
              castShadow={false}
              material={materials.woodWorn}
              position={[xPosition, height, 0.268]}
              size={[0.69, 0.4, 0.025]}
            />
          </group>
        )),
      )}
      {hingeHeights.flatMap((height) =>
        [-1, 1].map((side) => (
          <MaterialBox
            key={`${height}-${side}`}
            material={materials.iron}
            position={[side * 0.61, height, 0.245]}
            size={[0.78, 0.075, 0.05]}
          />
        )),
      )}
      {[-0.22, 0.22].map((xPosition) => (
        <group key={xPosition} position={[xPosition, 1.54, 0.29]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.09, 0.018, 7, 18]} />
            <primitive attach="material" object={materials.brass} />
          </mesh>
          <mesh position={[0, 0.095, -0.01]}>
            <cylinderGeometry args={[0.045, 0.045, 0.035, 12]} />
            <primitive attach="material" object={materials.brass} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

function WallDocument({ materials, position }) {
  return (
    <group position={position}>
      <MaterialBox
        material={materials.woodWorn}
        position={[0, 0, 0]}
        size={[0.12, 1.62, 1.18]}
      />
      <MaterialBox
        castShadow={false}
        material={materials.paperAged}
        position={[0.065, 0, 0]}
        size={[0.035, 1.27, 0.84]}
      />
      {[-0.47, 0.47].flatMap((zPosition) =>
        [-0.66, 0.66].map((yPosition) => (
          <mesh
            key={`${zPosition}-${yPosition}`}
            position={[0.09, yPosition, zPosition]}
            rotation={[0, 0, Math.PI / 2]}
          >
            <cylinderGeometry args={[0.025, 0.025, 0.025, 10]} />
            <primitive attach="material" object={materials.brass} />
          </mesh>
        )),
      )}
    </group>
  )
}

function BlindNiche({ materials }) {
  return (
    <group position={[-15.71, 0, 17.25]} rotation={[0, -Math.PI / 2, 0]}>
      <MaterialBox
        material={materials.stoneDark}
        position={[0, 1.45, -0.05]}
        size={[1.18, 2.45, 0.08]}
      />
      <StoneArch
        depth={0.22}
        materials={materials}
        openingHeight={2.58}
        openingWidth={1.15}
        pierWidth={0.22}
      />
      <MaterialBox
        material={materials.stoneVariants[2]}
        position={[0, 0.78, 0.1]}
        size={[1.05, 0.12, 0.42]}
      />
      <CandleCluster
        materials={materials}
        position={[0, 0.86, 0.08]}
        scale={0.63}
      />
    </group>
  )
}

function Runner({ length, materials, position, rotation = [0, 0, 0], width }) {
  return (
    <MaterialBox
      material={materials.carpet}
      position={[position[0], 0.025, position[2]]}
      rotation={rotation}
      size={[width, 0.045, length]}
    />
  )
}

function Book({
  banded = false,
  coverMaterial,
  materials,
  position,
  rotation = [0, 0, 0],
  size,
}) {
  const coverThickness = 0.014

  return (
    <group position={position} rotation={rotation}>
      <MaterialBox
        material={materials.paperAged}
        position={[0, 0, 0]}
        size={[size[0] - 0.025, size[1], size[2] - 0.02]}
      />
      <MaterialBox
        material={coverMaterial}
        position={[0, size[1] / 2 + coverThickness / 2, 0]}
        size={[size[0], coverThickness, size[2]]}
      />
      <MaterialBox
        material={coverMaterial}
        position={[0, -size[1] / 2 - coverThickness / 2, 0]}
        size={[size[0], coverThickness, size[2]]}
      />
      <MaterialBox
        material={coverMaterial}
        position={[-size[0] / 2 - coverThickness / 2, 0, 0]}
        size={[
          coverThickness,
          size[1] + coverThickness * 2,
          size[2],
        ]}
      />
      {banded && (
        <>
          <MaterialBox
            castShadow={false}
            material={materials.brass}
            position={[-size[0] / 2 - coverThickness, size[1] * 0.25, 0]}
            size={[0.012, 0.012, size[2] * 0.82]}
          />
          <MaterialBox
            castShadow={false}
            material={materials.brass}
            position={[-size[0] / 2 - coverThickness, -size[1] * 0.25, 0]}
            size={[0.012, 0.012, size[2] * 0.82]}
          />
        </>
      )}
    </group>
  )
}

function BookStack({ count = 7, materials, position, rotation = 0 }) {
  const books = Array.from({ length: count }, (_, index) => {
    const bookHeight = 0.055 + (index % 3) * 0.013
    const stackHeight = Array.from({ length: index }).reduce(
      (height, __, precedingIndex) =>
        height + 0.055 + (precedingIndex % 3) * 0.013 + 0.018,
      0,
    )

    return {
      height: stackHeight,
      rotation: (index % 2 === 0 ? -1 : 1) * (0.018 + index * 0.006),
      size: [
        0.52 + (index % 4) * 0.085,
        bookHeight,
        0.36 + ((index + 2) % 3) * 0.07,
      ],
    }
  })

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {books.map((book, index) => (
        <Book
          key={`${index}-${book.size[0]}`}
          banded={index % 3 === 0}
          coverMaterial={
            materials.bookCovers[index % materials.bookCovers.length]
          }
          materials={materials}
          position={[0, book.height + book.size[1] / 2, 0]}
          rotation={[0, book.rotation, 0]}
          size={book.size}
        />
      ))}
    </group>
  )
}

function OpenBook({ materials, position, rotation = 0, scale = 1 }) {
  return (
    <group position={position} rotation={[0, rotation, 0]} scale={scale}>
      <MaterialBox
        material={materials.bookCovers[2]}
        position={[0, 0, 0]}
        size={[0.78, 0.028, 0.5]}
      />
      <MaterialBox
        material={materials.paper}
        position={[-0.205, 0.035, 0]}
        rotation={[0, 0, 0.045]}
        size={[0.37, 0.022, 0.47]}
      />
      <MaterialBox
        material={materials.paperAged}
        position={[0.205, 0.035, 0]}
        rotation={[0, 0, -0.045]}
        size={[0.37, 0.022, 0.47]}
      />
      <MaterialBox
        material={materials.brass}
        position={[0, 0.058, 0]}
        size={[0.012, 0.018, 0.46]}
      />
    </group>
  )
}

function WritingTable({ materials, position, rotation = 0 }) {
  const legPositions = [
    [-0.24, -0.67],
    [0.24, -0.67],
    [-0.24, 0.67],
    [0.24, 0.67],
  ]

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <MaterialBox
        material={materials.wood}
        position={[0, 0.88, 0]}
        size={[0.68, 0.11, 1.5]}
      />
      {legPositions.map(([x, z]) => (
        <MaterialBox
          key={`${x}-${z}`}
          material={materials.woodWorn}
          position={[x, 0.43, z]}
          size={[0.09, 0.86, 0.09]}
        />
      ))}
      <MaterialBox
        material={materials.woodWorn}
        position={[0, 0.29, 0]}
        size={[0.53, 0.07, 1.25]}
      />
    </group>
  )
}

function Bookcase({ materials, position, rotation = 0, width = 2.35 }) {
  const shelfHeights = [0.22, 0.9, 1.58, 2.26]

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <MaterialBox
        material={materials.woodWorn}
        position={[0, 1.4, 0]}
        size={[0.24, 2.8, width]}
      />
      <MaterialBox
        material={materials.wood}
        position={[0.19, 1.4, -width / 2 + 0.05]}
        size={[0.38, 2.9, 0.1]}
      />
      <MaterialBox
        material={materials.wood}
        position={[0.19, 1.4, width / 2 - 0.05]}
        size={[0.38, 2.9, 0.1]}
      />
      <MaterialBox
        material={materials.woodWorn}
        position={[0.19, 2.83, 0]}
        size={[0.48, 0.16, width + 0.22]}
      />
      <MaterialBox
        material={materials.wood}
        position={[0.24, 2.96, 0]}
        size={[0.56, 0.11, width + 0.34]}
      />
      <MaterialBox
        material={materials.woodWorn}
        position={[0.2, 0.1, 0]}
        size={[0.48, 0.2, width + 0.16]}
      />
      {shelfHeights.map((height, shelfIndex) => (
        <group key={height}>
          <MaterialBox
            material={materials.wood}
            position={[0.2, height, 0]}
            size={[0.42, 0.09, width]}
          />
          {Array.from({ length: 8 }, (_, bookIndex) => {
            const bookHeight = 0.39 + ((bookIndex + shelfIndex) % 3) * 0.055
            const bookWidth = width / 9
            const gap = (bookIndex + shelfIndex * 3) % 11 === 0

            if (gap) {
              return null
            }

            return (
              <group
                key={`${height}-${bookIndex}`}
                position={[
                  0.43,
                  height + 0.075 + bookHeight / 2,
                  -width / 2 + 0.18 + bookIndex * bookWidth,
                ]}
                rotation={[
                  0,
                  0,
                  bookIndex % 4 === 0 ? 0.035 : 0,
                ]}
              >
                <MaterialBox
                  material={
                    materials.bookCovers[
                      (bookIndex + shelfIndex * 2) %
                        materials.bookCovers.length
                    ]
                  }
                  size={[0.24, bookHeight, bookWidth * 0.72]}
                />
                {bookIndex % 3 === 0 && (
                  <>
                    <MaterialBox
                      castShadow={false}
                      material={materials.brass}
                      position={[0.125, bookHeight * 0.27, 0]}
                      size={[0.018, 0.025, bookWidth * 0.58]}
                    />
                    <MaterialBox
                      castShadow={false}
                      material={materials.brass}
                      position={[0.125, -bookHeight * 0.27, 0]}
                      size={[0.018, 0.025, bookWidth * 0.58]}
                    />
                  </>
                )}
              </group>
            )
          })}
        </group>
      ))}
    </group>
  )
}

function LoosePapers({ materials, position, rotation = 0 }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {[0, 1, 2].map((index) => (
        <MaterialBox
          key={index}
          material={index === 1 ? materials.paperAged : materials.paper}
          position={[
            (index - 1) * 0.13,
            0.014 + index * 0.006,
            (index % 2) * 0.08,
          ]}
          rotation={[0, (index - 1) * 0.12, 0]}
          size={[0.38, 0.012, 0.53]}
        />
      ))}
    </group>
  )
}

function WritingChair({ materials, position, rotation = 0 }) {
  const legPositions = [
    [-0.2, -0.19],
    [0.2, -0.19],
    [-0.2, 0.19],
    [0.2, 0.19],
  ]

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <MaterialBox
        material={materials.textile}
        position={[0, 0.52, 0]}
        size={[0.5, 0.1, 0.48]}
      />
      <MaterialBox
        material={materials.textile}
        position={[0, 0.98, 0.2]}
        rotation={[0.08, 0, 0]}
        size={[0.5, 0.62, 0.09]}
      />
      {legPositions.map(([x, z]) => (
        <MaterialBox
          key={`${x}-${z}`}
          material={materials.woodWorn}
          position={[x, 0.25, z]}
          size={[0.07, 0.5, 0.07]}
        />
      ))}
      <MaterialBox
        material={materials.wood}
        position={[0, 1.31, 0.22]}
        size={[0.61, 0.08, 0.1]}
      />
    </group>
  )
}

function InkSet({ materials, position, rotation = 0 }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh castShadow position={[0, 0.07, 0]}>
        <cylinderGeometry args={[0.075, 0.09, 0.14, 10]} />
        <primitive attach="material" object={materials.iron} />
      </mesh>
      <mesh
        castShadow
        position={[0.05, 0.28, 0]}
        rotation={[0, 0, -0.36]}
      >
        <cylinderGeometry args={[0.008, 0.014, 0.48, 7]} />
        <primitive attach="material" object={materials.brass} />
      </mesh>
      <mesh
        castShadow
        position={[0.13, 0.48, 0]}
        rotation={[0, 0, -0.34]}
        scale={[0.35, 1, 0.16]}
      >
        <sphereGeometry args={[0.11, 8, 6]} />
        <primitive attach="material" object={materials.paperAged} />
      </mesh>
    </group>
  )
}

function ScrollBundle({ materials, position, rotation = 0 }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {[0, 1, 2].map((index) => (
        <group
          key={index}
          position={[0, 0.065 + index * 0.095, (index - 1) * 0.08]}
          rotation={[0, 0, Math.PI / 2]}
        >
          <mesh castShadow>
            <cylinderGeometry args={[0.07, 0.07, 0.68 - index * 0.06, 12]} />
            <primitive attach="material" object={materials.paperAged} />
          </mesh>
          <mesh position={[0, 0.08, 0]}>
            <torusGeometry args={[0.073, 0.012, 6, 12]} />
            <primitive attach="material" object={materials.brass} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

function MasonryDebris({ materials, position, rotation = 0 }) {
  const fragments = [
    { position: [-0.34, 0.08, 0.12], radius: 0.14, rotation: 0.2 },
    { position: [0.04, 0.055, -0.06], radius: 0.1, rotation: -0.35 },
    { position: [0.31, 0.04, 0.09], radius: 0.075, rotation: 0.6 },
    { position: [0.5, 0.03, -0.08], radius: 0.055, rotation: -0.2 },
  ]

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {fragments.map((fragment, index) => (
        <mesh
          key={`${fragment.radius}-${index}`}
          castShadow
          position={fragment.position}
          receiveShadow
          rotation={[
            fragment.rotation,
            fragment.rotation * 1.6,
            fragment.rotation * 0.7,
          ]}
        >
          <dodecahedronGeometry args={[fragment.radius, 0]} />
          <primitive
            attach="material"
            object={materials.stoneVariants[index % 3]}
          />
        </mesh>
      ))}
    </group>
  )
}

function Lectern({ materials, position, rotation = 0 }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <MaterialBox
        material={materials.woodWorn}
        position={[0, 0.48, 0]}
        size={[0.12, 0.96, 0.12]}
      />
      <MaterialBox
        material={materials.wood}
        position={[0, 0.1, 0]}
        size={[0.55, 0.12, 0.5]}
      />
      <MaterialBox
        material={materials.wood}
        position={[0, 1.03, 0]}
        rotation={[0, 0, -0.18]}
        size={[0.68, 0.09, 0.86]}
      />
      <MaterialBox
        material={materials.brass}
        position={[-0.31, 1.1, 0]}
        rotation={[0, 0, -0.18]}
        size={[0.04, 0.12, 0.88]}
      />
    </group>
  )
}

function MossPatch({ materials, position, rotation = 0, scale = 1 }) {
  const clusters = [
    [0, 0, 0, 1],
    [0.16, 0.1, 0.02, 0.72],
    [-0.14, 0.08, -0.01, 0.62],
    [0.06, 0.22, 0.01, 0.54],
    [-0.22, 0.2, 0.02, 0.43],
  ]

  return (
    <group
      position={position}
      rotation={[0, rotation, 0]}
      scale={scale}
    >
      {clusters.map(([x, y, z, clusterScale], index) => (
        <mesh
          key={`${x}-${y}`}
          castShadow={false}
          position={[x, y, z]}
          rotation={[0, 0, (index - 2) * 0.24]}
          scale={[0.25 * clusterScale, 0.16 * clusterScale, 1]}
        >
          <circleGeometry args={[1, 9]} />
          <primitive
            attach="material"
            object={
              index % 3 === 0
                ? materials.foliageDry
                : materials.foliage
            }
          />
        </mesh>
      ))}
    </group>
  )
}

function Lantern({ castShadow = false, materials, position, scale = 1 }) {
  const corners = [
    [-0.19, -0.19],
    [-0.19, 0.19],
    [0.19, -0.19],
    [0.19, 0.19],
  ]

  return (
    <group position={position} scale={scale}>
      <mesh castShadow position={[0, 0.62, 0]}>
        <cylinderGeometry args={[0.018, 0.018, 0.72, 6]} />
        <primitive attach="material" object={materials.iron} />
      </mesh>
      <mesh castShadow position={[0, 0.18, 0]}>
        <coneGeometry args={[0.32, 0.24, 4]} />
        <primitive attach="material" object={materials.iron} />
      </mesh>
      <MaterialBox
        material={materials.lanternGlass}
        position={[0, -0.16, 0]}
        size={[0.34, 0.58, 0.34]}
      />
      {corners.map(([x, z]) => (
        <MaterialBox
          key={`${x}-${z}`}
          material={materials.iron}
          position={[x, -0.16, z]}
          size={[0.035, 0.67, 0.035]}
        />
      ))}
      <MaterialBox
        material={materials.iron}
        position={[0, -0.49, 0]}
        size={[0.48, 0.08, 0.48]}
      />
      <pointLight
        castShadow={castShadow}
        color="#ffae55"
        decay={2}
        distance={7.2}
        intensity={castShadow ? 34 : 24}
        position={[0, -0.16, 0]}
        shadow-bias={-0.001}
        shadow-mapSize-height={512}
        shadow-mapSize-width={512}
      />
    </group>
  )
}

function CandleCluster({ materials, position, scale = 1 }) {
  const candles = [
    { height: 0.34, x: -0.12, z: 0.04 },
    { height: 0.23, x: 0.1, z: -0.05 },
    { height: 0.17, x: 0.02, z: 0.14 },
  ]

  return (
    <group position={position} scale={scale}>
      {candles.map((candle, index) => (
        <group key={candle.height} position={[candle.x, 0, candle.z]}>
          <mesh castShadow position={[0, candle.height / 2, 0]}>
            <cylinderGeometry args={[0.035, 0.045, candle.height, 9]} />
            <primitive attach="material" object={materials.wax} />
          </mesh>
          <mesh position={[0, candle.height + 0.045, 0]} scale={[0.6, 1, 0.6]}>
            <sphereGeometry args={[0.045, 8, 6]} />
            <primitive attach="material" object={materials.flame} />
          </mesh>
          {index === 0 && (
            <pointLight
              color="#ff9b46"
              decay={2}
              distance={3.2}
              intensity={7}
              position={[0, candle.height + 0.08, 0]}
            />
          )}
        </group>
      ))}
    </group>
  )
}

function Vine({ materials, points }) {
  const curve = useMemo(
    () =>
      new CatmullRomCurve3(
        points.map((point) => new Vector3(...point)),
      ),
    [points],
  )
  const tubeArgs = useMemo(
    () => [curve, 24, 0.018, 5, false],
    [curve],
  )
  const leafShape = useMemo(() => {
    const shape = new Shape()
    shape.moveTo(0, -0.17)
    shape.bezierCurveTo(0.12, -0.08, 0.12, 0.09, 0, 0.18)
    shape.bezierCurveTo(-0.12, 0.09, -0.12, -0.08, 0, -0.17)

    return shape
  }, [])

  return (
    <group>
      <mesh castShadow>
        <tubeGeometry args={tubeArgs} />
        <primitive attach="material" object={materials.vine} />
      </mesh>
      {points.slice(1, -1).map((point, index) => (
        <group
          key={`${point[0]}-${point[1]}-${point[2]}`}
          position={point}
        >
          {[0, 1].map((leafIndex) => (
            <mesh
              key={leafIndex}
              castShadow
              position={[
                leafIndex === 0 ? -0.08 : 0.11,
                leafIndex === 0 ? -0.04 : 0.08,
                leafIndex === 0 ? 0.015 : -0.01,
              ]}
              rotation={[
                0.18 + index * 0.16,
                index * 0.42 + leafIndex * 0.32,
                (leafIndex === 0 ? -1 : 1) * (0.48 + index * 0.08),
              ]}
              scale={[
                0.9 + ((index + leafIndex) % 2) * 0.22,
                0.88 + ((index + 1) % 3) * 0.12,
                1,
              ]}
            >
              <shapeGeometry args={[leafShape, 1]} />
              <primitive
                attach="material"
                object={
                  (index + leafIndex) % 4 === 0
                    ? materials.foliageDry
                    : materials.foliage
                }
              />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  )
}

function EntranceLighting({ materials }) {
  return (
    <>
      <Lantern
        castShadow
        materials={materials}
        position={[-20.12, 2.85, 25.6]}
        scale={0.72}
      />
      <Lantern
        materials={materials}
        position={[-18, 4.18, 20.5]}
        scale={0.88}
      />
      <Lantern
        materials={materials}
        position={[-18, 3.92, 15.5]}
        scale={0.78}
      />
      <pointLight
        color="#8faabd"
        decay={2}
        distance={7}
        intensity={26}
        position={[-15.6, 3.4, 12]}
      />
      <pointLight
        color="#c6d5dc"
        decay={2}
        distance={8}
        intensity={14}
        position={[-18, 2.8, 11]}
      />
    </>
  )
}

function EntranceStorytelling({ materials }) {
  return (
    <>
      <WritingTable materials={materials} position={[-20.05, 0, 26.25]} />
      <OpenBook
        materials={materials}
        position={[-19.69, 0.96, 26.2]}
        rotation={-0.12}
        scale={0.78}
      />
      <LoosePapers
        materials={materials}
        position={[-19.67, 0.96, 25.72]}
        rotation={0.14}
      />
      <CandleCluster
        materials={materials}
        position={[-19.75, 0.95, 26.75]}
        scale={0.85}
      />
      <WritingChair
        materials={materials}
        position={[-19.68, 0, 27.45]}
        rotation={0.24}
      />
      <InkSet
        materials={materials}
        position={[-19.73, 0.96, 26.47]}
        rotation={-0.15}
      />
      <WallDocument
        materials={materials}
        position={[-20.4, 2.35, 20.9]}
      />

      <BlenderPipelineBookshelf
        position={[-15.66, 0, 23.8]}
        rotation={[0, -Math.PI / 2, 0]}
      />
      <BookStack
        count={10}
        materials={materials}
        position={[-16.18, 0.01, 27.35]}
        rotation={-0.13}
      />
      <ScrollBundle
        materials={materials}
        position={[-16.07, 0.01, 26.42]}
        rotation={0.2}
      />
      <BookStack
        count={8}
        materials={materials}
        position={[-19.65, 0.01, 22.15]}
        rotation={Math.PI + 0.09}
      />
      <OpenBook
        materials={materials}
        position={[-19.08, 0.08, 21.8]}
        rotation={0.2}
        scale={0.9}
      />
      <MasonryDebris
        materials={materials}
        position={[-19.87, 0, 20.9]}
        rotation={0.22}
      />

      <Bookcase
        materials={materials}
        position={[-19.84, 0, 17.2]}
        width={2.25}
      />
      <WritingTable
        materials={materials}
        position={[-16.32, 0, 15.45]}
        rotation={Math.PI}
      />
      <OpenBook
        materials={materials}
        position={[-16.67, 0.96, 15.5]}
        rotation={Math.PI + 0.08}
        scale={0.74}
      />
      <BookStack
        count={6}
        materials={materials}
        position={[-19.78, 0.01, 14.15]}
        rotation={Math.PI - 0.08}
      />
      <LoosePapers
        materials={materials}
        position={[-19.05, 0.08, 13.75]}
        rotation={-0.18}
      />
      <CandleCluster
        materials={materials}
        position={[-16.25, 0.01, 18.05]}
        scale={0.72}
      />
      <Lectern
        materials={materials}
        position={[-19.64, 0, 18.92]}
        rotation={-Math.PI / 2}
      />
      <OpenBook
        materials={materials}
        position={[-19.59, 1.12, 18.92]}
        rotation={-Math.PI / 2}
        scale={0.66}
      />
      <MasonryDebris
        materials={materials}
        position={[-20.03, 0, 10.55]}
        rotation={-0.36}
      />

      <group position={[-20.37, 0.12, 28.2]}>
        <Vine materials={materials} points={VINE_PATHS[0]} />
      </group>
      <group position={[-15.63, 1.2, 21.4]}>
        <Vine materials={materials} points={VINE_PATHS[1]} />
      </group>
      <group position={[-20.34, 0.28, 20.72]}>
        <Vine materials={materials} points={VINE_PATHS[1]} />
      </group>
      <group position={[-20.12, 1.3, 14.1]}>
        <Vine materials={materials} points={VINE_PATHS[2]} />
      </group>
      <group position={[-20.18, 0.36, 13.68]}>
        <Vine materials={materials} points={VINE_PATHS[2]} />
      </group>
      <MossPatch
        materials={materials}
        position={[-20.43, 0.42, 23.05]}
        rotation={Math.PI / 2}
        scale={1.15}
      />
      <MossPatch
        materials={materials}
        position={[-15.57, 1.12, 26.85]}
        rotation={Math.PI / 2}
        scale={0.82}
      />
      <MossPatch
        materials={materials}
        position={[-19.55, 0.38, 9.99]}
        scale={0.72}
      />
    </>
  )
}

export function EntranceVerticalSlice() {
  const materials = getVerticalSliceMaterials()

  return (
    <group name="entrance-vertical-slice">
      <VaultedPassage
        height={5.3}
        length={10}
        materials={materials}
        position={[-18, 0, 25]}
        ribCount={4}
        width={5}
      />
      <PortalWall
        materials={materials}
        openingHeight={4.4}
        openingWidth={3.2}
        position={[-18, 0, 20]}
        wallDepth={1.35}
        wallHeight={5.3}
        wallWidth={6.2}
      />
      <VaultedPassage
        height={4.8}
        length={7}
        materials={materials}
        position={[-18, 0, 16.5]}
        ribCount={4}
        width={4.5}
      />
      <PortalWall
        materials={materials}
        openingHeight={4.1}
        openingWidth={3}
        position={[-18, 0, 13]}
        wallDepth={1.25}
        wallHeight={4.8}
        wallWidth={6}
      />
      <VaultedPassage
        height={4.8}
        length={4.5}
        materials={materials}
        positiveSideWall={false}
        position={[-18, 0, 11.75]}
        ribCount={2}
        width={6}
      />
      <MaterialBox
        material={materials.stoneVariants[1]}
        position={[-18, 2.4, 9.5]}
        size={[6.8, 4.8, 0.82]}
      />
      <DestinationDoor materials={materials} />
      <PortalWall
        materials={materials}
        openingHeight={4.1}
        openingWidth={3.2}
        position={[-15, 0, 12]}
        rotation={[0, Math.PI / 2, 0]}
        wallDepth={1.35}
        wallHeight={4.8}
        wallWidth={5}
      />
      <BlindNiche materials={materials} />

      <Runner
        length={7.4}
        materials={materials}
        position={[-18, 0, 26.15]}
        width={1.5}
      />
      <Runner
        length={5.6}
        materials={materials}
        position={[-18, 0, 17.15]}
        width={1.34}
      />
      <Runner
        length={2.5}
        materials={materials}
        position={[-16.25, 0, 12]}
        rotation={[0, Math.PI / 2, 0]}
        width={1.28}
      />

      <EntranceStorytelling materials={materials} />
      <EntranceLighting materials={materials} />
    </group>
  )
}
