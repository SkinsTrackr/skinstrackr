import { ipcMain } from 'electron'
import SteamSession from '../steam-session'
import GlobalOffensive from 'globaloffensive'
import Semaphore from '../util/semaphore'
import { ConvertedItem, ConvertedInventory, RawInventory } from '@shared/interfaces/inventory.types'
import { convertInventoryItem, getQualities, getRarities } from '../util/item-utils'
import * as fs from 'fs'
import { pack, unpack } from 'msgpackr'

export function setupInventoryIPC(): void {
  /**
   * Load user's inventory
   * @param force Whether to force reload the inventory from Steam or use local cached version
   * @returns User's inventory items, including in containers (Excludes container contents)
   */
  ipcMain.handle('main:load-inventory', async (_event, force: boolean): Promise<ConvertedInventory> => {
    let rawInventory: RawInventory = { items: [], lastRefresh: 0 }
    const steamId = SteamSession.getInstance().getSteamId()

    if (!steamId) {
      throw new Error('No Steam user logged in or selected from cache')
    }
    if (force && SteamSession.getInstance().isLoggedIn() === false) {
      throw new Error('Log in before refreshing inventory')
    }

    // Get cached or "fresh" inventory
    if (!force) {
      if (!fs.existsSync(`./data/${steamId}_inventory.json`)) {
        throw new Error(`Need to login as user ${steamId} first to use cached inventory`)
      }

      console.log(`Loading cached inventory`)
      rawInventory = await loadInventoryFromFile(steamId)
    } else {
      if (!SteamSession.getInstance().isLoggedIn()) {
        throw new Error('Cannot refresh inventory without being logged in')
      }

      console.log(`Loading fresh inventory from Steam`)
      const csgo = SteamSession.getInstance().getCsgo()
      rawInventory.items = (csgo?.inventory ?? []).filter((item) => item.casket_id === undefined)

      const casketIds = rawInventory.items
        ?.filter((item) => item.casket_contained_item_count && item.id)
        .map((item) => item.id) as string[]
      rawInventory.items = rawInventory.items.concat(await loadAllContainers(casketIds))

      rawInventory.lastRefresh = Date.now()

      await saveInventoryToFile(rawInventory, steamId)
    }

    console.log(`Loaded inventory with ${rawInventory.items.length} items`)
    const convertedInventory: ConvertedItem[] = []
    const convertedContainers: Record<string, ConvertedItem[]> = {}
    for (const item of rawInventory.items) {
      // Item is in a container
      if (item.casket_id) {
        const casketId: string = item.casket_id as unknown as string
        if (!convertedContainers[casketId]) {
          convertedContainers[casketId] = []
        }

        convertedContainers[casketId].push(convertInventoryItem(item))
      }
      // Item not in a container
      else {
        convertedInventory.push(convertInventoryItem(item))

        // Item is a container (To register containers with 0 items)
        if (!convertedContainers[item.id || '']) {
          convertedContainers[item.id || ''] = []
        }
      }
    }

    // For testing
    // for (let i = 0; i < 900000; i++) {
    //   convertedInventory.push({
    //     id: `${i + 2000000}`,
    //     hashName: `Test ItemItemItemItemItemItemItem Item Item Item ItemItemItemItem ${i}`,
    //     rarity: '1',
    //     quality: '1',
    //     isStorageUnit: false,
    //     containerId: `${i + 1000000}`,
    //     tradable: true
    //   })
    // }

    return {
      inventoryItems: convertedInventory,
      containerItems: convertedContainers,
      lastRefresh: rawInventory.lastRefresh,
      qualities: getQualities(),
      rarities: getRarities()
    }
  })
}

async function loadAllContainers(casketIds: string[]): Promise<GlobalOffensive.InventoryItem[]> {
  console.log('Loading inventory with casket IDs:', casketIds)
  const threads = new Semaphore(3) // Max caskets open at a time is 11, but this is unstable so we lower it
  let allItems: GlobalOffensive.InventoryItem[] = []

  await Promise.all(
    casketIds.map(async (containerId) => {
      console.log(`Want to load container: ${containerId}`)
      await threads.acquire() // Wait for a permit before proceeding
      console.log('Aquired', containerId)
      try {
        const items = await loadContainer(containerId)
        allItems = allItems.concat(items)
        console.log(`Loaded container: ${containerId} with ${items.length} items`)
      } finally {
        console.log('Released', containerId)
        threads.release() // Release the permit after processing
      }
    })
  )

  return allItems
}

async function loadContainer(containerId: string): Promise<GlobalOffensive.InventoryItem[]> {
  const csgo = SteamSession.getInstance().getCsgo()!

  return new Promise((resolve, reject) => {
    csgo.getCasketContents(containerId, (err, items) => {
      if (err) {
        console.error(`Failed to load container ${containerId}:`, err)
        reject(err)
      } else {
        items = items.filter((item) => item.def_index !== null && item.def_index !== undefined && item.def_index !== 0)
        resolve(items)
      }
    })
  })
}

async function saveInventoryToFile(inventory: RawInventory, userId: string): Promise<void> {
  const encoded = pack(inventory)
  await fs.writeFileSync(`./data/${userId}_inventory.bin`, encoded)
  await fs.writeFileSync(`./data/${userId}_inventory.json`, JSON.stringify(inventory, null, 2), 'utf-8') // Just for testing TODO Remove
}

async function loadInventoryFromFile(userId: string): Promise<RawInventory> {
  const loaded = await fs.readFileSync(`./data/${userId}_inventory.bin`)
  const decoded = unpack(loaded) as RawInventory
  return decoded
}
