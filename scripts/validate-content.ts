import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { validateLevelPack } from '../src/game/content-schema.ts'
import type { LevelPack } from '../src/game/types.ts'

const levelsDir = join(process.cwd(), 'public', 'levels')
const manifest = JSON.parse(
  readFileSync(join(levelsDir, 'index.json'), 'utf8'),
) as { levels: string[] }

const issues = manifest.levels.flatMap((levelId) => {
  const filePath = join(levelsDir, `${levelId}.json`)
  const level = JSON.parse(readFileSync(filePath, 'utf8')) as LevelPack
  return validateLevelPack(level)
})

if (issues.length > 0) {
  console.error('关卡内容校验失败:')
  for (const issue of issues) {
    console.error(`[${issue.levelId}] ${issue.code}: ${issue.message}`)
  }
  process.exit(1)
}

console.log('关卡内容校验通过。')
