import type { EvidenceMark, LevelPack, RunState } from '@/game/types'
import { useGameStore } from '@/stores/game-store'

const MARK_LABELS: Record<EvidenceMark, string> = {
  support: '支持',
  conflict: '冲突',
  doubt: '存疑',
  unmarked: '未标记',
}

interface EvidencePanelProps {
  level: LevelPack
  run: RunState
  onClose: () => void
}

export function EvidencePanel({ level, run, onClose }: EvidencePanelProps) {
  const markEvidenceAction = useGameStore((state) => state.markEvidenceAction)

  const discovered = run.evidence
    .filter((item) => item.discovered)
    .map((item) => {
      const def = level.evidence.find((evidence) => evidence.id === item.evidenceId)
      return { ...item, def }
    })
    .filter((item) => item.def)

  return (
    <div className="evidence-drawer" onClick={onClose}>
      <div className="evidence-drawer-panel" onClick={(event) => event.stopPropagation()}>
        <div className="button-row" style={{ justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0 }}>证据板</h2>
          <button className="btn" type="button" onClick={onClose}>
            关闭
          </button>
        </div>

        {discovered.length === 0 && (
          <p className="page-subtitle">尚未发现证据。继续推进剧情以收集线索。</p>
        )}

        {discovered.map((item) => (
          <article className="evidence-item" key={item.evidenceId}>
            <strong>{item.def!.title}</strong>
            <div className="evidence-meta">
              {item.def!.category} ·{' '}
              {item.def!.strength === 'strong'
                ? '强证据'
                : item.def!.strength === 'weak'
                  ? '弱证据'
                  : '误导信息'}
            </div>
            <p>{item.def!.description}</p>
            <div className="mark-row">
              {(['support', 'conflict', 'doubt'] as EvidenceMark[]).map((mark) => (
                <button
                  key={mark}
                  className="btn"
                  type="button"
                  onClick={() => markEvidenceAction(item.evidenceId, mark)}
                >
                  {MARK_LABELS[mark]}
                  {item.mark === mark ? ' ✓' : ''}
                </button>
              ))}
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
