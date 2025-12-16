import { Separator } from '@/components/ui/separator'
import { StorageUnitsList } from '@/components/container-list'
import { JSX, useMemo, useState } from 'react'
import { useInventory } from '../contexts/InventoryContext'
import { ItemList } from '@/components/item-list'
import { TransferItems } from '@shared/interfaces/inventory.types'

export default function InventoryPage(): JSX.Element {
  const { inventory } = useInventory()
  const [transfer, setTransfer] = useState<TransferItems>({
    mode: null,
    fromContainerIds: [],
    toContainerId: 0,
    selectedItems: {}
  })

  console.log(transfer.selectedItems)

  return (
    <div className="flex h-full overflow-hidden p-3">
      <StorageUnitsList inventory={inventory} transfer={transfer} setTransfer={setTransfer} />
      <Separator orientation="vertical" />
      <ItemList inventory={inventory} transfer={transfer} setTransfer={setTransfer} />
    </div>
  )
}
