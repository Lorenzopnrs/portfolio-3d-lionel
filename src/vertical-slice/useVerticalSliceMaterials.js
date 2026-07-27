import {
  CanvasTexture,
  DoubleSide,
  MeshBasicMaterial,
  MeshStandardMaterial,
  NoColorSpace,
  RepeatWrapping,
  SRGBColorSpace,
  TextureLoader,
} from 'three'

const textureLoader = new TextureLoader()

function createRandom(seed) {
  let value = seed >>> 0

  return () => {
    value = (value * 1664525 + 1013904223) >>> 0
    return value / 4294967296
  }
}

function createTexture(width, height, repeat, draw) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')

  draw(context, width, height)

  const texture = new CanvasTexture(canvas)
  texture.wrapS = RepeatWrapping
  texture.wrapT = RepeatWrapping
  texture.repeat.set(...repeat)
  texture.anisotropy = 4
  texture.colorSpace = SRGBColorSpace

  return texture
}

function loadColorTexture(path, repeat) {
  const texture = textureLoader.load(path)
  texture.wrapS = RepeatWrapping
  texture.wrapT = RepeatWrapping
  texture.repeat.set(...repeat)
  texture.anisotropy = 8
  texture.colorSpace = SRGBColorSpace

  return texture
}

function createStoneTexture(seed = 17, repeat = [1.6, 2.4]) {
  return createTexture(512, 512, repeat, (context, width, height) => {
    const random = createRandom(seed)
    const image = context.createImageData(width, height)

    for (let index = 0; index < image.data.length; index += 4) {
      const noise = Math.floor((random() - 0.5) * 30)
      image.data[index] = 134 + noise
      image.data[index + 1] = 124 + noise
      image.data[index + 2] = 105 + noise
      image.data[index + 3] = 255
    }

    context.putImageData(image, 0, 0)

    for (let patch = 0; patch < 34; patch += 1) {
      const alpha = 0.025 + random() * 0.055
      context.fillStyle =
        random() > 0.45
          ? `rgba(48, 54, 45, ${alpha})`
          : `rgba(205, 184, 145, ${alpha})`
      context.beginPath()
      context.ellipse(
        random() * width,
        random() * height,
        24 + random() * 105,
        12 + random() * 55,
        random() * Math.PI,
        0,
        Math.PI * 2,
      )
      context.fill()
    }

    context.lineWidth = 5
    context.strokeStyle = 'rgba(42, 39, 33, 0.48)'
    const courseHeight = 74

    for (let y = courseHeight; y < height; y += courseHeight) {
      context.beginPath()
      context.moveTo(0, y + (random() - 0.5) * 4)
      context.lineTo(width, y + (random() - 0.5) * 4)
      context.stroke()

      const offset = Math.floor((y / courseHeight) % 2) * 74
      for (let x = offset; x < width; x += 148) {
        context.beginPath()
        context.moveTo(x, y - courseHeight)
        context.lineTo(x + (random() - 0.5) * 7, y)
        context.stroke()
      }
    }

    context.lineWidth = 1.4
    context.strokeStyle = 'rgba(29, 28, 24, 0.52)'
    for (let crack = 0; crack < 14; crack += 1) {
      let x = random() * width
      let y = random() * height
      context.beginPath()
      context.moveTo(x, y)
      for (let segment = 0; segment < 3 + random() * 4; segment += 1) {
        x += (random() - 0.5) * 34
        y += 10 + random() * 25
        context.lineTo(x, y)
      }
      context.stroke()
    }
  })
}

function createStoneHeightTexture(seed = 73, repeat = [1.6, 2.4]) {
  const texture = createTexture(
    512,
    512,
    repeat,
    (context, width, height) => {
      const random = createRandom(seed)
      const image = context.createImageData(width, height)

      for (let index = 0; index < image.data.length; index += 4) {
        const value = 118 + Math.floor(random() * 48)
        image.data[index] = value
        image.data[index + 1] = value
        image.data[index + 2] = value
        image.data[index + 3] = 255
      }

      context.putImageData(image, 0, 0)
      context.lineWidth = 6
      context.strokeStyle = 'rgb(35, 35, 35)'
      const courseHeight = 74

      for (let y = courseHeight; y < height; y += courseHeight) {
        context.beginPath()
        context.moveTo(0, y)
        context.lineTo(width, y)
        context.stroke()

        const offset = Math.floor((y / courseHeight) % 2) * 74
        for (let x = offset; x < width; x += 148) {
          context.beginPath()
          context.moveTo(x, y - courseHeight)
          context.lineTo(x, y)
          context.stroke()
        }
      }
    },
  )
  texture.colorSpace = NoColorSpace

  return texture
}

function createWoodTexture() {
  return createTexture(256, 512, [1.2, 2.6], (context, width, height) => {
    const random = createRandom(91)
    context.fillStyle = '#2b2118'
    context.fillRect(0, 0, width, height)

    for (let grain = 0; grain < 90; grain += 1) {
      const x = random() * width
      context.strokeStyle =
        random() > 0.5
          ? 'rgba(103, 75, 44, 0.22)'
          : 'rgba(10, 8, 6, 0.28)'
      context.lineWidth = 0.5 + random() * 2
      context.beginPath()
      context.moveTo(x, 0)
      context.bezierCurveTo(
        x + (random() - 0.5) * 18,
        height * 0.32,
        x + (random() - 0.5) * 22,
        height * 0.68,
        x + (random() - 0.5) * 12,
        height,
      )
      context.stroke()
    }

    for (let knot = 0; knot < 7; knot += 1) {
      context.strokeStyle = 'rgba(9, 7, 5, 0.42)'
      context.lineWidth = 2
      context.beginPath()
      context.ellipse(
        random() * width,
        random() * height,
        8 + random() * 15,
        3 + random() * 7,
        random() * 0.35,
        0,
        Math.PI * 2,
      )
      context.stroke()
    }
  })
}

function createCarpetTexture() {
  return createTexture(256, 512, [1, 2.8], (context, width, height) => {
    const random = createRandom(143)
    context.fillStyle = '#4b191a'
    context.fillRect(0, 0, width, height)

    const image = context.getImageData(0, 0, width, height)
    for (let index = 0; index < image.data.length; index += 4) {
      const wear = Math.floor((random() - 0.5) * 22)
      image.data[index] += wear
      image.data[index + 1] += Math.floor(wear * 0.42)
      image.data[index + 2] += Math.floor(wear * 0.28)
    }
    context.putImageData(image, 0, 0)

    context.strokeStyle = '#8b6538'
    context.lineWidth = 5
    context.strokeRect(16, 0, width - 32, height)
    context.strokeStyle = '#271f22'
    context.lineWidth = 3
    context.strokeRect(26, 0, width - 52, height)

    context.strokeStyle = 'rgba(166, 116, 57, 0.56)'
    context.lineWidth = 2
    for (let y = 34; y < height; y += 62) {
      context.beginPath()
      context.moveTo(width / 2, y - 18)
      context.lineTo(width / 2 + 22, y)
      context.lineTo(width / 2, y + 18)
      context.lineTo(width / 2 - 22, y)
      context.closePath()
      context.stroke()
    }

    for (let wear = 0; wear < 18; wear += 1) {
      context.fillStyle = `rgba(35, 28, 24, ${0.06 + random() * 0.12})`
      context.beginPath()
      context.ellipse(
        22 + random() * (width - 44),
        random() * height,
        7 + random() * 26,
        3 + random() * 16,
        random() * Math.PI,
        0,
        Math.PI * 2,
      )
      context.fill()
    }
  })
}

function createPaperTexture(seed) {
  return createTexture(256, 256, [1.1, 1.1], (context, width, height) => {
    const random = createRandom(seed)
    context.fillStyle = '#d3c29e'
    context.fillRect(0, 0, width, height)

    for (let fiber = 0; fiber < 460; fiber += 1) {
      const value = 92 + Math.floor(random() * 80)
      context.strokeStyle = `rgba(${value}, ${value - 8}, ${value - 20}, ${0.025 + random() * 0.05})`
      context.lineWidth = 0.4 + random() * 0.8
      context.beginPath()
      context.moveTo(random() * width, random() * height)
      context.lineTo(
        random() * width,
        random() * height,
      )
      context.stroke()
    }

    for (let stain = 0; stain < 9; stain += 1) {
      context.fillStyle = `rgba(91, 62, 34, ${0.025 + random() * 0.045})`
      context.beginPath()
      context.ellipse(
        random() * width,
        random() * height,
        6 + random() * 24,
        3 + random() * 14,
        random() * Math.PI,
        0,
        Math.PI * 2,
      )
      context.fill()
    }
  })
}

function createSurfaceVariationTexture(seed, repeat = [2, 2]) {
  const texture = createTexture(
    128,
    128,
    repeat,
    (context, width, height) => {
      const random = createRandom(seed)
      const image = context.createImageData(width, height)

      for (let index = 0; index < image.data.length; index += 4) {
        const value = 96 + Math.floor(random() * 130)
        image.data[index] = value
        image.data[index + 1] = value
        image.data[index + 2] = value
        image.data[index + 3] = 255
      }

      context.putImageData(image, 0, 0)
      for (let mark = 0; mark < 14; mark += 1) {
        const value = 45 + Math.floor(random() * 100)
        context.fillStyle = `rgba(${value}, ${value}, ${value}, ${0.08 + random() * 0.14})`
        context.beginPath()
        context.ellipse(
          random() * width,
          random() * height,
          3 + random() * 14,
          2 + random() * 8,
          random() * Math.PI,
          0,
          Math.PI * 2,
        )
        context.fill()
      }
    },
  )
  texture.colorSpace = NoColorSpace

  return texture
}

function cloneTexture(texture, offsetX, offsetY, repeat) {
  const clone = texture.clone()
  clone.offset.set(offsetX, offsetY)
  if (repeat) {
    clone.repeat.set(...repeat)
  }

  return clone
}

function createVerticalSliceResources() {
  const limestoneMap = loadColorTexture(
    '/textures/vertical-slice/aged-limestone-albedo.jpg',
    [1.5, 2.1],
  )
  const stoneMaps = [
    limestoneMap,
    cloneTexture(limestoneMap, 0.31, 0.17, [1.85, 2.35]),
    cloneTexture(limestoneMap, 0.62, 0.43, [1.35, 1.9]),
  ]
  const stoneHeights = [
    createStoneHeightTexture(73, [1.6, 2.4]),
    createStoneHeightTexture(181, [1.9, 2.15]),
    createStoneHeightTexture(347, [1.45, 2.65]),
  ]
  const ashlarMaps = [
    cloneTexture(limestoneMap, 0.08, 0.09, [0.22, 0.22]),
    cloneTexture(limestoneMap, 0.39, 0.24, [0.2, 0.24]),
    cloneTexture(limestoneMap, 0.66, 0.58, [0.24, 0.2]),
  ]
  const ashlarHeights = [
    cloneTexture(stoneHeights[0], 0.08, 0.09, [0.22, 0.22]),
    cloneTexture(stoneHeights[1], 0.39, 0.24, [0.2, 0.24]),
    cloneTexture(stoneHeights[2], 0.66, 0.58, [0.24, 0.2]),
  ]
  const floorMaps = [
    createStoneTexture(419, [2.8, 1.5]),
    createStoneTexture(557, [2.35, 1.75]),
  ]
  const floorHeights = [
    createStoneHeightTexture(449, [2.8, 1.5]),
    createStoneHeightTexture(593, [2.35, 1.75]),
  ]
  const stoneDarkMap = cloneTexture(
    limestoneMap,
    0.18,
    0.61,
    [2.15, 2.7],
  )
  const stoneDarkHeight = createStoneHeightTexture(719, [1.7, 2.3])
  const woodMap = loadColorTexture(
    '/textures/vertical-slice/dark-oak-albedo.jpg',
    [1.2, 2.4],
  )
  const woodHeight = createWoodTexture()
  woodHeight.colorSpace = NoColorSpace
  const woodWornMap = cloneTexture(woodMap, 0.38, 0.21)
  const woodWornHeight = cloneTexture(woodHeight, 0.38, 0.21)
  const carpetMap = loadColorTexture(
    '/textures/vertical-slice/worn-runner-albedo.jpg',
    [1, 2.8],
  )
  const carpetHeight = createCarpetTexture()
  carpetHeight.colorSpace = NoColorSpace
  const textileMap = cloneTexture(carpetMap, 0.18, 0.37, [2.1, 2.1])
  const textileHeight = cloneTexture(carpetHeight, 0.18, 0.37, [2.1, 2.1])
  const paperMap = createPaperTexture(811)
  const paperAgedMap = createPaperTexture(907)
  const paperHeight = createSurfaceVariationTexture(997, [1.2, 1.2])
  const metalVariation = createSurfaceVariationTexture(1051, [2.4, 2.4])
  const ironVariation = createSurfaceVariationTexture(1151, [2.8, 2.8])
  const foliageVariation = createSurfaceVariationTexture(1237, [1.7, 1.7])
  const bookWearMaps = Array.from({ length: 5 }, (_, index) =>
    createSurfaceVariationTexture(1321 + index * 53, [1.4, 1.4]),
  )

  const stoneColors = ['#99978f', '#7f7e79', '#aaa298']
  const stoneVariants = stoneMaps.map(
    (map, index) =>
      new MeshStandardMaterial({
        map,
        bumpMap: stoneHeights[index],
        bumpScale: [0.075, 0.06, 0.055][index],
        color: stoneColors[index],
        roughness: [0.95, 0.98, 0.93][index],
      }),
  )
  const ashlarColors = ['#908d85', '#787671', '#9e978d']
  const ashlarVariants = ashlarMaps.map(
    (map, index) =>
      new MeshStandardMaterial({
        map,
        bumpMap: ashlarHeights[index],
        bumpScale: [0.04, 0.035, 0.045][index],
        color: ashlarColors[index],
        roughness: 0.97,
      }),
  )

  const floorVariants = [
    new MeshStandardMaterial({
      map: floorMaps[0],
      bumpMap: floorHeights[0],
      bumpScale: 0.045,
      color: '#56534d',
      roughness: 0.88,
    }),
    new MeshStandardMaterial({
      map: floorMaps[1],
      bumpMap: floorHeights[1],
      bumpScale: 0.04,
      color: '#615c53',
      roughness: 0.9,
    }),
  ]

  const bookCoverColors = [
    '#2e1715',
    '#25281f',
    '#302820',
    '#242628',
    '#3a2b1f',
  ]
  const bookCovers = bookCoverColors.map(
    (color, index) =>
      new MeshStandardMaterial({
        bumpMap: bookWearMaps[index],
        bumpScale: 0.008,
        color,
        roughness: 0.78 + (index % 3) * 0.05,
        roughnessMap: bookWearMaps[index],
      }),
  )

  const materials = {
    ashlarVariants,
    brass: new MeshStandardMaterial({
      color: '#5f4c33',
      metalness: 0.68,
      roughness: 0.46,
      roughnessMap: metalVariation,
    }),
    bookCovers,
    carpet: new MeshStandardMaterial({
      map: carpetMap,
      bumpMap: carpetHeight,
      bumpScale: 0.012,
      color: '#b9a19e',
      roughness: 1,
    }),
    flame: new MeshBasicMaterial({
      color: '#ffd18a',
      toneMapped: false,
    }),
    floorVariants,
    foliage: new MeshStandardMaterial({
      color: '#39432d',
      roughness: 1,
      roughnessMap: foliageVariation,
      side: DoubleSide,
    }),
    foliageDry: new MeshStandardMaterial({
      color: '#513b2b',
      roughness: 1,
      roughnessMap: foliageVariation,
      side: DoubleSide,
    }),
    iron: new MeshStandardMaterial({
      color: '#171815',
      metalness: 0.72,
      roughness: 0.68,
      roughnessMap: ironVariation,
    }),
    lanternGlass: new MeshStandardMaterial({
      color: '#d9a25a',
      emissive: '#ff9d3d',
      emissiveIntensity: 1.4,
      metalness: 0.04,
      opacity: 0.44,
      roughness: 0.28,
      transparent: true,
    }),
    paper: new MeshStandardMaterial({
      map: paperMap,
      bumpMap: paperHeight,
      bumpScale: 0.008,
      color: '#c4b99f',
      roughness: 0.92,
    }),
    paperAged: new MeshStandardMaterial({
      map: paperAgedMap,
      bumpMap: paperHeight,
      bumpScale: 0.01,
      color: '#a58f70',
      roughness: 0.96,
    }),
    stoneDark: new MeshStandardMaterial({
      map: stoneDarkMap,
      bumpMap: stoneDarkHeight,
      bumpScale: 0.075,
      color: '#373832',
      roughness: 0.99,
      side: DoubleSide,
    }),
    stoneVariants,
    textile: new MeshStandardMaterial({
      map: textileMap,
      bumpMap: textileHeight,
      bumpScale: 0.009,
      color: '#55443f',
      roughness: 1,
    }),
    vine: new MeshStandardMaterial({
      color: '#252b1c',
      roughness: 1,
      roughnessMap: foliageVariation,
    }),
    wax: new MeshStandardMaterial({
      color: '#c7b98f',
      roughness: 0.84,
    }),
    wood: new MeshStandardMaterial({
      map: woodMap,
      bumpMap: woodHeight,
      bumpScale: 0.025,
      color: '#b3a69a',
      roughness: 0.83,
    }),
    woodWorn: new MeshStandardMaterial({
      map: woodWornMap,
      bumpMap: woodWornHeight,
      bumpScale: 0.018,
      color: '#8d8176',
      roughness: 0.9,
    }),
  }

  const textures = [
    ...stoneMaps,
    ...stoneHeights,
    ...ashlarMaps,
    ...ashlarHeights,
    ...floorMaps,
    ...floorHeights,
    stoneDarkMap,
    stoneDarkHeight,
    woodMap,
    woodHeight,
    woodWornMap,
    woodWornHeight,
    carpetMap,
    carpetHeight,
    textileMap,
    textileHeight,
    paperMap,
    paperAgedMap,
    paperHeight,
    metalVariation,
    ironVariation,
    foliageVariation,
    ...bookWearMaps,
  ]
  const materialList = [
    ...stoneVariants,
    ...ashlarVariants,
    ...floorVariants,
    ...bookCovers,
    ...Object.values(materials).filter(
      (material) =>
        material instanceof MeshStandardMaterial ||
        material instanceof MeshBasicMaterial,
    ),
  ]

  return { materialList, materials, textures }
}

function disposeVerticalSliceResources(resources) {
  resources.materialList.forEach((material) => material.dispose())
  resources.textures.forEach((texture) => texture.dispose())
}

const verticalSliceResources = createVerticalSliceResources()

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    disposeVerticalSliceResources(verticalSliceResources)
  })
}

export function getVerticalSliceMaterials() {
  return verticalSliceResources.materials
}
