import { zeroAddress } from 'viem'
import { TracerCache } from './abiCache'
import { addAbi } from './abiReader'
import { HyperSwapAbi } from './hyperswapabi'

const cache = new TracerCache()
cache.setCachePath('./cache-dir')
cache.load()

addAbi(cache, zeroAddress, HyperSwapAbi)

console.log(cache.contractAbi)
