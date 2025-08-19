import {
  safeError,
  safeResult,
  safeTimeoutPromiseAll,
  safeTry,
} from '@evm-transaction-trace/core'
import pc from 'picocolors'
import type { Address, Hex } from 'viem'
import type { TracerCache } from '../cache/index'
import type { RpcCallTrace, RpcCallType } from '../callTracer'
import type { Decoder } from '../decoder'
import { nameFromSelector, stringify } from '../decoder/utils'
import { formatPrecompilePretty } from './formatPrecompile'
import { theme } from './theme'
import { defaultOpts, type PrettyOpts } from './types'
import { formatGas, formatValueEth, truncate } from './utils'

export class TraceFormatter {
  constructor(
    private readonly cache: TracerCache,
    private readonly decoder: Decoder,
  ) {}

  private addrLabelStyled(
    addr: Address | undefined,
    color?: (s: string) => string,
  ) {
    const paint = color ?? theme.addr
    if (!addr) return paint('<unknown>')
    const key =
      addr.toLowerCase() === '0x0000000000000000000000000000000000000004'
        ? 'Precompile.DataCopy'
        : addr.toLowerCase()
    return paint(key)
  }

  badgeFor = (t: RpcCallType) => theme.typeBadge(`[${t.toLowerCase()}]`)

  private collectAddresses = (root: RpcCallTrace) => {
    const s = new Set<Address>()
    const walk = (n: RpcCallTrace) => {
      if (n.to) s.add(n.to)
      if (n.from) s.add(n.from)
      if (n.logs) for (const lg of n.logs) s.add(lg.address)
      if (n.calls) n.calls.forEach(walk)
    }
    walk(root)
    return s
  }

  private prefetchAbis = async (root: RpcCallTrace) => {
    const addrs = this.collectAddresses(root)
    return safeTimeoutPromiseAll(
      Array.from(addrs).map((a) => this.cache.ensureAbi(a)),
      5000,
    )
  }

  public formatTraceColored = async (root: RpcCallTrace, opts?: PrettyOpts) => {
    const [error, _] = await this.prefetchAbis(root)
    if (error) safeError(error)

    const out: string[] = []
    await this.walk(root, '', true, 0, { ...defaultOpts, ...(opts || {}) }, out)
    return safeResult(out.join('\n'))
  }

  private async walk(
    node: RpcCallTrace,
    prefix: string,
    isLast: boolean,
    depth: number,
    o: Required<typeof defaultOpts>,
    out: string[],
  ) {
    const branch = depth === 0 ? '' : prefix + (isLast ? '└─ ' : '├─ ')
    const nextPrefix = prefix + (isLast ? '   ' : '│  ')
    const hasError = Boolean(node.error)

    const [error, _] = await safeTry(this.cache.ensureAbi(node.to, node.input))
    if (error) {
      //log
    }

    out.push(branch + this.renderHeader(node, hasError, o).trimEnd())

    // Logs
    if (o.showLogs && node.logs?.length) {
      const lastIdx = node.logs.length - 1
      for (let i = 0; i < node.logs.length; i++) {
        const lg = node.logs[i]
        if (!lg) continue
        const lastLog = i === lastIdx && (node.calls?.length ?? 0) === 0
        out.push(
          nextPrefix +
            (lastLog ? '└─ ' : '├─ ') +
            this.renderLog(lg.address, lg.topics, lg.data, o),
        )
      }
    }

    const children = node.calls ?? []
    for (let i = 0; i < children.length; i++) {
      const [error, _] = await safeTry(
        this.walk(
          children[i]!,
          nextPrefix,
          i === children.length - 1,
          depth + 1,
          o,
          out,
        ),
      )
      if (error) {
        //log
      }
    }

    const tail = this.renderTail(node, nextPrefix, o, hasError)
    out.push(...tail)
  }

  private renderHeader(
    node: RpcCallTrace,
    hasError: boolean,
    o: Required<typeof defaultOpts>,
  ): string {
    const typeBadge = ` ${this.badgeFor(node.type)}`
    const failBadge = hasError ? ` ${pc.red('❌')}` : ''

    // Common trailing info
    const valueStr = theme.dim(`value=${formatValueEth(node.value)} `)
    const gasStr = o.showGas
      ? theme.dim(
          `gas=${formatGas(node.gas, !o.hexGas)} used=${formatGas(node.gasUsed, !o.hexGas)}`,
        )
      : ''

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
        const method = hasError ? pc.bold(pc.red('create')) : theme.fn('create')
        return `${created} :: ${method}(init_code_len=${initLen}) ${valueStr}${gasStr}${typeBadge}${failBadge}`
      }
      case 'SELFDESTRUCT': {
        const target = this.addrLabelStyled(node.to, paint)
        const method = hasError
          ? pc.bold(pc.red('selfdestruct'))
          : theme.fn('selfdestruct')
        return `${target} :: ${method} ${valueStr}${gasStr}${typeBadge}${failBadge}`
      }
      default: {
        const left = this.addrLabelStyled(node.to, paint)
        const calld =
          node.input && node.input !== '0x'
            ? theme.dim(`calldata=${truncate(node.input, o.maxData)}`)
            : theme.dim('()')
        return `${left} :: ${calld} ${valueStr}${gasStr}${typeBadge}${failBadge}`
      }
    }
  }

  private renderMethod(node: RpcCallTrace, hasError: boolean): string {
    const pre = formatPrecompilePretty(node.to, node.input, node.output)
    if (pre) {
      const selectorSig = !pre.name
        ? nameFromSelector(node.input, this.cache)
        : undefined

      if (pre.name) {
        const styled = hasError ? pc.bold(pc.red(pre.name)) : theme.fn(pre.name)
        return `${styled}(${pre.inputText ?? ''})`
      }
      if (selectorSig) {
        const styled = hasError
          ? pc.bold(pc.red(selectorSig))
          : theme.fn(selectorSig)
        return styled
      }
      if (node.input && node.input !== '0x') {
        return theme.dim(
          `calldata=${truncate(node.input, defaultOpts.maxData)}`,
        )
      }
      return theme.dim('()')
    }
    const { fnName, prettyArgs } = this.decoder.decodeCallWithNames(
      node.to,
      node.input,
    )
    const selectorSig = !fnName
      ? nameFromSelector(node.input, this.cache)
      : undefined

    if (fnName) {
      const styled = hasError ? pc.bold(pc.red(fnName)) : theme.fn(fnName)
      return `${styled}(${prettyArgs ?? ''})`
    }
    if (selectorSig) {
      const styled = hasError
        ? pc.bold(pc.red(selectorSig))
        : theme.fn(selectorSig)
      return styled
    }
    if (node.input && node.input !== '0x') {
      return theme.dim(`calldata=${truncate(node.input, defaultOpts.maxData)}`)
    }
    return theme.dim('()')
  }

  private renderLog(
    addr: Address,
    topics: [signature: `0x${string}`, ...args: `0x${string}`[]],
    data: Hex,
    o: Required<typeof defaultOpts>,
  ): string {
    const dec = this.decoder.safeDecodeEvent(addr, topics, data)
    if (dec.name) {
      const argPairs = Object.entries(dec.args ?? {})
        .map(([k, v]) => `${theme.eventArgVal(k)}: ${theme.argVal(String(v))}`)
        .join(', ')
      return `${theme.emit('emit')} ${theme.emit(dec.name)}(${argPairs})`
    }
    return `${theme.emit('emit')} ${this.addrLabelStyled(addr)} ${theme.dim(
      `topic0=${topics?.[0] ?? ''} data=${truncate(data, o.maxData)}`,
    )}`
  }

  private renderTail(
    node: RpcCallTrace,
    nextPrefix: string,
    o: Required<typeof defaultOpts>,
    hasError: boolean,
  ) {
    const lines: string[] = []
    const tailPrefix = nextPrefix

    if (hasError) {
      const pretty =
        this.decoder.decodeRevertPrettyFromFrame(
          node.to as Address,
          node.output as Hex,
        ) ??
        node.revertReason ??
        node.error
      lines.push(
        `${tailPrefix}${theme.revLabel('[Revert]')} ${theme.revData(pretty)}`,
      )
      return lines
    }

    if (!o.showReturnData) return lines

    // 1) PRECOMPILE fast-path
    const pre = formatPrecompilePretty(node.to, node.input, node.output)
    if (pre) {
      node.output && node.output !== '0x'
        ? truncate(node.output, o.maxData)
        : theme.dim('()')
      lines.push(
        `${tailPrefix}${theme.retLabel('[Return]')} ${stringify(pre.outputText)}`,
      )
      return lines
    }

    const { fnItem } = this.decoder.decodeCallWithNames(node.to, node.input)
    const decoded = this.decoder.decodeReturnPretty(fnItem, node.output)
    if (decoded && decoded.length > 0) {
      lines.push(
        `${tailPrefix}${theme.retLabel('[Return]')} ${theme.retData(decoded)}`,
      )
    } else {
      const ret =
        node.output && node.output !== '0x'
          ? truncate(node.output, o.maxData)
          : theme.dim('()')
      lines.push(`${tailPrefix}${theme.retLabel('[Return]')} ${ret}`)
    }
    return lines
  }
}
