import { useEffect } from 'react'
import { STAT_LABELS } from '@/features/play/StatusPanel'
import { useGameStore } from '@/stores/game-store'
import type { StatKey } from '@/game/types'

const STAT_ORDER: StatKey[] = ['stamina', 'injury', 'wealth', 'exposure']

function formatDelta(delta: number): string {
  return delta > 0 ? `+${delta}` : `${delta}`
}

export function StatDeltaToast() {
  const lastStatDelta = useGameStore((state) => state.lastStatDelta)
  const reducedMotion = useGameStore((state) => state.settings.reducedMotion)
  const clearStatDelta = useGameStore((state) => state.clearStatDelta)

  useEffect(() => {
    if (!lastStatDelta) return

    const duration = reducedMotion ? 2000 : 2600
    const timer = window.setTimeout(() => clearStatDelta(), duration)
    return () => window.clearTimeout(timer)
  }, [lastStatDelta, reducedMotion, clearStatDelta])

  if (!lastStatDelta) return null

  const parts = STAT_ORDER.filter((key) => lastStatDelta.deltas[key] !== undefined).map(
    (key) => `${STAT_LABELS[key]} ${formatDelta(lastStatDelta.deltas[key]!)}`,
  )

  if (parts.length === 0) return null

  return (
    <div
      key={lastStatDelta.seq}
      className={`stat-delta-toast${reducedMotion ? ' stat-delta-toast-static' : ''}`}
      role="status"
      aria-live="polite"
    >
      {parts.join(' · ')}
    </div>
  )
}
