import {
  hexToBig,
  isPrecompileSource,
  safeError,
  safeResult,
  safeTry,
} from '@evm-tt/utils'
import pc from 'picocolors'
import type { TracerCache } from '../cache/index'
import type {
  GasTally,
  LineSink,
  LogVerbosity,
  PrettyOpts,
  PrinterArgs,
  RpcCallTrace,
} from '../types'
import { printCall, printGasCall } from './printCall'
import {
  printCreateCall,
  printDefault,
  printDelegateCall,
  printLog,
  printSeltDestructCall,
} from './printDelegateCall'
import { decodePrecompile, printPrecompileCall } from './printPreCompile'
import { printReturn, printRevert } from './printReturn'
import { dim, retLabel } from './theme'

export class TracePrettyPrinter {
  private readonly sink: LineSink
  public lines: string[] = []
  private lastStack: boolean[] = []

  private summary: GasTally = {
    topLevelTotal: 0n,
    topLevelFrames: 0,
    ok: 0,
    fail: 0,
  }

  private constructor(
    private readonly cache: TracerCache,
    public verbosity: LogVerbosity,
    private readonly logStream: boolean,
  ) {
    this.sink = (line: string) => {
      if (this.logStream) console.log(line)
      else this.lines.push(line)
    }
  }

  static async formatTrace(root: RpcCallTrace, opts: PrinterArgs) {
    const tracer = new TracePrettyPrinter(
      opts.cache,
      opts.verbosity,
      opts.logStream,
    )
    return tracer.processTrace(root, opts)
  }

  private async processTrace(root: RpcCallTrace, opts: PrettyOpts) {
    const [error] = await safeTry(() => {
      if (!opts.gasProfiler) return this.walkCalls(root, true)
      return this.walkGas(root, true, 0)
    })
    if (error) return safeError(error)
    await this.cache.save()
    return safeResult(this.lines.join('\n'))
  }

  private async walkCalls(node: RpcCallTrace, isLast: boolean): Promise<void> {
    const { branch, childPrefix } = this.prefixesFor(isLast)
    this.writeLine(branch + this.formatTraceCall(node).trimEnd())

    const logs = node.logs ?? []
    const calls = node.calls ?? []
    for (let i = 0; i < logs.length; i++) {
      const lastLog = i === logs.length - 1 && calls.length === 0
      this.writeLine(printLog(lastLog, logs[i], this.cache, childPrefix))
    }

    this.lastStack.push(isLast)
    for (let i = 0; i < calls.length; i++) {
      await this.walkCalls(calls[i], i === calls.length - 1)
    }
    this.lastStack.pop()
    this.writeLine(this.formatTraceReturn(node, childPrefix).trimEnd())
  }

  private async walkGas(
    node: RpcCallTrace,
    isLast: boolean,
    depth: number,
  ): Promise<void> {
    const { branch } = this.prefixesFor(isLast)
    const usedHere = hexToBig(node.gasUsed)

    if (depth === 1) {
      this.summary.topLevelTotal += usedHere
      this.summary.topLevelFrames += 1
      node?.error ? this.summary.fail++ : this.summary.ok++
    }

    this.writeLine(branch + this.formatTraceGasCall(node, depth))

    this.lastStack.push(isLast)
    const children = node.calls ?? []
    for (let i = 0; i < children.length; i++) {
      await this.walkGas(children[i], i === children.length - 1, depth + 1)
    }
    this.lastStack.pop()

    this.formatGasTraceSummary(!!node?.error, depth)
  }

  private prefixesFor(isLast: boolean) {
    let prefix = ''
    for (const last of this.lastStack) prefix += last ? '   ' : '│  '

    const depth = this.lastStack.length
    const branch = depth === 0 ? '' : prefix + (isLast ? '└─ ' : '├─ ')
    const childPrefix = prefix + (isLast ? '   ' : '│  ')
    return { branch, childPrefix }
  }

  private formatTraceReturn(node: RpcCallTrace, nextPrefix: string) {
    if (isPrecompileSource(node.to)) {
      const returnLabel = `${nextPrefix}${retLabel('[Return]')}`
      return decodePrecompile(node, returnLabel).outputText
    }
    if (node?.error) return printRevert(node, this.cache, nextPrefix)

    const sel = this.cache.abiItemFromSelector2(node.input)
    if (!sel)
      return `${nextPrefix}${retLabel('[Return]')} ${node.output ?? '('}`
    return printReturn(node, sel, nextPrefix)
  }

  private formatTraceCall(node: RpcCallTrace): string {
    if (isPrecompileSource(node.to))
      return printPrecompileCall(node, this.cache)

    const sel = this.cache.abiItemFromSelector2(node.input)
    if (!sel) return dim('()')

    switch (node.type) {
      case 'CALL':
      case 'STATICCALL':
        return printCall(node, this.cache, sel)
      case 'CALLCODE':
      case 'DELEGATECALL':
        return printDelegateCall(node, this.cache, sel)
      case 'CREATE':
      case 'CREATE2':
        return printCreateCall(node, this.cache)
      case 'SELFDESTRUCT':
        return printSeltDestructCall(node, this.cache)
      default:
        return printDefault(node, this.cache)
    }
  }

  private formatTraceGasCall(node: RpcCallTrace, depth: number): string {
    const sel = this.cache.abiItemFromSelector2(node.input)
    if (!sel) return dim('()')
    return printGasCall(node, this.cache, sel, depth)
  }

  private formatGasTraceSummary(hasError: boolean, depth: number) {
    if (depth !== 0) return
    const { topLevelFrames, topLevelTotal, ok, fail } = this.summary
    this.writeLine(pc.bold('\n— Gas summary —'))
    this.writeLine(`frames: ${topLevelFrames}   ok: ${ok}   fail: ${fail}`)
    this.writeLine(`total used : ${pc.bold(Number(topLevelTotal))}`)
    if (hasError) this.writeLine(pc.red('reverted'))
  }

  private writeLine(line = '') {
    this.sink(line)
  }
}
