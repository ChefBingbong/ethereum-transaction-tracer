// utils/renderTitle.ts (CJS/ESM safe)
import { TITLE_TEXT } from '../consts'

const poimandresTheme = {
  blue: '#add7ff',
  cyan: '#89ddff',
  green: '#5de4c7',
  magenta: '#fae4fc',
  red: '#d0679d',
  yellow: '#fffac2',
}

// --- tiny gradient renderer -------------------------------------------------

const RESET = '\x1b[0m'
const rgb = (r: number, g: number, b: number) => `\x1b[38;2;${r};${g};${b}m`

function hexToRgb(hex: string): [number, number, number] {
  const s = hex.replace('#', '')
  const h =
    s.length === 3
      ? s
          .split('')
          .map((c) => c + c)
          .join('')
      : s
  const n = parseInt(h, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

const lerp = (a: number, b: number, t: number) => Math.round(a + (b - a) * t)

function colorBetween(a: [number, number, number], b: [number, number, number], t: number) {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)] as const
}

function gradientStops(colors: string[]) {
  return colors.map(hexToRgb)
}

function colorAt(stops: ReturnType<typeof gradientStops>, t: number) {
  if (stops.length === 1) return stops[0]
  const segs = stops.length - 1
  const x = Math.min(segs - 1e-9, Math.max(0, t * segs))
  const i = Math.floor(x)
  const localT = x - i
  return colorBetween(stops[i], stops[i + 1], localT)
}

export function renderTitle() {
  const stops = gradientStops(Object.values(poimandresTheme))
  const lines = TITLE_TEXT.replace(/\r/g, '').split('\n')

  const colored = lines
    .map((line) => {
      if (!line.length) return ''
      let out = ''
      const L = line.length
      for (let i = 0; i < L; i++) {
        const t = L === 1 ? 0 : i / (L - 1)
        const [r, g, b] = colorAt(stops, t)
        out += rgb(r, g, b) + line[i]
      }
      return out + RESET
    })
    .join('\n')

  console.log(colored)
}
