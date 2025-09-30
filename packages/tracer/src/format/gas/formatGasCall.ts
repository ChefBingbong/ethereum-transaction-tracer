import { hexToBig, SUMMARY_DEPTH } from '@evm-tt/utils'
import pc from 'picocolors'
import type { AbiFunction } from 'viem'
import type { TracerCache } from '../../cache'
import { safeDecodeCallData } from '../../decoder'
import type { RpcCallTrace } from '../../types'
import {
  dim,
  getCallOriginLabel,
  getStyledCallLabel,
  retData,
  sumInner,
} from '../theme'

export function formatGasCall(
  node: RpcCallTrace,
  cache: TracerCache,
  abiItem: AbiFunction[],
  depth: number,
): string {
  const left = getCallOriginLabel(node, cache)
  const rightLabel = formatGasCallInner(node, cache, abiItem)
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

export function formatGasCallInner(
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
