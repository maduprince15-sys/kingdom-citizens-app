import { isolatedConfigurationReady } from './lib/integration-safety.mjs'
if (!isolatedConfigurationReady(process.env)) {
  console.log('BLOCKED: isolated project, ordinary publishable key, opt-in and distinct synthetic A/B/C credentials required. See docs/ISOLATED_INTEGRATION_SETUP.md.')
  process.exitCode = 2
} else {
  console.log('PENDING: configuration shape accepted offline; no network calls, accounts, provider settings or policies verified.')
}
