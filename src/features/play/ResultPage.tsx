import { Link, Navigate } from 'react-router-dom'
import { useGameStore } from '@/stores/game-store'

export function ResultPage() {
  const lastResult = useGameStore((state) => state.lastResult)
  const clearResult = useGameStore((state) => state.clearResult)
  const startNewRun = useGameStore((state) => state.startNewRun)

  if (!lastResult) {
    return <Navigate to="/" replace />
  }

  return (
    <main className="page">
      <h1 className="page-title">本局结算</h1>
      <p className="page-subtitle">{lastResult.endingTitle}</p>

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

      <div className="button-row" style={{ marginTop: '1.5rem' }}>
        <button
          className="btn btn-primary"
          type="button"
          onClick={() => {
            clearResult()
            startNewRun()
            window.location.href = '/play'
          }}
        >
          再次穿越
        </button>
        <Link className="btn" to="/archive" onClick={() => clearResult()}>
          查看史料图鉴
        </Link>
        <Link className="btn btn-ghost" to="/" onClick={() => clearResult()}>
          返回首页
        </Link>
      </div>
    </main>
  )
}
