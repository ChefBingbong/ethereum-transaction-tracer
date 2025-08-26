import fs from 'fs-extra'
import path from 'node:path'
import type { PackageJson } from 'type-fest'
import { getPackageRoot } from '../consts'

export const getPackageVersion = () => {
  const root = getPackageRoot()
  const packageJsonPath = path.join(root, 'package.json')
  const packageJsonContent = fs.readJSONSync(packageJsonPath) as PackageJson
  return packageJsonContent.version ?? '1.0.0'
}
