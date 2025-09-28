import { defaultRevert, formatArgsInline, truncate } from '@evm-tt/utils'
import {
  type Abi,
  type AbiFunction,
  erc1155Abi,
  erc20Abi,
  erc4626Abi,
  erc721Abi,
  type Hex,
  multicall3Abi,
} from 'viem'
import type { TracerCache } from '../cache'
import {
  safeDecodeCallData,
  safeDecodeCallResult,
  safeDecodeCallRevert,
} from '../decoder'
import type { RpcCallTrace } from '../types'
import { dim, retData, retLabel, revData, revLabel } from './theme'

export function printReturn(
  node: RpcCallTrace,
  abiItem: AbiFunction[],
  nextPrefix: string,
) {
  const returnLabel = `${nextPrefix}${retLabel('[Return]')}`
  const [callError, decodedCall] = safeDecodeCallData(abiItem, node.input)
  if (callError)
    return `${returnLabel} ${node.output ? truncate(node.output) : dim('()')}`

  const functionAbi = (erc20Abi as Abi)
    .concat(abiItem)
    .concat(erc721Abi)
    .concat(erc1155Abi)
    .concat(erc4626Abi)
    .concat(multicall3Abi)
    .find(
      (abi): abi is AbiFunction =>
        abi.type === 'function' && abi.name === decodedCall.functionName,
    )

  if (functionAbi) {
    const [returnError, decodedReturn] = safeDecodeCallResult(
      functionAbi,
      node.output,
    )
    if (returnError) return `${returnLabel} ${truncate(node.output)}`
    return `${returnLabel} ${retData(decodedReturn)}`
  }
  return `${returnLabel} ${truncate(node.output)}`
}

export function printRevert(
  node: RpcCallTrace,
  cache: TracerCache,

  nextPrefix: string,
) {
  const revertPrefix = `${nextPrefix}${revLabel('[Revert]')}`
  if (!node.output) return `${revertPrefix} ${revData(defaultRevert(node))}`
  const errorSel = node.output.slice(0, 10) as Hex

  const abiItem = cache.errorDir.get(errorSel)
  if (!abiItem) return `${revertPrefix} ${revData(defaultRevert(node))}`

  const [error, revertData] = safeDecodeCallRevert([abiItem], node.output)

  if (error) return `${revertPrefix} ${revData(defaultRevert(node))}`
  return `${revertPrefix} ${revData(`${revertData.errorName}(${revertData.args ? revertData.args.map(formatArgsInline).join(', ') : ''})`)}`
}
