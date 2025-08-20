import pc from 'picocolors'

export const addr = pc.cyan
export const contract = pc.cyan
export const fn = (s: string) => pc.bold(pc.white(s))
export const typeBadge = pc.yellow
export const emit = pc.magentaBright
export const argKey = pc.blue
export const argVal = pc.green
export const eventArgVal = pc.magenta
export const retLabel = (s: string) => pc.green(s)
export const retData = pc.green
export const revLabel = (s: string) => pc.red(s)
export const revData = pc.red
export const dim = pc.white
