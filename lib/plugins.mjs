import { typecheck, typecheckContexts } from './typecheck.mjs'
import fastGlob from 'fast-glob'
import process from 'process'
import path from 'path'
import os from 'os'
import fs from 'fs'

export function copyAndValidatePlugin(outdir, srcDir, validateTheme, { manifestPattern, themePattern }) {
  return {
    name: 'copy-and-validate',
    setup(build) {
      build.onEnd(async () => {
        // Copy manifest.json files
        const manifests = await fastGlob(manifestPattern)
        for (const file of manifests) {
          const dest = path.join(outdir, path.relative(srcDir, file))
          fs.mkdirSync(path.dirname(dest), { recursive: true })
          fs.copyFileSync(file, dest)
        }

        // Validate and copy user theme files
        const themes = await fastGlob(themePattern)
        for (const file of themes) {
          validateThemeFile(file, validateTheme)
          const dest = path.join(outdir, path.relative(srcDir, file))
          fs.mkdirSync(path.dirname(dest), { recursive: true })
          fs.copyFileSync(file, dest)
        }
      })
    },
  }
}

function validateThemeFile(file, validateTheme) {
  const themeContent = fs.readFileSync(file, 'utf-8')
  let theme
  try {
    theme = JSON.parse(themeContent)
  } catch (e) {
    console.error(`\x1b[31mError parsing ${file}: ${e.message}\x1b[0m`)
    process.exit(1)
  }

  const valid = validateTheme(theme)
  if (!valid) {
    console.error(`\x1b[31mTheme validation failed: ${file}\x1b[0m`)
    for (const error of validateTheme.errors) {
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
          const manifest = JSON.parse(fs.readFileSync(manifestFile, 'utf-8'))
          if (manifest.install == true) {
            let extensionDir = path.dirname(manifestFile)
            let extensionName = path.basename(extensionDir)
            let srcPath = extensionDir
            let destPath = path.join(extensionsPath, extensionName)

            try {
              if (fs.existsSync(destPath)) {
                fs.rmSync(destPath, { recursive: true, force: true })
              }
              fs.mkdirSync(destPath, { recursive: true })
              fs.cpSync(srcPath, destPath, { recursive: true })
              console.log(`Installed extension: ${extensionName}`)
            } catch (error) {
              console.error(`Failed to install extension: ${extensionName}`)
              console.error(error)
            }
          }
        }
      })
    },
  }
}

/**
 * Run an esbuild context in production (single build) or watch mode.
 */
export async function runBuildContext(context, mode) {
  if (mode === 'production') {
    await context.rebuild()
    process.exit(0)
  } else {
    await context.watch()
  }
}
