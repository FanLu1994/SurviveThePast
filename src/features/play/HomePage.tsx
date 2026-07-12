import { Link, useNavigate } from 'react-router-dom'
import { useGameStore } from '@/stores/game-store'

export function HomePage() {
  const navigate = useNavigate()
  const initialized = useGameStore((state) => state.initialized)
  const storageWarning = useGameStore((state) => state.storageWarning)
  const activeRun = useGameStore((state) => state.activeRun)
  const startNewRun = useGameStore((state) => state.startNewRun)
  const continueRun = useGameStore((state) => state.continueRun)

  const handleStart = () => {
    startNewRun()
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
        你在未知年代与身份中醒来。观察线索、形成判断、选择行动，在严谨历史背景下生存下来。
      </p>

      {!initialized && <p className="page-subtitle">正在读取本地存档…</p>}
      {storageWarning && <div className="warning-banner">{storageWarning}</div>}

      <div className="button-row">
        <button className="btn btn-primary" type="button" onClick={handleStart}>
          开始穿越
        </button>
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
    </main>
  )
}
