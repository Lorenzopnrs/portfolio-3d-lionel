import { useEffect, useMemo } from 'react'
import {
  BOOK_FRAME_PLACEMENTS,
  BOOK_POSTER_HEIGHT,
  BOOK_POSTER_WIDTH,
  createOrnateFrameGeometry,
  createOrnateFrameMaterial,
} from './ornateFrame.js'

function ignoreRaycast() {}

export function OrnateBookFrames() {
  const geometry = useMemo(
    () =>
      createOrnateFrameGeometry(BOOK_POSTER_WIDTH, BOOK_POSTER_HEIGHT),
    [],
  )
  const material = useMemo(() => createOrnateFrameMaterial(), [])

  useEffect(
    () => () => {
      geometry.dispose()
      material.dispose()
    },
    [geometry, material],
  )

  return BOOK_FRAME_PLACEMENTS.map(({ normalX, position }) => (
    <mesh
      key={position[2]}
      geometry={geometry}
      material={material}
      name="BookOrnateFrame"
      position={position}
      raycast={ignoreRaycast}
      receiveShadow
      rotation={[0, (normalX * Math.PI) / 2, 0]}
    />
  ))
}
