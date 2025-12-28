import { ScrollArea } from '@/components/ui/scroll-area'
import { FC, useState, useMemo, useEffect } from 'react'
import { InputGroup, InputGroupAddon, InputGroupInput } from './ui/input-group'
import { Search } from 'lucide-react'
import { ConvertedInventory, ConvertedItem, TransferItems } from '@shared/interfaces/inventory.types'
import { applyContainerFilter, applyFilters, applyGrouping, applySorting, ItemListFilter } from '@/lib/item-list-filter'
import { ItemCard } from './item-card'
import { ItemFilterMenu } from './item-filter-menu'
import { ItemGroupMenu } from './item-group-menu'
import { ItemSortMenu } from './item-sort-menu'
import { ItemTransferArea } from './item-transfer-area'
import { TransferMenu } from './transfer-menu'
import { InventoryEmptyState } from './inventory-empty-state'
import { useClientStore } from '@/contexts/ClientStoreContext'

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
  const { accounts, loadAccounts } = useClientStore()
  const [itemFilter, setItemFilter] = useState<ItemListFilter>({
    filters: { showNonTradable: false, showTradable: true },
    sort: { sortBy: 'groupedValue', sortDir: 'desc' },
    groupBy: 'allItemsByName'
  })

  // Load accounts on mount
  //   useEffect(() => {
  //     loadAccounts().catch(console.error)
  //   }, [loadAccounts])

  // TODO change into normal variable?
  const allContainers = useMemo(
    () => [...inventory.containers, inventory.inventory],
    [inventory.containers, inventory.inventory]
  )

  // filteredItems: items after all filters, grouping and sorting applied
  // filteredItemsTotal: total number of items after filtering but before grouping and sorting
  // filteredContainerTotal: total number of items after container filtering but before other filtering, grouping and sorting
  const { filteredItems, filteredItemsTotal, filteredContainerTotal } = useMemo(() => {
    let invItems = [...inventory.inventory.items, ...inventory.containers.flatMap((container) => container.items)]

    // Create a new filter object instead of mutating the state
    let currentFilter = { ...itemFilter }

    if (transfer.fromContainerIds.length !== undefined) {
      currentFilter = {
        ...currentFilter,
        filters: {
          ...currentFilter.filters,
          containerIds: transfer.fromContainerIds
        }
      }

      // Don't include root inventory if no storage units are selected in transfer mode
      if (transfer.mode === 'toInventory' && transfer.fromContainerIds.length === 0) {
        invItems = inventory.containers.flatMap((container) => container.items)
      }
    }

    // Don't include non-movable items
    if (transfer.mode !== null) {
      currentFilter = {
        ...currentFilter,
        filters: {
          ...currentFilter.filters,
          showNonTradable: false,
          showTradable: true
        }
      }
    }

    const filteredContainers = applyContainerFilter(invItems, currentFilter)
    const filtered = applyFilters(filteredContainers, currentFilter)
    const grouped = applyGrouping(filtered, currentFilter)
    const sorted = applySorting(grouped, currentFilter)

    const total = filtered.length
    const containerTotal = filteredContainers.length

    return {
      filteredItems: sorted,
      filteredItemsTotal: total,
      filteredContainerTotal: containerTotal
    }
  }, [inventory.containers, inventory.inventory.items, itemFilter, transfer.fromContainerIds, transfer.mode])

  // Check if user has any accounts
  const hasAccounts = accounts && Object.keys(accounts).length > 0

  return (
    <div className="flex flex-col h-full flex-1 overflow-hidden">
      <div className="px-4 flex gap-2 flex-shrink-0">
        {/* Transfer mode selection */}
        <TransferMenu transfer={transfer} setTransfer={setTransfer} />

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
      {/* Cards list or empty state */}
      <div className="flex-1 mt-5 overflow-hidden">
        {!hasAccounts ? (
          <InventoryEmptyState />
        ) : (
          <ScrollArea className="h-full" type="auto">
            <div className="px-4 pb-4">
              {/* Transfer Area */}
              <ItemTransferArea transfer={transfer} containers={allContainers} setTransfer={setTransfer} />

              {/* Items Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2">
                {filteredItems.slice(0, 100).map((item, groupIndex) => (
                  <ItemCard
                    key={`${item.name}-${groupIndex}`}
                    items={item.items}
                    name={item.name}
                    rarity={inventory.rarities[item.items[0]?.rarity || '']}
                    transfer={transfer}
                    setTransfer={setTransfer}
                    containers={allContainers} // including inventory items with containerId 0
                  />
                ))}
              </div>
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  )
}
