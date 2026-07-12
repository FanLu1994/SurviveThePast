import type { RunState, StatKey } from '@/game/types'

const STAT_LABELS: Record<StatKey, string> = {
  stamina: '体力',
  injury: '伤病',
  wealth: '财物',
  exposure: '暴露',
}

interface StatusPanelProps {
  run: RunState
}

export function StatusPanel({ run }: StatusPanelProps) {
  const stats = Object.entries(STAT_LABELS) as Array<[StatKey, string]>

  return (
    <section className="sidebar-section">
      <h3>生存状态</h3>
      <div className="stat-grid">
        {stats.map(([key, label]) => (
          <div className="stat-row" key={key}>
            <span>{label}</span>
            <div className="stat-bar">
              <div
                className="stat-bar-fill"
                style={{
                  width: `${Math.max(0, Math.min(100, run.stats[key]))}%`,
                  background:
                    key === 'exposure' || key === 'injury'
                      ? 'var(--color-danger)'
                      : 'var(--color-accent)',
                }}
              />
            </div>
            <span>{run.stats[key]}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
