import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import {
  Euler,
  Matrix4,
  Quaternion,
  Vector3,
} from 'three'

const COMPONENT_COUNTS = {
  SCALAR: 1,
  VEC2: 2,
  VEC3: 3,
  VEC4: 4,
}

const COMPONENT_BYTE_SIZES = {
  5120: 1,
  5121: 1,
  5122: 2,
  5123: 2,
  5125: 4,
  5126: 4,
}

const RUNNER_JOIN_TOLERANCE = 0.035
const FLOOR_VERTICAL_TOLERANCE = 0.06

const runnerAssets = [
  {
    path: fileURLToPath(
      new URL(
        '../../public/models/entrance-asset-library.glb',
        import.meta.url,
      ),
    ),
    placement: {
      position: [-18, 0, 30],
      rotation: [0, 0, 0],
    },
    pattern: /^EntranceRunner(?:_\d+)?$/,
  },
  {
    path: fileURLToPath(
      new URL(
        '../../public/models/provenance-gallery.glb',
        import.meta.url,
      ),
    ),
    placement: {
      position: [-15, 0, 12],
      rotation: [0, -Math.PI / 2, 0],
    },
    pattern: /^ProvenanceRunner$/,
  },
  {
    path: fileURLToPath(
      new URL(
        '../../public/models/final-route-asset-library.glb',
        import.meta.url,
      ),
    ),
    placement: {
      position: [-7.5, 0, 12],
      rotation: [0, -Math.PI / 2, 0],
    },
    pattern: /^FinalRouteRunner$/,
  },
]

const floorAssets = [
  {
    ...runnerAssets[0],
    pattern: /^EntranceFloor_\d+$/,
  },
  {
    ...runnerAssets[1],
    pattern: /^ProvenanceFloor_\d+$/,
  },
  {
    ...runnerAssets[2],
    pattern:
      /^(?:ProjectGalleryFloor|SocialFloor|ContactFloor)_\d+$|^UnfinishedVisibleFloor$/,
  },
]

function readGlb(path) {
  const file = readFileSync(path)
  let offset = 12
  let json = null
  let binary = null

  while (offset < file.length) {
    const chunkLength = file.readUInt32LE(offset)
    const chunkType = file.readUInt32LE(offset + 4)
    const chunk = file.subarray(offset + 8, offset + 8 + chunkLength)

    if (chunkType === 0x4e4f534a) {
      json = JSON.parse(chunk.toString().replace(/\0+$/, ''))
    } else if (chunkType === 0x004e4942) {
      binary = chunk
    }

    offset += 8 + chunkLength
  }

  assert.ok(json)
  assert.ok(binary)
  return { binary, json }
}

function createAccessorReader(glb, accessorIndex) {
  const accessor = glb.json.accessors[accessorIndex]
  const bufferView = glb.json.bufferViews[accessor.bufferView]
  const componentCount = COMPONENT_COUNTS[accessor.type]
  const componentByteSize =
    COMPONENT_BYTE_SIZES[accessor.componentType]
  const itemByteSize = componentCount * componentByteSize
  const byteStride = bufferView.byteStride ?? itemByteSize
  const byteOffset =
    (bufferView.byteOffset ?? 0) + (accessor.byteOffset ?? 0)
  const dataView = new DataView(
    glb.binary.buffer,
    glb.binary.byteOffset,
    glb.binary.byteLength,
  )

  assert.equal(accessor.componentType, 5126)
  assert.equal(componentCount, 3)

  return {
    count: accessor.count,
    get(index, component) {
      return dataView.getFloat32(
        byteOffset +
          index * byteStride +
          component * componentByteSize,
        true,
      )
    },
  }
}

function getNodeLocalMatrix(node) {
  if (node.matrix) {
    return new Matrix4().fromArray(node.matrix)
  }

  return new Matrix4().compose(
    new Vector3(...(node.translation ?? [0, 0, 0])),
    new Quaternion(...(node.rotation ?? [0, 0, 0, 1])),
    new Vector3(...(node.scale ?? [1, 1, 1])),
  )
}

function readMatchingGeometry({ path, placement, pattern }) {
  const glb = readGlb(path)
  const modelMatrix = new Matrix4().compose(
    new Vector3(...placement.position),
    new Quaternion().setFromEuler(
      new Euler(...placement.rotation),
    ),
    new Vector3(1, 1, 1),
  )
  const runners = []

  const visitNode = (nodeIndex, parentMatrix) => {
    const node = glb.json.nodes[nodeIndex]
    const worldMatrix = parentMatrix
      .clone()
      .multiply(getNodeLocalMatrix(node))

    if (node.mesh !== undefined && pattern.test(node.name ?? '')) {
      const vertices = []

      for (const primitive of glb.json.meshes[node.mesh].primitives) {
        const positions = createAccessorReader(
          glb,
          primitive.attributes.POSITION,
        )

        for (let index = 0; index < positions.count; index += 1) {
          vertices.push(
            new Vector3(
              positions.get(index, 0),
              positions.get(index, 1),
              positions.get(index, 2),
            ).applyMatrix4(worldMatrix),
          )
        }
      }

      runners.push({
        name: node.name,
        vertices,
      })
    }

    for (const childIndex of node.children ?? []) {
      visitNode(childIndex, worldMatrix)
    }
  }

  const scene = glb.json.scenes[glb.json.scene ?? 0]

  for (const nodeIndex of scene.nodes) {
    visitNode(nodeIndex, modelMatrix)
  }

  return runners
}

function getHorizontalJoinDistance(leftVertices, rightVertices) {
  let closestDistance = Infinity

  for (const left of leftVertices) {
    for (const right of rightVertices) {
      const distance = Math.hypot(left.x - right.x, left.z - right.z)
      closestDistance = Math.min(closestDistance, distance)
    }
  }

  return closestDistance
}

test('red runner exports form one continuous route', () => {
  const [entrance, provenance, finalRoute] = runnerAssets.map(
    readMatchingGeometry,
  )

  assert.equal(
    entrance.length,
    1,
    `Expected one entrance runner, received ${entrance
      .map(({ name }) => name)
      .join(', ')}`,
  )
  assert.equal(provenance.length, 1)
  assert.equal(finalRoute.length, 1)

  const entranceJoin = getHorizontalJoinDistance(
    entrance[0].vertices,
    provenance[0].vertices,
  )
  const finalRouteJoin = getHorizontalJoinDistance(
    provenance[0].vertices,
    finalRoute[0].vertices,
  )

  assert.ok(
    entranceJoin <= RUNNER_JOIN_TOLERANCE,
    `Entrance runner gap is ${entranceJoin.toFixed(3)}m`,
  )
  assert.ok(
    finalRouteJoin <= RUNNER_JOIN_TOLERANCE,
    `Final route runner gap is ${finalRouteJoin.toFixed(3)}m`,
  )
})

test('stone floor exports remain level enough for walking', () => {
  const floorMeshes = floorAssets.flatMap(readMatchingGeometry)

  assert.ok(floorMeshes.length > 0)

  for (const floor of floorMeshes) {
    const heights = floor.vertices.map(({ y }) => y)
    const minimumHeight = Math.min(...heights)
    const maximumHeight = Math.max(...heights)

    assert.ok(
      minimumHeight >= -FLOOR_VERTICAL_TOLERANCE,
      `${floor.name} sinks to ${minimumHeight.toFixed(3)}m`,
    )
    assert.ok(
      maximumHeight <= FLOOR_VERTICAL_TOLERANCE,
      `${floor.name} floats to ${maximumHeight.toFixed(3)}m`,
    )
  }
})
