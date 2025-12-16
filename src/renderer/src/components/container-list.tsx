import { ScrollArea } from '@/components/ui/scroll-area'
import { FC, useState, useMemo, useEffect } from 'react'
import { InputGroup, InputGroupAddon, InputGroupInput } from './ui/input-group'
import { ChevronsLeft, ChevronsUp, Search } from 'lucide-react'
import { ConvertedInventory, ConvertedItem, TransferItems } from '@shared/interfaces/inventory.types'
import { Separator } from './ui/separator'
import { ContainerCard } from './container-card'
import { Card, CardContent } from './ui/card'

interface StorageUnitsListProps {
  inventory: ConvertedInventory
  transfer: TransferItems
  setTransfer: React.Dispatch<React.SetStateAction<TransferItems>>
}

// const colorBlueOpaque = 'rgba(59, 130, 246, 0.1)'
const colorBlueOpaque = 'rgba(234, 88, 12, 0.1)'
const colorOrangeOpaque = 'rgba(234, 88, 12, 0.1)'

const getDiagonalStripedStyle = (type: 'insert' | 'retrieve') => ({
  className: `rounded-lg relative flex flex-col gap-2 p-3 border-2 ${type === 'retrieve' ? 'border-orange-600' : 'border-orange-600'}`,
  style: {
    backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 5px, ${type === 'retrieve' ? colorBlueOpaque : colorOrangeOpaque} 5px, ${type === 'retrieve' ? colorBlueOpaque : colorOrangeOpaque} 10px)`,
    borderStyle: 'dashed'
  } as React.CSSProperties
})

export const StorageUnitsList: FC<StorageUnitsListProps> = ({ inventory, transfer, setTransfer }) => {
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

  useEffect(() => {
    if (transfer.mode === 'toInventory') {
      setTransfer((prev) => ({
        ...prev,
        fromContainerIds: [],
        toContainerId: 0
      }))
    } else if (transfer?.mode === 'toContainer') {
      setTransfer((prev) => ({
        ...prev,
        fromContainerIds: [0],
        toContainerId: -1,
        selectedItems: {}
      }))
    }
  }, [transfer.mode, setTransfer])

  // We "fake" a container for the main inventory
  const inventoryContainer: ConvertedItem = {
    id: 0,
    customName: 'Inventory',
    isStorageUnit: true,
    containerId: 0,
    tradable: false
  }

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
            {filteredUnits.length}/{storageUnits.length}
          </InputGroupAddon>
        </InputGroup>
      </div>
      <ScrollArea className="flex-1 min-h-0 mt-5" type="auto">
        {/* Insert into container card */}
        <div className="flex flex-col gap-2 mr-4 pl-0.5">
          {transfer.mode === 'toInventory' && (
            <div {...getDiagonalStripedStyle('insert')}>
              <ContainerCard
                key={0}
                container={inventoryContainer}
                count={inventory.inventoryItems.length}
                transfer={transfer}
                setTransfer={setTransfer}
              />
            </div>
          )}
          {transfer.mode === 'toContainer' && (
            <div {...getDiagonalStripedStyle('insert')}>
              {selectedUnits.length === 0 && (
                <Card className="opacity-80">
                  <CardContent className="flex items-center gap-3 px-2 h-8 relative">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">Select a container</span>
                      <span className="text-xs text-muted-foreground pt-1">to insert items into</span>
                    </div>
                    <div className="absolute right-3 h-14 w-8 bg-muted-foreground/20 rounded-sm flex items-center justify-center">
                      <ChevronsLeft className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              )}
              {selectedUnits.map((unit) => (
                <ContainerCard
                  key={unit.id}
                  container={unit}
                  count={inventory.containerItems[unit.id || '']?.length || 0}
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
              count={inventory.inventoryItems.length}
              transfer={transfer}
              setTransfer={setTransfer}
            />
          )}
          {transfer.mode === null && <Separator />}
          {transfer.mode !== null && <ChevronsUp className="mx-auto text-yellow-500" strokeWidth={2} />}
          {/* Retrieve from container cards */}
          {transfer.mode === 'toContainer' && (
            <>
              <div {...getDiagonalStripedStyle('retrieve')}>
                <ContainerCard
                  key={transfer.fromContainerIds[0]}
                  container={inventoryContainer}
                  count={inventory.inventoryItems.length}
                  transfer={transfer}
                  setTransfer={setTransfer}
                />
              </div>
              {unselectedUnits.map((unit) => (
                <ContainerCard
                  key={unit.id}
                  container={unit}
                  count={inventory.containerItems[unit.id || '']?.length || 0}
                  transfer={transfer}
                  setTransfer={setTransfer}
                />
              ))}
            </>
          )}
          {transfer.mode === 'toInventory' && (
            <>
              <div {...getDiagonalStripedStyle('retrieve')}>
                {Object.keys(transfer.selectedItems || {}).length === 0 && (
                  <Card className="opacity-80">
                    <CardContent className="flex items-center gap-3 px-2 h-8 relative">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">Select items</span>
                        <span className="text-xs text-muted-foreground pt-1">to transfer to inventory</span>
                      </div>
                    </CardContent>
                  </Card>
                )}
                {transfer.selectedItems &&
                  Object.keys(transfer.selectedItems).length > 0 &&
                  Object.keys(transfer.selectedItems)
                    .map((unit) => filteredUnits.find((u) => u.id?.toString() === unit))
                    .filter((unit): unit is ConvertedItem => unit !== undefined)
                    .sort((a, b) => (selectedUnits.includes(a) && !selectedUnits.includes(b) ? -1 : 1))
                    .map((unit) => (
                      <ContainerCard
                        key={unit.id}
                        container={unit}
                        count={inventory.containerItems[unit.id || '']?.length || 0}
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
                  count={inventory.containerItems[unit.id || '']?.length || 0}
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
                  count={inventory.containerItems[unit.id || '']?.length || 0}
                  transfer={transfer}
                  setTransfer={setTransfer}
                />
              ))}
        </div>
      </ScrollArea>
    </div>
  )
}
