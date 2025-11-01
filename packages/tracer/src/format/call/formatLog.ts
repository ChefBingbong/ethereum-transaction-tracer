import { slice } from 'viem'
import { abiEventFromTopic } from '../../cache'
import { safeDecodeEvent } from '../../decoder'
import type { CacheObj, RpcLogTrace } from '../../types'
import { argVal, emit, eventArgVal, getLogOriginLabel, white } from '../theme'

export function formatLog(
  lastLog: boolean,
  log: RpcLogTrace,
  cache: CacheObj,
  nextPrefix: string,
): string {
  const logPrefix = `${nextPrefix + (lastLog ? '└─ ' : '├─ ')}${emit('emit')}`
  const logMethodBadge = getLogOriginLabel(log.address)
  const eventAbi = abiEventFromTopic(cache, log.topics[0])

  const [error, dec] = safeDecodeEvent(eventAbi, log.topics, log.address)

  if (error) {
    return `${logPrefix} ${logMethodBadge} ${white(
      `topic0=${log.topics?.[0] ?? ''} data=${slice(log.data, 0, 64)}`,
    )}`
  }
  const argPairs = Object.entries(dec.args ?? {}).map(
    ([k, v]) => `${eventArgVal(k)}: ${argVal(String(v))}`,
  )
  return `${logPrefix} ${emit(dec.eventName)}(${argPairs.join(', ')})`
}
