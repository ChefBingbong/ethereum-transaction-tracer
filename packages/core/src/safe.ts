import * as _ from 'radash'
import type { SafeError, SafePromise, SafeResult } from './types'

/**
 * Set of functions to wrap around promises to make them safe
 * Also works to wrap around try catch statements
 */

export function safeResult<T>(res: T): SafeResult<T> {
  return [undefined, res]
}

export function safeErrorStr<T extends string>(err: T): SafeError<T> {
  return [err, undefined] as const
}

export function safeError<E extends Error>(err: E): SafeError<E> {
  return [err, undefined]
}

export async function safeTry<T>(promise: Promise<T>): SafePromise<T> {
  return _.try(() => promise)()
}

export function safeSyncTry<T>(callBack: T) {
  return _.try(() => callBack)()
}

export const safeTimeoutPromiseAll = async <T>(
  promises: Promise<T>[],
  ms: number,
): SafePromise<T[]> => {
  const controller = new AbortController()
  const signal = controller.signal

  setTimeout(() => {
    controller.abort(new Error(`Timeout after ${ms}ms`))
  }, ms)

  const [error, result] = await _.try(() => Promise.all(promises))()

  if (signal.aborted) {
    return safeError(
      signal.reason instanceof Error ? signal.reason : new Error(String(signal.reason)),
    )
  }

  if (error) return safeError(error)
  return safeResult(result)
}

export const safeTimeoutPromise = async <T>(promise: Promise<T>, ms: number): SafePromise<T> => {
  const controller = new AbortController()
  const signal = controller.signal

  setTimeout(() => {
    controller.abort(new Error(`Timeout after ${ms}ms`))
  }, ms)

  const [error, result] = await _.try(() => promise)()
  if (signal.aborted) {
    return safeError(
      signal.reason instanceof Error ? signal.reason : new Error(String(signal.reason)),
    )
  }

  if (error) return safeError(error)
  return safeResult(result)
}
