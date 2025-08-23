import {
  type EventTopic,
  formatArgsInline,
  safeError,
  safeErrorStr,
  safeResult,
  safeSyncTry,
  stringify,
} from '@evm-transaction-trace/core'
import type { AbiFunction, Address, Hex } from 'viem'
import {
  decodeErrorResult,
  decodeEventLog,
  decodeFunctionData,
  decodeFunctionResult,
  getAbiItem,
} from 'viem'
import type { TracerCache } from '../cache'
import { dark } from '../format'
import type { RpcCallTrace } from '../types'

export class Decoder {
  constructor(
    public cache: TracerCache,
    public use4bytesDirectory: boolean,
  ) {}

  public decodeReturnPretty = (fnItem: AbiFunction, output: Hex) => {
    const [error, data] = safeSyncTry(() =>
      decodeFunctionResult({
        abi: [fnItem],
        functionName: fnItem.name,
        data: output,
      }),
    )
    if (error) return safeError(error)
    return safeResult(stringify(data))
  }

  public decodeCallWithNames = (_address: Address, input: Hex) => {
    const selector = this.cache.abiItemFromSelector(input)
    if (!selector) return safeErrorStr('no abi selector in cache')

    const [error, data] = safeSyncTry(() =>
      decodeFunctionData({
        abi: [selector],
        data: input,
      }),
    )
    if (error) return safeError(error)

    const item = getAbiItem({ abi: [selector], name: data.functionName })
    const prettyArgs = Array.isArray(data.args)
      ? data.args.map((arg, i) => stringify(`${dark(item.inputs[i].name)}: ${arg}`)).join(', ')
      : stringify(data.args)

    return safeResult({
      fnName: data.functionName,
      prettyArgs,
      fnItem: item,
    })
  }

  public safeDecodeEvent = (topics: EventTopic, data: Hex) => {
    const event = this.cache.abiEventFromTopic(topics[0])

    const [error, decodedLog] = safeSyncTry(() =>
      decodeEventLog({
        abi: [event],
        topics,
        data: data,
        strict: false,
      }),
    )
    if (error) return safeError(error)
    return safeResult({ name: decodedLog.eventName, args: decodedLog.args })
  }

  decodeRevertPrettyFromFrame(node: RpcCallTrace) {
    if (!node.output) return safeResult(`${node.revertReason ?? node.error}`)
    const errorSel = node.output.slice(0, 10) as Hex

    const abiItem = this.cache.errorDir.get(errorSel)
    if (!abiItem)
      return safeResult(`${node.revertReason ?? node.error} ${node.output.slice(0, 10)}`)

    const [error, decodedError] = safeSyncTry(() =>
      decodeErrorResult({ abi: [abiItem], data: node.output }),
    )
    if (error) return safeResult(`${node.revertReason ?? node.error} ${node.output.slice(0, 10)}`)

    return safeResult(
      `${decodedError.errorName}(${decodedError.args ? decodedError.args.map(formatArgsInline).join(', ') : ''})`,
    )
  }
}
