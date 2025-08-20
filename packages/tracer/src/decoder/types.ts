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
