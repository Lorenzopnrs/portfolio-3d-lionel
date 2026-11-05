import { Mesh, PlaneGeometry } from 'three'

const MORTAR_MATERIAL_NAME = 'DarkMortar'
// Just under the top of the floor slabs, so it only shows in the joints.
const MORTAR_BED_HEIGHT = -0.04
const MORTAR_BED_GEOMETRY = new PlaneGeometry(1, 1).rotateX(-Math.PI / 2)
const WALL_LOWER_ROW = 0
const WALL_UPPER_ROW = 3.1
const HALL_END_WALL_Z = -21.93
const QUARTER_TURN = Math.PI / 2

function getHallEndWall(x, y) {
  return {
    position: [x, y, HALL_END_WALL_Z],
    rotationY: -QUARTER_TURN,
    source: 'EntranceLeftWall_03',
  }
}

// Where the model stops short, the castle carries on with its own modules:
// positions are in the local units of each part of the model.
export const ENTRANCE_MASONRY = Object.freeze({
  beds: [{ maxX: 3, maxZ: 0, minX: -3, minZ: -22.5 }],
  copies: [
    // The hall continues past its last arch, up to a stone end wall.
    { move: [0, 0, -4.5], source: 'EntranceFloor_03' },
    { move: [0, 0, -4.5], source: 'EntranceVault_03' },
    { move: [0, 0, -4.5], source: 'EntranceLeftWall_03' },
    { move: [0, 0, -4.5], source: 'EntranceLeftPlinth_03' },
    getHallEndWall(-1.8, WALL_LOWER_ROW),
    getHallEndWall(1.8, WALL_LOWER_ROW),
    getHallEndWall(-1.8, WALL_UPPER_ROW),
    getHallEndWall(1.8, WALL_UPPER_ROW),
  ],
})

export const PROVENANCE_MASONRY = Object.freeze({
  beds: [{ maxX: 3, maxZ: 0.5, minX: -3, minZ: -8 }],
  copies: [],
})

export const FINAL_ROUTE_MASONRY = Object.freeze({
  beds: [
    { maxX: 3.7, maxZ: 0.2, minX: -3.7, minZ: -15 },
    { maxX: -2.6, maxZ: -8.8, minX: -10.9, minZ: -14.5 },
    { maxX: -5.1, maxZ: -13.5, minX: -10.9, minZ: -23.3 },
  ],
  copies: [
    // The gallery reaches its end wall instead of stopping just before it.
    { move: [0, 0, -2.5], source: 'ProjectGalleryFloor_04' },
    { move: [0, 0, -2.5], source: 'ProjectGalleryVault_04' },
    { move: [0, 0, -2.5], source: 'ProjectGalleryRightWall_04' },
    // A full-height wall closes the vault of the audio room above its bookcase.
    {
      position: [-10.58, 0, -11.7],
      rotationY: 0,
      source: 'UnfinishedDistantMasonry',
    },
  ],
})

function findMaterial(assembly, name) {
  let found = null

  assembly.traverse((object) => {
    if (!found && object.isMesh && object.material.name === name) {
      found = object.material
    }
  })

  if (!found) {
    throw new Error(`Missing GLB material: ${name}`)
  }

  return found
}

function addCopy(assembly, { move, position, rotationY, source }, index) {
  const original = assembly.getObjectByName(source)

  if (!original) {
    throw new Error(`Missing GLB object: ${source}`)
  }

  const copy = original.clone(true)

  copy.name = `${source}_Extension_${index}`

  if (position) {
    copy.position.set(...position)
  }

  if (move) {
    copy.position.add({ x: move[0], y: move[1], z: move[2] })
  }

  if (rotationY !== undefined) {
    copy.rotation.set(0, rotationY, 0)
  }

  assembly.add(copy)
}

function addMortarBed(assembly, material, { maxX, maxZ, minX, minZ }) {
  const bed = new Mesh(MORTAR_BED_GEOMETRY, material)

  bed.name = 'CastleMortarBed'
  bed.position.set(
    (minX + maxX) / 2,
    MORTAR_BED_HEIGHT,
    (minZ + maxZ) / 2,
  )
  bed.scale.set(maxX - minX, 1, maxZ - minZ)
  assembly.add(bed)
}

export function extendCastle(assembly, { beds, copies }) {
  const mortar = findMaterial(assembly, MORTAR_MATERIAL_NAME)

  copies.forEach((copy, index) => addCopy(assembly, copy, index))
  beds.forEach((bed) => addMortarBed(assembly, mortar, bed))
}
