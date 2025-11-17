import { Separator } from '@/components/ui/separator'
import { StorageUnitsList } from '@/components/storage-units-list'
import { Button } from '@/components/ui/button'
import { useMemo, JSX } from 'react'
import { useInventory } from '../contexts/InventoryContext'
import { ItemList } from '@/components/item-list'

export default function InventoryPage(): JSX.Element {
  const { inventory, loadInventory, isLoading } = useInventory()

  //   const storageUnits = useMemo(() => inventory.inventoryItems.filter((item) => item.isStorageUnit), [inventory])

  return (
    <div className="flex h-screen overflow-hidden">
      <StorageUnitsList inventory={inventory} />
      <Separator orientation="vertical" />
      <ItemList inventory={inventory} />
      <div className="flex-1 p-6">
        <Button onClick={() => loadInventory()} disabled={isLoading}>
          {isLoading ? 'Loading...' : 'Load inventory'}
        </Button>
      </div>
    </div>
  )
}
