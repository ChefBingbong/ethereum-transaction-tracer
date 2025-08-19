import type { Abi, AbiFunction, Address, Hex } from 'viem'
import {
  decodeErrorResult,
  decodeEventLog,
  decodeFunctionData,
  decodeFunctionResult,
  getAbiItem,
} from 'viem'

import type { TracerCache } from '../cache'
import type { RpcCallTrace } from '../callTracer'
import {
  formatArgsInline,
  stringify,
  tryDecodeErrorString,
  tryDecodePanic,
} from './utils'

export const PANIC_MAP: Record<number, string> = {
  1: 'assert(false)',
  17: 'arithmetic overflow/underflow',
  18: 'division by zero',
  33: 'enum conversion out of range',
  34: 'invalid storage byte array access',
  49: 'pop on empty array',
  50: 'array out-of-bounds',
  65: 'memory overflow',
  81: 'zero-initialized internal function call',
}

export class Decoder {
  constructor(
    public cache: TracerCache,
    public use4bytesDirectory: boolean,
  ) {}

  public decodeReturnPretty = (
    fnItem: AbiFunction | undefined,
    output?: Hex,
  ): string | undefined => {
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
  public decodeCallWithNames = (_address: Address, input?: Hex) => {
    const sel = input?.slice(0, 10) as Hex
    if (!sel || !input || input === '0x') return {}

    const abi = this.cache.contractAbi.get(_address.toLowerCase())
    if (!abi) {
      const selector = this.cache.fourByteDir.get(sel)
      if (!selector) return {}

      try {
        const { functionName, args } = decodeFunctionData({
          abi: [selector],
          data: input,
        })
        const item = getAbiItem({ abi: [selector], name: functionName }) as
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
    try {
      const { functionName, args } = decodeFunctionData({
        abi,
        data: input,
      })
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

  public safeDecodeEvent = (
    address: Address,
    topics: [signature: `0x${string}`, ...args: `0x${string}`[]] | undefined,
    data: Hex | undefined,
  ) => {
    if (!topics || topics.length === 0) return {}
    const addrKey = address.toLowerCase()
    const abi = this.cache.contractAbi.get(addrKey)
    if (abi) {
      try {
        const dec = decodeEventLog({
          abi,
          topics,
          data: data ?? '0x',
          strict: false,
        })
        const argsObj: Record<string, unknown> = {}

        if (dec.args) {
          if (dec.args && typeof dec.args === 'object') {
            for (const [k, v] of Object.entries(dec.args)) {
              if (!/^\d+$/.test(k)) argsObj[k] = v
            }
          }
          return { name: dec.eventName, args: argsObj }
        }
      } catch {}
    }
    const t0 = topics[0] as Hex
    const ev = this.cache.eventsDir.get(t0)

    if (ev) {
      const dec = decodeEventLog({
        abi: [ev],
        topics,
        data: data ?? '0x',
        strict: false,
      })
      return { name: ev.name, args: dec.args }
    }
    return {}
  }

  decodeRevertPrettyFromFrame(
    addr: Address | undefined,
    data: Hex | undefined,
  ) {
    if (!data || data === '0x') return null
    this.cache.ensureAbi(addr)
    const abis: Abi[] = []
    const extra = this.cache.extraAbis
    if (extra?.length)
      abis.push(...extra, ...this.cache.contractAbi.values().toArray())

    for (const abi of abis) {
      try {
        const dec = decodeErrorResult({ abi, data })
        // Standard Error(string)
        if (
          dec.errorName === 'Error' &&
          Array.isArray(dec.args) &&
          dec.args.length === 1
        ) {
          return `Error(${JSON.stringify(dec.args[0])})`
        }
        // Standard Panic(uint256)
        if (
          dec.errorName === 'Panic' &&
          Array.isArray(dec.args) &&
          dec.args.length === 1
        ) {
          const code = Number(dec.args[0])
          const msg = PANIC_MAP[code] ?? 'panic'
          return `Panic(0x${code.toString(16)}: ${msg})`
        }
        const argsTxt = Array.isArray(dec.args)
          ? dec.args.map(formatArgsInline).join(', ')
          : formatArgsInline(dec.args)
        return `${dec.errorName}(${argsTxt})`
      } catch {
        // try next abi
      }
    }

    return tryDecodeErrorString(data) ?? tryDecodePanic(data) ?? null
  }

  public findDeepestErrorFrame = (
    node: RpcCallTrace,
  ): { frame?: RpcCallTrace; addr?: Address; data?: Hex } => {
    let best: { frame?: RpcCallTrace; addr?: Address; data?: Hex } = {}

    const walk = (n: RpcCallTrace) => {
      if (n.error) {
        const data =
          n.output && n.output !== '0x' ? (n.output as Hex) : undefined
        if (!best.frame || (data && !best.data)) {
          best = { frame: n, addr: n.to as Address | undefined, data }
        }
      }
      if (n.calls) for (const c of n.calls) walk(c)
    }
    walk(node)
    return best
  }
}
