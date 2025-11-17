import { ipcMain } from 'electron'
import SteamSession from '../steam-session'
import GlobalOffensive from 'globaloffensive'
import Semaphore from '../util/semaphore'
import { ConvertedItem, Inventory } from '@shared/interfaces/inventory.types'
import { convertInventoryItem } from '../util/item-utils'
import * as fs from 'fs'
import { pack, unpack } from 'msgpackr'

export function setupInventoryIPC(): void {
  /**
   * Load user's inventory
   * @param force Whether to force reload the inventory from Steam or use local cached version
   * @returns User's inventory items, including in containers (Excludes container contents)
   */
  ipcMain.handle('main:load-inventory', async (_event, force: boolean): Promise<Inventory> => {
    let inventory: GlobalOffensive.InventoryItem[] = []

    // We want cached version
    if (!force && fs.existsSync('./data/inventory.bin')) {
      console.log(`Loading cached inventory`)
      inventory = await loadInventoryFromFile()
    } else {
      console.log(`Loading fresh inventory from Steam`)
      const csgo = SteamSession.getInstance().getCsgo()
      inventory = csgo?.inventory ?? []

      const casketIds = inventory
        ?.filter((item) => item.casket_contained_item_count && item.id)
        .map((item) => item.id) as string[]
      inventory = inventory.concat(await loadAllContainers(casketIds))

      await saveInventoryToFile(inventory)
    }

    console.log(`Loaded inventory with ${inventory.length} items`)
    const convertedInventory: ConvertedItem[] = []
    const convertedContainers: Record<string, ConvertedItem[]> = {}
    for (const item of inventory) {
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

    return { inventoryItems: convertedInventory, containerItems: convertedContainers }
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

async function saveInventoryToFile(inventory: GlobalOffensive.InventoryItem[]): Promise<void> {
  const encoded = pack(inventory)
  await fs.writeFileSync('./data/inventory.bin', encoded)
  await fs.writeFileSync('./data/inventory.json', JSON.stringify(inventory, null, 2), 'utf-8')
}

async function loadInventoryFromFile(): Promise<GlobalOffensive.InventoryItem[]> {
  const loaded = await fs.readFileSync('./data/inventory.bin')
  const decoded = unpack(loaded) as GlobalOffensive.InventoryItem[]
  return decoded
}
