import { ScrollArea } from '@/components/ui/scroll-area'
import { FC, useState, useMemo } from 'react'
import { InputGroup, InputGroupAddon, InputGroupInput } from './ui/input-group'
import { ChevronsRight, ChevronsLeft, Search } from 'lucide-react'
import { ConvertedInventory, ConvertedItem } from '@shared/interfaces/inventory.types'
import { Separator } from './ui/separator'
import { ContainerCard } from './container-card'
import { Card, CardContent } from './ui/card'

interface StorageUnitsListProps {
  inventory: ConvertedInventory
  selectedUnitsId: number[]
  setSelectedUnitsId: React.Dispatch<React.SetStateAction<number[]>>
  transferModeActive: boolean
}

const colorBlueOpaque = 'rgba(59, 130, 246, 0.1)'
const colorBlueSolid = 'rgba(59, 130, 246, 0.9)'
const colorOrangeOpaque = 'rgba(234, 88, 12, 0.1)'
const colorOrangeSolid = 'rgba(234, 88, 12, 0.9)'

export const StorageUnitsList: FC<StorageUnitsListProps> = ({
  inventory,
  selectedUnitsId,
  setSelectedUnitsId,
  transferModeActive
}) => {
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

  const selectedUnits = useMemo(
    () => filteredUnits.filter((unit) => unit.id && selectedUnitsId.includes(unit.id)),
    [filteredUnits, selectedUnitsId]
  )

  const unselectedUnits = useMemo(
    () => filteredUnits.filter((unit) => !unit.id || !selectedUnitsId.includes(unit.id)),
    [filteredUnits, selectedUnitsId]
  )

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
        <div className="flex flex-col gap-2 mr-4 pl-0.5">
          {transferModeActive && (
            <div
              className="rounded-lg relative flex flex-col gap-2 p-3 border-2 border-orange-600"
              style={{
                backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 5px, ${colorOrangeOpaque} 5px, ${colorOrangeOpaque} 10px)`,
                borderStyle: 'dashed'
              }}
            >
              {/* <ChevronsRight
                className="absolute -right-6 top-8 h-10 w-10 pointer-events-none"
                style={{ color: colorOrangeSolid }}
              /> */}
              <ContainerCard
                key={0}
                container={inventoryContainer}
                count={inventory.inventoryItems.length}
                selectedUnitsId={selectedUnitsId}
                setSelectedUnitsId={setSelectedUnitsId}
              />
            </div>
          )}
          {!transferModeActive && (
            <ContainerCard
              key={0}
              container={inventoryContainer}
              count={inventory.inventoryItems.length}
              selectedUnitsId={selectedUnitsId}
              setSelectedUnitsId={setSelectedUnitsId}
            />
          )}
          <Separator />
          {transferModeActive && (
            <div
              className="rounded-lg relative flex flex-col gap-2 p-3 border-2 border-blue-500"
              style={{
                backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 5px, ${colorBlueOpaque} 5px, ${colorBlueOpaque} 10px)`,
                borderStyle: 'dashed'
              }}
            >
              {selectedUnits.length === 0 && (
                <Card className="opacity-70">
                  <CardContent className="flex items-center gap-3 px-2 h-8">
                    <div className="h-15 w-10 bg-muted-foreground/20 rounded-sm flex items-center justify-center">
                      <ChevronsRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">Select a container</span>
                      <span className="text-xs text-muted-foreground pt-1">to insert items into</span>
                    </div>
                  </CardContent>
                </Card>
              )}
              {/* <ChevronsLeft
                className="absolute -right-6 top-8 h-10 w-10 pointer-events-none"
                style={{ color: colorBlueSolid }}
              /> */}
              {selectedUnits.map((unit) => (
                <ContainerCard
                  key={unit.id}
                  container={unit}
                  count={inventory.containerItems[unit.id || '']?.length || 0}
                  selectedUnitsId={selectedUnitsId}
                  setSelectedUnitsId={setSelectedUnitsId}
                />
              ))}
            </div>
          )}
          {!transferModeActive &&
            selectedUnits.length > 0 &&
            selectedUnits.map((unit) => (
              <ContainerCard
                key={unit.id}
                container={unit}
                count={inventory.containerItems[unit.id || '']?.length || 0}
                selectedUnitsId={selectedUnitsId}
                setSelectedUnitsId={setSelectedUnitsId}
              />
            ))}
          {unselectedUnits.map((unit) => (
            <ContainerCard
              key={unit.id}
              container={unit}
              count={inventory.containerItems[unit.id || '']?.length || 0}
              selectedUnitsId={selectedUnitsId}
              setSelectedUnitsId={setSelectedUnitsId}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
