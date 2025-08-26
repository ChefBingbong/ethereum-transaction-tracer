import * as cliPrompt from '@clack/prompts'
import { logger, validateApiKey, validateChainId, validateRpcUrl } from '@evm-tt/utils'
import { clearEnvFile, getEnvPath, loadEnv, saveEnv, setEtherscanInEnv, setRpcInEnv } from './env'

export async function runInteractiveSetup() {
  cliPrompt.intro('evm-tt Interactive setup & config')
  logger.info(
    '   You can use this interactive cli to pre-set enviornment variables that would other wise',
  )
  logger.info(
    '   have to be passed through on the command line. you currently can set your etherscan api',
  )
  logger.info(
    '   key and rpcUrls with this cli. More support will be added in future for abi files etc\n',
  )

  while (true) {
    const choice = await cliPrompt.select({
      message: 'What do you want to configure?',
      initialValue: 'etherscan',
      options: [
        { value: 'etherscan', label: 'Set Etherscan API key' },
        { value: 'rpc', label: 'Add/Update RPC URL for a Chain ID' },
        { value: 'view', label: 'View current config' },
        { value: 'clear', label: 'Clear & remove .env' },
        { value: 'exit', label: 'Exit' },
      ],
    })
    if (cliPrompt.isCancel(choice) || choice === 'exit') return

    if (choice === 'view') {
      const env = loadEnv()
      const envPath = getEnvPath()

      const hasKey = env.ETHERSCAN_API_KEY ?? '(not set)'
      const rpcPairs = Object.entries(env)
        .filter(([e]) => e.includes('RPC_URL'))
        .join('\n')

      cliPrompt.note(`env file: ${envPath}\nETHERSCAN_API_KEY: ${hasKey} \n${rpcPairs}`)
      continue
    }

    if (choice === 'etherscan') {
      const env = loadEnv()
      const apiKey = await cliPrompt.password({
        message: 'Paste your Etherscan API key',
        validate: validateApiKey,
      })

      const [error, envPath] = await setEtherscanInEnv(env, String(apiKey))
      if (error || !envPath) {
        cliPrompt.cancel(error)
        cliPrompt.note(
          `If you dont have an api key you can get one here https://docs.etherscan.io/getting-started/viewing-api-usage-statistics`,
        )
        return
      }
      saveEnv(envPath)
      cliPrompt.outro(`Saved ETHERSCAN_API_KEY to ${envPath}`)
      continue
    }

    if (choice === 'rpc') {
      const env = loadEnv()
      const envPath = getEnvPath()

      const chainId = await cliPrompt.text({
        message: 'Enter chain ID (e.g. 1 for mainnet):',
        placeholder: '1',
        validate: validateChainId,
      })

      const rpcUrl = await cliPrompt.text({
        message: 'Enter RPC URL:',
        placeholder: 'https://<your-rpc>',
        validate: validateRpcUrl,
      })

      const [error, updatedEnv] = await setRpcInEnv(env, String(chainId), String(rpcUrl))

      if (error) {
        cliPrompt.cancel(error)
        return
      }

      saveEnv(updatedEnv)
      cliPrompt.outro(`Saved RPC_URL_${String(chainId)} to ${envPath}`)
    }

    if (choice === 'clear') clearEnvFile()
  }
}
