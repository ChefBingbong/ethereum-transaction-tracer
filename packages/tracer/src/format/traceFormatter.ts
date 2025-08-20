import {
  LoggerProvider,
  safeError,
  safeResult,
  safeTimeoutPromiseAll,
  safeTry,
} from '@evm-transaction-trace/core'
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
export class TraceFormatter {
  private readonly logger: LoggerProvider
  constructor(
    private readonly cache: TracerCache,
    private readonly decoder: Decoder,
    level: boolean,
    private readonly verbosity: LogVerbosity,
  ) {
    this.logger = new LoggerProvider(level)
    this.logger.init()
  }

  public formatTraceColored = async (root: RpcCallTrace, _opts?: PrettyOpts) => {
    const [error, _] = await this.prefetchAbis(root)
    if (error) safeError(error)

    const out: string[] = []
    await this.walk(root, '', true, 0, out)

    const totalGas =
      root.calls?.reduce((acc, curr) => {
        return acc + Number(curr.gasUsed)
      }, 0) ?? 0

    out.push('')
    out.push(pc.bold('— Gas summary —'))
    out.push(`total used: ${pc.bold(Number(totalGas))}`)

    await this.cache.save()
    return safeResult(out.join('\n'))
  }

  public async formatGasTraceColored(root: RpcCallTrace) {
    const [error, _] = await this.prefetchAbis(root)
    if (error) safeError(error)
    const usedAddrSet: Set<Address> = new Set()

    const out: string[] = []
    const tally: GasTally = {
      totalGas: 0n,
      frames: 0,
      succeeded: 0,
      failed: 0,
    }

    const walk = async (
      node: RpcCallTrace,
      prefix: string,
      isLast: boolean,
      depth: number,
      usedAddrSet: Set<Address>,
    ): Promise<boolean> => {
      const branch = ''
      const nextPrefix = prefix + (isLast ? '   ' : '│  ')
      const hasError = Boolean(node.error)
      const method = this.gasMethodLabel(node, hasError, usedAddrSet)
      const used = hexToBig(node.gasUsed)

      if (hasError) {
        tally.abortedAt = method
        return true
      }

      tally.totalGas += used
      tally.frames += 1
      if (hasError) tally.failed += 1
      else tally.succeeded += 1
      usedAddrSet.add(node.to)

      const usedStr = Number(used).toString() // decimal for readability

      out.push(
        branch +
          method +
          ' ' +
          pc.dim('—') +
          ` used=${pc.bold(usedStr)}` +
          (hasError ? ` ${pc.red('❌')}` : ''),
      )

      const children = node.calls ?? []
      for (let i = 0; i < children.length; i++) {
        const abort = await walk(
          children[i]!,
          nextPrefix,
          i === children.length - 1,
          depth + 1,
          usedAddrSet,
        )
        if (abort) return true
      }
      return false
    }

    await walk(root, '', true, 0, usedAddrSet)

    out.push('')
    out.push(pc.bold('— Gas summary —'))
    if (tally.abortedAt) {
      out.push(`${pc.red('reverted at')}: ${pc.red(tally.abortedAt)}`)
    }
    out.push(`frames: ${tally.frames}   ok: ${tally.succeeded}   fail: ${tally.failed}`)
    out.push(`total used: ${pc.bold(Number(hexToBig(root.gasUsed) - tally.totalGas))}`)

    return safeResult(out.join('\n'))
  }

  private addrLabelStyled(_addr: Address | undefined, color?: (s: string) => string) {
    const paint = color ?? addr
    if (!_addr) return paint('<unknown>')
    return paint(isAddressEqual(_addr, zeroAddress) ? 'Precompile.DataCopy' : _addr.toLowerCase())
  }

  badgeFor = (t: RpcCallType) => typeBadge(`[${t.toLowerCase()}]`)

  private prefetchAbis = async (root: RpcCallTrace) => {
    if (!root.calls) return safeResult(undefined)
    return safeTimeoutPromiseAll(
      root.calls.map((a) => this.cache.ensureAbi(a.to, a.input)),
      10000,
    )
  }

  private gasMethodLabel(node: RpcCallTrace, hasError: boolean, usedAddrSet: Set<Address>): string {
    const paint = hasError ? pc.red : undefined

    const left = (() => {
      switch (node.type) {
        case 'DELEGATECALL':
        case 'CALLCODE':
          return (
            this.addrLabelStyled(node.from as Address, paint) +
            ' → ' +
            this.addrLabelStyled(node.to, paint)
          )
        case 'CREATE':
        case 'CREATE2': {
          const created = node.to
            ? this.addrLabelStyled(node.to, paint)
            : this.addrLabelStyled(undefined, paint)

          const initLen = node.input ? (node.input.length - 2) / 2 : 0
          const createFn = hasError ? pc.bold(pc.red('create')) : fn('create')
          return `${created} :: ${createFn}(init_code_len=${initLen})`
        }
        case 'SELFDESTRUCT': {
          const target = this.addrLabelStyled(node.to, paint)
          const sd = hasError ? pc.bold(pc.red('selfdestruct')) : fn('selfdestruct')
          return `${target} :: ${sd}`
        }
        default:
          return this.addrLabelStyled(node.to, paint)
      }
    })()

    if (
      left.includes('::') &&
      (node.type === 'CREATE' || node.type === 'CREATE2' || node.type === 'SELFDESTRUCT')
    ) {
      return left
    }

    const { fnName } = this.decoder.decodeCallWithNames(node.to, node.input)
    const pre = this.decoder.formatPrecompilePretty(node.to, node.input, node.output)
    const selectorSig = nameFromSelector(node.to, this.cache)

    if (pre?.name) {
      const styled = hasError ? pc.bold(pc.red(pre.name)) : fn(pre.name)
      return `${!usedAddrSet.has(node.to) ? `${left}\n` : '• '}${styled}()`
    }

    if (fnName) {
      const styled = hasError ? pc.bold(pc.red(fnName)) : retData(fnName)
      return `${!usedAddrSet.has(node.to) ? `${left}\n` : ''} • ${styled}()`
    }

    if (selectorSig) {
      const styled = hasError ? pc.bold(pc.red(selectorSig)) : fn(selectorSig)
      return `${left} :: ${styled}`
    }

    if (node.input && node.input !== '0x') {
      return `${dim('')}`
    }
    return `• ${dim('()')}`
  }

  private async walk(
    node: RpcCallTrace,
    prefix: string,
    isLast: boolean,
    depth: number,
    out: string[],
  ) {
    const branch = depth === 0 ? '' : prefix + (isLast ? '└─ ' : '├─ ')
    const nextPrefix = prefix + (isLast ? '   ' : '│  ')
    const hasError = Boolean(node.error)

    const [error, _] = await safeTry(this.cache.ensureAbi(node.to, node.input))
    if (error) this.logger.debug(error.message)

    out.push(branch + this.renderHeader(node, hasError).trimEnd())

    if (node.logs?.length && this.verbosity > LogVerbosity.High) {
      for (let i = 0; i < node.logs.length; i++) {
        const lg = node.logs[i]
        if (!node.logs[i]) continue
        const lastLog = i === node.logs.length - 1 && (node.calls?.length ?? 0) === 0
        out.push(
          nextPrefix + (lastLog ? '└─ ' : '├─ ') + this.renderLog(lg.address, lg.topics, lg.data),
        )
      }
    }

    if (this.verbosity > LogVerbosity.Low) {
      const children = node.calls ?? []
      for (let i = 0; i < children.length; i++) {
        const [error, _] = await safeTry(
          this.walk(children[i]!, nextPrefix, i === children.length - 1, depth + 1, out),
        )
        if (error) {
          this.logger.debug('error.message')
        }
      }
    }

    const tail = this.renderTail(node, nextPrefix, hasError)
    out.push(...tail)
  }

  private renderHeader(node: RpcCallTrace, hasError: boolean): string {
    const typeBadge = ` ${this.badgeFor(node.type)}`
    const failBadge = hasError ? ` ${pc.red('❌')}` : ''

    const valueStr = dim(`value=${formatValueEth(node.value)} `)
    const gasStr = dim(`gas=${formatGas(node.gas, true)} used=${formatGas(node.gasUsed, true)}`)

    const paint = hasError ? pc.red : undefined

    switch (node.type) {
      case 'CALL':
      case 'STATICCALL': {
        const left = this.addrLabelStyled(node.to, paint)
        const method = this.renderMethod(node, hasError)
        return `${left} :: ${method} ${valueStr}${gasStr}${typeBadge}${failBadge}`
      }
      case 'DELEGATECALL':
      case 'CALLCODE': {
        if (node.type === 'DELEGATECALL' && this.verbosity <= LogVerbosity.Medium) return ''
        const left =
          this.addrLabelStyled(node.from as Address, paint) +
          ' → ' +
          this.addrLabelStyled(node.to, paint)
        const method = this.renderMethod(node, hasError)
        return `${left} :: ${method} ${valueStr}${gasStr}${typeBadge}${failBadge}`
      }
      case 'CREATE':
      case 'CREATE2': {
        const created = node.to
          ? this.addrLabelStyled(node.to, paint)
          : this.addrLabelStyled(undefined, paint)
        const initLen = node.input ? (node.input.length - 2) / 2 : 0
        const method = hasError ? pc.bold(pc.red('create')) : fn('create')
        return `${created} :: ${method}(init_code_len=${initLen}) ${valueStr}${gasStr}${typeBadge}${failBadge}`
      }
      case 'SELFDESTRUCT': {
        const target = this.addrLabelStyled(node.to, paint)
        const method = hasError ? pc.bold(pc.red('selfdestruct')) : fn('selfdestruct')
        return `${target} :: ${method} ${valueStr}${gasStr}${typeBadge}${failBadge}`
      }
      default: {
        const left = this.addrLabelStyled(node.to, paint)
        const calld =
          node.input && node.input !== '0x' ? dim(`calldata=${truncate(node.input)}`) : dim('()')
        return `${left} :: ${calld} ${valueStr}${gasStr}${typeBadge}${failBadge}`
      }
    }
  }

  private renderMethod(node: RpcCallTrace, hasError: boolean): string {
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
      if (node.input && node.input !== '0x') {
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
    if (node.input && node.input !== '0x') {
      return dim(`calldata=${truncate(node.input)}`)
    }
    return dim('()')
  }

  private renderLog(
    addr: Address,
    topics: [signature: `0x${string}`, ...args: `0x${string}`[]],
    data: Hex,
  ): string {
    const dec = this.decoder.safeDecodeEvent(topics, data)
    if (dec.name) {
      const argPairs = Object.entries(dec.args ?? {})
        .map(([k, v]) => `${eventArgVal(k)}: ${argVal(String(v))}`)
        .join(', ')
      return `${emit('emit')} ${emit(dec.name)}(${argPairs})`
    }
    return `${emit('emit')} ${this.addrLabelStyled(addr)} ${dim(
      `topic0=${topics?.[0] ?? ''} data=${truncate(data)}`,
    )}`
  }

  private renderTail(node: RpcCallTrace, nextPrefix: string, hasError: boolean) {
    const lines: string[] = []
    const tailPrefix = nextPrefix

    if (hasError) {
      const pretty =
        this.decoder.decodeRevertPrettyFromFrame(node.output as Hex) ??
        node.revertReason ??
        node.error
      lines.push(`${tailPrefix}${revLabel('[Revert]')} ${revData(pretty)}`)
      return lines
    }

    const pre = this.decoder.formatPrecompilePretty(node.to, node.input, node.output)
    if (pre) {
      node.output && node.output !== '0x' ? truncate(node.output) : dim('()')
      lines.push(`${tailPrefix}${retLabel('[Return]')} ${stringify(pre.outputText)}`)
      return lines
    }

    const { fnItem } = this.decoder.decodeCallWithNames(node.to, node.input)
    const decoded = this.decoder.decodeReturnPretty(fnItem, node.output)
    if (decoded && decoded.length > 0) {
      lines.push(`${tailPrefix}${retLabel('[Return]')} ${retData(decoded)}`)
    } else {
      const ret = node.output && node.output !== '0x' ? truncate(node.output) : dim('()')
      lines.push(`${tailPrefix}${retLabel('[Return]')} ${ret}`)
    }
    return lines
  }
}
