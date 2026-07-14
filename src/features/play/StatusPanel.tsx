import { useGameStore } from '@/stores/game-store'
import type { RunState, StatKey } from '@/game/types'

export const STAT_LABELS: Record<StatKey, string> = {
  stamina: '体力',
  injury: '伤病',
  wealth: '财物',
  exposure: '暴露',
}

/** 预警阈值，可按手感微调 */
const STAT_THRESHOLDS = {
  stamina: { warnBelow: 25 },
  injury: { warnAbove: 70 },
  wealth: { warnBelow: 10 },
  exposure: { warnAbove: 70 },
} as const

const STAT_HINTS: Record<StatKey, string> = {
  stamina: '维持行动能力，耗尽即败',
  injury: '伤病积累，满则败',
  wealth: '交易与落脚资源',
  exposure: '身份嫌疑，满则败',
}

type StatLevel = 'normal' | 'warn' | 'critical'

function getStatLevel(key: StatKey, value: number): StatLevel {
  switch (key) {
    case 'stamina':
      if (value <= 0) return 'critical'
      if (value < STAT_THRESHOLDS.stamina.warnBelow) return 'warn'
      return 'normal'
    case 'injury':
      if (value >= 100) return 'critical'
      if (value > STAT_THRESHOLDS.injury.warnAbove) return 'warn'
      return 'normal'
    case 'wealth':
      if (value < STAT_THRESHOLDS.wealth.warnBelow) return 'warn'
      return 'normal'
    case 'exposure':
      if (value >= 100) return 'critical'
      if (value > STAT_THRESHOLDS.exposure.warnAbove) return 'warn'
      return 'normal'
  }
}

function getBarColor(key: StatKey, level: StatLevel): string {
  if (level !== 'normal') return 'var(--color-danger)'
  if (key === 'exposure' || key === 'injury') return 'var(--color-danger)'
  return 'var(--color-accent)'
}

function formatDelta(delta: number): string {
  return delta > 0 ? `+${delta}` : `${delta}`
}

interface StatusPanelProps {
  run: RunState
}

export function StatusPanel({ run }: StatusPanelProps) {
  const lastStatDelta = useGameStore((state) => state.lastStatDelta)
  const reducedMotion = useGameStore((state) => state.settings.reducedMotion)
  const stats = Object.entries(STAT_LABELS) as Array<[StatKey, string]>

  return (
    <section className="sidebar-section">
      <h3>生存状态</h3>
      <div className="stat-grid">
        {stats.map(([key, label]) => {
          const value = run.stats[key]
          const level = getStatLevel(key, value)
          const delta = lastStatDelta?.deltas[key]
          const rowClass = [
            'stat-row',
            level !== 'normal' ? `stat-row-${level}` : '',
            delta !== undefined ? 'stat-row-changed' : '',
            delta !== undefined && !reducedMotion ? 'stat-row-flash' : '',
          ]
            .filter(Boolean)
            .join(' ')

          return (
            <div className={rowClass} key={key} title={STAT_HINTS[key]}>
              <span className="stat-label">
                {label}
                {level !== 'normal' && (
                  <span className="stat-danger-tag">{level === 'critical' ? '危急' : '危险'}</span>
                )}
              </span>
              <div className={`stat-bar${level !== 'normal' && !reducedMotion ? ' stat-bar-pulse' : ''}`}>
                <div
                  className="stat-bar-fill"
                  style={{
                    width: `${Math.max(0, Math.min(100, value))}%`,
                    background: getBarColor(key, level),
                  }}
                />
              </div>
              <span className="stat-value">
                {value}
                {delta !== undefined && (
                  <span
                    className={`stat-delta-badge${delta > 0 ? ' stat-delta-positive' : ' stat-delta-negative'}`}
                  >
                    {formatDelta(delta)}
                  </span>
                )}
              </span>
              <p className="stat-hint">{STAT_HINTS[key]}</p>
            </div>
          )
        })}
      </div>
    </section>
  )
}
