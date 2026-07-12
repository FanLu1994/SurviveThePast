export type StatKey = 'stamina' | 'injury' | 'wealth' | 'exposure'

export type EvidenceStrength = 'strong' | 'weak' | 'misleading'

export type EvidenceMark = 'support' | 'conflict' | 'doubt' | 'unmarked'

export type FactType = 'historical' | 'inference' | 'fiction'

export type SourceGrade = 'A' | 'B' | 'C' | 'D'

export type StrategyTag =
  | 'rely_on_relations'
  | 'follow_institution'
  | 'exchange_resources'
  | 'labor_trade'
  | 'conceal_identity'
  | 'avoid_transfer'

export type CompareOp = 'gte' | 'lte' | 'eq' | 'gt' | 'lt'

export interface Stats {
  stamina: number
  injury: number
  wealth: number
  exposure: number
}

export interface SourceRef {
  id: string
  title: string
  citation: string
  factType: FactType
  summary: string
  grade: SourceGrade
  author: string
  createdOrPublished: string
  locator: string
  supports: string
  cannotProve: string
}

export interface IdentityBackground {
  livelihood: string
  socialPosition: string
  affiliation: string
  rightsAndLimits: string
  exposureReason: string
}

export interface IdentityDef {
  id: string
  label: string
  description: string
  background: IdentityBackground
  sourceIds: string[]
  startingStats: Partial<Stats>
  flags: string[]
}

export interface EvidenceDef {
  id: string
  title: string
  description: string
  category: string
  strength: EvidenceStrength
  sourceId: string
  hints: {
    period?: string
    region?: string
    identity?: string
  }
}

export interface CorrectAnswers {
  period: string
  region: string
  identities: string[]
}

export interface Hypothesis {
  period: string
  region: string
  identity: string
  relation: string
  crisis: string
}

export interface StatCondition {
  type: 'stat'
  stat: StatKey
  op: CompareOp
  value: number
}

export interface FlagCondition {
  type: 'flag'
  flag: string
  value?: boolean
}

export interface HasEvidenceCondition {
  type: 'hasEvidence'
  evidenceIds: string[]
}

export interface IdentityCondition {
  type: 'identity'
  identityId: string
}

export interface HypothesisMatchCondition {
  type: 'hypothesisMatch'
  field: keyof Hypothesis
  value: string
}

export interface HypothesisMismatchCondition {
  type: 'hypothesisMismatch'
  field: keyof Hypothesis
  value: string
}

export type Condition =
  | StatCondition
  | FlagCondition
  | HasEvidenceCondition
  | IdentityCondition
  | HypothesisMatchCondition
  | HypothesisMismatchCondition

export interface ModifyStatEffect {
  type: 'modifyStat'
  stat: StatKey
  delta: number
}

export interface SetFlagEffect {
  type: 'setFlag'
  flag: string
  value: boolean
}

export interface RevealEvidenceEffect {
  type: 'revealEvidence'
  evidenceId: string
}

export interface UnlockArchiveEffect {
  type: 'unlockArchive'
  sourceId: string
}

export type Effect =
  | ModifyStatEffect
  | SetFlagEffect
  | RevealEvidenceEffect
  | UnlockArchiveEffect

export interface ChoiceDef {
  id: string
  text: string
  next: string
  condition?: Condition
  effects?: Effect[]
  requiresCorrectHypothesis?: keyof Hypothesis
  strategyTags?: StrategyTag[]
  settlementNote?: string
}

export interface SceneNodeDef {
  id: string
  type: 'scene'
  title: string
  background: string
  speaker?: string
  text: string
  onEnter?: Effect[]
  revealEvidence?: string[]
  choices: ChoiceDef[]
}

export interface EndingDef {
  id: string
  type: 'ending'
  title: string
  outcome: 'success' | 'failure' | 'partial'
  text: string
  unlockSources?: string[]
}

export type NodeDef = SceneNodeDef | EndingDef

export interface LevelPack {
  id: string
  title: string
  theme: string
  eraLabel: string
  year: number
  regionLabel: string
  oneLiner: string
  coreCrisis: string
  historicalBackground: string
  startNodeId: string
  correctAnswers: CorrectAnswers
  sources: SourceRef[]
  identities: IdentityDef[]
  evidence: EvidenceDef[]
  nodes: NodeDef[]
}

export interface EvidenceState {
  evidenceId: string
  discovered: boolean
  mark: EvidenceMark
}

export interface RunState {
  levelId: string
  identityId: string
  currentNodeId: string
  stats: Stats
  flags: Record<string, boolean>
  evidence: EvidenceState[]
  hypothesis: Hypothesis
  hypothesisSubmitted: boolean
  history: string[]
  choiceHistory: string[]
  unlockedSources: string[]
  isComplete: boolean
  endingId?: string
}

export interface GameSettings {
  textSpeed: number
  autoPlay: boolean
  musicVolume: number
  sfxVolume: number
  reducedMotion: boolean
}

export interface MetaProgress {
  unlockedSources: string[]
  completedEndings: string[]
  completedIdentities: string[]
  wrongHypotheses: string[]
  unlockedLevels: string[]
  completedLevels: string[]
}

export interface SaveData {
  schemaVersion: number
  settings: GameSettings
  meta: MetaProgress
  activeRun: RunState | null
  savedAt: string
}

export interface RelatedSourceEntry {
  sourceId: string
  newlyUnlocked: boolean
}

export interface RunResult {
  levelId: string
  levelTitle: string
  outcome: 'success' | 'failure' | 'partial'
  endingTitle: string
  endingText: string
  periodAccuracy: number
  regionAccuracy: number
  identityAccuracy: number
  unlockedSources: string[]
  correctAnswers: CorrectAnswers
  playerHypothesis: Hypothesis
  identityId: string
  identityLabel: string
  identityBackground: IdentityBackground | null
  historicalBackground: string | null
  primarySurvival: string | null
  secondarySurvival: string | null
  keyActions: string[]
  relatedSources: RelatedSourceEntry[]
}

export const DEFAULT_STATS: Stats = {
  stamina: 70,
  injury: 0,
  wealth: 20,
  exposure: 10,
}

export const DEFAULT_HYPOTHESIS: Hypothesis = {
  period: '',
  region: '',
  identity: '',
  relation: '',
  crisis: '',
}

export const DEFAULT_SETTINGS: GameSettings = {
  textSpeed: 40,
  autoPlay: false,
  musicVolume: 0.6,
  sfxVolume: 0.8,
  reducedMotion: false,
}

export const SAVE_SCHEMA_VERSION = 3
