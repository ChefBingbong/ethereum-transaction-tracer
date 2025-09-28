import { hexToBig, SUMMARY_DEPTH, stringify, truncate } from '@evm-tt/utils'
import pc from 'picocolors'
import type { AbiFunction } from 'viem'
import type { TracerCache } from '../cache'
import { safeDecodeCallData } from '../decoder'
import { LogVerbosity, type RpcCallTrace } from '../types'
import {
  addrLabelStyled,
  addrLabelStyled2,
  dark,
  dim,
  fn,
  getSharedBadges,
  redBold,
  retData,
  sumInner,
} from './theme'

export const printCall = (
  node: RpcCallTrace,
  cache: TracerCache,
  abiItem: AbiFunction[],
) => {
  const paint = node.error ? pc.red : undefined
  const left = addrLabelStyled(node.to, cache, paint)
  const method = formatContractCall(node, cache, abiItem, LogVerbosity.Highest)
  const { typeBadge, valueStr, gasStr, failBadge } = getSharedBadges(
    node,
    LogVerbosity.Highest, //   this.verbosity,
  )
  return `${left}::${method} ${typeBadge} ${valueStr}${gasStr}${failBadge}`
}

export function formatContractCall(
  node: RpcCallTrace,
  cache: TracerCache,
  abiItem: AbiFunction[],
  verbosity: LogVerbosity,
): string {
  const [error, decodedCall] = safeDecodeCallData(abiItem, node.input)
  if (error) return dim('()')

  if (decodedCall.functionName) {
    const styled = getStyledCallLabel(node, decodedCall.functionName)
    if (verbosity < LogVerbosity.Medium) return `${styled}()`

    const args = decodedCall.args.map((arg: any[]) =>
      stringify(`${dark(arg[0])}: ${stringify(arg[1])}`),
    )
    return `${styled}(${args.join(', ')})`
  }

  const selectorSig = cache.formatAbiItemSignature(decodedCall.item)
  if (selectorSig) return getStyledCallLabel(node, selectorSig)

  return dim(`calldata=${truncate(node.input ?? '0x')}`)
}

export function printGasCall(
  node: RpcCallTrace,
  cache: TracerCache,
  abiItem: AbiFunction[],
  depth: number,
): string {
  const left = addrLabelStyled2(node, cache)
  const rightLabel = formatGasCall(node, cache, abiItem)
  const label = depth === 1 ? `${left}\n• ${rightLabel}` : `• ${rightLabel}`

  if (
    depth >= 1 &&
    depth <= SUMMARY_DEPTH &&
    node?.calls &&
    node.calls.length > 0
  ) {
    const { total, count } = sumInner(node)
    const styledTotal =
      depth === 1
        ? pc.bold(pc.yellow(total.toString()))
        : pc.yellow(total.toString())

    return `${label} ${pc.dim('—')} totalused=${styledTotal} ${pc.dim(`(over ${count} inner calls)`)}${
      node?.error ? ` ${pc.red('❌')}` : ''
    }`
  }
  const usedStr = hexToBig(node.gasUsed).toString()
  const styledUsed = depth === 1 ? pc.bold(usedStr) : usedStr
  return `${label} ${pc.dim('—')} used=${styledUsed}${depth > 1 ? ' +' : ''}${
    node?.error ? ` ${pc.red('❌')}` : ''
  }`
}

export function formatGasCall(
  node: RpcCallTrace,
  cache: TracerCache,

  abiItem: AbiFunction[],
): string {
  const [err, dec] = safeDecodeCallData(abiItem, node.input)
  if (err) return node.input && node.input !== '0x' ? dim('') : dim('()')

  if (dec.functionName) {
    const styled = node?.error
      ? pc.bold(pc.red(dec.functionName))
      : retData(dec.functionName)
    return `${styled}()`
  }

  const selectorSig = cache.formatAbiItemSignature(dec.item)
  if (selectorSig) return getStyledCallLabel(node, selectorSig)
  return node?.input !== '0x' ? dim('') : dim('()')
}

export const getStyledCallLabel = (node: RpcCallTrace, fnName: string) =>
  node.error ? redBold(fnName) : fn(fnName)
