import { hexToBig, hexToBigint } from '@evm-tt/utils'
import pc from 'picocolors'
import {
  type Address,
  formatEther,
  formatGwei,
  type Hex,
  isAddressEqual,
  zeroAddress,
} from 'viem'
import type { TracerCache } from '../cache'
import { LogVerbosity, type RpcCallTrace, type RpcCallType } from '../types'

export const addr = pc.blue
export const contract = pc.cyan
export const fn = (s: string) => pc.bold(pc.blue(s))
export const typeBadge = pc.yellow
export const emit = pc.magentaBright
export const argKey = pc.blue
export const argVal = pc.green
export const eventArgVal = pc.magenta
export const retLabel = (s: string) => pc.green(s)
export const retData = pc.green
export const revLabel = (s: string) => pc.red(s)
export const revData = pc.red
export const dim = pc.white
export const dark = pc.dim
export const yellowLight = pc.dim

export const badgeFor = (t: RpcCallType) => typeBadge(`[${t.toLowerCase()}]`)

export const getValueString = (node: RpcCallTrace, verbosity: LogVerbosity) => {
  if (verbosity < LogVerbosity.Highest) return ''
  return dark(
    `${yellowLight('value=')}${formatEther(hexToBigint(node.value ?? '0x00'))} ETH`,
  )
}

export const getGasString = (node: RpcCallTrace, verbosity: LogVerbosity) => {
  if (verbosity < LogVerbosity.Highest) return ''
  return dark(
    `(${yellowLight('gas=')}${formatGwei(hexToBigint(node.gas))} ${yellowLight('used=')}${formatGwei(hexToBigint(node.gasUsed))}) Gwei`,
  )
}
export function addrLabelStyled(
  address: Address | undefined,
  cache: TracerCache,
  color?: (s: string) => string,
) {
  const paint = color ?? addr
  if (!address) return paint('<unknown>')

  const name = cache.contractNames.get(address)
  const defaultLabel = name ? `${name}${dark('()')}` : address.toLowerCase()
  return paint(
    isAddressEqual(address, zeroAddress)
      ? 'Precompile.DataCopy'
      : pc.bold(defaultLabel),
  )
}

export function nameFromSelector(input: Hex | undefined, cache: TracerCache) {
  if (!input || input.length < 10) return undefined
  const fn = cache.abiItemFromSelector(input)
  if (!fn) return undefined
  const sig = `${fn.name}(${(fn.inputs ?? []).map((i) => i.type).join(',')})`
  return sig
}

export const getSharedBadges = (
  node: RpcCallTrace,
  verbosity: LogVerbosity,
  hasError: boolean,
) => {
  const typeBadge = ` ${badgeFor(node.type)}`
  const failBadge = hasError ? ` ${pc.red('❌')}` : ''
  const valueStr = getValueString(node, verbosity)
  const gasStr = getGasString(node, verbosity)

  return { typeBadge, failBadge, valueStr, gasStr }
}

export function sumInner(node: RpcCallTrace) {
  let total = 0n
  let count = 0
  const kids = node.calls ?? []
  for (const c of kids) {
    const used = hexToBig(c.gasUsed)
    total += used
    count += 1
    const sub = sumInner(c)
    total += sub.total
    count += sub.count
  }
  return { total, count }
}
