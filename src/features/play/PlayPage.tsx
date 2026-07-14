import { Link, Navigate, useNavigate } from 'react-router-dom'
import { getBackgroundImageUrl } from '@/game/background-assets'
import { getAvailableChoices, getSceneNode } from '@/game/engine'
import { getLevelById, getLevelIndex } from '@/game/scenario-loader'
import { StatDeltaToast } from '@/features/play/StatDeltaToast'
import { StatusPanel } from '@/features/play/StatusPanel'
import { useGameStore } from '@/stores/game-store'
import type { CSSProperties } from 'react'

export function PlayPage() {
  const navigate = useNavigate()
  const activeRun = useGameStore((state) => state.activeRun)
  const choose = useGameStore((state) => state.choose)
  const sidebarOpen = useGameStore((state) => state.sidebarOpen)
  const toggleSidebar = useGameStore((state) => state.toggleSidebar)

  if (!activeRun) {
    return <Navigate to="/" replace />
  }

  if (!activeRun.crossingDone) {
    return <Navigate to="/crossing" replace />
  }

  if (activeRun.isComplete) {
    return <Navigate to="/result" replace />
  }

  const level = getLevelById(activeRun.levelId)
  if (!level) {
    return <Navigate to="/" replace />
  }

  const scene = getSceneNode(level, activeRun.currentNodeId)
  if (!scene) {
    return <Navigate to="/" replace />
  }

  const choices = getAvailableChoices(activeRun, scene)
  const backgroundUrl = getBackgroundImageUrl(scene.background)

  return (
    <div className={`play-layout theme-${level.theme}`}>
      <header className="play-toolbar">
        <div>
          <strong>第 {getLevelIndex(level.id) + 1} 关 · 未知时空</strong>
          <span style={{ marginLeft: '0.75rem', color: 'var(--color-text-muted)' }}>
            场景：{scene.title}
          </span>
        </div>
        <div className="button-row">
          <button className="btn" type="button" onClick={toggleSidebar}>
            状态
          </button>
          <Link className="btn btn-ghost" to="/">
            首页
          </Link>
        </div>
      </header>

      <div className="play-main">
        <section className="play-stage-wrap">
          <div
            className={`stage${backgroundUrl ? ' stage-has-image' : ''}`}
            style={
              backgroundUrl
                ? ({ '--stage-image': `url("${backgroundUrl}")` } as CSSProperties)
                : undefined
            }
          >
            <div className="stage-content">
              <span className="stage-tag">历史情境</span>
              <h2 className="stage-title">{scene.title}</h2>
            </div>
          </div>

          <div className="dialogue-panel">
            {scene.speaker && <div className="speaker">{scene.speaker}</div>}
            <p className="dialogue-text">{scene.text}</p>
            <StatDeltaToast />
            <div className="choice-list">
              {choices.map((choice) => (
                <button
                  key={choice.id}
                  className="btn choice-button"
                  type="button"
                  onClick={() => {
                    choose(choice.id)
                    if (useGameStore.getState().activeRun?.isComplete) {
                      navigate('/result')
                    }
                  }}
                >
                  {choice.text}
                </button>
              ))}
            </div>
          </div>
        </section>

        <aside className={`play-sidebar ${sidebarOpen ? 'open-mobile' : ''}`}>
          <StatusPanel run={activeRun} />
        </aside>
      </div>
    </div>
  )
}
