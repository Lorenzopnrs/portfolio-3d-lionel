import assert from 'node:assert/strict'
import { existsSync, readFileSync, statSync } from 'node:fs'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../../', import.meta.url))
const blendPath = `${root}assets/blender/final_route_asset_library.blend`
const glbPath = `${root}public/models/final-route-asset-library.glb`

function readGlbJson(path) {
  const buffer = readFileSync(path)
  const jsonChunkLength = buffer.readUInt32LE(12)
  const jsonChunk = buffer
    .subarray(20, 20 + jsonChunkLength)
    .toString()
    .replace(/\0+$/, '')

  return JSON.parse(jsonChunk)
}

test('final route Blender source and optimized GLB both exist', () => {
  assert.equal(existsSync(blendPath), true)
  assert.equal(existsSync(glbPath), true)
  assert.ok(statSync(glbPath).size > 0)
  assert.ok(statSync(glbPath).size < 5 * 1024 * 1024)
})

test('GLB contains exactly the approved interactive surfaces', () => {
  const glb = readGlbJson(glbPath)
  const nodeNames = glb.nodes
    .map((node) => node.name)
    .filter(Boolean)
  const projectSurfaces = nodeNames.filter((name) =>
    name.startsWith('ProjectInteractionSurface_'),
  )
  const socialSurfaces = nodeNames.filter((name) =>
    name.startsWith('SocialInteractionSurface_'),
  )

  assert.deepEqual(projectSurfaces.toSorted(), [
    'ProjectInteractionSurface_01',
    'ProjectInteractionSurface_02',
    'ProjectInteractionSurface_03',
  ])
  assert.deepEqual(socialSurfaces.toSorted(), [
    'SocialInteractionSurface_01',
    'SocialInteractionSurface_02',
    'SocialInteractionSurface_03',
  ])
  assert.equal(
    nodeNames.includes('ContactInteractionSurface'),
    true,
  )
  assert.equal(
    nodeNames.includes('FinalUnfinishedThreshold'),
    true,
  )
})
