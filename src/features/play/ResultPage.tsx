import { Link, Navigate, useNavigate } from 'react-router-dom'
import { getLevelById, getNextLevelId } from '@/game/scenario-loader'
import { useGameStore } from '@/stores/game-store'

export function ResultPage() {
  const navigate = useNavigate()
  const lastResult = useGameStore((state) => state.lastResult)
  const meta = useGameStore((state) => state.meta)
  const clearResult = useGameStore((state) => state.clearResult)
  const startNewRun = useGameStore((state) => state.startNewRun)

  if (!lastResult) {
    return <Navigate to="/" replace />
  }

  const cleared =
    lastResult.outcome === 'success' || lastResult.outcome === 'partial'
  const nextLevelId = getNextLevelId(lastResult.levelId)
  const nextLevel = nextLevelId ? getLevelById(nextLevelId) : null
  const nextUnlocked = nextLevelId
    ? meta.unlockedLevels.includes(nextLevelId)
    : false

  const handleReplay = () => {
    startNewRun(lastResult.levelId)
    navigate('/play')
  }

  const handleNext = () => {
    if (!nextLevelId || !nextUnlocked) return
    startNewRun(nextLevelId)
    navigate('/play')
  }

  return (
    <main className="page">
      <h1 className="page-title">本局结算</h1>
      <p className="page-subtitle">
        {lastResult.levelTitle}
        {cleared ? ' · 已通关' : ' · 未通关'}
      </p>

      <div className="result-grid">
        <section className="archive-card">
          <p>{lastResult.endingText}</p>
        </section>

        <section className="archive-card">
          <h3>推理评价</h3>
          <div className="result-metric">
            <span>断代准确度</span>
            <strong>{lastResult.periodAccuracy}%</strong>
          </div>
          <div className="result-metric">
            <span>地域判断准确度</span>
            <strong>{lastResult.regionAccuracy}%</strong>
          </div>
          <div className="result-metric">
            <span>身份还原度</span>
            <strong>{lastResult.identityAccuracy}%</strong>
          </div>
        </section>

        <section className="archive-card">
          <h3>你的判断</h3>
          <p>年代：{lastResult.playerHypothesis.period || '未填写'}</p>
          <p>地域：{lastResult.playerHypothesis.region || '未填写'}</p>
          <p>身份：{lastResult.playerHypothesis.identity || '未填写'}</p>
          <p>关系：{lastResult.playerHypothesis.relation || '未填写'}</p>
          <p>危机：{lastResult.playerHypothesis.crisis || '未填写'}</p>
        </section>

        <section className="archive-card">
          <h3>参考答案</h3>
          <p>年代：{lastResult.correctAnswers.period}</p>
          <p>地域：{lastResult.correctAnswers.region}</p>
        </section>
      </div>

      <section className="archive-card" style={{ marginTop: '1rem' }}>
        {cleared && nextLevel ? (
          <p>
            通关成功，下一关「<strong>{nextLevel.title}</strong>」
            {nextUnlocked ? '已开放。' : '即将开放。'}
          </p>
        ) : cleared && !nextLevel ? (
          <p>你已通关目前所有关卡，感谢游玩。</p>
        ) : (
          <p>本局未通关，下一关尚未开放。可重玩本关再行尝试。</p>
        )}
      </section>

      <div className="button-row" style={{ marginTop: '1.5rem' }}>
        {nextLevel && nextUnlocked && (
          <button
            className="btn btn-primary"
            type="button"
            onClick={handleNext}
          >
            进入下一关
          </button>
        )}
        <button
          className="btn btn-primary"
          type="button"
          onClick={handleReplay}
        >
          重玩本关
        </button>
        <Link className="btn" to="/archive" onClick={() => clearResult()}>
          查看史料图鉴
        </Link>
        <Link className="btn btn-ghost" to="/" onClick={() => clearResult()}>
          返回选关
        </Link>
      </div>
    </main>
  )
}
