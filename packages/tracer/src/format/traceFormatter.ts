import { LoggerProvider, safeTry } from '@evm-transaction-trace/core'
import pc from 'picocolors'
import type { Address, Hex } from 'viem'
import type { TracerCache } from '../cache/index'
import { LogVerbosity, type RpcCallTrace } from '../callTracer'
import type { Decoder } from '../decoder'
import { PrittyPrinter } from './prettyPrinter'
import type { GasTally, LineSink, PrettyOpts } from './types'

export const hexToBig = (h?: Hex) => (h ? BigInt(h) : 0n)

export class TraceFormatter {
  private readonly logger: LoggerProvider
  private readonly printer: PrittyPrinter
  private readonly sink: LineSink

  constructor(
    private readonly cache: TracerCache,
    private readonly decoder: Decoder,
    private readonly level: boolean,
    private verbosity: LogVerbosity,
  ) {
    this.sink = (line) => console.log(line)
    this.printer = new PrittyPrinter(this.decoder, this.cache, verbosity)
    this.logger = new LoggerProvider(this.level)
    this.logger.init()
  }

  public async formatTraceColored(root: RpcCallTrace, _opts?: PrettyOpts): Promise<void> {
    await this.processInnerCallsLive(root, '', true, 0)
    await this.cache.save()
  }

  public async formatGasTraceColored(root: RpcCallTrace) {
    const summary = {
      topLevelTotal: 0n,
      topLevelFrames: 0,
      ok: 0,
      fail: 0,
      abortedAt: undefined as string | undefined,
    }

    await this.processInnerGasCalls(root, '', true, 0, summary)

    this.writeLine('')
    this.writeLine(pc.bold('— Gas summary —'))
    this.writeLine(`frames: ${summary.topLevelFrames}   ok: ${summary.ok}   fail: ${summary.fail}`)
    this.writeLine(`total used : ${pc.bold(Number(summary.topLevelTotal))}`)
    if (summary.abortedAt) this.writeLine(`${pc.red('reverted at')}: ${pc.red(summary.abortedAt)}`)

    await this.cache.save()
  }

  private async processInnerGasCalls(
    node: RpcCallTrace,
    prefix: string,
    isLast: boolean,
    depth: number,
    summary: GasTally,
  ) {
    const branch = depth === 0 ? '' : prefix + (isLast ? '└─ ' : '├─ ')
    const nextPrefix = prefix + (isLast ? '   ' : '│  ')

    await this.cache.indexTraceAbis(node.to, node.input).catch(() => {})
    const hasError = Boolean(node.error)

    const usedHere = hexToBig(node.gasUsed)
    if (depth === 1) {
      summary.topLevelTotal += usedHere
      summary.topLevelFrames += 1
      hasError ? summary.fail++ : summary.ok++
    }

    this.writeLine(branch + this.formatTraceGasCall(node, hasError, depth))

    if (hasError) {
      const labelOnly = this.printer.formatGasCall(node, hasError)
      summary.abortedAt = labelOnly
      return true
    }

    const children = node.calls ?? []
    for (let i = 0; i < children.length; i++) {
      await this.processInnerGasCalls(
        children[i],
        nextPrefix,
        i === children.length - 1,
        depth + 1,
        summary,
      )
    }
  }

  private async processInnerCallsLive(
    node: RpcCallTrace,
    prefix: string,
    isLast: boolean,
    depth: number,
  ): Promise<void> {
    const branch = depth === 0 ? '' : prefix + (isLast ? '└─ ' : '├─ ')
    const nextPrefix = prefix + (isLast ? '   ' : '│  ')

    const [err] = await safeTry(this.cache.indexTraceAbis(node.to, node.input))
    if (err) this.logger.debug(err.message)

    const hasError = Boolean(node.error)
    this.writeLine(branch + this.formatTraceCall(node, hasError).trimEnd())

    if (node.logs?.length && this.verbosity > LogVerbosity.High) {
      for (let i = 0; i < node.logs.length; i++) {
        const lg = node.logs[i]
        const lastLog = i === node.logs.length - 1 && (node.calls?.length ?? 0) === 0
        this.writeLine(this.printer.formatLog(lastLog, lg.address, lg.topics, lg.data, nextPrefix))
      }
    }

    if (this.verbosity > LogVerbosity.Low) {
      const children = node.calls ?? []
      for (let i = 0; i < children.length; i++) {
        await this.processInnerCallsLive(
          children[i],
          nextPrefix,
          i === children.length - 1,
          depth + 1,
        )
      }
    }
    this.writeLine(this.formatTraceReturn(node, hasError, nextPrefix).trimEnd())
  }

  private formatTraceReturn(node: RpcCallTrace, hasError: boolean, nextPrefix: string) {
    if (hasError) return this.printer.formatRevert(node, nextPrefix)
    return this.printer.formatReturn(node, nextPrefix)
  }

  private formatTraceCall(node: RpcCallTrace, hasError: boolean): string {
    switch (node.type) {
      case 'CALL': {
        return this.printer.printCall(node, hasError)
      }
      case 'STATICCALL': {
        return this.printer.printCall(node, hasError)
      }
      case 'CALLCODE': {
        return this.printer.printDelegateCall(node, hasError)
      }
      case 'DELEGATECALL': {
        return this.printer.printDelegateCall(node, hasError)
      }
      case 'CREATE': {
        return this.printer.printCreateCall(node, hasError)
      }
      case 'CREATE2': {
        return this.printer.printCreateCall(node, hasError)
      }
      case 'SELFDESTRUCT': {
        return this.printer.printSeltDestructCall(node, hasError)
      }
      default: {
        return this.printer.printDefault(node, hasError)
      }
    }
  }

  private formatTraceGasCall(node: RpcCallTrace, hasError: boolean, depth: number): string {
    const paint = hasError ? pc.red : undefined
    switch (node.type) {
      case 'DELEGATECALL':
      case 'CALLCODE': {
        const left =
          this.printer.addrLabelStyled(node.from as Address, paint) +
          ' → ' +
          this.printer.addrLabelStyled(node.to, paint)
        const rightLabel = this.printer.formatGasCall(node, hasError)
        return this.printer.printGasCall(node, hasError, rightLabel, left, depth)
      }

      case 'CREATE':
      case 'CREATE2': {
        const created = node.to
          ? this.printer.addrLabelStyled(node.to, paint)
          : this.printer.addrLabelStyled(undefined, paint)
        const initLen = node.input ? (node.input.length - 2) / 2 : 0

        const rightLabel = this.printer.formatGasCreateCall(initLen, hasError)
        return this.printer.printGasCall(node, hasError, rightLabel, created, depth)
      }

      case 'SELFDESTRUCT': {
        const target = this.printer.addrLabelStyled(node.to, paint)
        const rightLabel = this.printer.formatGasSelfdestructCall(hasError)
        return this.printer.printGasCall(node, hasError, rightLabel, target, depth)
      }

      default: {
        const left = this.printer.addrLabelStyled(node.to, paint)
        const rightLabel = this.printer.formatGasCall(node, hasError)
        return this.printer.printGasCall(node, hasError, rightLabel, left, depth)
      }
    }
  }

  private writeLine(line = '') {
    this.sink(line)
  }
}
