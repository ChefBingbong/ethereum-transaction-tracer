import { hexLenBytes, stringify, trunc, tryDecodePretty } from '@evm-tt/utils'
import pc from 'picocolors'
import type { RpcCallTrace } from '../types'

export const decodePrecompileEcRecover = (
  node: RpcCallTrace,
  label: string,
) => {
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
    inputText: `${pc.bold('ecrecover')} ${stringify(`recover signer for ${inputText}`)}`,
    outputText: `${label} ${stringify(outputText)}`,
  }
}

export const decodePrecompileSha256 = (node: RpcCallTrace, label: string) => {
  const len = hexLenBytes(node.input)
  return {
    name: 'sha256',
    inputText: `${pc.bold('sha256')} ${stringify(`hash ${len} bytes (${trunc(node.input)})`)}`,
    outputText: `${label} ${stringify(node.output ? `hash: ${trunc(node.output)}` : undefined)}`,
  }
}

export const decodePrecompileRipemd160 = (
  node: RpcCallTrace,
  label: string,
) => {
  const len = hexLenBytes(node.input)
  const out =
    tryDecodePretty(['bytes20 hash'], node.output) ??
    (node.output ? `hash: ${trunc(node.output)}` : undefined)
  return {
    name: 'ripemd160',
    inputText: `${pc.bold('ripemd160')} ${stringify(`hash ${len} bytes (${trunc(node.input)})`)}`,
    outputText: `${label} ${stringify(out)}`,
  }
}

export const decodePrecompileIdentity = (node: RpcCallTrace, label: string) => {
  const inLen = hexLenBytes(node.input)
  const outLen = hexLenBytes(node.output ?? '0x')
  const same =
    !!node.output &&
    node.input.toLowerCase() === (node.output as string).toLowerCase()
  return {
    name: 'dataCopy',
    inputText: `${pc.bold('dataCopy')} ${stringify(`(${inLen} bytes: ${trunc(node.input)})`)}`,
    outputText: `${label} ${stringify(
      node.output
        ? `output ${outLen} bytes: ${trunc(node.output)}${same ? ' (identical)' : ''}`
        : '0x',
    )}`,
  }
}
