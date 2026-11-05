import {
  BoxGeometry,
  CapsuleGeometry,
  CatmullRomCurve3,
  CylinderGeometry,
  Euler,
  Matrix4,
  Quaternion,
  TorusGeometry,
  TubeGeometry,
  Vector3,
} from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

const DIAL_HOLE_COUNT = 10
const DIAL_HOLE_RADIUS = 0.046
// The dial lies on the sloped front of the body.
const DIAL_ROTATION = Object.freeze([(62 * Math.PI) / 180, 0, 0])
const DIAL_NORMAL = new Vector3(0, 1, 0).applyEuler(
  new Euler(...DIAL_ROTATION),
)
const DIAL_CENTER = new Vector3(0, 0.064, 0.078)

function place(
  geometry,
  { position = [0, 0, 0], rotation = [0, 0, 0], scale = [1, 1, 1] },
) {
  geometry.applyMatrix4(
    new Matrix4().compose(
      new Vector3(...position),
      new Quaternion().setFromEuler(new Euler(...rotation)),
      new Vector3(...scale),
    ),
  )
  return geometry
}

function onDial(height, x = 0, z = 0) {
  return new Vector3(x, 0, z)
    .applyEuler(new Euler(...DIAL_ROTATION))
    .add(DIAL_CENTER)
    .addScaledVector(DIAL_NORMAL, height)
    .toArray()
}

function createBody() {
  const cord = new CatmullRomCurve3([
    new Vector3(0.118, 0.172, -0.03),
    new Vector3(0.165, 0.12, -0.06),
    new Vector3(0.175, 0.04, -0.03),
    new Vector3(0.19, 0.012, 0.05),
    new Vector3(0.125, 0.012, 0.115),
  ])
  const dialHoles = Array.from({ length: DIAL_HOLE_COUNT }, (_, index) => {
    const angle = 0.5 + (index / DIAL_HOLE_COUNT) * Math.PI * 1.72

    return place(new CylinderGeometry(0.0085, 0.0085, 0.002, 10), {
      position: onDial(
        0.0055,
        Math.cos(angle) * DIAL_HOLE_RADIUS,
        Math.sin(angle) * DIAL_HOLE_RADIUS,
      ),
      rotation: DIAL_ROTATION,
    })
  })

  return mergeGeometries([
    place(new BoxGeometry(0.27, 0.018, 0.24), {
      position: [0, 0.009, 0],
    }),
    place(new CylinderGeometry(0.085, 0.15, 0.085, 4), {
      position: [0, 0.06, 0],
      rotation: [0, Math.PI / 4, 0],
      scale: [1, 1, 0.92],
    }),
    place(new CylinderGeometry(0.04, 0.07, 0.055, 4), {
      position: [0, 0.13, -0.008],
      rotation: [0, Math.PI / 4, 0],
    }),
    place(new BoxGeometry(0.2, 0.012, 0.035), {
      position: [0, 0.158, -0.008],
    }),
    ...[-0.085, 0.085].map((x) =>
      place(new BoxGeometry(0.026, 0.038, 0.046), {
        position: [x, 0.172, -0.008],
      }),
    ),
    place(new CapsuleGeometry(0.017, 0.2, 4, 12), {
      position: [0, 0.205, -0.008],
      rotation: [0, 0, Math.PI / 2],
    }),
    ...[-0.118, 0.118].map((x) =>
      place(new CylinderGeometry(0.041, 0.03, 0.036, 18), {
        position: [x, 0.186, -0.008],
      }),
    ),
    new TubeGeometry(cord, 28, 0.0052, 6),
    ...dialHoles,
  ])
}

function createBrass() {
  return mergeGeometries([
    place(new CylinderGeometry(0.062, 0.062, 0.008, 36), {
      position: onDial(0.001),
      rotation: DIAL_ROTATION,
    }),
    place(new BoxGeometry(0.007, 0.006, 0.024), {
      position: onDial(0.007, 0.05, 0.03),
      rotation: DIAL_ROTATION,
    }),
    ...[-0.118, 0.118].map((x) =>
      place(new TorusGeometry(0.039, 0.0035, 8, 24), {
        position: [x, 0.204, -0.008],
        rotation: [Math.PI / 2, 0, 0],
      }),
    ),
    place(new BoxGeometry(0.276, 0.004, 0.246), {
      position: [0, 0.019, 0],
    }),
  ])
}

function createPaperLabel() {
  return place(new CylinderGeometry(0.024, 0.024, 0.002, 22), {
    position: onDial(0.0055),
    rotation: DIAL_ROTATION,
  })
}

export function createRotaryPhoneGeometries() {
  return {
    body: createBody(),
    brass: createBrass(),
    label: createPaperLabel(),
  }
}
