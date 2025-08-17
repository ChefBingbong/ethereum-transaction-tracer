// formatter patch: better error decoding

import pc from 'picocolors'
import {
  type Abi,
  type Address,
  decodeAbiParameters,
  decodeErrorResult,
  type Hex,
} from 'viem'
import { ensureAbi, type TracerCache } from '../cache/index'
import type { RpcCallTrace } from '../callTracer'
import {
  decodeCallWithNames,
  decodeReturnPretty,
  nameFromSelector,
  safeDecodeEvent,
} from '../decoder/index'
import { theme } from './theme'
import { defaultOpts, type PrettyOpts } from './types'
import {
  badgeFor,
  formatGas,
  formatValueEth,
  prefetchAbis,
  truncate,
} from './utils'

// Pick the deepest node with `error`; prefer one with non-empty `output`.
function _findDeepestErrorFrame(node: RpcCallTrace): {
  frame?: RpcCallTrace
  addr?: Address
  data?: Hex
} {
  let best: { frame?: RpcCallTrace; addr?: Address; data?: Hex } = {}
  const walk = (n: RpcCallTrace) => {
    if (n.error) {
      const data = n.output && n.output !== '0x' ? (n.output as Hex) : undefined
      if (!best.frame || (data && !best.data)) {
        best = { frame: n, addr: n.to as Address | undefined, data }
      }
    }
    n.calls?.forEach(walk)
  }
  walk(node)
  return best
}

// existing addrLabel(...)
function addrLabelStyled(
  addr: Address | undefined,
  _cache: TracerCache,
  colorOverride?: (s: string) => string,
) {
  if (!addr) return (colorOverride ?? theme.addr)('<unknown>')
  const key = addr.toLowerCase()
  //   const name = reg.labels?.[key]
  const name = undefined
  const color = colorOverride ?? theme.addr
  const addrC = color(key)
  return name ? `${theme.contract(name)}<${addrC}>` : addrC
}
// // prefer deepest frame w/ error; prefer one that has non-empty output
// function findDeepestErrorFrame(
//   node: RpcCallTrace,
// ): { frame?: RpcCallTrace; addr?: Address; data?: Hex } {
//   let best: { frame?: RpcCallTrace; addr?: Address; data?: Hex } = {}

//   const walk = (n: RpcCallTrace) => {
//     if (n.error) {
//       const data = n.output && n.output !== '0x' ? (n.output as Hex) : undefined
//       // always take deeper nodes (DFS), but prefer ones with non-empty output
//       if (!best.frame || (data && !best.data)) {
//         best = { frame: n, addr: n.to as Address | undefined, data }
//       }
//     }
//     if (n.calls) for (const c of n.calls) walk(c)
//   }
//   walk(node)
//   return best
// }

const PANIC_MAP: Record<number, string> = {
  1: 'assert(false)',
  17: 'arithmetic overflow/underflow',
  18: 'division by zero',
  33: 'enum conversion out of range',
  34: 'invalid storage byte array access',
  49: 'pop on empty array',
  50: 'array out-of-bounds',
  65: 'memory overflow',
  81: 'zero-initialized internal function call',
}

function tryDecodeErrorString(data?: Hex): string | null {
  if (!data || data === '0x') return null
  // Error(string) selector
  if (data.slice(0, 10).toLowerCase() !== '0x08c379a0') return null
  try {
    const [reason] = decodeAbiParameters(
      [{ type: 'string' }],
      `0x${data.slice(10)}` as Hex,
    )
    return `Error(${JSON.stringify(reason)})`
  } catch {
    return null
  }
}

function tryDecodePanic(data?: Hex): string | null {
  if (!data || data === '0x') return null
  // Panic(uint256) selector
  if (data.slice(0, 10).toLowerCase() !== '0x4e487b71') return null
  try {
    const [codeBn] = decodeAbiParameters(
      [{ type: 'uint256' }],
      `0x${data.slice(10)}` as Hex,
    )
    const code = Number(codeBn)
    const msg = PANIC_MAP[code] ?? 'panic'
    return `Panic(0x${code.toString(16)}: ${msg})`
  } catch {
    return null
  }
}

// pretty-print arbitrary error args
function formatArgsInline(v: unknown): string {
  if (typeof v === 'bigint') return v.toString()
  if (typeof v === 'string') return v
  if (Array.isArray(v)) return `[${v.map(formatArgsInline).join(', ')}]`
  if (v && typeof v === 'object') {
    const entries = Object.entries(v as Record<string, unknown>)
      .filter(([k]) => Number.isNaN(Number(k))) // drop tuple indices
      .map(([k, x]) => `${k}: ${formatArgsInline(x)}`)
    return `{ ${entries.join(', ')} }`
  }
  return String(v)
}

async function decodeRevertPrettyFromFrame(
  cache: TracerCache,
  addr: Address | undefined,
  data: Hex | undefined,
): Promise<string | null> {
  if (!data || data === '0x') return null

  // try per-address ABI, then global extras
  const abis: Abi[] = []
  const specific = await ensureAbi(cache, addr)
  if (specific) abis.push(specific)
  const extra = cache.extraAbis
  if (extra?.length) abis.push(...extra)

  // Try decodeErrorResult across available ABIs
  for (const abi of abis) {
    try {
      const dec = decodeErrorResult({ abi, data })
      // Standard Error(string)
      if (
        dec.errorName === 'Error' &&
        Array.isArray(dec.args) &&
        dec.args.length === 1
      ) {
        return `Error(${JSON.stringify(dec.args[0])})`
      }
      // Standard Panic(uint256)
      if (
        dec.errorName === 'Panic' &&
        Array.isArray(dec.args) &&
        dec.args.length === 1
      ) {
        const code = Number(dec.args[0])
        const msg = PANIC_MAP[code] ?? 'panic'
        return `Panic(0x${code.toString(16)}: ${msg})`
      }
      const argsTxt = Array.isArray(dec.args)
        ? dec.args.map(formatArgsInline).join(', ')
        : formatArgsInline(dec.args)
      return `${dec.errorName}(${argsTxt})`
    } catch {
      // try next abi
    }
  }

  // Manual standard fallbacks if ABI unknown
  return tryDecodeErrorString(data) ?? tryDecodePanic(data) ?? null
}

async function _decodeRevertPretty(
  cache: TracerCache,
  to: Address | undefined,
  output: Hex | undefined,
): Promise<string | null> {
  console.log(output)
  if (!output || output === '0x') return null

  // 1) Try per-address ABI
  const abis: Abi[] = []
  const specific = await ensureAbi(cache, to)
  if (specific) abis.push(specific)

  // 2) Try global/extra ABIs if present
  const extra = cache.extraAbis
  if (extra?.length) abis.push(...extra)

  for (const abi of abis) {
    try {
      const dec = decodeErrorResult({ abi, data: output })
      const argsTxt = Array.isArray(dec.args)
        ? dec.args.map(formatArgsInline).join(', ')
        : formatArgsInline(dec.args)
      // Standard Error(string) comes through with errorName === 'Error'
      if (
        dec.errorName === 'Error' &&
        Array.isArray(dec.args) &&
        dec.args.length === 1
      ) {
        return `Error(${JSON.stringify(dec.args[0])})`
      }
      if (
        dec.errorName === 'Panic' &&
        Array.isArray(dec.args) &&
        dec.args.length === 1
      ) {
        const code = Number(dec.args[0])
        const msg = PANIC_MAP[code] ?? 'panic'
        return `Panic(0x${code.toString(16)}: ${msg})`
      }
      return `${dec.errorName}(${argsTxt})`
    } catch (error) {
      console.log(error)
      // keep trying others
    }
  }

  // 3) Manual standard decodes
  const errStr = tryDecodeErrorString(output)
  if (errStr) return errStr
  const panicStr = tryDecodePanic(output)
  if (panicStr) return panicStr

  // 4) Nothing decoded
  return null
}

// ---------- your existing formatter with improved tail ----------

function _countWork(root: RpcCallTrace, includeLogs: boolean): number {
  let total = 0
  const walk = (n: RpcCallTrace) => {
    total += 1
    if (includeLogs) total += n.logs?.length ?? 0
    total += n.calls?.length ?? 0
    n.calls?.forEach(walk)
  }
  walk(root)
  return Math.max(total, 1)
}

export async function formatTraceColored(
  root: RpcCallTrace,
  cache: TracerCache,
  opts?: PrettyOpts,
): Promise<string> {
  const o = { ...defaultOpts, ...(opts || {}) }
  await prefetchAbis(root, cache)

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
    const abi = await ensureAbi(cache, node.to)
    const { fnName, prettyArgs, fnItem } = decodeCallWithNames(abi, node.input)
    const selectorSig = !fnName
      ? nameFromSelector(node.input, cache)
      : undefined

    // Address labels (make them red if this frame errored)
    const contractTxt = addrLabelStyled(
      node.to,
      cache,
      hasError ? pc.red : undefined,
    )

    const leftSide =
      node.type === 'DELEGATECALL'
        ? [
            addrLabelStyled(
              node.from as Address,
              cache,
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
        const dec = safeDecodeEvent(cache, lg.address, lg.topics, lg.data)
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
              `${theme.emit('emit')} ${addrLabelStyled(lg.address, cache)} ${theme.dim(
                `topic0=${lg.topics?.[0] ?? ''} data=${truncate(lg.data, o.maxData)}`,
              )}`,
          )
        }
      }
    }

    // Children
    const children = node.calls ?? []
    for (let i = 0; i < children.length; i++) {
      await walk(children[i]!, nextPrefix, i === children.length - 1, depth + 1)
    }

    // Tail (use your improved revert decoding from earlier)
    const tailPrefix = depth === 0 ? '' : nextPrefix
    if (node.error) {
      const pretty =
        (await decodeRevertPrettyFromFrame(
          cache,
          node.to as Address,
          node.output as Hex,
        )) ??
        node.revertReason ??
        node.error
      lines.push(
        `${tailPrefix}${theme.revLabel('[Revert]')} ${theme.revData(pretty)}`,
      )
    } else if (o.showReturnData) {
      const decoded = decodeReturnPretty(fnItem, node.output)
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
