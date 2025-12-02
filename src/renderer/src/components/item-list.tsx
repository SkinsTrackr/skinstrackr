import { ScrollArea } from '@/components/ui/scroll-area'
import { FC, useState, useMemo } from 'react'
import { InputGroup, InputGroupAddon, InputGroupInput } from './ui/input-group'
import { Search } from 'lucide-react'
import { ConvertedInventory, ConvertedItem } from '@shared/interfaces/inventory.types'
import { applyFilters, applyGrouping, applySorting, ItemListFilter } from '@/lib/item-list-filter'
import { ItemCard } from './item-card'
import { DropdownMenu } from '@radix-ui/react-dropdown-menu'
import {
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from './ui/dropdown-menu'
import { Button } from './ui/button'

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
    filters: { showNonTradable: false },
    sort: { sortBy: 'name', sortDir: 'asc' },
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">Filter</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="start">
            {/* Misc filters */}
            <DropdownMenuLabel>General</DropdownMenuLabel>
            <DropdownMenuGroup>
              <DropdownMenuCheckboxItem
                onSelect={(event) => event.preventDefault()}
                checked={itemFilter.filters?.showNonTradable}
                onCheckedChange={(checked) => {
                  setItemFilter((prev) => ({
                    ...prev,
                    filters: {
                      ...prev.filters,
                      showNonTradable: checked
                    }
                  }))
                }}
              >
                Non-tradable
              </DropdownMenuCheckboxItem>
            </DropdownMenuGroup>
            {/* Rarity filters */}
            <DropdownMenuLabel>Rarity</DropdownMenuLabel>
            <DropdownMenuGroup>
              {Object.keys(inventory.rarities).map((rarityKey) => {
                if (rarityKey == '99') return null // skip unused rarity
                const rarity = inventory.rarities[rarityKey]
                return (
                  <DropdownMenuCheckboxItem
                    key={rarityKey}
                    onSelect={(event) => event.preventDefault()}
                    checked={itemFilter.filters?.rarities?.some((r) => r === rarity.index) || false}
                    onCheckedChange={(checked) => {
                      setItemFilter((prev) => {
                        const prevRarities = prev.filters?.rarities || []
                        let newRarities: string[] = []
                        if (checked) {
                          newRarities = [...prevRarities, rarity.index]
                        } else {
                          newRarities = prevRarities.filter((r) => r !== rarity.index)
                        }

                        return {
                          ...prev,
                          filters: {
                            ...prev.filters,
                            rarities: newRarities
                          }
                        }
                      })
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{
                          backgroundColor: rarity.color || '#888888'
                        }}
                      />
                      <span>{rarity.name_default}</span>
                    </div>
                  </DropdownMenuCheckboxItem>
                )
              })}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            {/* Quality filters */}
            <DropdownMenuLabel>Quality</DropdownMenuLabel>
            <DropdownMenuGroup>
              {Object.keys(inventory.qualities).map((qualityKey) => {
                if (
                  qualityKey == '0' ||
                  qualityKey == '1' ||
                  qualityKey == '2' ||
                  qualityKey == '4' ||
                  qualityKey == '5' ||
                  qualityKey == '6' ||
                  qualityKey == '7' ||
                  qualityKey == '8' ||
                  qualityKey == '10' ||
                  qualityKey == '11' ||
                  qualityKey == '13' ||
                  qualityKey == '14'
                )
                  return null // skip unused quality
                const quality = inventory.qualities[qualityKey]
                return (
                  <DropdownMenuCheckboxItem
                    key={qualityKey}
                    onSelect={(event) => event.preventDefault()}
                    checked={itemFilter.filters?.qualities?.some((q) => q === quality.index) || false}
                    onCheckedChange={(checked) => {
                      setItemFilter((prev) => {
                        const prevQualities = prev.filters?.qualities || []
                        let newQualities: string[] = []
                        if (checked) {
                          newQualities = [...prevQualities, quality.index]
                        } else {
                          newQualities = prevQualities.filter((q) => q !== quality.index)
                        }

                        return {
                          ...prev,
                          filters: {
                            ...prev.filters,
                            qualities: newQualities
                          }
                        }
                      })
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{
                          backgroundColor: quality.color || '#888888'
                        }}
                      />
                      <span>{quality.name}</span>
                    </div>
                  </DropdownMenuCheckboxItem>
                )
              })}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
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
