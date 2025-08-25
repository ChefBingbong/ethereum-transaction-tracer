import pc from 'picocolors'

export type OptionType = 'string' | 'number' | 'boolean'

export type OptionDef = {
  name: string
  description?: string
  type: OptionType
  required?: boolean
  default?: unknown
  alias?: string
}

export type TaskAction = (args: Record<string, any>) => Promise<void> | void

class TaskBuilder {
  public description?: string
  private options: OptionDef[] = []
  private run?: TaskAction

  constructor(public readonly name: string) {}

  describe(text: string) {
    this.description = text
    return this
  }

  option(def: OptionDef) {
    this.options.push(def)
    return this
  }

  action(fn: TaskAction) {
    this.run = fn
    return this
  }

  getOptions() {
    return this.options
  }

  async execute(args: Record<string, any>) {
    if (!this.run) {
      throw new Error(`Task "${this.name}" has no action()`)
    }
    // basic required check
    for (const opt of this.options) {
      const key = opt.name
      const val = args[key]
      if (opt.required && (val === undefined || val === null || val === '')) {
        throw new Error(`Missing required option "--${key}"`)
      }
      if (val === undefined && opt.default !== undefined) {
        args[key] = opt.default
      }
      if (val !== undefined) {
        if (opt.type === 'number' && typeof val !== 'number') {
          const n = Number(val)
          if (Number.isNaN(n)) throw new Error(`Option "--${key}" must be a number`)
          args[key] = n
        }
        if (opt.type === 'boolean' && typeof val !== 'boolean') {
          if (val === 'true' || val === true) args[key] = true
          else if (val === 'false' || val === false) args[key] = false
          else throw new Error(`Option "--${key}" must be a boolean`)
        }
      }
    }
    return this.run(args)
  }

  helpLine() {
    const opts = this.options
      .map((o) => {
        const req = o.required ? '(required)' : ''
        const typ = o.type ? `<${o.type}>` : ''
        const al = o.alias ? ` (-${o.alias})` : ''
        return `  --${o.name}${al} ${typ}  ${o.description ?? ''} ${req}`
      })
      .join('\n')
    return `${pc.bold(this.name)}${this.description ? ` — ${this.description}` : ''}\n${opts}\n`
  }
}

export class MiniCli {
  private tasks = new Map<string, TaskBuilder>()

  task(name: string, init?: (t: TaskBuilder) => void) {
    const t = new TaskBuilder(name)
    init?.(t)
    this.tasks.set(name, t)
    return t
  }

  get(name: string) {
    return this.tasks.get(name)
  }

  list() {
    return [...this.tasks.values()]
  }

  async run(argv: string[]) {
    const [_node, _binn, ...rest] = argv
    const firstNonFlag = rest.find((v) => !v.startsWith('-'))
    if (
      !firstNonFlag ||
      firstNonFlag === 'help' ||
      firstNonFlag === '--help' ||
      firstNonFlag === '-h'
    ) {
      return this.printHelp()
    }

    const taskName = firstNonFlag
    const task = this.tasks.get(taskName)
    if (!task) {
      console.error(pc.red(`Unknown task "${taskName}"\n`))
      this.printHelp()
      process.exit(1)
    }

    const args = parseFlags(rest.slice(rest.indexOf(taskName) + 1))
    try {
      await task.execute(args)
    } catch (err: any) {
      console.error(pc.red(`✖ ${err?.message ?? String(err)}`))
      process.exit(1)
    }
  }

  printHelp() {
    console.log(pc.bold('evm-tt — tasks\n'))
    for (const t of this.list()) {
      console.log(t.helpLine())
    }
    console.log(`Usage: evm-tt ${pc.cyan('<task>')} [options]\n`)
  }
}

function parseFlags(args: string[]) {
  const out: Record<string, any> = {}
  for (let i = 0; i < args.length; i++) {
    let tok = args[i] as string
    if (!tok.startsWith('-')) continue
    if (tok.startsWith('--')) {
      tok = tok.slice(2)
      const eq = tok.indexOf('=')
      if (eq >= 0) {
        const k = tok.slice(0, eq)
        const v = tok.slice(eq + 1)
        out[k] = v
      } else {
        const k = tok
        const nxt = args[i + 1]
        if (!nxt || nxt.startsWith('-')) {
          out[k] = true
        } else {
          out[k] = nxt
          i++
        }
      }
    } else {
      // short flag: -k v
      const k = tok.slice(1)
      const nxt = args[i + 1]
      if (!nxt || nxt.startsWith('-')) out[k] = true
      else {
        out[k] = nxt
        i++
      }
    }
  }
  return out
}
