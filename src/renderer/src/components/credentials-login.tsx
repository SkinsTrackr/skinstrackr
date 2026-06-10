import { JSX, useEffect, useState } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Spinner } from './ui/spinner'
import { Field, FieldContent, FieldDescription, FieldGroup, FieldLabel, FieldSeparator } from './ui/field'
import { useSession } from '@/contexts/SessionContext'
import { CredentialsLoginEvent } from '@shared/interfaces/session.types'
import { CredentialsGuardType, CredentialsLoginEventType, UserSessionType } from '@shared/enums/session-type'
import { getCleanErrorMessage } from '@/lib/error-utils'
import log from 'electron-log/renderer'

type Phase = 'form' | 'authenticating' | 'guard_code' | 'confirmation' | 'error'

export default function CredentialsLogin({ onSuccess }: { onSuccess: () => void }): JSX.Element {
  const { startCredentialsLogin, submitCredentialsGuard, cancelCredentialsLogin, userSession } = useSession()
  const [phase, setPhase] = useState<Phase>('form')
  const [accountName, setAccountName] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [codeKind, setCodeKind] = useState<'email' | 'device'>('device')
  const [emailDomain, setEmailDomain] = useState<string | undefined>(undefined)
  const [mobileConfirmation, setMobileConfirmation] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    return () => {
      cancelCredentialsLogin()
    }
  }, [cancelCredentialsLogin])

  useEffect(() => {
    return window.api.onCredentialsLoginEvent((value: CredentialsLoginEvent) => {
      log.debug('Received credentials login event: ', value)
      switch (value.eventType) {
        case CredentialsLoginEventType.TIMEOUT:
          setErrorMessage('Login timed out. Please try again.')
          setPhase('error')
          break
        case CredentialsLoginEventType.ERROR:
          setErrorMessage(value.message || 'Login failed')
          setPhase('error')
          break
      }
    })
  }, [])

  useEffect(() => {
    if (
      (phase === 'authenticating' || phase === 'confirmation' || phase === 'guard_code') &&
      (userSession === UserSessionType.LOGGED_IN_OFFLINE || userSession === UserSessionType.LOGGED_IN_ONLINE)
    ) {
      onSuccess()
    }
  }, [phase, userSession, onSuccess])

  const handleSubmitCredentials = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    setSubmitting(true)
    setErrorMessage('')
    try {
      const { guard, detail, mobileConfirmation } = await startCredentialsLogin({ accountName, password })
      setMobileConfirmation(mobileConfirmation)
      switch (guard) {
        case CredentialsGuardType.NONE:
          setPhase('authenticating')
          break
        case CredentialsGuardType.DEVICE_CODE:
          setCodeKind('device')
          setPhase('guard_code')
          break
        case CredentialsGuardType.EMAIL_CODE:
          setCodeKind('email')
          setEmailDomain(detail)
          setPhase('guard_code')
          break
        case CredentialsGuardType.CONFIRMATION:
          setPhase('confirmation')
          break
      }
    } catch (err) {
      setErrorMessage(getCleanErrorMessage(err))
    } finally {
      setPassword('')
      setSubmitting(false)
    }
  }

  const handleSubmitGuard = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    setSubmitting(true)
    setErrorMessage('')
    try {
      await submitCredentialsGuard(code.trim())
      setPhase('authenticating')
    } catch (err) {
      setErrorMessage(getCleanErrorMessage(err))
    } finally {
      setCode('')
      setSubmitting(false)
    }
  }

  const reset = (): void => {
    setErrorMessage('')
    setCode('')
    setPassword('')
    setPhase('form')
  }

  if (phase === 'authenticating' || phase === 'confirmation') {
    return (
      <div className="flex flex-col items-center gap-2 py-3 text-center">
        <Spinner className="size-5 text-muted-foreground" />
        <p className="text-xs text-muted-foreground">
          {phase === 'confirmation' ? 'Approve the sign-in in your Steam mobile app' : 'Signing in…'}
        </p>
      </div>
    )
  }

  if (phase === 'error') {
    return (
      <div className="flex flex-col items-center gap-3 py-2 text-center">
        <p className="text-xs text-destructive">{errorMessage}</p>
        <Button size="sm" className="h-7 text-xs" onClick={reset}>
          Try again
        </Button>
      </div>
    )
  }

  if (phase === 'guard_code') {
    return (
      <form onSubmit={handleSubmitGuard}>
        <FieldGroup className="gap-2">
          {mobileConfirmation && (
            <>
              <div className="flex items-center gap-2 rounded-md bg-muted/50 px-2.5 py-2">
                <Spinner className="size-3.5 shrink-0 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">
                  Approve the sign-in in your Steam mobile app — or enter a code below.
                </p>
              </div>
              <FieldSeparator>or</FieldSeparator>
            </>
          )}
          <Field>
            <FieldContent>
              <FieldLabel htmlFor="cred-code">Steam Guard</FieldLabel>
              <FieldDescription>
                {codeKind === 'device'
                  ? 'Enter the code from your Steam Guard mobile authenticator.'
                  : `Enter the code sent to your${emailDomain ? ` ${emailDomain}` : ''} email.`}
              </FieldDescription>
            </FieldContent>
            <Input
              id="cred-code"
              placeholder="Code"
              required
              autoFocus
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="h-8 text-xs"
            />
          </Field>
          {errorMessage && <p className="text-xs text-destructive">{errorMessage}</p>}
          <Field>
            <Button type="submit" size="sm" className="w-full h-7 text-xs" disabled={submitting}>
              {submitting ? <Spinner className="size-3" /> : 'Submit code'}
            </Button>
          </Field>
        </FieldGroup>
      </form>
    )
  }

  return (
    <form onSubmit={handleSubmitCredentials}>
      <FieldGroup className="gap-2">
        <Field>
          <FieldContent>
            <FieldLabel htmlFor="cred-account">Login with username & password</FieldLabel>
            <FieldDescription>Your password is only sent to Steam and never stored.</FieldDescription>
          </FieldContent>
          <div className="flex w-full flex-col gap-1.5 py-1">
            <Input
              id="cred-account"
              placeholder="Account name"
              required
              autoComplete="off"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              className="h-8 text-xs"
            />
            <Input
              id="cred-password"
              type="password"
              placeholder="Password"
              required
              autoComplete="off"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-8 text-xs"
            />
          </div>
        </Field>
        {errorMessage && <p className="text-xs text-destructive">{errorMessage}</p>}
        <Field>
          <Button type="submit" size="sm" className="w-full h-7 text-xs" disabled={submitting}>
            {submitting ? <Spinner className="size-3" /> : 'Login'}
          </Button>
        </Field>
      </FieldGroup>
    </form>
  )
}
