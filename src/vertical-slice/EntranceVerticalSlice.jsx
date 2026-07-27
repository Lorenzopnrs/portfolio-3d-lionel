import { useMemo } from 'react'
import { CatmullRomCurve3, Path, Shape, Vector3 } from 'three'
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

function StoneArch({
  depth,
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
          object={materials.stoneVariants[1]}
        />
      </mesh>
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
        depth={wallDepth + 0.08}
        materials={materials}
        openingHeight={openingHeight}
        openingWidth={openingWidth}
        pierWidth={frameWidth}
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

            return (
              <MaterialBox
                key={`${height}-${bookIndex}`}
                material={
                  materials.bookCovers[
                    (bookIndex + shelfIndex * 2) %
                      materials.bookCovers.length
                  ]
                }
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
                size={[0.24, bookHeight, bookWidth * 0.72]}
              />
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

  return (
    <group>
      <mesh castShadow>
        <tubeGeometry args={tubeArgs} />
        <primitive attach="material" object={materials.vine} />
      </mesh>
      {points.slice(1, -1).map((point, index) => (
        <mesh
          key={`${point[0]}-${point[1]}-${point[2]}`}
          castShadow
          position={point}
          rotation={[0.3 + index * 0.25, index * 0.8, 0.4]}
          scale={[1, 0.28, 0.65]}
        >
          <sphereGeometry args={[0.13, 7, 5]} />
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

      <Bookcase
        materials={materials}
        position={[-15.77, 0, 23.8]}
        rotation={Math.PI}
        width={2.6}
      />
      <BookStack
        count={10}
        materials={materials}
        position={[-16.18, 0.01, 27.35]}
        rotation={-0.13}
      />
      <BookStack
        count={8}
        materials={materials}
        position={[-19.65, 0.01, 22.15]}
        rotation={0.09}
      />
      <OpenBook
        materials={materials}
        position={[-19.08, 0.08, 21.8]}
        rotation={0.2}
        scale={0.9}
      />

      <Bookcase
        materials={materials}
        position={[-20.02, 0, 17.2]}
        width={2.25}
      />
      <WritingTable
        materials={materials}
        position={[-16.08, 0, 15.45]}
        rotation={Math.PI}
      />
      <OpenBook
        materials={materials}
        position={[-16.43, 0.96, 15.5]}
        rotation={Math.PI + 0.08}
        scale={0.74}
      />
      <BookStack
        count={6}
        materials={materials}
        position={[-19.78, 0.01, 14.15]}
        rotation={-0.08}
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

      <group position={[-20.37, 0.12, 28.2]}>
        <Vine materials={materials} points={VINE_PATHS[0]} />
      </group>
      <group position={[-15.63, 1.2, 21.4]}>
        <Vine materials={materials} points={VINE_PATHS[1]} />
      </group>
      <group position={[-20.12, 1.3, 14.1]}>
        <Vine materials={materials} points={VINE_PATHS[2]} />
      </group>
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
