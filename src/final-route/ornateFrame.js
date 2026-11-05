import {
  BufferGeometry,
  CatmullRomCurve3,
  Color,
  Float32BufferAttribute,
  MeshStandardMaterial,
  Vector3,
} from 'three'

export const BOOK_POSTER_WIDTH = 1.18
export const BOOK_POSTER_HEIGHT = 1.82
export const BOOK_FRAME_PLACEMENTS = Object.freeze(
  [
    { normalX: -1, position: [2.87, 1.6, -2.55] },
    { normalX: 1, position: [-2.87, 1.6, -6.25] },
    { normalX: -1, position: [2.87, 1.6, -9.55] },
  ].map((placement) =>
    Object.freeze({
      ...placement,
      position: Object.freeze(placement.position),
    }),
  ),
)

const CORNER_RADIUS = 0.12
const TOP_ARCH = 0.07
// Reaches the wall behind the picture, whatever the size of the frame.
const BACK_DEPTH = 0.13
const BACK_SLOPE = 0.035
// Where the ornaments rest: distance from the opening, in the moulding profile.
const RAIL_OFFSET = 0.1
const PEARL_OFFSET = 0.0775
const LAUREL_OFFSET = 0.118
const TIPS_OFFSET = 0.042

// Old dark bronze: blue-black in the hollows, worn pale on what stands out.
const HOLLOW = new Color('#080b0f')
const BRONZE = new Color('#2c2a28')
const WORN_METAL = new Color('#9a8460')
const PATINA_STRENGTH = 0.1
const HAND_FINISH_DEPTH = 0.003
// The relief is lit from the top left, whichever wall the frame hangs on.
const RELIEF_LIGHT = new Vector3(-0.38, 0.62, 0.69).normalize()
const RELIEF_SHINE = new Vector3(-0.38, 0.62, 1.69).normalize()

// The cross-section of the moulding, from the picture outwards:
// [distance from the opening, height above the picture, brightness].
const MOULDING_PROFILE = Object.freeze([
  [0, -0.012, 0],
  [0, 0.008, 0.36],
  [0.006, 0.016, 0.66],
  [0.014, 0.018, 0.6],
  [0.02, 0.012, 0.3],
  [0.036, 0.018, 0.42],
  [0.056, 0.034, 0.5],
  [0.07, 0.054, 0.56],
  [0.085, 0.058, 0.32],
  [0.1, 0.075, 0.6],
  [0.118, 0.084, 0.68],
  [0.135, 0.075, 0.56],
  [0.146, 0.056, 0.22],
  [0.152, 0.05, 0.06],
  [0.158, 0.05, 0.08],
  [0.166, 0.058, 0.66],
  [0.176, 0.058, 0.66],
  [0.184, 0.046, 0.3],
  [0.192, 0.02, 0.6],
  [0.196, -0.02, 0.72],
])

function degrees(value) {
  return (value * Math.PI) / 180
}

// Uneven on purpose: no two parts of a hand-finished bronze wear the same way.
function getPatina(x, y) {
  return (
    (Math.sin(x * 11.3 + y * 7.1) +
      Math.sin(x * 4.7 - y * 13.9 + 1.7) +
      0.5 * Math.sin(x * 29.1 + y * 23.3 + 4.2)) /
    2.5
  )
}

function addVertex(mesh, x, y, z, brightness) {
  const level = Math.min(
    1,
    Math.max(0, brightness + getPatina(x, y) * PATINA_STRENGTH),
  )
  const from = level < 0.5 ? HOLLOW : BRONZE
  const to = level < 0.5 ? BRONZE : WORN_METAL
  const mix = level < 0.5 ? level * 2 : (level - 0.5) * 2

  mesh.positions.push(x, y, z)
  mesh.colors.push(
    from.r + (to.r - from.r) * mix,
    from.g + (to.g - from.g) * mix,
    from.b + (to.b - from.b) * mix,
  )
}

function addLine(points, fromX, fromY, toX, toY, steps) {
  for (let step = 0; step < steps; step += 1) {
    points.push([
      fromX + ((toX - fromX) * step) / steps,
      fromY + ((toY - fromY) * step) / steps,
    ])
  }
}

function addArc(points, centerX, centerY, radius, from, to, steps) {
  for (let step = 0; step < steps; step += 1) {
    const angle = degrees(from + ((to - from) * step) / steps)

    points.push([
      centerX + Math.cos(angle) * radius,
      centerY + Math.sin(angle) * radius,
    ])
  }
}

// The opening, clockwise: rounded corners, and a top that rises in a soft curve.
function createOutline(width, height, scale, arch) {
  const halfWidth = width / 2
  const halfHeight = height / 2
  const radius = CORNER_RADIUS * scale
  const run = halfWidth - radius
  const side = halfHeight - radius
  const points = []

  for (let step = 0; step < 48; step += 1) {
    const x = -run + (2 * run * step) / 48

    points.push([
      x,
      halfHeight + arch * Math.cos((Math.PI * x) / (2 * run)) ** 2,
    ])
  }

  addArc(points, run, side, radius, 90, 0, 10)
  addLine(points, halfWidth, side, halfWidth, -side, 40)
  addArc(points, run, -side, radius, 0, -90, 10)
  addLine(points, run, -halfHeight, -run, -halfHeight, 28)
  addArc(points, -run, -side, radius, -90, -180, 10)
  addLine(points, -halfWidth, -side, -halfWidth, side, 40)
  addArc(points, -run, side, radius, 180, 90, 10)

  return points.map(([x, y], index) => {
    const [beforeX, beforeY] =
      points[(index - 1 + points.length) % points.length]
    const [afterX, afterY] = points[(index + 1) % points.length]
    const length = Math.hypot(afterX - beforeX, afterY - beforeY)

    return {
      normalX: -(afterY - beforeY) / length,
      normalY: (afterX - beforeX) / length,
      x,
      y,
    }
  })
}

function addMoulding(mesh, outline, scale) {
  const first = mesh.positions.length / 3
  const rows = MOULDING_PROFILE.length + 1

  outline.forEach(({ normalX, normalY, x, y }) => {
    MOULDING_PROFILE.forEach(([offset, z, brightness]) => {
      addVertex(
        mesh,
        x + normalX * offset * scale,
        y + normalY * offset * scale,
        z * scale,
        brightness,
      )
    })

    // Sloping out to the wall, the side catches the light seen from an angle.
    const backOffset = MOULDING_PROFILE.at(-1)[0] * scale + BACK_SLOPE

    addVertex(
      mesh,
      x + normalX * backOffset,
      y + normalY * backOffset,
      -BACK_DEPTH,
      0.72,
    )
  })

  outline.forEach((_, column) => {
    const nextColumn = (column + 1) % outline.length

    for (let row = 0; row < rows - 1; row += 1) {
      const a = first + column * rows + row
      const b = first + nextColumn * rows + row
      const c = a + 1
      const d = b + 1

      mesh.indices.push(a, b, c, b, d, c)
    }
  })
}

// A dark ground behind the picture, seen where the opening rises above it.
function addBacking(mesh, outline, scale) {
  const first = mesh.positions.length / 3
  const z = -0.006 * scale

  mesh.positions.push(0, 0, z)
  mesh.colors.push(HOLLOW.r, HOLLOW.g, HOLLOW.b)
  outline.forEach(({ x, y }) => {
    mesh.positions.push(x, y, z)
    mesh.colors.push(HOLLOW.r, HOLLOW.g, HOLLOW.b)
  })
  outline.forEach((_, index) => {
    mesh.indices.push(
      first,
      first + 1 + ((index + 1) % outline.length),
      first + 1 + index,
    )
  })
}

// A carved stroke along a path: domed across, brightest along its crest, and
// wrapped a little behind so that it never shows a hollow edge.
function addSweep(
  mesh,
  path,
  getWidth,
  getHeight,
  { rest = 0.2, ridge = 0.66, sides = 5, wrap = 0.2 } = {},
) {
  const first = mesh.positions.length / 3
  const last = path.length - 1

  path.forEach(([x, y, z], ring) => {
    const [beforeX, beforeY] = path[Math.max(ring - 1, 0)]
    const [afterX, afterY] = path[Math.min(ring + 1, last)]
    const length = Math.hypot(afterX - beforeX, afterY - beforeY) || 1
    const normalX = -(afterY - beforeY) / length
    const normalY = (afterX - beforeX) / length
    const width = getWidth(ring / last)
    const height = getHeight(ring / last)

    for (let side = 0; side <= sides; side += 1) {
      const angle = -wrap + ((Math.PI + 2 * wrap) * side) / sides
      const across = Math.cos(angle) * width
      const lift = Math.sin(angle)

      addVertex(
        mesh,
        x + normalX * across,
        y + normalY * across,
        z + lift * height,
        rest + ridge * Math.max(lift, 0) ** 3,
      )
    }
  })

  for (let ring = 0; ring < last; ring += 1) {
    for (let side = 0; side < sides; side += 1) {
      const a = first + ring * (sides + 1) + side
      const b = a + 1
      const c = a + sides + 1
      const d = c + 1

      mesh.indices.push(a, b, c, b, d, c)
    }
  }
}

function addDome(
  mesh,
  x,
  y,
  z,
  radiusX,
  radiusY,
  height,
  { rings = 4, segments = 12, summit = 0.95, foot = 0.2 } = {},
) {
  const first = mesh.positions.length / 3

  addVertex(mesh, x, y, z + height, summit)

  for (let ring = 1; ring <= rings; ring += 1) {
    const tilt = (ring / rings) * (Math.PI / 2 + 0.2)
    const level = Math.max(Math.cos(tilt), 0)

    for (let segment = 0; segment < segments; segment += 1) {
      const angle = (segment / segments) * Math.PI * 2

      addVertex(
        mesh,
        x + Math.cos(angle) * Math.sin(tilt) * radiusX,
        y + Math.sin(angle) * Math.sin(tilt) * radiusY,
        z + Math.cos(tilt) * height,
        foot + (summit - foot) * level,
      )
    }
  }

  for (let segment = 0; segment < segments; segment += 1) {
    const next = (segment + 1) % segments

    mesh.indices.push(first, first + 1 + segment, first + 1 + next)

    for (let ring = 0; ring < rings - 1; ring += 1) {
      const a = first + 1 + ring * segments + segment
      const b = first + 1 + ring * segments + next
      const c = a + segments
      const d = b + segments

      mesh.indices.push(a, c, b, b, c, d)
    }
  }
}

// Calls back at regular intervals along the outline, moved out by `offset`.
function walkOutline(outline, offset, spacing, visit) {
  const ring = outline.map(({ normalX, normalY, x, y }) => [
    x + normalX * offset,
    y + normalY * offset,
  ])
  let travelled = spacing / 2
  let count = 0

  ring.forEach(([x, y], index) => {
    const [nextX, nextY] = ring[(index + 1) % ring.length]
    const length = Math.hypot(nextX - x, nextY - y)

    while (travelled < length) {
      const part = travelled / length

      visit(
        x + (nextX - x) * part,
        y + (nextY - y) * part,
        (nextX - x) / length,
        (nextY - y) / length,
        count,
      )
      count += 1
      travelled += spacing
    }

    travelled -= length
  })
}

function addPearls(mesh, outline, scale) {
  walkOutline(outline, PEARL_OFFSET * scale, 0.024 * scale, (x, y) => {
    addDome(
      mesh,
      x,
      y,
      0.056 * scale,
      0.0082 * scale,
      0.0082 * scale,
      0.007 * scale,
      { rings: 2, segments: 6, summit: 0.9, foot: 0.18 },
    )
  })
}

// Laurel leaves climbing both sides of the frame, from bottom to top.
function addLaurel(mesh, outline, scale) {
  const length = 0.066 * scale

  walkOutline(
    outline,
    LAUREL_OFFSET * scale,
    0.045 * scale,
    (x, y, tangentX, tangentY, index) => {
      const direction = x > 0 ? -1 : 1
      const tilt = index % 2 === 0 ? 0.35 : -0.35
      const heading =
        Math.atan2(tangentY * direction, tangentX * direction) + tilt
      const stepX = Math.cos(heading) * length
      const stepY = Math.sin(heading) * length
      const path = Array.from({ length: 6 }, (_, step) => {
        const t = step / 5

        return [
          x + (t - 0.5) * stepX,
          y + (t - 0.5) * stepY,
          0.08 * scale,
        ]
      })

      addSweep(
        mesh,
        path,
        (t) => 0.016 * scale * Math.sin(Math.PI * t) ** 0.7,
        () => 0.013 * scale,
        { rest: 0.14, ridge: 0.72, sides: 3, wrap: 0 },
      )
    },
  )
}

// Small leaf tips pointing at the picture, in the hollow of the moulding.
function addLeafTips(mesh, outline, scale) {
  const length = 0.03 * scale

  walkOutline(
    outline,
    TIPS_OFFSET * scale,
    0.04 * scale,
    (x, y, tangentX, tangentY) => {
      // Clockwise, the picture lies to the right of the direction of travel.
      const inwardX = tangentY
      const inwardY = -tangentX
      const path = Array.from({ length: 5 }, (_, step) => {
        const t = step / 4

        return [
          x + inwardX * length * (t - 0.5),
          y + inwardY * length * (t - 0.5),
          (0.036 - 0.018 * t) * scale,
        ]
      })

      addSweep(
        mesh,
        path,
        (t) => 0.017 * scale * Math.sin(Math.PI * t ** 0.7) ** 0.6,
        () => 0.009 * scale,
        { rest: 0.16, ridge: 0.5, sides: 3, wrap: 0 },
      )
    },
  )
}

function createMotif(mesh, scale, originX, originY, flipY = 1) {
  return {
    at: (u, v, z) => [
      originX + u * scale,
      originY + v * flipY * scale,
      z * scale,
    ],
    mesh,
    scale,
  }
}

// A leaf or a shell lobe growing from a point, turning as it goes.
function addLeaf(
  motif,
  u,
  v,
  heading,
  length,
  width,
  { curl = 0, lobes = 3, rest = 0.12, ridge = 0.58, z = 0.07 } = {},
) {
  const samples = 16
  const step = length / samples
  const path = []
  let pointU = u
  let pointV = v

  for (let sample = 0; sample <= samples; sample += 1) {
    const t = sample / samples
    const angle = degrees(heading) + curl * t * t

    path.push(
      motif.at(
        pointU,
        pointV,
        z + 0.028 * Math.sin(Math.PI * t) - 0.02 * t,
      ),
    )
    pointU += Math.cos(angle) * step
    pointV += Math.sin(angle) * step
  }

  addSweep(
    motif.mesh,
    path,
    (t) =>
      width *
      motif.scale *
      Math.max(Math.sin(Math.PI * t ** 0.7), 0) ** 0.6 *
      (1 - 0.3 * (0.5 - 0.5 * Math.cos(2 * Math.PI * lobes * t))),
    (t) =>
      0.022 *
      motif.scale *
      Math.max(Math.sin(Math.PI * t), 0) ** 0.35 *
      (1 - 0.3 * t),
    { rest, ridge },
  )
}

function addMotifDome(motif, u, v, z, radiusU, radiusV, height, options) {
  const [x, y, depth] = motif.at(u, v, z)

  addDome(
    motif.mesh,
    x,
    y,
    depth,
    radiusU * motif.scale,
    radiusV * motif.scale,
    height * motif.scale,
    options,
  )
}

function addPearlRing(motif, u, v, z, radiusU, radiusV, count) {
  for (let pearl = 0; pearl < count; pearl += 1) {
    const angle = (pearl / count) * Math.PI * 2

    addMotifDome(
      motif,
      u + Math.cos(angle) * radiusU,
      v + Math.sin(angle) * radiusV,
      z,
      0.0085,
      0.0085,
      0.0075,
      { rings: 2, segments: 6, summit: 0.92, foot: 0.2 },
    )
  }
}

// A spiral from its outer edge to its eye, as a carver would draw it.
function getVolute(centerU, centerV, radius, startAngle, turns, z) {
  const steps = Math.ceil(Math.abs(turns) * 9)

  return Array.from({ length: steps + 1 }, (_, step) => {
    const t = step / steps
    const distance = radius * (1 - 0.72 * t)
    const angle = degrees(startAngle) + turns * Math.PI * 2 * t

    return [
      centerU + Math.cos(angle) * distance,
      centerV + Math.sin(angle) * distance,
      z + 0.008 * t,
    ]
  })
}

// Each eye is [u, v, z, radius]: a boss, on a disc that fills the spiral.
function addScroll(motif, controlPoints, thickness, eyes = []) {
  const curve = new CatmullRomCurve3(
    controlPoints.map(
      (point) => new Vector3(...motif.at(...point)),
    ),
    false,
    'centripetal',
  )
  const path = curve
    .getSpacedPoints(32)
    .map(({ x, y, z }) => [x, y, z])

  addSweep(
    motif.mesh,
    path,
    (t) =>
      thickness *
      motif.scale *
      (0.34 + 0.66 * Math.max(Math.sin(Math.PI * t), 0) ** 0.7),
    (t) =>
      thickness *
      motif.scale *
      (0.55 + 0.45 * Math.max(Math.sin(Math.PI * t), 0)),
    { rest: 0.14, ridge: 0.5 },
  )

  eyes.forEach(([u, v, z, radius]) => {
    addMotifDome(motif, u, v, z - 0.022, radius, radius, 0.016, {
      rings: 3,
      segments: 12,
      summit: 0.42,
      foot: 0.06,
    })
    addMotifDome(motif, u, v, z, 0.015, 0.015, 0.014, {
      rings: 2,
      segments: 8,
    })
  })
}

function addCrest(center, right, height, scale, arch, run) {
  const originY = height / 2 + arch + RAIL_OFFSET * scale
  const centerMotif = createMotif(center, scale, 0, originY)
  const motif = createMotif(right, scale, 0, originY)
  // The rail falls away from the top of the arch: the ornaments follow it.
  const rail = (u) =>
    (arch * (Math.cos((Math.PI * u * scale) / (2 * run)) ** 2 - 1)) / scale

  // Foliage under the scrolls, darker, so that they stand out from a mass.
  addLeaf(motif, 0.09, 0.03 + rail(0.09), 6, 0.23, 0.058, {
    lobes: 5,
    rest: 0.08,
    ridge: 0.46,
    z: 0.056,
  })

  addLeaf(centerMotif, 0, 0, 90, 0.25, 0.05, { lobes: 4, z: 0.066 })
  ;[
    [21, 0.232, 0.048, 0.35],
    [43, 0.198, 0.045, 0.5],
    [65, 0.162, 0.04, 0.7],
    [86, 0.135, 0.036, 0.9],
  ].forEach(([offset, length, width, curl]) => {
    addLeaf(motif, 0, 0, 90 - offset, length, width, {
      curl: -curl,
      z: 0.066,
    })
  })
  ;[
    [10.5, 0.155, 0.028],
    [32, 0.14, 0.028],
    [54, 0.118, 0.026],
  ].forEach(([offset, length, width]) => {
    addLeaf(motif, 0, 0, 90 - offset, length, width, {
      curl: -0.3,
      lobes: 2,
      z: 0.084,
    })
  })
  addMotifDome(centerMotif, 0, -0.005, 0.1, 0.055, 0.042, 0.034)
  addPearlRing(centerMotif, 0, -0.005, 0.104, 0.07, 0.057, 14)

  const innerEye = [0.095, 0.018 + rail(0.095)]
  const outerEye = [0.29, 0.008 + rail(0.29)]

  addScroll(
    motif,
    [
      ...getVolute(...innerEye, 0.045, 90, 1.2, 0.086).reverse(),
      [0.15, 0.07 + rail(0.15), 0.09],
      [0.205, 0.08 + rail(0.205), 0.09],
      [0.26, 0.07 + rail(0.26), 0.088],
      ...getVolute(...outerEye, 0.048, 60, -1.15, 0.086),
    ],
    0.027,
    [
      [...innerEye, 0.1, 0.034],
      [...outerEye, 0.1, 0.036],
    ],
  )
  addLeaf(motif, 0.15, 0.072 + rail(0.15), 72, 0.15, 0.04, {
    curl: -1.25,
    z: 0.08,
  })
  addLeaf(motif, 0.215, 0.08 + rail(0.215), 58, 0.105, 0.032, {
    curl: -1.1,
    lobes: 2,
    z: 0.08,
  })
}

function addBottomShell(center, right, height, scale) {
  const originY = -(height / 2 + RAIL_OFFSET * scale)
  const centerMotif = createMotif(center, scale, 0, originY, -1)
  const motif = createMotif(right, scale, 0, originY, -1)

  addLeaf(motif, 0.09, 0.022, 6, 0.21, 0.052, {
    lobes: 5,
    rest: 0.08,
    ridge: 0.46,
    z: 0.056,
  })

  addLeaf(centerMotif, 0, -0.03, 90, 0.16, 0.042, { lobes: 0, z: 0.074 })
  ;[
    [21, 0.155, 0.04, 0.08],
    [42, 0.14, 0.038, 0.12],
    [63, 0.118, 0.035, 0.16],
    [84, 0.094, 0.03, 0.2],
  ].forEach(([offset, length, width, curl]) => {
    addLeaf(motif, 0, -0.03, 90 - offset, length, width, {
      curl: -curl,
      lobes: 0,
      z: 0.074,
    })
  })
  addMotifDome(centerMotif, 0, -0.03, 0.098, 0.048, 0.032, 0.03)

  addScroll(
    motif,
    [
      ...getVolute(0.085, 0, 0.038, 90, 1.2, 0.086).reverse(),
      [0.135, 0.05, 0.09],
      [0.19, 0.066, 0.09],
      [0.24, 0.06, 0.088],
      ...getVolute(0.27, 0.002, 0.044, 60, -1.1, 0.086),
    ],
    0.024,
    [
      [0.085, 0, 0.1, 0.028],
      [0.27, 0.002, 0.1, 0.032],
    ],
  )
  addLeaf(motif, 0.14, 0.05, 70, 0.115, 0.034, { curl: -1.2, z: 0.08 })
  addLeaf(motif, 0.2, 0.066, 55, 0.085, 0.028, { curl: -1, lobes: 2, z: 0.08 })
}

function addCorner(right, width, height, scale, flipY) {
  const motif = createMotif(
    right,
    scale,
    width / 2 + 0.045 * scale,
    (height / 2 + 0.045 * scale) * flipY,
    flipY,
  )

  // Foliage under the two scrolls.
  addLeaf(motif, -0.015, 0.1, 172, 0.235, 0.064, {
    lobes: 5,
    rest: 0.08,
    ridge: 0.46,
    z: 0.056,
  })
  addLeaf(motif, 0.1, -0.015, -82, 0.235, 0.064, {
    lobes: 5,
    rest: 0.08,
    ridge: 0.46,
    z: 0.056,
  })

  addLeaf(motif, 0, 0, 45, 0.175, 0.044, { lobes: 3, z: 0.068 })
  ;[
    [24, 0.155, 0.04, 0.5],
    [48, 0.13, 0.034, 0.85],
  ].forEach(([offset, length, leafWidth, curl]) => {
    addLeaf(motif, 0, 0, 45 + offset, length, leafWidth, { curl, z: 0.068 })
    addLeaf(motif, 0, 0, 45 - offset, length, leafWidth, {
      curl: -curl,
      z: 0.068,
    })
  })
  addMotifDome(motif, 0, 0, 0.094, 0.036, 0.036, 0.032)
  addPearlRing(motif, 0, 0, 0.098, 0.048, 0.048, 9)

  addScroll(
    motif,
    [
      [-0.03, 0.04, 0.086],
      [-0.075, 0.115, 0.09],
      [-0.135, 0.17, 0.088],
      [-0.195, 0.185, 0.084],
      ...getVolute(-0.26, 0.115, 0.058, 50, 1.1, 0.08),
    ],
    0.024,
    [[-0.26, 0.115, 0.094, 0.04]],
  )
  addScroll(
    motif,
    [
      [0.04, -0.03, 0.086],
      [0.115, -0.075, 0.09],
      [0.17, -0.135, 0.088],
      [0.185, -0.195, 0.084],
      ...getVolute(0.115, -0.26, 0.058, 40, -1.1, 0.08),
    ],
    0.024,
    [[0.115, -0.26, 0.094, 0.04]],
  )
}

function addSideCartouche(right, width, scale) {
  const originX = width / 2 + RAIL_OFFSET * scale
  const motif = createMotif(right, scale, originX, 0)

  addLeaf(motif, 0.02, 0, 0, 0.115, 0.04, { lobes: 2, z: 0.072 })

  ;[1, -1].forEach((flipY) => {
    const side = createMotif(right, scale, originX, 0, flipY)

    addLeaf(side, 0.04, 0.055, 84, 0.18, 0.05, {
      lobes: 4,
      rest: 0.08,
      ridge: 0.46,
      z: 0.056,
    })
    addLeaf(side, 0.012, 0.02, 40, 0.1, 0.03, { curl: -0.7, z: 0.072 })
    addScroll(
      side,
      [
        [0, 0.07, 0.088],
        [0.038, 0.105, 0.09],
        [0.056, 0.155, 0.09],
        [0.04, 0.215, 0.086],
        ...getVolute(-0.01, 0.195, 0.054, 22, 1.05, 0.084),
      ],
      0.021,
      [[-0.01, 0.195, 0.098, 0.034]],
    )
  })

  addMotifDome(motif, 0, 0, 0.098, 0.032, 0.054, 0.032)
  addPearlRing(motif, 0, 0, 0.102, 0.045, 0.069, 12)
}

// Copies a half of the frame to the other side of the vertical axis.
function addMirrored(mesh, half) {
  const first = mesh.positions.length / 3

  for (let index = 0; index < half.positions.length; index += 3) {
    mesh.positions.push(
      -half.positions[index],
      half.positions[index + 1],
      half.positions[index + 2],
    )
  }

  mesh.colors.push(...half.colors)

  for (let index = 0; index < half.indices.length; index += 3) {
    mesh.indices.push(
      first + half.indices[index],
      first + half.indices[index + 2],
      first + half.indices[index + 1],
    )
  }
}

function addCopy(mesh, part) {
  const first = mesh.positions.length / 3

  mesh.positions.push(...part.positions)
  mesh.colors.push(...part.colors)
  part.indices.forEach((index) => mesh.indices.push(first + index))
}

// A slight unevenness of the surface, as on a piece finished by hand.
function addHandFinish(geometry, scale) {
  const positions = geometry.getAttribute('position')

  for (let index = 0; index < positions.count; index += 1) {
    const x = positions.getX(index)
    const y = positions.getY(index)

    positions.setZ(
      index,
      positions.getZ(index) +
        getPatina(x * 3.1, y * 3.1) * HAND_FINISH_DEPTH * scale,
    )
  }
}

// The lamps of the corridors are too few and too far to bring out the carving
// alone, so its light and shade are part of its colour.
function bakeRelief(geometry) {
  const colors = geometry.getAttribute('color')
  const normals = geometry.getAttribute('normal')
  const normal = new Vector3()

  for (let index = 0; index < colors.count; index += 1) {
    normal.fromBufferAttribute(normals, index)

    const diffuse = Math.max(normal.dot(RELIEF_LIGHT), 0)
    const shine = Math.max(normal.dot(RELIEF_SHINE), 0) ** 24
    const light = 0.22 + 1.0 * diffuse + 1.5 * shine

    colors.setXYZ(
      index,
      Math.min(colors.getX(index) * light, 1),
      Math.min(colors.getY(index) * light, 1),
      Math.min(colors.getZ(index) * light, 1),
    )
  }
}

// Carved around an opening of width × height, centred on the origin.
export function createOrnateFrameGeometry(
  width,
  height,
  { arch = TOP_ARCH, scale = 1 } = {},
) {
  const risenArch = arch * scale
  const outline = createOutline(width, height, scale, risenArch)
  const run = width / 2 - CORNER_RADIUS * scale
  const center = { colors: [], indices: [], positions: [] }
  const right = { colors: [], indices: [], positions: [] }

  addBacking(center, outline, scale)
  addMoulding(center, outline, scale)
  addPearls(center, outline, scale)
  addLaurel(center, outline, scale)
  addLeafTips(center, outline, scale)
  addCrest(center, right, height, scale, risenArch, run)
  addBottomShell(center, right, height, scale)
  addCorner(right, width, height, scale, 1)
  addCorner(right, width, height, scale, -1)
  addSideCartouche(right, width, scale)

  const mesh = { colors: [], indices: [], positions: [] }

  addCopy(mesh, center)
  addCopy(mesh, right)
  addMirrored(mesh, right)

  const geometry = new BufferGeometry()

  geometry.setAttribute(
    'position',
    new Float32BufferAttribute(mesh.positions, 3),
  )
  geometry.setAttribute(
    'color',
    new Float32BufferAttribute(mesh.colors, 3),
  )
  geometry.setIndex(mesh.indices)
  addHandFinish(geometry, scale)
  geometry.computeVertexNormals()
  bakeRelief(geometry)
  return geometry
}

// There is no environment map to reflect and the corridors are dim: a faint
// glow in the tones of the carving keeps the relief readable from afar.
export function createOrnateFrameMaterial() {
  const material = new MeshStandardMaterial({
    emissive: '#ffffff',
    emissiveIntensity: 0.55,
    metalness: 0.45,
    roughness: 0.48,
    vertexColors: true,
  })

  material.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <emissivemap_fragment>',
      `#include <emissivemap_fragment>
      totalEmissiveRadiance *= vColor.rgb;`,
    )
  }
  material.name = 'OrnateFrame'
  return material
}
