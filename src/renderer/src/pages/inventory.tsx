import { Separator } from '@/components/ui/separator'
import { StorageUnitsList } from '@/components/storage-units-list'
import { JSX } from 'react'
import { useInventory } from '../contexts/InventoryContext'
import { ItemList } from '@/components/item-list'

export default function InventoryPage(): JSX.Element {
  const { inventory } = useInventory()

  //   const storageUnits = useMemo(() => inventory.inventoryItems.filter((item) => item.isStorageUnit), [inventory])

  return (
    <div className="flex h-full overflow-hidden p-3">
      <StorageUnitsList inventory={inventory} />
      <Separator orientation="vertical" />
      <ItemList inventory={inventory} />
    </div>
  )
}
