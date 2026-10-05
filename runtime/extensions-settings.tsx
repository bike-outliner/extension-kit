// Extension settings runtime
// Manages settings items contributed by extensions.
// Items are keyed by id and stack vertically in alphabetical order by label —
// NOT the order they are added, which is extension activation order and
// therefore depends on how the extensions folder happened to enumerate.

declare global {
  interface Window {
    __bikeAddSettingsItem?: (id: string, label: string) => void
    __bikeRemoveSettingsItem?: (id: string) => void
    __bikeGetSettingsContainer?: (id: string) => HTMLElement | null
  }
}

const style = document.createElement('style')
style.textContent = `
body {
  margin: 0;
  -webkit-user-select: none;
  user-select: none;
}

#settings-content {
  overflow-y: auto;
  padding: 12px 0;
}

/* Settings sections read as prose-with-controls rather than a dense inspector,
   so a Disclosure here indents its content to the label's leading edge (the
   triangle then reads as a hint in the margin) and leaves a blank line before
   the next extension's section. Scoped to this host: the same component in the
   inspector keeps its tight, flush-left layout. */
#settings-content .bike-disclosure {
  --bike-disclosure-content-indent: calc(var(--bike-disclosure-triangle-width, 0px) + 4px);
  --bike-disclosure-content-spacing-after: 1em;
}
`
document.head.appendChild(style)

// --- Layout ---
const content = document.createElement('div')
content.id = 'settings-content'
document.body.appendChild(content)

// --- State ---
const items = new Map<string, HTMLDivElement>()

function getContainer(id: string): HTMLElement | null {
  return items.get(id) || null
}

function addItem(id: string, label: string) {
  if (items.has(id)) return
  const container = document.createElement('div')
  container.dataset.settingsId = id
  container.dataset.settingsLabel = label
  // Insert before the first section whose label sorts after this one, so the
  // pane reads the same however the extensions loaded. `localeCompare` rather
  // than `<` so "Ähnlich" files with the A's and casing doesn't split the list.
  const next = Array.from(content.children).find((el) => {
    const other = (el as HTMLElement).dataset.settingsLabel
    return other != null && other.localeCompare(label) > 0
  })
  content.insertBefore(container, next ?? null)
  items.set(id, container)
}

function removeItem(id: string) {
  const container = items.get(id)
  if (container) {
    container.remove()
    items.delete(id)
  }
}

window.__bikeAddSettingsItem = addItem
window.__bikeRemoveSettingsItem = removeItem
window.__bikeGetSettingsContainer = getContainer

export {}
