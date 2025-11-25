import { createContext, useContext, useState, ReactNode, JSX } from 'react'
import { ConvertedInventory } from '@shared/interfaces/inventory.types'
import { showToast } from '@/components/toast'

interface InventoryContextType {
  inventory: ConvertedInventory
  loadInventory: (force: boolean) => Promise<void>
  isLoading: boolean
  totalItems: number
  totalValue: number
  lastRefresh: string
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined)

export function InventoryProvider({ children }: { children: ReactNode }): JSX.Element {
  const [inventory, setInventory] = useState<ConvertedInventory>({
    inventoryItems: [],
    containerItems: {},
    lastRefresh: 0
  })
  const [isLoading, setIsLoading] = useState(false)
  const [totalValue, setTotalValue] = useState(0)
  const [totalItems, setTotalItems] = useState(0)
  const [lastRefresh, setLastRefresh] = useState('Never')

  const loadInventory = async (force: boolean): Promise<void> => {
    try {
      setIsLoading(true)
      const result = await window.api.loadInventory(force)
      setInventory(result)
      console.log('Loaded inventory items:', result)
      setTotalItems(result.inventoryItems.length + Object.values(result.containerItems).flat().length)
      console.log('Total inventory items:', totalItems)
      setTotalValue(calculateTotalValue(result))
      console.log('Total inventory value:', totalValue)
      setLastRefresh(timeAgo(result.lastRefresh))
      console.log('Inventory last update:', lastRefresh)
    } catch (error) {
      console.error('Failed to load inventory:', error)
      showToast('Failed to load inventory: ' + error, 'error')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <InventoryContext.Provider value={{ inventory, loadInventory, isLoading, totalItems, totalValue, lastRefresh }}>
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
    inventory.inventoryItems.reduce((total, item) => total + (item.price || 0), 0) +
    Object.values(inventory.containerItems)
      .flat()
      .reduce((total, item) => total + (item.price || 0), 0)
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
