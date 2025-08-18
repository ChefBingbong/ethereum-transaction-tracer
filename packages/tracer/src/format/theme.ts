import pc from 'picocolors'

export const theme = {
  addr: pc.cyan,
  contract: pc.cyan,
  fn: (s: string) => pc.bold(pc.white(s)),
  typeBadge: pc.yellow,
  emit: pc.magenta,
  argKey: pc.blue,
  argVal: pc.green,
  eventArgVal: pc.magenta,
  retLabel: (s: string) => pc.green(s),
  retData: pc.green,
  revLabel: (s: string) => pc.red(s),
  revData: pc.red,
  dim: pc.white,
}
