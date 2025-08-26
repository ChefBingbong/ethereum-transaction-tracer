import { runInteractiveSetup } from '../configCli/cliConfigHelper'
import createTask from '../program'

createTask('cli')
  .description(
    'A command line tool that lets you manage the evm-tt CLI env (e.g.. storing rpc urls / api keys)',
  )
  .action(async () => {
    await runInteractiveSetup()
  })
