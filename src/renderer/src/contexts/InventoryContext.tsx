import { createContext, useContext, useState, ReactNode, JSX } from 'react'
import { Inventory } from '@shared/interfaces/inventory.types'

interface InventoryContextType {
  inventory: Inventory
  loadInventory: () => Promise<void>
  isLoading: boolean
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined)

export function InventoryProvider({ children }: { children: ReactNode }): JSX.Element {
  const [inventory, setInventory] = useState<Inventory>({ inventoryItems: [], containerItems: {} })
  const [isLoading, setIsLoading] = useState(false)

  const loadInventory = async (): Promise<void> => {
    try {
      setIsLoading(true)
      const result = await window.api.loadInventory(false)
      setInventory(result)
      console.log('Loaded inventory items:', result)
    } catch (error) {
      console.error('Failed to load inventory:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <InventoryContext.Provider value={{ inventory, loadInventory, isLoading }}>{children}</InventoryContext.Provider>
  )
}

export function useInventory(): InventoryContextType {
  const context = useContext(InventoryContext)
  if (context === undefined) {
    throw new Error('useInventory must be used within an InventoryProvider')
  }
  return context
}
