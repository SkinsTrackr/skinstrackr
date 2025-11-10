import GlobalOffensive from 'globaloffensive'

export function isContainer(item: GlobalOffensive.InventoryItem): boolean {
  return item.casket_contained_item_count !== undefined
}
