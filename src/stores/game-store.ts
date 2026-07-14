import { create } from 'zustand'
import {
  checkFailureByStats,
  chooseOption,
  computeRunResult,
  createInitialRun,
  enterNode,
  getEndingNode,
  getSceneNode,
  pickRandomIdentity,
} from '@/game/engine'
import { getAllLevels, getLevelById, getNextLevelId, loadAllLevels } from '@/game/scenario-loader'
import type {
  GameSettings,
  MetaProgress,
  RunResult,
  RunState,
  StatKey,
  Stats,
} from '@/game/types'
import { DEFAULT_SETTINGS } from '@/game/types'
import {
  createEmptySave,
  isStorageAvailable,
  loadSave,
  mergeMetaProgress,
  persistGameState,
} from '@/storage/save-repository'

export interface StatDelta {
  deltas: Partial<Record<StatKey, number>>
  seq: number
}

let statDeltaSeq = 0

function computeStatDelta(before: Stats, after: Stats): StatDelta | null {
  const keys: StatKey[] = ['stamina', 'injury', 'wealth', 'exposure']
  const deltas: Partial<Record<StatKey, number>> = {}

  for (const key of keys) {
    const delta = after[key] - before[key]
    if (delta !== 0) {
      deltas[key] = delta
    }
  }

  if (Object.keys(deltas).length === 0) return null

  statDeltaSeq += 1
  return { deltas, seq: statDeltaSeq }
}

interface GameStore {
  initialized: boolean
  levelsError: string | null
  storageAvailable: boolean
  storageWarning: string | null
  settings: GameSettings
  meta: MetaProgress
  activeRun: RunState | null
  lastResult: RunResult | null
  sidebarOpen: boolean
  dialogueHistory: string[]
  lastStatDelta: StatDelta | null
  initialize: () => Promise<void>
  startNewRun: (levelId: string) => void
  continueRun: () => boolean
  finishCrossing: () => void
  choose: (choiceId: string) => void
  updateSettings: (settings: Partial<GameSettings>) => void
  toggleSidebar: () => void
  clearStatDelta: () => void
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
  levelsError: null,
  storageAvailable: true,
  storageWarning: null,
  settings: DEFAULT_SETTINGS,
  meta: {
    unlockedSources: [],
    completedEndings: [],
    completedIdentities: [],
    wrongHypotheses: [],
    unlockedLevels: [],
    completedLevels: [],
  },
  activeRun: null,
  lastResult: null,
  sidebarOpen: false,
  dialogueHistory: [],
  lastStatDelta: null,

  initialize: async () => {
    const levelIssues = await loadAllLevels()
    if (levelIssues.length > 0 || getAllLevels().length === 0) {
      const message =
        levelIssues.length > 0
          ? levelIssues.map((issue) => `[${issue.levelId}] ${issue.message}`).join('；')
          : '未加载到任何关卡内容'
      set({
        initialized: true,
        levelsError: message,
        storageAvailable: false,
        storageWarning: '关卡内容加载失败，游戏无法启动。',
      })
      return
    }

    const storageAvailable = await isStorageAvailable()
    const save = storageAvailable ? await loadSave() : null

    set({
      initialized: true,
      levelsError: null,
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
      lastStatDelta: null,
    })

    void saveState(get())
  },

  continueRun: () => {
    const { activeRun } = get()
    if (!activeRun || activeRun.isComplete) return false
    return true
  },

  finishCrossing: () => {
    const { activeRun } = get()
    if (!activeRun || activeRun.crossingDone) return
    const next = { ...activeRun, crossingDone: true }
    set({ activeRun: next })
    void saveState(get())
  },

  choose: (choiceId) => {
    const { activeRun, meta } = get()
    if (!activeRun) return

    const level = getLevelById(activeRun.levelId)
    if (!level) return

    const scene = getSceneNode(level, activeRun.currentNodeId)
    if (!scene) return

    const statsBefore = { ...activeRun.stats }
    let next = chooseOption(level, activeRun, choiceId)
    const statFailure = resolveStatFailure(level.id, next)
    if (statFailure) {
      next = statFailure
    }

    const historyLine = `${scene.title}：${scene.text}`
    const dialogueHistory = [...get().dialogueHistory, historyLine]

    if (next.isComplete && next.endingId) {
      const result = computeRunResult(level, next, meta.unlockedSources)
      const ending = getEndingNode(level, next.endingId)
      const cleared = ending?.outcome === 'success'
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
        lastStatDelta: null,
      })
      void saveState({ ...get(), meta: mergedMeta, activeRun: null })
      return
    }

    const lastStatDelta = computeStatDelta(statsBefore, next.stats)
    set({ activeRun: next, dialogueHistory, lastStatDelta })
    void saveState(get())
  },

  updateSettings: (settings) => {
    const nextSettings = { ...get().settings, ...settings }
    set({ settings: nextSettings })
    void saveState({ ...get(), settings: nextSettings })
  },

  toggleSidebar: () => set({ sidebarOpen: !get().sidebarOpen }),

  clearStatDelta: () => set({ lastStatDelta: null }),

  clearResult: () => set({ lastResult: null, activeRun: null, lastStatDelta: null }),

  abandonRun: async () => {
    set({ activeRun: null, lastResult: null, dialogueHistory: [], lastStatDelta: null })
    await saveState(get())
  },
}))
