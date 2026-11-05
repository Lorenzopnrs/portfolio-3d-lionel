import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import draco3d from 'draco3d'
import {
  Box3,
  Euler,
  Matrix4,
  Quaternion,
  Triangle,
  Vector3,
} from 'three'
import {
  FINAL_ROUTE_POSITION,
  FINAL_ROUTE_ROTATION,
} from '../final-route/finalRoutePlacement.js'
import {
  CAMERA_HEIGHT,
  EVALUATION_STOPS,
  PATH_LENGTH,
  PROJECT_GALLERY_PROGRESS_RANGE,
  applyCameraFocusTarget,
  createCameraOrientation,
  stepCameraOrientation,
  getCameraLookAheadDistance,
  getCameraOrientationResponse,
  getCameraPointAt,
  CAMERA_FIELD_OF_VIEW,
  getCameraFieldOfView,
  getRestingFieldOfView,
} from './cameraPath.js'
const SAMPLE_COUNT = 12000
const GEOMETRY_SAMPLE_COUNT = 4000
const CAMERA_GEOMETRY_CLEARANCE = 0.16
// A visitor taking their time in the gallery, in metres per second.
const VISITING_PACE_PROGRESS_STEP = 1.5 / PATH_LENGTH / 30
const PORTRAIT_HALF_FIELD_OF_VIEW = (15 * Math.PI) / 180
const WORLD_UP = new Vector3(0, 1, 0)
const CAMERA_FORWARD = new Vector3(0, 0, -1)
const dracoDecoderModule = await draco3d.createDecoderModule({})
const glbPath = fileURLToPath(
  new URL(
    '../../public/models/final-route-asset-library.glb',
    import.meta.url,
  ),
)
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
let cachedCollisionGeometry = null

function samplePath() {
  return Array.from({ length: SAMPLE_COUNT + 1 }, (_, index) => ({
    point: getCameraPointAt(index / SAMPLE_COUNT),
    progress: index / SAMPLE_COUNT,
  }))
}

function closestDistance(samples, target) {
  return samples.reduce(
    (distance, sample) =>
      Math.min(distance, sample.point.distanceTo(target)),
    Infinity,
  )
}

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

  assert.equal(accessor.sparse, undefined)
  assert.ok(componentCount)
  assert.ok(componentByteSize)

  const readComponent = (offset) => {
    switch (accessor.componentType) {
      case 5120:
        return dataView.getInt8(offset)
      case 5121:
        return dataView.getUint8(offset)
      case 5122:
        return dataView.getInt16(offset, true)
      case 5123:
        return dataView.getUint16(offset, true)
      case 5125:
        return dataView.getUint32(offset, true)
      case 5126:
        return dataView.getFloat32(offset, true)
      default:
        throw new Error(
          `Unsupported GLB component type: ${accessor.componentType}`,
        )
    }
  }

  return {
    count: accessor.count,
    itemSize: componentCount,
    get(index, component = 0) {
      return readComponent(
        byteOffset +
          index * byteStride +
          component * componentByteSize,
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

function createPrimitiveGeometry(
  glb,
  primitive,
  worldMatrix,
  nodeName,
) {
  assert.equal(primitive.mode ?? 4, 4)
  const dracoExtension =
    primitive.extensions?.KHR_draco_mesh_compression

  if (dracoExtension) {
    return createDracoPrimitiveGeometry(
      glb,
      dracoExtension,
      worldMatrix,
      nodeName,
    )
  }

  const positionReader = createAccessorReader(
    glb,
    primitive.attributes.POSITION,
  )
  const indexReader = createAccessorReader(glb, primitive.indices)
  const positions = new Float32Array(positionReader.count * 3)
  const indices = new Uint32Array(indexReader.count)
  const box = new Box3()
  const point = new Vector3()

  for (let index = 0; index < positionReader.count; index += 1) {
    point
      .set(
        positionReader.get(index, 0),
        positionReader.get(index, 1),
        positionReader.get(index, 2),
      )
      .applyMatrix4(worldMatrix)
    point.toArray(positions, index * 3)
    box.expandByPoint(point)
  }

  for (let index = 0; index < indexReader.count; index += 1) {
    indices[index] = indexReader.get(index)
  }

  return { box, indices, nodeName, positions }
}

function createDracoPrimitiveGeometry(
  glb,
  extension,
  worldMatrix,
  nodeName,
) {
  const bufferView = glb.json.bufferViews[extension.bufferView]
  const byteOffset = bufferView.byteOffset ?? 0
  const compressedData = new Int8Array(
    glb.binary.buffer,
    glb.binary.byteOffset + byteOffset,
    bufferView.byteLength,
  )
  const decoderBuffer = new dracoDecoderModule.DecoderBuffer()
  const decoder = new dracoDecoderModule.Decoder()
  const mesh = new dracoDecoderModule.Mesh()

  decoderBuffer.Init(compressedData, compressedData.length)
  const status = decoder.DecodeBufferToMesh(decoderBuffer, mesh)
  assert.equal(status.ok(), true, status.error_msg())
  dracoDecoderModule.destroy(status)

  const positionAttribute = decoder.GetAttributeByUniqueId(
    mesh,
    extension.attributes.POSITION,
  )
  const positionData = new dracoDecoderModule.DracoFloat32Array()
  const faceData = new dracoDecoderModule.DracoInt32Array()
  const positions = new Float32Array(mesh.num_points() * 3)
  const indices = new Uint32Array(mesh.num_faces() * 3)
  const point = new Vector3()
  const box = new Box3()

  decoder.GetAttributeFloatForAllPoints(
    mesh,
    positionAttribute,
    positionData,
  )

  for (let index = 0; index < mesh.num_points(); index += 1) {
    point
      .set(
        positionData.GetValue(index * 3),
        positionData.GetValue(index * 3 + 1),
        positionData.GetValue(index * 3 + 2),
      )
      .applyMatrix4(worldMatrix)
    point.toArray(positions, index * 3)
    box.expandByPoint(point)
  }

  for (let faceIndex = 0; faceIndex < mesh.num_faces(); faceIndex += 1) {
    decoder.GetFaceFromMesh(mesh, faceIndex, faceData)
    indices[faceIndex * 3] = faceData.GetValue(0)
    indices[faceIndex * 3 + 1] = faceData.GetValue(1)
    indices[faceIndex * 3 + 2] = faceData.GetValue(2)
  }

  dracoDecoderModule.destroy(faceData)
  dracoDecoderModule.destroy(positionData)
  dracoDecoderModule.destroy(mesh)
  dracoDecoderModule.destroy(decoder)
  dracoDecoderModule.destroy(decoderBuffer)

  return { box, indices, nodeName, positions }
}

function readFinalRouteCollisionGeometry() {
  if (cachedCollisionGeometry) {
    return cachedCollisionGeometry
  }

  const glb = readGlb(glbPath)
  const modelTransform = new Matrix4().compose(
    new Vector3(...FINAL_ROUTE_POSITION),
    new Quaternion().setFromEuler(
      new Euler(...FINAL_ROUTE_ROTATION),
    ),
    new Vector3(1, 1, 1),
  )
  const primitives = []

  const visitNode = (nodeIndex, parentMatrix) => {
    const node = glb.json.nodes[nodeIndex]
    const worldMatrix = parentMatrix
      .clone()
      .multiply(getNodeLocalMatrix(node))

    if (node.mesh !== undefined) {
      for (const primitive of glb.json.meshes[node.mesh].primitives) {
        primitives.push(
          createPrimitiveGeometry(
            glb,
            primitive,
            worldMatrix,
            node.name ?? `node-${nodeIndex}`,
          ),
        )
      }
    }

    for (const childIndex of node.children ?? []) {
      visitNode(childIndex, worldMatrix)
    }
  }

  const scene = glb.json.scenes[glb.json.scene ?? 0]

  for (const nodeIndex of scene.nodes) {
    visitNode(nodeIndex, modelTransform)
  }

  cachedCollisionGeometry = primitives
  return cachedCollisionGeometry
}

function getCameraLookDirection(progress) {
  const position = getCameraPointAt(progress)
  const lookAheadProgress = Math.min(
    1,
    progress + getCameraLookAheadDistance(progress) / PATH_LENGTH,
  )
  const lookTarget = getCameraPointAt(lookAheadProgress)
    .sub(position)
    .setY(0)
    .normalize()
    .multiplyScalar(6)
    .add(position)

  applyCameraFocusTarget(progress, position, lookTarget)

  return lookTarget.sub(position).setY(0).normalize()
}

function getCameraTargetQuaternion(progress) {
  const position = getCameraPointAt(progress)
  const lookDirection = getCameraLookDirection(progress)
  const lookTarget = position
    .clone()
    .addScaledVector(lookDirection, 6)
  const lookMatrix = new Matrix4().lookAt(
    position,
    lookTarget,
    WORLD_UP,
  )

  return new Quaternion().setFromRotationMatrix(lookMatrix)
}

function getProjectSurfaceCenters(primitives) {
  return [
    'ProjectInteractionSurface_01',
    'ProjectInteractionSurface_02',
    'ProjectInteractionSurface_03',
  ].map((nodeName) => {
    const surface = primitives.find(
      (primitive) => primitive.nodeName === nodeName,
    )
    assert.ok(surface, `Missing ${nodeName}`)

    return {
      nodeName,
      point: surface.box
        .getCenter(new Vector3())
        .setY(CAMERA_HEIGHT),
    }
  })
}

function updateSurfaceVisibility(
  visibility,
  surfaceCenters,
  progress,
  cameraQuaternion,
) {
  if (
    progress < PROJECT_GALLERY_PROGRESS_RANGE.start ||
    progress > PROJECT_GALLERY_PROGRESS_RANGE.end
  ) {
    return
  }

  const cameraPosition = getCameraPointAt(progress)
  const renderedDirection = CAMERA_FORWARD.clone()
    .applyQuaternion(cameraQuaternion)
    .setY(0)
    .normalize()

  for (const surface of surfaceCenters) {
    const surfaceDirection = surface.point
      .clone()
      .sub(cameraPosition)
      .setY(0)
      .normalize()

    if (
      renderedDirection.angleTo(surfaceDirection) <=
      PORTRAIT_HALF_FIELD_OF_VIEW
    ) {
      visibility.add(surface.nodeName)
    }
  }
}

function simulateContinuousVisibility(surfaceCenters, direction) {
  const start =
    direction > 0
      ? PROJECT_GALLERY_PROGRESS_RANGE.start - 0.04
      : PROJECT_GALLERY_PROGRESS_RANGE.end + 0.04
  const end =
    direction > 0
      ? PROJECT_GALLERY_PROGRESS_RANGE.end + 0.04
      : PROJECT_GALLERY_PROGRESS_RANGE.start - 0.04
  const orientation = createCameraOrientation(
    getCameraTargetQuaternion(start),
  )
  const visibility = new Set()

  for (
    let progress = start;
    direction > 0 ? progress <= end : progress >= end;
    progress += direction * VISITING_PACE_PROGRESS_STEP
  ) {
    stepCameraOrientation(
      orientation,
      getCameraTargetQuaternion(progress),
      progress,
      1 / 30,
    )
    updateSurfaceVisibility(
      visibility,
      surfaceCenters,
      progress,
      orientation.quaternion,
    )
  }

  return visibility
}

function findGeometryViolation(primitives, point) {
  const clearanceSquared =
    CAMERA_GEOMETRY_CLEARANCE * CAMERA_GEOMETRY_CLEARANCE
  const a = new Vector3()
  const b = new Vector3()
  const c = new Vector3()
  const closest = new Vector3()
  const triangle = new Triangle()

  for (const primitive of primitives) {
    if (
      primitive.box.distanceToPoint(point) >=
      CAMERA_GEOMETRY_CLEARANCE
    ) {
      continue
    }

    for (
      let index = 0;
      index < primitive.indices.length;
      index += 3
    ) {
      a.fromArray(
        primitive.positions,
        primitive.indices[index] * 3,
      )
      b.fromArray(
        primitive.positions,
        primitive.indices[index + 1] * 3,
      )
      c.fromArray(
        primitive.positions,
        primitive.indices[index + 2] * 3,
      )
      triangle.set(a, b, c).closestPointToPoint(point, closest)

      if (closest.distanceToSquared(point) < clearanceSquared) {
        return primitive.nodeName
      }
    }
  }

  return null
}

test('the view zooms on the phone, then opens again for the agenda', () => {
  const progressOf = (id) =>
    EVALUATION_STOPS.find((stop) => stop.id === id).progress

  assert.equal(
    getCameraFieldOfView(progressOf('book1'), 16 / 9),
    CAMERA_FIELD_OF_VIEW,
  )
  assert.ok(getCameraFieldOfView(progressOf('contact'), 16 / 9) < 30)
  assert.equal(
    getCameraFieldOfView(progressOf('agenda'), 16 / 9),
    CAMERA_FIELD_OF_VIEW,
  )
})

test('a phone held upright sees a whole carved frame from the corridor', () => {
  const aspect = 375 / 812
  const frameWidth = 1.69
  const wallDistance = 2.87
  const verticalTangent = Math.tan(
    (getRestingFieldOfView(aspect) * Math.PI) / 360,
  )

  assert.ok(2 * wallDistance * verticalTangent * aspect > frameWidth)
})

test('approved route exposes nine stops without a duplicate About stop', () => {
  assert.deepEqual(
    EVALUATION_STOPS.map((stop) => stop.id),
    [
      'entrance',
      'book1',
      'book2',
      'projects',
      'library',
      'audioFrames',
      'social',
      'contact',
      'agenda',
    ],
  )
})

test('final route crosses each new architectural threshold', () => {
  const samples = samplePath()
  const thresholds = [
    new Vector3(-7.5, CAMERA_HEIGHT, 12),
    new Vector3(4.2, CAMERA_HEIGHT, 9),
    new Vector3(6.5, CAMERA_HEIGHT, 4),
  ]

  for (const threshold of thresholds) {
    assert.ok(closestDistance(samples, threshold) <= 0.2)
  }
})

test('final route ends inside the contact wing before the closed arch', () => {
  const endpoint = getCameraPointAt(1)

  assert.ok(endpoint.x >= 10.7 && endpoint.x <= 11.4)
  assert.ok(Math.abs(endpoint.y - CAMERA_HEIGHT) <= 0.001)
  assert.ok(endpoint.z >= 3.75 && endpoint.z <= 4.25)
})

test('camera clears the exported final-route GLB in both directions', () => {
  const primitives = readFinalRouteCollisionGeometry()

  assert.ok(primitives.length > 0)

  for (const direction of [1, -1]) {
    for (
      let index = 0;
      index <= GEOMETRY_SAMPLE_COUNT;
      index += 1
    ) {
      const forwardProgress = index / GEOMETRY_SAMPLE_COUNT
      const progress =
        direction === 1 ? forwardProgress : 1 - forwardProgress
      const point = getCameraPointAt(progress)
      const collidingNode = findGeometryViolation(primitives, point)

      assert.equal(
        collidingNode,
        null,
        `Camera clearance failed at ${progress.toFixed(5)} against ${collidingNode}`,
      )
    }
  }
})

test('rendered camera reveals every project surface at a visiting pace', () => {
  const primitives = readFinalRouteCollisionGeometry()
  const surfaceCenters = getProjectSurfaceCenters(primitives)
  const expectedSurfaces = [
    'ProjectInteractionSurface_01',
    'ProjectInteractionSurface_02',
    'ProjectInteractionSurface_03',
  ]

  for (const direction of [1, -1]) {
    assert.deepEqual(
      [
        ...simulateContinuousVisibility(
          surfaceCenters,
          direction,
        ),
      ].toSorted(),
      expectedSurfaces,
    )
  }
})

test('looking at a frame never makes the camera turn faster than the corridor', () => {
  const projectProgress = EVALUATION_STOPS.find(
    (stop) => stop.id === 'projects',
  ).progress

  assert.equal(
    getCameraOrientationResponse(projectProgress),
    getCameraOrientationResponse(0.05),
  )
})
