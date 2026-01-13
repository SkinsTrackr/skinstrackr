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

  const hasAppleId = Boolean(process.env.APPLE_ID)
  const hasAppPassword = Boolean(process.env.APPLE_APP_SPECIFIC_PASSWORD)
  const hasTeamId = Boolean(process.env.APPLE_TEAM_ID)
  console.log(
    `Notarization inputs present: APPLE_ID=${hasAppleId} APPLE_APP_SPECIFIC_PASSWORD=${hasAppPassword} APPLE_TEAM_ID=${hasTeamId}`
  )
  console.log(`Notarizing app at: ${appPath}`)

  console.log('Submitting notarization request...')
  await notarize({
    appPath,
    appleId: process.env.APPLE_ID,
    appleIdPassword: process.env.APPLE_APP_SPECIFIC_PASSWORD,
    teamId: process.env.APPLE_TEAM_ID
  })

  console.log('Notarization completed.')
}
