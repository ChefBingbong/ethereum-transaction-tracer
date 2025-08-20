import { safeError, safeErrorStr, safeResult, safeSyncTry } from '@evm-transaction-trace/core'
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
import { type EventTopic, PANIC_MAP } from './types'
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
  tryDecodePanic,
  tryDecodePretty,
} from './utils'

export class Decoder {
  constructor(
    public cache: TracerCache,
    public use4bytesDirectory: boolean,
  ) {}

  public decodeReturnPretty = (fnItem: AbiFunction, output: Hex) => {
    const [error, data] = safeSyncTry(
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

    const [error, data] = safeSyncTry(
      decodeFunctionData({
        abi: [selector],
        data: input,
      }),
    )
    if (error) return safeError(error)

    const item = getAbiItem({ abi: [selector], name: data.functionName })
    const prettyArgs = Array.isArray(data.args)
      ? data.args.map(stringify).join(', ')
      : stringify(data.args)

    return safeResult({
      fnName: data.functionName,
      prettyArgs,
      fnItem: item,
    })
  }

  public safeDecodeEvent = (topics: EventTopic, data: Hex) => {
    const event = this.cache.abiEventFromTopic(topics[0])
    if (!event) return safeErrorStr('no event selector in cache')

    const [error, decodedLog] = safeSyncTry(
      decodeEventLog({
        abi: [event],
        topics,
        data: data ?? '0x',
        strict: false,
      }),
    )
    if (error) return safeError(error)
    return safeResult({ name: decodedLog.eventName, args: decodedLog.args })
  }

  decodeRevertPrettyFromFrame(data: RpcCallTrace) {
    if (!data.output) return safeResult(data.revertReason ?? data.error)
    for (const abi of this.cache.extraAbis) {
      const [error, dec] = safeSyncTry(decodeErrorResult({ abi, data: data.output }))
      if (error) continue

      if (dec.errorName === 'Error' && dec.args && Array.isArray(dec.args)) {
        return safeResult(`Error(${JSON.stringify(dec.args[0])})`)
      }
      if (dec.errorName === 'Panic' && dec.args && Array.isArray(dec.args)) {
        const code = Number(dec.args[0])
        const msg = PANIC_MAP[code] ?? 'panic'
        return safeResult(`Panic(0x${code.toString(16)}: ${msg})`)
      }
      const argsTxt =
        dec.args && Array.isArray(dec.args)
          ? dec.args.map(formatArgsInline).join(', ')
          : formatArgsInline(dec.args)

      return safeResult(`${dec.errorName}(${argsTxt})`)
    }
    const panicError = tryDecodePanic(data.output)
    if (panicError) return safeResult(panicError)

    const errorStr = tryDecodePanic(data.output)
    if (errorStr) return safeResult(errorStr)
    return safeResult(null)
  }

  formatPrecompilePretty(address: Address, input: Hex, ret?: Hex): PrecompilePretty | null {
    try {
      switch (address) {
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
        case toAddr(2): {
          const len = hexLenBytes(input)
          return {
            name: 'sha256',
            inputText: `hash ${len} bytes (${trunc(input)})`,
            outputText: ret ? `hash: ${trunc(ret)}` : undefined,
          }
        }
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
        case toAddr(6): {
          const inputText =
            tryDecodePretty(['uint256 x1', 'uint256 y1', 'uint256 x2', 'uint256 y2'], input) ??
            `args: ${trunc(input)}`
          const outputText =
            tryDecodePretty(['uint256 x', 'uint256 y'], ret) ??
            (ret ? `point: ${trunc(ret)}` : undefined)
          return { name: 'alt_bn128_add', inputText, outputText }
        }

        case toAddr(7): {
          const inputText =
            tryDecodePretty(['uint256 x1', 'uint256 y1', 'uint256 s'], input) ??
            `args: ${trunc(input)}`
          const outputText =
            tryDecodePretty(['uint256 x', 'uint256 y'], ret) ??
            (ret ? `point: ${trunc(ret)}` : undefined)
          return { name: 'alt_bn128_mul', inputText, outputText }
        }

        case toAddr(8): {
          const { pairs, leftover } = parsePairingInput(input)
          const head = `check pairing for ${pairs.length} pair(s)`
          const details =
            pairs
              .slice(0, 2)
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
