import { typecheck, typecheckContexts } from './typecheck.mjs'
import fastGlob from 'fast-glob'
import process from 'process'
import path from 'path'
import os from 'os'
import fs from 'fs'

export function copyAndValidatePlugin(outdir, srcDir, validateManifest, validateTheme, { manifestPattern, themePattern }) {
  return {
    name: 'copy-and-validate',
    setup(build) {
      // Virtual entrypoint that watches manifest and theme files so
      // esbuild triggers a rebuild when they change in watch mode.
      build.onResolve({ filter: /^copy-and-validate$/ }, () => ({
        path: 'copy-and-validate',
        namespace: 'copy-and-validate',
      }))

      build.onLoad({ filter: /.*/, namespace: 'copy-and-validate' }, async () => {
        const manifests = await fastGlob(manifestPattern)
        const themes = await fastGlob(themePattern)
        return {
          contents: '',
          loader: 'js',
          watchFiles: [...manifests, ...themes],
        }
      })

      build.onEnd(async () => {
        // Validate and copy manifest.json files
        const manifests = await fastGlob(manifestPattern)
        for (const file of manifests) {
          validateJsonFile(file, validateManifest, 'Manifest')
          const dest = path.join(outdir, path.relative(srcDir, file))
          fs.mkdirSync(path.dirname(dest), { recursive: true })
          fs.copyFileSync(file, dest)
        }

        // Validate and copy theme files
        const themes = await fastGlob(themePattern)
        for (const file of themes) {
          validateJsonFile(file, validateTheme, 'Theme')
          const dest = path.join(outdir, path.relative(srcDir, file))
          fs.mkdirSync(path.dirname(dest), { recursive: true })
          fs.copyFileSync(file, dest)
        }

        // Remove the virtual entrypoint output file
        const virtualOutput = path.join(outdir, 'copy-and-validate.js')
        if (fs.existsSync(virtualOutput)) fs.unlinkSync(virtualOutput)

        // Warn about stub / empty context files that waste runtime resources
        warnUnchangedStubs(srcDir)
      })
    },
  }
}

function validateJsonFile(file, validate, label) {
  const content = fs.readFileSync(file, 'utf-8')
  let data
  try {
    data = JSON.parse(content)
  } catch (e) {
    console.error(`\x1b[31mError parsing ${file}: ${e.message}\x1b[0m`)
    process.exit(1)
  }

  const valid = validate(data)
  if (!valid) {
    console.error(`\x1b[31m${label} validation failed: ${file}\x1b[0m`)
    for (const error of validate.errors) {
      const location = error.instancePath || '(root)'
      console.error(`  ${location}: ${error.message}`)
    }
    process.exit(1)
  }
}

export function typecheckPlugin(packageRoot, projectRoot) {
  return {
    name: 'typecheck',
    setup(build) {
      build.onEnd(async () => {
        // Typecheck all three contexts using api tsconfigs from the package
        typecheckContexts(packageRoot, projectRoot)

        // Also check any per-extension tsconfigs
        const files = await fastGlob(path.join(projectRoot, 'src/**/**/tsconfig.json'))
        for (const file of files) {
          typecheck(file)
        }
      })
    },
  }
}

export function installExtensionPlugin(outdir) {
  return {
    name: 'install-extension',
    setup(build) {
      build.onEnd(async () => {
        const extensionsPath = path.join(
          os.homedir(),
          'Library/Containers/com.hogbaysoftware.Bike/Data/Library/Application Support/Bike/Extensions'
        )
        const files = await fastGlob(path.join(outdir, '**/manifest.json'))
        for (const manifestFile of files) {
          const extensionDir = path.dirname(manifestFile)
          const extensionName = path.basename(extensionDir)
          const destPath = path.join(extensionsPath, extensionName)

          try {
            if (fs.existsSync(destPath)) {
              fs.rmSync(destPath, { recursive: true, force: true })
            }
            fs.mkdirSync(destPath, { recursive: true })
            fs.cpSync(extensionDir, destPath, { recursive: true })
            console.log(`Installed extension: ${extensionName}`)
          } catch (error) {
            console.error(`Failed to install extension: ${extensionName}`)
            console.error(error)
          }
        }
      })
    },
  }
}

const STUB_PATTERNS = [
  // app stub — just a console.log activate
  /^\s*export\s+async\s+function\s+activate\s*\([^)]*\)\s*\{\s*console\.log\s*\(\s*(['"`]).*?\1\s*\)\s*;?\s*\}\s*$/,
  // dom stub — just sets element.textContent
  /^\s*export\s+async\s+function\s+activate\s*\([^)]*\)\s*\{\s*context\.element\.textContent\s*=\s*(['"`]).*?\1\s*;?\s*\}\s*$/,
]

function warnUnchangedStubs(srcDir) {
  const files = fastGlob.sync(path.join(srcDir, '**/*.bkext/{app,dom,style}/**/*.{ts,tsx}'))

  for (const file of files) {
    const rel = path.relative(srcDir, file)
    const content = fs.readFileSync(file, 'utf8')

    // Strip import lines and comments to get the meaningful body
    const body = content
      .replace(/\/\/.*$/gm, '')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/^\s*import\s+.*$/gm, '')
      .trim()

    if (body === '') {
      console.warn(`\x1b[33mWarning: ${rel} is empty — consider removing the context to avoid unnecessary runtime overhead\x1b[0m`)
      continue
    }

    for (const pattern of STUB_PATTERNS) {
      if (pattern.test(body)) {
        console.warn(`\x1b[33mWarning: ${rel} contains only template stub code — consider removing the context or adding real logic\x1b[0m`)
        break
      }
    }
  }
}

/**
 * Run an esbuild context in production (single build) or watch mode.
 */
export async function runBuildContext(context, mode, { exit = true } = {}) {
  if (mode === 'production') {
    await context.rebuild()
    await context.dispose()
    if (exit) process.exit(0)
  } else {
    await context.watch()
  }
}
