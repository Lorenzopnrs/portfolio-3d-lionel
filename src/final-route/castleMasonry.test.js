import assert from 'node:assert/strict'
import test from 'node:test'
import { BoxGeometry, Group, Mesh, MeshStandardMaterial } from 'three'
import {
  ENTRANCE_MASONRY,
  FINAL_ROUTE_MASONRY,
  PROVENANCE_MASONRY,
  extendCastle,
} from './castleMasonry.js'

function createAssembly(...names) {
  const assembly = new Group()
  const mortar = new MeshStandardMaterial({ name: 'DarkMortar' })

  names.forEach((name, index) => {
    const module = new Mesh(new BoxGeometry(1, 1, 1), mortar)

    module.name = name
    module.position.set(index, 0, -5)
    assembly.add(module)
  })

  return assembly
}

test('a module carries on from where the original stands', () => {
  const assembly = createAssembly('Floor')
  const original = assembly.getObjectByName('Floor')

  extendCastle(assembly, {
    beds: [],
    copies: [{ move: [0, 0, -2.5], source: 'Floor' }],
  })

  assert.equal(original.position.z, -5)
  assert.equal(assembly.children.length, 2)
  assert.equal(assembly.children[1].position.z, -7.5)
  assert.equal(assembly.children[1].geometry, original.geometry)
})

test('a module can close an end, facing the other way', () => {
  const assembly = createAssembly('Wall')

  extendCastle(assembly, {
    beds: [],
    copies: [
      { position: [1, 2, 3], rotationY: Math.PI / 2, source: 'Wall' },
    ],
  })

  const [, copy] = assembly.children

  assert.deepEqual(copy.position.toArray(), [1, 2, 3])
  assert.equal(copy.rotation.y, Math.PI / 2)
})

test('the mortar bed lies under the slabs and shares their mortar', () => {
  const assembly = createAssembly('Wall')
  const { material } = assembly.getObjectByName('Wall')

  extendCastle(assembly, {
    beds: [{ maxX: 4, maxZ: 0, minX: -2, minZ: -10 }],
    copies: [],
  })

  const bed = assembly.getObjectByName('CastleMortarBed')

  assert.equal(bed.material, material)
  assert.ok(bed.position.y < 0 && bed.position.y > -0.05)
  assert.deepEqual(bed.position.toArray().filter((_, i) => i !== 1), [1, -5])
  assert.equal(bed.scale.x, 6)
  assert.equal(bed.scale.z, 10)
})

test('a renamed module in the model is reported, not silently skipped', () => {
  assert.throws(
    () =>
      extendCastle(createAssembly('Wall'), {
        beds: [],
        copies: [{ source: 'Absent' }],
      }),
    /Missing GLB object: Absent/,
  )
})

test('every part of the castle names modules and covers its floor', () => {
  for (const { beds, copies } of [
    ENTRANCE_MASONRY,
    FINAL_ROUTE_MASONRY,
    PROVENANCE_MASONRY,
  ]) {
    assert.ok(beds.length > 0)
    beds.forEach(({ maxX, maxZ, minX, minZ }) => {
      assert.ok(maxX > minX && maxZ > minZ)
    })
    copies.forEach(({ source }) => assert.equal(typeof source, 'string'))
  }
})
