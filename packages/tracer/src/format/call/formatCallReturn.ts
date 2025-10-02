import { truncate } from '@evm-tt/utils'
import {
  type Abi,
  type AbiFunction,
  erc1155Abi,
  erc20Abi,
  erc4626Abi,
  erc721Abi,
  multicall3Abi,
} from 'viem'
import { safeDecodeCallData, safeDecodeCallResult } from '../../decoder'
import type { RpcCallTrace } from '../../types'
import { retData, retLabel, white } from '../theme'

export function formatCallReturn(
  node: RpcCallTrace,
  abiItem: AbiFunction[],
  nextPrefix: string,
) {
  const returnLabel = `${nextPrefix}${retLabel('[Return]')}`
  const [callError, decodedCall] = safeDecodeCallData(abiItem, node.input)
  if (callError)
    return `${returnLabel} ${node.output ? truncate(node.output) : white('()')}`

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
