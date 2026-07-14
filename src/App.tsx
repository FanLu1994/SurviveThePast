import { useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { ArchivePage } from '@/features/archive/ArchivePage'
import { CrossingPage } from '@/features/play/CrossingPage'
import { HomePage } from '@/features/play/HomePage'
import { PlayPage } from '@/features/play/PlayPage'
import { ResultPage } from '@/features/play/ResultPage'
import { SettingsPage } from '@/features/settings/SettingsPage'
import { useGameStore } from '@/stores/game-store'

export default function App() {
  const initialize = useGameStore((state) => state.initialize)
  const initialized = useGameStore((state) => state.initialized)
  const levelsError = useGameStore((state) => state.levelsError)

  useEffect(() => {
    void initialize()
  }, [initialize])

  if (!initialized) {
    return (
      <div className="app-shell">
        <main className="page">
          <p className="page-subtitle">正在加载关卡内容…</p>
        </main>
      </div>
    )
  }

  if (levelsError) {
    return (
      <div className="app-shell">
        <main className="page">
          <h1 className="page-title">关卡加载失败</h1>
          <div className="warning-banner">{levelsError}</div>
        </main>
      </div>
    )
  }

  return (
    <div className="app-shell">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/crossing" element={<CrossingPage />} />
        <Route path="/play" element={<PlayPage />} />
        <Route path="/result" element={<ResultPage />} />
        <Route path="/archive" element={<ArchivePage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}
