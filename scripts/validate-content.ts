import { validateAllLevels } from '../src/game/scenario-loader.ts'

const issues = validateAllLevels()

if (issues.length > 0) {
  console.error('关卡内容校验失败:')
  for (const issue of issues) {
    console.error(`[${issue.levelId}] ${issue.code}: ${issue.message}`)
  }
  process.exit(1)
}

console.log('关卡内容校验通过。')
