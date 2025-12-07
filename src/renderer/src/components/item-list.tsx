import { ScrollArea } from '@/components/ui/scroll-area'
import { FC, useState, useMemo } from 'react'
import { InputGroup, InputGroupAddon, InputGroupInput } from './ui/input-group'
import { Search, ArrowRightLeft } from 'lucide-react'
import { ConvertedInventory, ConvertedItem } from '@shared/interfaces/inventory.types'
import { applyFilters, applyGrouping, applySorting, ItemListFilter } from '@/lib/item-list-filter'
import { ItemCard } from './item-card'
import { ItemFilterMenu } from './item-filter-menu'
import { Button } from './ui/button'
import { ItemGroupMenu } from './item-group-menu'
import { ItemSortMenu } from './item-sort-menu'

interface ItemListProps {
  inventory: ConvertedInventory
  filterStorageUnitsId: number[]
  setTransferModeActive: React.Dispatch<React.SetStateAction<boolean>>
  transferModeActive: boolean
}

export type FilteredItem = {
  name: string
  items: ConvertedItem[]
}

export const ItemList: FC<ItemListProps> = ({
  inventory,
  filterStorageUnitsId,
  setTransferModeActive,
  transferModeActive
}) => {
  const [itemFilter, setItemFilter] = useState<ItemListFilter>({
    filters: { showNonTradable: false, showTradable: true },
    sort: { sortBy: 'groupedValue', sortDir: 'desc' },
    groupBy: 'allItemsByName'
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
    const grouped = applyGrouping(filtered, itemFilter)
    const sorted = applySorting(grouped, itemFilter)

    return { allItems: invItems, filteredItems: sorted }
  }, [inventory, itemFilter, filterStorageUnitsId])

  return (
    <div className="flex flex-col h-full flex-1 overflow-hidden">
      <div className="px-4 flex gap-2 flex-shrink-0">
        {/* Transfer button - spans full height */}
        <Button
          className={`h-auto self-stretch flex-col !border-yellow-500 !text-yellow-500 !hover:bg-yellow-50 !hover:text-yellow-600`}
          variant="outline"
          onClick={() => {
            setTransferModeActive(!transferModeActive)
          }}
        >
          Transfer
          <ArrowRightLeft />
        </Button>

        {/* Search bar, filter, group and sort */}
        <div className="flex-1 flex flex-col gap-2">
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

          <div className="flex gap-2">
            <ItemFilterMenu
              itemFilter={itemFilter}
              setItemFilter={setItemFilter}
              rarities={inventory.rarities}
              qualities={inventory.qualities}
            />
            <ItemGroupMenu itemFilter={itemFilter} setItemFilter={setItemFilter} />
            <ItemSortMenu itemFilter={itemFilter} setItemFilter={setItemFilter} />
          </div>
        </div>
      </div>
      {/* Cards list */}
      <div className="flex-1 mt-5 overflow-hidden">
        <ScrollArea className="h-full" type="auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2 px-4 pb-4">
            {filteredItems.slice(0, 100).map((item, groupIndex) => (
              <ItemCard
                key={`${item.name}-${groupIndex}`}
                items={item.items}
                name={item.name}
                rarity={inventory.rarities[item.items[0]?.rarity || '']}
              />
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
