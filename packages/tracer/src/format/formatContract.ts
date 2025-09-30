import type { AbiFunction } from 'viem'
import type { TracerCache } from '../cache'
import type { RpcCallTrace } from '../types'
import {
  formatCall,
  formatCreateCall,
  formatDefault,
  formatDelegateCall,
  formatSelfDestructCall,
} from './call'

export const formatCalls = (
  node: RpcCallTrace,
  cache: TracerCache,
  abiItem: AbiFunction[],
) => {
  switch (node.type) {
    case 'CALL':
    case 'STATICCALL':
      return formatCall(node, cache, abiItem)
    case 'CALLCODE':
    case 'DELEGATECALL':
      return formatDelegateCall(node, cache, abiItem)
    case 'CREATE':
    case 'CREATE2':
      return formatCreateCall(node, cache)
    case 'SELFDESTRUCT':
      return formatSelfDestructCall(node, cache)
    default:
      return formatDefault(node, cache)
  }
}
