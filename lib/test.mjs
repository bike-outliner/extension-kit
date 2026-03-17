import { execFileSync } from 'child_process'
import path from 'path'
import fs from 'fs'
import os from 'os'

export async function test(extensionId, filter) {
  checkBikeNotRunning()

  // 1. Find Bike binary
  const bikeBinary = findBikeBinary()

  // 2. Build and install extensions
  console.log('Building and installing extensions...\n')
  const { build } = await import('./build.mjs')
  await build('production', { install: true, exit: false })

  // 3. Run tests (use installed path so sandboxed Bike can access it)
  const extensionsPath = path.join(
    os.homedir(),
    'Library/Containers/com.hogbaysoftware.Bike/Data/Library/Application Support/Bike/Extensions'
  )
  const args = ['-runExtensionTests']

  if (extensionId) {
    const testDir = path.join(extensionsPath, `${extensionId}.bkext`, 'tests')
    if (!fs.existsSync(testDir)) {
      console.error(`No tests found for extension: ${extensionId}`)
      console.error(`Expected: ${testDir}`)
      process.exit(1)
    }
    args.push(testDir)
    console.log(`Running tests for: ${extensionId}`)
  } else {
    console.log('Running all extension tests')
  }

  if (filter) {
    args.push(`-testFilter=${filter}`)
    console.log(`Filter: ${filter}`)
  }

  console.log(`Using Bike: ${bikeBinary}\n`)

  try {
    execFileSync(bikeBinary, args, {
      stdio: 'inherit',
    })
  } catch (error) {
    process.exit(error.status ?? 1)
  }
}

function checkBikeNotRunning() {
  try {
    const result = execFileSync(
      'osascript', ['-e', 'tell application "System Events" to (name of processes) contains "Bike"'],
      { encoding: 'utf-8', timeout: 5000 }
    ).trim()
    if (result === 'true') {
      console.error('Error: Bike is already running. Please quit Bike before running tests.')
      console.error('The test runner needs to launch a fresh Bike instance.')
      process.exit(1)
    }
  } catch {
    // If we can't check, proceed and let the user handle any issues
  }
}

function findBikeBinary() {
  // 1. BIKE_PATH environment variable
  if (process.env.BIKE_PATH) {
    const binary = resolveBinary(process.env.BIKE_PATH)
    if (binary) return binary
    console.error(`BIKE_PATH set but binary not found: ${process.env.BIKE_PATH}`)
    process.exit(1)
  }

  // 2. Find latest Xcode dev build
  const devBuild = findLatestDevBuild()
  if (devBuild) return devBuild

  // 3. /Applications/Bike.app
  const appPath = '/Applications/Bike.app'
  const binary = resolveBinary(appPath)
  if (binary) return binary

  // 4. mdfind for any Bike.app
  try {
    const result = execFileSync('mdfind', ['kMDItemCFBundleIdentifier == "com.hogbaysoftware.Bike"'], {
      encoding: 'utf-8',
      timeout: 5000,
    }).trim()
    if (result) {
      const found = resolveBinary(result.split('\n')[0])
      if (found) return found
    }
  } catch {
    // mdfind failed, fall through
  }

  console.error('Could not find Bike.app. Set BIKE_PATH to the app or binary path.')
  process.exit(1)
}

function findLatestDevBuild() {
  const derivedData = path.join(os.homedir(), 'Library/Developer/Xcode/DerivedData')
  let candidates = []

  // 1. mdfind
  try {
    const result = execFileSync('mdfind', [
      '-onlyin', derivedData,
      'kMDItemFSName == "Bike.app" && kMDItemContentType == "com.apple.application-bundle"'
    ], {
      encoding: 'utf-8',
      timeout: 5000,
    }).trim()
    if (result) {
      candidates.push(...result.split('\n').filter(Boolean))
    }
  } catch {
    // mdfind failed
  }

  // 2. Manual scan of DerivedData for Bike-*/Build/Products/*/Bike.app
  try {
    const entries = fs.readdirSync(derivedData)
    for (const entry of entries) {
      if (!entry.startsWith('Bike-')) continue
      const productsDir = path.join(derivedData, entry, 'Build', 'Products')
      try {
        for (const config of fs.readdirSync(productsDir)) {
          const appPath = path.join(productsDir, config, 'Bike.app')
          if (fs.existsSync(appPath) && !candidates.includes(appPath)) {
            candidates.push(appPath)
          }
        }
      } catch {
        // skip if Products dir doesn't exist
      }
    }
  } catch {
    // DerivedData dir doesn't exist or not readable
  }

  if (candidates.length === 0) return null

  // Find the most recently modified Bike binary
  let latest = null
  let latestMtime = 0

  for (const appPath of candidates) {
    try {
      const binary = path.join(appPath, 'Contents', 'MacOS', 'Bike')
      const stat = fs.statSync(binary)
      if (stat.mtimeMs > latestMtime) {
        latestMtime = stat.mtimeMs
        latest = binary
      }
    } catch {
      // skip if binary doesn't exist
    }
  }

  return latest
}

function resolveBinary(appOrBinary) {
  if (appOrBinary.endsWith('.app')) {
    const binary = path.join(appOrBinary, 'Contents', 'MacOS', 'Bike')
    return fs.existsSync(binary) ? binary : null
  }
  return fs.existsSync(appOrBinary) ? appOrBinary : null
}
