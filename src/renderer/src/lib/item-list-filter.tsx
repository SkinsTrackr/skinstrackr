import { FilteredItem } from '@/components/item-list'
import { ConvertedItem } from '@shared/interfaces/inventory.types'

export type sortByOption = 'name' | 'rarity' | 'groupedValue' | 'singleValue'
export type sortDirOption = 'asc' | 'desc'
export type groupByOption = 'nameCommonItems' | 'nameAllItems' | 'none'

export function getSortByLabel(option: sortByOption): string {
  switch (option) {
    case 'name':
      return 'Name'
    case 'rarity':
      return 'Rarity'
    case 'singleValue':
      return 'Single Item Value'
    case 'groupedValue':
      return 'Grouped Item Value'
    default:
      return 'Unknown'
  }
}

export function getGroupByLabel(option: groupByOption): string {
  switch (option) {
    case 'nameCommonItems':
      return 'Name (Common Items Separated)'
    case 'nameAllItems':
      return 'Name (All Items Grouped)'
    case 'none':
      return 'No Grouping'
    default:
      return 'Unknown'
  }
}

export function getSortDirLabel(option: sortDirOption): string {
  switch (option) {
    case 'asc':
      return 'Ascending'
    case 'desc':
      return 'Descending'
    default:
      return 'Unknown'
  }
}

export type ItemListFilter = {
  filters?: {
    containerIds?: number[] // ContainerId=0 for root-level items
    query?: string
    rarities?: string[] // index
    qualities?: string[] // index
    showNonTradable?: boolean // tradable items
  }
  sort?: {
    sortBy: sortByOption
    sortDir: sortDirOption
  }
  groupBy?: groupByOption
}

export function applyFilters(items: ConvertedItem[], filter: ItemListFilter): ConvertedItem[] {
  console.log('Applying filters:', filter)
  const f = filter.filters
  if (!f) return items

  if (f.containerIds && f.containerIds.length > 0) {
    items = items.filter((item) => {
      return f.containerIds?.includes(Number(item.containerId))
    })
  }
  if (f.query && f.query.trim().length > 0) {
    const queryLower = f.query.toLowerCase()
    items = items.filter((item) => {
      return item.hashName?.toLowerCase().includes(queryLower) || item.customName?.toLowerCase().includes(queryLower)
    })
  }
  if (f.rarities && f.rarities.length > 0) {
    items = items.filter((item) => {
      return item.rarity !== undefined && f.rarities?.some((r) => r === item.rarity)
    })
  }
  if (f.qualities && f.qualities.length > 0) {
    items = items.filter((item) => {
      return item.quality !== undefined && f.qualities?.some((q) => q === item.quality)
    })
  }
  if (f.showNonTradable !== undefined) {
    items = items.filter((item) => item.tradable !== f.showNonTradable)
  }
  return items
}

export function applySorting(items: ConvertedItem[], sortBy: ItemListFilter): ConvertedItem[] {
  const s = sortBy.sort
  if (!s) return items

  return items.sort((a, b) => {
    let compare = 0
    switch (s.sortBy) {
      case 'name':
        compare = (a.hashName || '').localeCompare(b.hashName || '')
        break
      case 'rarity':
        compare = (a.rarity || '').localeCompare(b.rarity || '')
        break
      case 'singleValue':
        compare = (a.price || 0) - (b.price || 0)
        break
      case 'groupedValue':
        compare = (a.price || 0) - (b.price || 0)
        break
    }

    return s.sortDir === 'asc' ? compare : -compare
  })
}

export function applyGrouping(items: ConvertedItem[], groupBy: ItemListFilter): FilteredItem[] {
  const g = groupBy.groupBy
  if (!g || g === 'none') {
    return items.map((item) => ({ name: item.hashName || item.customName || 'Unknown Item', items: [item] }))
  }

  switch (g) {
    case 'nameCommonItems':
      return items.reduce((groups, item) => {
        const itemName = item.hashName || item.customName || 'Unknown Item'
        if (item.float) groups.push({ name: itemName, items: [item] })
        else
          groups.find((group) => group.name === itemName)?.items.push(item) ||
            groups.push({ name: itemName, items: [item] })

        return groups
      }, [] as FilteredItem[])

    case 'nameAllItems':
      return items.reduce((groups, item) => {
        const itemName = item.hashName || item.customName || 'Unknown Item'
        groups.find((group) => group.name === itemName)?.items.push(item) ||
          groups.push({ name: itemName, items: [item] })

        return groups
      }, [] as FilteredItem[])
  }
}
