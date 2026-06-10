import { JSX, useCallback, useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Button } from './ui/button'
import { Spinner } from './ui/spinner'
import { useSession } from '@/contexts/SessionContext'
import { QrLoginEvent } from '@shared/interfaces/session.types'
import { QrLoginEventType, UserSessionType } from '@shared/enums/session-type'
import log from 'electron-log/renderer'

type QrStatus = 'loading' | 'waiting' | 'scanned' | 'error'

export default function QrLogin({ onSuccess }: { onSuccess: () => void }): JSX.Element {
  const { startQrLogin, cancelQrLogin, userSession } = useSession()
  const [qrUrl, setQrUrl] = useState<string | null>(null)
  const [status, setStatus] = useState<QrStatus>('loading')
  const [errorMessage, setErrorMessage] = useState('')

  const isLoggedIn =
    userSession === UserSessionType.LOGGED_IN_ONLINE || userSession === UserSessionType.LOGGED_IN_OFFLINE

  const generate = useCallback(async (): Promise<void> => {
    if (isLoggedIn) return
    setStatus('loading')
    setQrUrl(null)
    try {
      const url = await startQrLogin()
      setQrUrl(url)
      setStatus('waiting')
    } catch {
      setStatus('error')
      setErrorMessage('Could not start QR login')
    }
  }, [startQrLogin, isLoggedIn])

  useEffect(() => {
    generate()
    return () => {
      cancelQrLogin()
    }
  }, [generate, cancelQrLogin])

  useEffect(() => {
    return window.api.onQrLoginEvent((value: QrLoginEvent) => {
      log.debug('Received QR login event: ', value)
      switch (value.eventType) {
        case QrLoginEventType.SCANNED:
          setStatus('scanned')
          break
        case QrLoginEventType.TIMEOUT:
          generate()
          break
        case QrLoginEventType.ERROR:
          setStatus('error')
          setErrorMessage(value.message || 'QR login failed')
          break
      }
    })
  }, [generate])

  useEffect(() => {
    if (
      (status === 'waiting' || status === 'scanned') &&
      (userSession === UserSessionType.LOGGED_IN_OFFLINE || userSession === UserSessionType.LOGGED_IN_ONLINE)
    ) {
      onSuccess()
    }
  }, [status, userSession, onSuccess])

  return (
    <div className="flex flex-col items-center gap-3 py-2">
      {status === 'error' ? (
        <div className="flex flex-col items-center gap-3 text-center">
          <p className="text-xs text-destructive">{errorMessage}</p>
          <Button size="sm" className="h-7 text-xs" onClick={generate}>
            Generate new code
          </Button>
        </div>
      ) : (
        <>
          <div className="rounded-md bg-white p-2.5">
            {qrUrl ? (
              <QRCodeSVG value={qrUrl} size={160} />
            ) : (
              <div className="flex h-40 w-40 items-center justify-center">
                <Spinner className="size-6 text-muted-foreground" />
              </div>
            )}
          </div>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground text-center">
            {status === 'scanned' && <Spinner className="size-3" />}
            {status === 'scanned'
              ? 'Approve the login in your Steam mobile app'
              : 'Scan with the Steam mobile app to log in'}
          </p>
        </>
      )}
    </div>
  )
}
