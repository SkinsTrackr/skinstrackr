import { Separator } from '@/components/ui/separator'
import { StorageUnitsList } from '@/components/container-list'
import { JSX, useState } from 'react'
import { useInventory } from '../contexts/InventoryContext'
import { ItemList } from '@/components/item-list'

export default function InventoryPage(): JSX.Element {
  const { inventory } = useInventory()
  const [selectedUnitsId, setSelectedUnitIds] = useState<number[]>([])
  const [transferModeActive, setTransferModeActive] = useState(false)

  //   const storageUnits = useMemo(() => inventory.inventoryItems.filter((item) => item.isStorageUnit), [inventory])

  return (
    <div className="flex h-full overflow-hidden p-3">
      <StorageUnitsList
        inventory={inventory}
        setSelectedUnitsId={setSelectedUnitIds}
        selectedUnitsId={selectedUnitsId}
        transferModeActive={transferModeActive}
      />
      <Separator orientation="vertical" />
      <ItemList
        inventory={inventory}
        setTransferModeActive={setTransferModeActive}
        filterStorageUnitsId={selectedUnitsId}
        transferModeActive={transferModeActive}
      />
    </div>
  )
}
