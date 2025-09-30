import {
  isPrecompileSource,
  safeError,
  safeResult,
  safeTry,
} from '@evm-tt/utils'
import type { TracerCache } from '../../cache/index'
import {
  decodePrecompile,
  dim,
  formatCalls,
  formatLog,
  formatPrecompileCall,
  formatReturn,
  formatRevert,
  retLabel,
} from '../../format'
import type { PrinterArgs, RpcCallTrace } from '../../types'
import { prefixesFor } from '../utils'

export async function printCallTrace(root: RpcCallTrace, opts: PrinterArgs) {
  const lines: string[] = []
  const lastStack: boolean[] = []
  const cache: TracerCache = opts.cache

  const writeLine = (line = '') => lines.push(line)

  const formatTrace = async (rootNode: RpcCallTrace) => {
    const [error] = await safeTry(() => {
      return walkCalls(rootNode, true)
    })
    cache.save()
    if (error) return safeError(error)
    return safeResult(lines.join('\n'))
  }

  const walkCalls = async (node: RpcCallTrace, isLast: boolean) => {
    const { branch, childPrefix } = prefixesFor(isLast, lastStack)
    writeLine(branch + formatTraceCall(node).trimEnd())

    const logs = node.logs ?? []
    const calls = node.calls ?? []

    for (let i = 0; i < logs.length; i++) {
      const lastLog = i === logs.length - 1 && calls.length === 0
      writeLine(formatLog(lastLog, logs[i], cache, childPrefix))
    }

    lastStack.push(isLast)
    for (let i = 0; i < calls.length; i++) {
      await walkCalls(calls[i], i === calls.length - 1)
    }
    lastStack.pop()

    writeLine(formatTraceReturn(node, childPrefix).trimEnd())
  }

  const formatTraceReturn = (node: RpcCallTrace, nextPrefix: string) => {
    if (isPrecompileSource(node.to)) {
      const returnLabel = `${nextPrefix}${retLabel('[Return]')}`
      return decodePrecompile(node, returnLabel).outputText
    }
    if (node?.error) return formatRevert(node, cache, nextPrefix)
    const abiItem = cache.abiItemFromSelector2(node.input)

    if (!abiItem) {
      return `${nextPrefix}${retLabel('[Return]')} ${node.output ?? '('}`
    }
    return formatReturn(node, abiItem, nextPrefix)
  }

  const formatTraceCall = (node: RpcCallTrace) => {
    if (isPrecompileSource(node.to)) return formatPrecompileCall(node, cache)

    const abiItem = cache.abiItemFromSelector2(node.input)
    if (!abiItem) return dim('()')

    return formatCalls(node, cache, abiItem)
  }

  return formatTrace(root)
}
