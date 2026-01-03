import { createContext, useContext, useState, ReactNode, JSX, useCallback } from 'react'
import { ConvertedInventory } from '@shared/interfaces/inventory.types'
import { showToast } from '@/components/toast'
import { getCleanErrorMessage } from '@/lib/error-utils'
import GlobalOffensive from 'globaloffensive'

interface InventoryContextType {
  inventory: ConvertedInventory
  loadInventory: (fromCache: boolean, onlyChangedContainers: boolean) => Promise<void>
  isLoading: boolean
  totalItems: number
  totalValue: number
  lastRefresh: string
  getRawItem: (itemId: number) => Promise<GlobalOffensive.InventoryItem | undefined>
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined)

const defaultInventory: ConvertedInventory = {
  inventory: {
    id: 0,
    items: [],
    container: {
      containerId: 0,
      tradable: false
    },
    lastRefresh: 0,
    lastModification: 0
  },
  containers: [],
  lastRefresh: 0,
  qualities: {},
  rarities: {}
}

export function InventoryProvider({ children }: { children: ReactNode }): JSX.Element {
  const [inventory, setInventory] = useState<ConvertedInventory>(defaultInventory)
  const [isLoading, setIsLoading] = useState(false)
  const [totalValue, setTotalValue] = useState(0)
  const [totalItems, setTotalItems] = useState(0)
  const [lastRefresh, setLastRefresh] = useState('Never')

  const getRawItem = useCallback(async (itemId: number): Promise<GlobalOffensive.InventoryItem | undefined> => {
    try {
      const rawItem = await window.api.getRawItemData(itemId)
      return rawItem
    } catch (error) {
      console.error('Failed to get raw item data:', error)
      return
    }
  }, [])

  const loadInventory = useCallback(async (fromCache: boolean, onlyChangedContainers: boolean): Promise<void> => {
    try {
      setIsLoading(true)
      const result = await window.api.loadInventory(fromCache, onlyChangedContainers)
      setInventory(result)
      setTotalItems(result.inventory.items.length + result.containers.flatMap((c) => c.items).length)
      setTotalValue(calculateTotalValue(result))
      setLastRefresh(timeAgo(result.lastRefresh))
    } catch (error) {
      const cleanMessage = getCleanErrorMessage(error)
      console.error('Failed to load inventory:', error)
      setInventory(defaultInventory)

      showToast(cleanMessage, 'error')
    } finally {
      setIsLoading(false)
    }
  }, [])

  return (
    <InventoryContext.Provider
      value={{ inventory, loadInventory, isLoading, totalItems, totalValue, lastRefresh, getRawItem }}
    >
      {children}
    </InventoryContext.Provider>
  )
}

export function useInventory(): InventoryContextType {
  const context = useContext(InventoryContext)
  if (context === undefined) {
    throw new Error('useInventory must be used within an InventoryProvider')
  }
  return context
}

/**
 * Calculates the total value of the inventory.
 * @param inventory to calculate total value of
 */
function calculateTotalValue(inventory: ConvertedInventory): number {
  return (
    inventory.inventory.items.reduce((total, item) => total + (item.price || 0), 0) +
    inventory.containers.flatMap((container) => container.items).reduce((total, item) => total + (item.price || 0), 0)
  )
}

function timeAgo(unixSeconds: number): string {
  const now = Date.now()
  const then = unixSeconds
  const diff = Math.max(0, now - then)

  const sec = Math.floor(diff / 1000)
  const min = Math.floor(sec / 60)
  const hour = Math.floor(min / 60)
  const day = Math.floor(hour / 24)
  const week = Math.floor(day / 7)
  const month = Math.floor(day / 30)
  const year = Math.floor(day / 365)

  if (sec < 60) return '< 1min ago'
  if (min < 60) return `< ${min}min ago`
  if (hour < 24) return `< ${hour}h ago`
  if (day < 7) return `< ${day}d ago`
  if (week < 5) return `< ${week}w ago`
  if (month < 12) return `< ${month}mo ago`
  return `< ${year}y ago`
}
