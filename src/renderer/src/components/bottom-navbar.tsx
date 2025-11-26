import { JSX, useCallback, useState } from 'react'
import { Button } from './ui/button'
import { Separator } from './ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import { Input } from './ui/input'
import { Field, FieldGroup, FieldLabel } from './ui/field'
import { RefreshCw, User, Package, DollarSign, ChevronDown, Check, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useInventory } from '@/contexts/InventoryContext'
import { useSession } from '@/contexts/SessionContext'
import { useClientStore } from '@/contexts/ClientStoreContext'
import { SteamLoginRequest } from '@shared/interfaces/session.types'

export default function BottomNavbar(): JSX.Element {
  const { totalItems, totalValue, loadInventory, isLoading, lastRefresh } = useInventory()
  const { isLoggedInSteam, isLoggedInCache, activeSteamId, loginSteam, loginCache } = useSession()
  const { accounts } = useClientStore()
  const [popoverOpen, setPopoverOpen] = useState(false)
  const [token, setToken] = useState('')

  const currentAccount = activeSteamId ? accounts[activeSteamId] : undefined

  const handleRefresh = useCallback(async (): Promise<void> => {
    await loadInventory(true)
  }, [loadInventory])

  const handleAccountSwitch = async (steamId: string): Promise<void> => {
    // TODO: Implement account switching logic
    console.log('Switch to account:', steamId)
    setPopoverOpen(false)
    await loginCache(steamId)
  }

  const handleLogin = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()

    try {
      const tokenDetails = JSON.parse(token) as SteamLoginRequest
      await loginSteam(tokenDetails)
      setPopoverOpen(false)
      setToken('')
    } catch (err) {
      console.error('Login error:', err)
    }
  }

  return (
    <div className="border-t bg-background">
      <div className="flex h-11 items-center justify-between gap-4 px-6">
        {/* Left section - Spacer */}
        <div />

        {/* Right section - All controls */}
        <div className="flex items-center gap-3">
          {/* Stats card - Connection and items */}
          <div className="flex items-center gap-2.5 rounded-lg bg-muted/20 px-3 py-1.5 pointer-events-none select-none">
            <div className="flex items-center gap-2">
              {/* Value card */}
              <div className="flex items-center gap-0.5 text-sm text-muted-foreground">
                <DollarSign className="h-3.5 w-3.5" />
                <span className="font-medium tabular-nums">{new Intl.NumberFormat('us-en').format(totalValue)}</span>
              </div>
              <span className="text-sm">•</span>
              <div className="flex items-center gap-0.5 text-sm text-muted-foreground">
                <Package className="h-3.5 w-3.5" />
                <span className="font-medium tabular-nums">{new Intl.NumberFormat('us-en').format(totalItems)}</span>
              </div>
            </div>
          </div>

          {/* Refresh button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleRefresh()}
            disabled={isLoading || !isLoggedInSteam}
            className="h-9 gap-2 px-4 cursor-pointer hover:bg-accent shadow-sm hover:shadow-md transition-all"
          >
            <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
            <div className="flex items-center gap-1.5">
              <span>Refresh</span>
              <span className="text-muted-foreground">•</span>
              <span className="text-xs text-muted-foreground tabular-nums">{lastRefresh}</span>
            </div>
          </Button>

          {/* User account dropdown */}
          <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
            <PopoverTrigger asChild>
              <button className="flex items-center gap-2.5 rounded-lg border bg-card px-4 shadow-sm hover:shadow-md hover:bg-accent transition-all cursor-pointer h-9">
                <div className="flex items-center gap-1.5">
                  <div
                    className={cn(
                      'h-2 w-2 rounded-full ring-2 ring-background',
                      isLoggedInSteam && 'bg-green-500',
                      isLoggedInCache && 'bg-yellow-500',
                      !isLoggedInSteam && !isLoggedInCache && 'bg-red-500'
                    )}
                  />
                  <span
                    className={cn(
                      'text-xs font-medium leading-none',
                      isLoggedInSteam && 'text-green-600 dark:text-green-400',
                      isLoggedInCache && 'text-yellow-600 dark:text-yellow-400',
                      !isLoggedInSteam && !isLoggedInCache && 'text-red-600 dark:text-red-400'
                    )}
                  >
                    {isLoggedInSteam ? 'Connected' : isLoggedInCache ? 'Cache' : 'Disconnected'}
                  </span>
                </div>
                <Separator orientation="vertical" className="h-5" />
                <Avatar className="h-7 w-7">
                  <AvatarImage src={currentAccount?.avatarUrl} alt={currentAccount?.username} />
                  <AvatarFallback className="bg-muted">
                    <User className="h-4 w-4 text-muted-foreground" />
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium leading-none">
                  {currentAccount?.username || activeSteamId || 'Not logged in'}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-64 p-3">
              <div className="space-y-2">
                {/* Login Form */}
                <div className="space-y-1.5">
                  <div className="px-0.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                    Login to Steam
                  </div>
                  <form onSubmit={handleLogin}>
                    <FieldGroup className="gap-2">
                      <Field>
                        <FieldLabel htmlFor="token" className="text-xs">
                          Steam web token
                        </FieldLabel>
                        <div className="flex w-full items-center gap-1">
                          <Input
                            id="token"
                            placeholder='{"logged_in":true, "steamid": ...}'
                            required
                            value={token}
                            onChange={(e) => setToken(e.target.value)}
                            className="h-8 text-xs"
                          />
                          <Button variant="outline" size="icon" className="h-8 w-8" asChild>
                            <a href="https://steamcommunity.com/chat/clientjstoken" target="_blank" rel="noreferrer">
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </Button>
                        </div>
                      </Field>
                      <Field>
                        <Button type="submit" size="sm" className="w-full h-7 text-xs">
                          Login
                        </Button>
                      </Field>
                    </FieldGroup>
                  </form>
                </div>

                {/* Saved Accounts */}
                {Object.entries(accounts).length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-0.5">
                      <div className="px-0.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                        Cached Accounts
                      </div>
                      {Object.entries(accounts).map(([steamId, account]) => (
                        <button
                          key={steamId}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleAccountSwitch(steamId)
                          }}
                          className={cn(
                            'flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-sm hover:bg-accent transition-colors',
                            activeSteamId === steamId && 'bg-accent'
                          )}
                        >
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={account.avatarUrl} alt={account.username} />
                            <AvatarFallback className="bg-muted text-xs">
                              <User className="h-3 w-3" />
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 text-left">
                            <div className="font-medium leading-none">{account.username || steamId}</div>
                            {account.username && <div className="text-xs text-muted-foreground mt-1">{steamId}</div>}
                          </div>
                          {activeSteamId === steamId && <Check className="h-4 w-4 text-primary" />}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  )
}
