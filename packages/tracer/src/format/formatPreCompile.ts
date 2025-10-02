import { PRECOMPILE_ADDRESS } from '@evm-tt/utils'
import type { TracerCache } from '../cache'
import {
  decodePrecompileEcRecover,
  decodePrecompileIdentity,
  decodePrecompileRipemd160,
  decodePrecompileSha256,
} from '../decoder'
import { LogVerbosity, type RpcCallTrace } from '../types'
import {
  getCallOriginLabel,
  getCallTypeLabel,
  getGasBadge,
  getValueBadge,
} from './theme'

export const formatPrecompileCall = (
  node: RpcCallTrace,
  cache: TracerCache,
) => {
  const left = getCallOriginLabel(node, cache)
  const method = safeDecodePrecompile(node, '').inputText
  const callTypeLabel = getCallTypeLabel(node.type)
  const valueBadge = getValueBadge(node, LogVerbosity.Highest)
  const gasBadge = getGasBadge(node, LogVerbosity.Highest)
  return `${left}::${method} ${callTypeLabel} ${valueBadge}${gasBadge}`
}

export const safeDecodePrecompile = (node: RpcCallTrace, label: string) => {
  switch (node.to) {
    case PRECOMPILE_ADDRESS.Ecrecover: {
      return decodePrecompileEcRecover(node, label)
    }
    case PRECOMPILE_ADDRESS.Sha256: {
      return decodePrecompileSha256(node, label)
    }
    case PRECOMPILE_ADDRESS.Ripemd160: {
      return decodePrecompileRipemd160(node, label)
    }
    case PRECOMPILE_ADDRESS.Identity: {
      return decodePrecompileIdentity(node, label)
    }
    default: {
      throw new Error('option not supported')
    }
  }
}
