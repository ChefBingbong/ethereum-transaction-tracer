export function parseEnv<T>(src: string): T {
  const out: Record<string, string> = {}
  for (const line of src.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const i = trimmed.indexOf('=')
    if (i === -1) continue
    const k = trimmed.slice(0, i).trim()
    let v = trimmed.slice(i + 1).trim()
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1)
    }
    out[k] = v
  }
  return out as T
}

export function stringifyEnv(obj: Record<string, string | undefined>) {
  const pairs = Object.entries(obj).filter(([, v]) => v != null)
  return (
    pairs
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${quoteIfNeeded(String(v))}`)
      .join('\n') + (pairs.length ? '\n' : '')
  )
}

export function quoteIfNeeded(v: string) {
  return /\s|#|=|"|'/.test(v) ? JSON.stringify(v) : v
}
