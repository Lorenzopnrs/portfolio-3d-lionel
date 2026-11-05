import { useEffect, useRef } from 'react'
import { useProgress } from '@react-three/drei'
import { useThree } from '@react-three/fiber'

const IDLE_POLL_MS = 60
const IDLE_POLLS_REQUIRED = 3
const CONTENT_TIMEOUT_MS = 8000
const COMPILE_TIMEOUT_MS = 20000

function waitForLateContent(contentSettledRef) {
  return new Promise((resolve) => {
    const startedAt = performance.now()
    let idlePolls = 0

    const poll = () => {
      const idle =
        contentSettledRef.current && !useProgress.getState().active
      idlePolls = idle ? idlePolls + 1 : 0

      if (
        idlePolls >= IDLE_POLLS_REQUIRED ||
        performance.now() - startedAt > CONTENT_TIMEOUT_MS
      ) {
        resolve()
        return
      }

      window.setTimeout(poll, IDLE_POLL_MS)
    }

    poll()
  })
}

// Draws everything once, on a single pixel, so hidden rooms already have their
// textures and geometry on the GPU when the visitor reaches them.
function uploadHiddenSections(gl, scene, camera) {
  const hiddenObjects = []
  const culledObjects = []

  scene.traverse((object) => {
    if (!object.visible) {
      hiddenObjects.push(object)
      object.visible = true
    }

    if (object.frustumCulled) {
      culledObjects.push(object)
      object.frustumCulled = false
    }
  })

  gl.setScissorTest(true)
  gl.setScissor(0, 0, 1, 1)
  gl.render(scene, camera)
  gl.setScissorTest(false)

  hiddenObjects.forEach((object) => {
    object.visible = false
  })
  culledObjects.forEach((object) => {
    object.frustumCulled = true
  })
}

// Mounted beside the rooms under one Suspense boundary, so this only runs once
// every model is decoded. The loading screen stays up until it calls onReady.
export function SceneWarmup({ contentSettled, onReady }) {
  const advance = useThree((state) => state.advance)
  const camera = useThree((state) => state.camera)
  const gl = useThree((state) => state.gl)
  const scene = useThree((state) => state.scene)
  const contentSettledRef = useRef(contentSettled)

  useEffect(() => {
    contentSettledRef.current = contentSettled
  }, [contentSettled])

  useEffect(() => {
    let cancelled = false

    async function warmUp() {
      await waitForLateContent(contentSettledRef)

      if (cancelled) {
        return
      }

      // A hung compilation must never trap the visitor on the loading screen.
      await Promise.race([
        gl.compileAsync(scene, camera),
        new Promise((resolve) => {
          window.setTimeout(resolve, COMPILE_TIMEOUT_MS)
        }),
      ])

      if (cancelled) {
        return
      }

      advance(0)
      uploadHiddenSections(gl, scene, camera)
      onReady()
    }

    warmUp()

    return () => {
      cancelled = true
    }
  }, [advance, camera, gl, onReady, scene])

  return null
}
