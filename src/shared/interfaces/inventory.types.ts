import GlobalOffensive from 'globaloffensive'

/**
 * State types for transferring items between inventory and containers
 */
export type TransferMode = 'toInventory' | 'toContainer' | null
export type TransferItems = {
  mode: TransferMode
  fromContainerIds: number[] // TODO: Can remove and just use the filter.containerIds
  toContainerId: number
  selectedItems: Record<number, number[]> // k=containerId, v=array of item ids
}

/**
 * Raw container data as received from cs2
 * with extra metadata.
 * id = 0 represents the root inventory
 * Should only be used in backend
 */
export interface RawContainer {
  id: number
  container: GlobalOffensive.InventoryItem // The container item itself
  items: GlobalOffensive.InventoryItem[]
  lastRefresh: number // Timestamp of last refresh on skinstrackr (in ms)
  lastModification: number // Timestamp of last insert, retrieve, rename, ... action on this container (in ms)
}

/**
 * Raw inventory data as received from cs2
 * Should only be used in backend
 */
export interface RawInventory {
  inventory: RawContainer
  containers: RawContainer[]
  lastRefresh: number // Timestamp of latest inventory refresh (1 container or whole inventory) (in ms)
}

/**
 * Converted inventory data with additional metadata
 * Used by frontend
 */
export interface ConvertedInventory {
  inventory: ConvertedContainer
  containers: ConvertedContainer[]
  lastRefresh: number // Timestamp of latest inventory refresh (1 container or whole inventory) (in ms)
  qualities: Record<string, Quality> // k=index
  rarities: Record<string, Rarity> // k=index
}

/**
 * Converted container data with additional metadata
 * containerId = 0 represents the root inventory
 * Used by frontend
 */
export interface ConvertedContainer {
  id: number // "0" for root inventory
  container: ConvertedItem // The container item itself
  lastRefresh: number // Timestamp of last refresh on skinstrackr (in ms)
  lastModification: number // Timestamp of last insert, retrieve, rename, ... action on this container (in ms)
  items: ConvertedItem[] // For id=0, this list does not include storage units
}

export interface ConvertedItem {
  id?: number
  hashName?: string
  customName?: string
  type?: string
  rarity?: string // index
  quality?: string // index
  imagePath?: string
  price?: number
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
  type?: string
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

export interface Highlight {
  index: string
  data_name: string
  name?: string
}

export interface ItemPrice {
  market_hash_name: string
  price: number
}
