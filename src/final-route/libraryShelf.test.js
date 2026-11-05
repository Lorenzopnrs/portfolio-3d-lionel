import assert from 'node:assert/strict'
import test from 'node:test'
import { BufferGeometry, Float32BufferAttribute } from 'three'
import {
  layoutAudioCases,
  layoutLibraryBooks,
  removeBooksInZones,
  splitBookTitle,
} from './libraryShelf.js'

function createBooks(count) {
  return Array.from({ length: count }, (_, index) => ({
    id: `book-${index}`,
    title: `Livre ${index}`,
  }))
}

// One triangle per part: [minimumX, maximumX], then 'spine' for a part thin in
// depth and tall, or nothing for a cover or a page block.
function createPartsGeometry(parts) {
  const geometry = new BufferGeometry()

  geometry.setAttribute(
    'position',
    new Float32BufferAttribute(
      parts.flatMap(([minimumX, maximumX, kind]) => [
        minimumX, 1, 0,
        maximumX, 1, 0,
        minimumX, kind === 'spine' ? 1.4 : 1.3, kind === 'spine' ? 0.02 : 0.27,
      ]),
      3,
    ),
  )
  geometry.setIndex(
    parts.flatMap((_, part) => [part * 3, part * 3 + 1, part * 3 + 2]),
  )
  return geometry
}

const ZONE = Object.freeze({
  maximumX: 0.3,
  maximumY: 1.5,
  minimumX: -0.3,
  minimumY: 0.9,
})

test('the first books sit on the eye-level row, centered and in reading order', () => {
  const { entries, overflowCount } = layoutLibraryBooks(createBooks(4))

  assert.equal(overflowCount, 0)
  assert.deepEqual(
    entries.map((entry) => entry.item.id),
    ['book-0', 'book-1', 'book-2', 'book-3'],
  )
  assert.ok(entries.every((entry) => entry.row === 2))

  for (let index = 1; index < entries.length; index += 1) {
    const previous = entries[index - 1]
    const current = entries[index]

    assert.ok(
      previous.position[0] + previous.thickness / 2 <=
        current.position[0] - current.thickness / 2,
    )
  }

  const left = entries[0].position[0] - entries[0].thickness / 2
  const last = entries.at(-1)
  const right = last.position[0] + last.thickness / 2

  assert.ok(Math.abs(left + right) < 0.02)
})

test('a full row spills onto the next one, and every book stays inside the case', () => {
  const { entries } = layoutLibraryBooks(createBooks(14))
  const rows = new Set(entries.map((entry) => entry.row))

  assert.equal(entries.length, 14)
  assert.deepEqual([...rows], [2, 3])
  assert.ok(
    entries.every(
      (entry) =>
        Math.abs(entry.position[0]) + entry.thickness / 2 <= 0.82,
    ),
  )
})

test('books beyond the capacity of the case are reported, not forced in', () => {
  const { entries, overflowCount } = layoutLibraryBooks(createBooks(90))

  assert.ok(entries.length >= 40)
  assert.equal(overflowCount, 90 - entries.length)
})

test('an empty library clears nothing', () => {
  assert.deepEqual(layoutLibraryBooks([]), {
    clearedZones: [],
    entries: [],
    overflowCount: 0,
  })
})

test('a book keeps its size when the library changes', () => {
  const alone = layoutLibraryBooks([{ id: 'stable', title: 'A' }])
  const among = layoutLibraryBooks([
    ...createBooks(3),
    { id: 'stable', title: 'A' },
  ])
  const sameBook = among.entries.find(
    (entry) => entry.item.id === 'stable',
  )

  assert.equal(sameBook.thickness, alone.entries[0].thickness)
  assert.equal(sameBook.height, alone.entries[0].height)
})

test('every book fits under the shelf above it', () => {
  layoutLibraryBooks(createBooks(40)).entries.forEach((entry) => {
    assert.ok(entry.height <= 0.449)
  })
})

test('decorative books are removed only inside the cleared zones', () => {
  const geometry = createPartsGeometry([
    [0, 0.1, 'spine'],
    [0.7, 0.8, 'spine'],
  ])
  const [filtered] = removeBooksInZones([geometry], [ZONE])

  assert.deepEqual([...filtered.getIndex().array], [3, 4, 5])
  assert.equal(
    filtered.getAttribute('position'),
    geometry.getAttribute('position'),
  )
  assert.equal(geometry.getIndex().count, 6)
})

test('a book across several meshes is removed whole, even at the zone edge', () => {
  // This book straddles the edge: its far cover lies entirely outside the zone.
  const leather = createPartsGeometry([
    [0.26, 0.36, 'spine'],
    [0.353, 0.367],
    [0.56, 0.66, 'spine'],
  ])
  const paper = createPartsGeometry([
    [0.273, 0.347],
    [0.573, 0.647],
  ])
  const [filteredLeather, filteredPaper] = removeBooksInZones(
    [leather, paper],
    [ZONE],
  )

  assert.deepEqual([...filteredLeather.getIndex().array], [6, 7, 8])
  assert.deepEqual([...filteredPaper.getIndex().array], [3, 4, 5])
})

test('the next book keeps all its parts when its neighbour is removed', () => {
  const geometry = createPartsGeometry([
    [0.2, 0.3, 'spine'],
    [0.318, 0.418, 'spine'],
    [0.311, 0.325],
  ])
  const [filtered] = removeBooksInZones([geometry], [ZONE])

  assert.deepEqual([...filtered.getIndex().array], [3, 4, 5, 6, 7, 8])
})

test('a leaning book does not drag its neighbours away in a chain', () => {
  const geometry = createPartsGeometry([
    [0.26, 0.4, 'spine'],
    [0.41, 0.51, 'spine'],
    [0.53, 0.63, 'spine'],
  ])
  const [filtered] = removeBooksInZones([geometry], [ZONE])

  assert.deepEqual([...filtered.getIndex().array], [3, 4, 5, 6, 7, 8])
})

test('the flat faces of one box count as a single part', () => {
  const geometry = new BufferGeometry()

  // A spine split in two faces meeting along an edge, without shared vertices.
  // Alone, the second face would stay: it lies entirely outside the zone.
  geometry.setAttribute(
    'position',
    new Float32BufferAttribute(
      [
        0.2, 1, 0, 0.32, 1, 0, 0.2, 1.4, 0.02,
        0.32, 1, 0, 0.42, 1, 0, 0.42, 1.4, 0.02,
      ],
      3,
    ),
  )
  geometry.setIndex([0, 1, 2, 3, 4, 5])

  const [filtered] = removeBooksInZones([geometry], [ZONE])

  assert.equal(filtered.getIndex().count, 0)
})

test('a part far from any spine decides for itself', () => {
  const geometry = createPartsGeometry([
    [0, 0.1],
    [0.7, 0.8],
  ])
  const [filtered] = removeBooksInZones([geometry], [ZONE])

  assert.deepEqual([...filtered.getIndex().array], [3, 4, 5])
})

test('without any zone the shared geometries stay untouched', () => {
  const geometries = [createPartsGeometry([[0, 0.1, 'spine']])]

  assert.equal(removeBooksInZones(geometries, []), geometries)
})

test('audio stories sit side by side at eye level, then spill onto the next row', () => {
  const stories = createBooks(5)
  const { clearedZones, entries, overflowCount } = layoutAudioCases(stories)

  assert.equal(overflowCount, 0)
  assert.deepEqual(
    entries.map((entry) => entry.row),
    [2, 2, 2, 3, 3],
  )
  assert.equal(clearedZones.length, 2)
  assert.ok(
    entries.every(
      (entry) =>
        Math.abs(entry.position[0]) + entry.thickness / 2 <= 0.82,
    ),
  )
})

test('every audio case fits under the shelf above it, leaning included', () => {
  layoutAudioCases(createBooks(20)).entries.forEach((entry) => {
    assert.ok(entry.height <= 0.449)
    assert.ok(entry.tilt < 0)
  })
})

test('a long title splits at the colon so the spine can show two lines', () => {
  assert.deepEqual(
    splitBookTitle("L'OMBRE DE JACK TOME 2 : Le Miroir des Traumatismes"),
    {
      main: "L'OMBRE DE JACK TOME 2",
      subtitle: 'Le Miroir des Traumatismes',
    },
  )
  assert.deepEqual(splitBookTitle('LE PENSEUR'), {
    main: 'LE PENSEUR',
    subtitle: '',
  })
})
