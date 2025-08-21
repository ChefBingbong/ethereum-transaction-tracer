import { z } from 'zod'
import { zNodeEnv } from './schemas'

export const baseEnvVars = z.object({
  NODE_ENV: zNodeEnv.default('development'),
})

export function getEnvVarsWithBase<T extends z.ZodRawShape>(additional: T) {
  const mergedSchema = baseEnvVars.extend(additional)
  return mergedSchema.parse(process.env)
}

export const { CHAIN_ID, RPC_URL, ETHERSCAN_API_KEY } = getEnvVarsWithBase({
  RPC_URL: z.string().url(),
  CHAIN_ID: z.coerce.number(),
  ETHERSCAN_API_KEY: z.string(),
})
