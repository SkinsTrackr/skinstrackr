import { JSX, useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { User, ChevronDown } from 'lucide-react'
import { useClientStore } from '@/contexts/ClientStoreContext'
import { showToast } from '@/components/toast'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'

export default function SettingsPage(): JSX.Element {
  const { settings, saveSettings, accounts } = useClientStore()
  const accountsList = Object.entries(accounts)

  const [defaultAccountId, setDefaultAccountId] = useState<string | undefined>(settings.defaultAccountID)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    // Only update if settings change from the saved settings
    if (settings.defaultAccountID) {
      setDefaultAccountId(settings.defaultAccountID)
    }
  }, [settings.defaultAccountID])

  const handleSaveSettings = async (): Promise<void> => {
    if (!defaultAccountId) {
      showToast('Please select a default account', 'error')
      return
    }

    setIsSaving(true)
    try {
      await saveSettings({ defaultAccountID: defaultAccountId })
      showToast('Settings saved successfully', 'success')
    } catch (error) {
      console.error('Failed to save settings:', error)
      showToast('Failed to save settings', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const hasChanges = defaultAccountId !== settings.defaultAccountID
  const selectedAccount = defaultAccountId ? accounts[defaultAccountId] : undefined

  return (
    <div className="flex h-full overflow-auto">
      <div className="mx-auto w-full max-w-4xl p-6 space-y-6">
        {/* <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground">Manage your application preferences and account settings</p>
        </div> */}

        {/* <Separator /> */}

        <Card>
          <CardHeader className="border-b">
            <CardTitle>Account Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Default Account Selection - Two Column Layout */}
            <div className="grid grid-cols-[1fr_1fr] gap-6 items-start">
              <div className="space-y-1">
                <label className="text-sm font-medium leading-none">Default Account</label>
                <p className="text-sm text-muted-foreground">Choose which account to load automatically on startup.</p>
              </div>

              <div className="space-y-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between h-auto py-2.5"
                      disabled={accountsList.length === 0}
                    >
                      {selectedAccount ? (
                        <div className="flex items-center gap-2.5">
                          <Avatar className="h-7 w-7">
                            <AvatarImage src={selectedAccount.avatarUrl} alt={selectedAccount.username} />
                            <AvatarFallback className="bg-muted">
                              <User className="h-3.5 w-3.5 text-muted-foreground" />
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col items-start">
                            <span className="text-sm font-medium">{selectedAccount.username || 'Unknown User'}</span>
                            <span className="text-xs text-muted-foreground">{selectedAccount.steamID}</span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">
                          {accountsList.length === 0 ? 'No accounts available' : 'Select an account'}
                        </span>
                      )}
                      <ChevronDown className="h-4 w-4 opacity-50" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)]" align="start">
                    <DropdownMenuRadioGroup value={defaultAccountId} onValueChange={setDefaultAccountId}>
                      {accountsList.length === 0 ? (
                        <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                          No accounts available. Log in to add an account.
                        </div>
                      ) : (
                        accountsList.map(([steamId, account]) => (
                          <DropdownMenuRadioItem key={steamId} value={steamId} className="py-2.5">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={account.avatarUrl} alt={account.username} />
                              <AvatarFallback className="bg-muted text-xs">
                                <User className="h-3 w-3 text-muted-foreground" />
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col items-start min-w-0 flex-1">
                              <span className="text-sm font-medium truncate w-full">
                                {account.username || 'Unknown User'}
                              </span>
                              <span className="text-xs text-muted-foreground truncate w-full">{account.steamID}</span>
                            </div>
                          </DropdownMenuRadioItem>
                        ))
                      )}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
                {!defaultAccountId && accountsList.length > 0 && (
                  <p className="text-xs text-destructive">A default account must be selected</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {hasChanges && (
          <div className="flex items-center justify-end gap-3 rounded-lg border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground flex-1">You have unsaved changes</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setDefaultAccountId(
                  settings.defaultAccountID || (accountsList.length > 0 ? accountsList[0][0] : undefined)
                )
              }
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button size="sm" onClick={handleSaveSettings} disabled={isSaving || !defaultAccountId}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
