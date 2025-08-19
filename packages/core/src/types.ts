import type * as _ from 'radash'

export type RetryConfigParams = Parameters<typeof _.retry>[0]

export type SafePromise<T, E extends Error | string = Error> = Promise<
  SafeError<E> | SafeResult<T>
>

export type Safe<T, E extends Error | string = Error> =
  | SafeError<E>
  | SafeResult<T>

export type SafeResult<T> = [undefined, T]
export type SafeError<E extends Error | string> = [E, undefined]
