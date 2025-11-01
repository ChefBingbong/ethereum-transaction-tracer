import { formatArgsInline } from '@evm-tt/utils'
import type { Hex } from 'viem'
import { safeDecodeCallRevert } from '../../decoder'
import type { CacheObj, RpcCallTrace } from '../../types'
import { revData, revLabel } from '../theme'

const defaultRevert = (node: {
  output?: string | undefined
  revertReason?: string | undefined
  error?: string | undefined
}) => {
  const selector = node.output ? node.output.slice(0, 10) : undefined
  return `${node.revertReason ?? node.error} ${selector}`
}

export function formatCallRevert(
  node: RpcCallTrace,
  cache: CacheObj,
  nextPrefix: string,
) {
  const revertPrefix = `${nextPrefix}${revLabel('[Revert]')}`
  if (!node.output) return `${revertPrefix} ${revData(defaultRevert(node))}`
  const errorSel = node.output.slice(0, 10) as Hex

  const abiItem = cache.errorDir.get(errorSel)
  if (!abiItem) return `${revertPrefix} ${revData(defaultRevert(node))}`

  const [error, revertData] = safeDecodeCallRevert([abiItem], node.output)

  if (error) return `${revertPrefix} ${revData(defaultRevert(node))}`
  return `${revertPrefix} ${revData(`${revertData.errorName}(${revertData.args ? revertData.args.map(formatArgsInline).join(', ') : ''})`)}`
}
