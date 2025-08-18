// precompilesPretty.ts
import type { Address, Hex } from 'viem'
import { decodeAbiParameters, hexToBigInt } from 'viem'

const toAddr = (n: number): Address =>
  `0x${n.toString(16).padStart(40, '0')}` as Address

type KV = Record<string, string>

function hs(hex: Hex | string, startBytes: number, byteLen: number): Hex {
  const h = hex.startsWith('0x') ? hex.slice(2) : hex
  const s = startBytes * 2
  const e = s + byteLen * 2
  return `0x${h.slice(s, e)}` as Hex
}

function hexLenBytes(hex?: Hex): number {
  if (!hex) return 0
  const h = hex.startsWith('0x') ? hex.slice(2) : hex
  return Math.ceil(h.length / 2)
}

function trunc(hex: Hex | string | undefined, max = 32): string {
  if (!hex) return '0x'
  const h = typeof hex === 'string' ? hex : String(hex)
  const s = h.length <= 2 + max ? h : `${h.slice(0, 2 + max)}…`
  return s
}

function kvList(obj: KV): string {
  const parts: string[] = []
  for (const [k, v] of Object.entries(obj)) parts.push(`${k}: ${v}`)
  return parts.join(', ')
}

/** viem decode with "type name" support; on failure returns raw bytes label */
function tryDecodePretty(spec: string[], data?: Hex): string | undefined {
  if (!data || data === '0x') return undefined
  try {
    const params = spec.map((s) => {
      const i = s.indexOf(' ')
      if (i === -1) return { type: s } as const
      return { type: s.slice(0, i), name: s.slice(i + 1) } as const
    })
    const values = decodeAbiParameters(params as any, data) as unknown[]
    const out: KV = {}
    for (let i = 0; i < params.length; i++) {
      const name = (params[i] as any).name ?? String(i)
      let val = values[i] as any
      if (typeof val === 'bigint') val = val.toString()
      if (typeof val === 'string') val = trunc(val)
      out[name] = String(val)
    }
    return kvList(out)
  } catch {
    return `data: ${trunc(data)}`
  }
}

/** EIP-198 modexp input parser */
function parseModExpInput(input: Hex) {
  const baseLen = hexToBigInt(hs(input, 0, 32))
  const expLen = hexToBigInt(hs(input, 32, 32))
  const modLen = hexToBigInt(hs(input, 64, 32))
  const start = 96
  const base = hs(input, start, Number(baseLen))
  const exp = hs(input, start + Number(baseLen), Number(expLen))
  const mod = hs(
    input,
    start + Number(baseLen) + Number(expLen),
    Number(modLen),
  )
  return { baseLen, expLen, modLen, base, exp, mod }
}

/** EIP-197 pairing input parser: 6 words per pair */
function parsePairingInput(input: Hex) {
  const data = input.startsWith('0x') ? input.slice(2) : input
  const words: string[] = []
  for (let i = 0; i + 64 <= data.length; i += 64)
    words.push(data.slice(i, i + 64))
  const pairs: {
    x1: Hex
    y1: Hex
    x2_c0: Hex
    x2_c1: Hex
    y2_c0: Hex
    y2_c1: Hex
  }[] = []
  for (let i = 0; i + 6 <= words.length; i += 6) {
    pairs.push({
      x1: `0x${words[i + 0]}`,
      y1: `0x${words[i + 1]}`,
      x2_c0: `0x${words[i + 2]}`,
      x2_c1: `0x${words[i + 3]}`,
      y2_c0: `0x${words[i + 4]}`,
      y2_c1: `0x${words[i + 5]}`,
    })
  }
  const consumed = pairs.length * 6 * 32
  const total = hexLenBytes(input)
  const leftover = total - consumed
  return { pairs, leftover }
}

export type PrecompilePretty = {
  name: string
  inputText: string
  outputText?: string
}

/** Pretty format for common precompiles (0x01..0x09). Returns null if not a precompile. */
export function formatPrecompilePretty(
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
          tryDecodePretty(
            ['bytes32 hash', 'uint256 v', 'uint256 r', 'uint256 s'],
            input,
          ) ?? `bytes: ${trunc(input)}`
        const outputText =
          tryDecodePretty(['address signer'], ret) ??
          (ret ? `signer: ${trunc(ret)}` : undefined)
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
          tryDecodePretty(['bytes20 hash'], ret) ??
          (ret ? `hash: ${trunc(ret)}` : undefined)
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
        const same =
          !!ret && input.toLowerCase() === (ret as string).toLowerCase()
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
        const { baseLen, expLen, modLen, base, exp, mod } =
          parseModExpInput(input)
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
          tryDecodePretty(
            ['uint256 x1', 'uint256 y1', 'uint256 x2', 'uint256 y2'],
            input,
          ) ?? `args: ${trunc(input)}`
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
            .join('; ') +
          (pairs.length > 2 ? `; …(${pairs.length - 2} more)` : '')
        const tail = leftover > 0 ? `; leftover ${leftover} byte(s)` : ''
        const inputText = `${head}${pairs.length ? ` — ${details}` : ''}${tail}`
        const outputText =
          tryDecodePretty(['bool success'], ret) ??
          (ret ? `success: ${trunc(ret)}` : undefined)
        return { name: 'alt_bn128_pairing', inputText, outputText }
      }

      // 0x09: blake2f (EIP-152)
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
