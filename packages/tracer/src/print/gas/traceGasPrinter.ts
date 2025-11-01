import { safeError, safeResult, safeTry } from '@evm-tt/utils'
import pc from 'picocolors'
import { hexToBigInt } from 'viem'
import { abiItemFromSelector2 } from '../../cache/index'
import { dim, formatGasCall } from '../../format'
import type { GasTally, PrinterArgs, RpcCallTrace } from '../../types'
import { prefixesFor } from '../utils'

export async function printGasTrace(root: RpcCallTrace, opts: PrinterArgs) {
  const lines: string[] = []
  const lastStack: boolean[] = []
  const { cache, save } = opts.cache
  const summary: GasTally = {
    topLevelTotal: 0n,
    topLevelFrames: 0,
    ok: 0,
    fail: 0,
  }
  const writeLine = (line = '') => lines.push(line)

  const formatGasTrace = async (rootNode: RpcCallTrace) => {
    const [error] = await safeTry(() => {
      return walkGas(rootNode, true, 0)
    })
    save()
    if (error) return safeError(error)
    return safeResult(lines.join('\n'))
  }

  const walkGas = async (node: RpcCallTrace, last: boolean, depth: number) => {
    const { branch } = prefixesFor(last, lastStack)
    const usedHere = hexToBigInt(node.gasUsed)

    if (depth === 1) {
      summary.topLevelTotal += usedHere
      summary.topLevelFrames += 1
      node?.error ? summary.fail++ : summary.ok++
    }

    writeLine(branch + formatTraceGasCall(node, depth))

    lastStack.push(last)
    const children = node.calls ?? []
    for (let i = 0; i < children.length; i++) {
      await walkGas(children[i], i === children.length - 1, depth + 1)
    }
    lastStack.pop()

    formatGasTraceSummary(!!node?.error, depth)
  }

  const formatTraceGasCall = (node: RpcCallTrace, depth: number) => {
    const sel = abiItemFromSelector2(cache, node.input)
    if (!sel) return dim('()')
    return formatGasCall(node, cache, sel, depth)
  }

  const formatGasTraceSummary = (hasError: boolean, depth: number) => {
    if (depth !== 0) return
    const { topLevelFrames, topLevelTotal, ok, fail } = summary
    writeLine(pc.bold('\n— Gas summary —'))
    writeLine(`frames: ${topLevelFrames}   ok: ${ok}   fail: ${fail}`)
    writeLine(`total used : ${pc.bold(Number(topLevelTotal))}`)
    if (hasError) writeLine(pc.red('reverted'))
  }

  return formatGasTrace(root)
}
