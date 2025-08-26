import { zAddress, zHex } from '@evm-tt/utils'
import z from 'zod'
import { EVM_TT_ERRORS } from '../utils/error'
import { getRpcFromEnv } from './env'

export const etherscanAbiSchema = z.object({
  status: z.string(),
  message: z.string(),
})

export const VerbosityEnum = z.enum(['Low', 'Medium', 'High', 'Highest'])

export const baseTraceSchema = z.object({
  rpc: z.url({ error: EVM_TT_ERRORS.RPC }),
  chainId: z.coerce.number({ error: EVM_TT_ERRORS.ChainId }),
  etherscanKey: z.string({ error: EVM_TT_ERRORS.EtherscanKey }),
  cachePath: z.string().optional(),
  verbosity: VerbosityEnum.default('Highest'),
})

export const traceTxArgs = baseTraceSchema.safeExtend({
  hash: zHex,
})

export type traceTxArgs = z.infer<typeof traceTxArgs>

export const traceGasTxArgs = traceTxArgs.safeExtend({
  gas: z.coerce.bigint().optional(),
})
export type traceGasTxArgs = z.infer<typeof traceGasTxArgs>

export const traceRequestArgs = baseTraceSchema.safeExtend({
  to: zAddress,
  data: zAddress,
})
export type traceRequestArgs = z.infer<typeof traceRequestArgs>

export const traceGasRequestArgs = traceRequestArgs.safeExtend({
  gas: z.coerce.bigint().optional(),
})
export type traceGasRequestArgs = z.infer<typeof traceGasRequestArgs>

export type RpcKey<Id extends number | string = number> = `RPC_URL_${Id}`

export type CliEnv = {
  ETHERSCAN_API_KEY: string
} & Partial<Record<RpcKey, string>>

export const EnvSchema = z
  .object({
    ETHERSCAN_API_KEY: z.string().min(1),
  })
  .catchall(z.string())

export function resolveAndParseCliParams<T extends z.ZodTypeAny>(
  schema: T,
  env: CliEnv,
  raw: Record<string, unknown>,
): z.ZodSafeParseResult<z.infer<T>> {
  const merged = { ...raw }
  const chainId = merged['chainId']

  if (!merged['etherscanKey']) merged['etherscanKey'] = env.ETHERSCAN_API_KEY
  if (!merged['rpc']) merged['rpc'] = getRpcFromEnv(env, Number(chainId))

  console.log(merged)
  return schema.safeParse(merged)
}
