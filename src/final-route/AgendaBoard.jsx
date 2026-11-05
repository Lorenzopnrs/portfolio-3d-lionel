import { useEffect, useMemo, useState } from 'react'
import { Html } from '@react-three/drei'
import { CanvasTexture, SRGBColorSpace } from 'three'
import {
  formatEventDates,
  formatEventPlace,
  formatEventTime,
} from '../content/agenda.js'
import {
  createOrnateFrameGeometry,
  createOrnateFrameMaterial,
} from './ornateFrame.js'

// On the wall facing the phone, in the social networks wing.
const BOARD_POSITION = Object.freeze([-5.91, 1.62, -18.15])
const BOARD_ROTATION = Object.freeze([0, -Math.PI / 2, 0])
const BOARD_WIDTH = 0.96
const BOARD_HEIGHT = 1.46
const FRAME_SCALE = 0.56
const CANVAS_WIDTH = 720
const CANVAS_HEIGHT = 1098
const VISIBLE_EVENT_COUNT = 4
const SERIF = 'Georgia, "Times New Roman", serif'
// A few dates get all the room; a fuller agenda tightens up.
const ROOMY_TYPE = Object.freeze({
  date: [44, 54],
  detail: [38, 48],
  divider: true,
  gap: 150,
  title: [50, 60],
})
const COMPACT_TYPE = Object.freeze({
  date: [33, 40],
  detail: [30, 36],
  divider: false,
  gap: 42,
  title: [37, 44],
})
const TEXT_WIDTH = 580
const EVENTS_TOP = 200
const EVENTS_BOTTOM = 1000

function drawWrapped(
  context,
  text,
  x,
  y,
  [fontLineHeight, maximumLines],
  draw,
) {
  const lines = []
  let line = ''

  text.split(' ').forEach((word) => {
    const candidate = line ? `${line} ${word}` : word

    if (line && context.measureText(candidate).width > TEXT_WIDTH) {
      lines.push(line)
      line = word
    } else {
      line = candidate
    }
  })

  if (line) {
    lines.push(line)
  }

  if (draw) {
    lines.slice(0, maximumLines).forEach((visibleLine, index) => {
      const cutShort = index === maximumLines - 1 && lines.length > maximumLines

      context.fillText(
        cutShort ? `${visibleLine}…` : visibleLine,
        x,
        y + index * fontLineHeight,
      )
    })
  }

  return y + Math.min(lines.length, maximumLines) * fontLineHeight
}

function drawDivider(context, x, y) {
  context.fillStyle = '#7a5a2c'
  context.fillRect(x - 74, y - 1, 148, 2)
  context.save()
  context.translate(x, y)
  context.rotate(Math.PI / 4)
  context.fillRect(-7, -7, 14, 14)
  context.restore()
}

function drawEvents(context, events, top, type, draw) {
  const x = CANVAS_WIDTH / 2
  let y = top

  events.forEach((event, index) => {
    if (index > 0) {
      if (draw && type.divider) {
        drawDivider(
          context,
          x,
          y + (type.gap - type.detail[1] * 0.75 - type.date[0] * 0.8) / 2,
        )
      }

      y += type.gap
    }

    const detail = [formatEventPlace(event), formatEventTime(event.time)]
      .filter(Boolean)
      .join(' · ')

    context.fillStyle = '#7a3f12'
    context.font = `700 ${type.date[0]}px ${SERIF}`
    y = drawWrapped(context, formatEventDates(event), x, y, [type.date[1], 2], draw)
    context.fillStyle = '#2c1c0d'
    context.font = `600 ${type.title[0]}px ${SERIF}`
    y = drawWrapped(context, event.title, x, y + 4, [type.title[1], 2], draw)
    context.fillStyle = '#4a3218'
    context.font = `italic 500 ${type.detail[0]}px ${SERIF}`
    y = drawWrapped(context, detail, x, y + 2, [type.detail[1], 2], draw)
  })

  return y
}

function drawBoard(canvas, events) {
  const context = canvas.getContext('2d')
  const { height, width } = canvas
  const parchment = context.createLinearGradient(0, 0, width, height)

  parchment.addColorStop(0, '#d8c497')
  parchment.addColorStop(0.5, '#cdb785')
  parchment.addColorStop(1, '#bfa672')
  context.fillStyle = parchment
  context.fillRect(0, 0, width, height)
  context.strokeStyle = 'rgb(96 66 30 / 55%)'
  context.lineWidth = 4
  context.strokeRect(34, 34, width - 68, height - 68)

  context.textAlign = 'center'
  context.textBaseline = 'alphabetic'
  context.fillStyle = '#3d2813'
  context.font = `700 76px ${SERIF}`
  context.fillText('AGENDA', width / 2, 138)
  context.fillStyle = '#7a5a2c'
  context.fillRect(width / 2 - 110, 166, 220, 4)

  if (events.length === 0) {
    context.fillStyle = '#4a3218'
    context.font = `italic 500 44px ${SERIF}`
    context.fillText('Prochaines dates', width / 2, height / 2 - 30)
    context.fillText('à venir', width / 2, height / 2 + 30)
    return
  }

  const visibleEvents = events.slice(0, VISIBLE_EVENT_COUNT)
  const type = visibleEvents.length <= 2 ? ROOMY_TYPE : COMPACT_TYPE
  const blockHeight = drawEvents(context, visibleEvents, 0, type, false)

  drawEvents(
    context,
    visibleEvents,
    (EVENTS_TOP + EVENTS_BOTTOM - blockHeight) / 2 + type.date[0] * 0.8,
    type,
    true,
  )

  if (events.length > VISIBLE_EVENT_COUNT) {
    const hiddenCount = events.length - VISIBLE_EVENT_COUNT

    context.fillStyle = '#7a3f12'
    context.font = `italic 500 30px ${SERIF}`
    context.fillText(
      `+ ${hiddenCount} ${hiddenCount > 1 ? 'autres dates' : 'autre date'}`,
      width / 2,
      height - 66,
    )
  }
}

export function AgendaBoard({ events, interactionEnabled, onOpen }) {
  const [hovered, setHovered] = useState(false)
  const active = interactionEnabled && hovered
  const frameGeometry = useMemo(
    () =>
      createOrnateFrameGeometry(BOARD_WIDTH, BOARD_HEIGHT, {
        arch: 0,
        scale: FRAME_SCALE,
      }),
    [],
  )
  const frameMaterial = useMemo(() => createOrnateFrameMaterial(), [])
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = CANVAS_WIDTH
    canvas.height = CANVAS_HEIGHT
    drawBoard(canvas, events)

    const boardTexture = new CanvasTexture(canvas)
    boardTexture.colorSpace = SRGBColorSpace
    boardTexture.anisotropy = 8
    return boardTexture
  }, [events])

  useEffect(
    () => () => {
      frameGeometry.dispose()
      frameMaterial.dispose()
    },
    [frameGeometry, frameMaterial],
  )

  useEffect(() => () => texture.dispose(), [texture])

  useEffect(() => {
    if (!active) {
      return undefined
    }

    document.body.style.cursor = 'pointer'

    return () => {
      document.body.style.cursor = ''
    }
  }, [active])

  return (
    <group
      name="agenda-board"
      position={BOARD_POSITION}
      rotation={BOARD_ROTATION}
    >
      <mesh
        geometry={frameGeometry}
        material={frameMaterial}
        raycast={() => {}}
        receiveShadow
      />
      <mesh
        receiveShadow
        onClick={(event) => {
          if (interactionEnabled) {
            event.stopPropagation()
            onOpen(null)
          }
        }}
        onPointerOut={() => setHovered(false)}
        onPointerOver={(event) => {
          if (interactionEnabled) {
            event.stopPropagation()
            setHovered(true)
          }
        }}
      >
        <planeGeometry args={[BOARD_WIDTH, BOARD_HEIGHT]} />
        <meshStandardMaterial
          emissive="#ffffff"
          emissiveIntensity={active ? 0.16 : 0.05}
          emissiveMap={texture}
          map={texture}
          roughness={0.9}
        />
      </mesh>
      {active && (
        <Html
          center
          position={[0, BOARD_HEIGHT / 2 + 0.14, 0.05]}
          zIndexRange={[3, 1]}
        >
          <div className="library-book-label" aria-hidden="true">
            <strong>Ouvrir l’agenda</strong>
            <small>Toutes les dates et les lieux</small>
          </div>
        </Html>
      )}
    </group>
  )
}
