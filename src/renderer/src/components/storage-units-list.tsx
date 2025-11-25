import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardContent } from '@/components/ui/card'
import { FC, useState, useMemo } from 'react'
import { InputGroup, InputGroupAddon, InputGroupInput } from './ui/input-group'
import { Search } from 'lucide-react'
import { Inventory } from '@shared/interfaces/inventory.types'

interface StorageUnitsListProps {
  inventory: Inventory
}

export const StorageUnitsList: FC<StorageUnitsListProps> = ({ inventory }) => {
  const [searchQuery, setSearchQuery] = useState('')
  const storageUnits = useMemo(
    () => inventory.inventoryItems.filter((item) => item.isStorageUnit),
    [inventory.inventoryItems]
  )

  const filteredUnits = useMemo(
    () =>
      storageUnits
        .filter((unit) => (unit.customName || '').toLowerCase().includes(searchQuery.toLowerCase()))
        .sort((a, b) => (a.customName || '').localeCompare(b.customName || '')),
    [searchQuery, storageUnits]
  )

  return (
    <div className="w-55 flex flex-col h-full">
      <div className="pr-4">
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
            {filteredUnits.length}/{storageUnits.length}
          </InputGroupAddon>
        </InputGroup>
      </div>
      <ScrollArea className="flex-1 min-h-0 mt-5" type="auto">
        <div className="flex flex-col gap-2 mr-4">
          {filteredUnits.map((unit) => (
            <Card key={unit.id} className="cursor-pointer hover:bg-accent transition-colors">
              <CardContent className="flex items-center gap-3 px-2 h-8">
                <img
                  src={window.env.ICONS_BASE_URL + '/' + (unit.imagePath || '') + '.png'}
                  alt="Storage Unit"
                  className="h-15 w-10 object-contain"
                />
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{unit.customName || unit.hashName || 'Storage Unit'}</span>
                  <span className="text-xs text-muted-foreground pt-1">
                    {inventory.containerItems[unit.id || '']?.length || 0} items
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
