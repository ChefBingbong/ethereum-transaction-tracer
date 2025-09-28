import type { EventTopic } from '@evm-tt/utils'
import {
  encodeFunctionData,
  encodeFunctionResult,
  erc20Abi,
  getAbiItem,
  stringify,
  zeroAddress,
} from 'viem'
import { beforeAll, describe, expect, it } from 'vitest'
import {
  Decoder,
  safeDecodeCallData,
  safeDecodeCallResult,
  safeDecodeCallRevert,
  safeDecodeEvent,
  TracerCache,
} from '../src'
import { Permit2 } from './abis/Permit2.abi'

describe('Decoder integration', () => {
  let cache: TracerCache
  let decoder: Decoder

  beforeAll(() => {
    cache = new TracerCache(1, './cache', { extraAbis: [erc20Abi, Permit2] })
    decoder = new Decoder(cache)
  })

  it('safeDecodeCallResult: decodes function return', () => {
    const encoded = encodeFunctionResult({
      abi: erc20Abi,
      functionName: 'balanceOf',
      result: 100000n,
    })

    const balanceOfAbiItem = getAbiItem({ abi: erc20Abi, name: 'balanceOf' })

    const [err, res] = safeDecodeCallResult(balanceOfAbiItem, encoded)
    const [err1, res1] = decoder.decodeReturnPretty(balanceOfAbiItem, encoded)

    expect(err).toBeUndefined()
    expect(res).toBe('100000')

    expect(err1).toBeUndefined()
    expect(res1).toBe('100000')

    expect(res1).toEqual(res)
  })

  it('safeDecodeCallData: decodes function data', () => {
    const encoded = encodeFunctionData({
      abi: erc20Abi,
      functionName: 'balanceOf',
      args: [zeroAddress],
    })

    const balanceOfAbiItem = getAbiItem({ abi: erc20Abi, name: 'balanceOf' })

    const [err, res] = safeDecodeCallData([balanceOfAbiItem], encoded)
    const [err1, res1] = decoder.decodeCallWithNames(zeroAddress, encoded)

    expect(err).toBeUndefined()
    expect(err1).toBeUndefined()

    expect(res).toHaveProperty('fnName', 'balanceOf')
    expect(res).toHaveProperty('prettyArgs', [zeroAddress])

    expect(res1).toHaveProperty('fnName', 'balanceOf')
    expect(res1).toHaveProperty('prettyArgs', [zeroAddress])
  })

  it('safeDecodeRevert: decodes revert data', () => {
    const node = {
      output: '0x756688fe',
    } as const

    const [err, res] = safeDecodeCallRevert(Permit2, node.output)
    const [err1, res1] = decoder.decodeRevertPrettyFromFrame(node as any)

    expect(err).toBeUndefined()
    expect(err1).toBeUndefined()

    expect(res).toHaveProperty('errorName', 'InvalidNonce')
    expect(res1).toEqual('InvalidNonce()')
  })
  it('safeDecodeEvent: decodes event name and args', () => {
    const data =
      '0x000000000000000000000000ffffffffffffffffffffffffffffffffffffffff0000000000000000000000000000000000000000000000000000000068d2ed4e0000000000000000000000000000000000000000000000000000000000000002'
    const topics: EventTopic = [
      '0xc6a377bfc4eb120024a8ac08eef205be16b817020812c73223e81d1bdb9708ec',
      '0x000000000000000000000000da8a8833e938192781ade161d4b46c4973a40402',
      '0x000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
      '0x00000000000000000000000066a9893cc07d91d95644aedd05d03f95e1dba8af',
    ]

    const eventAbi = getAbiItem({ abi: Permit2, name: 'Permit' })
    const [err, res] = safeDecodeEvent(eventAbi, topics, data)
    const [err1, res1] = decoder.safeDecodeEvent(topics, data)

    expect(err).toBeUndefined()
    expect(err1).toBeUndefined()

    expect(res).toHaveProperty('eventName', 'Permit')
    expect(res1).toHaveProperty('name', 'Permit')

    expect(stringify(res?.args)).toEqual(stringify(res?.args))
  })
})
