import { safeError, safeResult, safeTry } from '@evm-tt/utils'
import {
  formatCalls,
  formatLog,
  formatPrecompileCall,
  formatReturn,
  retLabel,
  safeDecodePrecompile,
} from '../../format'
import { isPrecompileSource } from '../../format/precompile/precompile'
import type { PrinterArgs, RpcCallTrace } from '../../types'
import { prefixesFor } from '../utils'

export async function printCallTrace(root: RpcCallTrace, opts: PrinterArgs) {
  const lines: string[] = []
  const lastStack: boolean[] = []
  const { cache, save } = opts.cache

  const writeLine = (line = '') => lines.push(line)

  const formatTrace = async (rootNode: RpcCallTrace) => {
    const [error] = await safeTry(() => {
      return walkCalls(rootNode, true)
    })
    save()
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
      return safeDecodePrecompile(node, returnLabel).outputText
    }
    return formatReturn(node, cache, nextPrefix)
  }

  const formatTraceCall = (node: RpcCallTrace) => {
    if (isPrecompileSource(node.to)) return formatPrecompileCall(node, cache)
    return formatCalls(node, cache)
  }

  return formatTrace(root)
}
