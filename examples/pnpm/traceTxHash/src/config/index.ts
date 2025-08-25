import { z } from 'zod'
import { zNodeEnv } from './schemas'

export const baseEnvVars = z.object({
  NODE_ENV: zNodeEnv.default('development'),
})

export function getEnvVarsWithBase<T extends z.ZodRawShape>(additional: T) {
  const mergedSchema = baseEnvVars.extend(additional)
  return mergedSchema.parse(process.env)
}

export const { ETHERSCAN_API_KEY } = getEnvVarsWithBase({
  RPC_URL: z.string().url(),
  ETHERSCAN_API_KEY: z.string().optional(),
})
