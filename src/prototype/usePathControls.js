import { useEffect } from 'react'
import { installPathControls } from './pathControlState'

export function usePathControls(movementRef) {
  useEffect(() => installPathControls(window, movementRef), [movementRef])
}
