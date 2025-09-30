import type { TracerCache } from '../../cache'
import { LogVerbosity, type RpcCallTrace } from '../../types'
import {
  getCallOriginLabel,
  getCallTypeLabel,
  getGasBadge,
  getSelfDestructMethodLabel,
  getValueBadge,
} from '../theme'

export const formatSelfDestructCall = (
  node: RpcCallTrace,
  cache: TracerCache,
) => {
  const createdLabel = getCallOriginLabel(node, cache)
  const callTypeLabel = getCallTypeLabel(node.type)
  const valueBadge = getValueBadge(node, LogVerbosity.Highest)
  const gasBadge = getGasBadge(node, LogVerbosity.Highest)

  const callMethodLabel = getSelfDestructMethodLabel(!!node?.error)
  return `${createdLabel}::${callMethodLabel} ${callTypeLabel} ${valueBadge}${gasBadge}`
}
