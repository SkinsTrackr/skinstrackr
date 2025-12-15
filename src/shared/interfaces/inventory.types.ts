import GlobalOffensive from 'globaloffensive'

/**
 * State types for transferring items between inventory and containers
 */
export type TransferMode = 'toInventory' | 'toContainer' | null
export type TransferItems = {
  mode: TransferMode
  fromContainerIds: number[]
  toContainerId: number
  itemIds: number[]
}

/**
 * Raw inventory data as received from cs2
 * Should only be used in backend
 */
export interface RawInventory {
  items: GlobalOffensive.InventoryItem[]
  lastRefresh: number // Timestamp of last inventory refresh
}

/**
 * Converted inventory data with additional metadata
 * Used by frontend
 */
export interface ConvertedInventory {
  inventoryItems: ConvertedItem[]
  containerItems: Record<number, ConvertedItem[]> // k=containerId
  lastRefresh: number // Timestamp of last inventory refresh
  qualities: Record<string, Quality> // k=index
  rarities: Record<string, Rarity> // k=index
}

export interface ConvertedItem {
  id?: number
  hashName?: string
  customName?: string
  rarity?: string // index
  quality?: string // index
  imagePath?: string
  price?: number
  isStorageUnit: boolean
  containerId: number // ID of the container this item is in, "0" for root-level items
  tradable: boolean // Whether the item is tradable at all
  float?: number
}

export interface Rarity {
  index: string
  data_name: string
  name_default: string
  name_weapon: string
  name_character: string
  color: string
}

export interface Quality {
  index: string
  data_name: string
  name: string
  color: string
}

export interface CommonItem {
  index: string
  data_name: string
  name?: string
  image_path?: string
}

export interface Paint {
  index: string
  data_name: string
  name?: string
}

export interface GraffitiPaint {
  index: string
  data_name: string
  name?: string
}

export interface Sticker {
  index: string
  data_name: string
  name?: string
  image_path?: string
}

export interface MusicKit {
  index: string
  data_name: string
  name?: string
  image_path?: string
}

export interface Charm {
  index: string
  data_name: string
  name?: string
  image_path?: string
}

export interface ItemPrice {
  market_hash_name: string
  price: number
}
