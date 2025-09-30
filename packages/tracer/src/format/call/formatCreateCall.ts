import type { TracerCache } from '../../cache'
import { LogVerbosity, type RpcCallTrace } from '../../types'
import {
  getCallOriginLabel,
  getCallTypeLabel,
  getCreateMethodLabel,
  getGasBadge,
  getValueBadge,
} from '../theme'

export const formatCreateCall = (node: RpcCallTrace, cache: TracerCache) => {
  const createdLabel = getCallOriginLabel(node, cache)
  const callTypeLabel = getCallTypeLabel(node.type)
  const valueBadge = getValueBadge(node, LogVerbosity.Highest)
  const gasBadge = getGasBadge(node, LogVerbosity.Highest)

  const callMethodLabel = getCreateMethodLabel(!!node?.error)
  const initLen = `init_code_len=${node.input ? (node.input.length - 2) / 2 : 0}`

  return `${createdLabel}::${callMethodLabel}(${initLen}) ${callTypeLabel} ${valueBadge}${gasBadge}`
}
