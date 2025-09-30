import { truncate } from '@evm-tt/utils'
import type { TracerCache } from '../../cache'
import { safeDecodeEvent } from '../../decoder'
import { type RpcLogTrace } from '../../types'
import { argVal, emit, eventArgVal, getLogOriginLabel, white } from '../theme'

export function formatLog(
  lastLog: boolean,
  log: RpcLogTrace,
  cache: TracerCache,
  nextPrefix: string,
): string {
  const logPrefix = `${nextPrefix + (lastLog ? '└─ ' : '├─ ')}${emit('emit')}`
  const logMethodBadge = getLogOriginLabel(log.address, cache)
  const eventAbi = cache.abiEventFromTopic(log.topics[0])
  const [error, dec] = safeDecodeEvent(eventAbi, log.topics, log.address)

  if (error) {
    return `${logPrefix} ${logMethodBadge} ${white(
      `topic0=${log.topics?.[0] ?? ''} data=${truncate(log.data)}`,
    )}`
  }
  const argPairs = Object.entries(dec.args ?? {}).map(
    ([k, v]) => `${eventArgVal(k)}: ${argVal(String(v))}`,
  )
  return `${logPrefix} ${emit(dec.eventName)}(${argPairs.join(', ')})`
}
