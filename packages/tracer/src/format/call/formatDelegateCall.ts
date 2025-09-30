import type { AbiFunction } from 'viem'
import type { TracerCache } from '../../cache'
import { LogVerbosity, type RpcCallTrace } from '../../types'
import {
  getCallOriginLabel,
  getCallTypeLabel,
  getGasBadge,
  getValueBadge,
} from '../theme'
import { formatContractCall } from './formatCall'

export const formatDelegateCall = (
  node: RpcCallTrace,
  cache: TracerCache,
  abiItem: AbiFunction[],
) => {
  const fromLabel = getCallOriginLabel(node, cache)
  const toLabel = getCallOriginLabel(node, cache)
  const callTypeLabel = getCallTypeLabel(node.type)
  const valueBadge = getValueBadge(node, LogVerbosity.Highest)
  const gasBadge = getGasBadge(node, LogVerbosity.Highest)

  const callMethodLabel = formatContractCall(
    node,
    abiItem,
    LogVerbosity.Highest,
  )
  return `${`${fromLabel} → ${toLabel}`}::${callMethodLabel} ${callTypeLabel} ${valueBadge}${gasBadge}`
}
