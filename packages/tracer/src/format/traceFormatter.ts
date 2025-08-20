import { LoggerProvider, safeTry } from '@evm-transaction-trace/core'
import pc from 'picocolors'
import type { Hex } from 'viem'
import type { TracerCache } from '../cache/index'
import { LogVerbosity, type RpcCallTrace } from '../callTracer'
import type { Decoder } from '../decoder'
import { PrittyPrinter } from './prettyPrinter'
import type { PrettyOpts } from './types'

const hexToBig = (h?: Hex) => (h ? BigInt(h) : 0n)

type GasTally = {
  totalGas: bigint
  frames: number
  succeeded: number
  failed: number
  abortedAt?: string // pretty label of the frame that reverted
}
type LineSink = (line: string) => void

export class TraceFormatter {
  private readonly logger: LoggerProvider
  private readonly sink: LineSink
  private readonly printer: PrittyPrinter

  constructor(
    private readonly cache: TracerCache,
    private readonly decoder: Decoder,
    level: boolean,
    private verbosity: LogVerbosity,
    _opts?: { sink?: LineSink },
  ) {
    this.printer = new PrittyPrinter(this.decoder, this.cache, verbosity)
    this.logger = new LoggerProvider(level)
    this.logger.init()
    this.sink = (line) => console.log(line)
  }

  private writeLine(line = '') {
    this.sink(line)
  }

  public async formatTraceColored(root: RpcCallTrace, _opts?: PrettyOpts): Promise<void> {
    await this.processInnerCallsLive(root, '', true, 0, false)
    await this.cache.save()
  }

  public async formatGasTraceColored(root: RpcCallTrace) {
    const tally: GasTally = {
      totalGas: 0n,
      frames: 0,
      succeeded: 0,
      failed: 0,
    }
    this.verbosity = LogVerbosity.Medium
    await this.processInnerCallsLive(root, '', true, 0, true, tally)

    this.writeLine('')
    this.writeLine(pc.bold('— Gas summary —'))
    this.writeLine(`frames: ${tally.frames}   ok: ${tally.succeeded}   fail: ${tally.failed}`)
    this.writeLine(`total used: ${pc.bold(Number(hexToBig(root.gasUsed) - tally.totalGas))}`)

    await this.cache.save()
  }

  private async processInnerCallsLive(
    node: RpcCallTrace,
    prefix: string,
    isLast: boolean,
    depth: number,
    isGasCall = false,
    tally?: GasTally,
  ): Promise<void> {
    const branch = isGasCall || depth === 0 ? '' : prefix + (isLast ? '└─ ' : '├─ ')
    const nextPrefix = isGasCall ? '' : prefix + (isLast ? '   ' : '│  ')

    const [err] = await safeTry(this.cache.indexTraceAbis(node.to, node.input))
    if (err) this.logger.debug(err.message)

    const hasError = Boolean(node.error)
    const used = hexToBig(node.gasUsed)

    if (tally) {
      tally.totalGas += used
      tally.frames += 1
      if (hasError) tally.failed += 1
      else tally.succeeded += 1
    }

    const header = this.formatTraceCall(node, hasError, nextPrefix, isGasCall)
    this.writeLine(branch + header.trimEnd())

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
          isGasCall ? 0 : depth + 1,
          isGasCall,
          tally,
        )
      }
    }
  }

  private formatTraceCall(
    node: RpcCallTrace,
    hasError: boolean,
    nextPrefix: string,
    isGasCall = false,
  ): string {
    switch (node.type) {
      case 'CALL':
      case 'STATICCALL':
        return this.printer.printCall(node, hasError, nextPrefix, isGasCall)
      case 'DELEGATECALL':
      case 'CALLCODE':
        return this.printer.printDelegateCall(node, hasError, nextPrefix, isGasCall)
      case 'CREATE':
      case 'CREATE2':
        return this.printer.printCreateCall(node, hasError, nextPrefix, isGasCall)
      case 'SELFDESTRUCT':
        return this.printer.printSeltDestructCall(node, hasError, nextPrefix, isGasCall)
      default: {
        return this.printer.printDefault(node, hasError, nextPrefix, isGasCall)
      }
    }
  }
}
