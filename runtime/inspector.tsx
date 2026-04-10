// Tab container management using imperative DOM operations.
// Must be synchronous so __bikeGetTabContainer finds the div
// immediately after __bikeAddTab is called from Swift.
//
// All panels stay in the DOM. Inactive panels are hidden with
// display:none so React components remain mounted. Extensions
// can use IntersectionObserver to detect visibility changes.

declare global {
  interface Window {
    BikeInspector: any
    __bikeAddTab?: (tabId: string) => void
    __bikeRemoveTab?: (tabId: string) => void
    __bikeGetTabContainer?: (tabId: string) => HTMLElement | null
    __bikeApplyConfig?: (configJSON: string) => void
  }
}

// --- Tab bar CSS ---
const style = document.createElement('style')
style.textContent = `
:root {
  --toolbar-height: 33px;
}

body {
  margin: 0px 8px;
  -webkit-user-select: none;
  user-select: none;
}

#tab-bar {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  height: var(--toolbar-height);
}

#tab-bar.hidden {
  display: none;
}

#tab-bar button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 22px;
  padding: 0;
  border: none;
  border-radius: 8px;
  background: none;
  cursor: pointer;
}

#tab-bar button .icon {
  display: inline-block;
  width: 16px;
  height: 16px;
  background-color: var(--secondary-label);
  -webkit-mask-size: contain;
  mask-size: contain;
  -webkit-mask-repeat: no-repeat;
  mask-repeat: no-repeat;
  -webkit-mask-position: center;
  mask-position: center;
}

#tab-bar button.active {
  background: var(--selected-content-background);
}

#tab-bar button.active .icon {
  background-color: var(--selected-content-text);
}

.bike-disclosure__header {
  height: var(--toolbar-height);
  padding: 0;
  box-sizing: border-box;
}

.bike-disclosure__content {
  //padding-bottom: 1lh;
}
`
document.head.appendChild(style)

// --- Tab bar DOM ---
const tabBar = document.createElement('div')
tabBar.id = 'tab-bar'
tabBar.classList.add('hidden')
document.body.prepend(tabBar)

// --- State ---
const tabPanels = new Map<string, HTMLDivElement>()
const tabMeta = new Map<string, { tooltip: string; symbol: string }>()
const tabOrder: string[] = []
let activeTabId = ''

function renderTabBar() {
  tabBar.innerHTML = ''

  if (tabOrder.length === 1) {
    tabBar.classList.add('hidden')
    return
  }

  tabBar.classList.remove('hidden')

  for (const tabId of tabOrder) {
    const btn = document.createElement('button')
    const icon = document.createElement('span')
    icon.className = 'icon'
    const meta = tabMeta.get(tabId)
    const symbolName = meta?.symbol || tabId
    const url = bike.symbolURL(symbolName, { scale: 'large' })
    icon.style.maskImage = `url(${url})`
    icon.style.webkitMaskImage = `url(${url})`
    btn.appendChild(icon)

    if (meta?.tooltip) {
      btn.title = meta.tooltip
    }

    if (tabId === activeTabId) {
      btn.classList.add('active')
    }

    btn.addEventListener('click', () => {
      setActiveTab(tabId)
    })

    tabBar.appendChild(btn)
  }
}

function setActiveTab(tabId: string) {
  if (tabId === activeTabId) return

  // Hide previous active panel
  if (activeTabId) {
    const prev = tabPanels.get(activeTabId)
    if (prev) {
      prev.style.display = 'none'
    }
  }

  activeTabId = tabId

  // Show new active panel
  const next = tabPanels.get(tabId)
  if (next) {
    next.style.display = ''
  }

  renderTabBar()
}

function getTabContainer(tabId: string): HTMLElement | null {
  return tabPanels.get(tabId) || null
}

function addTab(tabId: string) {
  if (tabPanels.has(tabId)) return
  const panel = document.createElement('div')
  panel.id = 'tab-panel-' + tabId
  panel.style.display = 'none'
  document.body.appendChild(panel)
  tabPanels.set(tabId, panel)
  if (!tabMeta.has(tabId)) {
    tabMeta.set(tabId, { tooltip: '', symbol: '' })
  }
  if (!tabOrder.includes(tabId)) {
    tabOrder.push(tabId)
  }
  // Auto-activate first tab
  if (tabPanels.size === 1) {
    setActiveTab(tabId)
  }
  renderTabBar()
}

function removeTab(tabId: string) {
  const panel = tabPanels.get(tabId)
  if (panel) {
    panel.remove()
    tabPanels.delete(tabId)
  }
  tabMeta.delete(tabId)
  const idx = tabOrder.indexOf(tabId)
  if (idx >= 0) tabOrder.splice(idx, 1)

  if (activeTabId === tabId) {
    activeTabId = ''
    if (tabOrder.length > 0) {
      setActiveTab(tabOrder[0])
    }
  }
  renderTabBar()
}

// --- Apply full config from Swift ---

interface ConfigItem { label: string; hidden: boolean; tab: string }
interface ConfigTab { tab: string }
interface Config { items: ConfigItem[]; tabs: ConfigTab[] }

function applyConfig(configJSON: string) {
  const config: Config = JSON.parse(configJSON)

  // Ensure all config tabs have panels
  for (const t of config.tabs) {
    addTab(t.tab)
  }

  // Reorder tabOrder to match config
  const configOrder = config.tabs.map(t => t.tab)
  tabOrder.sort((a, b) => {
    const ai = configOrder.indexOf(a)
    const bi = configOrder.indexOf(b)
    return (ai === -1 ? Infinity : ai) - (bi === -1 ? Infinity : bi)
  })

  // Update tab metadata (symbol = tab id, tooltip = joined item labels)
  for (const t of config.tabs) {
    const tooltip = config.items
      .filter(i => i.tab === t.tab)
      .map(i => i.label)
      .join(', ')
    const meta = tabMeta.get(t.tab)
    if (meta) {
      meta.symbol = t.tab
      meta.tooltip = tooltip
    }
  }

  // Ensure active tab is valid
  if (!activeTabId || !tabOrder.includes(activeTabId)) {
    if (tabOrder.length > 0) {
      setActiveTab(tabOrder[0])
    }
  }

  // Move items to their assigned tabs
  for (const item of config.items) {
    const targetPanel = tabPanels.get(item.tab)
    if (!targetPanel) continue
    const el = document.querySelector(
      `[data-inspector-label="${CSS.escape(item.label)}"]`
    ) as HTMLElement | null
    if (!el || el.parentElement === targetPanel) continue
    targetPanel.appendChild(el)
  }

  // Reorder items within each tab
  for (const t of config.tabs) {
    const panel = tabPanels.get(t.tab)
    if (!panel) continue
    const labels = config.items.filter(i => i.tab === t.tab).map(i => i.label)
    for (const label of labels) {
      const el = panel.querySelector(
        `[data-inspector-label="${CSS.escape(label)}"]`
      ) as HTMLElement | null
      if (el) panel.appendChild(el)
    }
  }

  // Remove tabs not in config
  const configTabSet = new Set(config.tabs.map(t => t.tab))
  for (const tabId of [...tabOrder]) {
    if (!configTabSet.has(tabId)) {
      removeTab(tabId)
    }
  }

  // Show/hide items
  for (const item of config.items) {
    const els = document.querySelectorAll(
      `[data-inspector-label="${CSS.escape(item.label)}"]`
    )
    for (const el of els) {
      ;(el as HTMLElement).style.display = item.hidden ? 'none' : ''
    }
  }

  renderTabBar()
}

window.__bikeAddTab = addTab
window.__bikeRemoveTab = removeTab
window.__bikeGetTabContainer = getTabContainer
window.__bikeApplyConfig = applyConfig

window.BikeInspector = {}

export {}
