import pc from 'picocolors'
import { type Address, type Hex, isAddressEqual, zeroAddress } from 'viem'
import type { TracerCache } from '../cache'
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
import { formatGas, formatValueEth, truncate } from './utils'

export class PrittyPrinter {
  constructor(
    private readonly decoder: Decoder,
    private readonly cache: TracerCache,
    private verbosity: LogVerbosity,
  ) {}

  public printCall = (
    node: RpcCallTrace,
    hasError: boolean,
    nextPrefix: string,
    isGasCall = false,
  ) => {
    const typeBadge = isGasCall ? '' : ` ${this.badgeFor(node.type)}`
    const failBadge = isGasCall ? '' : hasError ? ` ${pc.red('❌')}` : ''

    const valueStr = isGasCall ? '' : dim(`value=${formatValueEth(node.value)} `)
    const gasStr = dim(`gas=${formatGas(node.gas, true)} used=${formatGas(node.gasUsed, true)}`)

    const paint = hasError ? pc.red : undefined
    const left = this.addrLabelStyled(node.to, paint)
    const method = this.formatContractCall(node, hasError)
    const returnLabel = this.formatReturn(node, nextPrefix, hasError, isGasCall)
    return `${left} :: ${method} ${valueStr}${gasStr}${typeBadge}${failBadge} \n${returnLabel}`
  }

  public printDelegateCall = (
    node: RpcCallTrace,
    hasError: boolean,
    nextPrefix: string,
    isGasCall = false,
  ) => {
    const typeBadge = isGasCall ? '' : ` ${this.badgeFor(node.type)}`
    const failBadge = isGasCall ? '' : hasError ? ` ${pc.red('❌')}` : ''
    const valueStr = isGasCall ? '' : dim(`value=${formatValueEth(node.value)} `)
    const gasStr = dim(`gas=${formatGas(node.gas, true)} used=${formatGas(node.gasUsed, true)}`)

    const paint = hasError ? pc.red : undefined

    const left =
      this.addrLabelStyled(node.from as Address, paint) +
      ' → ' +
      this.addrLabelStyled(node.to, paint)

    const method = this.formatContractCall(node, hasError)
    const returnLabel = this.formatReturn(node, nextPrefix, hasError, isGasCall)
    return `${left} :: ${method} ${valueStr}${gasStr}${typeBadge}${failBadge} \n${returnLabel}`
  }

  public printCreateCall = (
    node: RpcCallTrace,
    hasError: boolean,
    nextPrefix: string,
    isGasCall = false,
  ) => {
    const typeBadge = isGasCall ? '' : ` ${this.badgeFor(node.type)}`
    const failBadge = isGasCall ? '' : hasError ? ` ${pc.red('❌')}` : ''
    const valueStr = isGasCall ? '' : dim(`value=${formatValueEth(node.value)} `)
    const gasStr = dim(`gas=${formatGas(node.gas, true)} used=${formatGas(node.gasUsed, true)}`)

    const paint = hasError ? pc.red : undefined

    const created = node.to
      ? this.addrLabelStyled(node.to, paint)
      : this.addrLabelStyled(undefined, paint)

    const initLen = node.input ? (node.input.length - 2) / 2 : 0
    const method = hasError ? pc.bold(pc.red('create')) : fn('create')
    const returnLabel = this.formatReturn(node, nextPrefix, hasError, isGasCall)
    return `${created} :: ${method}(init_code_len=${initLen}) ${valueStr}${gasStr}${typeBadge}${failBadge} \n${returnLabel}`
  }

  public printSeltDestructCall = (
    node: RpcCallTrace,
    hasError: boolean,
    nextPrefix: string,
    isGasCall = false,
  ) => {
    const typeBadge = isGasCall ? '' : ` ${this.badgeFor(node.type)}`
    const failBadge = isGasCall ? '' : hasError ? ` ${pc.red('❌')}` : ''
    const valueStr = isGasCall ? '' : dim(`value=${formatValueEth(node.value)} `)
    const gasStr = dim(`gas=${formatGas(node.gas, true)} used=${formatGas(node.gasUsed, true)}`)

    const paint = hasError ? pc.red : undefined

    const target = this.addrLabelStyled(node.to, paint)
    const method = hasError ? pc.bold(pc.red('selfdestruct')) : fn('selfdestruct')
    const returnLabel = this.formatReturn(node, nextPrefix, hasError, isGasCall)
    return `${target} :: ${method} ${valueStr}${gasStr}${typeBadge}${failBadge} \n${returnLabel}`
  }

  public printDefault = (
    node: RpcCallTrace,
    hasError: boolean,
    nextPrefix: string,
    isGasCall = false,
  ) => {
    const typeBadge = isGasCall ? '' : ` ${this.badgeFor(node.type)}`
    const failBadge = isGasCall ? '' : hasError ? ` ${pc.red('❌')}` : ''
    const valueStr = isGasCall ? '' : dim(`value=${formatValueEth(node.value)} `)
    const gasStr = dim(`gas=${formatGas(node.gas, true)} used=${formatGas(node.gasUsed, true)}`)

    const paint = hasError ? pc.red : undefined

    const returnLabel = this.formatReturn(node, nextPrefix, hasError, isGasCall)

    const left = this.addrLabelStyled(node.to, paint)
    const calld =
      !isGasCall && node.input && node.input !== '0x'
        ? dim(`calldata=${truncate(node.input)}`)
        : dim('()')
    return `${left} :: ${calld} ${valueStr}${gasStr}${typeBadge}${failBadge} \n${returnLabel}`
  }

  public formatContractCall(node: RpcCallTrace, hasError: boolean, isGasCall = false): string {
    const pre = this.decoder.formatPrecompilePretty(node.to, node.input, node.output)
    if (pre) {
      const { name, inputText } = pre
      const selectorSig = !name ? nameFromSelector(node.input, this.cache) : undefined

      if (name) return `${hasError ? pc.bold(pc.red(name)) : fn(name)}(${inputText ?? ''})`
      if (selectorSig) return hasError ? pc.bold(pc.red(selectorSig)) : fn(selectorSig)

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

    if (selectorSig) return hasError ? pc.bold(pc.red(selectorSig)) : fn(selectorSig)

    if (!isGasCall && node.input && node.input !== '0x') {
      return dim(`calldata=${truncate(node.input)}`)
    }
    return dim('()')
  }

  public formatLog(
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
      return `${nextPrefix + (lastLog ? '└─ ' : '├─ ')}${emit('emit')} ${emit(dec.name)}(${argPairs})`
    }
    return `${nextPrefix + (lastLog ? '└─ ' : '├─ ')}${emit('emit')} ${this.addrLabelStyled(addr)} ${dim(
      `topic0=${topics?.[0] ?? ''} data=${truncate(data)}`,
    )}`
  }

  public formatReturn(
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
    }
    const ret = node.output && node.output !== '0x' ? truncate(node.output) : dim('()')
    return `${tailPrefix}${retLabel('[Return]')} ${ret}`
  }

  public addrLabelStyled(_addr: Address | undefined, color?: (s: string) => string) {
    const paint = color ?? addr
    if (!_addr) return paint('<unknown>')
    return paint(isAddressEqual(_addr, zeroAddress) ? 'Precompile.DataCopy' : _addr.toLowerCase())
  }

  badgeFor = (t: RpcCallType) => typeBadge(`[${t.toLowerCase()}]`)
}
