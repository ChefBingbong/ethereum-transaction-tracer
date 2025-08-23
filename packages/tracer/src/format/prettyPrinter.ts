import type { EventTopic } from '@evm-transaction-trace/core'
import {
  formatGas,
  formatValueEth,
  hexToBig,
  nameFromSelector,
  SUMMARY_DEPTH,
  stringify,
  sumInner,
  truncate,
} from '@evm-transaction-trace/core'
import pc from 'picocolors'
import { type Address, type Hex, isAddressEqual, zeroAddress } from 'viem'
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

    const valueStr = dim(`value=${formatValueEth(node.value)} `)
    const gasStr = dim(`gas=${formatGas(node.gas, true)} used=${formatGas(node.gasUsed, true)}`)

    const paint = hasError ? pc.red : undefined
    const left = this.addrLabelStyled(node.to, paint)
    const method = this.formatContractCall(node, hasError)
    return `${left}::${method} ${valueStr}${gasStr}${typeBadge}${failBadge}`
  }

  public printDelegateCall = (node: RpcCallTrace, hasError: boolean) => {
    const typeBadge = ` ${this.badgeFor(node.type)}`
    const failBadge = hasError ? ` ${pc.red('❌')}` : ''
    const valueStr = dim(`value=${formatValueEth(node.value)} `)
    const gasStr = dim(`gas=${formatGas(node.gas, true)} used=${formatGas(node.gasUsed, true)}`)

    const paint = hasError ? pc.red : undefined

    const left = `${this.addrLabelStyled(node.from as Address, paint)} → ${this.addrLabelStyled(node.to, paint)}`

    const method = this.formatContractCall(node, hasError)
    return `${left}::${method} ${valueStr}${gasStr}${typeBadge}${failBadge}`
  }

  public printCreateCall = (node: RpcCallTrace, hasError: boolean) => {
    const typeBadge = ` ${this.badgeFor(node.type)}`
    const failBadge = hasError ? ` ${pc.red('❌')}` : ''
    const valueStr = dim(`value=${formatValueEth(node.value)} `)
    const gasStr = dim(`gas=${formatGas(node.gas, true)} used=${formatGas(node.gasUsed, true)}`)

    const paint = hasError ? pc.red : undefined

    const created = node.to
      ? this.addrLabelStyled(node.to, paint)
      : this.addrLabelStyled(undefined, paint)

    const initLen = node.input ? (node.input.length - 2) / 2 : 0
    const method = hasError ? pc.bold(pc.red('create')) : fn('create')
    return `${created}::${method}(init_code_len=${initLen}) ${valueStr}${gasStr}${typeBadge}${failBadge}`
  }

  public printSeltDestructCall = (node: RpcCallTrace, hasError: boolean) => {
    const typeBadge = ` ${this.badgeFor(node.type)}`
    const failBadge = hasError ? ` ${pc.red('❌')}` : ''
    const valueStr = dim(`value=${formatValueEth(node.value)} `)
    const gasStr = dim(`gas=${formatGas(node.gas, true)} used=${formatGas(node.gasUsed, true)}`)

    const paint = hasError ? pc.red : undefined

    const target = this.addrLabelStyled(node.to, paint)
    const method = hasError ? pc.bold(pc.red('selfdestruct')) : fn('selfdestruct')
    return `${target}::${method} ${valueStr}${gasStr}${typeBadge}${failBadge}`
  }

  public printDefault = (node: RpcCallTrace, hasError: boolean) => {
    const typeBadge = ` ${this.badgeFor(node.type)}`
    const failBadge = hasError ? ` ${pc.red('❌')}` : ''
    const valueStr = dim(`value=${formatValueEth(node.value)} `)
    const gasStr = dim(`gas=${formatGas(node.gas, true)} used=${formatGas(node.gasUsed, true)}`)

    const paint = hasError ? pc.red : undefined
    const left = this.addrLabelStyled(node.to, paint)
    const calld =
      node.input && node.input !== '0x' ? dim(`calldata=${truncate(node.input)}`) : dim('()')
    return `${left}::${calld} ${valueStr}${gasStr}${typeBadge}${failBadge}`
  }

  public formatContractCall(node: RpcCallTrace, hasError: boolean): string {
    const pre = this.decoder.formatPrecompilePretty(node.to, node.input, node.output)
    if (pre) {
      const { name, inputText } = pre
      const selectorSig = !name ? nameFromSelector(node.input, this.cache) : undefined

      if (name) return `${hasError ? pc.bold(pc.red(name)) : fn(name)}(${inputText ?? ''})`
      if (selectorSig) return hasError ? pc.bold(pc.red(selectorSig)) : fn(selectorSig)

      if (node.input && node.input !== '0x') {
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

    if (node.input && node.input !== '0x') {
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

  public formatReturn(node: RpcCallTrace, nextPrefix: string) {
    const returnLabel = `${nextPrefix}${retLabel('[Return]')}`
    if (!node.output || node.output === '0x') return `${returnLabel}} ${dim('()')}`

    const pre = this.decoder.formatPrecompilePretty(node.to, node.input, node.output)
    if (pre) return `${returnLabel} ${stringify(pre.outputText)}`

    const [callError, decodedCall] = this.decoder.decodeCallWithNames(node.to, node.input)
    if (callError) return `${returnLabel} ${truncate(node.output)}`

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

  public formatRevert(node: RpcCallTrace, nextPrefix: string) {
    const revertPrefix = `${nextPrefix}${revLabel('[Revert]')}`
    const prettyRevert = this.decoder.decodeRevertPrettyFromFrame(node.output)

    if (!prettyRevert)
      return `${revertPrefix} ${revData(node.revertReason ?? node.error)} ${node.output.slice(0, 10)}`
    return `${revertPrefix} ${revData(prettyRevert)}`
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

  public formatGasCall(node: RpcCallTrace, hasError: boolean): string {
    const pre = this.decoder.formatPrecompilePretty(node.to, node.input, node.output)
    if (pre) {
      if (pre.name) {
        const styled = hasError ? pc.bold(pc.red(pre.name)) : fn(pre.name)
        return `${styled}()`
      }
      const selectorSig = nameFromSelector(node.input, this.cache)
      if (selectorSig) {
        return hasError ? pc.bold(pc.red(selectorSig)) : fn(selectorSig)
      }
      return node.input && node.input !== '0x' ? dim('') : dim('()')
    }

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

  public formatGasCreateCall(initLen: number, hasError: boolean): string {
    const createFn = hasError ? pc.bold(pc.red('create')) : fn('create')
    return `${createFn}(init_code_len=${initLen})`
  }

  public formatGasSelfdestructCall(hasError: boolean): string {
    return hasError ? pc.bold(pc.red('selfdestruct')) : fn('selfdestruct')
  }

  badgeFor = (t: RpcCallType) => typeBadge(`[${t.toLowerCase()}]`)
}
