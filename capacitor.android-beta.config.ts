import type { CapacitorConfig } from '@capacitor/cli'

/**
 * Separate Android debug beta. This opens the latest *Preview* of the
 * Kingdom Citizens redesign and must never replace the production app.
 * The beta has an independent package ID and cannot read its private state.
 */
const config: CapacitorConfig = {
  appId: 'com.kingdomcitizens.app.beta',
  appName: 'Kingdom Citizens Beta',
  webDir: 'mobile-beta',
  server: {
    url: 'https://kingdom-citizens-app-git-fea-0dad2e-maduprince15-9793s-projects.vercel.app',
    cleartext: false,
  },
}

export default config
