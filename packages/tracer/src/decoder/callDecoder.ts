import {
  type EventTopic,
  safeError,
  safeResult,
  safeSyncTry,
  stringify,
} from '@evm-tt/utils'
import type { Abi, AbiEvent, AbiFunction, Hex } from 'viem'
import {
  decodeErrorResult,
  decodeEventLog,
  decodeFunctionData,
  decodeFunctionResult,
  getAbiItem,
} from 'viem'

export const safeDecodeCallResult = (fnItem: AbiFunction, output: Hex) => {
  const [error, decodedCallResult] = safeSyncTry(() =>
    decodeFunctionResult({
      abi: [fnItem],
      functionName: fnItem.name,
      data: output,
    }),
  )
  if (error) return safeError(error)
  return safeResult(decodedCallResult ? stringify(decodedCallResult) : output)
}

export const safeDecodeCallRevert = (fnItem: Abi, output: Hex) => {
  const [error, decodedError] = safeSyncTry(() =>
    decodeErrorResult({ abi: fnItem, data: output }),
  )
  return error ? safeError(error) : safeResult(decodedError)
}

export const safeDecodeCallData = (abiItem: AbiFunction[], input: Hex) => {
  const [error, data] = safeSyncTry(() =>
    decodeFunctionData({
      abi: abiItem,
      data: input,
    }),
  )

  if (error) return safeError(error)

  const item = getAbiItem({
    abi: abiItem,
    name: data.functionName,
  })
  return safeResult({
    ...data,
    item,
    args: (data.args ?? []).map((a, i) => {
      if (!item.inputs[i].name) return ['', a]
      return [item.inputs[i].name, a]
    }),
  })
}

export const safeDecodeEvent = (
  event: AbiEvent,
  topics: EventTopic,
  data: Hex,
) => {
  const [error, decodedLog] = safeSyncTry(() =>
    decodeEventLog({
      abi: [event],
      topics,
      data: data,
      strict: false,
    }),
  )
  return error ? safeError(error) : safeResult(decodedLog)
}
