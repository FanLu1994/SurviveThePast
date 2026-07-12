import { Link, Navigate, useNavigate } from 'react-router-dom'
import { getLevelById, getNextLevelId } from '@/game/scenario-loader'
import { useGameStore } from '@/stores/game-store'

const GRADE_LABELS = { A: 'A 级', B: 'B 级', C: 'C 级', D: 'D 级' } as const

export function ResultPage() {
  const navigate = useNavigate()
  const lastResult = useGameStore((state) => state.lastResult)
  const meta = useGameStore((state) => state.meta)
  const clearResult = useGameStore((state) => state.clearResult)
  const startNewRun = useGameStore((state) => state.startNewRun)

  if (!lastResult) {
    return <Navigate to="/" replace />
  }

  const level = getLevelById(lastResult.levelId)
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
        {cleared ? `${lastResult.levelTitle} · 已通关` : '未知时空 · 未通关'}
      </p>

      <div className="result-grid">
        <section className="archive-card">
          <h3>生存结果</h3>
          <p>{lastResult.endingText}</p>
          {cleared && lastResult.primarySurvival && (
            <>
              <p style={{ marginTop: '0.75rem' }}>
                <strong>主存活方式：</strong>
                {lastResult.primarySurvival}
              </p>
              {lastResult.secondarySurvival && (
                <p>
                  <strong>辅助方式：</strong>
                  {lastResult.secondarySurvival}
                </p>
              )}
              {lastResult.keyActions.length > 0 && (
                <ul style={{ marginTop: '0.5rem', paddingLeft: '1.25rem' }}>
                  {lastResult.keyActions.map((action) => (
                    <li key={action}>{action}</li>
                  ))}
                </ul>
              )}
            </>
          )}
        </section>

        {cleared && lastResult.identityBackground && (
          <section className="archive-card">
            <h3>身份背景</h3>
            <p>
              <strong>{lastResult.identityLabel}</strong>
            </p>
            <p>谋生：{lastResult.identityBackground.livelihood}</p>
            <p>社会位置：{lastResult.identityBackground.socialPosition}</p>
            <p>依附关系：{lastResult.identityBackground.affiliation}</p>
            <p>权利与限制：{lastResult.identityBackground.rightsAndLimits}</p>
            <p>暴露原因：{lastResult.identityBackground.exposureReason}</p>
          </section>
        )}

        {cleared && lastResult.historicalBackground && (
          <section className="archive-card">
            <h3>历史背景</h3>
            <p>{lastResult.historicalBackground}</p>
          </section>
        )}

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
          <h3>{cleared ? '参考答案' : '复盘提示'}</h3>
          {cleared ? (
            <>
              <p>年代：{lastResult.correctAnswers.period}</p>
              <p>地域：{lastResult.correctAnswers.region}</p>
            </>
          ) : (
            <p>重新核对已收集证据之间的支持与冲突关系，完整答案将在通关后揭示。</p>
          )}
        </section>
      </div>

      {cleared && lastResult.relatedSources.length > 0 && level && (
        <section className="archive-card" style={{ marginTop: '1rem' }}>
          <h3>本局关联史料</h3>
          <div className="archive-grid">
            {lastResult.relatedSources.map((entry) => {
              const source = level.sources.find((s) => s.id === entry.sourceId)
              if (!source) return null
              return (
                <article className="archive-card" key={entry.sourceId}>
                  <h4>
                    {source.title}
                    {entry.newlyUnlocked && (
                      <span
                        style={{
                          marginLeft: '0.5rem',
                          color: 'var(--color-text-muted)',
                          fontSize: '0.85rem',
                        }}
                      >
                        本局新增
                      </span>
                    )}
                  </h4>
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                    {GRADE_LABELS[source.grade]} ·{' '}
                    {source.factType === 'historical'
                      ? '史实'
                      : source.factType === 'inference'
                        ? '合理推演'
                        : '剧情虚构'}
                  </p>
                  <p>{source.summary}</p>
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                    支持：{source.supports}
                  </p>
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                    出处：{source.citation}（{source.locator}）
                  </p>
                </article>
              )
            })}
          </div>
        </section>
      )}

      <section className="archive-card" style={{ marginTop: '1rem' }}>
        {cleared && nextLevel ? (
          <p>通关成功，下一关{nextUnlocked ? '已开放。' : '即将开放。'}</p>
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
