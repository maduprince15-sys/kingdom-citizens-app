import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.kingdomcitizens.app',
  appName: 'Kingdom Citizens',
  webDir: 'out',
  server: {
    url: 'https://kingdom-citizens-app.vercel.app',
    cleartext: false,
  },
}

export default config
