import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { getBackgroundImageUrl } from '@/game/background-assets'
import { getLevelById } from '@/game/scenario-loader'
import { useGameStore } from '@/stores/game-store'

export function CrossingPage() {
  const navigate = useNavigate()
  const activeRun = useGameStore((state) => state.activeRun)
  const settings = useGameStore((state) => state.settings)
  const finishCrossing = useGameStore((state) => state.finishCrossing)

  const level = activeRun ? getLevelById(activeRun.levelId) : undefined
  const identity = level?.identities.find((item) => item.id === activeRun?.identityId)

  const fullText = useMemo(() => {
    if (!level || !identity) return ''
    return [
      level.crossing.leadText,
      level.crossing.sceneText,
      identity.description,
    ].join('\n\n')
  }, [level, identity])

  const [shownCount, setShownCount] = useState(0)
  const reducedMotion = settings.reducedMotion
  const typingDone = reducedMotion || shownCount >= fullText.length

  useEffect(() => {
    setShownCount(reducedMotion ? fullText.length : 0)
  }, [fullText, reducedMotion])

  useEffect(() => {
    if (reducedMotion || !fullText || typingDone) return

    const timer = window.setTimeout(() => {
      setShownCount((count) => Math.min(fullText.length, count + 1))
    }, Math.max(10, settings.textSpeed))

    return () => window.clearTimeout(timer)
  }, [fullText, shownCount, typingDone, reducedMotion, settings.textSpeed])

  if (!activeRun) {
    return <Navigate to="/" replace />
  }

  if (activeRun.crossingDone) {
    return <Navigate to="/play" replace />
  }

  if (!level || !identity) {
    return <Navigate to="/" replace />
  }

  const backgroundUrl = getBackgroundImageUrl(level.crossing.background)
  const displayText = fullText.slice(0, shownCount)

  const handleSkipOrContinue = () => {
    if (!typingDone) {
      setShownCount(fullText.length)
      return
    }
    finishCrossing()
    navigate('/play')
  }

  return (
    <div className={`crossing-page theme-${level.theme}`}>
      <div
        className={`crossing-stage${backgroundUrl ? ' crossing-stage-has-image' : ''}`}
        style={
          backgroundUrl
            ? ({ '--crossing-image': `url("${backgroundUrl}")` } as CSSProperties)
            : undefined
        }
      >
        <div className="crossing-veil" />
        <div className="crossing-panel">
          <p className="crossing-eyebrow">穿越失败</p>
          <div
            className="crossing-text"
            onClick={() => {
              if (!typingDone) setShownCount(fullText.length)
            }}
            role="presentation"
          >
            {displayText.split('\n\n').map((paragraph, index, list) => (
              <p key={`${index}-${paragraph.slice(0, 8)}`}>
                {paragraph}
                {index === list.length - 1 && !typingDone ? (
                  <span className="crossing-caret" aria-hidden>
                    ▍
                  </span>
                ) : null}
              </p>
            ))}
          </div>
          <button className="btn btn-primary" type="button" onClick={handleSkipOrContinue}>
            {typingDone ? '醒来' : '跳过'}
          </button>
        </div>
      </div>
    </div>
  )
}
