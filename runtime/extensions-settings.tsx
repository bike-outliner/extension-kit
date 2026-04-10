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
