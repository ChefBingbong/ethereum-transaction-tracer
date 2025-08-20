import { LoggerProvider, safeTry } from '@evm-transaction-trace/core'
import pc from 'picocolors'
import { type Address, type Hex, isAddressEqual, zeroAddress } from 'viem'
import type { TracerCache } from '../cache/index'
import { LogVerbosity, type RpcCallTrace, type RpcCallType } from '../callTracer'
import type { Decoder } from '../decoder'
import { nameFromSelector, stringify } from '../decoder/utils'
import {
  addr,
  argVal,
  dim,
  emit,
  eventArgVal,
  fn,
  retData,
  retLabel,
  revData,
  revLabel,
  typeBadge,
} from './theme'
import type { PrettyOpts } from './types'
import { formatGas, formatValueEth, truncate } from './utils'

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

  constructor(
    private readonly cache: TracerCache,
    private readonly decoder: Decoder,
    level: boolean,
    private verbosity: LogVerbosity,
    _opts?: { sink?: LineSink },
  ) {
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
        this.writeLine(this.formatLog(lastLog, lg.address, lg.topics, lg.data, nextPrefix))
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
    const typeBadge = isGasCall ? '' : ` ${this.badgeFor(node.type)}`
    const failBadge = isGasCall ? '' : hasError ? ` ${pc.red('❌')}` : ''

    const valueStr = isGasCall ? '' : dim(`value=${formatValueEth(node.value)} `)
    const gasStr = dim(`gas=${formatGas(node.gas, true)} used=${formatGas(node.gasUsed, true)}`)

    const paint = hasError ? pc.red : undefined

    switch (node.type) {
      case 'CALL':
      case 'STATICCALL': {
        const left = this.addrLabelStyled(node.to, paint)
        const method = this.formatContractCall(node, hasError)
        return `${left} :: ${method} ${valueStr}${gasStr}${typeBadge}${failBadge} \n${this.formatReturn(node, nextPrefix, hasError, isGasCall)}`
      }
      case 'DELEGATECALL':
      case 'CALLCODE': {
        if (node.type === 'DELEGATECALL' && this.verbosity <= LogVerbosity.Medium) return ''
        const left =
          this.addrLabelStyled(node.from as Address, paint) +
          ' → ' +
          this.addrLabelStyled(node.to, paint)
        const method = this.formatContractCall(node, hasError)
        return `${left} :: ${method} ${valueStr}${gasStr}${typeBadge}${failBadge} \n${this.formatReturn(node, nextPrefix, hasError, isGasCall)}`
      }
      case 'CREATE':
      case 'CREATE2': {
        const created = node.to
          ? this.addrLabelStyled(node.to, paint)
          : this.addrLabelStyled(undefined, paint)
        const initLen = node.input ? (node.input.length - 2) / 2 : 0
        const method = hasError ? pc.bold(pc.red('create')) : fn('create')
        return `${created} :: ${method}(init_code_len=${initLen}) ${valueStr}${gasStr}${typeBadge}${failBadge} \n${this.formatReturn(node, nextPrefix, hasError, isGasCall)}`
      }
      case 'SELFDESTRUCT': {
        const target = this.addrLabelStyled(node.to, paint)
        const method = hasError ? pc.bold(pc.red('selfdestruct')) : fn('selfdestruct')
        return `${target} :: ${method} ${valueStr}${gasStr}${typeBadge}${failBadge} \n${this.formatReturn(node, nextPrefix, hasError, isGasCall)}`
      }
      default: {
        const left = this.addrLabelStyled(node.to, paint)
        const calld =
          !isGasCall && node.input && node.input !== '0x'
            ? dim(`calldata=${truncate(node.input)}`)
            : dim('()')
        return `${left} :: ${calld} ${valueStr}${gasStr}${typeBadge}${failBadge} \n${this.formatReturn(node, nextPrefix, hasError, isGasCall)}`
      }
    }
  }

  private formatContractCall(node: RpcCallTrace, hasError: boolean, isGasCall = false): string {
    const pre = this.decoder.formatPrecompilePretty(node.to, node.input, node.output)
    if (pre) {
      const selectorSig = !pre.name ? nameFromSelector(node.input, this.cache) : undefined

      if (pre.name) {
        const styled = hasError ? pc.bold(pc.red(pre.name)) : fn(pre.name)
        return `${styled}(${pre.inputText ?? ''})`
      }
      if (selectorSig) {
        const styled = hasError ? pc.bold(pc.red(selectorSig)) : fn(selectorSig)
        return styled
      }
      if (!isGasCall && node.input && node.input !== '0x') {
        return dim(`calldata=${truncate(node.input)}`)
      }
      return dim('()')
    }
    const { fnName, prettyArgs } = this.decoder.decodeCallWithNames(node.to, node.input)
    const selectorSig = !fnName ? nameFromSelector(node.input, this.cache) : undefined

    if (fnName) {
      const styled = hasError ? pc.bold(pc.red(fnName)) : fn(fnName)

      if (this.verbosity <= LogVerbosity.Medium) return `${styled}()`
      else return `${styled}(${prettyArgs ?? ''})`
    }
    if (selectorSig) {
      const styled = hasError ? pc.bold(pc.red(selectorSig)) : fn(selectorSig)
      return styled
    }
    if (!isGasCall && node.input && node.input !== '0x') {
      return dim(`calldata=${truncate(node.input)}`)
    }
    return dim('()')
  }

  private formatLog(
    lastLog: boolean,
    addr: Address,
    topics: [signature: `0x${string}`, ...args: `0x${string}`[]],
    data: Hex,
    nextPrefix: string,
  ): string {
    const dec = this.decoder.safeDecodeEvent(topics, data)
    if (dec.name) {
      const argPairs = Object.entries(dec.args ?? {})
        .map(([k, v]) => `${eventArgVal(k)}: ${argVal(String(v))}`)
        .join(', ')
      return `${emit('emit')} ${emit(dec.name)}(${argPairs})`
    }
    return `${nextPrefix + (lastLog ? '└─ ' : '├─ ')}${emit('emit')} ${this.addrLabelStyled(addr)} ${dim(
      `topic0=${topics?.[0] ?? ''} data=${truncate(data)}`,
    )}`
  }

  private formatReturn(
    node: RpcCallTrace,
    nextPrefix: string,
    hasError: boolean,
    isGasCall = false,
  ) {
    if (isGasCall) return ''
    const tailPrefix = nextPrefix

    if (hasError) {
      const pretty =
        this.decoder.decodeRevertPrettyFromFrame(node.output as Hex) ??
        node.revertReason ??
        node.error
      return `${tailPrefix}${revLabel('[Revert]')} ${revData(pretty)}`
    }

    const pre = this.decoder.formatPrecompilePretty(node.to, node.input, node.output)
    if (pre) {
      node.output && node.output !== '0x' ? truncate(node.output) : dim('()')
      return `${tailPrefix}${retLabel('[Return]')} ${stringify(pre.outputText)}`
    }

    const { fnItem } = this.decoder.decodeCallWithNames(node.to, node.input)
    const decoded = this.decoder.decodeReturnPretty(fnItem, node.output)
    if (decoded && decoded.length > 0) {
      return `${tailPrefix}${retLabel('[Return]')} ${retData(decoded)}`
    } else {
      const ret = node.output && node.output !== '0x' ? truncate(node.output) : dim('()')
      return `${tailPrefix}${retLabel('[Return]')} ${ret}`
    }
  }

  private addrLabelStyled(_addr: Address | undefined, color?: (s: string) => string) {
    const paint = color ?? addr
    if (!_addr) return paint('<unknown>')
    return paint(isAddressEqual(_addr, zeroAddress) ? 'Precompile.DataCopy' : _addr.toLowerCase())
  }

  badgeFor = (t: RpcCallType) => typeBadge(`[${t.toLowerCase()}]`)
}
