import { logger } from '@evm-tt/utils'
import { execSync } from 'node:child_process'
import https from 'node:https'
import { getPackageVersion } from './getPackageVersion'

/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 * https://github.com/facebook/create-react-app/blob/main/packages/create-react-app/LICENSE
 */
interface DistTagsBody {
  latest: string
}

export const renderVersionWarning = (npmVersion: string) => {
  const currentVersion = getPackageVersion()

  if (currentVersion.includes('beta')) {
    logger.warn('  You are using a beta version of create-t3-app.')
    logger.warn('  Please report any bugs you encounter.')
  } else if (currentVersion.includes('next')) {
    logger.warn(
      '  You are running create-t3-app with the @next tag which is no longer maintained.',
    )
    logger.warn('  Please run the CLI with @latest instead.')
  } else if (currentVersion !== npmVersion) {
    logger.warn('  You are using an outdated version of create-t3-app.')
    logger.warn(
      '  Your version:',
      `${currentVersion}.`,
      'Latest version in the npm registry:',
      npmVersion,
    )
    logger.warn('  Please run the CLI with @latest to get the latest updates.')
  }
}

export const getNpmVersion = () =>
  checkForLatestVersion().catch(() => {
    try {
      return execSync('npm view evm-tt version').toString().trim()
    } catch {
      return null
    }
  })

function checkForLatestVersion(): Promise<string> {
  return new Promise((resolve, reject) => {
    https
      .get(
        'https://registry.npmjs.org/-/package/@evm-tt/cli/dist-tags',
        (res) => {
          if (res.statusCode === 200) {
            let body = ''
            res.on('data', (data) => {
              body += data
            })
            res.on('end', () => {
              resolve((JSON.parse(body) as DistTagsBody).latest)
            })
          } else {
            reject()
          }
        },
      )
      .on('error', () => {
        logger.error('Unable to check for latest version.')
        reject()
      })
  })
}
