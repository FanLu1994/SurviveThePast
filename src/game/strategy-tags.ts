import type { StrategyTag } from './types'

export const STRATEGY_LABELS: Record<StrategyTag, string> = {
  rely_on_relations: '依靠关系',
  follow_institution: '遵循制度',
  exchange_resources: '交换资源',
  labor_trade: '劳动换取',
  conceal_identity: '隐瞒伪装',
  avoid_transfer: '回避转移',
}
