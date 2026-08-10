// Extension settings runtime
// Manages settings items contributed by extensions.
// Items stack vertically in the order they are added.

declare global {
  interface Window {
    __bikeAddSettingsItem?: (label: string) => void
    __bikeRemoveSettingsItem?: (label: string) => void
    __bikeGetSettingsContainer?: (label: string) => HTMLElement | null
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

function getContainer(label: string): HTMLElement | null {
  return items.get(label) || null
}

function addItem(label: string) {
  if (items.has(label)) return
  const container = document.createElement('div')
  container.dataset.settingsLabel = label
  content.appendChild(container)
  items.set(label, container)
}

function removeItem(label: string) {
  const container = items.get(label)
  if (container) {
    container.remove()
    items.delete(label)
  }
}

window.__bikeAddSettingsItem = addItem
window.__bikeRemoveSettingsItem = removeItem
window.__bikeGetSettingsContainer = getContainer

export {}
