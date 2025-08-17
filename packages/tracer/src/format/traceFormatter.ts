// formatter patch: better error decoding

import pc from 'picocolors'
import type { Address, Hex } from 'viem'
import { ensureAbi, type TracerCache } from '../cache/index'
import type { RpcCallTrace } from '../callTracer'
import type { Decoder } from '../decoder'
import { nameFromSelector } from '../decoder/utils'
import { theme } from './theme'
import { defaultOpts, type PrettyOpts } from './types'
import {
  badgeFor,
  formatGas,
  formatValueEth,
  prefetchAbis,
  truncate,
} from './utils'

export class TraceFormatter {
  constructor(
    private readonly cache: TracerCache,
    private readonly decoder: Decoder,
  ) {}

  private addrLabelStyled = (
    addr: Address | undefined,
    colorOverride?: (s: string) => string,
  ) => {
    if (!addr) return (colorOverride ?? theme.addr)('<unknown>')
    const key = addr.toLowerCase()
    //   const name = reg.labels?.[key]
    const name = undefined
    const color = colorOverride ?? theme.addr
    const addrC = color(key)
    return name ? `${theme.contract(name)}<${addrC}>` : addrC
  }

  public formatTraceColored = async (root: RpcCallTrace, opts?: PrettyOpts) => {
    const o = { ...defaultOpts, ...(opts || {}) }
    await prefetchAbis(root, this.cache)

    const lines: string[] = []

    const walk = async (
      node: RpcCallTrace,
      prefix: string,
      isLast: boolean,
      depth: number,
    ) => {
      const branch = depth === 0 ? '' : prefix + (isLast ? '└─ ' : '├─ ')
      const nextPrefix = prefix + (isLast ? '   ' : '│  ')

      // Is this call frame in error?
      const hasError = !!node.error

      // Decode call
      const _abi = await ensureAbi(this.cache, node.to)
      const { fnName, prettyArgs, fnItem } = this.decoder.decodeCallWithNames(
        node.to,
        node.input,
      )
      const selectorSig = !fnName
        ? nameFromSelector(node.input, this.cache)
        : undefined

      // Add_abis labels (make them red if this frame errored)
      const contractTxt = this.addrLabelStyled(
        node.to,
        hasError ? pc.red : undefined,
      )

      const leftSide =
        node.type === 'DELEGATECALL'
          ? [
              this.addrLabelStyled(
                node.from as Address,
                hasError ? pc.red : undefined,
              ),
              ' → ',
              contractTxt,
            ].join('')
          : contractTxt

      // Method text (make method bold red if this frame errored)
      const fnTxt = (() => {
        if (fnName) {
          const styled = hasError ? pc.bold(pc.red(fnName)) : theme.fn(fnName)
          return `${styled}(${prettyArgs ?? ''})`
        }
        if (selectorSig) {
          return hasError ? pc.bold(pc.red(selectorSig)) : theme.fn(selectorSig)
        }
        return node.input && node.input !== '0x'
          ? theme.dim(`calldata=${truncate(node.input, o.maxData)}`)
          : theme.dim('()')
      })()

      const valueStr = theme.dim(`value=${formatValueEth(node.value)} `)
      const gasStr = o.showGas
        ? theme.dim(
            `gas=${formatGas(node.gas, !o.hexGas)} used=${formatGas(node.gasUsed, !o.hexGas)}`,
          )
        : ''
      const typeStr = ` ${badgeFor(node.type)}`

      // add a ❌ badge on any errored frame
      const failBadge = hasError ? ` ${pc.red('❌')}` : ''

      lines.push(
        branch +
          `${leftSide} :: ${fnTxt} ${valueStr}${gasStr}${typeStr}${failBadge}`.trimEnd(),
      )

      // … (keep the rest of your logs/children/return logic as-is)
      // Logs
      if (o.showLogs && node.logs?.length) {
        const lastIdx = node.logs.length - 1
        for (let i = 0; i < node.logs.length; i++) {
          const lg = node.logs[i]!
          const isLastLog = i === lastIdx && (node.calls?.length ?? 0) === 0
          const logBranch = nextPrefix + (isLastLog ? '└─ ' : '├─ ')
          const dec = this.decoder.safeDecodeEvent(
            lg.address,
            lg.topics,
            lg.data,
          )
          if (dec.name) {
            const argPairs = Object.entries(dec.args ?? {})
              .map(([k, v]) => `${theme.argKey(k)}: ${theme.argVal(String(v))}`)
              .join(', ')
            lines.push(
              logBranch +
                `${theme.emit('emit')} ${theme.emit(dec.name)}(${argPairs})`,
            )
          } else {
            lines.push(
              logBranch +
                `${theme.emit('emit')} ${this.addrLabelStyled(lg.address)} ${theme.dim(
                  `topic0=${lg.topics?.[0] ?? ''} data=${truncate(lg.data, o.maxData)}`,
                )}`,
            )
          }
        }
      }

      // Children
      const children = node.calls ?? []
      for (let i = 0; i < children.length; i++) {
        await walk(
          children[i]!,
          nextPrefix,
          i === children.length - 1,
          depth + 1,
        )
      }

      // Tail (use your improved revert decoding from earlier)
      const tailPrefix = depth === 0 ? '' : nextPrefix
      if (node.error) {
        const pretty =
          (await this.decoder.decodeRevertPrettyFromFrame(
            node.to as Address,
            node.output as Hex,
          )) ??
          node.revertReason ??
          node.error
        lines.push(
          `${tailPrefix}${theme.revLabel('[Revert]')} ${theme.revData(pretty)}`,
        )
      } else if (o.showReturnData) {
        const decoded = this.decoder.decodeReturnPretty(fnItem, node.output)
        if (decoded && decoded.length > 0) {
          lines.push(
            tailPrefix +
              `${theme.retLabel('[Return]')} ${theme.retData(decoded)}`,
          )
        } else {
          const ret =
            node.output && node.output !== '0x'
              ? truncate(node.output, o.maxData)
              : theme.dim('()')
          lines.push(`${tailPrefix}${theme.retLabel('[Return]')} ${ret}`)
        }
      }
    }

    await walk(root, '', true, 0)
    return lines.join('\n')
  }
}
