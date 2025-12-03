import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuGroup,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator
} from './ui/dropdown-menu'
import { Quality, Rarity } from '@shared/interfaces/inventory.types'
import { FC, Dispatch, SetStateAction } from 'react'
import { Button } from './ui/button'
import { ItemListFilter } from '@/lib/item-list-filter'

interface ItemFilterMenuProps {
  itemFilter: ItemListFilter
  setItemFilter: Dispatch<SetStateAction<ItemListFilter>>
  rarities: Record<string, Rarity>
  qualities: Record<string, Quality>
}

export const ItemFilterMenu: FC<ItemFilterMenuProps> = ({ itemFilter, setItemFilter, rarities, qualities }) => {
  return (
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
            checked={itemFilter.filters?.showTradable}
            onCheckedChange={(checked) => {
              setItemFilter((prev) => ({
                ...prev,
                filters: {
                  ...prev.filters,
                  showTradable: checked
                }
              }))
            }}
          >
            Tradable
          </DropdownMenuCheckboxItem>
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
          {Object.keys(rarities).map((rarityKey) => {
            if (rarityKey == '99') return null // skip unused rarity
            const rarity = rarities[rarityKey]
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
          {Object.keys(qualities).map((qualityKey) => {
            if (
              qualityKey == '0' ||
              qualityKey == '1' ||
              qualityKey == '2' ||
              //   qualityKey == '4' ||
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
            const quality = qualities[qualityKey]
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
  )
}
