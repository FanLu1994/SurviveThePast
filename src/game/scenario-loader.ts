import { validateLevelPack } from './content-schema'
import type { ValidationIssue } from './content-schema'
import type { LevelPack } from './types'

let LEVELS: LevelPack[] = []
let loadPromise: Promise<ValidationIssue[]> | null = null

interface LevelManifest {
  levels: string[]
}

function levelsBaseUrl(): string {
  const base = import.meta.env.BASE_URL
  return `${base.endsWith('/') ? base : `${base}/`}levels/`
}

export function getFirstLevelId(): string {
  return LEVELS[0]?.id ?? ''
}

export function getAllLevels(): LevelPack[] {
  return LEVELS
}

export function getLevelById(levelId: string): LevelPack | undefined {
  return LEVELS.find((level) => level.id === levelId)
}

export function getLevelIndex(levelId: string): number {
  return LEVELS.findIndex((level) => level.id === levelId)
}

export function getNextLevelId(levelId: string): string | null {
  const index = getLevelIndex(levelId)
  if (index < 0 || index >= LEVELS.length - 1) return null
  return LEVELS[index + 1]!.id
}

export function validateAllLevels() {
  return LEVELS.flatMap((level) => validateLevelPack(level))
}

export function getArchiveSources() {
  return LEVELS.flatMap((level) =>
    level.sources.map((source) => ({
      ...source,
      levelId: level.id,
      levelTitle: level.title,
    })),
  )
}

export async function loadAllLevels(): Promise<ValidationIssue[]> {
  if (loadPromise) return loadPromise

  loadPromise = (async () => {
    const issues: ValidationIssue[] = []
    const baseUrl = levelsBaseUrl()

    let manifest: LevelManifest
    try {
      const response = await fetch(`${baseUrl}index.json`)
      if (!response.ok) {
        throw new Error(`加载关卡清单失败: ${response.status}`)
      }
      manifest = (await response.json()) as LevelManifest
    } catch (error) {
      issues.push({
        levelId: 'manifest',
        code: 'fetch_failed',
        message: error instanceof Error ? error.message : '加载关卡清单失败',
      })
      LEVELS = []
      return issues
    }

    const loaded: LevelPack[] = []

    for (const levelId of manifest.levels) {
      try {
        const response = await fetch(`${baseUrl}${levelId}.json`)
        if (!response.ok) {
          issues.push({
            levelId,
            code: 'fetch_failed',
            message: `加载关卡失败: ${response.status}`,
          })
          continue
        }

        const level = (await response.json()) as LevelPack
        const levelIssues = validateLevelPack(level)
        if (levelIssues.length > 0) {
          issues.push(...levelIssues)
          continue
        }

        loaded.push(level)
      } catch (error) {
        issues.push({
          levelId,
          code: 'fetch_failed',
          message: error instanceof Error ? error.message : '加载关卡失败',
        })
      }
    }

    LEVELS = loaded
    return issues
  })()

  return loadPromise
}
