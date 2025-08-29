import type { EventTopic } from '@evm-tt/utils'
import {
  hexToBig,
  isPrecompileSource,
  SUMMARY_DEPTH,
  stringify,
  truncate,
} from '@evm-tt/utils'
import pc from 'picocolors'
import type { Address, Hex } from 'viem'
import type { TracerCache } from '../cache'
import type { Decoder } from '../decoder'
import { LogVerbosity, type RpcCallTrace } from '../types'
import {
  addrLabelStyled,
  argVal,
  dark,
  dim,
  emit,
  eventArgVal,
  fn,
  getSharedBadges,
  nameFromSelector,
  retData,
  retLabel,
  revData,
  revLabel,
  sumInner,
} from './theme'

export class TraceFormatter {
  constructor(
    private readonly decoder: Decoder,
    private readonly cache: TracerCache,
    private verbosity: LogVerbosity,
  ) {}

  public printCall = (node: RpcCallTrace, hasError: boolean) => {
    const paint = hasError ? pc.red : undefined
    const left = addrLabelStyled(node.to, this.cache, paint)
    const method = this.formatContractCall(node, hasError)
    const { typeBadge, valueStr, gasStr, failBadge } = getSharedBadges(
      node,
      this.verbosity,
      hasError,
    )
    return `${left}::${method} ${typeBadge} ${valueStr}${gasStr}${failBadge}`
  }

  public printDelegateCall = (node: RpcCallTrace, hasError: boolean) => {
    const paint = hasError ? pc.red : undefined
    const fromLabel = addrLabelStyled(node.from, this.cache, paint)
    const toLabel = addrLabelStyled(node.to, this.cache, paint)
    const { typeBadge, valueStr, gasStr, failBadge } = getSharedBadges(
      node,
      this.verbosity,
      hasError,
    )
    const left = `${fromLabel} → ${toLabel}`
    const method = this.formatContractCall(node, hasError)
    return `${left}::${method} ${typeBadge} ${valueStr}${gasStr}${failBadge}`
  }

  public printCreateCall = (node: RpcCallTrace, hasError: boolean) => {
    const paint = hasError ? pc.red : undefined
    const method = hasError ? pc.bold(pc.red('create')) : fn('create')
    const initLen = `init_code_len=${node.input ? (node.input.length - 2) / 2 : 0}`

    const { typeBadge, valueStr, gasStr, failBadge } = getSharedBadges(
      node,
      this.verbosity,
      hasError,
    )
    const created = node.to
      ? addrLabelStyled(node.to, this.cache, paint)
      : addrLabelStyled(undefined, this.cache, paint)

    return `${created}::${method}(${initLen}) ${typeBadge} ${valueStr}${gasStr}${failBadge}`
  }

  public printSeltDestructCall = (node: RpcCallTrace, hasError: boolean) => {
    const paint = hasError ? pc.red : undefined
    const target = addrLabelStyled(node.to, this.cache, paint)
    const method = hasError
      ? pc.bold(pc.red('selfdestruct'))
      : fn('selfdestruct')

    const { typeBadge, valueStr, gasStr, failBadge } = getSharedBadges(
      node,
      this.verbosity,
      hasError,
    )
    return `${target}::${method} ${typeBadge} ${valueStr}${gasStr}${failBadge}`
  }

  public printDefault = (node: RpcCallTrace, hasError: boolean) => {
    const paint = hasError ? pc.red : undefined
    const left = addrLabelStyled(node.to, this.cache, paint)
    const { typeBadge, valueStr, gasStr, failBadge } = getSharedBadges(
      node,
      this.verbosity,
      hasError,
    )
    const calld =
      node.input && node.input !== '0x'
        ? dim(`calldata=${truncate(node.input)}`)
        : dim('()')
    return `${left}::${calld} ${typeBadge} ${valueStr}${gasStr}${failBadge}`
  }

  public printLog(
    lastLog: boolean,
    addr: Address,
    topics: EventTopic,
    data: Hex,
    nextPrefix: string,
  ): string {
    const logPrefix = `${nextPrefix + (lastLog ? '└─ ' : '├─ ')}${emit('emit')}`
    const [error, dec] = this.decoder.safeDecodeEvent(topics, data)

    if (!error) {
      const argPairs = Object.entries(dec.args ?? {}).map(
        ([k, v]) => `${eventArgVal(k)}: ${argVal(String(v))}`,
      )
      return `${logPrefix} ${emit(dec.name)}(${argPairs.join(', ')})`
    }
    return `${logPrefix} ${addrLabelStyled(addr, this.cache)} ${dim(
      `topic0=${topics?.[0] ?? ''} data=${truncate(data)}`,
    )}`
  }

  public printReturn(node: RpcCallTrace, nextPrefix: string) {
    const returnLabel = `${nextPrefix}${retLabel('[Return]')}`

    if (isPrecompileSource(node.to)) {
      const decodedPreCompile = this.decoder.decodePrecompile(node)
      if (!decodedPreCompile?.outputText) return `${returnLabel}} ${dim('()')}`
      return `${returnLabel} ${stringify(decodedPreCompile.outputText)}`
    }

    const [callError, decodedCall] = this.decoder.decodeCallWithNames(
      node.to,
      node.input,
    )
    if (callError)
      return `${returnLabel} ${node.output ? truncate(node.output) : dim('()')}`

    if (decodedCall.fnItem) {
      const [returnError, decodedReturn] = this.decoder.decodeReturnPretty(
        decodedCall.fnItem,
        node.output,
      )
      if (returnError) return `${returnLabel} ${truncate(node.output)}`
      return `${returnLabel} ${retData(decodedReturn)}`
    }
    return `${returnLabel} ${truncate(node.output)}`
  }

  public printRevert(node: RpcCallTrace, nextPrefix: string) {
    const revertPrefix = `${nextPrefix}${revLabel('[Revert]')}`
    const [_, revertData] = this.decoder.decodeRevertPrettyFromFrame(node)
    return `${revertPrefix} ${revData(revertData)}`
  }

  public printGasCall(
    node: RpcCallTrace,
    hasError: boolean,
    depth: number,
  ): string {
    const paint = hasError ? pc.red : undefined
    const left = addrLabelStyled(node.to, this.cache, paint)
    const rightLabel = this.formatGasCall(node, hasError)
    const label = depth === 1 ? `${left}\n• ${rightLabel}` : `• ${rightLabel}`

    if (
      depth >= 1 &&
      depth <= SUMMARY_DEPTH &&
      node?.calls &&
      node.calls.length > 0
    ) {
      const { total, count } = sumInner(node)
      const styledTotal =
        depth === 1
          ? pc.bold(pc.yellow(total.toString()))
          : pc.yellow(total.toString())

      return `${label} ${pc.dim('—')} totalused=${styledTotal} ${pc.dim(`(over ${count} inner calls)`)}${
        hasError ? ` ${pc.red('❌')}` : ''
      }`
    }
    const usedStr = hexToBig(node.gasUsed).toString()
    const styledUsed = depth === 1 ? pc.bold(usedStr) : usedStr
    return `${label} ${pc.dim('—')} used=${styledUsed}${depth > 1 ? ' +' : ''}${
      hasError ? ` ${pc.red('❌')}` : ''
    }`
  }

  public formatContractCall(node: RpcCallTrace, hasError: boolean): string {
    if (isPrecompileSource(node.to)) {
      const decodedPreCompile = this.decoder.decodePrecompile(node)
      return `${pc.bold(decodedPreCompile.name)} ${stringify(decodedPreCompile.inputText)}`
    }
    const [error, decodedCall] = this.decoder.decodeCallWithNames(
      node.to,
      node.input,
    )
    if (error) return dim('()')

    const fnName = decodedCall.fnName
    const selectorSig = nameFromSelector(node.input, this.cache)

    if (fnName) {
      const styled = hasError ? pc.bold(pc.red(fnName)) : fn(fnName)
      if (this.verbosity < LogVerbosity.Medium) return `${styled}()`

      const args = decodedCall.prettyArgs
        .map((arg, i) =>
          stringify(
            `${dark(decodedCall.fnItem.inputs[i].name)}: ${stringify(arg)}`,
          ),
        )
        .join(', ')

      return `${styled}(${args ?? ''})`
    }

    if (selectorSig)
      return hasError ? pc.bold(pc.red(selectorSig)) : fn(selectorSig)
    if (node.input && node.input !== '0x')
      return dim(`calldata=${truncate(node.input)}`)
    return dim('()')
  }

  public formatGasCall(node: RpcCallTrace, hasError: boolean): string {
    const [err, dec] = this.decoder.decodeCallWithNames(node.to, node.input)
    if (err) return node.input && node.input !== '0x' ? dim('') : dim('()')

    if (dec.fnName) {
      const styled = hasError
        ? pc.bold(pc.red(dec.fnName))
        : retData(dec.fnName)
      return `${styled}()`
    }

    const selectorSig = nameFromSelector(node.input, this.cache)
    if (selectorSig) {
      return hasError ? pc.bold(pc.red(selectorSig)) : fn(selectorSig)
    }

    return node.input && node.input !== '0x' ? dim('') : dim('()')
  }
}
