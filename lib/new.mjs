import readline from 'readline'
import fs from 'fs/promises'
import path from 'path'

const packageRoot = path.resolve(import.meta.dirname, '..')
const projectRoot = process.cwd()
const templateDir = path.join(packageRoot, 'template')

export async function newExtension(id) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  const ask = (prompt) =>
    new Promise((resolve) => {
      rl.question(prompt, (answer) => resolve(answer.trim()))
    })

  try {
    if (!id) {
      id = await ask('extension id: ')
    }

    rl.close()

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

    // Copy template directory, replacing {{id}} in file contents
    await copyTemplate(templateDir, dest, id)

    console.log(`src/${id}.bkext created!`)
  } finally {
    rl.close()
  }
}

async function copyTemplate(src, dest, id) {
  await fs.mkdir(dest, { recursive: true })

  for (const entry of await fs.readdir(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name)
    const destPath = path.join(dest, entry.name)

    if (entry.isDirectory()) {
      await copyTemplate(srcPath, destPath, id)
    } else {
      let content = await fs.readFile(srcPath, 'utf-8')
      content = content.replaceAll('{{id}}', id)
      await fs.writeFile(destPath, content, 'utf-8')
    }
  }
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
        extends: './node_modules/@bike-outliner/extension-kit/api/tsconfig.json',
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
        include: [
          '../src/*/dom/protocols.ts',
          '../src/*/app/**/*',
          '../src/*/tests/**/*',
          '../node_modules/@bike-outliner/extension-kit/api/app/test.d.ts',
        ],
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
