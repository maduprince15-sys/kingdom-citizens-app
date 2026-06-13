'use client'

export function isNativeMobileApp() {
  if (typeof window === 'undefined') return false

  const capacitor = (window as Window & {
    Capacitor?: {
      isNativePlatform?: () => boolean
      getPlatform?: () => string
    }
  }).Capacitor

  return Boolean(capacitor?.isNativePlatform?.())
}

export function isAndroidNativeApp() {
  if (typeof window === 'undefined') return false

  const capacitor = (window as Window & {
    Capacitor?: {
      isNativePlatform?: () => boolean
      getPlatform?: () => string
    }
  }).Capacitor

  return Boolean(capacitor?.isNativePlatform?.() && capacitor.getPlatform?.() === 'android')
}
