import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel
} from './ui/dropdown-menu'
import { FC, Dispatch, SetStateAction } from 'react'
import { getGroupByLabel, ItemListFilter } from '@/lib/item-list-filter'
import { DotButton } from '@/components/ui-extensions/dot-button'
import { Layers } from 'lucide-react'

interface ItemGroupMenuProps {
  itemFilter: ItemListFilter
  setItemFilter: Dispatch<SetStateAction<ItemListFilter>>
  isNotDefaultGroup: boolean
}

export const ItemGroupMenu: FC<ItemGroupMenuProps> = ({ itemFilter, setItemFilter, isNotDefaultGroup }) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <DotButton showDot={isNotDefaultGroup}>
          <Layers />
          Group By
        </DotButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="start">
        {/* Misc grouping */}
        <DropdownMenuLabel>General</DropdownMenuLabel>
        <DropdownMenuGroup>
          <DropdownMenuCheckboxItem
            onSelect={(event) => event.preventDefault()}
            checked={itemFilter.groupBy === 'nonFloatItemsByName'}
            onCheckedChange={(checked) => {
              setItemFilter((prev) => ({
                ...prev,
                groupBy: checked ? 'nonFloatItemsByName' : undefined
              }))
            }}
          >
            {getGroupByLabel('nonFloatItemsByName')}
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            onSelect={(event) => event.preventDefault()}
            checked={itemFilter.groupBy === 'allItemsByName'}
            onCheckedChange={(checked) => {
              setItemFilter((prev) => ({
                ...prev,
                groupBy: checked ? 'allItemsByName' : undefined
              }))
            }}
          >
            {getGroupByLabel('allItemsByName')}
          </DropdownMenuCheckboxItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
