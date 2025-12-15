import { env } from '@shared/env'
import { existsSync, mkdirSync } from 'fs'
import { writeFile } from 'fs/promises'
import GlobalOffensive from 'globaloffensive'
import * as fs from 'fs'
import {
  Charm,
  CommonItem,
  ConvertedItem,
  GraffitiPaint,
  ItemPrice,
  MusicKit,
  Paint,
  Quality,
  Rarity,
  Sticker
} from '@shared/interfaces/inventory.types'

let qualities: Record<string, Quality> = {}
let rarities: Record<string, Rarity> = {}
let charms: Record<string, Charm> = {}
let commonItems: Record<string, CommonItem> = {}
let graffitiTints: Record<string, GraffitiPaint> = {}
let prices: Record<string, ItemPrice> = {}
let musicKits: Record<string, MusicKit> = {}
let paints: Record<string, Paint> = {}
let stickers: Record<string, Sticker> = {}

const DEF_INDEX_STICKER = 1209
const DEF_INDEX_PATCH = 4609
const DEF_INDEX_GRAFFITI1 = 1348
const DEF_INDEX_GRAFFITI2 = 1349
const DEF_INDEX_MUSIC_KIT = 1314
const DEF_INDEX_CHARM = 1355

const ATTRIBUTE_GRAFFITI_TINT = 233
const ATTRIBUTE_MUSIC_KIT_ID = 166
const ATTRIBUTE_CHARM_ID = 299
const ATTRIBUTE_FREE_REWARD_STATUS = 277 // Used to filter out non-tradable items

export async function fetchItemData(): Promise<void> {
  if (!existsSync(env.DATA_DIR)) {
    console.info(`Creating data directory at ./${env.DATA_DIR}`)
    mkdirSync(env.DATA_DIR)
  }

  for (const fileName of env.ITEM_FILES) {
    try {
      const response = await fetch(env.ITEMS_BASE_URL + '/' + fileName)

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`)
      }
      const prices = await response.json()

      await writeFile(env.DATA_DIR + '/' + fileName, JSON.stringify(prices, null, 2), 'utf-8')
      console.log('Fetched items: ' + fileName)
    } catch (error) {
      console.error('Error fetching prices from SteamAPIs:', error)
      throw error
    }
  }

  try {
    console.log('Loading item data from fetched items')
    qualities = JSON.parse(fs.readFileSync(env.QUALITY_DATA_PATH, 'utf-8')) as Record<string, Quality>
    rarities = JSON.parse(fs.readFileSync(env.RARITY_DATA_PATH, 'utf-8')) as Record<string, Rarity>
    charms = JSON.parse(fs.readFileSync(env.CHARM_DATA_PATH, 'utf-8')) as Record<string, Charm>
    commonItems = JSON.parse(fs.readFileSync(env.COMMON_ITEM_DATA_PATH, 'utf-8')) as Record<string, CommonItem>
    graffitiTints = JSON.parse(fs.readFileSync(env.GRAFFITI_TINT_DATA_PATH, 'utf-8')) as Record<string, GraffitiPaint>
    const pricesTemp = JSON.parse(fs.readFileSync(env.PRICE_DATA_PATH, 'utf-8')) as ItemPrice[]
    prices = Object.fromEntries(pricesTemp.map((item) => [item.market_hash_name, item]))
    musicKits = JSON.parse(fs.readFileSync(env.MUSIC_KIT_DATA_PATH, 'utf-8')) as Record<string, MusicKit>
    paints = JSON.parse(fs.readFileSync(env.PAINT_DATA_PATH, 'utf-8')) as Record<string, Paint>
    stickers = JSON.parse(fs.readFileSync(env.STICKER_DATA_PATH, 'utf-8')) as Record<string, Sticker>
  } catch (error) {
    console.error('Failed to load fetched items: ', error)
    throw error
  }
}

export function getQualities(): Record<string, Quality> {
  return qualities
}

export function getRarities(): Record<string, Rarity> {
  return rarities
}

export function convertInventoryItem(item: GlobalOffensive.InventoryItem): ConvertedItem | undefined {
  let hashName: string | undefined = undefined
  let imagePath: string | undefined = undefined
  let dataName: string | undefined = undefined

  // Some items exist in cs2 client but are not part of the actual "inventory"
  // These are often placeholders and hidden, so we skip them
  // E.g. P250 | X-Ray
  if (
    item.inventory === 1 &&
    item.position === 1 &&
    item.casket_id === undefined &&
    readAttribute(item, ATTRIBUTE_FREE_REWARD_STATUS) !== undefined
  ) {
    return undefined
  } else if (item.id !== undefined && item.id.toString().length > 19) {
    return undefined
  }

  const commonItem = commonItems[item.def_index?.toString() || '']

  // Item is sticker or Patch
  if (item.def_index === DEF_INDEX_STICKER || item.def_index === DEF_INDEX_PATCH) {
    const sticker = stickers[item.stickers?.at(0)?.sticker_id || '']
    hashName = sticker ? `${commonItem.name} | ${sticker.name}` : undefined
    imagePath = sticker?.image_path || undefined
    dataName = sticker?.data_name
  }

  // Item is graffiti
  else if (item.def_index === DEF_INDEX_GRAFFITI1 || item.def_index === DEF_INDEX_GRAFFITI2) {
    const graffiti = stickers[item.stickers?.at(0)?.sticker_id || '']
    const tint = graffitiTints[readAttribute(item, ATTRIBUTE_GRAFFITI_TINT) || '']
    const graffitiPrefix = item.def_index === DEF_INDEX_GRAFFITI1 ? 'Sealed ' : ''

    if (tint) {
      hashName =
        graffiti?.name && tint?.name ? `${graffitiPrefix}Graffiti | ${graffiti.name} (${tint.name})` : undefined
    } else {
      hashName = graffiti?.name ? `${graffitiPrefix}Graffiti | ${graffiti.name}` : undefined
    }
    imagePath = graffiti?.image_path || undefined
    dataName = graffiti?.data_name
  }

  // Item is music kit
  else if (item.def_index === DEF_INDEX_MUSIC_KIT) {
    const musicKit = musicKits[readAttribute(item, ATTRIBUTE_MUSIC_KIT_ID) || '']
    const musicKitName = musicKit?.name

    hashName = musicKitName ? `${commonItem.name} | ${musicKitName}` : undefined
    imagePath = musicKit?.image_path || undefined
    dataName = musicKit?.data_name
  }

  // Item is charm
  // NOT TESTED
  else if (item.def_index === DEF_INDEX_CHARM) {
    const charm = charms[readAttribute(item, ATTRIBUTE_CHARM_ID) || '']

    hashName = charm?.name ? `${commonItem.name} | ${charm.name}` : undefined
    imagePath = charm?.image_path || undefined
    dataName = charm?.data_name
  }

  // Item is common item
  else {
    const commonItem = commonItems[item.def_index?.toString() || '']

    hashName = commonItem?.name || undefined
    imagePath = commonItem?.image_path || undefined
    dataName = commonItem?.data_name
  }

  // Potentially add Paint, Wear, Stattrak, Souvenir, etc. to the hash name.
  // BUT only if we found an item match at all
  if (hashName !== undefined) {
    const quality = qualities[item.quality?.toString() || '']
    const isStattrak = item.kill_eater_value !== undefined || item.kill_eater_score_type !== undefined
    const paint = paints[item.paint_index?.toString() || '']

    // Stattrak™
    if (isStattrak) {
      hashName = 'StatTrak™ ' + hashName
    }
    // ★ or Souvenir
    if (quality.index == '3' || quality.index == '12') {
      hashName = quality.name + ' ' + hashName
    }

    if (paint) {
      hashName += ` | ${paint.name}`

      // For weapons with skins and potentially wear condition
      if (imagePath !== undefined && imagePath.includes('econ/weapons/base_weapons')) {
        if (item.paint_wear !== undefined) {
          imagePath = `econ/default_generated/${dataName}_${paint.data_name}_${getWearName('image', item.paint_wear)}`
        } else {
          imagePath = `econ/default_generated/${dataName}_${paint.data_name}`
        }
      }

      if (item.paint_wear !== undefined) {
        hashName += ` (${getWearName('hashName', item.paint_wear)})`
      }
    }
  }

  return {
    id: Number(item.id),
    hashName: hashName,
    customName: item.custom_name ? item.custom_name : undefined,
    rarity: rarities[item.rarity?.toString() || ''].index,
    quality: qualities[item.quality?.toString() || ''].index,
    imagePath: imagePath,
    price: prices[hashName || '']?.price,
    isStorageUnit: item.casket_contained_item_count !== undefined,
    tradable: item.tradable_after ? true : prices[hashName || '']?.price !== undefined ? true : false,
    containerId: item.casket_id ? item.casket_id : 0,
    float: item.paint_wear
  }
}

function readAttribute(item: GlobalOffensive.InventoryItem, defIndex: number): number | undefined {
  const attribute = item.attribute?.find((attr) => attr.def_index === defIndex)
  return attribute ? attribute.value_bytes.readUint32LE(0) : undefined
}

function getWearName(purpose: 'image' | 'hashName', wear: number): string | undefined {
  if (wear < 0.07) {
    switch (purpose) {
      case 'image':
        return 'light'
      case 'hashName':
        return 'Factory New'
    }
  } else if (wear < 0.15) {
    switch (purpose) {
      case 'image':
        return 'light'
      case 'hashName':
        return 'Minimal Wear'
    }
  } else if (wear < 0.38) {
    switch (purpose) {
      case 'image':
        return 'medium'
      case 'hashName':
        return 'Field-Tested'
    }
  } else if (wear < 0.45) {
    switch (purpose) {
      case 'image':
        return 'medium'
      case 'hashName':
        return 'Well-Worn'
    }
  } else if (wear >= 0.45) {
    switch (purpose) {
      case 'image':
        return 'heavy'
      case 'hashName':
        return 'Battle-Scarred'
    }
  }

  return undefined
}
