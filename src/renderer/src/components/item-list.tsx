import { ScrollArea } from '@/components/ui/scroll-area'
import { FC, useState, useMemo } from 'react'
import { InputGroup, InputGroupAddon, InputGroupInput } from './ui/input-group'
import { Search } from 'lucide-react'
import { ConvertedInventory, ConvertedItem } from '@shared/interfaces/inventory.types'
import { applyFilters, applyGrouping, applySorting, ItemListFilter } from '@/lib/item-list-filter'
import { ItemCard } from './item-card'
import { ItemFilterMenu } from './item-list-filter'

interface ItemListProps {
  inventory: ConvertedInventory
  filterStorageUnitsId: number[]
}

export type FilteredItem = {
  name: string
  items: ConvertedItem[]
}

export const ItemList: FC<ItemListProps> = ({ inventory, filterStorageUnitsId }) => {
  const [itemFilter, setItemFilter] = useState<ItemListFilter>({
    filters: { showNonTradable: false, showTradable: true },
    sort: { sortBy: 'singleValue', sortDir: 'desc' },
    groupBy: 'none'
  })

  // Visible items to user (Limited to 1000)
  // Includes all items in inventory except storage units
  // 'ungrouped' means no grouping applied to some items or item is unknown
  const { allItems, filteredItems } = useMemo(() => {
    const invItems = [
      ...inventory.inventoryItems.filter((item) => !item.isStorageUnit),
      ...Object.values(inventory.containerItems).flat()
    ]

    if (filterStorageUnitsId.length !== undefined) {
      itemFilter.filters = {
        ...itemFilter.filters,
        containerIds: filterStorageUnitsId
      }
    }

    const filtered = applyFilters(invItems, itemFilter)
    const sorted = applySorting(filtered, itemFilter)
    const grouped = applyGrouping(sorted, itemFilter)

    console.log(grouped)

    // grouped.splice(100) // Limit to 1000 items displayed

    return { allItems: invItems, filteredItems: grouped }
  }, [inventory, itemFilter, filterStorageUnitsId])

  return (
    <div className="flex flex-col h-full flex-1 overflow-hidden">
      <div className="px-4 flex gap-2 items-center flex-shrink-0">
        <div className="flex-1">
          <InputGroup>
            <InputGroupInput
              placeholder="Search..."
              value={itemFilter.filters?.query || ''}
              onChange={(e) =>
                setItemFilter((prev) => ({
                  ...prev,
                  filters: { ...prev.filters, query: e.target.value }
                }))
              }
            />
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
            <InputGroupAddon align="inline-end">{`${filteredItems.length}/${allItems.length}`}</InputGroupAddon>
          </InputGroup>
        </div>
        <ItemFilterMenu
          itemFilter={itemFilter}
          setItemFilter={setItemFilter}
          rarities={inventory.rarities}
          qualities={inventory.qualities}
        />
      </div>
      {/* Cards list */}
      <div className="flex-1 mt-5 overflow-hidden">
        <ScrollArea className="h-full" type="auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-7 gap-2 px-4 pb-4">
            {filteredItems
              .slice(0, 100)
              .map((group) =>
                group.items.map((item, index) => (
                  <ItemCard
                    key={`${group.name}-${index}`}
                    items={group.items}
                    name={item.hashName || item.customName || 'Unknown Item'}
                    rarity={inventory.rarities[item.rarity || '']}
                  />
                ))
              )}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
