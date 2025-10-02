import {
  isPrecompileSource,
  safeError,
  safeResult,
  safeTry,
} from '@evm-tt/utils'
import type { TracerCache } from '../../cache/index'
import {
  dim,
  formatCallRevert,
  formatCalls,
  formatLog,
  formatPrecompileCall,
  formatReturn,
  retLabel,
  safeDecodePrecompile,
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
      return safeDecodePrecompile(node, returnLabel).outputText // merge into format return
    }
    if (node?.error) return formatCallRevert(node, cache, nextPrefix) // merge into format return
    const abiItem = cache.abiItemFromSelector2(node.input)

    if (!abiItem) {
      return `${nextPrefix}${retLabel('[Return]')} ${node.output ?? '('}`
    }
    return formatReturn(node, cache, abiItem, nextPrefix)
  }

  const formatTraceCall = (node: RpcCallTrace) => {
    if (isPrecompileSource(node.to)) return formatPrecompileCall(node, cache)

    const abiItem = cache.abiItemFromSelector2(node.input)
    if (!abiItem) return dim('()')

    return formatCalls(node, cache, abiItem)
  }

  return formatTrace(root)
}
