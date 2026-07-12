import { z } from 'zod'

const compareOpSchema = z.enum(['gte', 'lte', 'eq', 'gt', 'lt'])
const statKeySchema = z.enum(['stamina', 'injury', 'wealth', 'exposure'])
const factTypeSchema = z.enum(['historical', 'inference', 'fiction'])
const evidenceStrengthSchema = z.enum(['strong', 'weak', 'misleading'])

const conditionSchema: z.ZodType<unknown> = z.lazy(() =>
  z.discriminatedUnion('type', [
    z.object({
      type: z.literal('stat'),
      stat: statKeySchema,
      op: compareOpSchema,
      value: z.number(),
    }),
    z.object({
      type: z.literal('flag'),
      flag: z.string().min(1),
      value: z.boolean().optional(),
    }),
    z.object({
      type: z.literal('hasEvidence'),
      evidenceIds: z.array(z.string().min(1)).min(1),
    }),
    z.object({
      type: z.literal('identity'),
      identityId: z.string().min(1),
    }),
    z.object({
      type: z.literal('hypothesisMatch'),
      field: z.enum(['period', 'region', 'identity', 'relation', 'crisis']),
      value: z.string().min(1),
    }),
    z.object({
      type: z.literal('hypothesisMismatch'),
      field: z.enum(['period', 'region', 'identity', 'relation', 'crisis']),
      value: z.string().min(1),
    }),
  ]),
)

const effectSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('modifyStat'),
    stat: statKeySchema,
    delta: z.number(),
  }),
  z.object({
    type: z.literal('setFlag'),
    flag: z.string().min(1),
    value: z.boolean(),
  }),
  z.object({
    type: z.literal('revealEvidence'),
    evidenceId: z.string().min(1),
  }),
  z.object({
    type: z.literal('unlockArchive'),
    sourceId: z.string().min(1),
  }),
])

const choiceSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  next: z.string().min(1),
  condition: conditionSchema.optional(),
  effects: z.array(effectSchema).optional(),
  requiresCorrectHypothesis: z
    .enum(['period', 'region', 'identity', 'relation', 'crisis'])
    .optional(),
})

const sceneNodeSchema = z.object({
  id: z.string().min(1),
  type: z.literal('scene'),
  title: z.string().min(1),
  background: z.string().min(1),
  speaker: z.string().optional(),
  text: z.string().min(1),
  onEnter: z.array(effectSchema).optional(),
  revealEvidence: z.array(z.string().min(1)).optional(),
  choices: z.array(choiceSchema).min(1),
})

const endingSchema = z.object({
  id: z.string().min(1),
  type: z.literal('ending'),
  title: z.string().min(1),
  outcome: z.enum(['success', 'failure', 'partial']),
  text: z.string().min(1),
  unlockSources: z.array(z.string().min(1)).optional(),
})

export const levelPackSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  theme: z.string().min(1),
  eraLabel: z.string().min(1),
  year: z.number().int(),
  regionLabel: z.string().min(1),
  startNodeId: z.string().min(1),
  correctAnswers: z.object({
    period: z.string().min(1),
    region: z.string().min(1),
    identities: z.array(z.string().min(1)).min(1),
  }),
  sources: z
    .array(
      z.object({
        id: z.string().min(1),
        title: z.string().min(1),
        citation: z.string().min(1),
        factType: factTypeSchema,
        summary: z.string().min(1),
      }),
    )
    .min(1),
  identities: z
    .array(
      z.object({
        id: z.string().min(1),
        label: z.string().min(1),
        description: z.string().min(1),
        startingStats: z
          .object({
            stamina: z.number().optional(),
            injury: z.number().optional(),
            wealth: z.number().optional(),
            exposure: z.number().optional(),
          })
          .optional(),
        flags: z.array(z.string()),
      }),
    )
    .min(1),
  evidence: z
    .array(
      z.object({
        id: z.string().min(1),
        title: z.string().min(1),
        description: z.string().min(1),
        category: z.string().min(1),
        strength: evidenceStrengthSchema,
        sourceId: z.string().min(1),
        hints: z.object({
          period: z.string().optional(),
          region: z.string().optional(),
          identity: z.string().optional(),
        }),
      }),
    )
    .min(1),
  nodes: z.array(z.union([sceneNodeSchema, endingSchema])).min(1),
})

export type LevelPackInput = z.infer<typeof levelPackSchema>

export interface ValidationIssue {
  levelId: string
  code: string
  message: string
  nodeId?: string
}

export function validateLevelPack(level: LevelPackInput): ValidationIssue[] {
  const parsed = levelPackSchema.safeParse(level)
  if (!parsed.success) {
    return parsed.error.issues.map((issue) => ({
      levelId: level.id ?? 'unknown',
      code: 'schema',
      message: `${issue.path.join('.')}: ${issue.message}`,
    }))
  }

  const issues: ValidationIssue[] = []
  const pack = parsed.data
  const nodeIds = new Set<string>()
  const sourceIds = new Set(pack.sources.map((s) => s.id))
  const evidenceIds = new Set(pack.evidence.map((e) => e.id))
  const identityIds = new Set(pack.identities.map((i) => i.id))

  for (const node of pack.nodes) {
    if (nodeIds.has(node.id)) {
      issues.push({
        levelId: pack.id,
        code: 'duplicate_node',
        message: `重复节点 id: ${node.id}`,
        nodeId: node.id,
      })
    }
    nodeIds.add(node.id)
  }

  if (!nodeIds.has(pack.startNodeId)) {
    issues.push({
      levelId: pack.id,
      code: 'missing_start',
      message: `起始节点不存在: ${pack.startNodeId}`,
    })
  }

  for (const evidence of pack.evidence) {
    if (!sourceIds.has(evidence.sourceId)) {
      issues.push({
        levelId: pack.id,
        code: 'missing_source',
        message: `证据 ${evidence.id} 引用不存在的来源 ${evidence.sourceId}`,
      })
    }
  }

  for (const identity of pack.identities) {
    if (!pack.correctAnswers.identities.includes(identity.id)) {
      issues.push({
        levelId: pack.id,
        code: 'identity_not_in_answers',
        message: `身份 ${identity.id} 未列入 correctAnswers.identities`,
      })
    }
  }

  const endingIds = pack.nodes
    .filter((n) => n.type === 'ending')
    .map((n) => n.id)

  if (endingIds.length === 0) {
    issues.push({
      levelId: pack.id,
      code: 'no_endings',
      message: '关卡至少需要一个结局节点',
    })
  }

  const reachable = new Set<string>()
  const queue = [pack.startNodeId]

  while (queue.length > 0) {
    const current = queue.shift()
    if (!current || reachable.has(current)) continue
    reachable.add(current)

    const node = pack.nodes.find((n) => n.id === current)
    if (!node || node.type === 'ending') continue

    for (const choice of node.choices) {
      if (!nodeIds.has(choice.next) && !endingIds.includes(choice.next)) {
        issues.push({
          levelId: pack.id,
          code: 'missing_next',
          message: `节点 ${node.id} 的选项 ${choice.id} 指向不存在的节点 ${choice.next}`,
          nodeId: node.id,
        })
      }
      if (!reachable.has(choice.next)) {
        queue.push(choice.next)
      }
    }

    if (node.revealEvidence) {
      for (const evidenceId of node.revealEvidence) {
        if (!evidenceIds.has(evidenceId)) {
          issues.push({
            levelId: pack.id,
            code: 'missing_evidence',
            message: `节点 ${node.id} 引用不存在的证据 ${evidenceId}`,
            nodeId: node.id,
          })
        }
      }
    }
  }

  const systemEndingIds = new Set([
    'ending_exhaustion',
    'ending_critical_injury',
    'ending_exposed_stat',
  ])

  for (const endingId of endingIds) {
    if (systemEndingIds.has(endingId)) continue
    if (!reachable.has(endingId)) {
      issues.push({
        levelId: pack.id,
        code: 'unreachable_ending',
        message: `结局 ${endingId} 不可达`,
        nodeId: endingId,
      })
    }
  }

  for (const node of pack.nodes) {
    if (node.type !== 'scene') continue
    for (const choice of node.choices) {
      if (choice.condition) {
        validateConditionRefs(pack.id, node.id, choice.condition, identityIds, evidenceIds, issues)
      }
      if (choice.effects) {
        for (const effect of choice.effects) {
          validateEffectRefs(pack.id, node.id, effect, sourceIds, evidenceIds, issues)
        }
      }
    }
    if (node.onEnter) {
      for (const effect of node.onEnter) {
        validateEffectRefs(pack.id, node.id, effect, sourceIds, evidenceIds, issues)
      }
    }
  }

  return issues
}

function validateConditionRefs(
  levelId: string,
  nodeId: string,
  condition: unknown,
  identityIds: Set<string>,
  evidenceIds: Set<string>,
  issues: ValidationIssue[],
) {
  const c = condition as { type: string; identityId?: string; evidenceIds?: string[] }
  if (c.type === 'identity' && c.identityId && !identityIds.has(c.identityId)) {
    issues.push({
      levelId,
      code: 'missing_identity',
      message: `节点 ${nodeId} 条件引用不存在的身份 ${c.identityId}`,
      nodeId,
    })
  }
  if (c.type === 'hasEvidence' && c.evidenceIds) {
    for (const evidenceId of c.evidenceIds) {
      if (!evidenceIds.has(evidenceId)) {
        issues.push({
          levelId,
          code: 'missing_evidence',
          message: `节点 ${nodeId} 条件引用不存在的证据 ${evidenceId}`,
          nodeId,
        })
      }
    }
  }
}

function validateEffectRefs(
  levelId: string,
  nodeId: string,
  effect: { type: string; sourceId?: string; evidenceId?: string },
  sourceIds: Set<string>,
  evidenceIds: Set<string>,
  issues: ValidationIssue[],
) {
  if (effect.type === 'unlockArchive' && effect.sourceId && !sourceIds.has(effect.sourceId)) {
    issues.push({
      levelId,
      code: 'missing_source',
      message: `节点 ${nodeId} 效果引用不存在的来源 ${effect.sourceId}`,
      nodeId,
    })
  }
  if (effect.type === 'revealEvidence' && effect.evidenceId && !evidenceIds.has(effect.evidenceId)) {
    issues.push({
      levelId,
      code: 'missing_evidence',
      message: `节点 ${nodeId} 效果引用不存在的证据 ${effect.evidenceId}`,
      nodeId,
    })
  }
}
