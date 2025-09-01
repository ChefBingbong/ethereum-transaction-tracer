import { ProgressBar } from '@opentf/cli-pbar'

export type Progress = {
  inc: (n: number) => void
  done: () => void
}

export function makeProgress(show?: boolean): Progress {
  if (!show) {
    return { inc: () => {}, done: () => {} }
  }
  const bar = new ProgressBar({
    prefix: 'tracing Transaction',
    showPercent: false,
    showCount: true,
  })
  let count = 0
  bar.start({ total: 100 })
  return {
    inc(n: number) {
      count = Math.min(100, count + n)
      bar.update({ value: count })
    },
    done() {
      bar.update({ value: 100 })
      bar.stop()
    },
  }
}
