function isValidHttpUrl(v: string) {
  try {
    const u = new URL(v)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

export const validateApiKey = (v: string) => {
  if (!v || v.length === 0) return 'API key cannot be empty'
}

export const validateChainId = (v: string) => {
  if (!/^\d+$/.test(String(v))) return 'Must be a number'
}

export function validateRpcUrl(v: string) {
  if (!isValidHttpUrl(String(v))) return 'Must be a valid http(s) URL'
}
