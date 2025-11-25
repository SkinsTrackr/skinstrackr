import { JSX, useState, useEffect, useCallback, useRef } from 'react'
import { Button } from './ui/button'
import { Separator } from './ui/separator'
import { RefreshCw, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useInventory } from '@/contexts/InventoryContext'

export default function BottomNavbar(): JSX.Element {
  const { totalItems, totalValue, loadInventory, isLoading, lastRefresh } = useInventory()
  const [isConnected] = useState(true)

  const handleRefresh = useCallback(async (): Promise<void> => {
    await loadInventory(true)
  }, [loadInventory])

  return (
    <div className="w-full border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-12 items-center justify-between px-8">
        {/* Left section - Item counts */}
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">
            {new Intl.NumberFormat('us-en').format(totalItems)} items
          </span>
          <span className="text-sm text-muted-foreground">|</span>
          <span className="text-sm text-muted-foreground">
            {new Intl.NumberFormat('us-en', { style: 'currency', currency: 'USD' }).format(totalValue)}
          </span>
        </div>

        {/* Center section - Last update and refresh */}
        <div className="flex items-center space-x-3">
          <span className="text-sm text-muted-foreground">Last refresh: {lastRefresh}</span>
          <Separator orientation="vertical" className="h-4" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleRefresh()}
            disabled={isLoading}
            className="h-8 px-3 text-sm hover:bg-accent/10 transition-all duration-200"
          >
            <RefreshCw className={cn('w-3 h-3', isLoading && 'animate-spin')} />
            Refresh
          </Button>
        </div>

        {/* Right section - Connection status */}
        <div className="flex items-center space-x-2">
          <div
            className={cn(
              'flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-sm font-medium transition-all duration-200',
              isConnected
                ? 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-950/50'
                : 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-950/50'
            )}
          >
            <div className={cn('w-2 h-2 rounded-full', isConnected ? 'bg-green-500' : 'bg-red-500')} />
            <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
          </div>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-accent/10 transition-all duration-200">
            <User className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
