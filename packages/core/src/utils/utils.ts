import { type Address, type Hex, hexToBigInt } from 'viem'

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

export type EventTopic = [signature: `0x${string}`, ...args: `0x${string}`[]]

export type PrecompilePretty = {
  name: string
  inputText: string
  outputText?: string
}

export const toAddr = (n: number): Address => `0x${n.toString(16).padStart(40, '0')}` as Address

export function hs(hex: Hex | string, startBytes: number, byteLen: number): Hex {
  const h = hex.startsWith('0x') ? hex.slice(2) : hex
  const s = startBytes * 2
  const e = s + byteLen * 2
  return `0x${h.slice(s, e)}` as Hex
}

export function hexLenBytes(hex?: Hex): number {
  if (!hex) return 0
  const h = hex.startsWith('0x') ? hex.slice(2) : hex
  return Math.ceil(h.length / 2)
}

export function parseModExpInput(input: Hex) {
  const baseLen = hexToBigInt(hs(input, 0, 32))
  const expLen = hexToBigInt(hs(input, 32, 32))
  const modLen = hexToBigInt(hs(input, 64, 32))
  const start = 96
  const base = hs(input, start, Number(baseLen))
  const exp = hs(input, start + Number(baseLen), Number(expLen))
  const mod = hs(input, start + Number(baseLen) + Number(expLen), Number(modLen))
  return { baseLen, expLen, modLen, base, exp, mod }
}

/** EIP-197 pairing input parser: 6 words per pair */
export function parsePairingInput(input: Hex) {
  const data = input.startsWith('0x') ? input.slice(2) : input
  const words: string[] = []
  for (let i = 0; i + 64 <= data.length; i += 64) words.push(data.slice(i, i + 64))
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
