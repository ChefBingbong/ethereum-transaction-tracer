import { stringify, truncate } from '@evm-tt/utils'
import type { AbiFunction } from 'viem'
import type { TracerCache } from '../../cache'
import { safeDecodeCallData } from '../../decoder'
import { LogVerbosity, type RpcCallTrace } from '../../types'
import {
  dark,
  getCallOriginLabel,
  getCallTypeLabel,
  getDefaultContractCallLabel,
  getGasBadge,
  getStyledCallLabel,
  getValueBadge,
  white,
} from '../theme'

export const formatCall = (
  node: RpcCallTrace,
  cache: TracerCache,
  abiItem: AbiFunction[],
) => {
  const originLabel = getCallOriginLabel(node, cache)
  const callTypeLabel = getCallTypeLabel(node.type)
  const valueBadge = getValueBadge(node, LogVerbosity.Highest)
  const gasBadge = getGasBadge(node, LogVerbosity.Highest)

  const callMethodLabel = formatContractCall(
    node,
    abiItem,
    LogVerbosity.Highest,
  )
  return `${originLabel}::${callMethodLabel} ${callTypeLabel} ${valueBadge}${gasBadge}`
}

export function formatContractCall(
  node: RpcCallTrace,
  abiItem: AbiFunction[],
  verbosity: LogVerbosity,
) {
  const [error, decodedCall] = safeDecodeCallData(abiItem, node.input)
  if (error) return getDefaultContractCallLabel()

  const prettifiedArgs = decodedCall.args.map((arg: any[]) => {
    return `${dark(arg[0])}: ${stringify(arg[1])}`
  })

  const fnName = decodedCall.functionName
  const styled = getStyledCallLabel(node, fnName)

  return verbosity < LogVerbosity.Medium
    ? `${styled}()`
    : `${styled}(${prettifiedArgs.join(', ')})`
}

export const formatDefault = (node: RpcCallTrace, cache: TracerCache) => {
  const left = getCallOriginLabel(node, cache)
  const callTypeLabel = getCallTypeLabel(node.type)
  const valueBadge = getValueBadge(node, LogVerbosity.Highest)
  const gasBadge = getGasBadge(node, LogVerbosity.Highest)

  const calld = white(
    node?.input !== '0x' ? `calldata=${truncate(node.input)}` : '()',
  )
  return `${left}::${calld} ${callTypeLabel} ${valueBadge}${gasBadge}`
}
