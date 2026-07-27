import {
  CanvasTexture,
  Color,
  DoubleSide,
  MeshStandardMaterial,
  NoColorSpace,
  RepeatWrapping,
  SRGBColorSpace,
} from 'three'

const RUNNER_PATTERN_REPEAT = 2.8
const PREVIOUS_RUNNER_REFERENCE_LENGTH = 7.4
const RUNNER_MODULE_SPACING = 4.5
const MATERIAL_VARIATION = [0.9, 0.97, 1.03, 1.08]
const ROUGHNESS_VARIATION = [0.025, -0.02, 0.04, -0.01]

const MATERIAL_PROFILES = {
  AgedPaper: {
    color: '#a9936f',
    mapResource: 'paperColor',
    bumpResource: 'paperBump',
    bumpScale: 0.006,
    roughness: 0.95,
  },
  AgedStone: {
    color: '#89847b',
    normalScale: 0.52,
    roughness: 0.94,
  },
  AgedWax: {
    color: '#b5a579',
    mapResource: 'surfaceColor',
    bumpResource: 'surfaceData',
    bumpScale: 0.004,
    roughness: 0.86,
  },
  BlackenedIron: {
    color: '#1c211f',
    bumpResource: 'metalData',
    bumpScale: 0.008,
    metalness: 0.76,
    roughness: 0.65,
    roughnessResource: 'metalData',
  },
  BlackenedOak: {
    color: '#372a26',
    normalScale: 0.27,
    roughness: 0.88,
    sourceMaterial: 'DarkOak',
  },
  CharredWick: {
    color: '#17130f',
    roughness: 1,
  },
  ControlledIvy: {
    color: '#4b5840',
    mapResource: 'foliageColor',
    bumpResource: 'foliageData',
    bumpScale: 0.006,
    roughness: 0.95,
    roughnessResource: 'foliageData',
    side: DoubleSide,
  },
  DarkMortar: {
    color: '#242621',
    bumpResource: 'stoneDetail',
    bumpScale: 0.015,
    roughness: 0.99,
    roughnessResource: 'stoneDetail',
  },
  DarkOak: {
    color: '#5c443c',
    normalScale: 0.34,
    roughness: 0.84,
  },
  DryIvy: {
    color: '#725d3e',
    mapResource: 'foliageColor',
    bumpResource: 'foliageData',
    bumpScale: 0.005,
    roughness: 0.97,
    roughnessResource: 'foliageData',
    side: DoubleSide,
  },
  LightAgedPaper: {
    color: '#d2c39f',
    mapResource: 'paperColor',
    bumpResource: 'paperBump',
    bumpScale: 0.005,
    roughness: 0.93,
  },
  TarnishedBrass: {
    color: '#72562c',
    bumpResource: 'metalData',
    bumpScale: 0.006,
    metalness: 0.7,
    roughness: 0.56,
    roughnessResource: 'metalData',
  },
  WornBurgundyLeather: {
    color: '#71514d',
    normalScale: 0.3,
    roughness: 0.76,
  },
  WornFloorSlabs: {
    color: '#6e6b65',
    normalScale: 0.43,
    roughness: 0.9,
  },
  WornForestLeather: {
    color: '#45513d',
    mapResource: 'leatherColor',
    bumpResource: 'leatherData',
    bumpScale: 0.008,
    roughness: 0.84,
    roughnessResource: 'leatherData',
  },
  WornStoneEdge: {
    color: '#9a9488',
    normalScale: 0.38,
    roughness: 0.95,
    sourceMaterial: 'AgedStone',
  },
  WornUmberLeather: {
    color: '#6a4931',
    mapResource: 'leatherColor',
    bumpResource: 'leatherData',
    bumpScale: 0.008,
    roughness: 0.86,
    roughnessResource: 'leatherData',
  },
}

function createRandom(seed) {
  let value = seed >>> 0

  return () => {
    value = (value * 1664525 + 1013904223) >>> 0
    return value / 4294967296
  }
}

function stableHash(value) {
  let hash = 2166136261

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }

  return hash >>> 0
}

function prepareCanvasTexture(
  canvas,
  {
    anisotropy = 4,
    colorSpace = NoColorSpace,
    repeat = [2, 2],
  } = {},
) {
  const texture = new CanvasTexture(canvas)
  texture.wrapS = RepeatWrapping
  texture.wrapT = RepeatWrapping
  texture.repeat.set(...repeat)
  texture.anisotropy = anisotropy
  texture.colorSpace = colorSpace
  return texture
}

function createSurfaceCanvas(seed, baseValue, variation) {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256
  const context = canvas.getContext('2d')
  const random = createRandom(seed)
  const image = context.createImageData(canvas.width, canvas.height)

  for (let index = 0; index < image.data.length; index += 4) {
    const value = Math.max(
      0,
      Math.min(
        255,
        baseValue + Math.floor((random() - 0.5) * variation),
      ),
    )
    image.data[index] = value
    image.data[index + 1] = value
    image.data[index + 2] = value
    image.data[index + 3] = 255
  }

  context.putImageData(image, 0, 0)

  for (let mark = 0; mark < 28; mark += 1) {
    const value = Math.floor(
      baseValue - variation * 0.3 + random() * variation * 0.35,
    )
    context.fillStyle = `rgba(${value}, ${value}, ${value}, ${0.04 + random() * 0.1})`
    context.beginPath()
    context.ellipse(
      random() * canvas.width,
      random() * canvas.height,
      4 + random() * 28,
      2 + random() * 10,
      random() * Math.PI,
      0,
      Math.PI * 2,
    )
    context.fill()
  }

  return canvas
}

function createPaperTextures() {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256
  const context = canvas.getContext('2d')
  const random = createRandom(811)

  context.fillStyle = '#ddd0ac'
  context.fillRect(0, 0, canvas.width, canvas.height)

  for (let fiber = 0; fiber < 520; fiber += 1) {
    const value = 98 + Math.floor(random() * 88)
    context.strokeStyle = `rgba(${value}, ${value - 9}, ${value - 25}, ${0.025 + random() * 0.045})`
    context.lineWidth = 0.35 + random() * 0.75
    context.beginPath()
    context.moveTo(random() * canvas.width, random() * canvas.height)
    context.lineTo(random() * canvas.width, random() * canvas.height)
    context.stroke()
  }

  for (let stain = 0; stain < 11; stain += 1) {
    context.fillStyle = `rgba(86, 56, 30, ${0.025 + random() * 0.04})`
    context.beginPath()
    context.ellipse(
      random() * canvas.width,
      random() * canvas.height,
      5 + random() * 24,
      3 + random() * 13,
      random() * Math.PI,
      0,
      Math.PI * 2,
    )
    context.fill()
  }

  return {
    paperBump: prepareCanvasTexture(
      createSurfaceCanvas(907, 174, 42),
      { repeat: [1.35, 1.35] },
    ),
    paperColor: prepareCanvasTexture(canvas, {
      anisotropy: 8,
      colorSpace: SRGBColorSpace,
      repeat: [1.35, 1.35],
    }),
  }
}

function createTexturePair(seed, baseValue, variation, repeat) {
  const canvas = createSurfaceCanvas(seed, baseValue, variation)
  return {
    color: prepareCanvasTexture(canvas, {
      anisotropy: 6,
      colorSpace: SRGBColorSpace,
      repeat,
    }),
    data: prepareCanvasTexture(canvas, { repeat }),
  }
}

export function createEntranceMaterialResources() {
  const paper = createPaperTextures()
  const surface = createTexturePair(1051, 205, 52, [2.4, 2.4])
  const foliage = createTexturePair(1237, 192, 74, [1.7, 1.7])
  const leather = createTexturePair(1321, 206, 48, [1.45, 1.45])

  return {
    foliageColor: foliage.color,
    foliageData: foliage.data,
    leatherColor: leather.color,
    leatherData: leather.data,
    metalData: prepareCanvasTexture(
      createSurfaceCanvas(1151, 178, 92),
      { repeat: [2.8, 2.8] },
    ),
    paperBump: paper.paperBump,
    paperColor: paper.paperColor,
    stoneDetail: prepareCanvasTexture(
      createSurfaceCanvas(719, 215, 58),
      { repeat: [2.1, 2.1] },
    ),
    surfaceColor: surface.color,
    surfaceData: surface.data,
  }
}

function copySourceMaps(material, sourceMaterial) {
  if (!sourceMaterial) {
    return
  }

  material.map = sourceMaterial.map
  material.normalMap = sourceMaterial.normalMap
  material.roughnessMap = sourceMaterial.roughnessMap

  if (sourceMaterial.normalScale) {
    material.normalScale.copy(sourceMaterial.normalScale)
  }
}

function configureProfile(material, profile, resources, sourceMaterials) {
  if (profile.sourceMaterial) {
    copySourceMaps(
      material,
      sourceMaterials.get(profile.sourceMaterial),
    )
  }

  if (profile.mapResource) {
    material.map = resources[profile.mapResource]
  }

  if (profile.bumpResource) {
    material.bumpMap = resources[profile.bumpResource]
    material.bumpScale = profile.bumpScale
  }

  if (profile.roughnessResource) {
    material.roughnessMap = resources[profile.roughnessResource]
  }

  material.color.set(profile.color)
  material.roughness = profile.roughness

  if (profile.metalness !== undefined) {
    material.metalness = profile.metalness
  }

  if (profile.normalScale !== undefined && material.normalMap) {
    material.normalScale.set(
      profile.normalScale,
      profile.normalScale,
    )
  }

  if (profile.side !== undefined) {
    material.side = profile.side
  }
}

function applyObjectTreatment(material, objectName, variantIndex) {
  material.color.multiplyScalar(MATERIAL_VARIATION[variantIndex])
  material.roughness = Math.min(
    1,
    Math.max(
      0.08,
      material.roughness + ROUGHNESS_VARIATION[variantIndex],
    ),
  )

  if (/Plinth/.test(objectName)) {
    material.color.multiplyScalar(0.82)
    material.roughness = Math.min(1, material.roughness + 0.035)
  }

  if (/Wall_(00|01)/.test(objectName)) {
    material.color.offsetHSL(0.018, -0.045, -0.025)
  }

  if (/DeepArch|DoorwayFrame|Support/.test(objectName)) {
    material.color.multiplyScalar(1.04)
  }
}

function configureSpecialMaterial(material) {
  if (material.name === 'DustyLanternGlass') {
    material.color.set('#806b52')
    material.opacity = 0.26
    material.roughness = 0.48
    material.transparent = true
    material.depthWrite = false
    material.emissive = new Color('#6b2e0f')
    material.emissiveIntensity = 0.22
  }

  if (material.name === 'CandleFlame') {
    material.color.set('#ffbd68')
    material.emissive = new Color('#ff7a24')
    material.emissiveIntensity = 2.4
    material.toneMapped = false
  }
}

export function prepareEntranceMaterial({
  material,
  materialCache,
  objectName,
  resources,
  sourceMaterials,
}) {
  const variantIndex =
    stableHash(`${objectName}:${material.name}`) %
    MATERIAL_VARIATION.length
  const treatmentKey = [
    /Plinth/.test(objectName) ? 'plinth' : '',
    /Wall_(00|01)/.test(objectName) ? 'moist' : '',
    /DeepArch|DoorwayFrame|Support/.test(objectName)
      ? 'edge'
      : '',
  ].join(':')
  const cacheKey = `${material.uuid}:${variantIndex}:${treatmentKey}`

  if (materialCache.has(cacheKey)) {
    return materialCache.get(cacheKey)
  }

  const preparedMaterial = material.clone()
  const profile = MATERIAL_PROFILES[preparedMaterial.name]

  if (profile) {
    configureProfile(
      preparedMaterial,
      profile,
      resources,
      sourceMaterials,
    )
    applyObjectTreatment(
      preparedMaterial,
      objectName,
      variantIndex,
    )
  }

  configureSpecialMaterial(preparedMaterial)

  if (preparedMaterial.map) {
    preparedMaterial.map.anisotropy = Math.max(
      8,
      preparedMaterial.map.anisotropy,
    )
  }

  if (preparedMaterial.normalMap) {
    preparedMaterial.normalMap.anisotropy = Math.max(
      4,
      preparedMaterial.normalMap.anisotropy,
    )
  }

  if (preparedMaterial.roughnessMap) {
    preparedMaterial.roughnessMap.anisotropy = Math.max(
      4,
      preparedMaterial.roughnessMap.anisotropy,
    )
  }

  preparedMaterial.needsUpdate = true
  materialCache.set(cacheKey, preparedMaterial)
  return preparedMaterial
}

export function createRestoredRunnerMaterial(
  sourceTexture,
  uvChannel = 0,
) {
  const albedo = sourceTexture.clone()
  albedo.wrapS = RepeatWrapping
  albedo.wrapT = RepeatWrapping
  albedo.repeat.set(1, RUNNER_PATTERN_REPEAT)
  albedo.anisotropy = 8
  albedo.colorSpace = SRGBColorSpace
  albedo.channel = uvChannel
  albedo.needsUpdate = true

  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 512
  const context = canvas.getContext('2d')
  const random = createRandom(143)

  context.fillStyle = '#4b191a'
  context.fillRect(0, 0, canvas.width, canvas.height)

  const image = context.getImageData(0, 0, canvas.width, canvas.height)
  for (let index = 0; index < image.data.length; index += 4) {
    const wear = Math.floor((random() - 0.5) * 22)
    image.data[index] += wear
    image.data[index + 1] += Math.floor(wear * 0.42)
    image.data[index + 2] += Math.floor(wear * 0.28)
  }
  context.putImageData(image, 0, 0)

  context.strokeStyle = '#8b6538'
  context.lineWidth = 5
  context.strokeRect(16, 0, canvas.width - 32, canvas.height)
  context.strokeStyle = '#271f22'
  context.lineWidth = 3
  context.strokeRect(26, 0, canvas.width - 52, canvas.height)

  context.strokeStyle = 'rgba(166, 116, 57, 0.56)'
  context.lineWidth = 2
  for (let y = 34; y < canvas.height; y += 62) {
    context.beginPath()
    context.moveTo(canvas.width / 2, y - 18)
    context.lineTo(canvas.width / 2 + 22, y)
    context.lineTo(canvas.width / 2, y + 18)
    context.lineTo(canvas.width / 2 - 22, y)
    context.closePath()
    context.stroke()
  }

  for (let wear = 0; wear < 18; wear += 1) {
    context.fillStyle = `rgba(35, 28, 24, ${0.06 + random() * 0.12})`
    context.beginPath()
    context.ellipse(
      22 + random() * (canvas.width - 44),
      random() * canvas.height,
      7 + random() * 26,
      3 + random() * 16,
      random() * Math.PI,
      0,
      Math.PI * 2,
    )
    context.fill()
  }

  const bumpMap = prepareCanvasTexture(canvas, {
    repeat: [1, RUNNER_PATTERN_REPEAT],
  })
  bumpMap.channel = uvChannel

  const material = new MeshStandardMaterial({
    map: albedo,
    bumpMap,
    bumpScale: 0.012,
    color: '#b9a19e',
    roughness: 1,
  })
  material.name = 'RestoredWornRunner'
  return material
}

export function createContinuousRunnerGeometry(
  sourceGeometry,
  moduleIndex,
  uvChannel = 0,
) {
  const geometry = sourceGeometry.clone()
  const uv = geometry.getAttribute(uvChannel === 1 ? 'uv1' : 'uv')

  if (!uv) {
    return geometry
  }

  const moduleUvLength =
    RUNNER_MODULE_SPACING / PREVIOUS_RUNNER_REFERENCE_LENGTH
  const moduleStart = moduleIndex * moduleUvLength
  const isReversed = moduleIndex % 2 === 1

  for (let index = 0; index < uv.count; index += 1) {
    const localV = isReversed ? 1 - uv.getY(index) : uv.getY(index)
    uv.setY(index, moduleStart + localV * moduleUvLength)
  }

  uv.needsUpdate = true
  return geometry
}
