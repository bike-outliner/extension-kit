import fastGlob from 'fast-glob'
import process from 'process'
import ts from 'typescript'
import path from 'path'

/**
 * Typecheck a single tsconfig.json file (for per-extension tsconfigs).
 */
export function typecheck(configPath) {
  const configFile = ts.readConfigFile(configPath, ts.sys.readFile)
  if (configFile.error) {
    throw new Error(
      ts.formatDiagnosticsWithColorAndContext([configFile.error], {
        getCurrentDirectory: ts.sys.getCurrentDirectory,
        getCanonicalFileName: (f) => f,
        getNewLine: () => ts.sys.newLine,
      })
    )
  }

  const parsed = ts.parseJsonConfigFileContent(
    configFile.config,
    ts.sys,
    path.dirname(configPath),
    { noEmit: true, skipLibCheck: true }
  )

  const program = ts.createProgram({
    rootNames: parsed.fileNames,
    options: parsed.options,
  })

  const diagnostics = ts.getPreEmitDiagnostics(program)

  if (diagnostics.length) {
    const formatted = ts.formatDiagnosticsWithColorAndContext(diagnostics, {
      getCurrentDirectory: ts.sys.getCurrentDirectory,
      getCanonicalFileName: (f) => f,
      getNewLine: () => ts.sys.newLine,
    })
    console.error(formatted)
    process.exit(1)
  }
}

/**
 * Typecheck all three extension contexts (app, dom, style) by reading
 * compiler options from the package's api tsconfigs and finding source
 * files in the consumer project.
 */
export function typecheckContexts(packageRoot, projectRoot) {
  const apiDir = path.join(packageRoot, 'api')

  const contexts = [
    {
      name: 'app',
      configPath: path.join(apiDir, 'app/tsconfig.json'),
      globs: [
        path.join(projectRoot, 'src/*/dom/protocols.ts'),
        path.join(projectRoot, 'src/*/app/**/*.ts'),
        path.join(projectRoot, 'src/*/tests/**/*.test.ts'),
      ],
      extraFiles: [path.join(apiDir, 'app/test.d.ts'), path.join(apiDir, 'core/globals.d.ts')],
    },
    {
      name: 'dom',
      configPath: path.join(apiDir, 'dom/tsconfig.json'),
      globs: [
        path.join(projectRoot, 'src/*/dom/**/*.ts'),
        path.join(projectRoot, 'src/*/dom/**/*.tsx'),
      ],
      extraFiles: [path.join(apiDir, 'dom/globals.d.ts'), path.join(apiDir, 'core/globals.d.ts')],
    },
    {
      name: 'style',
      configPath: path.join(apiDir, 'style/tsconfig.json'),
      globs: [path.join(projectRoot, 'src/*/style/**/*.ts')],
      extraFiles: [path.join(apiDir, 'core/globals.d.ts')],
    },
  ]

  for (const ctx of contexts) {
    const sourceFiles = fastGlob.sync(ctx.globs)
    if (sourceFiles.length === 0) continue

    // Read compiler options from the package's api tsconfig
    const configFile = ts.readConfigFile(ctx.configPath, ts.sys.readFile)
    if (configFile.error) {
      throw new Error(
        ts.formatDiagnosticsWithColorAndContext([configFile.error], {
          getCurrentDirectory: ts.sys.getCurrentDirectory,
          getCanonicalFileName: (f) => f,
          getNewLine: () => ts.sys.newLine,
        })
      )
    }

    // Parse config using the api directory as base so paths resolve correctly
    const parsed = ts.parseJsonConfigFileContent(
      configFile.config,
      ts.sys,
      path.dirname(ctx.configPath),
      { noEmit: true, skipLibCheck: true }
    )

    const rootNames = [...ctx.extraFiles, ...sourceFiles]

    const program = ts.createProgram({
      rootNames,
      options: parsed.options,
    })

    const diagnostics = ts.getPreEmitDiagnostics(program)

    if (diagnostics.length) {
      const formatted = ts.formatDiagnosticsWithColorAndContext(diagnostics, {
        getCurrentDirectory: ts.sys.getCurrentDirectory,
        getCanonicalFileName: (f) => f,
        getNewLine: () => ts.sys.newLine,
      })
      console.error(formatted)
      process.exit(1)
    }
  }
}
