import type { Abi, Address, Hex } from 'viem'
import type { I4BytesEntry } from './types'

export async function etherscanLikeSource(
  address: Address,
  apiBase = 'https://api.etherscan.io',
  apiKey?: string,
): Promise<Abi | undefined> {
  const url = new URL('v2/api/', apiBase)
  url.searchParams.set('chainId', '999')
  url.searchParams.set('module', 'contract')
  url.searchParams.set('action', 'getabi')
  url.searchParams.set('address', address)
  if (apiKey) url.searchParams.set('apikey', apiKey)
  const res = await fetch(url.toString())
  const json = (await res.json()) as { status: string; result: string }

  if (json.status !== '1') return undefined

  try {
    const abi = JSON.parse(json.result) as Abi
    return Array.isArray(abi) ? abi : undefined
  } catch {
    return undefined
  }
}

export async function fourByteLikeSource(
  signature: Hex,
  apiBase = 'https://www.4byte.directory',
): Promise<I4BytesEntry[] | undefined> {
  const url = new URL('api/v1/signatures', apiBase)
  url.searchParams.set('hex_signature', signature)

  const res = await fetch(url.toString())
  const json = (await res.json()) as { results: I4BytesEntry[] }
  return json.results
}
