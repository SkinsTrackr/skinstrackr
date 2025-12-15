import { ScrollArea } from '@/components/ui/scroll-area'
import { FC, useState, useMemo } from 'react'
import { InputGroup, InputGroupAddon, InputGroupInput } from './ui/input-group'
import { Search, ArrowRightLeft, ChevronDown } from 'lucide-react'
import { ConvertedInventory, ConvertedItem, TransferItems } from '@shared/interfaces/inventory.types'
import { applyContainerFilter, applyFilters, applyGrouping, applySorting, ItemListFilter } from '@/lib/item-list-filter'
import { ItemCard } from './item-card'
import { ItemFilterMenu } from './item-filter-menu'
import { Button } from './ui/button'
import { ItemGroupMenu } from './item-group-menu'
import { ItemSortMenu } from './item-sort-menu'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import { ItemTransferArea } from './item-transfer-area'

interface ItemListProps {
  inventory: ConvertedInventory
  transfer: TransferItems
  setTransfer: React.Dispatch<React.SetStateAction<TransferItems>>
}

export type FilteredItem = {
  name: string
  items: ConvertedItem[]
}

export const ItemList: FC<ItemListProps> = ({ inventory, transfer, setTransfer }) => {
  const [itemFilter, setItemFilter] = useState<ItemListFilter>({
    filters: { showNonTradable: false, showTradable: true },
    sort: { sortBy: 'groupedValue', sortDir: 'desc' },
    groupBy: 'allItemsByName'
  })

  // filteredItems: items after all filters, grouping and sorting applied
  // filteredItemsTotal: total number of items after filtering but before grouping and sorting
  // filteredContainerTotal: total number of items after container filtering but before other filtering, grouping and sorting
  const { filteredItems, filteredItemsTotal, filteredContainerTotal } = useMemo(() => {
    let invItems = [
      ...inventory.inventoryItems.filter((item) => !item.isStorageUnit),
      ...Object.values(inventory.containerItems).flat()
    ]

    if (transfer.fromContainerIds.length !== undefined) {
      itemFilter.filters = {
        ...itemFilter.filters,
        containerIds: transfer.fromContainerIds
      }

      // Don't include root inventory if no storage units are filtered in transfer mode
      if (transfer.mode === 'toInventory' && transfer.fromContainerIds.length === 0) {
        invItems = invItems.filter((item) => item.containerId !== 0)
      }
    }

    // Don't include non-movable items
    if (transfer.mode !== null) {
      if (itemFilter.filters) {
        itemFilter.filters.showNonTradable = false
        itemFilter.filters.showTradable = true
      }
    }

    const filteredContainers = applyContainerFilter(invItems, itemFilter)
    const filtered = applyFilters(filteredContainers, itemFilter)
    const grouped = applyGrouping(filtered, itemFilter)
    const sorted = applySorting(grouped, itemFilter)

    const total = filtered.length
    const containerTotal = filteredContainers.length

    return {
      filteredItems: sorted,
      filteredItemsTotal: total,
      filteredContainerTotal: containerTotal
    }
  }, [inventory.containerItems, inventory.inventoryItems, itemFilter, transfer.fromContainerIds, transfer.mode])

  const [isPopoverOpen, setIsPopoverOpen] = useState(false)

  return (
    <div className="flex flex-col h-full flex-1 overflow-hidden">
      <div className="px-4 flex gap-2 flex-shrink-0">
        {/* Transfer button */}
        <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
          <PopoverTrigger asChild>
            <Button // TODO: Change color to red/blue. Also change button to mode currently active
              className={`h-auto self-stretch flex-col !border-yellow-500 !text-yellow-500 !hover:bg-yellow-50 !hover:text-yellow-600`}
              variant="outline"
            >
              <div className="flex items-center gap-1">
                <ArrowRightLeft />
                Transfer
              </div>
              <ChevronDown size={12} strokeWidth={3} />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-52">
            <Button
              variant="ghost"
              onClick={() => {
                setTransfer({ ...transfer, mode: 'toInventory' })
                setIsPopoverOpen(false)
              }}
            >
              Transfer to inventory
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setTransfer({ ...transfer, mode: 'toContainer' })
                setIsPopoverOpen(false)
              }}
            >
              Transfer to container
            </Button>
          </PopoverContent>
        </Popover>

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
            <InputGroupAddon align="inline-end">{`${filteredItemsTotal}/${filteredContainerTotal}`}</InputGroupAddon>
          </InputGroup>

          <div className="flex gap-2">
            <ItemFilterMenu
              itemFilter={itemFilter}
              setItemFilter={setItemFilter}
              rarities={inventory.rarities}
              qualities={inventory.qualities}
              transfer={transfer}
            />
            <ItemGroupMenu itemFilter={itemFilter} setItemFilter={setItemFilter} />
            <ItemSortMenu itemFilter={itemFilter} setItemFilter={setItemFilter} />
          </div>
        </div>
      </div>
      {/* Cards list */}
      <div className="flex-1 mt-5 overflow-hidden">
        <ScrollArea className="h-full" type="auto">
          <div className="px-4 pb-4">
            {/* Transfer Area */}
            <ItemTransferArea transfer={transfer} />

            {/* Items Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2">
              {filteredItems.slice(0, 100).map((item, groupIndex) => (
                <ItemCard
                  key={`${item.name}-${groupIndex}`}
                  items={item.items}
                  name={item.name}
                  rarity={inventory.rarities[item.items[0]?.rarity || '']}
                  transfer={transfer}
                  setTransfer={setTransfer}
                  containers={{ ...inventory.containerItems, 0: inventory.inventoryItems }} // including inventory items with containerId 0
                />
              ))}
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
