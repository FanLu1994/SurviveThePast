import { validateLevelPack } from './content-schema'
import type { LevelPack } from './types'
import { earlyMingLevel } from '../content/levels/early-ming/index.ts'
import { earlyRepublicLevel } from '../content/levels/early-republic/index.ts'
import { jiaqingClothLevel } from '../content/levels/jiaqing-cloth/index.ts'
import { lateQingLevel } from '../content/levels/late-qing/index.ts'
import { midTangLevel } from '../content/levels/mid-tang/index.ts'
import { northernSongLevel } from '../content/levels/northern-song/index.ts'

// 通关解锁顺序：第 1 关为剧情样板关，其后暂保留旧关待按剧情指南重写。
const LEVELS: LevelPack[] = [
  jiaqingClothLevel,
  midTangLevel,
  northernSongLevel,
  earlyMingLevel,
  lateQingLevel,
  earlyRepublicLevel,
]

export const FIRST_LEVEL_ID = LEVELS[0]!.id

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
