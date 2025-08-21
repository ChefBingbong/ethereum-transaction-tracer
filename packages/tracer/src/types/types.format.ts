export type PrettyOptions = {
  showValue?: boolean
  showGas?: boolean
  showReturnData?: boolean
  showLogs?: boolean
  maxDepth?: number
  indent?: string
}

export type PrettyOpts = {
  showGas?: boolean
  showReturnData?: boolean
  showLogs?: boolean
  hexGas?: boolean
  maxData?: number
  progress?: {
    onUpdate(done: number, total: number): void
    includeLogs?: boolean
  }
}

export type GasTally = {
  topLevelTotal: bigint
  topLevelFrames: number
  ok: number
  fail: number
  abortedAt?: string
}
export type LineSink = (line: string) => void
