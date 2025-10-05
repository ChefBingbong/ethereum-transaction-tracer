import { abiItemFromSelector2 } from '../cache'
import type { CacheObj, RpcCallTrace } from '../types'
import { formatCallReturn, formatCallRevert } from './call'

export const formatReturn = (
  node: RpcCallTrace,
  cache: CacheObj,
  prefix: string,
) => {
  const hasError = !!node?.error
  const abi = abiItemFromSelector2(cache, node.input)
  switch (hasError) {
    case true:
      return formatCallRevert(node, cache, prefix)
    case false:
      return formatCallReturn(node, abi, prefix)
    default:
      throw new Error('Unsupported return case')
  }
}
