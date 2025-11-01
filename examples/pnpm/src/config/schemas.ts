import type { Hex } from 'viem'
import { z } from 'zod'

export type NodeEnv = z.infer<typeof zNodeEnv>

export const zNodeEnv = z.enum(['production', 'development', 'local'])

export const zPort = (defaultPort = 80) =>
  z.coerce.number().default(defaultPort)

export const zEVMPrivateKey = z
  .string()
  .regex(/^(0x)?[a-fA-F0-9]{64}$/)
  .transform((val) =>
    val.startsWith('0x') ? (val as Hex) : (`0x${val}` as Hex),
  )
  .refine(
    (val) => val.length === 66 && val.startsWith('0x'),
    'Invalid Ethereum private key format',
  )
