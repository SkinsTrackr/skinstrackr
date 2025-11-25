import { ScrollArea } from '@/components/ui/scroll-area'
import { FC, useState, useMemo } from 'react'
import { InputGroup, InputGroupAddon, InputGroupInput } from './ui/input-group'
import { Search } from 'lucide-react'
import { Inventory } from '@shared/interfaces/inventory.types'
import { Card, CardContent } from './ui/card'

interface ItemListProps {
  inventory: Inventory
}

export const ItemList: FC<ItemListProps> = ({ inventory }) => {
  const [searchQuery, setSearchQuery] = useState('')

  // All items except storage units (from both inventory and containers)
  const items = useMemo(() => {
    const allItems = [
      ...inventory.inventoryItems.filter((item) => !item.isStorageUnit),
      ...Object.values(inventory.containerItems).flat()
    ]

    // Deduplicate items by ID to avoid showing the same item multiple times
    const seenIds = new Set<string>()
    return allItems.filter((item) => {
      if (!item.id) return true // Include items without ID (shouldn't happen but just in case)
      if (seenIds.has(item.id)) return false // Skip if we've already seen this ID
      seenIds.add(item.id)
      return true
    })
  }, [inventory])

  const filteredItems = useMemo(
    () =>
      items
        .filter((item) => (item.customName || item.hashName || '').toLowerCase().includes(searchQuery.toLowerCase()))
        .sort((a, b) => (a.customName || a.hashName || '').localeCompare(b.customName || b.hashName || ''))
        .slice(0, 1000), // Limit to first 1000 items for performance
    [searchQuery, items]
  )

  return (
    <div className="flex flex-col h-screen flex-1">
      <div className="px-4">
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
      <ScrollArea className="h-full mt-5 ml-4" type="auto">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-7 gap-2">
          {filteredItems.map((item) => (
            <Card
              key={item.id}
              className="cursor-pointer hover:bg-accent transition-colors relative overflow-hidden py-4"
            >
              <CardContent className="flex items-center gap-3 px-2 py-1 h-20">
                {/* Item Icon */}
                <div className="relative w-18 h-18 flex-shrink-0 flex items-center justify-center">
                  <img
                    src={window.env.ICONS_BASE_URL + '/' + (item.imagePath || '') + '.png'}
                    alt={item.customName || item.hashName || 'Item'}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>

                {/* Content Area */}
                <div className="flex flex-col justify-between h-full flex-1 min-w-0">
                  {/* Item Name */}
                  <div className="text-left w-full">
                    <span className="text-xs font-medium leading-tight line-clamp-2 break-words">
                      {item.customName || item.hashName || 'Unknown Item'}
                    </span>
                  </div>

                  {/* Bottom Row: Rarity Bar and Price */}
                  <div className="flex flex-col gap-1 w-full">
                    {/* Item Color/Rarity Bar */}
                    {(item.rarity?.color || item.quality?.color) && (
                      <div
                        className="w-full h-1 rounded-full"
                        style={{
                          backgroundColor: item.rarity?.color || item.quality?.color || '#888888'
                        }}
                      />
                    )}

                    {/* Item Price */}
                    <div className="text-left w-full">
                      {item.price !== undefined && item.price > 0 ? (
                        <span className="text-xs font-semibold text-green-500 dark:text-green-500">
                          ${item.price.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">No Price</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Float value placeholder - can be implemented when float data is available */}
                {/* {item.float && (
                  <span className="text-xs text-muted-foreground">
                    Float: {item.float.toFixed(4)}
                  </span>
                )} */}
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
