import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel
} from './ui/dropdown-menu'
import { FC, Dispatch, SetStateAction } from 'react'
import { Button } from './ui/button'
import { getSortByLabel, getSortDirLabel, ItemListFilter } from '@/lib/item-list-filter'

interface ItemSortMenuProps {
  itemFilter: ItemListFilter
  setItemFilter: Dispatch<SetStateAction<ItemListFilter>>
}

export const ItemSortMenu: FC<ItemSortMenuProps> = ({ itemFilter, setItemFilter }) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">Sort</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="start">
        {/* Misc grouping */}
        <DropdownMenuLabel>Type</DropdownMenuLabel>
        <DropdownMenuGroup>
          <DropdownMenuCheckboxItem
            onSelect={(event) => event.preventDefault()}
            checked={itemFilter.sort?.sortBy === 'name'}
            onCheckedChange={(checked) => {
              setItemFilter((prev) => ({
                ...prev,
                sort: checked ? { sortBy: 'name', sortDir: prev.sort.sortDir } : prev.sort
              }))
            }}
          >
            {getSortByLabel('name')}
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            onSelect={(event) => event.preventDefault()}
            checked={itemFilter.sort.sortBy === 'rarity'}
            onCheckedChange={(checked) => {
              setItemFilter((prev) => ({
                ...prev,
                sort: checked ? { sortBy: 'rarity', sortDir: prev.sort.sortDir } : prev.sort
              }))
            }}
          >
            {getSortByLabel('rarity')}
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            onSelect={(event) => event.preventDefault()}
            checked={itemFilter.sort.sortBy === 'singleValue'}
            onCheckedChange={(checked) => {
              setItemFilter((prev) => ({
                ...prev,
                sort: checked ? { sortBy: 'singleValue', sortDir: prev.sort.sortDir } : prev.sort
              }))
            }}
          >
            {getSortByLabel('singleValue')}
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            onSelect={(event) => event.preventDefault()}
            checked={itemFilter.sort.sortBy === 'groupedValue'}
            onCheckedChange={(checked) => {
              setItemFilter((prev) => ({
                ...prev,
                sort: checked ? { sortBy: 'groupedValue', sortDir: prev.sort.sortDir } : prev.sort
              }))
            }}
          >
            {getSortByLabel('groupedValue')}
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            onSelect={(event) => event.preventDefault()}
            checked={itemFilter.sort.sortBy === 'groupedCount'}
            onCheckedChange={(checked) => {
              setItemFilter((prev) => ({
                ...prev,
                sort: checked ? { sortBy: 'groupedCount', sortDir: prev.sort.sortDir } : prev.sort
              }))
            }}
          >
            {getSortByLabel('groupedCount')}
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            onSelect={(event) => event.preventDefault()}
            checked={itemFilter.sort.sortBy === 'floatValue'}
            onCheckedChange={(checked) => {
              setItemFilter((prev) => ({
                ...prev,
                sort: checked ? { sortBy: 'floatValue', sortDir: prev.sort.sortDir } : prev.sort
              }))
            }}
            // disabled={itemFilter.groupBy === 'allItemsByName'}
          >
            {getSortByLabel('floatValue')}
          </DropdownMenuCheckboxItem>
        </DropdownMenuGroup>
        {/* Sort direction */}
        <DropdownMenuLabel>Direction</DropdownMenuLabel>
        <DropdownMenuCheckboxItem
          onSelect={(event) => event.preventDefault()}
          checked={itemFilter.sort.sortDir === 'asc'}
          onCheckedChange={(checked) => {
            setItemFilter((prev) => ({
              ...prev,
              sort: checked ? { sortBy: prev.sort.sortBy, sortDir: 'asc' } : prev.sort
            }))
          }}
        >
          {getSortDirLabel('asc')}
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          onSelect={(event) => event.preventDefault()}
          checked={itemFilter.sort.sortDir === 'desc'}
          onCheckedChange={(checked) => {
            setItemFilter((prev) => ({
              ...prev,
              sort: checked ? { sortBy: prev.sort.sortBy, sortDir: 'desc' } : prev.sort
            }))
          }}
        >
          {getSortDirLabel('desc')}
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
