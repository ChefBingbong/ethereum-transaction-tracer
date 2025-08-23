import type { EventTopic, PrecompilePretty } from '@evm-transaction-trace/core'
import {
  hexLenBytes,
  hexToBig,
  hexToBigint,
  hs,
  kvList,
  nameFromSelector,
  parseModExpInput,
  parsePairingInput,
  SUMMARY_DEPTH,
  stringify,
  sumInner,
  trunc,
  truncate,
  tryDecodePretty,
} from '@evm-transaction-trace/core'
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
    if (!node.output || node.output === '0x') return `${returnLabel}} ${dim('()')}`

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

  public printPrecompileReturn(precompile: PrecompilePretty, nextPrefix: string) {
    const returnLabel = `${nextPrefix}${retLabel('[Return]')}`
    if (!precompile?.outputText) return `${returnLabel}} ${dim('()')}`
    return `${returnLabel} ${stringify(precompile.outputText)}`
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

  public printPrecompileCall(
    node: RpcCallTrace,
    precompile: PrecompilePretty,
    hasError: boolean,
  ): string {
    const typeBadge = ` ${this.badgeFor(node.type)}`
    const failBadge = hasError ? ` ${pc.red('❌')}` : ''
    const valueStr = this.getValueString(node)
    const gasStr = this.getGasString(node)

    let method = ''
    const { name, inputText } = precompile
    const selectorSig = !name ? nameFromSelector(node.input, this.cache) : undefined

    if (node.input && node.input !== '0x') {
      method = dim(`calldata=${truncate(node.input)}`)
    }

    if (selectorSig) method = hasError ? pc.bold(pc.red(selectorSig)) : fn(selectorSig)
    if (name) method = `${hasError ? pc.bold(pc.red(name)) : fn(name)}(${inputText ?? ''})`

    return `${method} ${typeBadge} ${valueStr}${gasStr}${failBadge}`
  }

  public formatContractCall(node: RpcCallTrace, hasError: boolean): string {
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

  public formatPrecompileEcRecover = (node: RpcCallTrace) => {
    const inputText =
      tryDecodePretty(['bytes32 hash', 'uint256 v', 'uint256 r', 'uint256 s'], node.input) ??
      `bytes: ${trunc(node.input)}`
    const outputText =
      tryDecodePretty(['address signer']) ??
      (node.output ? `signer: ${trunc(node.output)}` : undefined)
    return {
      name: 'ecrecover',
      inputText: `recover signer for ${inputText}`,
      outputText,
    }
  }

  public formatPrecompileSha256 = (node: RpcCallTrace): PrecompilePretty => {
    const len = hexLenBytes(node.input)
    return {
      name: 'sha256',
      inputText: `hash ${len} bytes (${trunc(node.input)})`,
      outputText: node.output ? `hash: ${trunc(node.output)}` : undefined,
    }
  }

  public formatPrecompileRipemd160 = (node: RpcCallTrace): PrecompilePretty => {
    const len = hexLenBytes(node.input)
    const out =
      tryDecodePretty(['bytes20 hash'], node.output) ??
      (node.output ? `hash: ${trunc(node.output)}` : undefined)
    return {
      name: 'ripemd160',
      inputText: `hash ${len} bytes (${trunc(node.input)})`,
      outputText: out,
    }
  }

  public formatPrecompileIdentity = (node: RpcCallTrace): PrecompilePretty => {
    const inLen = hexLenBytes(node.input)
    const outLen = hexLenBytes(node.output ?? '0x')
    const same = !!node.output && node.input.toLowerCase() === (node.output as string).toLowerCase()
    return {
      name: 'dataCopy',
      inputText: `(${inLen} bytes: ${trunc(node.input)})`,
      outputText: node.output
        ? `output ${outLen} bytes: ${trunc(node.output)}${same ? ' (identical)' : ''}`
        : '0x',
    }
  }

  public formatPrecompileModExp = (node: RpcCallTrace): PrecompilePretty => {
    const { baseLen, expLen, modLen, base, exp, mod } = parseModExpInput(node.input)
    const inputText =
      `compute (base^exp) mod mod where ` +
      kvList({
        baseLen: String(baseLen),
        expLen: String(expLen),
        modLen: String(modLen),
        base: trunc(base),
        exp: trunc(exp),
        mod: trunc(mod),
      })
    let result: string | undefined
    if (node.output && modLen > 0n) {
      const sliced = hs(node.output, 0, Number(modLen))
      result = `result: ${trunc(sliced)} (${modLen.toString()} bytes)`
    } else if (node.output) {
      result = `result: ${trunc(node.output)}`
    }
    return { name: 'modexp', inputText, outputText: result }
  }

  public formatPrecompileBn128Add = (node: RpcCallTrace): PrecompilePretty => {
    const inputText =
      tryDecodePretty(['uint256 x1', 'uint256 y1', 'uint256 x2', 'uint256 y2'], node.input) ??
      `args: ${trunc(node.input)}`
    const outputText =
      tryDecodePretty(['uint256 x', 'uint256 y'], node.output) ??
      (node.output ? `point: ${trunc(node.output)}` : undefined)
    return { name: 'alt_bn128_add', inputText, outputText }
  }

  public formatPrecompileBn128Mul = (node: RpcCallTrace): PrecompilePretty => {
    const inputText =
      tryDecodePretty(['uint256 x1', 'uint256 y1', 'uint256 s'], node.input) ??
      `args: ${trunc(node.input)}`
    const outputText =
      tryDecodePretty(['uint256 x', 'uint256 y'], node.output) ??
      (node.output ? `point: ${trunc(node.output)}` : undefined)
    return { name: 'alt_bn128_mul', inputText, outputText }
  }

  public formatPrecompileBn128Pairing = (node: RpcCallTrace): PrecompilePretty => {
    const { pairs, leftover } = parsePairingInput(node.input)
    const head = `check pairing for ${pairs.length} pair(s)`
    const details =
      pairs
        .slice(0, 2)
        .map(
          (p, i) =>
            `pair${i + 1}(${kvList({
              x1: trunc(p.x1),
              y1: trunc(p.y1),
              x2_c0: trunc(p.x2_c0),
              x2_c1: trunc(p.x2_c1),
              y2_c0: trunc(p.y2_c0),
              y2_c1: trunc(p.y2_c1),
            })})`,
        )
        .join('; ') + (pairs.length > 2 ? `; …(${pairs.length - 2} more)` : '')

    const tail = leftover > 0 ? `; leftover ${leftover} byte(s)` : ''
    const inputText = `${head}${pairs.length ? ` — ${details}` : ''}${tail}`
    const outputText =
      tryDecodePretty(['bool success'], node.output) ??
      (node.output ? `success: ${trunc(node.output)}` : undefined)

    return { name: 'alt_bn128_pairing', inputText, outputText }
  }

  public formatPrecompileBlake2f = (node: RpcCallTrace): PrecompilePretty => {
    const data = node.input.startsWith('0x') ? node.input.slice(2) : node.input
    const rounds = Number(`0x${data.slice(0, 8)}`)
    const h = `0x${data.slice(8, 8 + 128)}`
    const m = `0x${data.slice(136, 136 + 256)}`
    const t = `0x${data.slice(392, 392 + 32)}`
    const f = `0x${data.slice(424, 424 + 2)}`
    return {
      name: 'blake2f',
      inputText: kvList({
        rounds: String(rounds),
        h: trunc(h),
        m: trunc(m),
        t: trunc(t),
        f: trunc(f),
      }),
      outputText: node.output ? `h': ${trunc(node.output)}` : undefined,
    }
  }

  public formatPrecompileKzgPointEvaluation = (node: RpcCallTrace): PrecompilePretty => {
    const len = hexLenBytes(node.input)
    const outputText =
      tryDecodePretty(['bool success'], node.output) ??
      (node.output ? `success: ${trunc(node.output)}` : undefined)
    return {
      name: 'kzg_point_evaluation',
      inputText: `verify point evaluation – ${len} bytes (${trunc(node.input)})`,
      outputText,
    }
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
    if (this.verbosity < LogVerbosity.High) return ''
    return dark(`${yellowLight('value=')}${formatEther(hexToBigInt(node.value ?? '0x00'))} ETH`)
  }

  getGasString = (node: RpcCallTrace) => {
    if (this.verbosity < LogVerbosity.High) return ''
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
