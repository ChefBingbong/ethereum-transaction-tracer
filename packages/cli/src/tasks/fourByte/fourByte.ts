import { getAbiFunctionFromOpenChain, TracerCache } from '@evm-tt/tracer'
import { logger } from '@evm-tt/utils'
import { type Hex, toFunctionSignature } from 'viem'
import { getConfigDir } from '../../configCli/env'
import createTask from '../../program'

createTask('4byte')
  .description('Get the function signatures for the given selector')
  .alias('4')
  .alias('4b')
  .requiredOption(
    '-s --selector <selector_hex>',
    'Function selector (0x + 4 bytes)',
  )
  .action(async (opts) => {
    const cachePath = getConfigDir()
    const selector = opts.selector as Hex
    const tracerCache = new TracerCache(1, cachePath)
    const signature = tracerCache.abiItemFromSelector(selector)

    if (signature) {
      logger.default(toFunctionSignature(signature))
      return
    }

    const [error, openChainRes] = await getAbiFunctionFromOpenChain(selector)
    if (error || !openChainRes) logger.default('selector not found')
    else logger.default(openChainRes)
  })
