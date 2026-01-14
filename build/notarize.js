/* eslint-disable @typescript-eslint/no-require-imports */
// build/notarize.js
const { notarize } = require('@electron/notarize')

exports.default = async function notarizing(context) {
  const { electronPlatformName, appOutDir } = context

  if (electronPlatformName !== 'darwin') return
  if (process.env.SKIP_NOTARIZE === 'true') {
    console.log('Skipping notarization as per SKIP_NOTARIZE env var.')
    return
  }

  const appName = context.packager.appInfo.productFilename

  // Prefer App Store Connect API key env vars if set
  const { APPLE_ID, APPLE_APP_SPECIFIC_PASSWORD, APPLE_TEAM_ID } = process.env

  const common = {
    appBundleId: 'com.skinstrackr.app',
    appPath: `${appOutDir}/${appName}.app`
  }

  if (APPLE_ID && APPLE_APP_SPECIFIC_PASSWORD && APPLE_TEAM_ID) {
    return notarize({
      ...common,
      appleId: APPLE_ID,
      appleIdPassword: APPLE_APP_SPECIFIC_PASSWORD,
      teamId: APPLE_TEAM_ID
    })
  }

  throw new Error('Missing notarization credentials (API key or Apple ID flow).')
}
