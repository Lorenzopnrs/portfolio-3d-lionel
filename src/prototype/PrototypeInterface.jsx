import { EVALUATION_STOPS } from './cameraPath'

export function PrototypeInterface({
  activeStopIndex,
  progress,
  reducedMotionEnabled,
  onReducedMotionChange,
  onMoveBackward,
  onMoveForward,
}) {
  const activeStop =
    activeStopIndex === null
      ? null
      : EVALUATION_STOPS[activeStopIndex].label
  const pathPosition = Math.round(progress * 100)

  return (
    <>
      <header className="prototype-header">
        <p className="prototype-kicker">Architectural blockout</p>
        <h1 className="prototype-title">Abbey route study</h1>
        <p className="prototype-status">
          <span
            className={`status-marker${activeStop ? ' is-active' : ''}`}
            aria-hidden="true"
          />
          {activeStop ?? `Path position ${pathPosition}%`}
        </p>
      </header>

      <section className="prototype-controls" aria-label="Movement controls">
        <p className="control-hint" aria-hidden="true">
          <span className="wheel-symbol" />
          Scroll or use arrow keys
        </p>

        <div className="control-dock">
          <div className="direction-controls">
            <button
              type="button"
              className="direction-button"
              onClick={onMoveBackward}
              aria-label="Move backward"
              title="Move backward"
            >
              ↑
            </button>
            <button
              type="button"
              className="direction-button"
              onClick={onMoveForward}
              aria-label="Move forward"
              title="Move forward"
            >
              ↓
            </button>
          </div>

          <span className="dock-divider" aria-hidden="true" />

          <label className="motion-toggle">
            <input
              type="checkbox"
              aria-label="Reduced motion"
              checked={reducedMotionEnabled}
              onChange={(event) =>
                onReducedMotionChange(event.target.checked)
              }
            />
            <span className="toggle-track" aria-hidden="true" />
            <span>
              <span className="motion-label-full">Reduced motion</span>
              <span className="motion-label-short">Reduce</span>
            </span>
          </label>
        </div>
      </section>
    </>
  )
}
