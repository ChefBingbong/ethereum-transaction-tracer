import {
  reliableFetchJson,
  safeError,
  safeErrorStr,
  safeResult,
} from '@evm-tt/utils'
import type { Abi, Address } from 'viem'
import { ETHERSCAN_BASE_URL, OPENCHAIN_BASE_URL } from '../constants'
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
        action: 'getsourcecode',
        address,
        apiKey,
      })}`,
    ),
  )
  if (error) return safeError(error)
  if (
    response.status !== '1' ||
    response.result[0].ABI === 'Contract source code not verified'
  ) {
    return safeErrorStr('[Etherscan]: invalid response')
  }
  return safeResult({
    address,
    name: response.result[0].ContractName,
    abi: JSON.parse(response.result[0].ABI) as Abi,
  })
}

export async function getAbiFunctionFromOpenChain(
  fnSelectors: string | undefined,
  evSelectors: string | undefined,
) {
  const searchParams = new URLSearchParams({ filter: 'false' })

  if (fnSelectors) searchParams.append('function', fnSelectors)
  if (evSelectors) searchParams.append('event', evSelectors)

  const [error, response] = await reliableFetchJson(
    openChainAbiSchema,
    new Request(
      `${OPENCHAIN_BASE_URL}/signature-database/v1/lookup?${searchParams.toString()}`,
    ),
  )
  return error ? safeError(new Error(error.message)) : safeResult(response)
}
