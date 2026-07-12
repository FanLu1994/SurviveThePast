import type {
  Condition,
  Effect,
  EndingDef,
  Hypothesis,
  LevelPack,
  RelatedSourceEntry,
  RunResult,
  RunState,
  SceneNodeDef,
  Stats,
  StrategyTag,
} from './types'
import { STRATEGY_LABELS } from './strategy-tags'
import {
  DEFAULT_HYPOTHESIS,
  DEFAULT_STATS,
} from './types'

export function clampStat(value: number): number {
  return Math.max(0, Math.min(100, value))
}

export function createInitialRun(level: LevelPack, identityId: string): RunState {
  const identity = level.identities.find((item) => item.id === identityId)
  if (!identity) {
    throw new Error(`身份不存在: ${identityId}`)
  }

  const stats: Stats = {
    ...DEFAULT_STATS,
    ...identity.startingStats,
  }

  const flags = identity.flags.reduce<Record<string, boolean>>((acc, flag) => {
    acc[flag] = true
    return acc
  }, {})

  return {
    levelId: level.id,
    identityId,
    currentNodeId: level.startNodeId,
    stats,
    flags,
    evidence: level.evidence.map((item) => ({
      evidenceId: item.id,
      discovered: false,
      mark: 'unmarked',
    })),
    hypothesis: { ...DEFAULT_HYPOTHESIS },
    hypothesisSubmitted: false,
    history: [],
    choiceHistory: [],
    unlockedSources: [],
    isComplete: false,
    crossingDone: false,
  }
}

export function getNode(level: LevelPack, nodeId: string) {
  return level.nodes.find((node) => node.id === nodeId)
}

export function getSceneNode(level: LevelPack, nodeId: string): SceneNodeDef | null {
  const node = getNode(level, nodeId)
  return node?.type === 'scene' ? node : null
}

export function getEndingNode(level: LevelPack, nodeId: string): EndingDef | null {
  const node = getNode(level, nodeId)
  return node?.type === 'ending' ? node : null
}

export function evaluateCondition(
  condition: Condition,
  run: RunState,
): boolean {
  switch (condition.type) {
    case 'stat': {
      const value = run.stats[condition.stat]
      switch (condition.op) {
        case 'gte':
          return value >= condition.value
        case 'lte':
          return value <= condition.value
        case 'eq':
          return value === condition.value
        case 'gt':
          return value > condition.value
        case 'lt':
          return value < condition.value
        default:
          return false
      }
    }
    case 'flag': {
      const actual = run.flags[condition.flag] ?? false
      return actual === (condition.value ?? true)
    }
    case 'hasEvidence':
      return condition.evidenceIds.every((evidenceId) =>
        run.evidence.some((item) => item.evidenceId === evidenceId && item.discovered),
      )
    case 'identity':
      return run.identityId === condition.identityId
    case 'hypothesisMatch':
      return normalize(run.hypothesis[condition.field]) === normalize(condition.value)
    case 'hypothesisMismatch':
      return (
        run.hypothesisSubmitted &&
        normalize(run.hypothesis[condition.field]) !== normalize(condition.value)
      )
    default:
      return false
  }
}

export function getAvailableChoices(
  run: RunState,
  node: SceneNodeDef,
) {
  return node.choices.filter((choice) => {
    if (choice.condition && !evaluateCondition(choice.condition, run)) {
      return false
    }
    return true
  })
}

export function isHypothesisCorrectForField(
  level: LevelPack,
  run: RunState,
  field: keyof RunState['hypothesis'],
): boolean {
  if (field === 'identity') {
    return level.correctAnswers.identities.some((id) => {
      const identity = level.identities.find((item) => item.id === id)
      const player = normalize(run.hypothesis.identity)
      return player === normalize(id) || player === normalize(identity?.label ?? '')
    })
  }
  const correct = level.correctAnswers[field as 'period' | 'region']
  return normalize(run.hypothesis[field]) === normalize(correct)
}

export function applyEffects(
  run: RunState,
  effects: Effect[],
): RunState {
  let next = { ...run, stats: { ...run.stats }, flags: { ...run.flags }, evidence: [...run.evidence], unlockedSources: [...run.unlockedSources] }

  for (const effect of effects) {
    switch (effect.type) {
      case 'modifyStat':
        next.stats[effect.stat] = clampStat(next.stats[effect.stat] + effect.delta)
        break
      case 'setFlag':
        next.flags[effect.flag] = effect.value
        break
      case 'revealEvidence':
        next.evidence = next.evidence.map((item) =>
          item.evidenceId === effect.evidenceId
            ? { ...item, discovered: true }
            : item,
        )
        break
      case 'unlockArchive':
        if (!next.unlockedSources.includes(effect.sourceId)) {
          next.unlockedSources.push(effect.sourceId)
        }
        break
      default:
        break
    }
  }

  return next
}

export function enterNode(level: LevelPack, run: RunState, nodeId: string): RunState {
  const node = getNode(level, nodeId)
  if (!node) {
    throw new Error(`节点不存在: ${nodeId}`)
  }

  let next = { ...run, currentNodeId: nodeId }

  if (node.type === 'scene') {
    if (node.onEnter) {
      next = applyEffects(next, node.onEnter)
    }
    if (node.revealEvidence) {
      for (const evidenceId of node.revealEvidence) {
        next = applyEffects(next, [{ type: 'revealEvidence', evidenceId }])
      }
    }
    next.history = [...next.history, node.id]
  }

  if (node.type === 'ending') {
    next.isComplete = true
    next.endingId = node.id
    if (node.unlockSources) {
      for (const sourceId of node.unlockSources) {
        next = applyEffects(next, [{ type: 'unlockArchive', sourceId }])
      }
    }
  }

  return next
}

export function chooseOption(
  level: LevelPack,
  run: RunState,
  choiceId: string,
): RunState {
  const scene = getSceneNode(level, run.currentNodeId)
  if (!scene) {
    throw new Error('当前节点不是场景节点')
  }

  const choice = scene.choices.find((item) => item.id === choiceId)
  if (!choice) {
    throw new Error(`选项不存在: ${choiceId}`)
  }

  const available = getAvailableChoices(run, scene)
  if (!available.some((item) => item.id === choiceId)) {
    throw new Error('当前选项不可用')
  }

  let next = run
  if (choice.effects) {
    next = applyEffects(next, choice.effects)
  }

  next = {
    ...next,
    choiceHistory: [...next.choiceHistory, choiceId],
  }

  next = enterNode(level, next, choice.next)
  return next
}

export function updateHypothesis(run: RunState, hypothesis: Hypothesis): RunState {
  return {
    ...run,
    hypothesis: { ...hypothesis },
  }
}

export function submitHypothesis(run: RunState): RunState {
  return {
    ...run,
    hypothesisSubmitted: true,
  }
}

export function markEvidence(
  run: RunState,
  evidenceId: string,
  mark: RunState['evidence'][number]['mark'],
): RunState {
  return {
    ...run,
    evidence: run.evidence.map((item) =>
      item.evidenceId === evidenceId ? { ...item, mark } : item,
    ),
  }
}

export function computeRunResult(
  level: LevelPack,
  run: RunState,
  previouslyUnlockedSources: string[] = [],
): RunResult {
  const ending = run.endingId ? getEndingNode(level, run.endingId) : null
  const cleared = ending?.outcome === 'success' || ending?.outcome === 'partial'

  const periodAccuracy = scoreField(
    run.hypothesis.period,
    level.correctAnswers.period,
  )
  const regionAccuracy = scoreField(
    run.hypothesis.region,
    level.correctAnswers.region,
  )
  const identityAccuracy = scoreIdentity(
    run.hypothesis.identity,
    level.correctAnswers.identities,
    level.identities,
  )

  const identity = level.identities.find((item) => item.id === run.identityId)
  const survival = summarizeSurvivalStrategies(level, run)
  const relatedSources = buildRelatedSources(
    level,
    run,
    previouslyUnlockedSources,
  )

  return {
    levelId: level.id,
    levelTitle: level.title,
    outcome: ending?.outcome ?? 'failure',
    endingTitle: ending?.title ?? '未知结局',
    endingText: ending?.text ?? '旅程意外中断。',
    endingScore: ending?.score ?? 0,
    periodAccuracy,
    regionAccuracy,
    identityAccuracy,
    unlockedSources: run.unlockedSources,
    correctAnswers: level.correctAnswers,
    playerHypothesis: run.hypothesis,
    identityId: run.identityId,
    identityLabel: identity?.label ?? '',
    identityBackground: cleared ? (identity?.background ?? null) : null,
    historicalBackground: cleared ? level.historicalBackground : null,
    primarySurvival: cleared ? survival.primary : null,
    secondarySurvival: cleared ? survival.secondary : null,
    keyActions: cleared ? survival.keyActions : [],
    relatedSources: cleared ? relatedSources : [],
  }
}

function summarizeSurvivalStrategies(level: LevelPack, run: RunState) {
  const tagScores = new Map<StrategyTag, number>()
  const keyActions: string[] = []

  for (const choiceId of run.choiceHistory) {
    const choice = findChoiceById(level, choiceId)
    if (!choice) continue

    if (choice.settlementNote && keyActions.length < 3) {
      keyActions.push(choice.settlementNote)
    }

    for (const tag of choice.strategyTags ?? []) {
      tagScores.set(tag, (tagScores.get(tag) ?? 0) + 1)
    }
  }

  const ranked = [...tagScores.entries()].sort((a, b) => b[1] - a[1])
  const primary = ranked[0] ? STRATEGY_LABELS[ranked[0][0]] : null
  const secondary = ranked[1] ? STRATEGY_LABELS[ranked[1][0]] : null

  return { primary, secondary, keyActions }
}

function findChoiceById(level: LevelPack, choiceId: string) {
  for (const node of level.nodes) {
    if (node.type !== 'scene') continue
    const choice = node.choices.find((item) => item.id === choiceId)
    if (choice) return choice
  }
  return null
}

function buildRelatedSources(
  level: LevelPack,
  run: RunState,
  previouslyUnlockedSources: string[],
): RelatedSourceEntry[] {
  const related = new Set<string>()

  const identity = level.identities.find((item) => item.id === run.identityId)
  for (const sourceId of identity?.sourceIds ?? []) {
    related.add(sourceId)
  }

  for (const item of run.evidence) {
    if (!item.discovered) continue
    const evidence = level.evidence.find((e) => e.id === item.evidenceId)
    if (evidence) related.add(evidence.sourceId)
  }

  for (const sourceId of run.unlockedSources) {
    related.add(sourceId)
  }

  return [...related].map((sourceId) => ({
    sourceId,
    newlyUnlocked: !previouslyUnlockedSources.includes(sourceId),
  }))
}

function scoreField(playerValue: string, correctValue: string): number {
  if (!playerValue.trim()) return 0
  const player = normalize(playerValue)
  const correct = normalize(correctValue)
  if (player === correct) return 100
  if (player.includes(correct) || correct.includes(player)) return 70
  return 20
}

function scoreIdentity(
  playerValue: string,
  correctIds: string[],
  identities: LevelPack['identities'],
): number {
  if (!playerValue.trim()) return 0
  const player = normalize(playerValue)
  for (const id of correctIds) {
    const identity = identities.find((item) => item.id === id)
    if (!identity) continue
    if (player === normalize(id) || player === normalize(identity.label)) {
      return 100
    }
    if (player.includes(normalize(identity.label)) || normalize(identity.label).includes(player)) {
      return 70
    }
  }
  return 20
}

function normalize(value: string): string {
  return value.trim().toLowerCase()
}

export function pickRandomIdentity(level: LevelPack): string {
  const index = Math.floor(Math.random() * level.identities.length)
  return level.identities[index]?.id ?? level.identities[0].id
}

export function checkFailureByStats(run: RunState): string | null {
  if (run.stats.stamina <= 0) return 'ending_exhaustion'
  if (run.stats.injury >= 100) return 'ending_critical_injury'
  if (run.stats.exposure >= 100) return 'ending_exposed'
  return null
}
