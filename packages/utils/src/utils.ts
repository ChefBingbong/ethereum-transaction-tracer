import type { Address, Hex } from 'viem'

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

export const toAddr = (n: number): Address =>
  `0x${n.toString(16).padStart(40, '0')}` as Address

export function hexLenBytes(hex?: Hex): number {
  if (!hex) return 0
  const h = hex.startsWith('0x') ? hex.slice(2) : hex
  return Math.ceil(h.length / 2)
}

export const defaultRevert = (node: {
  output?: string | undefined
  revertReason?: string | undefined
  error?: string | undefined
}) => {
  const selector = node.output ? node.output.slice(0, 10) : undefined
  return `${node.revertReason ?? node.error} ${selector}`
}

export const normalizeHex = (v: string): Hex =>
  (v.startsWith('0x') ? v : `0x${v}`) as Hex

const DIGITS = '0123456789abcdefghijklmnopqrstuvwxyz'
export const digitVal = (c: string) => {
  const i = DIGITS.indexOf(c.toLowerCase())
  if (i === -1) throw new Error(`invalid digit "${c}"`)
  return i
}
export const parseRadix = (s: string) => {
  const r = Number(s)
  if (!Number.isInteger(r) || r < 2 || r > 36)
    throw new Error('base must be an integer between 2 and 36')
  return r
}
export const normalizeHexData = (input: string): Hex => {
  let s = input.trim().toLowerCase()
  if (s.startsWith('0x')) s = s.slice(2)
  if (!/^[0-9a-f]*$/.test(s)) throw new Error('invalid hex characters')
  if (s.length % 2) s = `0${s}`
  return `0x${s}` as Hex
}
export const bigintFromBase = (value: string, base: number) => {
  let negative = false
  let s = value.trim()
  if (s.startsWith('-')) {
    negative = true
    s = s.slice(1)
  }
  if (!s) return 0n
  let out = 0n
  const b = BigInt(base)
  for (const ch of s) {
    const d = digitVal(ch)
    if (d >= base)
      throw new Error(`digit "${ch}" out of range for base ${base}`)
    out = out * b + BigInt(d)
  }
  return negative ? -out : out
}
export const bigintToBase = (n0: bigint, base: number) => {
  if (n0 === 0n) return '0'
  const b = BigInt(base)
  let n = n0 < 0n ? -n0 : n0
  let out = ''
  while (n > 0n) {
    const d = Number(n % b)
    out = DIGITS[d] + out
    n = n / b
  }
  return n0 < 0n ? `-${out}` : out
}
export const parseBigIntFlexible = (v: string): bigint => {
  const s = v.trim()
  if (/^0x[0-9a-fA-F]+$/.test(s)) return BigInt(s)
  if (/^-?(\d)+$/.test(s)) return BigInt(s)
  throw new Error('value must be decimal or 0x-hex')
}
export const unitsToDecimals = (uRaw: string) => {
  const u = uRaw.toLowerCase()
  if (u === 'wei') return 0
  if (u === 'gwei') return 9
  if (u === 'ether' || u === 'eth') return 18
  throw new Error('unit must be one of: wei, gwei, ether')
}
