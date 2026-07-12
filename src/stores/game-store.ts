import { create } from 'zustand'
import {
  checkFailureByStats,
  chooseOption,
  computeRunResult,
  createInitialRun,
  enterNode,
  getEndingNode,
  getSceneNode,
  markEvidence,
  pickRandomIdentity,
  submitHypothesis,
  updateHypothesis,
} from '@/game/engine'
import { getLevelById, getNextLevelId } from '@/game/scenario-loader'
import type {
  EvidenceMark,
  GameSettings,
  Hypothesis,
  MetaProgress,
  RunResult,
  RunState,
} from '@/game/types'
import { DEFAULT_SETTINGS } from '@/game/types'
import {
  createEmptySave,
  isStorageAvailable,
  loadSave,
  mergeMetaProgress,
  persistGameState,
} from '@/storage/save-repository'

interface GameStore {
  initialized: boolean
  storageAvailable: boolean
  storageWarning: string | null
  settings: GameSettings
  meta: MetaProgress
  activeRun: RunState | null
  lastResult: RunResult | null
  sidebarOpen: boolean
  evidencePanelOpen: boolean
  dialogueHistory: string[]
  initialize: () => Promise<void>
  startNewRun: (levelId: string) => void
  continueRun: () => boolean
  choose: (choiceId: string) => void
  setHypothesis: (hypothesis: Hypothesis) => void
  submitHypothesisAction: () => void
  markEvidenceAction: (evidenceId: string, mark: EvidenceMark) => void
  updateSettings: (settings: Partial<GameSettings>) => void
  toggleSidebar: () => void
  toggleEvidencePanel: () => void
  clearResult: () => void
  abandonRun: () => Promise<void>
}

async function saveState(state: Pick<GameStore, 'settings' | 'meta' | 'activeRun'>) {
  const ok = await persistGameState({
    settings: state.settings,
    meta: state.meta,
    activeRun: state.activeRun,
  })
  return ok
}

function resolveStatFailure(levelId: string, run: RunState): RunState | null {
  const failure = checkFailureByStats(run)
  if (!failure) return null

  const level = getLevelById(levelId)
  if (!level) return null

  const ending =
    failure === 'ending_exhaustion'
      ? 'ending_exhaustion'
      : failure === 'ending_critical_injury'
        ? 'ending_critical_injury'
        : 'ending_exposed_stat'

  if (!getEndingNode(level, ending)) return null
  return enterNode(level, run, ending)
}

export const useGameStore = create<GameStore>((set, get) => ({
  initialized: false,
  storageAvailable: true,
  storageWarning: null,
  settings: DEFAULT_SETTINGS,
  meta: createEmptySave().meta,
  activeRun: null,
  lastResult: null,
  sidebarOpen: false,
  evidencePanelOpen: false,
  dialogueHistory: [],

  initialize: async () => {
    const storageAvailable = await isStorageAvailable()
    const save = storageAvailable ? await loadSave() : null

    set({
      initialized: true,
      storageAvailable,
      storageWarning: storageAvailable ? null : '浏览器存储不可用，本次进度无法保存。',
      settings: save?.settings ?? DEFAULT_SETTINGS,
      meta: save?.meta ?? createEmptySave().meta,
      activeRun: save?.activeRun ?? null,
    })
  },

  startNewRun: (levelId) => {
    const level = getLevelById(levelId)
    if (!level) return
    const identityId = pickRandomIdentity(level)
    const run = createInitialRun(level, identityId)
    const entered = enterNode(level, run, run.currentNodeId)

    set({
      activeRun: entered,
      lastResult: null,
      dialogueHistory: [],
      sidebarOpen: false,
      evidencePanelOpen: false,
    })

    void saveState(get())
  },

  continueRun: () => {
    const { activeRun } = get()
    if (!activeRun || activeRun.isComplete) return false
    return true
  },

  choose: (choiceId) => {
    const { activeRun, meta } = get()
    if (!activeRun) return

    const level = getLevelById(activeRun.levelId)
    if (!level) return

    const scene = getSceneNode(level, activeRun.currentNodeId)
    if (!scene) return

    let next = chooseOption(level, activeRun, choiceId)
    const statFailure = resolveStatFailure(level.id, next)
    if (statFailure) {
      next = statFailure
    }

    const historyLine = `${scene.title}：${scene.text}`
    const dialogueHistory = [...get().dialogueHistory, historyLine]

    if (next.isComplete && next.endingId) {
      const result = computeRunResult(level, next)
      const ending = getEndingNode(level, next.endingId)
      const cleared =
        ending?.outcome === 'success' || ending?.outcome === 'partial'
      const levelClear = cleared
        ? { clearedLevelId: level.id, nextLevelId: getNextLevelId(level.id) }
        : undefined
      const mergedMeta = mergeMetaProgress(
        meta,
        next,
        next.endingId,
        levelClear,
      )
      set({
        activeRun: next,
        lastResult: result,
        meta: mergedMeta,
        dialogueHistory,
      })
      void saveState({ ...get(), meta: mergedMeta, activeRun: null })
      return
    }

    set({ activeRun: next, dialogueHistory })
    void saveState(get())
  },

  setHypothesis: (hypothesis) => {
    const { activeRun } = get()
    if (!activeRun) return
    const next = updateHypothesis(activeRun, hypothesis)
    set({ activeRun: next })
    void saveState(get())
  },

  submitHypothesisAction: () => {
    const { activeRun } = get()
    if (!activeRun) return
    const next = submitHypothesis(activeRun)
    set({ activeRun: next })
    void saveState(get())
  },

  markEvidenceAction: (evidenceId, mark) => {
    const { activeRun } = get()
    if (!activeRun) return
    const next = markEvidence(activeRun, evidenceId, mark)
    set({ activeRun: next })
    void saveState(get())
  },

  updateSettings: (settings) => {
    const nextSettings = { ...get().settings, ...settings }
    set({ settings: nextSettings })
    void saveState({ ...get(), settings: nextSettings })
  },

  toggleSidebar: () => set({ sidebarOpen: !get().sidebarOpen }),
  toggleEvidencePanel: () => set({ evidencePanelOpen: !get().evidencePanelOpen }),

  clearResult: () => set({ lastResult: null, activeRun: null }),

  abandonRun: async () => {
    set({ activeRun: null, lastResult: null, dialogueHistory: [] })
    await saveState(get())
  },
}))
