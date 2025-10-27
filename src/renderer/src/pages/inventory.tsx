import { Separator } from '@/components/ui/separator'
import { StorageUnitsList } from '@/components/storage-units-list'

export default function InventoryPage(): JSX.Element {
  return (
    <div className="flex h-screen overflow-hidden">
      <StorageUnitsList />
      <Separator orientation="vertical" />
      <div className="flex-1 p-6">{/* Main inventory content will go here */}</div>
    </div>
  )
}
