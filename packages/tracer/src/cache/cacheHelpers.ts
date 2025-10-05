import { reliableFetchJson, safeError } from '@evm-tt/utils'
import {
  type AbiEvent,
  type AbiFunction,
  type Address,
  type Hex,
  parseAbi,
  slice,
} from 'viem'
import { OPENCHAIN_BASE_URL } from '../constants'
import type { AbiError, RpcCallTrace } from '../types'
import type { CacheObj } from './abiCache'
import { openChainAbiSchema } from './schemas'

export function formatAbiItemSignature(
  item: AbiError | AbiEvent | AbiFunction,
) {
  return `${item.name}(${(item.inputs ?? []).map((i) => i.type).join(',')})`
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

function abiItemFromSelector(cache: CacheObj, input: Hex) {
  const selector = input.slice(0, 10) as Hex
  return cache.fourByteDir.get(selector) ?? cache.signatureDir.get(selector)
}

export const getUnknownAbisFromCall = (cache: CacheObj, root: RpcCallTrace) => {
  const calls: Set<Address> = new Set()

  function aggregateCallInputs(
    node: RpcCallTrace,
    depth: number,
    calls: Set<Address>,
  ) {
    const inputSelector = abiItemFromSelector(cache, node.input)
    const outputSelector = abiItemFromSelector(cache, node?.output ?? '')

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

export async function getAllUnknownSignatures(
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

  if (EvSelectors || fnSelectors) {
    const searchParams = new URLSearchParams({ filter: 'false' })

    if (fnSelectors) searchParams.append('function', fnSelectors)
    if (EvSelectors) searchParams.append('event', EvSelectors)

    const [error, response] = await reliableFetchJson(
      openChainAbiSchema,
      new Request(
        `${OPENCHAIN_BASE_URL}/signature-database/v1/lookup?${searchParams.toString()}`,
      ),
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
}
