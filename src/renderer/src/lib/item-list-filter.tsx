import { FilteredItem } from '@/components/item-list'
import { ConvertedItem } from '@shared/interfaces/inventory.types'

export type sortByOption = 'name' | 'rarity' | 'groupedValue' | 'singleValue' | 'groupedCount' | 'floatValue'
export type sortDirOption = 'asc' | 'desc'
export type groupByOption = 'nonFloatItemsByName' | 'allItemsByName'

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
    case 'groupedCount':
      return 'Grouped Item Count'
    case 'floatValue':
      return 'Float Value'
    default:
      return 'Unknown'
  }
}

export function getGroupByLabel(option: groupByOption | undefined): string {
  switch (option) {
    case 'nonFloatItemsByName':
      return 'Name (Non-float Items)'
    case 'allItemsByName':
      return 'Name (All items)'
    default:
      return 'Unknown'
  }
}

export function getSortDirLabel(option: sortDirOption, short: boolean): string {
  switch (option) {
    case 'asc':
      return short ? 'Asc' : 'Ascending'
    case 'desc':
      return short ? 'Desc' : 'Descending'
    default:
      return 'Unknown'
  }
}

export type ItemListFilter = {
  filters: {
    containerIds?: number[] // ContainerId=0 for root-level items
    query: string
    rarities: string[] // index
    qualities: string[] // index
    showNonTradable: boolean // non-tradable items
    showTradable: boolean // tradable items
  }
  sort: {
    sortBy: sortByOption
    sortDir: sortDirOption
  }
  groupBy?: groupByOption
}

export function applyContainerFilter(items: ConvertedItem[], filter: ItemListFilter): ConvertedItem[] {
  const f = filter.filters
  if (!f) return items

  if (f.containerIds && f.containerIds.length > 0) {
    items = items.filter((item) => {
      return f.containerIds?.includes(Number(item.containerId))
    })
  }

  return items
}

export function applyFilters(items: ConvertedItem[], filter: ItemListFilter): ConvertedItem[] {
  const f = filter.filters
  if (!f) return items

  if (f.query.trim().length > 0) {
    const queryLower = f.query.toLowerCase()
    items = items.filter((item) => {
      return item.hashName?.toLowerCase().includes(queryLower) || item.customName?.toLowerCase().includes(queryLower)
    })
  }
  if (f.rarities.length > 0) {
    items = items.filter((item) => {
      return f.rarities.some((r) => r === item.rarity)
    })
  }
  if (f.qualities.length > 0) {
    items = items.filter((item) => {
      return f.qualities.some((q) => q === item.quality)
    })
  }
  if (f.showNonTradable || f.showTradable) {
    items = items.filter((item) => item.tradable === f.showTradable || item.tradable !== f.showNonTradable)
  }
  return items
}

export function applyGrouping(items: ConvertedItem[], groupBy: ItemListFilter): FilteredItem[] {
  const g = groupBy.groupBy
  if (!g) {
    return items.map((item) => ({ name: item.hashName || item.customName || 'Unknown Item', items: [item] }))
  }

  switch (g) {
    case 'nonFloatItemsByName': {
      const itemsss = items.reduce((groups, item) => {
        const itemName = item.hashName || item.customName || 'Unknown Item'
        if (item.float !== undefined) groups.push({ name: itemName, items: [item] })
        else
          groups.find((group) => group.name === itemName)?.items.push(item) ||
            groups.push({ name: itemName, items: [item] })

        return groups
      }, [] as FilteredItem[])
      return itemsss
    }

    case 'allItemsByName':
      return items.reduce((groups, item) => {
        const itemName = item.hashName || item.customName || 'Unknown Item'
        groups.find((group) => group.name === itemName)?.items.push(item) ||
          groups.push({ name: itemName, items: [item] })

        return groups
      }, [] as FilteredItem[])
  }
}

export function applySorting(items: FilteredItem[], sortBy: ItemListFilter): FilteredItem[] {
  const s = sortBy.sort
  if (!s) return items

  return items.sort((a, b) => {
    const itemA = a.items[0]
    const itemB = b.items[0]
    let compare = 0
    switch (s.sortBy) {
      case 'name':
        compare = (a.name || '').localeCompare(b.name || '')
        break
      case 'rarity': {
        // Convert rarity indices to numbers for proper numeric sorting
        compare = Number(itemA.rarity || 0) - Number(itemB.rarity || 0)
        break
      }
      case 'singleValue':
        compare = (itemA.price || 0) - (itemB.price || 0)
        break
      case 'groupedValue':
        compare = (itemA.price || 0) * a.items.length - (itemB.price || 0) * b.items.length
        break
      case 'groupedCount':
        compare = a.items.length - b.items.length
        break
      case 'floatValue': {
        const floatA = itemA.float !== undefined ? itemA.float : s.sortDir === 'asc' ? 1 : 0
        const floatB = itemB.float !== undefined ? itemB.float : s.sortDir === 'asc' ? 1 : 0
        compare = floatA - floatB
        break
      }
    }

    return s.sortDir === 'asc' ? compare : -compare
  })
}
