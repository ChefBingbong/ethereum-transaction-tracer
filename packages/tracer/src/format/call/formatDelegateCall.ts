import type { AbiFunction } from 'viem'
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
  abiItem: AbiFunction[] | undefined,
  contractName?: string,
) => {
  const fromLabel = getCallOriginLabel(node, contractName)
  const toLabel = getCallOriginLabel(node, contractName)
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
