import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const tracerPkgPath = join(__dirname, '..', 'packages', 'tracer', 'package.json')
const utilsPkgPath = join(__dirname, '..', 'packages', 'utils', 'package.json')

type Pkg = {
  name: string
  version: string
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
  peerDependencies?: Record<string, string>
  optionalDependencies?: Record<string, string>
}

const load = (p: string) => JSON.parse(readFileSync(p, 'utf8')) as Pkg

const tracer = load(tracerPkgPath)
const utils = load(utilsPkgPath)

const replaceWorkspaces = (obj?: Record<string, string>) => {
  if (!obj) return
  for (const [dep, range] of Object.entries(obj)) {
    if (!range?.startsWith('workspace:')) continue
    if (dep === utils.name) {
      const prefix = range.split(':')[1] === '*' ? '' : range.split(':')[1] // "workspace:^" -> "^"
      obj[dep] = `${prefix || ''}${utils.version}`
    }
  }
}

replaceWorkspaces(tracer.dependencies)
replaceWorkspaces(tracer.devDependencies)
replaceWorkspaces(tracer.peerDependencies)
replaceWorkspaces(tracer.optionalDependencies)

writeFileSync(tracerPkgPath, `${JSON.stringify(tracer, null, 2)}\n`)
console.log(`Replaced workspace deps in ${tracerPkgPath}`)
