import { safeError } from '@evm-tt/utils'
import {
  type Abi,
  type AbiEvent,
  type AbiFunction,
  type Address,
  type Hex,
  keccak256,
  parseAbi,
  parseAbiItem,
  slice,
  stringToHex,
  toEventSelector,
  toFunctionSelector,
} from 'viem'
import { ETHERSCAN_RATE_LIMIT } from '../constants'
import type { AbiError, AbiInfo, CacheObj, RpcCallTrace } from '../types'
import { getAbiFromEtherscan, getAbiFunctionFromOpenChain } from './abiSources'

const sleep = async (ms: number) =>
  await new Promise((resolve) => setTimeout(resolve, ms))

export function formatAbiItemSignature(
  item: AbiError | AbiEvent | AbiFunction,
) {
  return `${item.name}(${(item.inputs ?? []).map((i) => i.type).join(',')})`
}

export function toErrorSelector(err: AbiError): Hex {
  const sig = formatAbiItemSignature(err)
  const hash = keccak256(stringToHex(sig))
  return hash.slice(0, 10) as Hex
}

export function abiItemFromSelector2(cache: CacheObj, input: Hex) {
  const selector = input.slice(0, 10) as Hex
  const abiItem =
    cache.fourByteDir.get(selector) ?? cache.signatureDir.get(selector)

  return !abiItem
    ? undefined
    : typeof abiItem === 'string'
      ? parseAbi([abiItem])
      : [abiItem]
}

export function abiEventFromTopic(cache: CacheObj, topic: Hex) {
  const eventAbi = cache.eventsDir.get(topic) ?? cache.signatureEvDir.get(topic)

  return !eventAbi
    ? undefined
    : typeof eventAbi === 'string'
      ? parseAbiItem([eventAbi])
      : eventAbi
}

function indexAbiWithInfo(cache: CacheObj, { name, address, abi }: AbiInfo) {
  if (!cache.contractNames.has(address)) {
    cache.contractNames.set(address, name)
  }
  indexAbi(cache, abi)
}

function indexAbi(cache: CacheObj, abi: Abi) {
  for (const item of abi) {
    switch (item.type) {
      case 'function': {
        const sel = toFunctionSelector(item)
        if (cache.fourByteDir.has(sel)) break
        cache.fourByteDir.set(sel, item)
        break
      }
      case 'event': {
        const t0 = toEventSelector(item)
        if (cache.eventsDir.has(t0)) break
        cache.eventsDir.set(t0, item)
        break
      }
      case 'error': {
        const errorSel = toErrorSelector(item)
        if (cache.errorDir.has(errorSel)) break
        cache.errorDir.set(errorSel, item)
        break
      }
    }
  }
}

export const prefetchAbisFromEtherscan = async (
  cache: CacheObj,
  root: RpcCallTrace,
  chainId: number,
  etherscanApiKey: string,
) => {
  const getAllAddressesFromCall = (root: RpcCallTrace) => {
    const calls: Set<Address> = new Set()

    function aggregateCallInputs(
      node: RpcCallTrace,
      depth: number,
      calls: Set<Address>,
    ) {
      const inputSelector = abiItemFromSelector2(cache, node.input)
      const outputSelector = abiItemFromSelector2(cache, node?.output ?? '')

      if (!inputSelector) calls.add(node.to)
      if (node.error && !outputSelector) calls.add(node.to)
      if (!cache.contractNames.has(node.to)) calls.add(node.to)

      const children = node.calls ?? []
      for (let i = 0; i < children.length; i++) {
        aggregateCallInputs(children[i], depth + 1, calls)
      }
    }

    aggregateCallInputs(root, 0, calls)
    return calls.values().toArray()
  }

  const addresses = getAllAddressesFromCall(root)
  for (let i = 0; i < addresses.length; i += ETHERSCAN_RATE_LIMIT) {
    const results = await Promise.all(
      addresses.slice(i, i + ETHERSCAN_RATE_LIMIT).map(async (a) => {
        const [error, result] = await getAbiFromEtherscan(
          a,
          chainId,
          etherscanApiKey,
        )

        return error ? undefined : result
      }),
    )
    for (const abi of results) {
      if (abi) indexAbiWithInfo(cache, abi)
    }

    if (i + ETHERSCAN_RATE_LIMIT < addresses.length) {
      await sleep(1000)
    }
  }
}

export async function prefetchAbisFromOpenChain(
  cache: CacheObj,
  trace: RpcCallTrace,
) {
  function getUnknownFnSelectors(trace: RpcCallTrace) {
    const rest = (trace.calls ?? []).reduce(
      (acc, sub) => {
        const r = getUnknownFnSelectors(sub)
        if (r.fns) acc.fns.push(...r.fns.split(','))
        if (r.evs) acc.evs.push(...r.evs.split(','))
        return acc
      },
      { fns: [] as string[], evs: [] as string[] },
    )

    if (trace.input) {
      const sel = slice(trace.input, 0, 4)
      if (!cache.signatureDir.has(sel)) rest.fns.push(sel)
    }

    for (const log of trace.logs ?? []) {
      const sel = log.topics?.[0]
      if (sel && !cache.signatureEvDir.has(sel)) rest.evs.push(sel)
    }

    return {
      fns: [...new Set(rest.fns)].filter(Boolean).join(','),
      evs: [...new Set(rest.evs)].filter(Boolean).join(','),
    }
  }

  const { fns: fnSelectors, evs: EvSelectors } = getUnknownFnSelectors(trace)
  if (!EvSelectors && !fnSelectors) return

  const [error, response] = await getAbiFunctionFromOpenChain(
    fnSelectors,
    EvSelectors,
  )
  if (error) return safeError(new Error(error.message))

  if (response.result.function) {
    Object.entries(response.result.function).forEach(([sig, results]) => {
      const match = results?.find(({ filtered }) => !filtered)?.name
      if (match) cache.signatureDir.set(sig as Hex, `function ${match}`)
    })
  }
  if (response.result.function) {
    Object.entries(response.result.event).forEach(([sig, results]) => {
      const match = results?.find(({ filtered }) => !filtered)?.name
      if (match) cache.signatureEvDir.set(sig as Hex, `event ${match}`)
    })
  }
}
