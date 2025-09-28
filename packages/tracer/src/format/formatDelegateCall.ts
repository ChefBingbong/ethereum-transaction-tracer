import { truncate } from '@evm-tt/utils'
import pc from 'picocolors'
import type { AbiFunction } from 'viem'
import type { TracerCache } from '../cache'
import { safeDecodeEvent } from '../decoder'
import { LogVerbosity, type RpcCallTrace, type RpcLogTrace } from '../types'
import { formatContractCall } from './formatCall'
import {
  addrLabelStyled,
  addrLabelStyled2,
  argVal,
  dim,
  emit,
  eventArgVal,
  fn,
  getSharedBadges,
} from './theme'

export const formatDelegateCall = (
  node: RpcCallTrace,
  cache: TracerCache,
  abiItem: AbiFunction[],
) => {
  const fromLabel = addrLabelStyled2(node, cache)
  const toLabel = addrLabelStyled2(node, cache)
  const left = `${fromLabel} → ${toLabel}`

  const method = formatContractCall(node, cache, abiItem, LogVerbosity.Highest)
  const { typeBadge, valueStr, gasStr, failBadge } = getSharedBadges(
    node,
    LogVerbosity.Highest,
  )
  return `${left}::${method} ${typeBadge} ${valueStr}${gasStr}${failBadge}`
}

export const formatCreateCall = (node: RpcCallTrace, cache: TracerCache) => {
  const created = addrLabelStyled2(node, cache)
  const method = node.error ? pc.bold(pc.red('create')) : fn('create')
  const initLen = `init_code_len=${node.input ? (node.input.length - 2) / 2 : 0}`

  const { typeBadge, valueStr, gasStr, failBadge } = getSharedBadges(
    node,
    LogVerbosity.Highest,
  )
  return `${created}::${method}(${initLen}) ${typeBadge} ${valueStr}${gasStr}${failBadge}`
}

export const formatSeltDestructCall = (
  node: RpcCallTrace,
  cache: TracerCache,
) => {
  const target = addrLabelStyled2(node, cache)
  const method = node.error
    ? pc.bold(pc.red('selfdestruct'))
    : fn('selfdestruct')

  const { typeBadge, valueStr, gasStr, failBadge } = getSharedBadges(
    node,
    LogVerbosity.Highest,
  )
  return `${target}::${method} ${typeBadge} ${valueStr}${gasStr}${failBadge}`
}

export const formatDefault = (node: RpcCallTrace, cache: TracerCache) => {
  const left = addrLabelStyled2(node, cache)
  const { typeBadge, valueStr, gasStr, failBadge } = getSharedBadges(
    node,
    LogVerbosity.Highest,
  )
  const calld = dim(
    node?.input !== '0x' ? `calldata=${truncate(node.input)}` : '()',
  )
  return `${left}::${calld} ${typeBadge} ${valueStr}${gasStr}${failBadge}`
}

export function formatLog(
  lastLog: boolean,
  log: RpcLogTrace,
  cache: TracerCache,
  nextPrefix: string,
): string {
  const logPrefix = `${nextPrefix + (lastLog ? '└─ ' : '├─ ')}${emit('emit')}`
  const eventAbi = cache.abiEventFromTopic(log.topics[0])
  if (!eventAbi) {
    return `${logPrefix} ${addrLabelStyled(log.address, cache)} ${dim(
      `topic0=${log.topics?.[0] ?? ''} data=${truncate(log.data)}`,
    )}`
  }
  const [error, dec] = safeDecodeEvent(eventAbi, log.topics, log.address)

  if (!error) {
    const argPairs = Object.entries(dec.args ?? {}).map(
      ([k, v]) => `${eventArgVal(k)}: ${argVal(String(v))}`,
    )
    return `${logPrefix} ${emit(dec.eventName)}(${argPairs.join(', ')})`
  }
  return `${logPrefix} ${addrLabelStyled(log.address, cache)} ${dim(
    `topic0=${log.topics?.[0] ?? ''} data=${truncate(log.data)}`,
  )}`
}
