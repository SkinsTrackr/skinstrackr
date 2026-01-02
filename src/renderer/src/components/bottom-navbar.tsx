import { JSX, useState } from 'react'
import { Button } from './ui/button'
import { Separator } from './ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import { Input } from './ui/input'
import { Field, FieldContent, FieldDescription, FieldGroup, FieldLabel } from './ui/field'
import { User, DollarSign, ChevronDown, ExternalLink, Gem, RotateCw, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useInventory } from '@/contexts/InventoryContext'
import { useSession } from '@/contexts/SessionContext'
import { useClientStore } from '@/contexts/ClientStoreContext'
import { SteamLoginRequest } from '@shared/interfaces/session.types'
import { UserSessionType } from '@shared/enums/session-type'
import { IconWrapper } from '@/styles/icon-wrapper'
import { showToast } from './toast'

export default function BottomNavbar(): JSX.Element {
  const { totalItems, totalValue, loadInventory, isLoading } = useInventory()
  const { activeSteamId, loginSteam, loginCache, userSession } = useSession()
  const { accounts } = useClientStore()
  const [popoverOpen, setPopoverOpen] = useState(false)
  const [token, setToken] = useState('')

  const currentAccount = activeSteamId ? accounts[activeSteamId] : undefined

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
    } catch (err) {
      console.error('Login error:', err)
    } finally {
      setToken('')
    }
  }

  const handleForceReload = async (e: React.MouseEvent): Promise<void> => {
    e.stopPropagation()
    if (!isLoading && userSession === UserSessionType.LOGGED_IN_ONLINE) {
      await loadInventory(false, false)
    } else {
      showToast('Cannot force reload. Inventory is currently loading or user is not online', 'error')
    }
  }

  const handleLogout = async (e: React.MouseEvent): Promise<void> => {
    e.stopPropagation()

    if (
      !isLoading &&
      (userSession === UserSessionType.LOGGED_IN_ONLINE || userSession === UserSessionType.LOGGED_IN_OFFLINE)
    ) {
      // Logging into cache automatically logs out from Steam
      await loginCache(activeSteamId!)
    } else {
      showToast('Cannot logout. Inventory is currently loading or user is not online', 'error')
    }
  }

  return (
    <div className="border-t border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-12 items-center px-6">
        {/* Left section - User account and stats */}
        <div className="flex items-center gap-3">
          <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
            <PopoverTrigger asChild>
              <button className="group flex items-center gap-2.5 rounded-lg border border-border/50 bg-card/50 backdrop-blur-sm px-3 py-1.5 shadow-sm hover:shadow-md hover:border-border hover:bg-accent/50 transition-all cursor-pointer">
                <div className="relative">
                  <Avatar className="h-7 w-7 ring-2 ring-offset-2 ring-offset-background transition-all group-hover:ring-offset-1">
                    <AvatarImage src={currentAccount?.avatarUrl} alt={currentAccount?.username} />
                    <AvatarFallback className="bg-muted">
                      <User className="h-3.5 w-3.5 text-muted-foreground" />
                    </AvatarFallback>
                  </Avatar>
                  {/* Status indicator */}
                  <div
                    className={cn(
                      'absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-background transition-colors',
                      userSession === UserSessionType.LOGGED_IN_OFFLINE && 'bg-red-500',
                      userSession === UserSessionType.LOGGED_IN_ONLINE && 'bg-green-500',
                      userSession === UserSessionType.CACHE && 'bg-yellow-500',
                      userSession === UserSessionType.NONE && 'bg-muted-foreground/30'
                    )}
                  />
                </div>
                <div className="flex flex-col items-start min-w-0">
                  <span className="text-xs font-semibold leading-none truncate max-w-[120px]">
                    {currentAccount?.username || 'No account'}
                  </span>
                  <span className="text-[10px] text-muted-foreground/70 leading-none mt-1">
                    {userSession === UserSessionType.LOGGED_IN_OFFLINE && 'Offline'}
                    {userSession === UserSessionType.LOGGED_IN_ONLINE && 'Online'}
                    {userSession === UserSessionType.CACHE && 'Cached'}
                    {userSession === UserSessionType.NONE && 'Not logged in'}
                  </span>
                </div>
                <ChevronDown className="h-3 w-3 text-muted-foreground/50 ml-0.5 transition-transform group-hover:text-muted-foreground" />
              </button>
            </PopoverTrigger>
            <PopoverContent align="start" className="p-3">
              <div className="space-y-2">
                {/* Login Form */}
                <form onSubmit={handleLogin}>
                  <FieldGroup className="gap-2">
                    <Field>
                      <FieldContent>
                        <FieldLabel htmlFor="token">Login via Steam Web Token</FieldLabel>
                        <FieldDescription>Open the link below, copy the token and paste it here.</FieldDescription>
                      </FieldContent>

                      <div className="flex w-full items-center gap-1 py-1">
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

                {/* Saved Accounts */}
                {Object.entries(accounts).length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <FieldLabel htmlFor="token">Cached accounts</FieldLabel>
                      {Object.entries(accounts).map(([steamId, account]) => (
                        <div
                          key={steamId}
                          className={cn(
                            'flex w-full items-stretch gap-2.5 rounded-md px-2 py-2 text-sm hover:bg-accent transition-colors',
                            activeSteamId === steamId && 'bg-accent'
                          )}
                        >
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleAccountSwitch(steamId)
                            }}
                            className="flex items-center gap-2.5 flex-1 min-w-0"
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
                          </button>
                          <div className="flex gap-1.5">
                            {activeSteamId === steamId && (
                              <>
                                <div
                                  title={
                                    userSession !== UserSessionType.LOGGED_IN_ONLINE
                                      ? 'Need to be logged in to force reload inventory'
                                      : ''
                                  }
                                >
                                  <Button
                                    variant="secondary"
                                    size="icon"
                                    onClick={handleForceReload}
                                    disabled={isLoading || userSession !== UserSessionType.LOGGED_IN_ONLINE}
                                    title="Force reload inventory"
                                    className="h-full w-8 hover:bg-accent-foreground/10 rounded-md"
                                  >
                                    <IconWrapper>
                                      <RotateCw />
                                    </IconWrapper>
                                  </Button>
                                </div>
                                <Button
                                  variant="secondary"
                                  size="icon"
                                  onClick={handleLogout}
                                  disabled={
                                    isLoading ||
                                    (userSession !== UserSessionType.LOGGED_IN_ONLINE &&
                                      userSession !== UserSessionType.LOGGED_IN_OFFLINE)
                                  }
                                  title="Log out"
                                  className="h-full w-8 hover:bg-accent-foreground/10 rounded-md"
                                >
                                  <IconWrapper>
                                    <LogOut />
                                  </IconWrapper>
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </PopoverContent>
          </Popover>

          {/* Stats */}
          <div className="flex items-center gap-3">
            {/* Inventory value */}
            <div className="flex flex-col items-end gap-0.5">
              <span className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wide leading-none">
                Total Value
              </span>
              <div className="flex items-center gap-1">
                <DollarSign className="h-3.5 w-3.5 text-muted-foreground/70" />
                <span className="text-sm font-bold tabular-nums text-foreground">
                  {new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(totalValue)}
                </span>
              </div>
            </div>

            <div className="h-6 w-px bg-border/50" />

            {/* Items count */}
            <div className="flex flex-col items-end gap-0.5">
              <span className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wide leading-none">
                Items
              </span>
              <div className="flex items-center gap-1">
                <Gem className="h-3.5 w-3.5 text-muted-foreground/70" />
                <span className="text-sm font-bold tabular-nums text-foreground">
                  {new Intl.NumberFormat('en-US').format(totalItems)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
