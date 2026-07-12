import { Link } from 'react-router-dom'
import { getArchiveSources } from '@/game/scenario-loader'
import { useGameStore } from '@/stores/game-store'

export function ArchivePage() {
  const meta = useGameStore((state) => state.meta)
  const sources = getArchiveSources()

  return (
    <main className="page">
      <h1 className="page-title">史料图鉴</h1>
      <p className="page-subtitle">
        完成关卡后解锁史料来源。此处展示史实、合理推演与剧情虚构的边界。
      </p>

      <div className="archive-grid">
        {sources.map((source) => {
          const unlocked = meta.unlockedSources.includes(source.id)
          const revealed =
            unlocked && meta.completedLevels.includes(source.levelId)
          return (
            <article className="archive-card" key={source.id}>
              <h3>{revealed ? source.title : '未解锁史料'}</h3>
              <p style={{ color: 'var(--color-text-muted)' }}>
                {revealed ? (
                  <>
                    {source.levelTitle} ·{' '}
                    {source.factType === 'historical'
                      ? '史实'
                      : source.factType === 'inference'
                        ? '合理推演'
                        : '剧情虚构'}
                  </>
                ) : (
                  '来源关卡未知'
                )}
              </p>
              {revealed ? (
                <>
                  <p>{source.summary}</p>
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                    出处：{source.citation}
                  </p>
                </>
              ) : (
                <p style={{ color: 'var(--color-text-muted)' }}>尚未解锁</p>
              )}
            </article>
          )
        })}
      </div>

      <div className="button-row" style={{ marginTop: '1.5rem' }}>
        <Link className="btn btn-primary" to="/">
          返回首页
        </Link>
      </div>
    </main>
  )
}
