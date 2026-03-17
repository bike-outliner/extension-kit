import fs from 'fs'
import path from 'path'

export function clean(outdir) {
  if (fs.existsSync(outdir)) {
    fs.rmSync(outdir, { recursive: true })
    console.log(`Cleaned: ${outdir}`)
  }
}
