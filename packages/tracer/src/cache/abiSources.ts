import {
  reliableFetchJson,
  safeError,
  safeErrorStr,
  safeResult,
} from '@evm-transaction-trace/core'
import type { Abi, Address, Hex } from 'viem'
import { ETHERSCAN_BASE_URL, OPENCHAIN_BASE_URL } from './constants'
import { etherscanAbiSchema, openChainAbiSchema } from './schemas'

export async function getAbiFromEtherscan(
  address: Address,
  chainId: number,
  apiKey?: string,
) {
  if (!apiKey) return safeErrorStr('[Etherscan]: invalid api key')

  const [error, response] = await reliableFetchJson(
    etherscanAbiSchema,
    new Request(
      `${ETHERSCAN_BASE_URL}/v2/api/?${new URLSearchParams({
        chainId: chainId.toString(),
        module: 'contract',
        action: 'getabi',
        address,
        apiKey,
      })}`,
    ),
  )
  if (error) return safeError(error)
  if (response.status !== '1') {
    return safeErrorStr('[Etherscan]: invalid response')
  }
  const abi: Abi = JSON.parse(response.result)
  return safeResult(abi)
}

export async function getAbiFunctionFromOpenChain(signature: Hex) {
  const [error, response] = await reliableFetchJson(
    openChainAbiSchema,
    new Request(
      `${OPENCHAIN_BASE_URL}/signature-database/v1/lookup?${new URLSearchParams(
        {
          function: signature,
        },
      )}`,
    ),
  )
  if (error) return safeError(error)

  const entry = Object.values(response.result.function)[0]
  if (!entry?.[0].name) {
    return safeErrorStr('[OpenChain]: invalid response')
  }
  return safeResult(`function ${entry[0].name}`)
}
