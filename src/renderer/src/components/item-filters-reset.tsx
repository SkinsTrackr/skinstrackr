import { FC, Dispatch, SetStateAction } from 'react'
import { Button } from './ui/button'
import { ItemListFilter } from '@/lib/item-list-filter'

interface ItemFiltersResetProps {
  setItemFilter: Dispatch<SetStateAction<ItemListFilter>>
  defaultFilters: ItemListFilter
  isNotDefaultFilters: boolean
}

export const ItemFiltersReset: FC<ItemFiltersResetProps> = ({ setItemFilter, defaultFilters, isNotDefaultFilters }) => {
  const handleClearAll = (): void => {
    setItemFilter(defaultFilters)
  }

  return (
    <div className="flex flex-wrap items-center">
      <Button
        variant="secondary"
        size="sm"
        onClick={handleClearAll}
        className={`h-8 px-3 text-xs`}
        disabled={!isNotDefaultFilters}
      >
        Reset
      </Button>
    </div>
  )
}
