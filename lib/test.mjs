import { execFileSync, spawn } from 'child_process'
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

  // 3. Refuse to run if what we just installed can't actually run
  checkTestExtensionsEnabled(path.join(process.cwd(), 'out/extensions'), extensionId)

  // 4. Run tests (use installed path so sandboxed Bike can access it)
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

  const { status, output } = await runBike(bikeBinary, args)

  // An extension that never loaded contributes no tests, and the run still
  // reports success — so treat a loader error as a failure even when every
  // test that DID run passed.
  reportExtensionManagerErrors(output)

  if (status !== 0) process.exit(status)
}

/** Runs Bike, streaming its output live while also capturing it for scanning. */
function runBike(binary, args) {
  return new Promise((resolve) => {
    const child = spawn(binary, args, { stdio: ['ignore', 'pipe', 'pipe'] })
    let output = ''

    for (const [stream, sink] of [
      [child.stdout, process.stdout],
      [child.stderr, process.stderr],
    ]) {
      stream.setEncoding('utf-8')
      stream.on('data', (chunk) => {
        output += chunk
        sink.write(chunk)
      })
    }

    child.on('error', (error) => {
      console.error(`\nFailed to launch Bike: ${error.message}`)
      resolve({ status: 1, output })
    })
    child.on('close', (code, signal) => {
      resolve({ status: signal ? 1 : code ?? 1, output })
    })
  })
}

/**
 * Fail on `[error] ExtensionManager:` lines in Bike's output.
 *
 * Scoped deliberately to that one logger. A passing run legitimately logs other
 * `[error]` lines — tests that exercise error paths produce `ScriptContext`
 * exceptions, blocked `fetch` calls, and the like — so failing on any error
 * would break a healthy suite. But the extension MANAGER erroring means an
 * extension didn't load, which silently subtracts its tests from the run while
 * the summary still says ALL TESTS PASSED. The most common cause is a manifest
 * `api_version` newer than the Bike being tested against.
 */
function reportExtensionManagerErrors(output) {
  const errors = output.split('\n').filter((line) => line.startsWith('[error] ExtensionManager:'))
  if (errors.length === 0) return

  console.error(`\nError: Bike's extension manager reported ${errors.length} error(s):\n`)
  for (const line of errors) console.error(`  ${line.replace('[error] ExtensionManager: ', '')}`)

  if (errors.some((line) => line.includes('Incompatible versions'))) {
    console.error(
      "\nAn extension's manifest `api_version` is newer than the Bike it was tested against."
    )
    console.error(
      'Rebuild Bike (its `bikeAPIVersion`) or lower the `api_version`, then re-run.'
    )
  }

  console.error(
    "\nAn extension that fails to load runs none of its tests, and Bike doesn't count that\n" +
      'as a failure — so the summary above may say ALL TESTS PASSED regardless.'
  )
  process.exit(1)
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

/**
 * Bike loads a disabled extension but never runs it, so its tests are skipped
 * SILENTLY: the run still ends in "ALL TESTS PASSED", just without them. That
 * reads as a green suite for a repo whose tests never executed, so fail loudly
 * instead.
 *
 * Only extensions that actually ship a `tests` directory count — a disabled
 * extension with no tests changes nothing about the run.
 */
function checkTestExtensionsEnabled(outdir, extensionId) {
  const withTests = (extensionId ? [extensionId] : listBuiltExtensionIds(outdir)).filter((id) =>
    fs.existsSync(path.join(outdir, `${id}.bkext`, 'tests'))
  )
  if (withTests.length === 0) return

  const disabled = readDisabledExtensionIds()
  if (disabled === null) {
    console.warn(
      "Warning: couldn't read Bike's disabled-extension list. If an extension under test is\n" +
        'disabled, its tests will be skipped and the run will still report success.\n'
    )
    return
  }

  const blocked = withTests.filter((id) => disabled.includes(id))
  if (blocked.length === 0) return

  console.error('Error: these extensions ship tests but are DISABLED in Bike:\n')
  for (const id of blocked) console.error(`  ${id}`)
  console.error(
    '\nBike skips a disabled extension without reporting it, so these tests would not run\n' +
      'and the summary would still say ALL TESTS PASSED. Enable them in Bike →\n' +
      'Settings → Extensions, then re-run. (They are listed in Bike\'s\n' +
      '"bike.extensions.disabledIds" preference.)'
  )
  process.exit(1)
}

function listBuiltExtensionIds(outdir) {
  try {
    return fs
      .readdirSync(outdir)
      .filter((entry) => entry.endsWith('.bkext'))
      .map((entry) => entry.slice(0, -'.bkext'.length))
  } catch {
    return []
  }
}

/**
 * The ids the user has disabled, or null when the preference can't be read.
 *
 * The app's key/value store writes arrays as JSON-encoded Data, so this reads
 * back as a base64 `<data>` blob rather than a plist `<array>`; both shapes are
 * handled in case that encoding changes. Read through `defaults` rather than
 * the container plist directly, so the value matches what the app will see.
 */
function readDisabledExtensionIds() {
  let xml
  try {
    xml = execFileSync('defaults', ['export', 'com.hogbaysoftware.Bike', '-'], {
      encoding: 'utf-8',
      timeout: 5000,
    })
  } catch {
    return null
  }

  const key = /<key>bike\.extensions\.disabledIds<\/key>\s*/

  const data = xml.match(new RegExp(key.source + '<data>([\\s\\S]*?)<\\/data>'))
  if (data) {
    try {
      const parsed = JSON.parse(Buffer.from(data[1].replace(/\s/g, ''), 'base64').toString('utf-8'))
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return null
    }
  }

  const array = xml.match(new RegExp(key.source + '<array>([\\s\\S]*?)<\\/array>'))
  if (array) {
    return [...array[1].matchAll(/<string>([^<]*)<\/string>/g)].map((match) => match[1])
  }

  // Key absent ⇒ the user has never disabled anything.
  return []
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
