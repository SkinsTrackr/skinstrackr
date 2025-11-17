import { createContext, useContext, useState, ReactNode, JSX } from 'react'
import { Inventory } from '@shared/interfaces/inventory.types'

interface InventoryContextType {
  inventory: Inventory
  loadInventory: () => Promise<void>
  isLoading: boolean
  totalItems: number
  totalValue: number
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined)

export function InventoryProvider({ children }: { children: ReactNode }): JSX.Element {
  const [inventory, setInventory] = useState<Inventory>({ inventoryItems: [], containerItems: {} })
  const [isLoading, setIsLoading] = useState(false)
  const [totalValue, setTotalValue] = useState(0)
  const [totalItems, setTotalItems] = useState(0)

  const loadInventory = async (): Promise<void> => {
    try {
      setIsLoading(true)
      const result = await window.api.loadInventory(false)
      setInventory(result)
      console.log('Loaded inventory items:', result)
      setTotalItems(result.inventoryItems.length + Object.values(result.containerItems).flat().length)
      console.log('Total inventory items:', totalItems)
      setTotalValue(calculateTotalValue(result))
      console.log('Total inventory value:', totalValue)
    } catch (error) {
      console.error('Failed to load inventory:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <InventoryContext.Provider value={{ inventory, loadInventory, isLoading, totalItems, totalValue }}>
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
function calculateTotalValue(inventory: Inventory): number {
  return (
    inventory.inventoryItems.reduce((total, item) => total + (item.price || 0), 0) +
    Object.values(inventory.containerItems)
      .flat()
      .reduce((total, item) => total + (item.price || 0), 0)
  )
}
