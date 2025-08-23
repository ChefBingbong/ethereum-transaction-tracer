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

export const toAddr = (n: number): Address => `0x${n.toString(16).padStart(40, '0')}` as Address

export function hexLenBytes(hex?: Hex): number {
  if (!hex) return 0
  const h = hex.startsWith('0x') ? hex.slice(2) : hex
  return Math.ceil(h.length / 2)
}

export const defaultRevert = (node: {
  output: string | undefined
  revertReason: string | undefined
  error: string | undefined
}) => {
  const selector = node.output ? node.output.slice(0, 10) : undefined
  return `${node.revertReason ?? node.error} ${selector}`
}
