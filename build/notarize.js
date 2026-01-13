/* eslint-disable @typescript-eslint/no-require-imports */
const { notarize } = require('@electron/notarize')

exports.default = async (context) => {
  if (context.electronPlatformName !== 'darwin') return

  // Skip notarization for PR/dev builds
  if (process.env.SKIP_NOTARIZE === 'true') {
    console.log('Skipping notarization (SKIP_NOTARIZE=true)')
    return
  }

  const appName = context.packager.appInfo.productFilename
  const appPath = `${context.appOutDir}/${appName}.app`

  await notarize({
    appPath,
    appleId: process.env.APPLE_ID,
    appleIdPassword: process.env.APPLE_APP_SPECIFIC_PASSWORD,
    teamId: process.env.APPLE_TEAM_ID
  })
}
