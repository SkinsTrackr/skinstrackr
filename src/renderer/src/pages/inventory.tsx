import { Separator } from '@/components/ui/separator'
import { StorageUnitsList } from '@/components/storage-units-list'
import { Button } from '@/components/ui/button'

export default function InventoryPage() {
  const loadInventory = async (): Promise<void> => {
    try {
      const result = await window.api.loadInventory()
      console.log(result)
    } catch (error) {
      console.error('Failed to load inventory:', error)
    }
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <StorageUnitsList />
      <Separator orientation="vertical" />
      <div className="flex-1 p-6">
        <Button onClick={() => loadInventory()}>Load inventory</Button>
      </div>
    </div>
  )
}
