import os from 'node:os'
import path from 'node:path'
import * as p from '@clack/prompts'
import {
  getPublicClient,
  parseEnv,
  reliableFetchJson,
  safeErrorStr,
  safeResult,
  safeSyncTry,
  safeTry,
  stringifyEnv,
} from '@evm-tt/utils'
import * as fss from 'fs-extra'
import { APP_DIR, ENV_BASENAME, ETHERSCAN_BASE_URL } from '../consts'
import { type CliEnv, etherscanAbiSchema, type RpcKey } from './schema'

export function getConfigDir() {
  const isWin = process.platform === 'win32'
  const base =
    (isWin ? process.env['APPDATA'] : process.env['XDG_CONFIG_HOME']) ??
    (isWin
      ? path.join(os.homedir(), 'AppData', 'Roaming')
      : path.join(os.homedir(), '.config'))

  return path.join(base, APP_DIR)
}

export function getEnvPath() {
  return path.join(getConfigDir(), ENV_BASENAME)
}

function fileExists(pth: string) {
  const [error] = safeSyncTry(() => fss.accessSync(pth))
  if (error) p.note('error reading file')
  return !error
}

export function loadEnv(): CliEnv {
  const envPath = getEnvPath()
  const exists = fileExists(envPath)

  if (!exists) return {} as CliEnv
  return parseEnv<CliEnv>(fss.readFileSync(envPath, 'utf8'))
}

export function saveEnv(env: CliEnv) {
  const [error] = safeSyncTry(() => {
    fss.mkdirSync(getConfigDir(), { recursive: true })
    fss.writeFileSync(getEnvPath(), stringifyEnv(env), { mode: 0o600 })
  })
  if (error) p.note('failed to save env')
}

export function clearEnvFile(opts: { force?: boolean } = {}) {
  const envPath = getEnvPath()
  const exists = fileExists(envPath)
  if (!exists) p.note(`No env file found at ${envPath}`, 'Nothing to clear')

  if (!opts.force) {
    const ok = p.confirm({ message: `Delete ${envPath}?`, initialValue: false })
    if (p.isCancel(ok) || !ok) {
      p.cancel('Aborted')
      return
    }
  }
  const [error] = safeSyncTry(() => {
    fss.rmSync(envPath, { force: true })
  })
  if (error) p.note('failed to save env')
  p.outro(`Cleared config (${envPath})`)
}

export function getRpcFromEnv(env: CliEnv, chainId: number | string) {
  const key = `RPC_URL_${String(chainId)}` as RpcKey
  return env[key]
}

export async function setRpcInEnv(
  env: CliEnv,
  chainId: number | string,
  rpcUrl: string,
) {
  const key = `RPC_URL_${String(chainId)}` as RpcKey
  const client = getPublicClient(rpcUrl)

  const [error, chainIdRes] = await safeTry(() => client.getChainId())
  if (error || chainIdRes !== Number(chainId)) {
    return safeErrorStr(
      `ChainId does not match the provided RPC URLs network ${chainIdRes}`,
    )
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
