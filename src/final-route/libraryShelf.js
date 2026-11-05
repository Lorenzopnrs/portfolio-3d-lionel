import { BufferGeometry, Uint32BufferAttribute } from 'three'

// Measurements of the end-of-gallery bookcase, in its own local units.
// They mirror create_bookshelf() in tools/blender/create_entrance_asset_library.py.
export const SHELF_NAME = 'ProjectEndArchiveShelf'
export const SHELF_POSITION = Object.freeze([0, 0, -13.08])
export const SHELF_SCALE = 0.96
export const SHELF_BOOK_MATERIALS = /Leather|AgedPaper|TarnishedBrass/
// The same bookcase at the end of the audio room, facing the visitor walking in.
export const AUDIO_SHELF_TRANSFORM = Object.freeze({
  position: Object.freeze([-9.87, 0, -11.7]),
  rotation: Object.freeze([0, Math.PI / 2, 0]),
  scale: SHELF_SCALE,
})
// The desk and its three frames, moved as one block onto the side wall.
export const AUDIO_FRAMES_CLUSTER_NAME = 'SocialCorrespondenceCluster'
export const AUDIO_FRAMES_TRANSFORM = Object.freeze({
  position: Object.freeze([-5.1, 0, -9.52]),
  rotation: Object.freeze([0, Math.PI / 2, 0]),
})
// The model has floor for three bays along this wall, but only two wall sections.
export const AUDIO_WALL_NAME = 'SocialWall_00_01'
export const AUDIO_MISSING_WALL_POSITION = Object.freeze([-9.35, 0, -9.2])

const ROW_BASE_HEIGHT = 0.1975
const ROW_SPACING = 0.524
const USABLE_ROW_WIDTH = 1.56
const BOOK_DEPTH = 0.3
const BOOK_CENTER_Z = 0.22
const BOOK_GAP = 0.006
const AUDIO_CASE_WIDTH = 0.385
const AUDIO_CASE_HEIGHT = 0.41
const AUDIO_CASE_DEPTH = 0.05
const AUDIO_CASE_CENTER_Z = 0.3
const AUDIO_CASE_GAP = 0.04
// Cases lean back a little against the shelf, like a display.
const AUDIO_CASE_TILT = -0.07
const CLEARED_ZONE_MARGIN = 0.012
// A decorative book's spine is the one part both thin in depth and tall. Its
// other parts sit within its width, leaning books included.
const SPINE_MAXIMUM_DEPTH = 0.05
const SPINE_MINIMUM_HEIGHT = 0.2
const SPINE_REACH_TOLERANCE = 0.02
const WELD_PRECISION = 1000
// Eye-level rows first, so the first books are the easiest to read.
const ROW_FILL_ORDER = Object.freeze([2, 3, 1, 4, 0])

function hashText(text) {
  let hash = 2166136261

  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }

  return hash >>> 0
}

function getBookSize(bookId) {
  const hash = hashText(bookId)

  return {
    centerZ: BOOK_CENTER_Z,
    depth: BOOK_DEPTH,
    gap: BOOK_GAP,
    height: 0.385 + ((hash >>> 8) % 4) * 0.01,
    thickness: 0.165 + (hash % 3) * 0.01,
  }
}

const AUDIO_CASE_SIZE = Object.freeze({
  centerZ: AUDIO_CASE_CENTER_Z,
  depth: AUDIO_CASE_DEPTH,
  gap: AUDIO_CASE_GAP,
  height: AUDIO_CASE_HEIGHT,
  thickness: AUDIO_CASE_WIDTH,
  tilt: AUDIO_CASE_TILT,
})

export function splitBookTitle(title) {
  const separator = title.indexOf(':')

  if (separator === -1) {
    return { main: title.trim(), subtitle: '' }
  }

  return {
    main: title.slice(0, separator).trim(),
    subtitle: title.slice(separator + 1).trim(),
  }
}

function layoutShelfItems(items, getSize) {
  const rows = ROW_FILL_ORDER.map((row) => ({
    entries: [],
    row,
    width: 0,
  }))
  let rowIndex = 0
  let placedCount = 0

  for (const item of items) {
    const size = getSize(item)

    while (
      rowIndex < rows.length &&
      rows[rowIndex].width + size.thickness > USABLE_ROW_WIDTH
    ) {
      rowIndex += 1
    }

    if (rowIndex === rows.length) {
      break
    }

    rows[rowIndex].entries.push({ item, ...size })
    rows[rowIndex].width += size.thickness + size.gap
    placedCount += 1
  }

  const usedRows = rows.filter(({ entries }) => entries.length > 0)
  const entries = usedRows.flatMap(({ entries: rowEntries, row, width }) => {
    let x = -width / 2

    return rowEntries.map((entry) => {
      const placedEntry = {
        ...entry,
        position: Object.freeze([
          x + entry.thickness / 2,
          ROW_BASE_HEIGHT + row * ROW_SPACING + entry.height / 2,
          entry.centerZ,
        ]),
        row,
      }

      x += entry.thickness + entry.gap
      return placedEntry
    })
  })

  return {
    clearedZones: usedRows.map(({ row, width }) => ({
      maximumX: width / 2 + CLEARED_ZONE_MARGIN,
      maximumY: ROW_BASE_HEIGHT + (row + 1) * ROW_SPACING,
      minimumX: -width / 2 - CLEARED_ZONE_MARGIN,
      minimumY: ROW_BASE_HEIGHT + row * ROW_SPACING,
    })),
    entries,
    overflowCount: items.length - placedCount,
  }
}

export function layoutLibraryBooks(books) {
  return layoutShelfItems(books, (book) => getBookSize(book.id))
}

export function layoutAudioCases(stories) {
  return layoutShelfItems(stories, () => AUDIO_CASE_SIZE)
}

function findRoot(parents, item) {
  let root = item

  while (parents[root] !== root) {
    parents[root] = parents[parents[root]]
    root = parents[root]
  }

  return root
}

// Connected triangles form one part of a book: a cover, a spine, a page block.
function findBookParts(geometry) {
  const index = geometry.getIndex()
  const position = geometry.getAttribute('position')
  const parents = Array.from({ length: position.count }, (_, vertex) => vertex)
  const vertexAtPosition = new Map()

  // Hard edges store each flat face of a box with its own vertices: faces are
  // welded back together through the positions they share.
  for (let vertex = 0; vertex < position.count; vertex += 1) {
    const key = [
      Math.round(position.getX(vertex) * WELD_PRECISION),
      Math.round(position.getY(vertex) * WELD_PRECISION),
      Math.round(position.getZ(vertex) * WELD_PRECISION),
    ].join()
    const sameVertex = vertexAtPosition.get(key)

    if (sameVertex === undefined) {
      vertexAtPosition.set(key, vertex)
    } else {
      parents[findRoot(parents, vertex)] = findRoot(parents, sameVertex)
    }
  }

  for (let offset = 0; offset < index.count; offset += 3) {
    const first = findRoot(parents, index.getX(offset))

    for (let corner = 1; corner < 3; corner += 1) {
      parents[findRoot(parents, index.getX(offset + corner))] = first
    }
  }

  const parts = new Map()

  for (let vertex = 0; vertex < position.count; vertex += 1) {
    const root = findRoot(parents, vertex)
    const x = position.getX(vertex)
    const y = position.getY(vertex)
    const z = position.getZ(vertex)
    const part = parts.get(root)

    if (part) {
      part.minimumX = Math.min(part.minimumX, x)
      part.maximumX = Math.max(part.maximumX, x)
      part.minimumY = Math.min(part.minimumY, y)
      part.maximumY = Math.max(part.maximumY, y)
      part.minimumZ = Math.min(part.minimumZ, z)
      part.maximumZ = Math.max(part.maximumZ, z)
    } else {
      parts.set(root, {
        maximumX: x,
        maximumY: y,
        maximumZ: z,
        minimumX: x,
        minimumY: y,
        minimumZ: z,
      })
    }
  }

  return { parents, parts }
}

function isSpine(part) {
  return (
    part.maximumZ - part.minimumZ < SPINE_MAXIMUM_DEPTH &&
    part.maximumY - part.minimumY > SPINE_MINIMUM_HEIGHT
  )
}

function getCenterX(part) {
  return (part.minimumX + part.maximumX) / 2
}

function findOwningSpine(part, spines) {
  const centerY = (part.minimumY + part.maximumY) / 2
  let owner = part
  let ownerDistance = Infinity

  spines.forEach((spine) => {
    const distance = Math.abs(getCenterX(part) - getCenterX(spine))
    const reach =
      (spine.maximumX - spine.minimumX) / 2 + SPINE_REACH_TOLERANCE

    if (
      distance < ownerDistance &&
      distance <= reach &&
      centerY >= spine.minimumY &&
      centerY <= spine.maximumY
    ) {
      owner = spine
      ownerDistance = distance
    }
  })

  return owner
}

function touchesZone(book, zones) {
  const centerY = (book.minimumY + book.maximumY) / 2

  return zones.some(
    (zone) =>
      book.maximumX >= zone.minimumX &&
      book.minimumX <= zone.maximumX &&
      centerY >= zone.minimumY &&
      centerY <= zone.maximumY,
  )
}

// Decorative books are merged by material into a few meshes. Every part follows
// the decision made for its spine, so a book is removed entirely or not at all.
export function removeBooksInZones(geometries, zones) {
  if (zones.length === 0) {
    return geometries
  }

  const analyses = geometries.map(findBookParts)
  const parts = analyses.flatMap(({ parts: geometryParts }) => [
    ...geometryParts.values(),
  ])
  const spines = parts.filter(isSpine)
  const removedParts = new Set(
    parts.filter((part) =>
      touchesZone(findOwningSpine(part, spines), zones),
    ),
  )

  return geometries.map((geometry, geometryIndex) => {
    const { parents, parts: geometryParts } = analyses[geometryIndex]
    const index = geometry.getIndex()
    const keptIndices = []

    for (let offset = 0; offset < index.count; offset += 3) {
      const part = geometryParts.get(
        findRoot(parents, index.getX(offset)),
      )

      if (!removedParts.has(part)) {
        keptIndices.push(
          index.getX(offset),
          index.getX(offset + 1),
          index.getX(offset + 2),
        )
      }
    }

    const filteredGeometry = new BufferGeometry()

    Object.entries(geometry.attributes).forEach(([name, attribute]) => {
      filteredGeometry.setAttribute(name, attribute)
    })
    filteredGeometry.setIndex(new Uint32BufferAttribute(keptIndices, 1))
    filteredGeometry.boundingBox = geometry.boundingBox
    filteredGeometry.boundingSphere = geometry.boundingSphere

    return filteredGeometry
  })
}
