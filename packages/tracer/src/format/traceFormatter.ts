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
  private summary: GasTally

  private constructor(
    private readonly cache: TracerCache,
    public verbosity: LogVerbosity,
    private logStream: boolean,
  ) {
    this.sink = (line: string) => {
      if (this.logStream) {
        console.log(line)
        return
      }
      this.lines.push(line)
    }
    this.summary = {
      topLevelTotal: 0n,
      topLevelFrames: 0,
      ok: 0,
      fail: 0,
    }
  }

  static createTracer(cache: TracerCache, args: PrinterArgs) {
    return new TracePrettyPrinter(cache, args.verbosity, args.logStream)
  }

  public async formatTrace(root: RpcCallTrace, opts: PrettyOpts) {
    const [error] = await safeTry(() => {
      if (!opts.gasProfiler) return this.processInnerCalls(root, true, 0)
      return this.processInnerGasCalls(root, true, 0)
    })
    if (error) return safeError(error)
    await this.cache.save()
    return safeResult(this.lines.join('\n'))
  }

  private async processInnerCalls(
    node: RpcCallTrace,
    isLast: boolean,
    depth: number,
    prefix = '',
  ): Promise<void> {
    const branch = depth === 0 ? '' : prefix + (isLast ? '└─ ' : '├─ ')
    const nextPrefix = prefix + (isLast ? '   ' : '│  ')
    const logs = node.logs ?? []
    const calls = node.calls ?? []

    this.writeLine(branch + this.formatTraceCall(node).trimEnd())

    for (let i = 0; i < logs.length; i++) {
      const lastLog = i === logs.length - 1 && calls.length === 0
      this.writeLine(printLog(lastLog, logs[i], this.cache, nextPrefix))
    }

    for (let i = 0; i < calls.length; i++) {
      await this.processInnerCalls(
        calls[i],
        i === calls.length - 1,
        depth + 1,
        nextPrefix,
      )
    }
    this.writeLine(this.formatTraceReturn(node, nextPrefix).trimEnd())
  }

  private async processInnerGasCalls(
    node: RpcCallTrace,
    isLast: boolean,
    depth: number,
    prefix = '',
  ) {
    const branch = depth === 0 ? '' : prefix + (isLast ? '└─ ' : '├─ ')
    const nextPrefix = prefix + (isLast ? '   ' : '│  ')
    const usedHere = hexToBig(node.gasUsed)

    if (depth === 1) {
      this.summary.topLevelTotal += usedHere
      this.summary.topLevelFrames += 1
      node?.error ? this.summary.fail++ : this.summary.ok++
    }

    this.writeLine(branch + this.formatTraceGasCall(node, depth))

    const children = node.calls ?? []
    for (let i = 0; i < children.length; i++) {
      await this.processInnerGasCalls(
        children[i],
        i === children.length - 1,
        depth + 1,
        nextPrefix,
      )
    }

    this.formatGasTraceSummary(!!node?.error, depth)
  }

  private formatTraceReturn(node: RpcCallTrace, nextPrefix: string) {
    if (isPrecompileSource(node.to)) {
      const returnLabel = `${nextPrefix}${retLabel('[Return]')}`
      return decodePrecompile(node, returnLabel).outputText
    }
    if (node?.error) return printRevert(node, this.cache, nextPrefix)

    const callInputSelector = this.cache.abiItemFromSelector2(node.input)
    if (!callInputSelector)
      return `${nextPrefix}${retLabel('[Return]')} ${node.output ?? '('}`

    return printReturn(node, callInputSelector, nextPrefix)
  }

  private formatTraceCall(node: RpcCallTrace): string {
    if (isPrecompileSource(node.to))
      return printPrecompileCall(node, this.cache)

    const callInputSelector = this.cache.abiItemFromSelector2(node.input)
    if (!callInputSelector) return dim('()')

    switch (node.type) {
      case 'CALL': {
        return printCall(node, this.cache, callInputSelector)
      }
      case 'STATICCALL': {
        return printCall(node, this.cache, callInputSelector)
      }
      case 'CALLCODE': {
        return printDelegateCall(node, this.cache, callInputSelector)
      }
      case 'DELEGATECALL': {
        return printDelegateCall(node, this.cache, callInputSelector)
      }
      case 'CREATE': {
        return printCreateCall(node, this.cache)
      }
      case 'CREATE2': {
        return printCreateCall(node, this.cache)
      }
      case 'SELFDESTRUCT': {
        return printSeltDestructCall(node, this.cache)
      }
      default: {
        return printDefault(node, this.cache)
      }
    }
  }

  private formatTraceGasCall(node: RpcCallTrace, depth: number): string {
    const callInputSelector = this.cache.abiItemFromSelector2(node.input)
    if (!callInputSelector) return dim('()')

    return printGasCall(node, this.cache, callInputSelector, depth)
  }

  private formatGasTraceSummary = (hasError: boolean, depth: number) => {
    const { topLevelFrames, topLevelTotal, ok, fail, abortedAt } = this.summary
    if (depth !== 0) return
    this.writeLine(pc.bold('\n— Gas summary —'))
    this.writeLine(`frames: ${topLevelFrames}   ok: ${ok}   fail: ${fail}`)
    this.writeLine(`total used : ${pc.bold(Number(topLevelTotal))}`)

    if (hasError)
      this.writeLine(`${pc.red('reverted at')}: ${pc.red(abortedAt)}`)
  }

  private writeLine(line = '') {
    this.sink(line)
  }
}
