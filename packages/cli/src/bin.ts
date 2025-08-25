import { MiniCli } from './cli'
import { registerTasks } from './task'

async function main() {
  const cli = new MiniCli()
  registerTasks(cli)
  await cli.run(process.argv)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
