import { ScrollArea } from '@/components/ui/scroll-area'
import { FC, useState, useMemo } from 'react'
import { InputGroup, InputGroupAddon, InputGroupInput } from './ui/input-group'
import { Search } from 'lucide-react'
import { Inventory } from '@shared/interfaces/inventory.types'

interface ItemListProps {
  inventory: Inventory
}

export const ItemList: FC<ItemListProps> = ({ inventory }) => {
  const [searchQuery, setSearchQuery] = useState('')

  // All items except storage units
  const items = useMemo(
    () => [
      ...inventory.inventoryItems.filter((item) => !item.isStorageUnit),
      ...Object.values(inventory.containerItems).flat()
    ],
    [inventory]
  )

  const filteredItems = useMemo(
    () =>
      items
        .filter((item) => (item.customName || item.hashName || '').toLowerCase().includes(searchQuery.toLowerCase()))
        .sort((a, b) => (a.customName || a.hashName || '').localeCompare(b.customName || b.hashName || '')),
    [searchQuery, items]
  )

  return (
    <div className="w-55 flex flex-col h-screen">
      <div className="pl-4">
        <InputGroup>
          <InputGroupInput
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
          <InputGroupAddon align="inline-end">
            {filteredItems.length}/{items.length}
          </InputGroupAddon>
        </InputGroup>
      </div>
      <ScrollArea className="h-full mt-5" type="auto">
        <div className="flex flex-col gap-2 mr-4">
          {/* {filteredItems.map((item) => (
            <Card key={item.id} className="cursor-pointer hover:bg-accent transition-colors">
              <CardContent className="flex items-center gap-3 px-2 h-8">
                <img src={StorageUnitLogo} alt="Storage Unit" className="h-15 w-10 object-contain" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{item.customName || item.hashName || 'Storage Unit'}</span>
                  <span className="text-xs text-muted-foreground pt-1"></span>
                </div>
              </CardContent>
            </Card>
          ))} */}
        </div>
      </ScrollArea>
    </div>
  )
}
