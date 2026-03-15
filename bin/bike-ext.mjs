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
  case 'build-internals': {
    const { buildInternals } = await import('../lib/build-internals.mjs')
    await buildInternals('production')
    break
  }
  case 'watch-internals': {
    const { buildInternals } = await import('../lib/build-internals.mjs')
    await buildInternals('watch')
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
    console.log('  build-internals     Build internals (React runtime) for production')
    console.log('  watch-internals     Build and watch internals for changes')
    process.exit(command ? 1 : 0)
}
