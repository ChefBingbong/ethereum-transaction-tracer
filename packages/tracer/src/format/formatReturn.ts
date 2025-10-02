import type { AbiFunction } from 'viem'
import type { TracerCache } from '../cache'
import type { RpcCallTrace } from '../types'
import { formatCallReturn, formatCallRevert } from './call'

export const formatReturn = (
  node: RpcCallTrace,
  cache: TracerCache,
  abi: AbiFunction[],
  prefix: string,
) => {
  const hasError = !!node?.error
  switch (hasError) {
    case true:
      return formatCallRevert(node, cache, prefix)
    case false:
      return formatCallReturn(node, abi, prefix)
    default:
      throw new Error('Unsupported return case')
  }
}
