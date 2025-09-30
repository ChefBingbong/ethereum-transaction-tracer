export const prefixesFor = (isLast: boolean, lastStack: boolean[]) => {
  let prefix = ''
  for (const last of lastStack) {
    prefix += last ? '   ' : '│  '
  }

  const depth = lastStack.length
  const branch = depth === 0 ? '' : prefix + (isLast ? '└─ ' : '├─ ')
  const childPrefix = prefix + (isLast ? '   ' : '│  ')
  return { branch, childPrefix }
}
