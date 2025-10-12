import { ChartNoAxesCombined, ExternalLink } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'

export function LoginForm({ className, ...props }: React.ComponentProps<'div'>) {
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
          <form>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="token">Steam web token</FieldLabel>
                <div className="flex w-full max-w-sm items-center gap-1">
                  <Input id="token" placeholder='{"logged_in":true, "steamid": ...}' required />
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
