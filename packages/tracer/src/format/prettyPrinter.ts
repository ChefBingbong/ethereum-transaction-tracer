import pc from 'picocolors'
import { type Address, type Hex, isAddressEqual, zeroAddress } from 'viem'
import type { TracerCache } from '../cache'
import { LogVerbosity, type RpcCallTrace, type RpcCallType } from '../callTracer'
import type { Decoder } from '../decoder'
import type { EventTopic } from '../decoder/types'
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

  public printCall = (node: RpcCallTrace, hasError: boolean, isGasCall = false) => {
    const typeBadge = isGasCall ? '' : ` ${this.badgeFor(node.type)}`
    const failBadge = isGasCall ? '' : hasError ? ` ${pc.red('❌')}` : ''

    const valueStr = isGasCall ? '' : dim(`value=${formatValueEth(node.value)} `)
    const gasStr = dim(`gas=${formatGas(node.gas, true)} used=${formatGas(node.gasUsed, true)}`)

    const paint = hasError ? pc.red : undefined
    const left = this.addrLabelStyled(node.to, paint)
    const method = this.formatContractCall(node, hasError)
    return `${left} :: ${method} ${valueStr}${gasStr}${typeBadge}${failBadge}`
  }

  public printDelegateCall = (node: RpcCallTrace, hasError: boolean, isGasCall = false) => {
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
    return `${left} :: ${method} ${valueStr}${gasStr}${typeBadge}${failBadge}`
  }

  public printCreateCall = (node: RpcCallTrace, hasError: boolean, isGasCall = false) => {
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
    return `${created} :: ${method}(init_code_len=${initLen}) ${valueStr}${gasStr}${typeBadge}${failBadge}`
  }

  public printSeltDestructCall = (node: RpcCallTrace, hasError: boolean, isGasCall = false) => {
    const typeBadge = isGasCall ? '' : ` ${this.badgeFor(node.type)}`
    const failBadge = isGasCall ? '' : hasError ? ` ${pc.red('❌')}` : ''
    const valueStr = isGasCall ? '' : dim(`value=${formatValueEth(node.value)} `)
    const gasStr = dim(`gas=${formatGas(node.gas, true)} used=${formatGas(node.gasUsed, true)}`)

    const paint = hasError ? pc.red : undefined

    const target = this.addrLabelStyled(node.to, paint)
    const method = hasError ? pc.bold(pc.red('selfdestruct')) : fn('selfdestruct')
    return `${target} :: ${method} ${valueStr}${gasStr}${typeBadge}${failBadge}`
  }

  public printDefault = (node: RpcCallTrace, hasError: boolean, isGasCall = false) => {
    const typeBadge = isGasCall ? '' : ` ${this.badgeFor(node.type)}`
    const failBadge = isGasCall ? '' : hasError ? ` ${pc.red('❌')}` : ''
    const valueStr = isGasCall ? '' : dim(`value=${formatValueEth(node.value)} `)
    const gasStr = dim(`gas=${formatGas(node.gas, true)} used=${formatGas(node.gasUsed, true)}`)

    const paint = hasError ? pc.red : undefined
    const left = this.addrLabelStyled(node.to, paint)
    const calld =
      !isGasCall && node.input && node.input !== '0x'
        ? dim(`calldata=${truncate(node.input)}`)
        : dim('()')
    return `${left} :: ${calld} ${valueStr}${gasStr}${typeBadge}${failBadge}`
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

    const [error, decodedCall] = this.decoder.decodeCallWithNames(node.to, node.input)
    if (error) return dim('()')

    const fnName = decodedCall.fnName
    const selectorSig = nameFromSelector(node.input, this.cache)

    if (fnName) {
      const styled = hasError ? pc.bold(pc.red(fnName)) : fn(fnName)
      if (this.verbosity <= LogVerbosity.Medium) return `${styled}()`
      else return `${styled}(${decodedCall.prettyArgs ?? ''})`
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

  public formatReturn(node: RpcCallTrace, nextPrefix: string, isGasCall = false) {
    if (isGasCall) return ''

    const returnLabel = `${nextPrefix}${retLabel('[Return]')}`
    const pre = this.decoder.formatPrecompilePretty(node.to, node.input, node.output)

    if (pre) return `${returnLabel}} ${stringify(pre.outputText)}`
    const [callError, decodedCall] = this.decoder.decodeCallWithNames(node.to, node.input)

    if (!callError && decodedCall.fnItem) {
      const [returnError, decodedReturn] = this.decoder.decodeReturnPretty(
        decodedCall.fnItem,
        node.output,
      )
      if (!returnError) return `${returnLabel}} ${retData(decodedReturn)}`
    }
    return `${returnLabel}} ${node.output && node.output !== '0x' ? truncate(node.output) : dim('()')}`
  }

  public formatRevert(node: RpcCallTrace, nextPrefix: string) {
    const revertPrefix = `${nextPrefix}${revLabel('[Revert]')}`
    const [error, prettyRevert] = this.decoder.decodeRevertPrettyFromFrame(node.output as Hex)

    if (error) return `${revertPrefix} ${revData(node.revertReason ?? node.error)}`
    return `${revertPrefix} ${revData(prettyRevert)}`
  }

  public addrLabelStyled(_addr: Address | undefined, color?: (s: string) => string) {
    const paint = color ?? addr
    if (!_addr) return paint('<unknown>')
    return paint(isAddressEqual(_addr, zeroAddress) ? 'Precompile.DataCopy' : _addr.toLowerCase())
  }

  badgeFor = (t: RpcCallType) => typeBadge(`[${t.toLowerCase()}]`)
}
