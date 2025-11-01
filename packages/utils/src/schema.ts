import { InvalidArgumentError } from '@commander-js/extra-typings'
import { Address as zAddress } from 'abitype/zod'
import type { Hex } from 'viem'
import z from 'zod'
import type { ZodSchema } from 'zod/v3'

export const zHex = z
  .string()
  .regex(/^(0x)?[a-fA-F0-9]+$/)
  .transform((val) =>
    val.startsWith('0x') ? (val as Hex) : (`0x${val}` as Hex),
  )
  .refine((val) => val.startsWith('0x'), 'Invalid Hex string format')

function isValidHttpUrl(v: string) {
  try {
    const u = new URL(v)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

export const validateApiKey = (v: string) => {
  if (!v || v.length === 0) return 'API key cannot be empty'
}

export const validateChainId = (v: string) => {
  if (!/^\d+$/.test(String(v))) return 'Must be a number'
}

export function validateRpcUrl(v: string) {
  if (!isValidHttpUrl(String(v))) return 'Must be a valid http(s) URL'
}

export const validateSchema = <Unit>(
  value: string,
  schema: ZodSchema,
): Unit => {
  const out = schema.safeParse(value)
  if (!out.success)
    throw new InvalidArgumentError(`Invalid numeric value ${value}`)
  return out.data as Unit
}

export { zAddress }
