import createTask from '../../program'

createTask('4byte-event')
  .description('Get the function signatures for the given selector')
  .alias('4e')
  .alias('4be')
  .requiredOption('-t --topic0 <topic0_hex>', 'Event topic (0x + 4 bytes)')
  .action(async (_opts) => {
    // const cachePath = getConfigDir()
    // const topic0 = normalizeHex(opts.topic0)
    // const tracerCache = new TracerCache(1, cachePath)
    // const signature = tracerCache.abiEventFromTopic(topic0)
    // if (signature) {
    //   logger.default(toEventSignature(signature))
    //   return
    // }
    // const [error, openChainRes] = await getAbiFunctionFromOpenChain(topic0)
    // if (error || !openChainRes) logger.default('selector not found')
    // else logger.default(openChainRes)
  })
