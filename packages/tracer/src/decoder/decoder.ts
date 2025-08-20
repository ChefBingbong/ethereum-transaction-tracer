import type { AbiFunction, Address, Hex } from 'viem'
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
  hexLenBytes,
  hs,
  kvList,
  type PrecompilePretty,
  parseModExpInput,
  parsePairingInput,
  stringify,
  toAddr,
  trunc,
  tryDecodeErrorString,
  tryDecodePanic,
  tryDecodePretty,
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
    if (!input || input === '0x') return {}

    const selector = this.cache.fourByteDir.get(input?.slice(0, 10).toLowerCase() as Hex)
    if (!selector) return {}

    try {
      const { functionName, args } = decodeFunctionData({
        abi: [selector],
        data: input,
      })
      const item = getAbiItem({ abi: [selector], name: functionName }) as AbiFunction | undefined
      const prettyArgs = Array.isArray(args) ? args.map(stringify).join(', ') : stringify(args)
      return { fnName: functionName, prettyArgs, fnItem: item }
    } catch {
      return {}
    }
  }

  public safeDecodeEvent = (
    topics: [signature: `0x${string}`, ...args: `0x${string}`[]] | undefined,
    data: Hex | undefined,
  ) => {
    if (!topics || topics.length === 0) return {}
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

  decodeRevertPrettyFromFrame(data: Hex | undefined) {
    if (!data || data === '0x') return null
    const abis = this.cache.extraAbis
    for (const abi of abis) {
      try {
        const dec = decodeErrorResult({ abi, data })
        // Standard Error(string)
        if (dec.errorName === 'Error' && Array.isArray(dec.args) && dec.args.length === 1) {
          return `Error(${JSON.stringify(dec.args[0])})`
        }
        // Standard Panic(uint256)
        if (dec.errorName === 'Panic' && Array.isArray(dec.args) && dec.args.length === 1) {
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
        const data = n.output && n.output !== '0x' ? (n.output as Hex) : undefined
        if (!best.frame || (data && !best.data)) {
          best = { frame: n, addr: n.to as Address | undefined, data }
        }
      }
      if (n.calls) for (const c of n.calls) walk(c)
    }
    walk(node)
    return best
  }

  formatPrecompilePretty(
    address: Address | string | undefined,
    input: Hex,
    ret?: Hex,
  ): PrecompilePretty | null {
    if (!address) return null
    const addr = address.toLowerCase() as Address
    try {
      switch (addr) {
        // 0x01: ecrecover
        case toAddr(1): {
          const inputText =
            tryDecodePretty(['bytes32 hash', 'uint256 v', 'uint256 r', 'uint256 s'], input) ??
            `bytes: ${trunc(input)}`
          const outputText =
            tryDecodePretty(['address signer'], ret) ?? (ret ? `signer: ${trunc(ret)}` : undefined)
          return {
            name: 'ecrecover',
            inputText: `recover signer for ${inputText}`,
            outputText,
          }
        }

        // 0x02: sha256(bytes) -> bytes32
        case toAddr(2): {
          const len = hexLenBytes(input)
          return {
            name: 'sha256',
            inputText: `hash ${len} bytes (${trunc(input)})`,
            outputText: ret ? `hash: ${trunc(ret)}` : undefined,
          }
        }

        // 0x03: ripemd160(bytes) -> bytes20 (padded to 32 bytes)
        case toAddr(3): {
          const len = hexLenBytes(input)
          const out =
            tryDecodePretty(['bytes20 hash'], ret) ?? (ret ? `hash: ${trunc(ret)}` : undefined)
          return {
            name: 'ripemd160',
            inputText: `hash ${len} bytes (${trunc(input)})`,
            outputText: out,
          }
        }

        // 0x04: identity(bytes) -> same bytes
        case toAddr(4): {
          const inLen = hexLenBytes(input)
          const outLen = hexLenBytes(ret ?? '0x')
          const same = !!ret && input.toLowerCase() === (ret as string).toLowerCase()
          return {
            name: 'dataCopy',
            inputText: `(${inLen} bytes: ${trunc(input)})`,
            outputText: ret
              ? `output ${outLen} bytes: ${trunc(ret)}${same ? ' (identical)' : ''}`
              : '0x',
          }
        }

        // 0x05: modexp (EIP-198)
        case toAddr(5): {
          const { baseLen, expLen, modLen, base, exp, mod } = parseModExpInput(input)
          const inputText =
            `compute (base^exp) mod mod where ` +
            kvList({
              baseLen: String(baseLen),
              expLen: String(expLen),
              modLen: String(modLen),
              base: trunc(base),
              exp: trunc(exp),
              mod: trunc(mod),
            })
          let result: string | undefined
          if (ret && modLen > 0n) {
            const sliced = hs(ret, 0, Number(modLen))
            result = `result: ${trunc(sliced)} (${modLen.toString()} bytes)`
          } else if (ret) {
            result = `result: ${trunc(ret)}`
          }
          return {
            name: 'modexp',
            inputText,
            outputText: result,
          }
        }

        // 0x06: alt_bn128 add (EIP-196)
        case toAddr(6): {
          const inputText =
            tryDecodePretty(['uint256 x1', 'uint256 y1', 'uint256 x2', 'uint256 y2'], input) ??
            `args: ${trunc(input)}`
          const outputText =
            tryDecodePretty(['uint256 x', 'uint256 y'], ret) ??
            (ret ? `point: ${trunc(ret)}` : undefined)
          return { name: 'alt_bn128_add', inputText, outputText }
        }

        // 0x07: alt_bn128 mul (EIP-196)
        case toAddr(7): {
          const inputText =
            tryDecodePretty(['uint256 x1', 'uint256 y1', 'uint256 s'], input) ??
            `args: ${trunc(input)}`
          const outputText =
            tryDecodePretty(['uint256 x', 'uint256 y'], ret) ??
            (ret ? `point: ${trunc(ret)}` : undefined)
          return { name: 'alt_bn128_mul', inputText, outputText }
        }

        // 0x08: pairing (EIP-197)
        case toAddr(8): {
          const { pairs, leftover } = parsePairingInput(input)
          const head = `check pairing for ${pairs.length} pair(s)`
          const details =
            pairs
              .slice(0, 2) // show first two pairs verbosely to keep output compact
              .map(
                (p, i) =>
                  `pair${i + 1}(${kvList({
                    x1: trunc(p.x1),
                    y1: trunc(p.y1),
                    x2_c0: trunc(p.x2_c0),
                    x2_c1: trunc(p.x2_c1),
                    y2_c0: trunc(p.y2_c0),
                    y2_c1: trunc(p.y2_c1),
                  })})`,
              )
              .join('; ') + (pairs.length > 2 ? `; …(${pairs.length - 2} more)` : '')
          const tail = leftover > 0 ? `; leftover ${leftover} byte(s)` : ''
          const inputText = `${head}${pairs.length ? ` — ${details}` : ''}${tail}`
          const outputText =
            tryDecodePretty(['bool success'], ret) ?? (ret ? `success: ${trunc(ret)}` : undefined)
          return { name: 'alt_bn128_pairing', inputText, outputText }
        }

        case toAddr(9): {
          const data = input.startsWith('0x') ? input.slice(2) : input
          const rounds = Number(`0x${data.slice(0, 8)}`)
          const h = `0x${data.slice(8, 8 + 128)}`
          const m = `0x${data.slice(136, 136 + 256)}`
          const t = `0x${data.slice(392, 392 + 32)}`
          const f = `0x${data.slice(424, 424 + 2)}`
          return {
            name: 'blake2f',
            inputText: kvList({
              rounds: String(rounds),
              h: trunc(h),
              m: trunc(m),
              t: trunc(t),
              f: trunc(f),
            }),
            outputText: ret ? `h': ${trunc(ret)}` : undefined,
          }
        }

        default:
          return null
      }
    } catch {
      return null
    }
  }
}
