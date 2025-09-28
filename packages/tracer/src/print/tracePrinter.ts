import {
  hexToBig,
  isPrecompileSource,
  safeError,
  safeResult,
  safeTry,
} from '@evm-tt/utils'
import pc from 'picocolors'
import type { TracerCache } from '../cache/index'
import {
  decodePrecompile,
  dim,
  formatCall,
  formatCreateCall,
  formatDefault,
  formatDelegateCall,
  formatGasCall,
  formatLog,
  formatPrecompileCall,
  formatReturn,
  formatRevert,
  formatSeltDestructCall,
  retLabel,
} from '../format'
import type {
  GasTally,
  LineSink,
  PrettyOpts,
  PrinterArgs,
  RpcCallTrace,
} from '../types'

export async function formatTrace(root: RpcCallTrace, opts: PrinterArgs) {
  const cache: TracerCache = opts.cache
  const logStream: boolean = opts.logStream

  const lines: string[] = []
  const lastStack: boolean[] = []
  const summary: GasTally = {
    topLevelTotal: 0n,
    topLevelFrames: 0,
    ok: 0,
    fail: 0,
  }

  const sink: LineSink = (line: string) => {
    if (logStream) console.log(line)
    else lines.push(line)
  }
  const writeLine = (line = '') => sink(line)

  const processTrace = async (rootNode: RpcCallTrace, pretty: PrettyOpts) => {
    const [error] = await safeTry(() => {
      if (!pretty.gasProfiler) return walkCalls(rootNode, true)
      return walkGas(rootNode, true, 0)
    })
    if (error) return safeError(error)
    await cache.save()
    return safeResult(lines.join('\n'))
  }

  const walkCalls = async (
    node: RpcCallTrace,
    isLast: boolean,
  ): Promise<void> => {
    const { branch, childPrefix } = prefixesFor(isLast)
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

  const walkGas = async (
    node: RpcCallTrace,
    isLast: boolean,
    depth: number,
  ): Promise<void> => {
    const { branch } = prefixesFor(isLast)
    const usedHere = hexToBig(node.gasUsed)

    if (depth === 1) {
      summary.topLevelTotal += usedHere
      summary.topLevelFrames += 1
      node?.error ? summary.fail++ : summary.ok++
    }

    writeLine(branch + formatTraceGasCall(node, depth))

    lastStack.push(isLast)
    const children = node.calls ?? []
    for (let i = 0; i < children.length; i++) {
      await walkGas(children[i], i === children.length - 1, depth + 1)
    }
    lastStack.pop()

    formatGasTraceSummary(!!node?.error, depth)
  }

  const prefixesFor = (isLast: boolean) => {
    let prefix = ''
    for (const last of lastStack) prefix += last ? '   ' : '│  '

    const depth = lastStack.length
    const branch = depth === 0 ? '' : prefix + (isLast ? '└─ ' : '├─ ')
    const childPrefix = prefix + (isLast ? '   ' : '│  ')
    return { branch, childPrefix }
  }

  const formatTraceReturn = (node: RpcCallTrace, nextPrefix: string) => {
    if (isPrecompileSource(node.to)) {
      const returnLabel = `${nextPrefix}${retLabel('[Return]')}`
      return decodePrecompile(node, returnLabel).outputText
    }
    if (node?.error) return formatRevert(node, cache, nextPrefix)

    const sel = cache.abiItemFromSelector2(node.input)
    if (!sel)
      return `${nextPrefix}${retLabel('[Return]')} ${node.output ?? '('}`
    return formatReturn(node, sel, nextPrefix)
  }

  const formatTraceCall = (node: RpcCallTrace): string => {
    if (isPrecompileSource(node.to)) return formatPrecompileCall(node, cache)

    const sel = cache.abiItemFromSelector2(node.input)
    if (!sel) return dim('()')

    switch (node.type) {
      case 'CALL':
      case 'STATICCALL':
        return formatCall(node, cache, sel)
      case 'CALLCODE':
      case 'DELEGATECALL':
        return formatDelegateCall(node, cache, sel)
      case 'CREATE':
      case 'CREATE2':
        return formatCreateCall(node, cache)
      case 'SELFDESTRUCT':
        return formatSeltDestructCall(node, cache)
      default:
        return formatDefault(node, cache)
    }
  }

  const formatTraceGasCall = (node: RpcCallTrace, depth: number): string => {
    const sel = cache.abiItemFromSelector2(node.input)
    if (!sel) return dim('()')
    return formatGasCall(node, cache, sel, depth)
  }

  const formatGasTraceSummary = (hasError: boolean, depth: number) => {
    if (depth !== 0) return
    const { topLevelFrames, topLevelTotal, ok, fail } = summary
    writeLine(pc.bold('\n— Gas summary —'))
    writeLine(`frames: ${topLevelFrames}   ok: ${ok}   fail: ${fail}`)
    writeLine(`total used : ${pc.bold(Number(topLevelTotal))}`)
    if (hasError) writeLine(pc.red('reverted'))
  }
  return processTrace(root, opts)
}
