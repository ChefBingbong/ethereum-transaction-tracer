import pc from 'picocolors'
import { type Address, formatEther, formatGwei, hexToBigInt } from 'viem'
import { LogVerbosity, type RpcCallTrace, type RpcCallType } from '../types'

export const addr = pc.blue
export const errorColour = pc.red
export const bold = pc.bold
export const textColour = pc.blue
export const white = pc.white
export const contract = pc.cyan
export const fn = (s: string) => pc.bold(pc.blue(s))
export const typeBadge = pc.yellow
export const yellow = pc.yellow
export const emit = pc.magentaBright
export const argKey = pc.blue
export const argVal = pc.green
export const eventArgVal = pc.magenta
export const retLabel = (s: string) => pc.green(s)
export const retData = pc.green
export const revLabel = (s: string) => pc.red(s)
export const revData = pc.red
export const dim = pc.white
export const dark = pc.dim
export const yellowLight = pc.dim
export const redBold = (s: string) => pc.bold(pc.red(s))

export const badgeFor = (t: RpcCallType) => yellow(`[${t.toLowerCase()}]`)
export const getCallTypeLabel = (t: RpcCallType) =>
  yellow(`[${t.toLowerCase()}]`)

export const getValueString = (node: RpcCallTrace, verbosity: LogVerbosity) => {
  if (verbosity < LogVerbosity.Highest) return ''
  return dark(
    `${yellowLight('value=')}${formatEther(hexToBigInt(node.value ?? '0x00'))} ETH`,
  )
}

export const getGasString = (node: RpcCallTrace, verbosity: LogVerbosity) => {
  if (verbosity < LogVerbosity.Highest) return ''
  return dark(
    `(${yellowLight('gas=')}${formatGwei(hexToBigInt(node.gas))} ${yellowLight('used=')}${formatGwei(hexToBigInt(node.gasUsed))}) Gwei`,
  )
}

export const getValueBadge = (node: RpcCallTrace, verbosity: LogVerbosity) => {
  if (verbosity < LogVerbosity.Highest) return ''
  return dark(
    `${yellowLight('value=')}${formatEther(hexToBigInt(node.value ?? '0x00'))} ETH`,
  )
}

export const getGasBadge = (node: RpcCallTrace, verbosity: LogVerbosity) => {
  if (verbosity < LogVerbosity.Highest) return ''
  return dark(
    `(${yellowLight('gas=')}${formatGwei(hexToBigInt(node.gas))} ${yellowLight('used=')}${formatGwei(hexToBigInt(node.gasUsed))}) Gwei`,
  )
}

export const getStyledCallLabel = (node: RpcCallTrace, fnName: string) =>
  node.error ? redBold(fnName) : fn(fnName)

export const getDefaultContractCallLabel = () => dim('()')

export const getDefaultTextColour = (error: boolean) =>
  error ? errorColour : textColour

export function getCallOriginLabel(node: RpcCallTrace, name?: string) {
  const theme = getDefaultTextColour(!!node?.error)
  if (!node?.to) return theme('<unknown>')

  const contractOriginLabel = name ? `${name}${'()'}` : node.to
  return theme(bold(contractOriginLabel))
}

export function getLogOriginLabel(address: Address | undefined, name?: string) {
  const theme = getDefaultTextColour(false)
  if (!address) return theme('<unknown>')

  const contractOriginLabel = name ? `${name}${'()'}` : address
  return theme(bold(contractOriginLabel))
}

export const getCreateMethodLabel = (error: boolean) =>
  error ? bold(errorColour('create')) : bold(textColour('create'))

export const getSelfDestructMethodLabel = (error: boolean) =>
  error ? bold(errorColour('selfdestruct')) : bold(textColour('selfdestruct'))

export const getSharedBadges = (
  node: RpcCallTrace,
  verbosity: LogVerbosity,
) => {
  const typeBadge = ` ${badgeFor(node.type)}`
  const failBadge = node.error ? ` ${pc.red('❌')}` : ''
  const valueStr = getValueString(node, verbosity)
  const gasStr = getGasString(node, verbosity)

  return { typeBadge, failBadge, valueStr, gasStr }
}

export function sumInner(node: RpcCallTrace) {
  let total = 0n
  let count = 0
  const kids = node.calls ?? []
  for (const c of kids) {
    const used = hexToBigInt(c.gasUsed)
    total += used
    count += 1
    const sub = sumInner(c)
    total += sub.total
    count += sub.count
  }
  return { total, count }
}
