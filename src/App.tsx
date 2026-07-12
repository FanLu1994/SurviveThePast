import { useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { ArchivePage } from '@/features/archive/ArchivePage'
import { HomePage } from '@/features/play/HomePage'
import { PlayPage } from '@/features/play/PlayPage'
import { ResultPage } from '@/features/play/ResultPage'
import { SettingsPage } from '@/features/settings/SettingsPage'
import { useGameStore } from '@/stores/game-store'

export default function App() {
  const initialize = useGameStore((state) => state.initialize)

  useEffect(() => {
    void initialize()
  }, [initialize])

  return (
    <div className="app-shell">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/play" element={<PlayPage />} />
        <Route path="/result" element={<ResultPage />} />
        <Route path="/archive" element={<ArchivePage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}
