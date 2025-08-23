import {
  hexToBig,
  LoggerProvider,
  PRECOMPILE_ADDRESS,
  safeError,
  safeResult,
  safeTry,
} from '@evm-transaction-trace/core'
import pc from 'picocolors'
import type { Address } from 'viem'
import type { TracerCache } from '../cache/index'
import type { Decoder } from '../decoder'
import type { GasTally, LineSink, PrettyOpts } from '../types'
import { LogVerbosity, type RpcCallTrace } from '../types'
import { TraceFormatter } from './prettyPrinter'

export class TracePrettyPrinter {
  private readonly logger: LoggerProvider
  private readonly formatter: TraceFormatter

  constructor(
    private readonly cache: TracerCache,
    private readonly decoder: Decoder,
    private readonly level: boolean,
    private readonly sink: LineSink,
    private verbosity: LogVerbosity,
  ) {
    this.formatter = new TraceFormatter(this.decoder, this.cache, verbosity)
    this.logger = new LoggerProvider(this.level)
    this.logger.init()
  }

  public async formatTraceColored(root: RpcCallTrace, _opts?: PrettyOpts) {
    const calls = this.getUnknownAbisFromCall(root)
    await this.cache.indexCallAbis(calls.values().toArray())

    const [error] = await safeTry(() => this.processInnerCallsLive(root, true, 0))
    console.log(error)
    if (error) return safeError(error)

    await this.cache.save()
    return safeResult(null)
  }

  public async formatGasTraceColored(root: RpcCallTrace) {
    const summary = {
      topLevelTotal: 0n,
      topLevelFrames: 0,
      ok: 0,
      fail: 0,
    }

    const [error] = await safeTry(() => this.processInnerGasCalls(root, true, 0, summary))
    if (error) return safeError(error)

    await this.cache.save()
    return safeResult(null)
  }

  private async processInnerCallsLive(
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
      await this.processInnerCallsLive(
        children[i],
        i === children.length - 1,
        depth + 1,
        nextPrefix,
      )
    }
    this.writeLine(this.formatTraceReturn(node, hasError, nextPrefix).trimEnd())
  }

  private async processInnerGasCalls(
    node: RpcCallTrace,
    isLast: boolean,
    depth: number,
    summary: GasTally,
    prefix = '',
  ) {
    const branch = depth === 0 ? '' : prefix + (isLast ? '└─ ' : '├─ ')
    const nextPrefix = prefix + (isLast ? '   ' : '│  ')
    const hasError = Boolean(node.error)
    const usedHere = hexToBig(node.gasUsed)

    if (depth === 1) {
      summary.topLevelTotal += usedHere
      summary.topLevelFrames += 1
      hasError ? summary.fail++ : summary.ok++
    }

    if (hasError) {
      const revertedAtMethod = this.formatter.formatGasCall(node, hasError)
      summary.abortedAt = revertedAtMethod
    }

    this.writeLine(branch + this.formatTraceGasCall(node, hasError, depth))

    const children = node.calls ?? []
    for (let i = 0; i < children.length; i++) {
      await this.processInnerGasCalls(
        children[i],
        i === children.length - 1,
        depth + 1,
        summary,
        nextPrefix,
      )
    }

    this.formatGasTraceSummary(summary, hasError, depth)
  }

  private formatTraceReturn(node: RpcCallTrace, hasError: boolean, nextPrefix: string) {
    if (hasError) return this.formatter.printRevert(node, nextPrefix)

    switch (node.to) {
      case PRECOMPILE_ADDRESS.Ecrecover: {
        const precompile = this.formatter.formatPrecompileEcRecover(node)
        return this.formatter.printPrecompileReturn(precompile, nextPrefix)
      }
      case PRECOMPILE_ADDRESS.Sha256: {
        const precompile = this.formatter.formatPrecompileSha256(node)
        return this.formatter.printPrecompileReturn(precompile, nextPrefix)
      }
      case PRECOMPILE_ADDRESS.Ripemd160: {
        const precompile = this.formatter.formatPrecompileRipemd160(node)
        return this.formatter.printPrecompileReturn(precompile, nextPrefix)
      }
      case PRECOMPILE_ADDRESS.Identity: {
        const precompile = this.formatter.formatPrecompileIdentity(node)
        return this.formatter.printPrecompileReturn(precompile, nextPrefix)
      }
      case PRECOMPILE_ADDRESS.ModExp: {
        const precompile = this.formatter.formatPrecompileModExp(node)
        return this.formatter.printPrecompileReturn(precompile, nextPrefix)
      }
      case PRECOMPILE_ADDRESS.Bn128Add: {
        const precompile = this.formatter.formatPrecompileBn128Add(node)
        return this.formatter.printPrecompileReturn(precompile, nextPrefix)
      }
      case PRECOMPILE_ADDRESS.Bn128Mul: {
        const precompile = this.formatter.formatPrecompileBn128Mul(node)
        return this.formatter.printPrecompileReturn(precompile, nextPrefix)
      }
      case PRECOMPILE_ADDRESS.Bn128Pairing: {
        const precompile = this.formatter.formatPrecompileBn128Pairing(node)
        return this.formatter.printPrecompileReturn(precompile, nextPrefix)
      }
      case PRECOMPILE_ADDRESS.Blake2f: {
        const precompile = this.formatter.formatPrecompileBlake2f(node)
        return this.formatter.printPrecompileReturn(precompile, nextPrefix)
      }
      case PRECOMPILE_ADDRESS.KzgPointEvaluation: {
        const precompile = this.formatter.formatPrecompileKzgPointEvaluation(node)
        return this.formatter.printPrecompileReturn(precompile, nextPrefix)
      }
      default: {
        return this.formatter.printReturn(node, nextPrefix)
      }
    }
  }

  private formatTraceCall(node: RpcCallTrace, hasError: boolean): string {
    switch (node.to) {
      case PRECOMPILE_ADDRESS.Ecrecover: {
        const precompile = this.formatter.formatPrecompileEcRecover(node)
        return this.formatter.printPrecompileCall(node, precompile, hasError)
      }
      case PRECOMPILE_ADDRESS.Sha256: {
        const precompile = this.formatter.formatPrecompileSha256(node)
        return this.formatter.printPrecompileCall(node, precompile, hasError)
      }
      case PRECOMPILE_ADDRESS.Ripemd160: {
        const precompile = this.formatter.formatPrecompileRipemd160(node)
        return this.formatter.printPrecompileCall(node, precompile, hasError)
      }
      case PRECOMPILE_ADDRESS.Identity: {
        const precompile = this.formatter.formatPrecompileIdentity(node)
        return this.formatter.printPrecompileCall(node, precompile, hasError)
      }
      case PRECOMPILE_ADDRESS.ModExp: {
        const precompile = this.formatter.formatPrecompileModExp(node)
        return this.formatter.printPrecompileCall(node, precompile, hasError)
      }
      case PRECOMPILE_ADDRESS.Bn128Add: {
        const precompile = this.formatter.formatPrecompileBn128Add(node)
        return this.formatter.printPrecompileCall(node, precompile, hasError)
      }
      case PRECOMPILE_ADDRESS.Bn128Mul: {
        const precompile = this.formatter.formatPrecompileBn128Mul(node)
        return this.formatter.printPrecompileCall(node, precompile, hasError)
      }
      case PRECOMPILE_ADDRESS.Bn128Pairing: {
        const precompile = this.formatter.formatPrecompileBn128Pairing(node)
        return this.formatter.printPrecompileCall(node, precompile, hasError)
      }
      case PRECOMPILE_ADDRESS.Blake2f: {
        const precompile = this.formatter.formatPrecompileBlake2f(node)
        return this.formatter.printPrecompileCall(node, precompile, hasError)
      }
      case PRECOMPILE_ADDRESS.KzgPointEvaluation: {
        const precompile = this.formatter.formatPrecompileKzgPointEvaluation(node)
        return this.formatter.printPrecompileCall(node, precompile, hasError)
      }
      default: {
        return this.formatDefaultCall(node, hasError)
      }
    }
  }

  private formatDefaultCall(node: RpcCallTrace, hasError: boolean) {
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
    const paint = hasError ? pc.red : undefined
    switch (node.type) {
      case 'DELEGATECALL':
      case 'CALLCODE': {
        const left =
          this.formatter.addrLabelStyled(node.from as Address, paint) +
          ' → ' +
          this.formatter.addrLabelStyled(node.to, paint)
        const rightLabel = this.formatter.formatGasCall(node, hasError)
        return this.formatter.printGasCall(node, hasError, rightLabel, left, depth)
      }

      case 'CREATE':
      case 'CREATE2': {
        const created = node.to
          ? this.formatter.addrLabelStyled(node.to, paint)
          : this.formatter.addrLabelStyled(undefined, paint)
        const initLen = node.input ? (node.input.length - 2) / 2 : 0

        const rightLabel = this.formatter.formatGasCreateCall(initLen, hasError)
        return this.formatter.printGasCall(node, hasError, rightLabel, created, depth)
      }

      case 'SELFDESTRUCT': {
        const target = this.formatter.addrLabelStyled(node.to, paint)
        const rightLabel = this.formatter.formatGasSelfdestructCall(hasError)
        return this.formatter.printGasCall(node, hasError, rightLabel, target, depth)
      }

      default: {
        const left = this.formatter.addrLabelStyled(node.to, paint)
        const rightLabel = this.formatter.formatGasCall(node, hasError)
        return this.formatter.printGasCall(node, hasError, rightLabel, left, depth)
      }
    }
  }

  private formatGasTraceSummary = (suymmary: GasTally, hasError: boolean, depth: number) => {
    const { topLevelFrames, topLevelTotal, ok, fail, abortedAt } = suymmary
    if (depth !== 0) return
    this.writeLine(pc.bold('\n— Gas summary —'))
    this.writeLine(`frames: ${topLevelFrames}   ok: ${ok}   fail: ${fail}`)
    this.writeLine(`total used : ${pc.bold(Number(topLevelTotal))}`)

    if (hasError) this.writeLine(`${pc.red('reverted at')}: ${pc.red(abortedAt)}`)
  }

  private getUnknownAbisFromCall = (root: RpcCallTrace) => {
    const calls: Set<Address> = new Set()
    this.aggregateCallInputs(root, 0, calls)
    return calls
  }
  private aggregateCallInputs(node: RpcCallTrace, depth: number, calls: Set<Address>) {
    const inputSelector = this.cache.abiItemFromSelector(node.input)
    const outputSelector = this.cache.abiItemFromSelector(node?.output ?? '')

    if (!inputSelector) calls.add(node.to)
    if (node.error && !outputSelector) calls.add(node.to)
    if (!this.cache.contractNames.has(node.to)) calls.add(node.to)

    const children = node.calls ?? []
    for (let i = 0; i < children.length; i++) {
      this.aggregateCallInputs(children[i], depth + 1, calls)
    }
  }

  private writeLine(line = '') {
    this.sink(line)
  }
}
