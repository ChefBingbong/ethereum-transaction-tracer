import { hexToBig, safeError, safeResult, safeTry } from '@evm-tt/utils'
import pc from 'picocolors'
import type { TracerCache } from '../cache/index'
import type { Decoder } from '../decoder'
import type { GasTally, LineSink, PrettyOpts, PrinterArgs } from '../types'
import { LogVerbosity, type RpcCallTrace } from '../types'
import { TraceFormatter } from './prettyPrinter'

export class TracePrettyPrinter {
  private readonly formatter: TraceFormatter
  private readonly sink: LineSink
  public lines: string[] = []
  private summary: GasTally

  private constructor(
    private readonly cache: TracerCache,
    private readonly decoder: Decoder,
    private verbosity: LogVerbosity,
    private logStream: boolean,
  ) {
    this.sink = (line: string) => {
      if (this.logStream) {
        console.log(line)
        return
      }
      this.lines.push(line)
    }
    this.formatter = new TraceFormatter(this.decoder, this.cache, verbosity)
    this.summary = {
      topLevelTotal: 0n,
      topLevelFrames: 0,
      ok: 0,
      fail: 0,
    }
  }

  static createTracer(cache: TracerCache, decoder: Decoder, args: PrinterArgs) {
    return new TracePrettyPrinter(cache, decoder, args.verbosity, args.logStream)
  }

  public async formatTrace(root: RpcCallTrace, opts: PrettyOpts) {
    const [error] = await safeTry(() => {
      if (!opts.gasProfiler) return this.processInnerCalls(root, true, 0)
      return this.processInnerGasCalls(root, true, 0)
    })
    if (error) return safeError(error)
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
    const hasError = Boolean(node.error)

    this.writeLine(branch + this.formatTraceCall(node, hasError).trimEnd())

    if (node.logs?.length && this.verbosity > LogVerbosity.Medium) {
      for (let i = 0; i < node.logs.length; i++) {
        const lg = node.logs[i]
        const lastLog = i === node.logs.length - 1 && (node.calls?.length ?? 0) === 0
        this.writeLine(this.formatter.printLog(lastLog, lg.address, lg.topics, lg.data, nextPrefix))
      }
    }

    const children = node.calls ?? []
    for (let i = 0; i < children.length; i++) {
      await this.processInnerCalls(children[i], i === children.length - 1, depth + 1, nextPrefix)
    }
    this.writeLine(this.formatTraceReturn(node, hasError, nextPrefix).trimEnd())
  }

  private async processInnerGasCalls(
    node: RpcCallTrace,
    isLast: boolean,
    depth: number,
    prefix = '',
  ) {
    const branch = depth === 0 ? '' : prefix + (isLast ? '└─ ' : '├─ ')
    const nextPrefix = prefix + (isLast ? '   ' : '│  ')
    const hasError = Boolean(node.error)
    const usedHere = hexToBig(node.gasUsed)

    if (depth === 1) {
      this.summary.topLevelTotal += usedHere
      this.summary.topLevelFrames += 1
      hasError ? this.summary.fail++ : this.summary.ok++
    }

    if (hasError) {
      const revertedAtMethod = this.formatter.formatGasCall(node, hasError)
      this.summary.abortedAt = revertedAtMethod
    }

    this.writeLine(branch + this.formatTraceGasCall(node, hasError, depth))

    const children = node.calls ?? []
    for (let i = 0; i < children.length; i++) {
      await this.processInnerGasCalls(children[i], i === children.length - 1, depth + 1, nextPrefix)
    }

    this.formatGasTraceSummary(hasError, depth)
  }

  private formatTraceReturn(node: RpcCallTrace, hasError: boolean, nextPrefix: string) {
    if (hasError) return this.formatter.printRevert(node, nextPrefix)
    return this.formatter.printReturn(node, nextPrefix)
  }

  private formatTraceCall(node: RpcCallTrace, hasError: boolean): string {
    switch (node.type) {
      case 'CALL': {
        return this.formatter.printCall(node, hasError)
      }
      case 'STATICCALL': {
        return this.formatter.printCall(node, hasError)
      }
      case 'CALLCODE': {
        return this.formatter.printDelegateCall(node, hasError)
      }
      case 'DELEGATECALL': {
        return this.formatter.printDelegateCall(node, hasError)
      }
      case 'CREATE': {
        return this.formatter.printCreateCall(node, hasError)
      }
      case 'CREATE2': {
        return this.formatter.printCreateCall(node, hasError)
      }
      case 'SELFDESTRUCT': {
        return this.formatter.printSeltDestructCall(node, hasError)
      }
      default: {
        return this.formatter.printDefault(node, hasError)
      }
    }
  }

  private formatTraceGasCall(node: RpcCallTrace, hasError: boolean, depth: number): string {
    return this.formatter.printGasCall(node, hasError, depth)
  }

  private formatGasTraceSummary = (hasError: boolean, depth: number) => {
    const { topLevelFrames, topLevelTotal, ok, fail, abortedAt } = this.summary
    if (depth !== 0) return
    this.writeLine(pc.bold('\n— Gas summary —'))
    this.writeLine(`frames: ${topLevelFrames}   ok: ${ok}   fail: ${fail}`)
    this.writeLine(`total used : ${pc.bold(Number(topLevelTotal))}`)

    if (hasError) this.writeLine(`${pc.red('reverted at')}: ${pc.red(abortedAt)}`)
  }

  private writeLine(line = '') {
    this.sink(line)
  }
}
