import { ChartNoAxesCombined, ExternalLink } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { LoginRequest } from '@shared/interfaces/login.types'
import { useState } from 'react'

export function LoginForm({ className, ...props }: React.ComponentProps<'div'>) {
  const [token, setToken] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const tokenDetails = JSON.parse(token) as LoginRequest
      await window.api.loginSteam(tokenDetails)
    } catch (err) {
      console.error('Login error:', err)
    }
  }

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <div className="flex flex-col items-center gap-2 text-center">
        <a href="#" className="flex flex-col items-center gap-2 font-medium">
          <div className="flex size-8 items-center justify-center rounded-md">
            <ChartNoAxesCombined className="size-7" />
          </div>
        </a>
        <h1 className="text-xl font-bold">Welcome to SkinsTrackr</h1>
      </div>
      <div />
      <Card>
        <CardContent>
          <form onSubmit={handleLogin}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="token">Steam web token</FieldLabel>
                <div className="flex w-full max-w-sm items-center gap-1">
                  <Input
                    id="token"
                    placeholder='{"logged_in":true, "steamid": ...}'
                    required
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                  />
                  <Button variant="outline" asChild>
                    <a href="https://steamcommunity.com/chat/clientjstoken" target="_blank" rel="noreferrer">
                      <ExternalLink className="size-4" />
                    </a>
                  </Button>
                </div>
              </Field>
              <Field>
                <Button type="submit">Login</Button>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
