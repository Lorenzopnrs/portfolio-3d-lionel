import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import {
  getHigherQuality,
  getLowerQuality,
} from './qualitySettings'

const SAMPLE_WINDOW_SECONDS = 2
const DEGRADE_AFTER_SECONDS = 6
const RECOVER_AFTER_SECONDS = 18

function getFrameReport(frameTimes, gl) {
  const sortedFrameTimes = [...frameTimes].sort((a, b) => a - b)
  const percentileIndex = Math.min(
    sortedFrameTimes.length - 1,
    Math.floor(sortedFrameTimes.length * 0.95),
  )
  const averageFrameTime =
    frameTimes.reduce((total, frameTime) => total + frameTime, 0) /
    frameTimes.length

  return {
    averageFrameTime: Number(averageFrameTime.toFixed(2)),
    calls: gl.info.render.calls,
    fps: Number((1000 / averageFrameTime).toFixed(1)),
    geometries: gl.info.memory.geometries,
    lines: gl.info.render.lines,
    p95FrameTime: Number(sortedFrameTimes[percentileIndex].toFixed(2)),
    points: gl.info.render.points,
    programs: gl.info.programs?.length ?? 0,
    textures: gl.info.memory.textures,
    triangles: gl.info.render.triangles,
  }
}

function isPerformanceSlow(report, qualityLevel) {
  if (qualityLevel === 'high') {
    return report.averageFrameTime > 22 || report.p95FrameTime > 30
  }

  return report.averageFrameTime > 28 || report.p95FrameTime > 38
}

function isPerformanceStable(report) {
  return report.averageFrameTime < 15.8 && report.p95FrameTime < 19.5
}

export function PerformanceController({
  interactionLocked,
  onAutomaticQualityChange,
  onMetrics,
  qualityLevel,
  qualityPreference,
}) {
  const sampleRef = useRef({
    elapsed: 0,
    fastDuration: 0,
    frameTimes: [],
    slowDuration: 0,
  })

  useEffect(() => {
    sampleRef.current = {
      elapsed: 0,
      fastDuration: 0,
      frameTimes: [],
      slowDuration: 0,
    }
  }, [qualityLevel, qualityPreference])

  useFrame(({ gl }, delta) => {
    if (document.hidden || delta <= 0 || delta > 0.25) {
      return
    }

    const sample = sampleRef.current
    sample.elapsed += delta
    sample.frameTimes.push(delta * 1000)

    if (sample.elapsed < SAMPLE_WINDOW_SECONDS) {
      return
    }

    const report = getFrameReport(sample.frameTimes, gl)
    onMetrics?.(report)

    if (qualityPreference === 'automatic' && !interactionLocked) {
      if (isPerformanceSlow(report, qualityLevel)) {
        sample.slowDuration += sample.elapsed
        sample.fastDuration = 0
      } else if (isPerformanceStable(report)) {
        sample.fastDuration += sample.elapsed
        sample.slowDuration = 0
      } else {
        sample.fastDuration = 0
        sample.slowDuration = 0
      }

      if (
        sample.slowDuration >= DEGRADE_AFTER_SECONDS &&
        qualityLevel !== 'low'
      ) {
        onAutomaticQualityChange(getLowerQuality(qualityLevel))
      } else if (
        sample.fastDuration >= RECOVER_AFTER_SECONDS &&
        qualityLevel !== 'high'
      ) {
        onAutomaticQualityChange(getHigherQuality(qualityLevel))
      }
    }

    sample.elapsed = 0
    sample.frameTimes = []
  })

  return null
}
