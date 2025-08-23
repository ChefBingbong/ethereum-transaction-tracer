import {
  reliableFetchJson,
  safeError,
  safeErrorStr,
  safeResult,
} from '@evm-transaction-trace/utils'
import type { Abi, Address, Hex } from 'viem'
import { ETHERSCAN_BASE_URL, OPENCHAIN_BASE_URL } from './constants'
import { etherscanAbiSchema, openChainAbiSchema } from './schemas'

export async function getAbiFromEtherscan(address: Address, chainId: number, apiKey?: string) {
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
  if (response.status !== '1' || response.result[0].ABI === 'Contract source code not verified') {
    return safeErrorStr('[Etherscan]: invalid response')
  }
  return safeResult({
    address,
    name: response.result[0].ContractName,
    abi: JSON.parse(response.result[0].ABI) as Abi,
  })
}

export async function getAbiFunctionFromOpenChain(signature: Hex, isFunc = true) {
  const [error, response] = await reliableFetchJson(
    openChainAbiSchema,
    new Request(
      `${OPENCHAIN_BASE_URL}/signature-database/v1/lookup?${new URLSearchParams({
        function: signature,
      })}`,
    ),
  )
  if (error) return safeError(error)

  const entry = Object.values(response.result.function)[0]
  if (!entry?.[0].name) {
    return safeErrorStr('[OpenChain]: invalid response')
  }
  if (isFunc) return safeResult(`function ${entry[0].name}`)
  return safeResult(`${entry[0].name}`)
}
