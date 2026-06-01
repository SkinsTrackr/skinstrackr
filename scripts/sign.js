/* eslint-disable @typescript-eslint/no-require-imports */
const { execSync } = require('child_process')
const fs = require('fs')
const os = require('os')
const path = require('path')

module.exports = async function (configuration) {
  const inPath = configuration.path
  if (!inPath) {
    throw new Error('electron-builder did not provide a path to sign.js')
  }

  if (process.env.SKIP_WIN_SIGN === 'true') {
    console.log('SKIP_WIN_SIGN set — skipping Windows code signing')
    return
  }

  const { PKCS11_MODULE_PATH, CERT_PATH, CERT_KEY, CERT_TOKEN_PIN, CERT_TIME_SERVER } = process.env
  if (!PKCS11_MODULE_PATH || !CERT_PATH || !CERT_KEY || !CERT_TOKEN_PIN || !CERT_TIME_SERVER) {
    throw new Error('Missing signing secrets. CI misconfigured.')
  }

  const sudo = process.env.OSSLSIGNCODE_SUDO ?? 'sudo '
  const signedPath = inPath.replace(/\.exe$/i, '.signed.exe')
  const pinFile = path.join(os.tmpdir(), `pin-${process.pid}-${Date.now()}`)

  fs.writeFileSync(pinFile, CERT_TOKEN_PIN, { mode: 0o600 })
  try {
    execSync(
      `${sudo}osslsigncode sign \
        -pkcs11module "${PKCS11_MODULE_PATH}" \
        -certs "${CERT_PATH}" \
        -key "${CERT_KEY}" \
        -readpass "${pinFile}" \
        -h sha256 \
        -n "SkinsTrackr" \
        -i "https://github.com/SkinsTrackr/skinstrackr" \
        -t "${CERT_TIME_SERVER}" \
        -in "${inPath}" \
        -out "${signedPath}"`,
      { stdio: 'inherit' }
    )
  } finally {
    fs.rmSync(pinFile, { force: true })
  }

  fs.renameSync(signedPath, inPath)
}
