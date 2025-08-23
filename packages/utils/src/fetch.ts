import type { HeadersInit } from 'bun'
import * as _ from 'radash'
import type z from 'zod'
import type { RetryConfigParams, SafePromise } from './types'

const DEFAULT_FETCH_TIMEOUT = 5000
/**
 * Generic Wrapper around native fetch API that retries up to 3 times
 */
export async function reliableFetch(
  request: Request,
  retryOptions?: RetryConfigParams,
  timeout = DEFAULT_FETCH_TIMEOUT,
): SafePromise<Awaited<ReturnType<typeof fetch>>> {
  return _.try(() => {
    return _.retry(retryOptions ?? {}, async () => {
      const clonedRequest = request.clone()
      const response = await fetchWithTimeout(
        clonedRequest.url,
        {
          method: clonedRequest.method,
          headers: clonedRequest.headers as HeadersInit,
          body: clonedRequest.body,
        },
        timeout,
      )

      if (!response.ok) {
        const text = await response.text()
        throw new Error(text)
      }
      return response
    })
  })()
}

/**
 * Wrapper around native fetch API that retries up to 3 times
 * Also includes automatic JSON parsing and validation against zod schema
 */
export async function reliableFetchJson<T extends z.ZodTypeAny>(
  schema: T,
  ...args: Parameters<typeof reliableFetch>
): SafePromise<z.infer<T>, Error | z.ZodError> {
  const [err, res] = await reliableFetch(...args)
  if (err) return [err, undefined]

  const jsonRes = await res.json()

  const data = schema.safeParse(jsonRes)
  if (!data.success) {
    return [data.error, undefined]
  }

  return [undefined, data.data as z.infer<T>]
}

const fetchWithTimeout = async (
  url: string,
  options: RequestInit,
  timeout: number,
): Promise<Response> => {
  const controller = new AbortController()
  const signal = controller.signal

  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    return await fetch(url, { ...options, signal })
  } finally {
    clearTimeout(timeoutId)
  }
}
