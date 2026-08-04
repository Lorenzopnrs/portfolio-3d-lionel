import { useEffect, useState } from 'react'
import { useProgress } from '@react-three/drei'

export function ExperienceLoader({ entranceReady }) {
  const { active, errors, progress } = useProgress()
  const [isMounted, setIsMounted] = useState(true)

  useEffect(() => {
    if (!entranceReady) {
      return undefined
    }

    const timeout = window.setTimeout(() => setIsMounted(false), 360)
    return () => window.clearTimeout(timeout)
  }, [entranceReady])

  if (!isMounted) {
    return null
  }

  const visibleProgress = entranceReady
    ? 100
    : Math.max(6, Math.min(active ? progress : 12, 96))

  return (
    <section
      className={`experience-loader${entranceReady ? ' is-complete' : ''}`}
      aria-busy={!entranceReady}
      aria-label="Chargement de l’expérience"
    >
      <div className="experience-loader-inner">
        <p className="experience-loader-kicker">La Bibliothèque des Mondes Inachevés</p>
        <h1>Ouverture du vestibule</h1>
        <p className="experience-loader-status" role="status" aria-live="polite">
          {errors.length > 0
            ? 'Les éléments essentiels sont prêts. Certains détails décoratifs seront remplacés.'
            : 'Les pierres, les lumières et les archives prennent place.'}
        </p>
        <progress
          aria-label="Progression du chargement du vestibule"
          max="100"
          value={visibleProgress}
        />
        <span className="experience-loader-value" aria-hidden="true">
          {Math.round(visibleProgress)}%
        </span>
      </div>
    </section>
  )
}
