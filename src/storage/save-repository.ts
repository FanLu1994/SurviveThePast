import type {
  GameSettings,
  MetaProgress,
  RunState,
  SaveData,
} from '@/game/types'
import {
  DEFAULT_SETTINGS,
  SAVE_SCHEMA_VERSION,
} from '@/game/types'
import { FIRST_LEVEL_ID } from '@/game/scenario-loader'

const DB_NAME = 'survive-the-past'
const DB_VERSION = 1
const STORE_NAME = 'saves'
const SAVE_KEY = 'primary'

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('IndexedDB 打开失败'))
  })
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('IndexedDB 请求失败'))
  })
}

export async function isStorageAvailable(): Promise<boolean> {
  if (typeof indexedDB === 'undefined') return false
  try {
    const db = await openDatabase()
    db.close()
    return true
  } catch {
    return false
  }
}

export function createEmptySave(): SaveData {
  return {
    schemaVersion: SAVE_SCHEMA_VERSION,
    settings: { ...DEFAULT_SETTINGS },
    meta: {
      unlockedSources: [],
      completedEndings: [],
      completedIdentities: [],
      wrongHypotheses: [],
      unlockedLevels: [FIRST_LEVEL_ID],
      completedLevels: [],
    },
    activeRun: null,
    savedAt: new Date().toISOString(),
  }
}

export function migrateSave(data: SaveData): SaveData {
  if (data.schemaVersion === SAVE_SCHEMA_VERSION) {
    return data
  }

  const base =
    data.schemaVersion >= 2
      ? {
          settings: data.settings ?? DEFAULT_SETTINGS,
          meta: {
            unlockedSources: data.meta?.unlockedSources ?? [],
            completedEndings: data.meta?.completedEndings ?? [],
            completedIdentities: data.meta?.completedIdentities ?? [],
            wrongHypotheses: data.meta?.wrongHypotheses ?? [],
            unlockedLevels: data.meta?.unlockedLevels ?? [FIRST_LEVEL_ID],
            completedLevels: data.meta?.completedLevels ?? [],
          },
        }
      : {
          settings: data.settings ?? DEFAULT_SETTINGS,
          meta: {
            unlockedSources: data.meta?.unlockedSources ?? [],
            completedEndings: data.meta?.completedEndings ?? [],
            completedIdentities: data.meta?.completedIdentities ?? [],
            wrongHypotheses: data.meta?.wrongHypotheses ?? [],
            unlockedLevels: [FIRST_LEVEL_ID],
            completedLevels: [],
          },
        }

  const activeRun = data.activeRun
    ? {
        ...data.activeRun,
        choiceHistory: data.activeRun.choiceHistory ?? [],
      }
    : null

  return {
    ...createEmptySave(),
    ...base,
    activeRun,
    savedAt: new Date().toISOString(),
  }
}

export async function loadSave(): Promise<SaveData | null> {
  if (!(await isStorageAvailable())) return null

  const db = await openDatabase()
  const tx = db.transaction(STORE_NAME, 'readonly')
  const store = tx.objectStore(STORE_NAME)
  const raw = await requestToPromise(store.get(SAVE_KEY))
  db.close()

  if (!raw) return null
  return migrateSave(raw as SaveData)
}

export async function writeSave(data: SaveData): Promise<boolean> {
  if (!(await isStorageAvailable())) return false

  const db = await openDatabase()
  const tx = db.transaction(STORE_NAME, 'readwrite')
  const store = tx.objectStore(STORE_NAME)
  store.put({ ...data, savedAt: new Date().toISOString() }, SAVE_KEY)

  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error ?? new Error('IndexedDB 写入失败'))
  })

  db.close()
  return true
}

export async function clearActiveRun(): Promise<boolean> {
  const current = (await loadSave()) ?? createEmptySave()
  return writeSave({ ...current, activeRun: null })
}

export function mergeMetaProgress(
  meta: MetaProgress,
  run: RunState,
  endingId?: string,
  levelClear?: { clearedLevelId: string; nextLevelId: string | null },
): MetaProgress {
  const next: MetaProgress = {
    unlockedSources: [...meta.unlockedSources],
    completedEndings: [...meta.completedEndings],
    completedIdentities: [...meta.completedIdentities],
    wrongHypotheses: [...meta.wrongHypotheses],
    unlockedLevels: [...meta.unlockedLevels],
    completedLevels: [...meta.completedLevels],
  }

  for (const sourceId of run.unlockedSources) {
    if (!next.unlockedSources.includes(sourceId)) {
      next.unlockedSources.push(sourceId)
    }
  }

  if (endingId && !next.completedEndings.includes(endingId)) {
    next.completedEndings.push(endingId)
  }

  const identityKey = `${run.levelId}:${run.identityId}`
  if (!next.completedIdentities.includes(identityKey)) {
    next.completedIdentities.push(identityKey)
  }

  if (levelClear) {
    if (!next.completedLevels.includes(levelClear.clearedLevelId)) {
      next.completedLevels.push(levelClear.clearedLevelId)
    }
    if (
      levelClear.nextLevelId &&
      !next.unlockedLevels.includes(levelClear.nextLevelId)
    ) {
      next.unlockedLevels.push(levelClear.nextLevelId)
    }
  }

  return next
}

export async function persistGameState(input: {
  settings: GameSettings
  meta: MetaProgress
  activeRun: RunState | null
}): Promise<boolean> {
  const current = (await loadSave()) ?? createEmptySave()
  return writeSave({
    ...current,
    settings: input.settings,
    meta: input.meta,
    activeRun: input.activeRun,
    schemaVersion: SAVE_SCHEMA_VERSION,
    savedAt: new Date().toISOString(),
  })
}
