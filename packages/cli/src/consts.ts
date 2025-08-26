import path from 'node:path'

export const TITLE_TEXT = `  _____   __      __  __ ________  __   _______ _____   _____   _____
 | ____|  \\ \\    / / |  \\\\_   _\\\\ \\ / /__   __| \\  ____| |_   _| |_   _|
 |  _|     \\ \\  / /  | |   | |   \\ V /   | |     \\  /     | |     | |
 | |___     \\ \\/ /   | |   | |    | |    | |     /  \\     | |     | |
 |_____|     \\__/    |_|   |_|    |_|    |_|    /_/\\_\\    |_|     |_|

                       E V M _ T X _ T R A C E


`

export const ETHERSCAN_BASE_URL = 'https://api.etherscan.io'
export const DEFAULT_APP_NAME = 'evm-tt-cli'
export const APP_DIR = 'evm-tt'
export const ENV_BASENAME = '.env'

export const getPackageRoot = () => {
  const distPath = path.resolve(__dirname)
  return path.join(distPath, '../')
}
