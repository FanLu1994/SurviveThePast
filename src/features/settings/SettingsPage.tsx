import { Link } from 'react-router-dom'
import { useGameStore } from '@/stores/game-store'

export function SettingsPage() {
  const settings = useGameStore((state) => state.settings)
  const updateSettings = useGameStore((state) => state.updateSettings)
  const abandonRun = useGameStore((state) => state.abandonRun)

  return (
    <main className="page">
      <h1 className="page-title">设置</h1>
      <p className="page-subtitle">调整阅读速度与可访问性选项。</p>

      <form className="settings-form">
        <label>
          文字显示速度（毫秒/字）
          <input
            type="number"
            min={10}
            max={120}
            value={settings.textSpeed}
            onChange={(event) =>
              updateSettings({ textSpeed: Number(event.target.value) })
            }
          />
        </label>

        <label>
          <input
            type="checkbox"
            checked={settings.autoPlay}
            onChange={(event) => updateSettings({ autoPlay: event.target.checked })}
          />
          自动播放
        </label>

        <label>
          音乐音量
          <input
            type="range"
            min={0}
            max={1}
            step={0.1}
            value={settings.musicVolume}
            onChange={(event) =>
              updateSettings({ musicVolume: Number(event.target.value) })
            }
          />
        </label>

        <label>
          音效音量
          <input
            type="range"
            min={0}
            max={1}
            step={0.1}
            value={settings.sfxVolume}
            onChange={(event) =>
              updateSettings({ sfxVolume: Number(event.target.value) })
            }
          />
        </label>

        <label>
          <input
            type="checkbox"
            checked={settings.reducedMotion}
            onChange={(event) =>
              updateSettings({ reducedMotion: event.target.checked })
            }
          />
          减少动态效果
        </label>
      </form>

      <div className="button-row" style={{ marginTop: '1.5rem' }}>
        <button className="btn" type="button" onClick={() => void abandonRun()}>
          放弃当前局
        </button>
        <Link className="btn btn-primary" to="/">
          返回首页
        </Link>
      </div>
    </main>
  )
}
