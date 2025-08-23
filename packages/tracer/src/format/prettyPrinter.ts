import type { EventTopic } from '@evm-transaction-trace/utils'
import {
  hexToBig,
  hexToBigint,
  isPrecompileSource,
  nameFromSelector,
  SUMMARY_DEPTH,
  stringify,
  sumInner,
  truncate,
} from '@evm-transaction-trace/utils'
import pc from 'picocolors'
import {
  type Address,
  formatEther,
  formatGwei,
  type Hex,
  hexToBigInt,
  isAddressEqual,
  zeroAddress,
} from 'viem'
import type { TracerCache } from '../cache'
import type { Decoder } from '../decoder'
import { LogVerbosity, type RpcCallTrace, type RpcCallType } from '../types'
import {
  addr,
  argVal,
  dark,
  dim,
  emit,
  eventArgVal,
  fn,
  retData,
  retLabel,
  revData,
  revLabel,
  typeBadge,
  yellowLight,
} from './theme'

export class TraceFormatter {
  constructor(
    private readonly decoder: Decoder,
    private readonly cache: TracerCache,
    private verbosity: LogVerbosity,
  ) {}

  public printCall = (node: RpcCallTrace, hasError: boolean) => {
    const typeBadge = ` ${this.badgeFor(node.type)}`
    const failBadge = hasError ? ` ${pc.red('❌')}` : ''
    const valueStr = this.getValueString(node)
    const gasStr = this.getGasString(node)

    const paint = hasError ? pc.red : undefined
    const left = this.addrLabelStyled(node.to, paint)
    const method = this.formatContractCall(node, hasError)
    return `${left}::${method} ${typeBadge} ${valueStr}${gasStr}${failBadge}`
  }

  public printDelegateCall = (node: RpcCallTrace, hasError: boolean) => {
    const typeBadge = ` ${this.badgeFor(node.type)}`
    const failBadge = hasError ? ` ${pc.red('❌')}` : ''
    const valueStr = this.getValueString(node)
    const gasStr = this.getGasString(node)

    const paint = hasError ? pc.red : undefined

    const left = `${this.addrLabelStyled(node.from as Address, paint)} → ${this.addrLabelStyled(node.to, paint)}`

    const method = this.formatContractCall(node, hasError)
    return `${left}::${method} ${typeBadge} ${valueStr}${gasStr}${failBadge}`
  }

  public printCreateCall = (node: RpcCallTrace, hasError: boolean) => {
    const typeBadge = ` ${this.badgeFor(node.type)}`
    const failBadge = hasError ? ` ${pc.red('❌')}` : ''
    const valueStr = this.getValueString(node)
    const gasStr = this.getGasString(node)

    const paint = hasError ? pc.red : undefined

    const created = node.to
      ? this.addrLabelStyled(node.to, paint)
      : this.addrLabelStyled(undefined, paint)

    const initLen = node.input ? (node.input.length - 2) / 2 : 0
    const method = hasError ? pc.bold(pc.red('create')) : fn('create')
    return `${created}::${method}(init_code_len=${initLen}) ${typeBadge} ${valueStr}${gasStr}${failBadge}`
  }

  public printSeltDestructCall = (node: RpcCallTrace, hasError: boolean) => {
    const typeBadge = ` ${this.badgeFor(node.type)}`
    const failBadge = hasError ? ` ${pc.red('❌')}` : ''
    const valueStr = this.getValueString(node)
    const gasStr = this.getGasString(node)

    const paint = hasError ? pc.red : undefined

    const target = this.addrLabelStyled(node.to, paint)
    const method = hasError ? pc.bold(pc.red('selfdestruct')) : fn('selfdestruct')
    return `${target}::${method} ${typeBadge} ${valueStr}${gasStr}${failBadge}`
  }

  public printDefault = (node: RpcCallTrace, hasError: boolean) => {
    const typeBadge = ` ${this.badgeFor(node.type)}`
    const failBadge = hasError ? ` ${pc.red('❌')}` : ''
    const valueStr = this.getValueString(node)
    const gasStr = this.getGasString(node)

    const paint = hasError ? pc.red : undefined
    const left = this.addrLabelStyled(node.to, paint)
    const calld =
      node.input && node.input !== '0x' ? dim(`calldata=${truncate(node.input)}`) : dim('()')
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
    return `${logPrefix} ${this.addrLabelStyled(addr)} ${dim(
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

    const [callError, decodedCall] = this.decoder.decodeCallWithNames(node.to, node.input)
    if (callError) return `${returnLabel} ${node.output ? truncate(node.output) : dim('()')}`

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
    rightLabel: string,
    left: string,
    depth: number,
  ): string {
    const label = depth === 1 ? `${left}\n• ${rightLabel}` : `• ${rightLabel}`
    if (depth >= 1 && depth <= SUMMARY_DEPTH && node?.calls && node.calls.length > 0) {
      const { total, count } = sumInner(node)
      const styledTotal =
        depth === 1 ? pc.bold(pc.yellow(total.toString())) : pc.yellow(total.toString())
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
    const [error, decodedCall] = this.decoder.decodeCallWithNames(node.to, node.input)
    if (error) return dim('()')

    const fnName = decodedCall.fnName
    const selectorSig = nameFromSelector(node.input, this.cache)

    if (fnName) {
      const styled = hasError ? pc.bold(pc.red(fnName)) : fn(fnName)
      if (this.verbosity < LogVerbosity.Medium) return `${styled}()`
      else return `${styled}(${decodedCall.prettyArgs ?? ''})`
    }

    if (selectorSig) return hasError ? pc.bold(pc.red(selectorSig)) : fn(selectorSig)

    if (node.input && node.input !== '0x') {
      return dim(`calldata=${truncate(node.input)}`)
    }
    return dim('()')
  }

  public formatGasCall(node: RpcCallTrace, hasError: boolean): string {
    const [err, dec] = this.decoder.decodeCallWithNames(node.to, node.input)
    if (err) return node.input && node.input !== '0x' ? dim('') : dim('()')

    if (dec.fnName) {
      const styled = hasError ? pc.bold(pc.red(dec.fnName)) : retData(dec.fnName)
      return `${styled}()` // terse
    }

    const selectorSig = nameFromSelector(node.input, this.cache)
    if (selectorSig) {
      return hasError ? pc.bold(pc.red(selectorSig)) : fn(selectorSig)
    }

    return node.input && node.input !== '0x' ? dim('') : dim('()')
  }

  public formatGasCreateCall(initLen: number, hasError: boolean): string {
    const createFn = hasError ? pc.bold(pc.red('create')) : fn('create')
    return `${createFn}(init_code_len=${initLen})`
  }

  public formatGasSelfdestructCall(hasError: boolean): string {
    return hasError ? pc.bold(pc.red('selfdestruct')) : fn('selfdestruct')
  }

  badgeFor = (t: RpcCallType) => typeBadge(`[${t.toLowerCase()}]`)

  getValueString = (node: RpcCallTrace) => {
    if (this.verbosity < LogVerbosity.Highest) return ''
    return dark(`${yellowLight('value=')}${formatEther(hexToBigInt(node.value ?? '0x00'))} ETH`)
  }

  getGasString = (node: RpcCallTrace) => {
    if (this.verbosity < LogVerbosity.Highest) return ''
    return dark(
      `(${yellowLight('gas=')}${formatGwei(hexToBigint(node.gas))} ${yellowLight('used=')}${formatGwei(hexToBigint(node.gasUsed))}) Gwei`,
    )
  }
  public addrLabelStyled(address: Address | undefined, color?: (s: string) => string) {
    const paint = color ?? addr
    if (!address) return paint('<unknown>')

    const name = this.cache.contractNames.get(address)
    const defaultLabel = name ? `${name}${dark('()')}` : address.toLowerCase()
    return paint(
      isAddressEqual(address, zeroAddress) ? 'Precompile.DataCopy' : pc.bold(defaultLabel),
    )
  }
}
