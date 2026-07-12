import { validateLevelPack } from './content-schema'
import type { LevelPack } from './types'
import { earlyRepublicLevel } from '../content/levels/early-republic/index.ts'
import { lateHanLevel } from '../content/levels/late-han/index.ts'
import { northernSongLevel } from '../content/levels/northern-song/index.ts'

const LEVELS: LevelPack[] = [lateHanLevel, northernSongLevel, earlyRepublicLevel]

export function getAllLevels(): LevelPack[] {
  return LEVELS
}

export function getLevelById(levelId: string): LevelPack | undefined {
  return LEVELS.find((level) => level.id === levelId)
}

export function pickRandomLevel(): LevelPack {
  const index = Math.floor(Math.random() * LEVELS.length)
  return LEVELS[index] ?? LEVELS[0]
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
