import { Command } from '@commander-js/extra-typings'

export const program = new Command()
export const createTask = (name: string) => program.command(name)

export function configureProgram(opts: {
  name?: string
  description?: string
  version?: string
}) {
  if (opts.name) program.name(opts.name)
  if (opts.description) program.description(opts.description)
  if (opts.version)
    program.version(opts.version, '-v, --version', 'Show version')
}

export default createTask
