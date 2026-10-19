const STORAGE_KEY = 'shandon-device-key'
const VALID_KEY = process.env.SHANDON_ACTIVATION_KEY || ''

export function isDeviceActivated(): boolean {
  if (typeof window === 'undefined') return false
  const stored = localStorage.getItem(STORAGE_KEY)
  return stored === VALID_KEY
}

export function activateDevice(key: string): boolean {
  if (key === VALID_KEY) {
    localStorage.setItem(STORAGE_KEY, key)
    return true
  }
  return false
}

export function deactivateDevice(): void {
  localStorage.removeItem(STORAGE_KEY)
}

export function getActivationStatus(): { activated: boolean; key?: string } {
  if (typeof window === 'undefined') return { activated: false }
  const stored = localStorage.getItem(STORAGE_KEY)
  return { activated: stored === VALID_KEY, key: stored || undefined }
}
