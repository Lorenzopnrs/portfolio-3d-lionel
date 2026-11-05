import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from 'react'
import { Html } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import {
  CanvasTexture,
  DoubleSide,
  ExtrudeGeometry,
  LinearFilter,
  Path,
  SRGBColorSpace,
  Shape,
  ShapeGeometry,
} from 'three'
import {
  ABOUT_PORTAL_DEPTH,
  ABOUT_PORTAL_FRAME_OUTER_SPRING_HEIGHT,
  ABOUT_PORTAL_FRAME_OUTER_WIDTH,
  ABOUT_PORTAL_FRAME_WIDTH,
  ABOUT_PORTAL_HEIGHT,
  ABOUT_PORTAL_POSITION,
  ABOUT_PORTAL_SPRING_HEIGHT,
  ABOUT_PORTAL_WIDTH,
} from './aboutPortalConfig'

const PORTAL_VERTEX_SHADER = `
  varying vec2 vPortalUv;

  void main() {
    vPortalUv = vec2(
      position.x / ${ABOUT_PORTAL_WIDTH.toFixed(2)} + 0.5,
      position.y / ${ABOUT_PORTAL_HEIGHT.toFixed(2)}
    );
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const PORTAL_FRAGMENT_SHADER = `
  precision highp float;

  uniform float uReducedMotion;
  uniform float uTime;
  varying vec2 vPortalUv;

  vec2 mod289(vec2 value) {
    return value - floor(value * (1.0 / 289.0)) * 289.0;
  }

  vec3 mod289(vec3 value) {
    return value - floor(value * (1.0 / 289.0)) * 289.0;
  }

  vec3 permute(vec3 value) {
    return mod289(((value * 34.0) + 1.0) * value);
  }

  float simplexNoise(vec2 value) {
    const vec4 constants = vec4(
      0.211324865405187,
      0.366025403784439,
      -0.577350269189626,
      0.024390243902439
    );

    vec2 lattice = floor(value + dot(value, constants.yy));
    vec2 localOrigin =
      value - lattice + dot(lattice, constants.xx);
    vec2 offset =
      localOrigin.x > localOrigin.y
        ? vec2(1.0, 0.0)
        : vec2(0.0, 1.0);
    vec4 localCorners = localOrigin.xyxy + constants.xxzz;
    localCorners.xy -= offset;
    lattice = mod289(lattice);

    vec3 permutation = permute(
      permute(lattice.y + vec3(0.0, offset.y, 1.0)) +
      lattice.x +
      vec3(0.0, offset.x, 1.0)
    );
    vec3 attenuation = max(
      0.5 -
      vec3(
        dot(localOrigin, localOrigin),
        dot(localCorners.xy, localCorners.xy),
        dot(localCorners.zw, localCorners.zw)
      ),
      0.0
    );
    attenuation *= attenuation;
    attenuation *= attenuation;

    vec3 gradients =
      2.0 * fract(permutation * constants.www) - 1.0;
    vec3 gradientHeight = abs(gradients) - 0.5;
    vec3 gradientBase = floor(gradients + 0.5);
    vec3 gradientX = gradients - gradientBase;
    attenuation *=
      1.79284291400159 -
      0.85373472095314 *
      (gradientX * gradientX + gradientHeight * gradientHeight);

    vec3 gradientDot;
    gradientDot.x =
      gradientX.x * localOrigin.x +
      gradientHeight.x * localOrigin.y;
    gradientDot.yz =
      gradientX.yz * localCorners.xz +
      gradientHeight.yz * localCorners.yw;

    return 130.0 * dot(attenuation, gradientDot);
  }

  float fbm(vec2 value) {
    float result = 0.0;
    float amplitude = 0.5;
    mat2 rotation = mat2(0.82, -0.57, 0.57, 0.82);

    for (int octave = 0; octave < 5; octave += 1) {
      result +=
        amplitude *
        (0.5 + 0.5 * simplexNoise(value));
      value =
        rotation *
        value *
        2.02 +
        vec2(8.73, -3.41);
      amplitude *= 0.5;
    }

    return result;
  }

  void main() {
    vec2 uv = vPortalUv;
    vec2 aspectPosition = vec2(
      (uv.x - 0.5) *
        ${(
          ABOUT_PORTAL_WIDTH / ABOUT_PORTAL_HEIGHT
        ).toFixed(4)},
      uv.y - 0.48
    );
    float reducedDetail =
      1.0 - uReducedMotion * 0.82;
    vec2 slowDrift = vec2(
      uTime * 0.016,
      -uTime * 0.022
    );
    float warpX = fbm(
      uv * vec2(1.18, 1.62) +
      slowDrift +
      vec2(2.31, -1.74)
    );
    float warpY = fbm(
      uv.yx * vec2(1.36, 1.08) -
      slowDrift * 0.76 +
      vec2(-6.18, 4.27)
    );
    vec2 warpedUv =
      uv +
      (vec2(warpX, warpY) - 0.5) *
      0.105 *
      reducedDetail;

    float deepClouds = fbm(
      warpedUv * vec2(1.42, 2.08) +
      vec2(
        -uTime * 0.009,
        uTime * 0.013
      )
    );
    float middleMist = fbm(
      warpedUv * vec2(2.18, 3.72) +
      vec2(
        uTime * 0.014,
        -uTime * 0.024
      ) +
      vec2(4.12, -7.84)
    );
    float currentNoise = simplexNoise(
      warpedUv * vec2(2.34, 3.06) +
      vec2(
        uTime * 0.012,
        -uTime * 0.031
      )
    );
    float currentWave =
      0.5 +
      0.5 *
      sin(
        warpedUv.y * 7.6 +
        warpedUv.x * 2.1 +
        currentNoise * 1.42 -
        uTime * 0.075
      );
    float mist =
      smoothstep(
        0.5,
        0.79,
        middleMist * 0.74 +
        currentWave * 0.26
      );
    float lightCurrent =
      smoothstep(0.67, 0.94, currentWave) *
      smoothstep(0.42, 0.78, middleMist);

    float fineField =
      0.5 +
      0.5 *
      simplexNoise(
        warpedUv * vec2(15.0, 21.0) +
        vec2(
          uTime * 0.018,
          -uTime * 0.026
        )
      );
    float fineMask = smoothstep(
      0.67,
      0.9,
      fbm(
        warpedUv * vec2(3.6, 5.2) +
        vec2(-3.7, 8.2)
      )
    );
    float fineLights =
      pow(fineField, 18.0) *
      fineMask *
      reducedDetail;

    float radialDepth =
      1.0 -
      smoothstep(
        0.18,
        0.68,
        length(aspectPosition * vec2(1.14, 0.84))
      );
    float sideDepth =
      smoothstep(
        0.015,
        0.24,
        min(uv.x, 1.0 - uv.x)
      );
    float floorDepth =
      smoothstep(0.015, 0.16, uv.y);

    vec3 deepNavy = vec3(0.008, 0.014, 0.058);
    vec3 midnightBlue = vec3(0.024, 0.062, 0.168);
    vec3 quietIndigo = vec3(0.071, 0.105, 0.274);
    vec3 mutedViolet = vec3(0.137, 0.091, 0.242);
    vec3 mistBlue = vec3(0.286, 0.416, 0.66);
    vec3 color = mix(
      deepNavy,
      midnightBlue,
      0.19 + deepClouds * 0.65
    );
    color = mix(
      color,
      quietIndigo,
      middleMist * 0.29
    );
    color = mix(
      color,
      mutedViolet,
      warpY * 0.16 +
      lightCurrent * 0.08
    );
    color +=
      mistBlue *
      (
        mist * 0.105 +
        lightCurrent * 0.085
      );
    color +=
      vec3(0.49, 0.61, 0.88) *
      fineLights *
      0.42;
    color +=
      quietIndigo *
      radialDepth *
      (0.035 + deepClouds * 0.055);
    color *=
      (0.56 + sideDepth * 0.44) *
      (0.68 + floorDepth * 0.32);

    gl_FragColor = vec4(color, 1.0);
  }
`

function createArchShape(width, springHeight) {
  const radius = width / 2
  const shape = new Shape()

  shape.moveTo(-radius, 0)
  shape.lineTo(radius, 0)
  shape.lineTo(radius, springHeight)
  shape.absarc(0, springHeight, radius, 0, Math.PI, false)
  shape.lineTo(-radius, 0)
  shape.closePath()

  return shape
}

function createArchHole(width, springHeight, bottomInset) {
  const radius = width / 2
  const hole = new Path()

  hole.moveTo(-radius, bottomInset)
  hole.lineTo(-radius, springHeight)
  hole.absarc(0, springHeight, radius, Math.PI, 0, true)
  hole.lineTo(radius, bottomInset)
  hole.lineTo(-radius, bottomInset)
  hole.closePath()

  return hole
}

function createPortalTitleTexture(title) {
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 256
  const context = canvas.getContext('2d')

  context.clearRect(0, 0, canvas.width, canvas.height)
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  const fontSize = Math.min(88, Math.max(66, 1250 / title.length))
  context.font = `600 ${fontSize}px Georgia`
  context.lineJoin = 'round'
  context.strokeStyle = 'rgb(31 43 83 / 92%)'
  context.lineWidth = 8
  context.shadowColor = 'rgb(135 164 235 / 78%)'
  context.shadowBlur = 26
  context.strokeText(title, 512, 128)
  context.fillStyle = '#eef3ff'
  context.fillText(title, 512, 128)

  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.minFilter = LinearFilter
  texture.magFilter = LinearFilter
  texture.anisotropy = 8
  texture.needsUpdate = true
  return texture
}

function PortalTitle({
  name,
  onActivate,
  onPointerOut,
  onPointerOver,
  title,
}) {
  const titleTexture = useMemo(
    () => createPortalTitleTexture(title),
    [title],
  )

  useEffect(() => () => titleTexture.dispose(), [titleTexture])

  return (
    <mesh
      name={name}
      position={[0, 2.05, 0.075]}
      onClick={(event) => {
        event.stopPropagation()
        onActivate(null)
      }}
      onPointerOut={onPointerOut}
      onPointerOver={onPointerOver}
    >
      <planeGeometry args={[2.15, 0.54]} />
      <meshBasicMaterial
        depthWrite={false}
        map={titleTexture}
        side={DoubleSide}
        toneMapped={false}
        transparent
      />
    </mesh>
  )
}

function PortalSurface({
  animationEnabled,
  geometry,
  onActivate,
  onPointerOut,
  onPointerOver,
  reducedMotionEnabled,
}) {
  const materialRef = useRef(null)
  const uniforms = useMemo(
    () => ({
      uReducedMotion: {
        value: 0,
      },
      uTime: { value: 0 },
    }),
    [],
  )

  useFrame((_, delta) => {
    if (!animationEnabled || !materialRef.current) {
      return
    }

    const motionScale = reducedMotionEnabled ? 0.05 : 1
    materialRef.current.uniforms.uReducedMotion.value =
      reducedMotionEnabled ? 1 : 0
    materialRef.current.uniforms.uTime.value +=
      delta * motionScale
  })

  return (
    <mesh
      geometry={geometry}
      position={[0, 0, -0.105]}
      onClick={(event) => {
        event.stopPropagation()
        onActivate(null)
      }}
      onPointerOut={onPointerOut}
      onPointerOver={onPointerOver}
    >
      <shaderMaterial
        ref={materialRef}
        depthWrite
        fragmentShader={PORTAL_FRAGMENT_SHADER}
        side={DoubleSide}
        uniforms={uniforms}
        vertexShader={PORTAL_VERTEX_SHADER}
      />
    </mesh>
  )
}

export function MagicalPortal({
  animationEnabled = true,
  ariaLabel,
  groupName,
  interactionEnabled = true,
  onActivate,
  position,
  reducedMotionEnabled,
  rotation = [0, 0, 0],
  title,
  titleName,
  triggerAttribute,
}) {
  const geometries = useMemo(() => {
    const surfaceShape = createArchShape(
      ABOUT_PORTAL_WIDTH,
      ABOUT_PORTAL_SPRING_HEIGHT,
    )
    const frameShape = createArchShape(
      ABOUT_PORTAL_FRAME_OUTER_WIDTH,
      ABOUT_PORTAL_FRAME_OUTER_SPRING_HEIGHT,
    )
    frameShape.holes.push(
      createArchHole(
        ABOUT_PORTAL_WIDTH,
        ABOUT_PORTAL_SPRING_HEIGHT,
        ABOUT_PORTAL_FRAME_WIDTH,
      ),
    )

    return {
      frame: new ExtrudeGeometry(frameShape, {
        bevelEnabled: false,
        curveSegments: 32,
        depth: ABOUT_PORTAL_DEPTH,
        steps: 1,
      }),
      surface: new ShapeGeometry(surfaceShape, 32),
    }
  }, [])

  useEffect(
    () => () => {
      geometries.frame.dispose()
      geometries.surface.dispose()
      document.body.style.cursor = ''
    },
    [geometries],
  )

  const handleActivate = useCallback(
    (trigger) => {
      if (interactionEnabled) {
        onActivate(trigger)
      }
    },
    [interactionEnabled, onActivate],
  )

  const handlePointerOver = useCallback(
    (event) => {
      if (!interactionEnabled) {
        return
      }

      event.stopPropagation()
      document.body.style.cursor = 'pointer'
    },
    [interactionEnabled],
  )

  const handlePointerOut = useCallback((event) => {
    event.stopPropagation()
    document.body.style.cursor = ''
  }, [])

  return (
    <group
      name={groupName}
      position={position}
      rotation={rotation}
    >
      <PortalSurface
        animationEnabled={animationEnabled}
        geometry={geometries.surface}
        onActivate={handleActivate}
        onPointerOut={handlePointerOut}
        onPointerOver={handlePointerOver}
        reducedMotionEnabled={reducedMotionEnabled}
      />

      <mesh
        geometry={geometries.frame}
        position={[0, 0, -0.12]}
        onClick={(event) => {
          event.stopPropagation()
          handleActivate(null)
        }}
        onPointerOut={handlePointerOut}
        onPointerOver={handlePointerOver}
      >
        <meshStandardMaterial
          color="#101522"
          emissive="#263a6c"
          emissiveIntensity={0.22}
          metalness={0.38}
          roughness={0.7}
        />
      </mesh>

      <PortalTitle
        name={titleName}
        onActivate={handleActivate}
        onPointerOut={handlePointerOut}
        onPointerOver={handlePointerOver}
        title={title}
      />

      {interactionEnabled && (
        <Html
          center
          distanceFactor={5.4}
          position={[0, 2.05, 0.19]}
          transform
          zIndexRange={[4, 2]}
        >
          <div className="about-portal-label">
            <button
              type="button"
              className="about-portal-trigger"
              {...{ [triggerAttribute]: true }}
              aria-label={ariaLabel}
              onClick={(event) => {
                event.stopPropagation()
                handleActivate(event.currentTarget)
              }}
            >
              <span className="sr-only">{ariaLabel}</span>
            </button>
          </div>
        </Html>
      )}
    </group>
  )
}

export function AboutPortal({
  animationEnabled = true,
  interactionEnabled = true,
  onActivate,
  reducedMotionEnabled,
}) {
  return (
    <MagicalPortal
      animationEnabled={animationEnabled}
      ariaLabel="Ouvrir A PROPOS DE MOI"
      groupName="about-me-portal"
      interactionEnabled={interactionEnabled}
      onActivate={onActivate}
      position={ABOUT_PORTAL_POSITION}
      reducedMotionEnabled={reducedMotionEnabled}
      title="A PROPOS DE MOI"
      titleName="about-portal-title"
      triggerAttribute="data-about-trigger"
    />
  )
}
