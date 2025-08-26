import { program } from './program'
import './tasks'
import { getNpmVersion, renderVersionWarning } from './utils/getVersionWarning'
import { renderTitle as renderApplicationTitle } from './utils/renderTitle'

async function main() {
  const npmVersion = await getNpmVersion()
  if (npmVersion) renderVersionWarning(npmVersion)

  if (!process.argv.includes('traceTx') && !process.argv.includes('traceRequest')) {
    renderApplicationTitle()
  }

  await program.parseAsync(process.argv)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
