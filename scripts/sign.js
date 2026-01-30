/* eslint-disable @typescript-eslint/no-require-imports */
const { execSync } = require('child_process')

module.exports = async function (configuration) {
  const path = configuration.path
  const { PKCS11_MODULE_PATH, CERT_PATH, CERT_KEY, CERT_TOKEN_PIN, CERT_TIME_SERVER } = process.env

  if (!path) {
    throw new Error('electron-builder did not provide a path to sign.js')
  }

  if (!PKCS11_MODULE_PATH || !CERT_PATH || !CERT_KEY || !CERT_TOKEN_PIN || !CERT_TIME_SERVER) {
    throw new Error('Missing signing secrets. CI misconfigured.')
  }

  execSync(
    `
    sudo osslsigncode sign \
      -pkcs11module "${PKCS11_MODULE_PATH}" \
      -certs "${CERT_PATH}" \
      -key "${CERT_KEY}" \
      -pass "${CERT_TOKEN_PIN}" \
      -h sha256 \
      -n "SkinsTrackr" \
      -i "https://github.com/SkinsTrackr/skinstrackr" \
      -t "${CERT_TIME_SERVER}" \
      -in "${path}" \
      -out "${path}"
    `,
    { stdio: 'inherit' }
  )
}
