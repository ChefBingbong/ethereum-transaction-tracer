import { Address as zAddress } from 'abitype/zod'
import type { Hex } from 'viem'
import z from 'zod'

export const zHex = z
  .string()
  .regex(/^(0x)?[a-fA-F0-9]+$/)
  .transform((val) =>
    val.startsWith('0x') ? (val as Hex) : (`0x${val}` as Hex),
  )
  .refine((val) => val.startsWith('0x'), 'Invalid Hex string format')

// export const TraceTxArgs = BaseTraceSchema.safeExtend({
//   hash: z.string().regex(Hex32, 'Expected 0x-prefixed 32-byte tx hash'),
// }).superRefine((v, ctx) => {
//   if (!v.rpc && !v.chainId) {
//     ctx.addIssue({
//       code: z.ZodIssueCode.custom,
//       message: 'Provide either --rpc or --chain-id (to resolve RPC from env).',
//       path: ['rpc'],
//     })
//   }
// })

export { zAddress }
