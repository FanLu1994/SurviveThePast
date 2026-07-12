import { Link, useNavigate } from 'react-router-dom'
import { getAllLevels } from '@/game/scenario-loader'
import { useGameStore } from '@/stores/game-store'

export function HomePage() {
  const navigate = useNavigate()
  const initialized = useGameStore((state) => state.initialized)
  const storageWarning = useGameStore((state) => state.storageWarning)
  const activeRun = useGameStore((state) => state.activeRun)
  const meta = useGameStore((state) => state.meta)
  const startNewRun = useGameStore((state) => state.startNewRun)
  const continueRun = useGameStore((state) => state.continueRun)

  const levels = getAllLevels()

  const handleStart = (levelId: string) => {
    startNewRun(levelId)
    navigate('/play')
  }

  const handleContinue = () => {
    if (continueRun()) {
      navigate('/play')
    }
  }

  return (
    <main className="page">
      <h1 className="page-title">穿越失败</h1>
      <p className="page-subtitle">
        逐关穿越历史现场。观察线索、形成判断、选择行动，在严谨历史背景下生存下来。通关一关后才会开放后续关卡。
      </p>

      {!initialized && <p className="page-subtitle">正在读取本地存档…</p>}
      {storageWarning && <div className="warning-banner">{storageWarning}</div>}

      <div className="button-row">
        <button
          className="btn"
          type="button"
          onClick={handleContinue}
          disabled={!activeRun || activeRun.isComplete}
        >
          继续游戏
        </button>
        <Link className="btn btn-ghost" to="/archive">
          史料图鉴
        </Link>
        <Link className="btn btn-ghost" to="/settings">
          设置
        </Link>
      </div>

      <h2 className="page-section-title">选择关卡</h2>
      <div className="archive-grid">
        {levels.map((level, index) => {
          const unlocked = meta.unlockedLevels.includes(level.id)
          const completed = meta.completedLevels.includes(level.id)
          return (
            <article className="archive-card level-card" key={level.id}>
              <div className="level-card-info">
                <h3>
                  第 {index + 1} 关 · {level.title}
                </h3>
                <p style={{ color: 'var(--color-text-muted)' }}>
                  {level.eraLabel} · {level.year} 年 · {level.regionLabel}
                </p>
              </div>
              <div className="level-card-action">
                {completed && <span className="level-badge level-badge-done">已通关</span>}
                {unlocked ? (
                  <button
                    className="btn btn-primary"
                    type="button"
                    onClick={() => handleStart(level.id)}
                  >
                    进入
                  </button>
                ) : (
                  <span className="level-badge level-badge-locked">未解锁</span>
                )}
              </div>
            </article>
          )
        })}
      </div>
    </main>
  )
}
