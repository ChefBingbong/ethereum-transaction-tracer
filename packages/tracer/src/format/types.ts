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
  /** show a progress bar while formatting */
  progress?: {
    /** called as nodes/logs are formatted */
    onUpdate(done: number, total: number): void
    /** whether logs count towards progress (default true) */
    includeLogs?: boolean
  }
}
