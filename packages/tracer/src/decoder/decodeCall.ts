import type { Abi, AbiFunction, Hex } from 'viem'
import { decodeFunctionData, decodeFunctionResult, getAbiItem } from 'viem'
import { stringify } from './utils'

export function decodeReturnPretty(
  fnItem: AbiFunction | undefined,
  output?: Hex,
): string | undefined {
  if (!fnItem || !output || output === '0x') return undefined
  try {
    const data = decodeFunctionResult({
      abi: [fnItem],
      functionName: fnItem.name,
      data: output,
    })
    return stringify(data)
  } catch {
    return undefined
  }
}
export function decodeCallWithNames(
  abi: Abi | undefined,
  input?: Hex,
): { fnName?: string; prettyArgs?: string; fnItem?: AbiFunction } {
  if (!abi || !input || input === '0x') return {}
  try {
    const { functionName, args } = decodeFunctionData({ abi, data: input })
    const item = getAbiItem({ abi, name: functionName }) as
      | AbiFunction
      | undefined
    const prettyArgs = Array.isArray(args)
      ? args.map(stringify).join(', ')
      : stringify(args)
    return { fnName: functionName, prettyArgs, fnItem: item }
  } catch {
    return {}
  }
}
