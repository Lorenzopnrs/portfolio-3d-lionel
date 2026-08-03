import { useEffect, useMemo, useState } from 'react'
import { CanvasTexture, SRGBColorSpace, TextureLoader } from 'three'

function createFallbackTexture({ color, height, label, width }) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')

  if (context) {
    context.fillStyle = color
    context.fillRect(0, 0, width, height)
    context.fillStyle = 'rgb(224 211 184 / 48%)'
    context.font = `600 ${Math.max(14, Math.round(width * 0.045))}px Georgia`
    context.textAlign = 'center'
    context.textBaseline = 'middle'
    context.fillText(label, width / 2, height / 2, width * 0.76)
  }

  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.name = `FallbackTexture:${label}`
  texture.needsUpdate = true
  return texture
}

export function useSafeTexture(
  url,
  {
    fallbackColor = '#302a24',
    fallbackHeight = 256,
    fallbackLabel = 'Asset unavailable',
    fallbackWidth = 256,
  } = {},
) {
  const fallbackTexture = useMemo(
    () =>
      createFallbackTexture({
        color: fallbackColor,
        height: fallbackHeight,
        label: fallbackLabel,
        width: fallbackWidth,
      }),
    [fallbackColor, fallbackHeight, fallbackLabel, fallbackWidth],
  )
  const [texture, setTexture] = useState(fallbackTexture)

  useEffect(() => {
    if (!url) {
      return undefined
    }

    let active = true
    let loadedTexture = null
    const loader = new TextureLoader()

    loader.load(
      url,
      (nextTexture) => {
        nextTexture.colorSpace = SRGBColorSpace
        nextTexture.needsUpdate = true
        loadedTexture = nextTexture

        if (active) {
          setTexture(nextTexture)
        } else {
          nextTexture.dispose()
        }
      },
      undefined,
      () => {
        if (active) {
          setTexture(fallbackTexture)
        }
      },
    )

    return () => {
      active = false
      loadedTexture?.dispose()
    }
  }, [fallbackTexture, url])

  useEffect(
    () => () => {
      fallbackTexture.dispose()
    },
    [fallbackTexture],
  )

  return texture
}
