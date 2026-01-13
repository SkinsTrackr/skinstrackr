/* eslint-disable @typescript-eslint/no-require-imports */
// build/notarize.js
const { notarize } = require('@electron/notarize')

exports.default = async function notarizing(context) {
  const { electronPlatformName, appOutDir } = context

  if (electronPlatformName !== 'darwin') {
    console.log('Skipping notarization for non-macOS platform')
    return
  }

  // Allow disabling notarization via environment variable for testing
  if (process.env.SKIP_NOTARIZATION === 'true') {
    console.log('Skipping notarization due to SKIP_NOTARIZATION=true')
    return
  }

  const appName = context.packager.appInfo.productFilename
  console.log(`Starting notarization process for ${appName}`)

  // Prefer App Store Connect API key env vars if set
  const { APPLE_ID, APPLE_APP_SPECIFIC_PASSWORD, APPLE_TEAM_ID } = process.env

  const common = {
    appBundleId: 'com.skinstrackr.app',
    appPath: `${appOutDir}/${appName}.app`
  }

  console.log(`App path: ${common.appPath}`)
  console.log(`Bundle ID: ${common.appBundleId}`)

  if (APPLE_ID && APPLE_APP_SPECIFIC_PASSWORD && APPLE_TEAM_ID) {
    console.log('Using Apple ID credentials for notarization')
    console.log(`Apple ID: ${APPLE_ID}`)
    console.log(`Team ID: ${APPLE_TEAM_ID}`)

    try {
      console.log('Submitting app for notarization...')
      const result = await notarize({
        ...common,
        appleId: APPLE_ID,
        appleIdPassword: APPLE_APP_SPECIFIC_PASSWORD,
        teamId: APPLE_TEAM_ID
      })
      console.log('Notarization completed successfully:', result)
    } catch (error) {
      console.error('Notarization failed:', error)
      // Don't throw the error - let the build continue without notarization
      console.warn('Continuing build without notarization due to error')
      return
    }
    return
  }

  console.error('Missing notarization credentials')
  console.log('Required environment variables:')
  console.log('- APPLE_ID:', APPLE_ID ? 'set' : 'missing')
  console.log('- APPLE_APP_SPECIFIC_PASSWORD:', APPLE_APP_SPECIFIC_PASSWORD ? 'set' : 'missing')
  console.log('- APPLE_TEAM_ID:', APPLE_TEAM_ID ? 'set' : 'missing')

  console.warn('Continuing build without notarization due to missing credentials')
  // Don't throw error - let build continue
}
