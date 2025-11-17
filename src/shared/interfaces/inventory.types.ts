export interface Inventory {
  inventoryItems: ConvertedItem[]
  containerItems: Record<string, ConvertedItem[]>
}

export interface ConvertedItem {
  id?: string
  hashName?: string
  customName?: string
  rarity?: Rarity
  quality?: Quality
  imagePath?: string
  price?: number
  isStorageUnit: boolean
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
