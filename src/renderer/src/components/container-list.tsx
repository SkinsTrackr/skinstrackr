import { ScrollArea } from '@/components/ui/scroll-area'
import { FC, useState, useMemo } from 'react'
import { InputGroup, InputGroupAddon, InputGroupInput } from './ui/input-group'
import { ChevronsUp, Search, Package, Gem } from 'lucide-react'
import { ConvertedContainer, ConvertedInventory, TransferItems } from '@shared/interfaces/inventory.types'
import { Separator } from './ui/separator'
import { ContainerCard } from './container-card'
import { Card, CardContent } from './ui/card'
import { cn } from '@/lib/utils'

interface StorageUnitsListProps {
  inventory: ConvertedInventory
  transfer: TransferItems
  setTransfer: React.Dispatch<React.SetStateAction<TransferItems>>
}

const colorYellowOpaque = 'rgba(234, 179, 8, 0.08)'

const getTransferAreaStyle = (
  type: 'insert' | 'retrieve'
): {
  className: string
  style: React.CSSProperties
} => ({
  className: cn(
    'rounded-lg relative flex flex-col gap-2 p-2.5 border-2 transition-all',
    type === 'retrieve' ? 'border-yellow-500/50' : 'border-yellow-500/50'
  ),
  style: {
    backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 8px, ${colorYellowOpaque} 8px, ${colorYellowOpaque} 16px)`,
    borderStyle: 'dashed'
  } as React.CSSProperties
})

export const StorageUnitsList: FC<StorageUnitsListProps> = ({ inventory, transfer, setTransfer }) => {
  const [searchQuery, setSearchQuery] = useState('')
  const inventoryContainer: ConvertedContainer = useMemo(() => {
    const containers = inventory.containers.map((cont) => cont.container)
    return {
      ...inventory.inventory,
      items: [...inventory.inventory.items, ...containers]
    }
  }, [inventory.inventory, inventory.containers])
  const storageContainers: ConvertedContainer[] = useMemo(() => inventory.containers, [inventory.containers])

  const filteredUnits = useMemo(
    () =>
      storageContainers
        .filter((unit) => (unit.container.customName || '').toLowerCase().includes(searchQuery.toLowerCase()))
        .sort((a, b) => (a.container.customName || '').localeCompare(b.container.customName || '')),
    [searchQuery, storageContainers]
  )

  const selectedUnits = useMemo(() => {
    if (transfer.mode === 'toContainer') {
      return filteredUnits.filter((unit) => unit.id! === transfer.toContainerId)
    }

    return filteredUnits.filter((unit) => transfer.fromContainerIds.includes(unit.id!))
  }, [filteredUnits, transfer.fromContainerIds, transfer.toContainerId, transfer.mode])

  const unselectedUnits = useMemo(
    () => filteredUnits.filter((unit) => !unit.id || !transfer.fromContainerIds.includes(unit.id)),
    [filteredUnits, transfer.fromContainerIds]
  )

  return (
    <div className="w-60 flex flex-col h-full">
      <div className="pr-4 pl-0.5">
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
            {filteredUnits.length}/{storageContainers.length}
          </InputGroupAddon>
        </InputGroup>
      </div>
      <ScrollArea className="flex-1 min-h-0 mt-5" type="hover">
        {/* Insert into container card */}
        <div className="flex flex-col gap-2 mr-4 pl-0.5">
          {transfer.mode === 'toInventory' && (
            <div {...getTransferAreaStyle('insert')}>
              <ContainerCard
                key={0}
                container={inventoryContainer}
                count={inventoryContainer.items.length}
                transfer={transfer}
                setTransfer={setTransfer}
              />
            </div>
          )}
          {transfer.mode === 'toContainer' && (
            <div {...getTransferAreaStyle('insert')}>
              {selectedUnits.length === 0 && (
                <Card className="bg-card/50 backdrop-blur-sm border-dashed shadow-sm">
                  <CardContent className="flex items-center gap-3 px-3 relative">
                    <div className="rounded-md bg-yellow-500/10 p-1.5 flex-shrink-0">
                      <Package className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />
                    </div>
                    <div className="flex flex-col flex-1">
                      <span className="text-sm font-semibold text-foreground">Select container</span>
                      <span className="text-xs text-muted-foreground">to insert items into</span>
                    </div>
                  </CardContent>
                </Card>
              )}
              {selectedUnits.map((unit) => (
                <ContainerCard
                  key={unit.id}
                  container={unit}
                  count={unit.items.length || 0}
                  transfer={transfer}
                  setTransfer={setTransfer}
                />
              ))}
            </div>
          )}
          {/* Inventory card */}
          {transfer.mode === null && (
            <ContainerCard
              key={0}
              container={inventoryContainer}
              count={inventoryContainer.items.length}
              transfer={transfer}
              setTransfer={setTransfer}
            />
          )}
          {transfer.mode === null && <Separator />}
          {transfer.mode !== null && (
            <div className="flex items-center gap-2 my-1">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-yellow-500/30 to-transparent" />
              <ChevronsUp className="h-6 w-6 text-yellow-500 flex-shrink-0" strokeWidth={2} />
              <ChevronsUp className="h-6 w-6 text-yellow-500 flex-shrink-0" strokeWidth={2} />
              <ChevronsUp className="h-6 w-6 text-yellow-500 flex-shrink-0" strokeWidth={2} />
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-yellow-500/30 to-transparent" />
            </div>
          )}
          {/* Retrieve from container cards */}
          {transfer.mode === 'toContainer' && (
            <>
              <div {...getTransferAreaStyle('retrieve')}>
                <ContainerCard
                  key={transfer.fromContainerIds[0]}
                  container={inventoryContainer}
                  count={inventoryContainer.items.length}
                  transfer={transfer}
                  setTransfer={setTransfer}
                />
              </div>
              {unselectedUnits.map((unit) => (
                <ContainerCard
                  key={unit.id}
                  container={unit}
                  count={unit.items.length || 0}
                  transfer={transfer}
                  setTransfer={setTransfer}
                />
              ))}
            </>
          )}
          {transfer.mode === 'toInventory' && (
            <>
              <div {...getTransferAreaStyle('retrieve')}>
                {Object.keys(transfer.selectedItems || {}).length === 0 && (
                  <Card className="bg-card/50 backdrop-blur-sm border-dashed shadow-sm">
                    <CardContent className="flex items-center gap-3 px-3 relative">
                      <div className="rounded-md bg-yellow-500/10 p-1.5 flex-shrink-0">
                        <Gem className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />
                      </div>
                      <div className="flex flex-col flex-1">
                        <span className="text-sm font-semibold text-foreground">Select items</span>
                        <span className="text-xs text-muted-foreground">to retrieve</span>
                      </div>
                    </CardContent>
                  </Card>
                )}
                {transfer.selectedItems &&
                  Object.keys(transfer.selectedItems).length > 0 &&
                  Object.keys(transfer.selectedItems)
                    .map((unit) => filteredUnits.find((u) => u.id?.toString() === unit))
                    .filter((unit) => unit !== undefined)
                    .sort((a, b) => (selectedUnits.includes(a) && !selectedUnits.includes(b) ? -1 : 1))
                    .map((unit) => (
                      <ContainerCard
                        key={unit.id}
                        container={unit}
                        count={unit.items.length || 0}
                        transfer={transfer}
                        setTransfer={setTransfer}
                      />
                    ))}
              </div>
            </>
          )}
          {(transfer.mode == null || transfer.mode == 'toInventory') &&
            selectedUnits.length > 0 &&
            selectedUnits
              .filter((unit) => !Object.keys(transfer.selectedItems || {}).includes(unit.id!.toString()))
              .map((unit) => (
                <ContainerCard
                  key={unit.id}
                  container={unit}
                  count={unit.items.length || 0}
                  transfer={transfer}
                  setTransfer={setTransfer}
                />
              ))}
          {(transfer.mode == null || transfer.mode == 'toInventory') &&
            unselectedUnits
              .filter((unit) => !Object.keys(transfer.selectedItems || {}).includes(unit.id!.toString()))
              .map((unit) => (
                <ContainerCard
                  key={unit.id}
                  container={unit}
                  count={unit.items.length || 0}
                  transfer={transfer}
                  setTransfer={setTransfer}
                />
              ))}
        </div>
      </ScrollArea>
    </div>
  )
}
