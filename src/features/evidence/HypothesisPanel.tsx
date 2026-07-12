import { useGameStore } from '@/stores/game-store'

export function HypothesisPanel() {
  const activeRun = useGameStore((state) => state.activeRun)
  const setHypothesis = useGameStore((state) => state.setHypothesis)
  const submitHypothesisAction = useGameStore((state) => state.submitHypothesisAction)

  if (!activeRun) return null

  const hypothesis = activeRun.hypothesis

  return (
    <section className="sidebar-section">
      <h3>当前假设</h3>
      <form
        className="hypothesis-form"
        onSubmit={(event) => {
          event.preventDefault()
          submitHypothesisAction()
        }}
      >
        <label>
          大致年代
          <input
            value={hypothesis.period}
            onChange={(event) =>
              setHypothesis({ ...hypothesis, period: event.target.value })
            }
            placeholder="如：东汉末年"
          />
        </label>
        <label>
          所处地域
          <input
            value={hypothesis.region}
            onChange={(event) =>
              setHypothesis({ ...hypothesis, region: event.target.value })
            }
            placeholder="如：兖州"
          />
        </label>
        <label>
          自身身份
          <input
            value={hypothesis.identity}
            onChange={(event) =>
              setHypothesis({ ...hypothesis, identity: event.target.value })
            }
            placeholder="如：传递文书的行人"
          />
        </label>
        <label>
          与关键人物关系
          <input
            value={hypothesis.relation}
            onChange={(event) =>
              setHypothesis({ ...hypothesis, relation: event.target.value })
            }
            placeholder="如：无里证明的过路者"
          />
        </label>
        <label>
          当前危机
          <textarea
            value={hypothesis.crisis}
            onChange={(event) =>
              setHypothesis({ ...hypothesis, crisis: event.target.value })
            }
            placeholder="如：缺少凭证，无法通过查验"
            rows={3}
          />
        </label>
        <button className="btn btn-primary" type="submit">
          {activeRun.hypothesisSubmitted ? '更新假设' : '提交假设'}
        </button>
      </form>
    </section>
  )
}
