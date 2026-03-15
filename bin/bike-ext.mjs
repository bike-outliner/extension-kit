#!/usr/bin/env node

const [command, ...args] = process.argv.slice(2)

switch (command) {
  case 'new': {
    const { newExtension } = await import('../lib/new.mjs')
    await newExtension(args[0])
    break
  }
  case 'build': {
    const { build } = await import('../lib/build.mjs')
    await build('production')
    break
  }
  case 'watch': {
    const { build } = await import('../lib/build.mjs')
    await build('watch')
    break
  }
  case 'package': {
    const { packageExtensions } = await import('../lib/package.mjs')
    packageExtensions()
    break
  }
  case 'release': {
    const { releaseExtension } = await import('../lib/release.mjs')
    releaseExtension(args[0])
    break
  }
  case 'build-runtime': {
    const { buildRuntime } = await import('../lib/build-runtime.mjs')
    await buildRuntime('production')
    break
  }
  case 'watch-runtime': {
    const { buildRuntime } = await import('../lib/build-runtime.mjs')
    await buildRuntime('watch')
    break
  }
  default:
    console.log('Usage: bike-ext <command>')
    console.log('')
    console.log('Commands:')
    console.log('  new [id]            Create a new extension from template')
    console.log('  build               Build all extensions for production')
    console.log('  watch               Build and watch for changes')
    console.log('  package             Package extensions as .zip files')
    console.log('  release <id>        Create a GitHub release for an extension')
    console.log('  build-runtime       Build runtime (React host environment) for production')
    console.log('  watch-runtime       Build and watch runtime for changes')
    process.exit(command ? 1 : 0)
}
