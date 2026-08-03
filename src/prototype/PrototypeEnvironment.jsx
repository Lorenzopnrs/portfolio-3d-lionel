import {
  Block,
  DeepArchway,
  FloorPlate,
  PortalWall,
  StairFlight,
  VaultedPassage,
} from './ArchitectureElements'
import { BLOCKOUT_COLORS } from './blockoutPalette'
import { CategorySignage } from '../final-route/CategorySignage'
import { EntranceVerticalSlice } from '../vertical-slice/EntranceVerticalSlice'
import { ProvenanceGallery } from '../vertical-slice/ProvenanceGallery'

const groundArcadeX = [-4.5, -1.5, 1.5, 4.5]
const groundArcadeZ = [-6, -2, 2, 6]
const upperNorthArcadeX = [-4.5, -1.5, 1.5, 4.5, 7.5]
const upperWestArcadeZ = [-5.5, -2.5, 0.5, 3.5]

function Cloister() {
  return (
    <group>
      <FloorPlate
        color={BLOCKOUT_COLORS.void}
        position={[0, -0.16, 0]}
        size={[12, 16]}
      />
      <FloorPlate position={[0, -0.05, 0]} size={[1.4, 16]} />
      <FloorPlate position={[0, -0.05, 0]} size={[12, 1.4]} />
      <Block
        color={BLOCKOUT_COLORS.stoneDark}
        position={[0, 0.02, 0]}
        size={[2.1, 0.2, 2.1]}
      />

      {groundArcadeX.map((xPosition) => (
        <DeepArchway
          key={`south-${xPosition}`}
          depth={0.72}
          openingHeight={3.7}
          openingWidth={2.15}
          pierWidth={0.38}
          position={[xPosition, 0, 8.25]}
        />
      ))}
      {groundArcadeX.map((xPosition) => (
        <DeepArchway
          key={`north-${xPosition}`}
          depth={0.72}
          openingHeight={3.7}
          openingWidth={2.15}
          pierWidth={0.38}
          position={[xPosition, 0, -8.25]}
        />
      ))}
      {groundArcadeZ.map((zPosition) => (
        <DeepArchway
          key={`east-${zPosition}`}
          depth={0.72}
          openingHeight={3.7}
          openingWidth={2.5}
          pierWidth={0.38}
          position={[6.25, 0, zPosition]}
          rotation={[0, Math.PI / 2, 0]}
        />
      ))}
      {groundArcadeZ.map((zPosition) => (
        <DeepArchway
          key={`west-${zPosition}`}
          depth={0.72}
          openingHeight={3.7}
          openingWidth={2.5}
          pierWidth={0.38}
          position={[-6.25, 0, zPosition]}
          rotation={[0, Math.PI / 2, 0]}
        />
      ))}

      {upperNorthArcadeX.map((xPosition) => (
        <DeepArchway
          key={`upper-north-${xPosition}`}
          color={BLOCKOUT_COLORS.stone}
          depth={0.62}
          openingHeight={3.4}
          openingWidth={2.15}
          pierWidth={0.34}
          position={[xPosition, 4, -8.25]}
        />
      ))}
      {upperWestArcadeZ.map((zPosition) => (
        <DeepArchway
          key={`upper-west-${zPosition}`}
          color={BLOCKOUT_COLORS.stone}
          depth={0.62}
          openingHeight={3.4}
          openingWidth={2.2}
          pierWidth={0.34}
          position={[-6.25, 4, zPosition]}
          rotation={[0, Math.PI / 2, 0]}
        />
      ))}

      <Block
        color={BLOCKOUT_COLORS.stoneDark}
        position={[-6.5, 2.2, 8.5]}
        size={[1, 4.4, 1]}
      />
      <Block
        color={BLOCKOUT_COLORS.stoneDark}
        position={[6.5, 2.2, 8.5]}
        size={[1, 4.4, 1]}
      />
      <Block
        color={BLOCKOUT_COLORS.stoneDark}
        position={[-6.5, 2.2, -8.5]}
        size={[1, 4.4, 1]}
      />
      <Block
        color={BLOCKOUT_COLORS.stoneDark}
        position={[6.5, 2.2, -8.5]}
        size={[1, 4.4, 1]}
      />
    </group>
  )
}

function FirstProjectRoomBlockout() {
  return (
    <group>
      <VaultedPassage
        height={4.6}
        length={2}
        position={[-6.5, 0, 12]}
        ribCount={2}
        rotation={[0, Math.PI / 2, 0]}
        width={4.2}
      />
    </group>
  )
}

function CatalogueCrossing() {
  return (
    <group>
      <FloorPlate position={[0, 0, 11.5]} size={[11, 7]} />
      <DeepArchway
        depth={1.04}
        openingHeight={4.8}
        openingWidth={3.6}
        pierWidth={0.52}
        position={[-5.5, 0, 12]}
        rotation={[0, Math.PI / 2, 0]}
      />
      <DeepArchway
        depth={1.04}
        openingHeight={4.8}
        openingWidth={3.6}
        pierWidth={0.52}
        position={[5.5, 0, 11.5]}
        rotation={[0, Math.PI / 2, 0]}
      />
      <Block position={[0, 3.6, 15]} size={[11, 7.2, 0.8]} />
      <Block
        color={BLOCKOUT_COLORS.stoneDark}
        position={[0, 7.15, 11.5]}
        size={[11, 0.5, 7]}
      />
      <DeepArchway
        depth={0.32}
        openingHeight={6.5}
        openingWidth={9.6}
        pierWidth={0.28}
        position={[0, 0, 13.5]}
      />
    </group>
  )
}

function SecondProjectRoom() {
  const structuralFrames = [9, 12, 15]

  return (
    <group>
      <VaultedPassage
        height={4.6}
        length={1.5}
        position={[6.25, 0, 11.5]}
        ribCount={2}
        rotation={[0, Math.PI / 2, 0]}
        width={4.2}
      />
      <FloorPlate position={[11.5, 0, 11.5]} size={[9, 9]} />
      <Block position={[11.5, 2.9, 16]} size={[9, 5.8, 0.72]} />
      <Block
        color={BLOCKOUT_COLORS.stoneDark}
        position={[11.5, 5.8, 11.5]}
        size={[9, 0.42, 9]}
      />
      {structuralFrames.map((xPosition) => (
        <DeepArchway
          key={xPosition}
          depth={0.2}
          openingHeight={5.4}
          openingWidth={8}
          pierWidth={0.22}
          position={[xPosition, 0, 11.5]}
          rotation={[0, Math.PI / 2, 0]}
        />
      ))}
      <PortalWall
        openingHeight={4.5}
        openingWidth={3.5}
        position={[7, 0, 11.5]}
        rotation={[0, Math.PI / 2, 0]}
        wallHeight={5.8}
        wallWidth={9}
      />
      <Block position={[16, 2.9, 11.5]} size={[0.72, 5.8, 9]} />
      <PortalWall
        openingHeight={4.6}
        openingWidth={3.5}
        position={[11.5, 0, 7]}
        wallHeight={5.8}
        wallWidth={9}
      />
      <FloorPlate position={[10.5, 0, 6.5]} size={[5, 3]} />
    </group>
  )
}

function AscendingGallery() {
  const stairFrames = [
    { floorLevel: 0.67, z: 4 },
    { floorLevel: 2, z: 0 },
    { floorLevel: 3.33, z: -4 },
  ]

  return (
    <group>
      <StairFlight position={[9.5, 0, 6]} rise={4} run={12} />
      <Block position={[11.7, 4.2, 0]} size={[0.72, 8.4, 13]} />

      {stairFrames.map(({ floorLevel, z }) => (
        <DeepArchway
          key={`stair-rib-${z}`}
          depth={0.2}
          openingHeight={4.7}
          openingWidth={4.2}
          pierWidth={0.2}
          position={[9.5, floorLevel, z]}
        />
      ))}
      {stairFrames.map(({ floorLevel, z }) => (
        <DeepArchway
          key={`stair-view-${z}`}
          color={BLOCKOUT_COLORS.stone}
          depth={0.72}
          openingHeight={3.8}
          openingWidth={3}
          pierWidth={0.4}
          position={[7.35, floorLevel, z]}
          rotation={[0, Math.PI / 2, 0]}
        />
      ))}

      <FloorPlate position={[9.5, 4, -7.5]} size={[5, 3]} />
      <PortalWall
        openingHeight={4.6}
        openingWidth={3.4}
        position={[9.5, 4, -8.5]}
        wallHeight={6.6}
        wallWidth={5}
      />
    </group>
  )
}

function ManifestoSpace() {
  return (
    <group>
      <VaultedPassage
        height={7.3}
        length={17.5}
        negativeSideWall={false}
        position={[2.25, 4, -12.5]}
        ribCount={4}
        rotation={[0, Math.PI / 2, 0]}
        width={8}
      />
      <PortalWall
        openingHeight={5}
        openingWidth={3.6}
        position={[-6.5, 4, -12.5]}
        rotation={[0, Math.PI / 2, 0]}
        wallHeight={7.3}
        wallWidth={8}
      />
      <Block position={[11, 7.65, -12.5]} size={[0.72, 7.3, 8]} />
      <Block
        color={BLOCKOUT_COLORS.stoneDark}
        position={[2.25, 8.7, -16.5]}
        size={[17.5, 1.2, 0.9]}
      />
    </group>
  )
}

function PersonalSpace() {
  return (
    <group>
      <FloorPlate position={[-7.75, 4, -10.5]} size={[4.5, 5]} />
      <VaultedPassage
        height={4.5}
        length={8}
        position={[-9, 4, -5]}
        ribCount={3}
        width={5}
      />
      <PortalWall
        openingHeight={3.9}
        openingWidth={3}
        position={[-9, 4, -9]}
        wallHeight={4.5}
        wallWidth={6.2}
      />
      <PortalWall
        openingHeight={3.9}
        openingWidth={3}
        position={[-9, 4, -1]}
        wallHeight={4.5}
        wallWidth={6.2}
      />
    </group>
  )
}

function FinalGallery() {
  return (
    <group>
      <VaultedPassage
        height={4.5}
        length={8}
        negativeSideWall={false}
        position={[-9, 4, 3]}
        positiveSideWall={false}
        ribCount={3}
        width={5}
      />
      <Block
        position={[-11.81, 5, 1.75]}
        size={[0.62, 2, 5.5]}
      />
      <FloorPlate position={[-10.25, 4, 7]} size={[2.5, 2]} />
      <PortalWall
        openingHeight={3.9}
        openingWidth={3}
        position={[-11.5, 4, 7]}
        rotation={[0, Math.PI / 2, 0]}
        wallHeight={4.5}
        wallWidth={5}
      />
      <FloorPlate position={[-17, 4, 7]} size={[11, 5]} />
      <Block position={[-17, 6.25, 4.5]} size={[11, 4.5, 0.62]} />
      <Block
        color={BLOCKOUT_COLORS.stoneDark}
        position={[-17, 4.55, 9.5]}
        size={[11, 1.1, 0.62]}
      />
      <DeepArchway
        color={BLOCKOUT_COLORS.stoneDark}
        depth={0.9}
        openingHeight={4.2}
        openingWidth={3.3}
        position={[-15.4, 4, 7]}
        rotation={[0, Math.PI / 2, 0]}
      />
      <Block
        color={BLOCKOUT_COLORS.stoneDark}
        position={[-16.55, 4.1, 9]}
        size={[0.5, 0.2, 1]}
      />
    </group>
  )
}

export function PrototypeEnvironment() {
  return (
    <>
      <Cloister />
      <EntranceVerticalSlice />
      <ProvenanceGallery />
      <FirstProjectRoomBlockout />
      <CatalogueCrossing />
      <SecondProjectRoom />
      <AscendingGallery />
      <ManifestoSpace />
      <PersonalSpace />
      <FinalGallery />

      <CategorySignage />
    </>
  )
}
