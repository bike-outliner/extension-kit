import { execSync } from 'child_process'
import { join } from 'path'
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'fs'
import { tmpdir } from 'os'
import { verifyGhCli, buildRegistryEntry } from './release.mjs'

const REGISTRY_REPO = 'bike-outliner/extensions-registry'

export function submitExtension(id) {
  if (!id) {
    console.error('Usage: bike-ext submit <extension-id>')
    console.error('')
    console.error('Examples:')
    console.error('  bike-ext submit calendar')
    console.error('  bike-ext submit d3')
    console.error('')
    console.error('Creates a pull request on the bike-extensions registry to add or')
    console.error('update your extension. Run `bike-ext release` first to create the')
    console.error('GitHub Release with the download asset.')
    console.error('')
    console.error('Requires: gh CLI (https://cli.github.com) authenticated')
    process.exit(1)
  }

  verifyGhCli()

  const { entry } = buildRegistryEntry(id)

  // Verify the download URL is real (not a placeholder)
  if (entry.download_url === '<download_url>') {
    console.error('Error: could not determine download URL.')
    console.error('Run `bike-ext release ' + id + '` first to create a GitHub Release.')
    process.exit(1)
  }

  console.log(`Submitting ${id} v${entry.version} to the extensions registry...`)
  console.log('')

  // Fork the registry repo (idempotent — no-op if already forked)
  try {
    execSync(`gh repo fork ${REGISTRY_REPO} --clone=false`, {
      stdio: ['ignore', 'ignore', 'pipe'],
      encoding: 'utf8'
    })
  } catch (e) {
    // gh repo fork prints to stderr even on success; ignore errors about
    // the fork already existing
    const stderr = e.stderr || ''
    if (!stderr.includes('already exists')) {
      console.error('Error: failed to fork the registry repository.')
      console.error(stderr)
      process.exit(1)
    }
  }

  // Get the user's GitHub username to identify their fork
  let username
  try {
    username = execSync('gh api user -q .login', { encoding: 'utf8' }).trim()
  } catch {
    console.error('Error: could not determine your GitHub username.')
    process.exit(1)
  }

  // Clone the fork to a temp directory
  const tmpDir = mkdtempSync(join(tmpdir(), 'bike-ext-submit-'))

  try {
    console.log('Syncing registry fork...')
    execSync(`gh repo sync ${username}/extensions-registry`, { stdio: 'ignore' })

    console.log('Cloning registry fork...')
    execSync(`gh repo clone ${username}/extensions-registry "${tmpDir}" -- --depth 1`, {
      stdio: 'ignore'
    })

    // Read current extensions.json
    const extensionsPath = join(tmpDir, 'extensions.json')
    const extensions = JSON.parse(readFileSync(extensionsPath, 'utf8'))

    // Add or update the entry for this extension
    const existingIndex = extensions.findIndex(e => e.id === id)
    const isUpdate = existingIndex >= 0
    if (isUpdate) {
      extensions[existingIndex] = entry
      console.log(`Updating existing entry for "${id}"`)
    } else {
      extensions.push(entry)
      console.log(`Adding new entry for "${id}"`)
    }

    // Write updated extensions.json
    writeFileSync(extensionsPath, JSON.stringify(extensions, null, 2) + '\n')

    // Create branch, commit, and push (idempotent — force-creates branch and force-pushes)
    const branch = `submit-${id}-v${entry.version}`
    const commitMsg = isUpdate
      ? `Update ${id} to v${entry.version}`
      : `Add ${id} v${entry.version}`

    execSync(`git checkout -B "${branch}"`, { cwd: tmpDir, stdio: 'ignore' })
    execSync('git add extensions.json', { cwd: tmpDir, stdio: 'ignore' })
    execSync(`git commit -m "${commitMsg}"`, { cwd: tmpDir, stdio: 'ignore' })
    execSync(`git push --force -u origin "${branch}"`, { cwd: tmpDir, stdio: 'ignore' })

    // Create or update PR against the upstream repo
    const prTitle = commitMsg
    const prBody = `${commitMsg}\n\n\`\`\`json\n${JSON.stringify(entry, null, 2)}\n\`\`\`\n\nCreated with \`bike-ext submit\`.`
    const bodyFile = join(tmpDir, '.pr-body.md')
    writeFileSync(bodyFile, prBody)

    // Create PR, or update if one already exists for this branch
    let prUrl
    try {
      prUrl = execSync(
        `gh pr create --repo ${REGISTRY_REPO} --head "${username}:${branch}" --title "${prTitle}" --body-file "${bodyFile}"`,
        { cwd: tmpDir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }
      ).trim()
      console.log('')
      console.log(`Pull request created: ${prUrl}`)
    } catch (e) {
      const stderr = (e.stderr || '').toString()
      if (stderr.includes('already exists')) {
        // PR exists — the force-push already updated the code, just log it
        // Find the existing PR URL
        try {
          prUrl = execSync(
            `gh pr list --repo ${REGISTRY_REPO} --head "${username}:${branch}" --json url -q ".[0].url"`,
            { cwd: tmpDir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }
          ).trim()
        } catch {
          prUrl = '(could not retrieve URL)'
        }
        console.log('')
        console.log(`Pull request updated (force-pushed): ${prUrl}`)
      } else {
        throw e
      }
    }
  } finally {
    // Clean up temp directory
    rmSync(tmpDir, { recursive: true, force: true })
  }
}
