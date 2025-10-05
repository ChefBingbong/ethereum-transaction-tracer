import { LogVerbosity, type RpcCallTrace } from '../..//types'
import {
  getCallOriginLabel,
  getCallTypeLabel,
  getGasBadge,
  getSelfDestructMethodLabel,
  getValueBadge,
} from '../theme'

export const formatSelfDestructCall = (
  node: RpcCallTrace,
  contractName?: string,
) => {
  const createdLabel = getCallOriginLabel(node, contractName)
  const callTypeLabel = getCallTypeLabel(node.type)
  const valueBadge = getValueBadge(node, LogVerbosity.Highest)
  const gasBadge = getGasBadge(node, LogVerbosity.Highest)

  const callMethodLabel = getSelfDestructMethodLabel(!!node?.error)
  return `${createdLabel}::${callMethodLabel} ${callTypeLabel} ${valueBadge}${gasBadge}`
}
