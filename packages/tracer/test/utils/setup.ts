import { createPublicClient, http } from 'viem'
import { mainnet } from 'viem/chains'
import { traceActions } from '../../src/callTracer/actions/traceActions'

export const SENDER = '0xda8A8833E938192781AdE161d4b46c4973A40402'
export const TO = '0x66a9893cC07D91D95644AEDD05D03f95e1dBA8Af'
export const TOKEN = '0xdAC17F958D2ee523a2206206994597C13D831ec7'

export const RPC_URL = 'https://ethereum-mainnet.gateway.tatum.io'
export const TEST_CACHE_DIR = './cache'

export const SAMPLE_TX_HASH =
  '0xf4a91c18dad36c9a0717da2375aef02b14bcd0e89dd5f1fc8f19d7952cdb5649'

export const defaultTestClient = createPublicClient({
  chain: mainnet,
  transport: http(RPC_URL),
}).extend(traceActions)

export const publicTestClient = createPublicClient({
  chain: mainnet,
  transport: http('https://eth.llamarpc.com'),
}).extend(traceActions)

export const publicTestClient2 = createPublicClient({
  chain: mainnet,
  transport: http('https://eth.llamarpc.com'),
}).extend(traceActions)
