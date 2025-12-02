import { Separator } from '@/components/ui/separator'
import { StorageUnitsList } from '@/components/storage-units-list'
import { JSX, useState } from 'react'
import { useInventory } from '../contexts/InventoryContext'
import { ItemList } from '@/components/item-list'

export default function InventoryPage(): JSX.Element {
  const { inventory } = useInventory()
  const [selectedUnitsId, setSelectedUnitIds] = useState<number[]>([])

  //   const storageUnits = useMemo(() => inventory.inventoryItems.filter((item) => item.isStorageUnit), [inventory])

  return (
    <div className="flex h-full overflow-hidden p-3">
      <StorageUnitsList
        inventory={inventory}
        selectedUnitsId={selectedUnitsId}
        setSelectedUnitsId={setSelectedUnitIds}
      />
      <Separator orientation="vertical" />
      <ItemList inventory={inventory} filterStorageUnitsId={selectedUnitsId} />
    </div>
  )
}
