import * as p from '@clack/prompts'
import {
  getPublicClient,
  parseEnv,
  reliableFetchJson,
  safeErrorStr,
  safeResult,
  safeTry,
  stringifyEnv,
} from '@evm-tt/utils'
import { default as fs, default as fsp } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { APP_DIR, ENV_BASENAME, ETHERSCAN_BASE_URL } from '../consts'
import { type CliEnv, etherscanAbiSchema, type RpcKey } from './schema'

export function getConfigDir() {
  const isWin = process.platform === 'win32'
  const base =
    (isWin ? process.env['APPDATA'] : process.env['XDG_CONFIG_HOME']) ??
    (isWin ? path.join(os.homedir(), 'AppData', 'Roaming') : path.join(os.homedir(), '.config'))
  return path.join(base, APP_DIR)
}

export function getEnvPath() {
  return path.join(getConfigDir(), ENV_BASENAME)
}

export async function loadEnv(): Promise<CliEnv> {
  const envPath = getEnvPath()
  const buf = await fsp.readFile(envPath, 'utf8')
  return parseEnv<CliEnv>(buf)
}
export async function saveEnv(env: CliEnv): Promise<void> {
  await fsp.mkdir(getConfigDir(), { recursive: true })
  await fsp.writeFile(getEnvPath(), stringifyEnv(env), { mode: 0o600 })
}

export function getRpcFromEnv(env: CliEnv, chainId: number | string) {
  const key = `RPC_URL_${String(chainId)}` as RpcKey
  return env[key]
}

export async function setRpcInEnv(env: CliEnv, chainId: number | string, rpcUrl: string) {
  const key = `RPC_URL_${String(chainId)}` as RpcKey
  const client = getPublicClient(rpcUrl)

  const [error, chainIdRes] = await safeTry(() => client.getChainId())
  if (error || chainIdRes !== Number(chainId)) {
    return safeErrorStr(`ChainId does not match the provided RPC URLs network ${chainIdRes}`)
  }
  return safeResult({ ...env, [key]: rpcUrl } as CliEnv)
}

export async function setEtherscanInEnv(env: CliEnv, apiKey: string) {
  const [error, response] = await reliableFetchJson(
    etherscanAbiSchema,
    new Request(
      `${ETHERSCAN_BASE_URL}/v2/api/?${new URLSearchParams({
        module: 'getapilimit',
        action: 'getapilimit',
        apiKey,
      })}`,
    ),
  )
  if (error) return safeErrorStr(error.message)
  if (response.status === '0' || response.message === 'NOTOK') {
    return safeErrorStr('[Etherscan]: invalid response')
  }
  return safeResult({ ...env, ['ETHERSCAN_API_KEY']: apiKey } as CliEnv)
}

export function clearEnv() {
  return fs
    .rm(getEnvPath(), { force: true })
    .then(() => void 0)
    .catch(() => void 0)
}

export async function clearEnvFile(opts: { force?: boolean } = {}) {
  const envPath = getEnvPath()
  try {
    fsp.stat(envPath)
  } catch {
    p.note(`No env file found at ${envPath}`, 'Nothing to clear')
    return
  }

  if (!opts.force) {
    const ok = await p.confirm({
      message: `Delete ${envPath}?`,
      initialValue: false,
    })
    if (p.isCancel(ok) || !ok) {
      p.cancel('Aborted')
      return
    }
  }

  fsp.rm(envPath, { force: true })
  p.outro(`Cleared config (${envPath})`)
}
