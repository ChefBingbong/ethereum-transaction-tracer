import * as cliPrompt from '@clack/prompts'
import { validateApiKey, validateChainId, validateRpcUrl } from '@evm-tt/utils'
import { clearEnvFile, getEnvPath, loadEnv, saveEnv, setEtherscanInEnv, setRpcInEnv } from './env'

export async function runInteractiveSetup() {
  cliPrompt.intro('\n\n   evm-tt Interactive setup & config')

  while (true) {
    const choice = await cliPrompt.select({
      message: 'What do you want to configure?',
      initialValue: 'etherscan',
      options: [
        { value: 'etherscan', label: 'Set Etherscan API key' },
        { value: 'rpc', label: 'Add/Update RPC URL for a Chain ID' },
        { value: 'view', label: 'View current config' },
        { value: 'clear', label: 'Clear & remove .env' }, // <-- NEW
        { value: 'exit', label: 'Exit' },
      ],
    })
    if (cliPrompt.isCancel(choice) || choice === 'exit') return

    if (choice === 'view') {
      const env = await loadEnv()
      const envPath = getEnvPath()

      const hasKey = env.ETHERSCAN_API_KEY ?? '(not set)'
      const rpcPairs = Object.entries(env)
        .filter(([e]) => e.includes('RPC_URL'))
        .join('\n')

      cliPrompt.note(`env file: ${envPath}\nETHERSCAN_API_KEY: ${hasKey} \n${rpcPairs}`)
      continue
    }

    if (choice === 'etherscan') {
      const env = await loadEnv()
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
      await saveEnv(envPath)
      cliPrompt.outro(`Saved ETHERSCAN_API_KEY to ${envPath}`)
      continue
    }

    if (choice === 'rpc') {
      const env = await loadEnv()
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

      await saveEnv(updatedEnv)
      cliPrompt.outro(`Saved RPC_URL_${String(chainId)} to ${envPath}`)
    }

    if (choice === 'clear') {
      await clearEnvFile()
    }
  }
}
