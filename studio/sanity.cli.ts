import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: '43dsdcuf',
    dataset: 'production'
  },
  deployment: {
    appId: 'wgwsidnunak25c08zx4nsa1f',
    /**
     * Enable auto-updates for studios.
     * Learn more at https://www.sanity.io/docs/studio/latest-version-of-sanity#k47faf43faf56
     */
    autoUpdates: true,
  },
})
