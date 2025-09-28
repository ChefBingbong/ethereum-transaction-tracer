import {
  hexLenBytes,
  PRECOMPILE_ADDRESS,
  safeError,
  safeResult,
  trunc,
  tryDecodePretty,
} from '@evm-tt/utils'
import type { RpcCallTrace } from '../types'

export const safeDecodePrecompile = (node: RpcCallTrace) => {
  switch (node.to) {
    case PRECOMPILE_ADDRESS.Ecrecover: {
      return safeResult(decodePrecompileEcRecover(node))
    }
    case PRECOMPILE_ADDRESS.Sha256: {
      return safeResult(decodePrecompileSha256(node))
    }
    case PRECOMPILE_ADDRESS.Ripemd160: {
      return safeResult(decodePrecompileRipemd160(node))
    }
    case PRECOMPILE_ADDRESS.Identity: {
      return safeResult(decodePrecompileIdentity(node))
    }
    default: {
      return safeError(new Error('Invalid precompile type'))
    }
  }
}

export const decodePrecompileEcRecover = (node: RpcCallTrace) => {
  const inputText =
    tryDecodePretty(
      ['bytes32 hash', 'uint256 v', 'uint256 r', 'uint256 s'],
      node.input,
    ) ?? `bytes: ${trunc(node.input)}`

  const outputText =
    tryDecodePretty(['address signer']) ??
    (node.output ? `signer: ${trunc(node.output)}` : undefined)
  return {
    name: 'ecrecover',
    inputText: `recover signer for ${inputText}`,
    outputText,
  }
}

const decodePrecompileSha256 = (node: RpcCallTrace) => {
  const len = hexLenBytes(node.input)
  return {
    name: 'sha256',
    inputText: `hash ${len} bytes (${trunc(node.input)})`,
    outputText: node.output ? `hash: ${trunc(node.output)}` : undefined,
  }
}

const decodePrecompileRipemd160 = (node: RpcCallTrace) => {
  const len = hexLenBytes(node.input)
  const out =
    tryDecodePretty(['bytes20 hash'], node.output) ??
    (node.output ? `hash: ${trunc(node.output)}` : undefined)
  return {
    name: 'ripemd160',
    inputText: `hash ${len} bytes (${trunc(node.input)})`,
    outputText: out,
  }
}

const decodePrecompileIdentity = (node: RpcCallTrace) => {
  const inLen = hexLenBytes(node.input)
  const outLen = hexLenBytes(node.output ?? '0x')
  const same =
    !!node.output &&
    node.input.toLowerCase() === (node.output as string).toLowerCase()
  return {
    name: 'dataCopy',
    inputText: `(${inLen} bytes: ${trunc(node.input)})`,
    outputText: node.output
      ? `output ${outLen} bytes: ${trunc(node.output)}${same ? ' (identical)' : ''}`
      : '0x',
  }
}
