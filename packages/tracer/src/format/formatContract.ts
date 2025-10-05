import { abiItemFromSelector2, type CacheObj } from '../cache'
import type { RpcCallTrace } from '../types'
import {
  formatCall,
  formatCreateCall,
  formatDefault,
  formatDelegateCall,
  formatSelfDestructCall,
} from './call'

export const formatCalls = (node: RpcCallTrace, cache: CacheObj) => {
  const contractName = cache.contractNames.get(node?.to)
  const abiItem = abiItemFromSelector2(cache, node.input)

  switch (node.type) {
    case 'CALL':
    case 'STATICCALL':
      return formatCall(node, abiItem, contractName)
    case 'CALLCODE':
    case 'DELEGATECALL':
      return formatDelegateCall(node, abiItem, contractName)
    case 'CREATE':
    case 'CREATE2':
      return formatCreateCall(node, contractName)
    case 'SELFDESTRUCT':
      return formatSelfDestructCall(node, contractName)
    default:
      return formatDefault(node, contractName)
  }
}
