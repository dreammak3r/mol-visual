import { getRDKitModule, isRDKitReady } from './rdkit.js'

let preloadStarted = false

export function preloadRDKit() {
  if (preloadStarted || isRDKitReady()) return
  preloadStarted = true

  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      getRDKitModule().catch(() => {})
    }, { timeout: 3000 })
  } else {
    setTimeout(() => {
      getRDKitModule().catch(() => {})
    }, 1000)
  }
}

export function waitForRDKit() {
  return getRDKitModule()
}