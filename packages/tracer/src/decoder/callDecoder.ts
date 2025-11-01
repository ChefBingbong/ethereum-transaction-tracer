import { safeError, safeResult, safeSyncTry, stringify } from '@evm-tt/utils'
import {
  type Abi,
  type AbiEvent,
  type AbiFunction,
  decodeErrorResult,
  decodeEventLog,
  decodeFunctionData,
  decodeFunctionResult,
  type Hex,
} from 'viem'
import type { EventTopic } from '../types'

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

export const safeDecodeEvent = (
  event: AbiEvent | undefined,
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
  return safeResult({
    ...data,
    item: abiItem[0],
    args: (data.args ?? []).map((a, i) => {
      if (!abiItem[0].inputs[i].name) return [`arg${i}`, a]
      return [abiItem[0].inputs[i].name, a]
    }),
  })
}
