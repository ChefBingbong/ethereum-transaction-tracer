import type { Abi, AbiFunction, Hex } from 'viem'
import { decodeFunctionData, decodeFunctionResult, getAbiItem } from 'viem'
import type { TracerCache } from '../cache'

export function nameFromSelector(
  input: Hex | undefined,
  cache: TracerCache,
): string | undefined {
  if (!input || input.length < 10) return undefined
  const sel = input.slice(0, 10) as Hex
  const fn = cache.fourByteDir.get(sel)
  if (!fn) return undefined
  const sig = `${fn.name}(${(fn.inputs ?? []).map((i) => i.type).join(',')})`
  return sig
}

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
    return JSON.stringify(data)
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
      ? args.map((arg) => JSON.stringify(arg)).join(', ')
      : JSON.stringify(args)
    return { fnName: functionName, prettyArgs, fnItem: item }
  } catch {
    return {}
  }
}
