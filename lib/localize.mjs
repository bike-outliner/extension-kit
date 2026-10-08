import fastGlob from 'fast-glob'
import ts from 'typescript'
import path from 'path'
import fs from 'fs'

/**
 * Writes `<extension>/locales/en.json`, the English text a translator works from,
 * and copies `locales/` into the built extension.
 *
 * The English comes from each literal `bike.localize('…')`, the titles Bike derives
 * from command ids passed to `addCommands`, and the names Bike derives for the
 * extension and its themes, plus the manifest description. Bike looks each one up
 * in `locales/<language>.json` at runtime.
 */
export function syncLocales(extensionDir, outExtensionDir) {
  const english = new Set(extensionStrings(extensionDir))
  const files = fastGlob.sync(path.join(extensionDir, '{app,dom,style}/**/*.{ts,tsx}'))
  for (const file of files) {
    for (const text of sourceStrings(file, extensionDir)) {
      english.add(text)
    }
  }

  const localesDir = path.join(extensionDir, 'locales')
  const enFile = path.join(localesDir, 'en.json')
  const sorted = Object.fromEntries([...english].sort().map(text => [text, text]))
  const contents = JSON.stringify(sorted, null, 2) + '\n'
  if (!fs.existsSync(enFile) || fs.readFileSync(enFile, 'utf8') !== contents) {
    fs.mkdirSync(localesDir, { recursive: true })
    fs.writeFileSync(enFile, contents)
  }
  fs.cpSync(localesDir, path.join(outExtensionDir, 'locales'), { recursive: true })
}

/** Bike's palette title for a command id; matches `Commands.Command.displayName(forId:)`. */
export function commandTitle(id) {
  const colon = id.indexOf(':')
  const parts = colon < 0 ? [id] : [id.slice(0, colon), id.slice(colon + 1)]
  return parts
    .map(part => {
      const words = part.split('-')
      return words
        .map((word, index) => {
          const lower = word.toLowerCase()
          if (SPELLINGS[lower]) return SPELLINGS[lower]
          if (index > 0 && index < words.length - 1 && MINOR_WORDS.has(lower)) return lower
          return lower.charAt(0).toUpperCase() + lower.slice(1)
        })
        .join(' ')
    })
    .join(': ')
}

const SPELLINGS = { html: 'HTML', opml: 'OPML', json: 'JSON', url: 'URL', todo: 'To-Do' }
const MINOR_WORDS = new Set(['and', 'as', 'at', 'by', 'in', 'of', 'or', 'to', 'with'])

function extensionStrings(extensionDir) {
  const ids = [path.basename(extensionDir, '.bkext')]
  ids.push(...fastGlob.sync(path.join(extensionDir, 'theme/*.bktheme')).map(file => path.basename(file, '.bktheme')))
  const strings = ids.map(id => id.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '))
  const manifest = JSON.parse(fs.readFileSync(path.join(extensionDir, 'manifest.json'), 'utf8'))
  if (manifest.description) strings.push(manifest.description)
  return strings
}

function sourceStrings(file, extensionDir) {
  const source = ts.createSourceFile(
    file,
    fs.readFileSync(file, 'utf8'),
    ts.ScriptTarget.Latest,
    true,
    file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
  )
  const strings = []
  const visit = node => {
    if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)) {
      const callee = node.expression
      const [first] = node.arguments
      if (callee.name.text === 'localize' && callee.expression.getText(source) === 'bike') {
        if (first && ts.isStringLiteralLike(first)) {
          strings.push(first.text)
        } else {
          const { line } = source.getLineAndCharacterOfPosition(node.getStart(source))
          const where = `${path.relative(extensionDir, file)}:${line + 1}`
          console.warn(`\x1b[33mWarning: ${where} bike.localize needs a string literal to be translated\x1b[0m`)
        }
      } else if (callee.name.text === 'addCommands' && first && ts.isObjectLiteralExpression(first)) {
        strings.push(...commandIds(first, source, extensionDir).filter(id => !id.includes(':.')).map(commandTitle))
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(source)
  return strings
}

function commandIds(params, source, extensionDir) {
  const commands = params.properties.find(
    p => ts.isPropertyAssignment(p) && p.name.getText() === 'commands' && ts.isObjectLiteralExpression(p.initializer)
  )
  if (!commands) return []
  const ids = []
  for (const p of commands.initializer.properties) {
    if (p.name && ts.isStringLiteralLike(p.name)) {
      if (p.name.text.includes(':')) ids.push(p.name.text)
    } else {
      const { line } = source.getLineAndCharacterOfPosition(p.getStart(source))
      const where = `${path.relative(extensionDir, source.fileName)}:${line + 1}`
      console.warn(`\x1b[33mWarning: ${where} write command ids as string literals so their titles can be translated\x1b[0m`)
    }
  }
  return ids
}
