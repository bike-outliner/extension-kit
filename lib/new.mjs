import readline from 'readline'
import fs from 'fs/promises'
import path from 'path'

const packageRoot = path.resolve(import.meta.dirname, '..')
const projectRoot = process.cwd()

export async function newExtension(id) {
  if (!id) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    })
    id = await new Promise((resolve) => {
      rl.question('extension id: ', (answer) => {
        rl.close()
        resolve(answer.trim())
      })
    })
  }

  if (!isValidFileName(id)) {
    console.error('Invalid ID. Please use a valid filename.')
    process.exit(1)
  }

  // Bootstrap project configs if they don't exist
  await bootstrapProject()

  const dest = path.join(projectRoot, `src/${id}.bkext`)

  try {
    await fs.access(dest)
    console.error(`src/${id}.bkext already exists!`)
    process.exit(1)
  } catch {
    // doesn't exist, good
  }

  await fs.cp(path.join(packageRoot, 'template/template.bkext'), dest, { recursive: true })
  await fs.writeFile(
    path.join(dest, 'manifest.json'),
    JSON.stringify(
      {
        $schema: '../../node_modules/@bike-outliner/extension-kit/schemas/manifest.schema.json',
        version: '0.0.0',
        api_version: '0.0.0',
        permissions: [],
        host_permissions: [],
      },
      null,
      2
    ),
    'utf-8'
  )

  await fs.writeFile(path.join(dest, 'README.md'), `# ${id}`, 'utf-8')

  console.log(`src/${id}.bkext created!`)
}

async function bootstrapProject() {
  const configsDir = path.join(projectRoot, 'configs')
  const tsconfigPath = path.join(projectRoot, 'tsconfig.json')

  // Skip if already bootstrapped
  try {
    await fs.access(tsconfigPath)
    return
  } catch {
    // needs bootstrapping
  }

  console.log('Bootstrapping project configs...\n')

  await fs.mkdir(configsDir, { recursive: true })
  await fs.mkdir(path.join(projectRoot, 'src'), { recursive: true })

  // Root tsconfig.json with project references
  await fs.writeFile(
    tsconfigPath,
    JSON.stringify(
      {
        files: [],
        references: [
          { path: './configs/tsconfig.app.json' },
          { path: './configs/tsconfig.dom.json' },
          { path: './configs/tsconfig.style.json' },
        ],
      },
      null,
      2
    ),
    'utf-8'
  )

  // configs/tsconfig.app.json
  await fs.writeFile(
    path.join(configsDir, 'tsconfig.app.json'),
    JSON.stringify(
      {
        extends: '../node_modules/@bike-outliner/extension-kit/api/app/tsconfig.json',
        include: ['../src/*/app/**/*'],
      },
      null,
      2
    ),
    'utf-8'
  )

  // configs/tsconfig.dom.json
  await fs.writeFile(
    path.join(configsDir, 'tsconfig.dom.json'),
    JSON.stringify(
      {
        extends: '../node_modules/@bike-outliner/extension-kit/api/dom/tsconfig.json',
        include: [
          '../node_modules/@bike-outliner/extension-kit/api/dom/globals.d.ts',
          '../src/*/dom/**/*',
        ],
      },
      null,
      2
    ),
    'utf-8'
  )

  // configs/tsconfig.style.json
  await fs.writeFile(
    path.join(configsDir, 'tsconfig.style.json'),
    JSON.stringify(
      {
        extends: '../node_modules/@bike-outliner/extension-kit/api/style/tsconfig.json',
        include: ['../src/*/style/**/*'],
      },
      null,
      2
    ),
    'utf-8'
  )

  console.log('Created tsconfig.json and configs/\n')
}

function isValidFileName(name) {
  if (!name || name === '.' || name === '..') return false
  if (name.includes('/') || name.includes('\\')) return false
  const invalidChars = /[<>:"/\\|?*\x00-\x1F]/
  if (invalidChars.test(name)) return false
  return true
}
